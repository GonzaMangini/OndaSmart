-- =============================================================================
-- OndaSmart · Seed: la semana real del pizarrón de Performance (foto de referencia)
--
-- Cómo correrlo: DESPUÉS de 0001_schema.sql. SQL Editor → pegar todo → Run.
-- Se puede correr varias veces: borra la semana del seed y la vuelve a crear.
--
-- Los datos están en JSON (un objeto por día). Es el mismo formato que va a
-- usar el editor para autoguardar un día (etapa 5), así que este seed también
-- prueba ese formato.
--
-- Usamos $json$ … $json$ (dollar quoting) en lugar de comillas simples para
-- poder escribir 30'' y 1'30'' sin tener que escapar los apóstrofes.
--
-- Convenciones de la notación:
--   rest:   "1'"  → se muestra "(1' P)".  "s/P" = sin pausa.
--   rounds_suffix: "R" por defecto ("x 3R"); "" para "4-2-1 x 3".
--
-- ⚠ Algunos nombres son interpretaciones de la letra del pizarrón: los dudosos
--   están marcados con "?" en el comentario. Se corrigen fácil después.
-- =============================================================================

do $seed$
declare
  v_section_id uuid;
  v_week_id    uuid;
  v_day_id     uuid;
  v_block_id   uuid;
  v_exercise_id uuid;
  v_week_start date := '2026-10-19';  -- lunes de la semana de la foto (ajustable)
  v_day        jsonb;
  v_block      jsonb;
  v_ex         jsonb;
  v_day_pos    int;
  v_block_pos  int;
  v_ex_pos     int;

  v_days jsonb := $json$
  [
    { "blocks": [
        { "kind": "warmup", "rounds": 3, "rest": "s/P", "exercises": [
            { "name": "Bicho DBSO",  "reps": "10" },
            { "name": "Bicho Panza", "reps": "10" },
            { "name": "Superman",    "reps": "30''" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Polos cortos + altos", "reps": "20" },
            { "name": "Flex c/aplausos",      "reps": "4" } ] },
        { "rounds": 3, "rest": "2'", "exercises": [
            { "name": "Saltos c/Box", "reps": "4" },
            { "name": "Runners",      "reps": "4/4" } ] },
        { "rounds": 3, "rest": "1'30''", "exercises": [
            { "name": "H.P. Clean", "reps": "4" } ] },
        { "rounds": 4, "rest": "2'", "exercises": [
            { "name": "Back Squats", "reps": "4" } ] },
        { "rounds": 4, "rest": "1'", "exercises": [
            { "name": "Pecho Plano", "reps": "4" },
            { "name": "Pull Ups",    "reps": "4" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Bíceps Barra",    "reps": "8" },
            { "name": "Empuje Pared 1P", "reps": "10''/10''" },
            { "name": "Cuello 4 lados",  "reps": "10'' c/l" } ] }
    ] },

    { "blocks": [
        { "kind": "warmup", "rounds": 3, "exercises": [
            { "name": "Pallof din + estático", "reps": "10x20'' c/l" },
            { "name": "Marcha BB OH",          "reps": "10/10" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Polos 1P c/camino",   "reps": "10/10" },
            { "name": "Pase pecho c/impulso", "reps": "4" } ] },
        { "rounds": 3, "rest": "2'", "exercises": [
            { "name": "Caída + shuffle + salto alto", "reps": "4" },
            { "name": "Salto largo sin impulso",      "reps": "2" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "High Hang Power Snatch", "reps": "4" } ] },
        { "rounds": 4, "rest": "2'", "exercises": [
            { "name": "RDL", "reps": "4", "note": "(3:1)" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "BOR supino",          "reps": "6" },
            { "name": "V. frontal completo", "reps": "12", "note": "alter" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Empuje pared lateral", "reps": "10''/10''" },
            { "name": "Martillo pesado",      "reps": "6" },
            { "name": "Tríceps polea",        "reps": "12" } ] }
    ] },

    { "blocks": [
        { "kind": "warmup", "rounds": 3, "rest": "s/P", "exercises": [
            { "name": "Plancha Copenhague", "reps": "10''/10''" },
            { "name": "Lado a lado 1P",     "reps": "10/10" },
            { "name": "Cubanos DBS",        "reps": "10" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Monigotes combinados", "reps": "20" },
            { "name": "Power Twist",          "reps": "10" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Caída + lanzamiento", "reps": "4" },
            { "name": "Salto desde arrodillado", "reps": "2" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Shuffle + pase MB",  "reps": "2/2" },
            { "name": "Sq Jumps c/hexa",    "reps": "4" } ] },
        { "rounds": 3, "rounds_suffix": "", "rest": "2'", "exercises": [
            { "name": "H.P. Snatch", "reps": "4-2-1" } ] },
        { "rounds": 4, "rest": "2'", "exercises": [
            { "name": "H. Clean", "reps": "2" } ] },
        { "rounds": 4, "rest": "1'", "note": "(liviano)", "exercises": [
            { "name": "Split Jerk", "reps": "2" } ] },
        { "rounds": 3, "rest": "1'", "exercises": [
            { "name": "Bíceps supino DBS", "reps": "12" },
            { "name": "Tríceps T/nuca",    "reps": "12" },
            { "name": "Gemelo iso",        "reps": "20", "note": "con camino" } ] }
    ] }
  ]
  $json$;
begin
  -- 1) Sección Performance (si ya existe, la reutiliza).
  insert into public.sections (name, slug, column_count, sort_order)
  values ('Performance', 'performance', 3, 0)
  on conflict (slug) do nothing;

  select id into v_section_id from public.sections where slug = 'performance';

  -- 2) Borra la semana del seed si ya estaba (en cascada se van días, bloques y renglones).
  delete from public.weeks where section_id = v_section_id and week_start = v_week_start;

  insert into public.weeks (section_id, week_start)
  values (v_section_id, v_week_start)
  returning id into v_week_id;

  -- 3) Recorre días → bloques → ejercicios.
  --    `with ordinality` numera los elementos del array (1, 2, 3…); restamos 1
  --    para que position arranque en 0.
  for v_day, v_day_pos in
    select value, ordinality - 1 from jsonb_array_elements(v_days) with ordinality
  loop
    insert into public.days (week_id, position)
    values (v_week_id, v_day_pos)
    returning id into v_day_id;

    for v_block, v_block_pos in
      select value, ordinality - 1 from jsonb_array_elements(v_day -> 'blocks') with ordinality
    loop
      -- ->> devuelve el valor como texto (o null si la clave no está).
      insert into public.blocks (day_id, position, kind, rounds, rounds_suffix, rest, note, prescription_override)
      values (
        v_day_id,
        v_block_pos,
        coalesce(v_block ->> 'kind', 'main'),
        (v_block ->> 'rounds')::int,
        coalesce(v_block ->> 'rounds_suffix', 'R'),
        v_block ->> 'rest',
        v_block ->> 'note',
        v_block ->> 'prescription_override'
      )
      returning id into v_block_id;

      for v_ex, v_ex_pos in
        select value, ordinality - 1 from jsonb_array_elements(v_block -> 'exercises') with ordinality
      loop
        -- Busca el ejercicio en la biblioteca o lo crea. Si ya existe (mismo
        -- nombre normalizado) le suma un uso: así se arma el ranking del autocompletado.
        insert into public.exercises (name, use_count, last_used_at)
        values (v_ex ->> 'name', 1, now())
        on conflict (name_normalized)
          do update set use_count = public.exercises.use_count + 1, last_used_at = now()
        returning id into v_exercise_id;

        insert into public.block_exercises (block_id, position, exercise_id, reps, note)
        values (v_block_id, v_ex_pos, v_exercise_id, v_ex ->> 'reps', v_ex ->> 'note');
      end loop;
    end loop;
  end loop;
end
$seed$;


-- =============================================================================
-- Verificación: muestra la semana como "pizarrón en texto".
-- La letra se calcula igual que en la app: E/C para el warmup y A, B, C…
-- para el resto, según el orden.
-- =============================================================================
select
  'Día ' || (d.position + 1)                                          as dia,
  case when b.kind = 'warmup' then 'E/C'
       -- dense_rank: todos los renglones de un mismo bloque reciben el mismo número
       -- (1 → A, 2 → B…). chr(65) = 'A'.
       else chr(64 + (dense_rank() over (partition by d.id, b.kind order by b.position))::int)
  end                                                                 as bloque,
  e.name                                                              as ejercicio,
  be.reps,
  be.note                                                             as nota_ejercicio,
  'x ' || b.rounds || b.rounds_suffix
    || coalesce(' (' || b.rest || case when b.rest like '%P' then '' else ' P' end || ')', '')
    || coalesce(' ' || b.note, '')                                    as prescripcion
from public.weeks w
join public.sections s         on s.id = w.section_id and s.slug = 'performance'
join public.days d             on d.week_id = w.id
join public.blocks b           on b.day_id = d.id
join public.block_exercises be on be.block_id = b.id
join public.exercises e        on e.id = be.exercise_id
where w.week_start = '2026-10-19'
order by d.position, b.position, be.position;
