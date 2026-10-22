"use server";

// Server Actions del planificador: las llama el editor desde el navegador y
// corren en el servidor, con la sesión del coach (las cookies).
//
// La seguridad no depende de este archivo: si alguien que no es coach llama
// a estas acciones, la base rechaza el cambio (RLS + chequeo en las funciones SQL).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toSavePayload } from "@/lib/data/board-mapper";
import { isMonday, isValidIsoDate } from "@/lib/dates";
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
