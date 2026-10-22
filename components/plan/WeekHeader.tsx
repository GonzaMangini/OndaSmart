// Encabezado compartido por el editor y la vista previa:
//   · Pestañas con todas las pantallas (Performance, Fuerza, Core…) + "+ Pantalla"
//   · Título de la pantalla (editable con ✎) y modo Editar / Vista previa
//   · Navegación entre semanas

import Link from "next/link";
import type { Section } from "@/lib/data/board";
import { addDays, formatWeekRange } from "@/lib/dates";
import { NewSectionForm } from "./NewSectionForm";
import { SectionTitle } from "./SectionTitle";

interface WeekHeaderProps {
  sections: Section[];
  section: Section;
  week: string;
  mode: "edit" | "preview";
}

export function WeekHeader({ sections, section, week, mode }: WeekHeaderProps) {
  // Arma la URL de una pantalla/semana/modo. Por defecto, mantiene lo actual.
  const url = ({ slug = section.slug, monday = week, targetMode = mode } = {}) =>
    `/plan/${slug}/${monday}${targetMode === "preview" ? "/preview" : ""}`;

  const pillClass = (active: boolean) =>
    `shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold ${
      active ? "bg-brand text-brand-ink" : "text-muted hover:text-foreground"
    }`;

  return (
    <header className="flex flex-col gap-4">
      {/* Pantallas. overflow-x-auto: si son muchas, en el celular se deslizan de costado. */}
      <nav aria-label="Pantallas" className="flex items-center gap-1 overflow-x-auto border-b border-line pb-3">
        {sections.map((s) => (
          <Link
            key={s.id}
            href={url({ slug: s.slug })}
            className={pillClass(s.id === section.id)}
            aria-current={s.id === section.id ? "page" : undefined}
          >
            {s.name}
          </Link>
        ))}
        <NewSectionForm week={week} compact />
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* key: si se cambia de pantalla, el título arranca de cero (sale del modo edición). */}
          <SectionTitle key={section.id} sectionId={section.id} name={section.name} />
          <nav className="flex rounded-lg bg-surface p-1" aria-label="Modo">
            <Link href={url({ targetMode: "edit" })} className={pillClass(mode === "edit")}>
              Editar
            </Link>
            <Link href={url({ targetMode: "preview" })} className={pillClass(mode === "preview")}>
              Vista previa
            </Link>
          </nav>
          {/* La versión para la tele (pública, semana actual). Se abre en otra pestaña. */}
          <a
            href={`/tv/${section.slug}`}
            target="_blank"
            rel="noopener"
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10"
          >
            Pantalla TV ↗
          </a>
        </div>

        {/* Links reales (<a>): funcionan con teclado y, más adelante, con el control remoto. */}
        <nav className="flex items-center gap-2" aria-label="Cambiar de semana">
          <Link
            href={url({ monday: addDays(week, -7) })}
            className="rounded-lg bg-surface px-3 py-2 font-semibold hover:bg-surface-2"
            aria-label="Semana anterior"
          >
            ◀
          </Link>
          <span className="min-w-40 text-center font-semibold">{formatWeekRange(week)}</span>
          <Link
            href={url({ monday: addDays(week, 7) })}
            className="rounded-lg bg-surface px-3 py-2 font-semibold hover:bg-surface-2"
            aria-label="Semana siguiente"
          >
            ▶
          </Link>
        </nav>
      </div>
    </header>
  );
}
