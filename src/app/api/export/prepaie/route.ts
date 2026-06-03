import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { trimSeconds } from "@/lib/week";
import { computePrepaie } from "@/lib/prepaie";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

function monthBounds(monthParam: string | null): {
  start: string;
  end: string;
  label: string;
} {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    start: iso(first),
    end: iso(last),
    label: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
}

/**
 * Export de pré-paie mensuelle par employé.
 * Query : ?site=<id>&month=YYYY-MM&format=csv|xlsx
 */
export async function GET(request: NextRequest) {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const siteParam = searchParams.get("site");
  const { start, end, label } = monthBounds(searchParams.get("month"));

  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("created_at", { ascending: true });
  const location = locations?.find((l) => l.id === siteParam) ?? locations?.[0];
  if (!location) return new NextResponse("Aucun établissement", { status: 404 });

  const [
    { data: employees },
    { data: contracts },
    { data: shiftRows },
    { data: absRows },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("last_name"),
    supabase
      .from("contracts")
      .select("employee_id, weekly_hours, start_date")
      .order("start_date", { ascending: false }),
    supabase
      .from("shifts")
      .select(
        "employee_id, shift_date, start_time, end_time, break_minutes, schedules!inner(location_id)",
      )
      .gte("shift_date", start)
      .lte("shift_date", end)
      .eq("schedules.location_id", location.id),
    supabase
      .from("absence_requests")
      .select("employee_id, start_date, end_date, absence_types(name)")
      .eq("status", "approved")
      .lte("start_date", end)
      .gte("end_date", start),
  ]);

  // Contrat le plus récent par employé.
  const contractHours = new Map<string, number>();
  for (const c of contracts ?? []) {
    if (!contractHours.has(c.employee_id)) {
      contractHours.set(c.employee_id, Number(c.weekly_hours));
    }
  }

  const { rows, weeks, absenceTypes } = computePrepaie({
    employees: employees ?? [],
    contractHours,
    shifts: (shiftRows ?? []).map((s) => ({
      employee_id: s.employee_id,
      shift_date: s.shift_date,
      start_time: trimSeconds(s.start_time),
      end_time: trimSeconds(s.end_time),
      break_minutes: s.break_minutes,
    })),
    absences: (absRows ?? []).map((a) => ({
      employee_id: a.employee_id,
      type_name: a.absence_types?.name ?? "Absence",
      start_date: a.start_date,
      end_date: a.end_date,
    })),
    monthStart: start,
    monthEnd: end,
  });

  // Construction des lignes "plates" avec colonnes dynamiques.
  const flat = rows.map((r) => {
    const obj: Record<string, string | number> = {
      Nom: r.name,
      "Jours travaillés": r.workedDays,
      "Heures travaillées": r.workedHours,
    };
    for (const w of weeks) {
      obj[`S${w} (heures supp)`] = r.overtimeByWeek[w] ?? 0;
    }
    obj["Heures supp (total)"] = r.overtimeTotal;
    for (const t of absenceTypes) {
      obj[t] = r.absencesByType[t] ?? 0;
    }
    return obj;
  });

  const filenameBase = `prepaie_${location.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}_${label}`;

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pré-paie");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  const headers = Object.keys(flat[0] ?? { Nom: "" });
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(";"),
    ...flat.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ].join("\r\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}
