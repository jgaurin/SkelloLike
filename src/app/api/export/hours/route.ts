import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { shiftHours, getMonday, weekDates, trimSeconds } from "@/lib/week";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

type Row = {
  Employé: string;
  Établissement: string;
  "Heures planifiées": number;
  "Nb de shifts": number;
};

/**
 * Export des heures planifiées par employé sur la semaine demandée.
 * Query : ?site=<id>&week=<YYYY-MM-DD>&format=csv|xlsx
 */
export async function GET(request: NextRequest) {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const siteParam = searchParams.get("site");
  const week = searchParams.get("week")
    ? getMonday(new Date(searchParams.get("week")!))
    : getMonday();

  const supabase = await createClient();

  // Établissement (vérifié dans l'org via RLS + filtre explicite).
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("created_at", { ascending: true });

  const location =
    locations?.find((l) => l.id === siteParam) ?? locations?.[0];
  if (!location) {
    return new NextResponse("Aucun établissement", { status: 404 });
  }

  const days = weekDates(week);

  const [{ data: employees }, { data: shiftRows }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("last_name"),
    supabase
      .from("shifts")
      .select(
        "employee_id, start_time, end_time, break_minutes, shift_date, schedules!inner(location_id)",
      )
      .gte("shift_date", days[0])
      .lte("shift_date", days[6])
      .eq("schedules.location_id", location.id),
  ]);

  // Agrégation des heures par employé.
  const agg = new Map<string, { hours: number; count: number }>();
  for (const s of shiftRows ?? []) {
    if (!s.employee_id) continue;
    const h = shiftHours(
      trimSeconds(s.start_time),
      trimSeconds(s.end_time),
      s.break_minutes,
    );
    const cur = agg.get(s.employee_id) ?? { hours: 0, count: 0 };
    cur.hours += h;
    cur.count += 1;
    agg.set(s.employee_id, cur);
  }

  const rows: Row[] = (employees ?? []).map((e) => {
    const a = agg.get(e.id) ?? { hours: 0, count: 0 };
    return {
      Employé: `${e.first_name} ${e.last_name}`,
      Établissement: location.name,
      "Heures planifiées": Math.round(a.hours * 100) / 100,
      "Nb de shifts": a.count,
    };
  });

  const filenameBase = `heures_${location.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}_${week}`;

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Heures");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  // CSV (séparateur ';' pour Excel FR, BOM pour les accents).
  const headers = Object.keys(rows[0] ?? { Employé: "" });
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => escape(r[h as keyof Row])).join(";"),
    ),
  ].join("\r\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}
