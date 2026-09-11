// Fechas operativas del sistema. La operación de IT GPS APP se expresa en
// la zona horaria configurada para Colombia, independientemente de la zona
// horaria del servidor donde corre Node/SQLite.
const TIME_ZONE = process.env.ITGPS_TIMEZONE || "America/Bogota";

export function todayISO(timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function currentMonthRange(timeZone = TIME_ZONE) {
  const today = todayISO(timeZone);
  const [year, month] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    desde: `${year}-${String(month).padStart(2, "0")}-01`,
    hasta: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  };
}

export const SYSTEM_TIME_ZONE = TIME_ZONE;
