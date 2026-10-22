// Editor de una semana: /plan/performance/2026-10-19
//
// Este Server Component lee la semana de la base y se la pasa al editor
// (WeekEditor), que es un Client Component porque es interactivo.

import { notFound } from "next/navigation";
import { WeekEditor } from "@/components/editor/WeekEditor";
import { WeekHeader } from "@/components/plan/WeekHeader";
import { createWeek } from "@/app/plan/actions";
import { getSection, getWeekDays } from "@/lib/data/board";
import { isMonday, isValidIsoDate } from "@/lib/dates";

interface EditorPageProps {
  params: Promise<{ section: string; week: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { section: sectionSlug, week } = await params;

  if (!isValidIsoDate(week) || !isMonday(week)) notFound();

  const section = await getSection(sectionSlug);
  if (!section) notFound();

  const days = await getWeekDays(section.id, week);

  return (
    <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-6 p-4 lg:p-8">
      <WeekHeader sectionName={section.name} sectionSlug={section.slug} week={week} mode="edit" />

      {days ? (
        // `key={week}`: al cambiar de semana, React crea un editor nuevo desde
        // cero en vez de reutilizar el estado de la semana anterior.
        <WeekEditor key={week} days={days} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-surface p-8 text-center">
          <p className="text-muted">Esta semana todavía no existe.</p>
          {/* .bind fija los argumentos de la Server Action: el form no tiene que mandar nada. */}
          <form action={createWeek.bind(null, section.slug, week)}>
            <button
              type="submit"
              className="rounded-lg bg-brand px-5 py-3 font-display text-lg font-bold uppercase tracking-wide text-brand-ink hover:bg-brand-strong"
            >
              Crear semana vacía
            </button>
          </form>
          <p className="text-sm text-muted">Pronto: copiar la semana anterior como punto de partida.</p>
        </div>
      )}
    </main>
  );
}
