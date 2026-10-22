// Pizarrón: dibuja los días de una semana como en el pizarrón del gimnasio.
//
// Es un componente "puro": recibe datos y los muestra. No lee la base, no
// sabe si hay alguien logueado y no tiene estado. Por eso lo pueden usar
// tanto la vista previa del coach como (más adelante) la TV.
//
// Todo el texto de la notación sale de lib/notation.ts. La única excepción es
// la nota de cada ejercicio, que se dibuja aparte para poder darle otro estilo.

import type { CSSProperties } from "react";
import {
  blockLabels,
  dayTitle,
  formatBlockPrescription,
  formatSingleLine,
  isSingleLineBlock,
} from "@/lib/notation";
import type { Block, Day } from "@/lib/types";

interface BoardViewProps {
  days: Day[];
}

export function BoardView({ days }: BoardViewProps) {
  return (
    // En celular las columnas van una debajo de la otra. Desde pantallas
    // grandes (lg) van lado a lado, tantas como días tenga la sección.
    // La cantidad llega como variable CSS (--cols) porque Tailwind no puede
    // generar clases a partir de valores que solo se conocen al ejecutar.
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:gap-0 lg:divide-x-2 lg:divide-line"
      style={{ "--cols": days.length } as CSSProperties}
    >
      {days.map((day) => (
        <DayColumn key={day.position} day={day} />
      ))}
    </div>
  );
}

function DayColumn({ day }: { day: Day }) {
  const labels = blockLabels(day.blocks);

  return (
    <section className="rounded-xl bg-surface p-4 lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted">
        {dayTitle(day)}
      </h2>

      {day.blocks.length === 0 ? (
        <p className="text-muted">Sin bloques cargados.</p>
      ) : (
        <ol className="flex flex-col gap-5 lg:gap-7">
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
  const singleLine = isSingleLineBlock(block);
  const prescription = formatBlockPrescription(block);
  const rowCount = Math.max(block.exercises.length, 1);

  return (
    <div className="flex items-center gap-3">
      <BlockLabel label={label} isWarmup={block.kind === "warmup"} />

      {/*
        Grilla de 3 columnas: nombres | corchete | reps.
        El corchete ocupa todas las filas (gridRow: span N), así abraza a
        todos los ejercicios del bloque como en el pizarrón.
      */}
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_0.5rem_auto] items-center gap-x-2 gap-y-1">
        {block.exercises.map((exercise, i) => (
          <div key={i} className="contents">
            <span
              className="font-display text-lg font-bold uppercase leading-tight lg:text-xl 2xl:text-2xl"
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              {exercise.name}
              {/* La nota ("alter", "(3:1)") va en minúscula y gris: es una aclaración, no parte del nombre. */}
              {exercise.note && (
                <span className="ml-1.5 font-sans text-sm font-medium normal-case text-muted lg:text-base">
                  {exercise.note}
                </span>
              )}
            </span>
            {!singleLine && (
              <span
                className="text-right font-semibold tabular-nums lg:text-lg 2xl:text-xl"
                style={{ gridColumn: 3, gridRow: i + 1 }}
              >
                {exercise.reps}
              </span>
            )}
          </div>
        ))}

        {/* El corchete: borde arriba, abajo y a la derecha. */}
        <span
          aria-hidden
          className="h-full min-h-6 self-stretch rounded-r-sm border-y-2 border-r-2 border-brand"
          style={{ gridColumn: 2, gridRow: `1 / span ${rowCount}` }}
        />

        {/* Bloque de un solo ejercicio: reps y prescripción en la misma línea. */}
        {singleLine && (
          <span
            className="font-semibold whitespace-nowrap lg:text-lg 2xl:text-xl"
            style={{ gridColumn: 3, gridRow: 1 }}
          >
            {formatSingleLine(block)}
          </span>
        )}
      </div>

      {/* Bloques de varios ejercicios: la prescripción va a la derecha del corchete, centrada. */}
      {!singleLine && prescription && (
        <span className="font-semibold whitespace-nowrap lg:text-lg 2xl:text-xl">{prescription}</span>
      )}
    </div>
  );
}

/** Letra del bloque en un círculo verde; el E/C va sin círculo, como en el pizarrón. */
function BlockLabel({ label, isWarmup }: { label: string; isWarmup: boolean }) {
  if (isWarmup) {
    return (
      <span className="w-10 shrink-0 text-center font-display text-lg font-extrabold text-brand lg:text-xl">
        {label}
      </span>
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand font-display text-xl font-extrabold text-brand lg:text-2xl">
      {label}
    </span>
  );
}
