// Inicio: va directo al panel. Si no hay sesión, el middleware lo manda a /login.

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/plan");
}
