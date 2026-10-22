// Lectura de secciones y semanas desde Supabase (solo en el servidor).
//
// Se usa desde Server Components: la consulta corre en el servidor de
// Vercel y al navegador solo llega el HTML ya armado.

import { createClient } from "@/lib/supabase/server";
import type { Day } from "@/lib/types";
import { toDays, type DayRow } from "./board-mapper";

export interface Section {
  id: string;
  name: string;
  slug: string;
  columnCount: number;
}

/** Busca una sección por su slug ("performance"). Devuelve null si no existe. */
export async function getSection(slug: string): Promise<Section | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("id, name, slug, column_count")
    .eq("slug", slug)
    .maybeSingle(); // maybeSingle: 0 filas → null (single() tiraría error)

  if (error) throw new Error(`No se pudo leer la sección: ${error.message}`);
  if (!data) return null;

  return { id: data.id, name: data.name, slug: data.slug, columnCount: data.column_count };
}

/**
 * Días (con bloques y ejercicios) de una semana de una sección.
 * Devuelve null si esa semana todavía no se creó.
 */
export async function getWeekDays(sectionId: string, weekStart: string): Promise<Day[] | null> {
  const supabase = await createClient();

  // Un solo pedido trae todo el árbol: Supabase sigue las foreign keys.
  // Cada nombre dentro de los paréntesis es una tabla relacionada:
  //   weeks → days → blocks → block_exercises → exercises (para el nombre).
  const { data, error } = await supabase
    .from("weeks")
    .select(
      `id,
       days (
         id, position, label,
         blocks (
           position, kind, rounds, rounds_suffix, rest, note, prescription_override,
           block_exercises ( position, reps, note, exercises ( name ) )
         )
       )`,
    )
    .eq("section_id", sectionId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la semana: ${error.message}`);
  if (!data) return null;

  // Sin tipos generados de la base, TypeScript no conoce la forma de `data`;
  // le decimos cuál es (coincide con el select de arriba).
  return toDays(data.days as unknown as DayRow[]);
}
