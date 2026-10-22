// /plan → lleva a la semana actual de Performance.
//
// Por ahora va a la vista previa; cuando exista el editor (etapa 5)
// va a llevar al editor.

import { redirect } from "next/navigation";
import { currentMonday } from "@/lib/dates";

// "Semana actual" depende del día en que se visita: le pedimos a Next.js que
// no guarde esta página pre-generada desde el build.
export const dynamic = "force-dynamic";

export default function PlanPage() {
  redirect(`/plan/performance/${currentMonday()}/preview`);
}
