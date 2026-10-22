"use server";

// Server Actions del planificador: las llama el editor desde el navegador y
// corren en el servidor, con la sesión del coach (las cookies).
//
// La seguridad no depende de este archivo: si alguien que no es coach llama
// a estas acciones, la base rechaza el cambio (RLS + chequeo en las funciones SQL).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toSavePayload } from "@/lib/data/board-mapper";
import { currentMonday, isMonday, isValidIsoDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Block } from "@/lib/types";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Guarda todos los bloques de un día (reemplaza lo que había). La usa el autoguardado. */
export async function saveDay(dayId: string, blocks: Block[]): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_day", {
    p_day_id: dayId,
    p_blocks: toSavePayload(blocks),
  });

  if (error) {
    // El detalle va al log del servidor (Vercel → Logs); al coach, un mensaje simple.
    console.error("save_day falló:", error);
    return { ok: false, error: "No se pudo guardar. Revisá la conexión." };
  }
  return { ok: true };
}

/** Guarda el título de un día ("Pecho + Tríceps"). Vacío = sin título ("Día N"). */
export async function saveDayLabel(dayId: string, label: string): Promise<SaveResult> {
  const value = label.trim().slice(0, 60) || null;

  const supabase = await createClient();
  // .select() devuelve las filas cambiadas: si RLS no dejó cambiar nada,
  // vuelve vacío en vez de dar error, y así nos damos cuenta.
  const { data, error } = await supabase.from("days").update({ label: value }).eq("id", dayId).select("id");

  if (error || data.length === 0) {
    console.error("saveDayLabel falló:", error);
    return { ok: false, error: "No se pudo guardar el título." };
  }
  return { ok: true };
}

/** Crea una semana vacía (con sus días) y recarga la página del editor. */
export async function createWeek(sectionSlug: string, weekStart: string) {
  if (!isValidIsoDate(weekStart) || !isMonday(weekStart)) {
    throw new Error("Fecha de semana inválida");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_week", {
    p_section_slug: sectionSlug,
    p_week_start: weekStart,
  });
  if (error) throw new Error(`No se pudo crear la semana: ${error.message}`);

  // Le avisamos a Next.js que esta página cambió, para que no muestre una versión vieja.
  const path = `/plan/${sectionSlug}/${weekStart}`;
  revalidatePath(path);
  redirect(path);
}

// --- Pantallas (secciones) --------------------------------------------------

export type SectionFormState = { error: string | null };

const MAX_SECTION_NAME = 40;

/** Valida el nombre de una pantalla. Devuelve el nombre limpio o un mensaje de error. */
function validateSectionName(raw: FormDataEntryValue | null): { name: string } | { error: string } {
  const name = String(raw ?? "").trim();
  if (!name) return { error: "Escribí un nombre." };
  if (name.length > MAX_SECTION_NAME) return { error: `Máximo ${MAX_SECTION_NAME} caracteres.` };
  return { name };
}

/**
 * Crea una pantalla nueva y lleva a su editor.
 * Se usa con useActionState (por eso recibe el estado anterior y un FormData).
 */
export async function createSection(_prev: SectionFormState, formData: FormData): Promise<SectionFormState> {
  const validated = validateSectionName(formData.get("name"));
  if ("error" in validated) return validated;

  const columns = Number(formData.get("columns"));
  if (!Number.isInteger(columns) || columns < 1 || columns > 7) {
    return { error: "Elegí entre 1 y 7 columnas." };
  }

  // Si estaba mirando una semana, abrimos esa misma semana en la pantalla nueva.
  const week = String(formData.get("week") ?? "");
  const targetWeek = isValidIsoDate(week) && isMonday(week) ? week : currentMonday();

  const supabase = await createClient();
  const { data: slug, error } = await supabase.rpc("create_section", {
    p_name: validated.name,
    p_column_count: columns,
  });
  if (error) {
    console.error("create_section falló:", error);
    return { error: "No se pudo crear la pantalla." };
  }

  // "layout": refresca todas las páginas bajo /plan (todas muestran las pestañas).
  revalidatePath("/plan", "layout");
  redirect(`/plan/${slug}/${targetWeek}`);
}

/** Cambia el nombre visible de una pantalla. El slug (la URL) no cambia. */
export async function renameSection(sectionId: string, rawName: string): Promise<SaveResult> {
  const validated = validateSectionName(rawName);
  if ("error" in validated) return { ok: false, error: validated.error };

  const supabase = await createClient();
  // .select() hace que Supabase devuelva las filas cambiadas: si RLS no dejó
  // cambiar nada, vuelve vacío en vez de dar error, y así nos damos cuenta.
  const { data, error } = await supabase
    .from("sections")
    .update({ name: validated.name })
    .eq("id", sectionId)
    .select("id");

  if (error || data.length === 0) {
    console.error("renameSection falló:", error);
    return { ok: false, error: "No se pudo renombrar." };
  }

  revalidatePath("/plan", "layout");
  return { ok: true };
}

/** Borra una pantalla CON todas sus semanas y rutinas (en cascada). */
export async function deleteSection(sectionId: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sections").delete().eq("id", sectionId).select("id");

  if (error || data.length === 0) {
    console.error("deleteSection falló:", error);
    return { ok: false, error: "No se pudo eliminar la pantalla." };
  }

  revalidatePath("/plan", "layout");
  redirect("/plan");
}
