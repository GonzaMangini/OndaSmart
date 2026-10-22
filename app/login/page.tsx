// Pantalla de login: /login (o /login?next=/plan/... para volver a donde se quería ir).

import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Logo de OndaCrossfit" width={110} height={121} priority />
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">
          Onda<span className="text-brand">Smart</span>
        </h1>
        <p className="text-muted">Ingreso de coaches</p>
      </div>

      <LoginForm next={next} />
    </main>
  );
}
