// Pantalla para la TV: /tv/performance
//
// · Pública: no pide login (las rutinas se pueden leer sin cuenta, ver RLS en
//   0001_schema.sql). Así la tele no necesita usuario ni contraseña.
// · Muestra siempre la semana actual.
// · Sin botones: se escala sola a la pantalla, se actualiza cada minuto y se
//   cambia de pantalla con las flechas del control remoto.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/BoardView";
import { FitToScreen } from "@/components/tv/FitToScreen";
import { TvControls } from "@/components/tv/TvControls";
import { getSections, getWeekDays } from "@/lib/data/board";
import { currentMonday, formatWeekRange } from "@/lib/dates";

// "Semana actual" depende del día: la página se arma en cada visita.
export const dynamic = "force-dynamic";

// Que los buscadores no indexen esta página.
export const metadata: Metadata = { robots: { index: false, follow: false } };

interface TvPageProps {
  params: Promise<{ section: string }>;
}

export default async function TvPage({ params }: TvPageProps) {
  const { section: sectionSlug } = await params;

  const sections = await getSections();
  const section = sections.find((s) => s.slug === sectionSlug);
  if (!section) notFound();

  const week = currentMonday();
  const days = await getWeekDays(section.id, week);

  return (
    // cursor-none: oculta el puntero (algunas teles muestran una flechita en el medio).
    <div className="cursor-none">
      <TvControls slugs={sections.map((s) => s.slug)} currentSlug={section.slug} />

      <FitToScreen>
        {/* flex-1: ocupa todo el alto de la pantalla, así la pizarra llega hasta abajo. */}
        <div className="flex flex-1 flex-col gap-5 p-6">
          {/* Cartel superior, como el "MÉTODO ONDA" del pizarrón real. */}
          <header className="flex items-end justify-between rounded-lg bg-board-bg px-8 py-3 font-marker">
            <h1 className="text-6xl uppercase tracking-wider text-brand [-webkit-text-stroke:2px_#3d5e0c]">
              {section.name}
            </h1>
            <p className="pb-1 text-2xl text-board-ink/60">{formatWeekRange(week)}</p>
          </header>

          {days ? (
            <BoardView days={days} variant="tv" className="flex-1" />
          ) : (
            <p className="flex-1 rounded-lg bg-board-bg p-16 text-center font-marker text-4xl text-board-ink/50">
              Todavía no hay rutina cargada para esta semana.
            </p>
          )}
        </div>
      </FitToScreen>
    </div>
  );
}
