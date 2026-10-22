// Encabezado compartido por el editor y la vista previa:
// nombre de la sección, navegación entre semanas y pestañas Editar / Vista previa.

import Link from "next/link";
import { addDays, formatWeekRange } from "@/lib/dates";

interface WeekHeaderProps {
  sectionName: string;
  sectionSlug: string;
  week: string;
  mode: "edit" | "preview";
}

export function WeekHeader({ sectionName, sectionSlug, week, mode }: WeekHeaderProps) {
  // Arma la URL de una semana manteniendo el modo actual.
  const weekUrl = (monday: string, targetMode = mode) =>
    `/plan/${sectionSlug}/${monday}${targetMode === "preview" ? "/preview" : ""}`;

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold ${
      active ? "bg-brand text-brand-ink" : "text-muted hover:text-foreground"
    }`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide lg:text-4xl">
          {sectionName}
        </h1>
        <nav className="flex rounded-lg bg-surface p-1" aria-label="Modo">
          <Link href={weekUrl(week, "edit")} className={tabClass(mode === "edit")}>
            Editar
          </Link>
          <Link href={weekUrl(week, "preview")} className={tabClass(mode === "preview")}>
            Vista previa
          </Link>
        </nav>
      </div>

      {/* Links reales (<a>): funcionan con teclado y, más adelante, con el control remoto. */}
      <nav className="flex items-center gap-2" aria-label="Cambiar de semana">
        <Link
          href={weekUrl(addDays(week, -7))}
          className="rounded-lg bg-surface px-3 py-2 font-semibold hover:bg-surface-2"
          aria-label="Semana anterior"
        >
          ◀
        </Link>
        <span className="min-w-40 text-center font-semibold">{formatWeekRange(week)}</span>
        <Link
          href={weekUrl(addDays(week, 7))}
          className="rounded-lg bg-surface px-3 py-2 font-semibold hover:bg-surface-2"
          aria-label="Semana siguiente"
        >
          ▶
        </Link>
      </nav>
    </header>
  );
}
