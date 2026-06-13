import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { trimSeconds } from "@/lib/week";
import { computePrepaie } from "@/lib/prepaie";
import { holidaysInRange } from "@/lib/holidays";

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
    { data: org },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("last_name"),
    supabase
      .from("contracts")
      .select("employee_id, weekly_hours, hourly_rate, start_date")
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
    supabase
      .from("organizations")
      .select(
        "payroll_charge_rate, meal_allowance_enabled, meal_allowance_amount, night_start_hour, night_end_hour, night_premium_rate, sunday_premium_rate, holiday_premium_rate",
      )
      .eq("id", ctx.orgId)
      .single(),
  ]);

  const mealAmount =
    org?.meal_allowance_enabled ? Number(org.meal_allowance_amount) : 0;
  const chargeRate = Number(org?.payroll_charge_rate ?? 0);
  const nightRate = Number(org?.night_premium_rate ?? 0);
  const sundayRate = Number(org?.sunday_premium_rate ?? 0);
  const holidayRate = Number(org?.holiday_premium_rate ?? 0);

  // Contrat le plus récent par employé (heures hebdo + taux horaire).
  const contractHours = new Map<string, number>();
  const hourlyRate = new Map<string, number>();
  for (const c of contracts ?? []) {
    if (!contractHours.has(c.employee_id)) {
      contractHours.set(c.employee_id, Number(c.weekly_hours));
      hourlyRate.set(c.employee_id, Number(c.hourly_rate ?? 0));
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
    holidays: new Set(holidaysInRange(start, end).keys()),
    mealAmount,
    nightStartHour: Number(org?.night_start_hour ?? 21),
    nightEndHour: Number(org?.night_end_hour ?? 6),
    monthStart: start,
    monthEnd: end,
  });

  // ── Définition des colonnes, groupées par section ────────────────────────
  // Chaque colonne : libellé, section (pour la couleur), accès à la valeur.
  type Section =
    | "id"
    | "work"
    | "overtime"
    | "premium"
    | "absence"
    | "payroll";
  type Col = {
    header: string;
    section: Section;
    width: number;
    value: (r: (typeof rows)[number]) => string | number;
  };

  const columns: Col[] = [
    { header: "Nom", section: "id", width: 22, value: (r) => r.name },
    {
      header: "Jours\ntravaillés",
      section: "work",
      width: 11,
      value: (r) => r.workedDays,
    },
    {
      header: "Heures\ntravaillées",
      section: "work",
      width: 12,
      value: (r) => r.workedHours,
    },
    ...weeks.map(
      (w): Col => ({
        header: `S${w}\nh. supp`,
        section: "overtime",
        width: 9,
        value: (r) => r.overtimeByWeek[w] ?? 0,
      }),
    ),
    {
      header: "Total\nh. supp",
      section: "overtime",
      width: 10,
      value: (r) => r.overtimeTotal,
    },
    {
      header: "Jours\nfériés",
      section: "absence",
      width: 9,
      value: (r) => r.holidaysWorked,
    },
    ...absenceTypes.map(
      (t): Col => ({
        header: t,
        section: "absence",
        width: 14,
        value: (r) => r.absencesByType[t] ?? 0,
      }),
    ),
  ];

  // Heures majorées (n'apparaissent que si le taux correspondant est défini).
  if (nightRate > 0) {
    columns.push({
      header: `H. nuit\n(+${nightRate}%)`,
      section: "premium",
      width: 10,
      value: (r) => r.nightHours,
    });
  }
  if (sundayRate > 0) {
    columns.push({
      header: `H. dim.\n(+${sundayRate}%)`,
      section: "premium",
      width: 10,
      value: (r) => r.sundayHours,
    });
  }
  if (holidayRate > 0) {
    columns.push({
      header: `H. fériés\n(+${holidayRate}%)`,
      section: "premium",
      width: 10,
      value: (r) => r.holidayHours,
    });
  }

  // Colonnes de pré-paie (n'apparaissent que si activées dans les réglages).
  if (mealAmount > 0) {
    columns.push({
      header: "Indemnités\nrepas (€)",
      section: "payroll",
      width: 12,
      value: (r) => r.mealAllowance,
    });
  }
  // Coût chargé estimé par employé = heures × taux horaire × (1 + charges%).
  // Disponible uniquement pour les employés ayant un taux horaire au contrat.
  const hasAnyRate = [...hourlyRate.values()].some((r) => r > 0);
  if (chargeRate > 0 && hasAnyRate) {
    const costByEmp = new Map<string, number>();
    (employees ?? []).forEach((e, i) => {
      const rate = hourlyRate.get(e.id) ?? 0;
      const hrs = rows[i]?.workedHours ?? 0;
      costByEmp.set(
        e.id,
        Math.round(hrs * rate * (1 + chargeRate / 100) * 100) / 100,
      );
    });
    // On indexe par nom de ligne (rows et employees partagent l'ordre).
    const costByIndex = (employees ?? []).map((e) => costByEmp.get(e.id) ?? 0);
    columns.push({
      header: `Coût chargé\n(+${chargeRate}%)`,
      section: "payroll",
      width: 14,
      value: (r) => {
        const idx = rows.indexOf(r);
        return idx >= 0 ? costByIndex[idx] : 0;
      },
    });
  }

  const filenameBase = `prepaie_${location.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}_${label}`;

  // ── Export Excel stylé (ExcelJS) ─────────────────────────────────────────
  if (format === "xlsx") {
    const { default: ExcelJS } = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Pré-paie", {
      views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
    });

    // Couleurs par section (ARGB).
    const sectionFill: Record<Section, string> = {
      id: "FF334155", // ardoise foncée
      work: "FF059669", // émeraude
      overtime: "FFF59E0B", // ambre
      premium: "FF8B5CF6", // violet (majorations)
      absence: "FF6366F1", // indigo
      payroll: "FFDC2626", // rouge (paie)
    };
    const sectionLabel: Record<Section, string> = {
      id: "",
      work: "TRAVAIL",
      overtime: "HEURES SUPP.",
      premium: "HEURES MAJORÉES",
      absence: "ABSENCES (jours)",
      payroll: "PRÉ-PAIE (€)",
    };

    ws.columns = columns.map((c) => ({ width: c.width }));

    // Ligne 1 : bandeaux de section (fusionnés).
    const sectionRow = ws.getRow(1);
    sectionRow.height = 20;
    let col = 1;
    while (col <= columns.length) {
      const sec = columns[col - 1].section;
      let span = 1;
      while (col + span <= columns.length && columns[col - 1 + span].section === sec)
        span++;
      const cell = sectionRow.getCell(col);
      cell.value = sectionLabel[sec];
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: sectionFill[sec] },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (span > 1) ws.mergeCells(1, col, 1, col + span - 1);
      col += span;
    }

    // Ligne 2 : en-têtes de colonnes.
    const headerRow = ws.getRow(2);
    headerRow.height = 30;
    columns.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: "FF1E293B" }, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      cell.alignment = {
        horizontal: c.section === "id" ? "left" : "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
    });

    // Lignes de données (avec zébrage).
    rows.forEach((r, idx) => {
      const row = ws.getRow(idx + 3);
      row.height = 18;
      columns.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        cell.value = c.value(r);
        cell.alignment = {
          horizontal: c.section === "id" ? "left" : "center",
          vertical: "middle",
        };
        if (c.section === "id") cell.font = { bold: true, size: 10 };
        else cell.font = { size: 10 };
        if (idx % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
        cell.border = {
          bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
          right: { style: "hair", color: { argb: "FFE2E8F0" } },
        };
        // Met en évidence les valeurs non nulles d'heures supp / absences.
        if (
          (c.section === "overtime" || c.section === "absence") &&
          typeof cell.value === "number" &&
          cell.value > 0
        ) {
          cell.font = { size: 10, bold: true, color: { argb: "FF0F172A" } };
        }
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  // ── Export CSV ───────────────────────────────────────────────────────────
  const headers = columns.map((c) => c.header.replace(/\n/g, " "));
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(";"),
    ...rows.map((r) => columns.map((c) => escape(c.value(r))).join(";")),
  ].join("\r\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}
