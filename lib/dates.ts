// Fechas de las semanas.
//
// Trabajamos con fechas como texto "YYYY-MM-DD" (igual que la columna
// `week_start` de tipo `date` en Postgres): sin hora, sin zona horaria.
// Así evitamos el bug clásico de que, por la diferencia con UTC, un domingo a
// la noche en Argentina ya "sea lunes" en el servidor de Vercel.
//
// Para hacer cuentas (sumar días, saber qué día de la semana es) convertimos
// a Date en UTC a medianoche, operamos y volvemos a texto.

/** Zona horaria del gimnasio: define cuál es "hoy". */
const GYM_TIME_ZONE = "America/Argentina/Buenos_Aires";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ¿Es una fecha real con formato YYYY-MM-DD? ("2026-02-30" no lo es). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Si la fecha no existe, Date la "corre" (30 de febrero → 2 de marzo) y no coincide.
  return toIso(toUtcDate(value)) === value;
}

/** Suma (o resta, con n negativo) días a una fecha. */
export function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function isMonday(iso: string): boolean {
  return toUtcDate(iso).getUTCDay() === 1;
}

/** Lunes de la semana de una fecha. Las semanas van de lunes a domingo. */
export function mondayOf(iso: string): string {
  // getUTCDay: 0 = domingo, 1 = lunes … 6 = sábado.
  // (día + 6) % 7 = cuántos días pasaron desde el lunes (domingo → 6).
  const daysSinceMonday = (toUtcDate(iso).getUTCDay() + 6) % 7;
  return addDays(iso, -daysSinceMonday);
}

/** "Hoy" en Argentina, como YYYY-MM-DD. */
export function todayInGym(now: Date = new Date()): string {
  // El formato "en-CA" de Intl da justo YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Lunes de la semana actual (en Argentina). */
export function currentMonday(now: Date = new Date()): string {
  return mondayOf(todayInGym(now));
}

/**
 * Rango legible de una semana, para el encabezado:
 *   "2026-10-19" → "19 – 25 oct 2026"
 *   "2026-09-28" → "28 sep – 4 oct 2026"
 */
export function formatWeekRange(monday: string): string {
  const start = toUtcDate(monday);
  const end = toUtcDate(addDays(monday, 6));
  const endText = `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;

  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()} – ${endText}`;
  }
  return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${endText}`;
}
