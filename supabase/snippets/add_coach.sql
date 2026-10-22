-- =============================================================================
-- Dar de alta un coach
--
-- 1. Supabase → Authentication → Users → "Add user" → "Create new user".
--    Cargá email y contraseña, y dejá tildado "Auto Confirm User".
-- 2. Cambiá el email y el nombre de abajo, y corré esto en el SQL Editor.
--
-- Para dar de BAJA a un coach (deja de poder editar, pero conserva la cuenta):
--   delete from public.coaches
--   where user_id = (select id from auth.users where email = 'coach@ejemplo.com');
-- =============================================================================

insert into public.coaches (user_id, name)
select id, 'Nombre del coach'
from auth.users
where email = 'coach@ejemplo.com'
on conflict (user_id) do update set name = excluded.name;

-- Verificación: lista los coaches habilitados.
select c.name, u.email, c.created_at
from public.coaches c
join auth.users u on u.id = c.user_id
order by c.created_at;
