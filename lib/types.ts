// Tipos del dominio, tal como los usa la app (en camelCase).
//
// La base de datos usa snake_case (rounds_suffix, prescription_override…);
// la conversión entre una forma y la otra se hace en un solo lugar cuando
// leemos/escribimos en Supabase (etapa 3), así el resto del código solo
// conoce estos tipos.

/** "warmup" = bloque E/C (entrada en calor). "main" = bloques A, B, C… */
export type BlockKind = "warmup" | "main";

/** Un renglón dentro del corchete de un bloque. */
export interface BlockExercise {
  /** Nombre tal como está en la biblioteca: "H.P. Clean". */
  name: string;
  /** Texto libre: "20", "10/10", "30''", "10x20'' c/l", "4-2-1". */
  reps: string | null;
  /** Texto libre: "alter", "(3:1)", "con camino". */
  note: string | null;
}

/** Un bloque del día: E/C, A, B… con sus ejercicios y su prescripción. */
export interface Block {
  kind: BlockKind;
  /** Cantidad de rondas/series: 3 → "x 3R". */
  rounds: number | null;
  /** Lo que va pegado a las rondas: "R" ("x 3R") o "" ("x 3"). */
  roundsSuffix: string;
  /** Pausa: "1'", "1'30''", "s/P" (sin pausa). */
  rest: string | null;
  /** Nota libre del bloque: "(liviano)". */
  note: string | null;
  /** Si tiene texto, se muestra tal cual en lugar de rondas + pausa + nota. */
  prescriptionOverride: string | null;
  exercises: BlockExercise[];
}

/** Una columna del pizarrón. */
export interface Day {
  /** 0, 1, 2… (orden de la columna). */
  position: number;
  /** Etiqueta opcional ("Lun/Jue"); si es null se muestra "Día N". */
  label: string | null;
  blocks: Block[];
}
