// Layout de todo lo que está bajo /plan: la barra superior con el coach
// logueado y el botón para salir.
//
// Un layout envuelve a todas las páginas de su carpeta y subcarpetas
// (`children` es la página que se está mostrando).

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function PlanLayout({ children }: { children: React.ReactNode }) {
  const { user, coach } = await getCurrentUser();

  // El middleware ya manda al login a quien no tiene sesión; esto es una
  // segunda verificación por si el middleware no corrió (defensa en profundidad).
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 lg:px-8">
        <Link href="/plan" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={32} height={35} />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide">
            Onda<span className="text-brand">Smart</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{coach?.name ?? user.email}</span>
          {/* Un form con una Server Action: funciona aunque JavaScript no haya cargado. */}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface-2"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {coach ? (
        children
      ) : (
        // Logueado pero no está en la tabla coaches: no puede ver el panel.
        // (Igual, aunque lo viera, la base le rechazaría cualquier cambio por RLS.)
        <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="font-display text-2xl font-bold uppercase">Cuenta sin permisos</h1>
          <p className="text-muted">
            Tu cuenta ({user.email}) todavía no está habilitada como coach. Pedile al
            administrador que te agregue.
          </p>
        </main>
      )}
    </div>
  );
}
