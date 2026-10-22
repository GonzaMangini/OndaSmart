// Vista previa de una semana: /plan/performance/2026-10-19/preview
//
// Es un Server Component (no tiene "use client"): corre en el servidor,
// lee la base y manda al navegador el HTML ya armado.
//
// [section] y [week] entre corchetes en el nombre de las carpetas son
// "segmentos dinámicos": Next.js pasa sus valores en `params`.

import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/BoardView";
import { WeekHeader } from "@/components/plan/WeekHeader";
import { getSection, getWeekDays } from "@/lib/data/board";
import { isMonday, isValidIsoDate } from "@/lib/dates";

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

  return (
    <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-6 p-4 lg:p-8">
      <WeekHeader sectionName={section.name} sectionSlug={section.slug} week={week} mode="preview" />

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
