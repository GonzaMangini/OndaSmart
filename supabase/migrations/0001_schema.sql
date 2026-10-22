-- =============================================================================
-- OndaSmart · Migración 0001: esquema inicial
--
-- Cómo correrlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se corre UNA sola vez. Si hay que cambiar algo después, se agrega una
-- migración nueva (0002_...), no se edita esta.
--
-- Estructura (cada flecha es "uno a muchos"):
--
--   sections ──< weeks ──< days ──< blocks ──< block_exercises >── exercises
--
-- Las letras de los bloques (A, B, C…) NO se guardan: se calculan a partir de
-- `position` al mostrar. Tampoco se guarda el texto formateado ("x 3R (1' P)"):
-- se arma en lib/notation.ts a partir de los campos.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Extensión unaccent: quita tildes ("Bíceps" → "Biceps").
-- La usamos para que la biblioteca no tenga duplicados por tildes o mayúsculas.
-- Supabase guarda las extensiones en el schema `extensions`.
-- -----------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;

-- Normaliza un nombre de ejercicio para comparar y buscar:
--   "H.P. Clean"        → "hp clean"
--   "Bíceps  Barra"     → "biceps barra"
--   "Flex c/aplausos"   → "flex c aplausos"
-- Pasos: minúsculas → sin tildes → borrar puntos (H.P. = HP) → todo lo que no
-- sea letra o número pasa a espacio → espacios repetidos a uno solo.
--
-- Se declara `immutable` (mismo input = mismo output siempre) para poder usarla
-- en una columna generada. unaccent con el diccionario explícito cumple eso.
create or replace function public.normalize_exercise_name(name text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(
    regexp_replace(
      replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, name)), '.', ''),
      '[^a-z0-9]+', ' ', 'g'
    )
  );
$$;


-- -----------------------------------------------------------------------------
-- sections: cada pizarrón del gimnasio (Performance, y más adelante otros).
-- column_count = cuántos días/columnas tiene cada semana de esta sección.
-- -----------------------------------------------------------------------------
create table public.sections (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                       -- "Performance"
  slug         text not null unique,                -- "performance" (para la URL)
  column_count int  not null default 3 check (column_count between 1 and 7),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- weeks: una semana de una sección.
-- week_start es la fecha del LUNES (tipo `date`, sin hora → sin líos de zona horaria).
-- -----------------------------------------------------------------------------
create table public.weeks (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1), -- 1 = lunes
  created_at timestamptz not null default now(),
  unique (section_id, week_start)                  -- una sola semana por sección y fecha
);


-- -----------------------------------------------------------------------------
-- days: cada columna del pizarrón ("Día 1", "Día 2", "Día 3").
-- label es opcional: si es null, la app muestra "Día N".
-- -----------------------------------------------------------------------------
create table public.days (
  id       uuid primary key default gen_random_uuid(),
  week_id  uuid not null references public.weeks (id) on delete cascade,
  position int  not null check (position >= 0),    -- 0, 1, 2…
  label    text,
  unique (week_id, position)
);


-- -----------------------------------------------------------------------------
-- blocks: E/C, A, B, C… dentro de un día.
--
-- Prescripción del bloque: rounds + rounds_suffix + rest + note.
--   rounds=3, rounds_suffix='R', rest='1''30''''', note=null  →  "x 3R (1'30'' P)"
--   rounds=3, rounds_suffix='',  rest='2'''                   →  "x 3 (2' P)"   (4-2-1 x 3)
-- prescription_override: escape para notaciones raras; si tiene texto, se
-- muestra eso tal cual en lugar de lo anterior.
-- -----------------------------------------------------------------------------
create table public.blocks (
  id                    uuid primary key default gen_random_uuid(),
  day_id                uuid not null references public.days (id) on delete cascade,
  position              int  not null check (position >= 0),
  kind                  text not null default 'main' check (kind in ('warmup', 'main')), -- warmup = E/C
  rounds                int  check (rounds > 0),
  rounds_suffix         text not null default 'R',
  rest                  text,                       -- "1'", "1'30''", "s/P"
  note                  text,                       -- "(liviano)"
  prescription_override text
);

create index blocks_day_id_idx on public.blocks (day_id, position);


