-- =============================================================================
-- OndaSmart · Migración 0002: guardar un día y crear semanas
--
-- Cómo correrlo: SQL Editor → pegar todo → Run (una sola vez, después de 0001).
--
-- Son funciones de Postgres que la app llama con supabase.rpc('save_day', …).
-- Ventaja de hacerlo acá y no con muchos insert/update desde la app: todo
-- corre en UNA transacción. Si algo falla a la mitad, no queda nada a medias.
--
-- `security invoker` = la función corre con los permisos de quien la llama,
-- así que las policies RLS siguen aplicando. Igual chequeamos is_coach() al
-- principio para devolver un error claro.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- save_day: reemplaza TODOS los bloques de un día por los que llegan.
--
-- p_blocks tiene el mismo formato que el seed:
--   [ { "kind": "warmup", "rounds": 3, "rounds_suffix": "R", "rest": "s/P",
--       "note": null, "prescription_override": null,
--       "exercises": [ { "name": "Superman", "reps": "30''", "note": null } ] },
--     … ]
--
-- Los ejercicios se buscan por nombre en la biblioteca; si no existen, se crean.
-- Los renglones sin nombre se ignoran (son renglones que el coach dejó vacíos).
-- -----------------------------------------------------------------------------
create or replace function public.save_day(p_day_id uuid, p_blocks jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_block       jsonb;
  v_block_pos   int;
  v_block_id    uuid;
  v_ex          jsonb;
  v_ex_pos      int;
  v_name        text;
  v_exercise_id uuid;
  v_touched     uuid[];  -- ejercicios cuyo contador de usos hay que recalcular
begin
  if not public.is_coach() then
    raise exception 'Solo los coaches pueden editar rutinas' using errcode = '42501';
  end if;

  if jsonb_typeof(p_blocks) is distinct from 'array' then
    raise exception 'p_blocks tiene que ser una lista de bloques';
  end if;

  if not exists (select 1 from public.days where id = p_day_id) then
    raise exception 'El día % no existe', p_day_id;
  end if;

  -- Ejercicios que el día tenía ANTES (si se sacan, su contador tiene que bajar).
  select coalesce(array_agg(distinct be.exercise_id), '{}')
    into v_touched
    from public.block_exercises be
    join public.blocks b on b.id = be.block_id
   where b.day_id = p_day_id;

  -- Borra los bloques del día (en cascada se van sus renglones)…
  delete from public.blocks where day_id = p_day_id;

  -- …y los vuelve a crear en el orden en que llegan.
  for v_block, v_block_pos in
    select value, ordinality - 1 from jsonb_array_elements(p_blocks) with ordinality
  loop
    insert into public.blocks (day_id, position, kind, rounds, rounds_suffix, rest, note, prescription_override)
    values (
      p_day_id,
      v_block_pos,
      coalesce(v_block ->> 'kind', 'main'),
      nullif(v_block ->> 'rounds', '')::int,
      coalesce(v_block ->> 'rounds_suffix', 'R'),
      nullif(btrim(v_block ->> 'rest'), ''),       -- "" → null
      nullif(btrim(v_block ->> 'note'), ''),
      nullif(btrim(v_block ->> 'prescription_override'), '')
    )
    returning id into v_block_id;

    v_ex_pos := 0;
    for v_ex in
      select value from jsonb_array_elements(coalesce(v_block -> 'exercises', '[]'::jsonb))
    loop
      v_name := btrim(v_ex ->> 'name');
      continue when v_name is null or v_name = '';   -- renglón vacío: se saltea

      -- Busca o crea el ejercicio en la biblioteca (por nombre normalizado).
      insert into public.exercises (name, last_used_at)
      values (v_name, now())
      on conflict (name_normalized) do update set last_used_at = now()
      returning id into v_exercise_id;

      insert into public.block_exercises (block_id, position, exercise_id, reps, note)
      values (
        v_block_id,
        v_ex_pos,
        v_exercise_id,
        nullif(btrim(v_ex ->> 'reps'), ''),
        nullif(btrim(v_ex ->> 'note'), '')
      );

      v_touched := v_touched || v_exercise_id;
      v_ex_pos := v_ex_pos + 1;
    end loop;
  end loop;

  -- use_count = en cuántos renglones aparece cada ejercicio (ordena el autocompletado).
  -- Se recalcula en vez de sumar 1: el autoguardado llama a esta función muchas
  -- veces y sumar inflaría los números.
  update public.exercises e
     set use_count = (select count(*) from public.block_exercises be where be.exercise_id = e.id)
   where e.id = any (v_touched);
end;
$$;


-- -----------------------------------------------------------------------------
-- create_week: crea una semana vacía con tantos días como columnas tenga la
-- sección. Si la semana ya existe, no hace nada y devuelve su id.
-- -----------------------------------------------------------------------------
create or replace function public.create_week(p_section_slug text, p_week_start date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_section_id   uuid;
  v_column_count int;
  v_week_id      uuid;
begin
  if not public.is_coach() then
    raise exception 'Solo los coaches pueden crear semanas' using errcode = '42501';
  end if;

  select id, column_count into v_section_id, v_column_count
    from public.sections where slug = p_section_slug;
  if v_section_id is null then
    raise exception 'La sección % no existe', p_section_slug;
  end if;

  insert into public.weeks (section_id, week_start)
  values (v_section_id, p_week_start)
  on conflict (section_id, week_start) do nothing
  returning id into v_week_id;

  -- Ya existía: devolvemos la existente sin tocarla.
  if v_week_id is null then
    select id into v_week_id from public.weeks
     where section_id = v_section_id and week_start = p_week_start;
    return v_week_id;
  end if;

  -- generate_series(0, 2) → 0, 1, 2: un día por columna.
  insert into public.days (week_id, position)
  select v_week_id, n from generate_series(0, v_column_count - 1) as n;

  return v_week_id;
end;
$$;


-- Solo usuarios logueados pueden llamarlas (y adentro se chequea que sean coaches).
revoke execute on function public.save_day(uuid, jsonb)   from public, anon;
revoke execute on function public.create_week(text, date) from public, anon;
grant  execute on function public.save_day(uuid, jsonb)   to authenticated;
grant  execute on function public.create_week(text, date) to authenticated;
