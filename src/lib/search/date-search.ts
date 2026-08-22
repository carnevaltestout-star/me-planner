// Lets a search box match a record's date in more than just the locale
// display format — typed digit shorthand (DD.MM, DD.MM.YY, DD.MM.YYYY,
// MM.YY, MM.YYYY) and month names/abbreviations (e.g. "aug", "august"),
// alongside a bare 4-digit year. Shared by every feature that surfaces a
// dated record's date in its search (Principles, and others below).
const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function matchesDateQuery(date: Date, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return false;

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Month name or abbreviation, e.g. "aug" / "august"
  if (/^[a-z]+$/.test(query) && MONTH_NAMES[date.getMonth()].startsWith(query)) return true;

  // Bare 4-digit year, e.g. "2026"
  if (/^\d{4}$/.test(query) && Number(query) === year) return true;

  const parts = query.split(".").filter(Boolean);
  if (parts.length === 2 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts;
    if (b.length === 4) {
      // MM.YYYY
      if (Number(a) === month && Number(b) === year) return true;
    } else {
      // DD.MM
      const d = Number(a);
      const m = Number(b);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && d === day && m === month) return true;
      // MM.YY (assumes 20YY)
      const mm = Number(a);
      const yy = Number(b);
      if (mm >= 1 && mm <= 12 && 2000 + yy === year && mm === month) return true;
    }
  } else if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p))) {
    // DD.MM.YY or DD.MM.YYYY
    const [d, m, y] = parts;
    const yearNum = y.length === 2 ? 2000 + Number(y) : Number(y);
    if (Number(d) === day && Number(m) === month && yearNum === year) return true;
  }

  return false;
}