-- -----------------------------------------------------------------------------
-- exercises: la biblioteca. Un ejercicio = un nombre.
-- name_normalized se calcula sola (columna generada) y es única: así
-- "H.P. Clean", "HP clean" y "h.p. clean" son el mismo ejercicio.
-- -----------------------------------------------------------------------------
create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(trim(name)) > 0),
  name_normalized text generated always as (public.normalize_exercise_name(name)) stored unique,
  use_count       int not null default 0,           -- para ordenar el autocompletado
  last_used_at    timestamptz,
  created_at      timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- block_exercises: cada renglón dentro del corchete de un bloque.
-- reps y note son texto libre para soportar toda la notación del pizarrón:
--   "20", "10/10", "30''", "10x20'' c/lado", "4-2-1"
-- -----------------------------------------------------------------------------
create table public.block_exercises (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.blocks (id) on delete cascade,
  position    int  not null check (position >= 0),
  -- restrict: no se puede borrar de la biblioteca un ejercicio que está en uso.
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  reps        text,
  note        text                                  -- "alter", "(3:1)", "con camino"
);

create index block_exercises_block_id_idx on public.block_exercises (block_id, position);
create index block_exercises_exercise_id_idx on public.block_exercises (exercise_id);


-- -----------------------------------------------------------------------------
-- coaches: quiénes pueden EDITAR. Las cuentas se crean a mano en
-- Supabase → Authentication → Users, y después se agregan acá (etapa 4).
-- auth.users es la tabla de usuarios que maneja Supabase.
-- -----------------------------------------------------------------------------
create table public.coaches (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);


-- =============================================================================
-- Seguridad: Row Level Security (RLS)
--
-- Con RLS activado, Postgres rechaza TODO salvo lo que una "policy" permita.
-- Es la protección real de los datos: la publishable key es pública, así que
-- cualquiera puede hablarle a la base; las policies deciden qué puede hacer.
--
-- Reglas:
--   · Leer rutinas y biblioteca: cualquiera (la TV no va a tener login).
--   · Escribir: solo usuarios logueados que estén en la tabla coaches.
--   · Tabla coaches: cada usuario solo puede ver su propia fila.
-- =============================================================================

-- ¿El usuario logueado es coach?
-- `security definer` = corre con permisos del dueño de la función, así puede
-- leer coaches aunque la policy de esa tabla sea restrictiva.
-- auth.uid() devuelve el id del usuario logueado (null si es anónimo).
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.coaches where user_id = auth.uid());
$$;

alter table public.sections        enable row level security;
alter table public.weeks           enable row level security;
alter table public.days            enable row level security;
alter table public.blocks          enable row level security;
alter table public.exercises       enable row level security;
alter table public.block_exercises enable row level security;
alter table public.coaches         enable row level security;

-- Lectura pública. `anon` = visitante sin login; `authenticated` = logueado.
create policy "lectura pública" on public.sections        for select to anon, authenticated using (true);
create policy "lectura pública" on public.weeks           for select to anon, authenticated using (true);
create policy "lectura pública" on public.days            for select to anon, authenticated using (true);
create policy "lectura pública" on public.blocks          for select to anon, authenticated using (true);
create policy "lectura pública" on public.exercises       for select to anon, authenticated using (true);
create policy "lectura pública" on public.block_exercises for select to anon, authenticated using (true);

-- Escritura solo para coaches. `using` filtra filas existentes (update/delete);
-- `with check` valida las filas nuevas o modificadas (insert/update).
create policy "coaches editan" on public.sections        for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches editan" on public.weeks           for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches editan" on public.days            for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches editan" on public.blocks          for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches editan" on public.exercises       for all to authenticated using (public.is_coach()) with check (public.is_coach());
create policy "coaches editan" on public.block_exercises for all to authenticated using (public.is_coach()) with check (public.is_coach());

create policy "cada uno ve su fila" on public.coaches for select to authenticated using (user_id = auth.uid());
-- (Altas y bajas de coaches se hacen desde el panel de Supabase, que saltea RLS.)

-- Permisos de tabla (GRANT). RLS decide QUÉ filas; GRANT decide si el rol
-- puede tocar la tabla en absoluto. Los dejamos explícitos para no depender
-- de la configuración por defecto del proyecto.
grant select on public.sections, public.weeks, public.days, public.blocks,
                public.exercises, public.block_exercises
  to anon, authenticated;
grant insert, update, delete on public.sections, public.weeks, public.days, public.blocks,
                public.exercises, public.block_exercises
  to authenticated;
grant select on public.coaches to authenticated;
grant execute on function public.is_coach() to anon, authenticated;
grant execute on function public.normalize_exercise_name(text) to anon, authenticated;
