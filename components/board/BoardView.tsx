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
// sabe si hay alguien logueado y no tiene estado. Por eso lo pueden usar
// tanto la vista previa del coach como (más adelante) la TV.
//
// El texto del encabezado sale de lib/notation.ts. Los colores (board-*) y la
// letra de marcador (font-marker) están definidos en app/globals.css.

import type { CSSProperties } from "react";
import { blockLabels, dayTitle, formatBlockHeading } from "@/lib/notation";
import type { Block, Day } from "@/lib/types";

interface BoardViewProps {
  days: Day[];
}

export function BoardView({ days }: BoardViewProps) {
  return (
    // En celular las columnas van una debajo de la otra, cada una como una
    // pizarra. Desde pantallas grandes (lg) van lado a lado sobre una sola
    // pizarra, separadas por "cinta negra" (divide-x). La cantidad de columnas
    // llega como variable CSS (--cols) porque Tailwind no puede generar clases
    // a partir de valores que solo se conocen al ejecutar.
    <div
      className="grid grid-cols-1 gap-4 font-marker text-board-ink lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:gap-0 lg:divide-x-[10px] lg:divide-board-tape lg:overflow-hidden lg:rounded-lg lg:bg-board-bg lg:shadow-[0_0_0_10px_var(--board-tape)]"
      style={{ "--cols": days.length } as CSSProperties}
    >
      {days.map((day) => (
        <DayColumn key={day.id} day={day} />
      ))}
    </div>
  );
}

function DayColumn({ day }: { day: Day }) {
  const labels = blockLabels(day.blocks);

  return (
    <section className="rounded-lg bg-board-bg px-5 py-5 lg:rounded-none lg:px-7 lg:py-6">
      <h2 className="mb-5 text-2xl uppercase tracking-wide text-board-red underline decoration-2 underline-offset-[6px] lg:text-3xl 2xl:text-4xl">
        {dayTitle(day)}
      </h2>

      {day.blocks.length === 0 ? (
        <p className="text-lg text-board-ink/40">Sin bloques cargados.</p>
      ) : (
        <ol className="flex flex-col gap-5 lg:gap-6 2xl:gap-8">
          {day.blocks.map((block, index) => (
            <li key={index}>
              <BlockRow block={block} label={labels[index]} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BlockRow({ block, label }: { block: Block; label: string }) {
  const heading = formatBlockHeading(block);
  const isWarmup = block.kind === "warmup";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Encabezado: letra (o "E/C:") + rondas y pausa, en azul y subrayado */}
      <div className="flex items-center gap-2.5 text-board-blue">
        {isWarmup ? (
          <span className="text-xl lg:text-2xl 2xl:text-3xl">E/C:</span>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-[2.5px] border-board-blue text-lg leading-none lg:size-10 lg:text-xl 2xl:size-12 2xl:text-2xl">
            {label}
          </span>
        )}
        {heading && (
          <span className="text-xl underline decoration-2 underline-offset-[6px] lg:text-2xl 2xl:text-3xl">
            {heading}
          </span>
        )}
      </div>

      {block.exercises.length > 0 && <ExerciseList block={block} />}
    </div>
  );
}

/** Ejercicios con su corchete y reps; a la derecha, la nota del bloque en rojo. */
function ExerciseList({ block }: { block: Block }) {
  const note = block.note?.trim();

  return (
    <div className="flex items-center gap-4">
      {/*
        Grilla de 3 columnas: nombres | corchete | reps.
        La primera columna mide lo que el nombre más largo ("auto"), así el
        corchete queda pegado a los nombres como en el pizarrón. El corchete
        ocupa todas las filas (gridRow: span N) para abrazar a todo el bloque.
      */}
      <div className="grid min-w-0 grid-cols-[minmax(0,auto)_0.6rem_auto] items-center gap-x-2.5 gap-y-1">
        {block.exercises.map((exercise, i) => (
          <div key={i} className="contents">
            <span
              className="text-lg leading-snug lg:text-xl 2xl:text-2xl"
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              {exercise.name}
              {/* Nota del ejercicio ("alter", "(3:1)"): más chica y en rojo. */}
              {exercise.note && (
                <span className="ml-2 text-base text-board-red lg:text-lg">{exercise.note}</span>
              )}
            </span>
            <span
              className="whitespace-nowrap text-lg tabular-nums lg:text-xl 2xl:text-2xl"
              style={{ gridColumn: 3, gridRow: i + 1 }}
            >
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

      {note && (
        <span className="max-w-[40%] text-lg uppercase leading-tight text-board-red -rotate-3 lg:text-xl 2xl:text-2xl">
          {note}
        </span>
      )}
    </div>
  );
}
