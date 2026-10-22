# OndaSmart

Planificador de rutinas de OndaCrossfit: los coaches cargan las rutinas de la semana
y después se muestran en los televisores del gimnasio.

## Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + login) — a partir de la etapa 1
- **Vitest** para tests
- Deploy en **Vercel**

## Correr en local
```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase (etapa 1)
npm run dev                  # http://localhost:3000
```

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Build de producción (lo mismo que corre Vercel) |
| `npm test` | Corre los tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npm run lint` | Revisa el código con ESLint |

## Estructura
```
app/          páginas y rutas (App Router)
lib/          lógica sin interfaz (notación, Supabase, acciones)
components/   componentes de React reutilizables
supabase/     migraciones SQL
```
