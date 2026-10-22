// Página de inicio provisoria (etapa 0).
// Sirve para comprobar que el deploy en Vercel funciona.
// En la etapa 4 esta ruta va a redirigir a /plan.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Hola <span className="text-onda-red">OndaSmart</span>
      </h1>
      <p className="max-w-sm text-foreground/70">
        Planificador de rutinas de OndaCrossfit. Próximamente: el panel del
        coach y la vista para la TV.
      </p>
    </main>
  );
}
