// /plan → lleva al editor de la semana actual de Performance.

import { redirect } from "next/navigation";
import { currentMonday } from "@/lib/dates";

// "Semana actual" depende del día en que se visita: le pedimos a Next.js que
// no guarde esta página pre-generada desde el build.
export const dynamic = "force-dynamic";

export default function PlanPage() {
  redirect(`/plan/performance/${currentMonday()}`);
}
