"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { weekDates } from "@/lib/week";

export type TemplateResult = { ok: boolean; error?: string; count?: number };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

function canManage(role: string) {
  return MANAGER_ROLES.includes(role);
}

type DB = Awaited<ReturnType<typeof createClient>>;

async function assertLocationInOrg(
  supabase: DB,
  locationId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

async function ensureSchedule(
  supabase: DB,
  locationId: string,
  weekStart: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("schedules")
    .select("id")
    .eq("location_id", locationId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("schedules")
    .insert({ location_id: locationId, week_start: weekStart, status: "draft" })
    .select("id")
    .single();
  return created?.id ?? null;
}

/**
 * Copie tous les shifts d'une semaine source vers une semaine cible (même
 * établissement). Les shifts existants de la cible sont remplacés.
 */
export async function copyWeek(
  locationId: string,
  sourceWeek: string,
  targetWeek: string,
): Promise<TemplateResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  if (sourceWeek === targetWeek) {
    return { ok: false, error: "Choisissez une semaine cible différente." };
  }

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  // Planning source.
  const { data: src } = await supabase
    .from("schedules")
    .select("id")
    .eq("location_id", locationId)
    .eq("week_start", sourceWeek)
    .maybeSingle();
  if (!src) return { ok: false, error: "Semaine source vide." };

  const { data: srcShifts } = await supabase
    .from("shifts")
    .select(
      "employee_id, position_id, shift_date, start_time, end_time, break_minutes, note_manager",
    )
    .eq("schedule_id", src.id);

  if (!srcShifts?.length) {
    return { ok: false, error: "Aucun shift à copier sur la semaine source." };
  }

  // Planning cible (créé si besoin), shifts existants supprimés.
  const targetId = await ensureSchedule(supabase, locationId, targetWeek);
  if (!targetId) return { ok: false, error: "Préparation de la cible impossible." };
  await supabase.from("shifts").delete().eq("schedule_id", targetId);

  // Décalage en jours entre les deux lundis.
  const srcDays = weekDates(sourceWeek);
  const tgtDays = weekDates(targetWeek);
  const dayMap = new Map(srcDays.map((d, i) => [d, tgtDays[i]]));

  const rows = srcShifts.map((s) => ({
    schedule_id: targetId,
    employee_id: s.employee_id,
    position_id: s.position_id,
    shift_date: dayMap.get(s.shift_date) ?? s.shift_date,
    start_time: s.start_time,
    end_time: s.end_time,
    break_minutes: s.break_minutes,
    note_manager: s.note_manager,
    status: "draft" as const,
  }));

  const { error } = await supabase.from("shifts").insert(rows);
  if (error) return { ok: false, error: "Copie impossible." };

  revalidatePath("/planning");
  return { ok: true, count: rows.length };
}

/**
 * Enregistre les shifts d'une semaine comme modèle réutilisable.
 */
export async function saveWeekAsTemplate(
  locationId: string,
  weekStart: string,
  name: string,
): Promise<TemplateResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  if (!name.trim()) return { ok: false, error: "Donnez un nom au modèle." };

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  const { data: sched } = await supabase
    .from("schedules")
    .select("id")
    .eq("location_id", locationId)
    .eq("week_start", weekStart)
    .maybeSingle();

  const { data: shifts } = sched
    ? await supabase
        .from("shifts")
        .select(
          "employee_id, position_id, shift_date, start_time, end_time, break_minutes",
        )
        .eq("schedule_id", sched.id)
    : { data: [] };

  if (!shifts?.length) {
    return { ok: false, error: "La semaine ne contient aucun shift." };
  }

  const { data: tpl, error: tplErr } = await supabase
    .from("schedule_templates")
    .insert({ location_id: locationId, name: name.trim(), created_by: ctx.userId })
    .select("id")
    .single();
  if (tplErr || !tpl) return { ok: false, error: "Création du modèle impossible." };

  const weekStartDays = weekDates(weekStart);
  const dayIndex = new Map(weekStartDays.map((d, i) => [d, i]));

  const rows = shifts.map((s) => ({
    template_id: tpl.id,
    day_of_week: dayIndex.get(s.shift_date) ?? 0,
    employee_id: s.employee_id,
    position_id: s.position_id,
    start_time: s.start_time,
    end_time: s.end_time,
    break_minutes: s.break_minutes,
  }));

  const { error } = await supabase.from("template_shifts").insert(rows);
  if (error) return { ok: false, error: "Enregistrement du modèle impossible." };

  revalidatePath("/planning");
  return { ok: true, count: rows.length };
}

/**
 * Applique un modèle à une semaine (remplace les shifts existants).
 */
export async function applyTemplate(
  locationId: string,
  weekStart: string,
  templateId: string,
): Promise<TemplateResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  const { data: tplShifts } = await supabase
    .from("template_shifts")
    .select(
      "day_of_week, employee_id, position_id, start_time, end_time, break_minutes",
    )
    .eq("template_id", templateId);

  if (!tplShifts?.length) {
    return { ok: false, error: "Ce modèle est vide." };
  }

  const targetId = await ensureSchedule(supabase, locationId, weekStart);
  if (!targetId) return { ok: false, error: "Préparation impossible." };
  await supabase.from("shifts").delete().eq("schedule_id", targetId);

  const days = weekDates(weekStart);
  const rows = tplShifts.map((s) => ({
    schedule_id: targetId,
    employee_id: s.employee_id,
    position_id: s.position_id,
    shift_date: days[Math.min(6, Math.max(0, s.day_of_week))],
    start_time: s.start_time,
    end_time: s.end_time,
    break_minutes: s.break_minutes,
    status: "draft" as const,
  }));

  const { error } = await supabase.from("shifts").insert(rows);
  if (error) return { ok: false, error: "Application impossible." };

  revalidatePath("/planning");
  return { ok: true, count: rows.length };
}

/**
 * Supprime un modèle.
 */
export async function deleteTemplate(
  templateId: string,
): Promise<TemplateResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_templates")
    .delete()
    .eq("id", templateId);
  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/planning");
  return { ok: true };
}
