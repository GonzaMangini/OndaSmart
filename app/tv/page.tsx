// /tv → la primera pantalla (es la dirección corta para cargar en la tele).

import { redirect } from "next/navigation";
import { getSections } from "@/lib/data/board";

export const dynamic = "force-dynamic";

export default async function TvIndexPage() {
  const sections = await getSections();
  if (sections.length === 0) {
    return (
      <p className="flex min-h-screen items-center justify-center font-marker text-4xl text-board-bg">
        Todavía no hay pantallas creadas.
      </p>
    );
  }
  redirect(`/tv/${sections[0].slug}`);
}
