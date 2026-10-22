"use client";

// Editor de la semana completa.
//   · Celular: pestañas Día 1 | Día 2 | Día 3, un día por pantalla.
//   · Pantallas grandes (lg): todos los días lado a lado, como el pizarrón.
//
// Todos los DayEditor quedan montados (los ocultos con CSS), así cambiar de
// pestaña no pierde lo que se estaba escribiendo ni corta un autoguardado.

import { useState, type CSSProperties } from "react";
import type { Day } from "@/lib/types";
import { DayEditor } from "./DayEditor";

export function WeekEditor({ days }: { days: Day[] }) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Pestañas: solo en celular (lg:hidden) */}
      <div role="tablist" aria-label="Días" className="flex rounded-lg bg-surface p-1 lg:hidden">
        {days.map((day, index) => (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={activeDay === index}
            onClick={() => setActiveDay(index)}
            className={`flex-1 rounded-md py-2 font-display font-bold uppercase tracking-wide ${
              activeDay === index ? "bg-brand text-brand-ink" : "text-muted"
            }`}
          >
            {/* "Día N" fijo: el título del día puede ser largo y se edita adentro. */}
            Día {day.position + 1}
          </button>
        ))}
      </div>

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": days.length } as CSSProperties}
      >
        {days.map((day, index) => (
          // En celular se ve solo el día activo; en lg, todos.
          <div key={day.id} className={activeDay === index ? "block" : "hidden lg:block"}>
            <DayEditor day={day} />
          </div>
        ))}
      </div>
    </div>
  );
}
