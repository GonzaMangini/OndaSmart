"use client";

// Formulario de login. Es un Client Component porque muestra el estado
// mientras se envía ("Ingresando…") y el error que devuelve el servidor.
//
// useActionState (React 19) conecta el formulario con la Server Action:
//   - state:     lo último que devolvió `login` ({ error })
//   - formAction: lo que va en <form action>
//   - pending:   true mientras el servidor responde

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {/* A dónde volver después de entrar (por ejemplo, la semana que se quería abrir). */}
      {next && <input type="hidden" name="next" value={next} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-base outline-none focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-base outline-none focus:border-brand"
        />
      </label>

      {state.error && (
        // role="alert" hace que los lectores de pantalla anuncien el error.
        <p role="alert" className="rounded-lg bg-danger/15 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-brand px-5 py-3 font-display text-lg font-bold uppercase tracking-wide text-brand-ink hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
