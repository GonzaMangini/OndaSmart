// Pizarrón: dibuja los días de una semana como la pizarra blanca del gimnasio.
//
//   PECHO + TRÍCEPS                    ← título del día (rojo, subrayado)
//   E/C: 3 Rounds c/2' P               ← encabezado del bloque (azul, subrayado)
//   "T" c/DB's      ] 12
//   Plancha alta    ] 30''
//   Ⓐ 4 Rounds c/2' P
//   Pecho plano     ] 1 a 2   MUY PESADO!!!   ← nota del bloque (rojo)
//
// Es un componente "puro": recibe datos y los muestra. No lee la base, no
// sabe si hay alguien logueado y no tiene estado. Por eso lo usan tanto la
// vista previa del coach como la TV.
//
// El texto del encabezado sale de lib/notation.ts. Los colores (board-*) y la
// letra de marcador (font-marker) están definidos en app/globals.css.

import type { CSSProperties } from "react";
import { blockLabels, dayTitle, formatBlockHeading } from "@/lib/notation";
import type { Block, Day } from "@/lib/types";

/**
 * "responsive": vista previa. En celular las columnas van una debajo de la
 *   otra; desde pantallas grandes (lg), lado a lado. Las letras crecen con la pantalla.
 * "tv": columnas siempre lado a lado y tamaños fijos, pensados para un lienzo
 *   de 1920 px de ancho que después se escala a la tele (ver components/tv/FitToScreen.tsx).
 */
type Variant = "responsive" | "tv";

// Clases que cambian según la variante, todas en un solo lugar.
const STYLES: Record<Variant, Record<string, string>> = {
  responsive: {
    grid: "grid-cols-1 gap-4 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:gap-0 lg:divide-x-[10px] lg:divide-board-tape lg:overflow-hidden lg:rounded-lg lg:bg-board-bg",
    column: "rounded-lg px-5 py-5 lg:rounded-none lg:px-7 lg:py-6",
    title: "text-2xl lg:text-3xl 2xl:text-4xl",
    blocks: "gap-5 lg:gap-6 2xl:gap-8",
    heading: "text-xl lg:text-2xl 2xl:text-3xl",
    circle: "size-9 text-lg lg:size-10 lg:text-xl 2xl:size-12 2xl:text-2xl",
    text: "text-lg lg:text-xl 2xl:text-2xl",
    small: "text-base lg:text-lg",
  },
  tv: {
    grid: "grid-cols-[repeat(var(--cols),minmax(0,1fr))] divide-x-[10px] divide-board-tape overflow-hidden rounded-lg bg-board-bg",
    column: "px-8 py-7",
    title: "text-4xl",
    blocks: "gap-7",
    heading: "text-3xl",
    circle: "size-12 text-2xl",
    text: "text-2xl",
    small: "text-lg",
  },
};

interface BoardViewProps {
  days: Day[];
  variant?: Variant;
  /** Clases extra para el contenedor (por ejemplo, flex-1 para que ocupe el alto disponible). */
  className?: string;
}

export function BoardView({ days, variant = "responsive", className = "" }: BoardViewProps) {
  const styles = STYLES[variant];

  return (
    // La cantidad de columnas llega como variable CSS (--cols) porque Tailwind
    // no puede generar clases a partir de valores que solo se conocen al ejecutar.
    <div
      className={`grid font-marker text-board-ink ${styles.grid} ${className}`}
      style={{ "--cols": days.length } as CSSProperties}
    >
      {days.map((day) => (
        <DayColumn key={day.id} day={day} styles={styles} />
      ))}
    </div>
  );
}

type Styles = (typeof STYLES)[Variant];

function DayColumn({ day, styles }: { day: Day; styles: Styles }) {
  const labels = blockLabels(day.blocks);

  return (
    <section className={`bg-board-bg ${styles.column}`}>
      <h2
        className={`mb-5 uppercase tracking-wide text-board-red underline decoration-2 underline-offset-[6px] ${styles.title}`}
      >
        {dayTitle(day)}
      </h2>

      {day.blocks.length === 0 ? (
        <p className={`text-board-ink/40 ${styles.text}`}>Sin bloques cargados.</p>
      ) : (
        <ol className={`flex flex-col ${styles.blocks}`}>
          {day.blocks.map((block, index) => (
            <li key={index}>
              <BlockRow block={block} label={labels[index]} styles={styles} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BlockRow({ block, label, styles }: { block: Block; label: string; styles: Styles }) {
  const heading = formatBlockHeading(block);
  const isWarmup = block.kind === "warmup";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Encabezado: letra (o "E/C:") + rondas y pausa, en azul y subrayado */}
      <div className={`flex items-center gap-2.5 text-board-blue ${styles.heading}`}>
        {isWarmup ? (
          <span>E/C:</span>
        ) : (
          <span
            className={`flex shrink-0 items-center justify-center rounded-full border-[2.5px] border-board-blue leading-none ${styles.circle}`}
          >
            {label}
          </span>
        )}
        {heading && <span className="underline decoration-2 underline-offset-[6px]">{heading}</span>}
      </div>

      {block.exercises.length > 0 && <ExerciseList block={block} styles={styles} />}
    </div>
  );
}

/** Ejercicios con su corchete y reps; a la derecha, la nota del bloque en rojo. */
function ExerciseList({ block, styles }: { block: Block; styles: Styles }) {
  const note = block.note?.trim();

  return (
    <div className={`flex items-center gap-4 ${styles.text}`}>
      {/*
        Grilla de 3 columnas: nombres | corchete | reps.
        La primera columna mide lo que el nombre más largo ("auto"), así el
        corchete queda pegado a los nombres como en el pizarrón. El corchete
        ocupa todas las filas (gridRow: span N) para abrazar a todo el bloque.
      */}
      <div className="grid min-w-0 grid-cols-[minmax(0,auto)_0.6rem_auto] items-center gap-x-2.5 gap-y-1">
        {block.exercises.map((exercise, i) => (
          <div key={i} className="contents">
            <span className="leading-snug" style={{ gridColumn: 1, gridRow: i + 1 }}>
              {exercise.name}
              {/* Nota del ejercicio ("alter", "(3:1)"): más chica y en rojo. */}
              {exercise.note && <span className={`ml-2 text-board-red ${styles.small}`}>{exercise.note}</span>}
            </span>
            <span className="whitespace-nowrap tabular-nums" style={{ gridColumn: 3, gridRow: i + 1 }}>
              {exercise.reps}
            </span>
          </div>
        ))}

        {/* El corchete: borde arriba, abajo y a la derecha, en "marcador" negro. */}
        <span
          aria-hidden
          className="h-full min-h-7 self-stretch rounded-r-[3px] border-y-[2.5px] border-r-[2.5px] border-board-ink"
          style={{ gridColumn: 2, gridRow: `1 / span ${block.exercises.length}` }}
        />
      </div>

      {note && <span className="max-w-[40%] uppercase leading-tight text-board-red -rotate-3">{note}</span>}
    </div>
  );
}
