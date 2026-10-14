export const fmtInt = (n: number | null | undefined) => (n === null || n === undefined ? "–" : n.toLocaleString("pl-PL"));

export const pct = (part: number, total: number) => (total > 0 ? ((part / total) * 100).toFixed(1) : "0.0");

export const avg = (part: number, total: number) => (total > 0 ? (part / total).toFixed(2) : "0.00");

/** "2017-05-21" -> "21.05.2017" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso || iso.length < 10) return iso ?? "–";
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Polska odmiana: 1 mecz, 2 mecze, 5 meczów */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}

const NUMERAL_WORDS: Record<number, string> = {
  4: "Czterech",
  5: "Pięciu",
  6: "Sześciu",
  7: "Siedmiu",
  8: "Ośmiu",
  9: "Dziewięciu",
  10: "Dziesięciu",
};

export function playersWord(n: number): string {
  return `${NUMERAL_WORDS[n] ?? n} graczy`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
