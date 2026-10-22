import Image from "next/image";

// Página de inicio provisoria (etapa 0).
// Sirve para comprobar que el deploy en Vercel funciona y para ver la
// paleta y las fuentes. En la etapa 4 esta ruta va a redirigir a /plan.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Image
        src="/logo.png"
        alt="Logo de OndaCrossfit"
        width={160}
        height={176}
        priority
      />
      <h1 className="font-display text-5xl font-extrabold uppercase tracking-wide">
        Onda<span className="text-brand">Smart</span>
      </h1>
      <p className="max-w-sm text-muted">
        Planificador de rutinas de OndaCrossfit. Próximamente: el panel del
        coach y la vista para la TV.
      </p>
    </main>
  );
}
