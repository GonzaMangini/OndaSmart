-- =============================================================================
-- OndaSmart · Migración 0003: crear pantallas (secciones)
--
-- Cómo correrlo: SQL Editor → pegar todo → Run (una sola vez, después de 0002).
--
-- Renombrar y borrar una sección se hace directo desde la app (update/delete
-- normales, permitidos a coaches por RLS). Crear necesita esta función porque
-- hay que inventar un slug ÚNICO para la URL, y eso conviene hacerlo en la base.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- create_section: crea una pantalla y devuelve su slug.
--   create_section('Fuerza', 3)       → 'fuerza'
--   create_section('Core & Movilidad', 2) → 'core-movilidad'
--   create_section('Fuerza', 3) otra vez → 'fuerza-2'
-- -----------------------------------------------------------------------------
create or replace function public.create_section(p_name text, p_column_count int)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name   text := btrim(p_name);
  v_base   text;
  v_slug   text;
  v_suffix int := 1;
begin
  if not public.is_coach() then
    raise exception 'Solo los coaches pueden crear pantallas' using errcode = '42501';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'La pantalla necesita un nombre';
  end if;

  -- Reutilizamos la normalización de la biblioteca ("Core & Movilidad" → "core movilidad")
  -- y cambiamos espacios por guiones para que quede lindo en la URL.
  v_base := replace(public.normalize_exercise_name(v_name), ' ', '-');
  if v_base = '' then
    v_base := 'pantalla';   -- por si el nombre era solo símbolos
  end if;

  -- Si el slug ya existe, probamos con -2, -3…
  v_slug := v_base;
  while exists (select 1 from public.sections where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  end loop;

  insert into public.sections (name, slug, column_count, sort_order)
  values (
    v_name,
    v_slug,
    p_column_count,  -- el check de la tabla valida que esté entre 1 y 7
    (select coalesce(max(sort_order), -1) + 1 from public.sections)  -- va al final
  );

  return v_slug;
end;
$$;

revoke execute on function public.create_section(text, int) from public, anon;
grant  execute on function public.create_section(text, int) to authenticated;
