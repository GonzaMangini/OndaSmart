// Vista previa de una semana: /plan/performance/2026-10-19/preview
//
// Es un Server Component (no tiene "use client"): corre en el servidor,
// lee la base y manda al navegador el HTML ya armado.
//
// [section] y [week] entre corchetes en el nombre de las carpetas son
// "segmentos dinámicos": Next.js pasa sus valores en `params`.

import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/BoardView";
import { getSection, getWeekDays } from "@/lib/data/board";
import { addDays, formatWeekRange, isMonday, isValidIsoDate } from "@/lib/dates";

interface PreviewPageProps {
  // En Next.js 15 `params` es una Promise: hay que esperarla con await.
  params: Promise<{ section: string; week: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { section: sectionSlug, week } = await params;

  // La URL la puede escribir cualquiera: validamos antes de ir a la base.
  if (!isValidIsoDate(week) || !isMonday(week)) notFound();

  const section = await getSection(sectionSlug);
  if (!section) notFound();

  const days = await getWeekDays(section.id, week);
  const weekUrl = (monday: string) => `/plan/${section.slug}/${monday}/preview`;

  return (
    <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-6 p-4 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide lg:text-4xl">
          {section.name}
        </h1>

        {/* Navegación entre semanas. Son links reales (<a>), así también
            funcionan con el teclado y, más adelante, con el control remoto. */}
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

      {days ? (
        <BoardView days={days} />
      ) : (
        <p className="rounded-xl bg-surface p-6 text-center text-muted">
          Esta semana todavía no tiene rutinas cargadas.
        </p>
      )}
    </main>
  );
}
