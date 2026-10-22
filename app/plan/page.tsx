// /plan → lleva al editor de la semana actual de la primera pantalla.
// Si todavía no hay ninguna pantalla, ofrece crear la primera.

import { redirect } from "next/navigation";
import { NewSectionForm } from "@/components/plan/NewSectionForm";
import { getSections } from "@/lib/data/board";
import { currentMonday } from "@/lib/dates";

// "Semana actual" depende del día en que se visita: le pedimos a Next.js que
// no guarde esta página pre-generada desde el build.
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const sections = await getSections();

  if (sections.length > 0) {
    redirect(`/plan/${sections[0].slug}/${currentMonday()}`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-2xl font-bold uppercase">Creá tu primera pantalla</h1>
      <p className="text-muted">
        Cada pantalla es un pizarrón (por ejemplo Performance, Fuerza o Core) con sus propias rutinas.
      </p>
      <NewSectionForm />
    </main>
  );
}
