// Session dates are shown in Paris time, like the dates matched by the search.
const TIME_ZONE = "Europe/Paris";

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const fullFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: TIME_ZONE });
const dayKeyFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: TIME_ZONE });

// "ven. 13 nov. 2026"
export const formatDay = (timestamp) => dayFormat.format(timestamp);

// "vendredi 13 novembre 2026 à 13:00", for tooltips.
export const formatFull = (timestamp) => fullFormat.format(timestamp);

// "13:00"
export const formatTime = (timestamp) => timeFormat.format(timestamp);

const dayNumber = (timestamp) => {
  const [day, month, year] = dayKeyFormat.format(timestamp).split("/").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
};

// Number of calendar days between two dates in Paris time: 0 the same day, 1 the next day...
export const dayOffset = (start, end) => dayNumber(end) - dayNumber(start);

// "45 min", "1 h 31", "26 h 05"
export const formatDuration = (start, end) => {
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
};
