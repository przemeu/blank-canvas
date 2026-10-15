/**
 * Funkcje parsujące – port logiki z oryginalnej aplikacji Flask (app.py).
 */

export const CUP_CODES = ["PP", "PL", "PE", "SP", "B", "B1", "B2"];

export function parseScore(score: string | null | undefined): [number, number] | null {
  if (!score) return null;
  const m = /(\d+)\s*:\s*(\d+)/.exec(score);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
}

export function seasonStartYear(season: string | null | undefined): number | null {
  if (!season) return null;
  const n = parseInt(String(season).split("/")[0], 10);
  return Number.isNaN(n) ? null : n;
}

export function isPost2008(season: string | null | undefined): boolean {
  const y = seasonStartYear(season);
  return y !== null && y >= 2008;
}

/** Czytelna nazwa rozgrywek dla danego sezonu (reforma lig w 2008 r.). */
export function friendlyLeagueName(league: string | null | undefined, season: string | null | undefined): string {
  if (!league) return "";
  const post = isPost2008(season);
  const leagues: Record<string, string> = post
    ? { I: "Ekstraklasa", II: "I liga", III: "II liga", IV: "III liga", V: "IV liga", VI: "V liga" }
    : { I: "I liga", II: "II liga", III: "III liga", IV: "IV liga", V: "V liga", VI: "VI liga" };
  const cups: Record<string, string> = {
    PP: "Puchar Polski",
    PL: "Puchar Ligi",
    PE: "Puchar Ekstraklasy",
    SP: "Superpuchar",
    B: "Baraże",
  };
  return leagues[league] ?? cups[league] ?? league;
}

/** Etykieta kodu ligi do listy rozwijanej (niezależna od sezonu). */
export function leagueOptionLabel(code: string): string {
  const labels: Record<string, string> = {
    I: "1. poziom – Ekstraklasa / I liga",
    II: "2. poziom – I liga / II liga",
    III: "3. poziom – II liga / III liga",
    IV: "4. poziom – III liga / IV liga",
    PP: "Puchar Polski",
    PL: "Puchar Ligi",
    PE: "Puchar Ekstraklasy",
    SP: "Superpuchar",
    B: "Baraże",
  };
  return labels[code] ?? code;
}

/**
 * Etykieta sędziego do listy rozwijanej z nazwiskiem na początku:
 * "Tomasz Wajda (Żywiec)" -> "Wajda Tomasz (Żywiec)"
 * Dzięki temu wpisanie litery na klawiaturze przenosi do pierwszego sędziego z nazwiskiem na tę literę.
 */
export function refereeOptionLabel(ref: string): string {
  if (!ref) return "";
  const match = /^(.*?)\s*\((.*?)\)$/.exec(ref.trim());
  const fullName = match ? match[1].trim() : ref.trim();
  const city = match ? match[2].trim() : null;

  const parts = fullName.split(/\s+/);
  if (parts.length >= 2) {
    const surname = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1).join(" ");
    const formatted = `${surname} ${firstNames}`;
    return city ? `${formatted} (${city})` : formatted;
  }

  return ref;
}

export const LEAGUE_ORDER = ["I", "II", "III", "IV", "V", "VI", "PP", "PL", "PE", "SP", "B"];

/** Krótka etykieta kolejki do tabeli. */
export function roundLabel(kolejka: string): string {
  const map: Record<string, string> = { PP: "PP", PL: "PL", PE: "PE", SP: "SP", B: "Baraż", B1: "Baraż 1", B2: "Baraż 2" };
  return map[kolejka] ?? kolejka;
}

export function isNumericRound(kolejka: string): boolean {
  return /^\d+$/.test(kolejka);
}

/**
 * Parsuje filtr kolejki:
 *  - pojedyncza kolejka: "5" lub "PP"
 *  - lista: "1, 3, 7" (separatory: przecinek, średnik, "lub", "i", "or")
 *  - zakres: "21-34"
 *  - kombinacje: "1, 3, 21-34, PP"
 */
export function parseKolejkaFilter(raw: string): string[] {
  if (!raw) return [];
  const cleaned = raw.replace(/\b(?:lub|or|i)\b/gi, ",").replace(/;/g, ",");
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const range = /^(\d+)\s*[-–—]\s*(\d+)$/.exec(part);
    if (range) {
      let a = parseInt(range[1], 10);
      let b = parseInt(range[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let n = a; n <= b && n - a < 500; n++) out.push(String(n));
    } else {
      const up = part.toUpperCase();
      out.push(up);
      if (up === "B") out.push("B1", "B2");
    }
  }
  return Array.from(new Set(out));
}

/* ------------------------------------------------------------------------ */
/* Strzelcy                                                                 */
/* ------------------------------------------------------------------------ */

const L = "\\p{L}";
/** " 38", " 55k", " 82 (k)", " 9s)", " 90'" na końcu tekstu */
const MINUTE_TAIL = new RegExp(`\\s+(\\d+)\\s*(\\(?[${L}']+\\)?|')?$`, "u");
const JUST_MINUTE = new RegExp(`^\\d+\\s*(\\(?[${L}']+\\)?|')?$`, "u");

export const OWN_GOAL_QUERY = "s)";
const OWN_GOAL_ALIASES = ["bramki samobójcze", "samobójcze", "samobój", "samobójcza", "samobojcze", "s)"];

export function normalizeScorerQuery(q: string): string {
  return OWN_GOAL_ALIASES.includes(q.trim().toLowerCase()) ? OWN_GOAL_QUERY : q;
}

function isNotePart(part: string, maxLen: number): boolean {
  return (
    (part.startsWith("(") && part.endsWith(")")) ||
    /\b\d*s\)?$/.test(part) ||
    part.includes("(s)") ||
    part.toLowerCase() === "walkower" ||
    part.length > maxLen
  );
}

/** Lista nazwisk strzelców (po jednym wpisie na każdą bramkę) – do statystyk. */
export function extractScorerNames(scorers: string | null): string[] {
  if (!scorers) return [];
  const names: string[] = [];
  let last: string | null = null;
  for (const raw of scorers.split(";")) {
    const part = raw.trim();
    if (!part) continue;
    if (part.startsWith("(") && part.endsWith(")")) {
      last = null;
      continue;
    }
    if (JUST_MINUTE.test(part)) {
      // sama minuta – kolejna bramka poprzedniego strzelca
      if (last) names.push(last);
      continue;
    }
    const m = MINUTE_TAIL.exec(part);
    if (!m && isNotePart(part, 25)) {
      last = null;
      continue;
    }
    const name = (m ? part.slice(0, m.index) : part).replace(/^\(+|\)+$/g, "").trim();
    if (name) {
      names.push(name);
      last = name;
    }
  }
  return names;
}

export type ScorerToken =
  | { type: "player"; text: string; scorer: string }
  | { type: "minute"; text: string; minute: string }
  | { type: "text"; text: string };

/** Tokeny do wyświetlenia klikalnej kolumny "Strzelcy" (port process_scorers_html). */
export function scorerTokens(scorers: string | null): ScorerToken[] {
  if (!scorers) return [];
  const tokens: ScorerToken[] = [];
  const parts = scorers.split(";");
  let first = true;
  const sep = () => {
    if (!first) tokens.push({ type: "text", text: "; " });
    first = false;
  };

  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;

    const ownWithMin = /^\((.*?)\s+(\d+)s\)$/.exec(part);
    if (ownWithMin) {
      sep();
      tokens.push({ type: "text", text: "(" });
      tokens.push({ type: "player", text: ownWithMin[1], scorer: OWN_GOAL_QUERY });
      tokens.push({ type: "text", text: " " });
      tokens.push({ type: "minute", text: `${ownWithMin[2]}s`, minute: ownWithMin[2] });
      tokens.push({ type: "text", text: ")" });
      continue;
    }

    const ownNoMin = /^\((.*?)\s+s\)$/.exec(part);
    if (ownNoMin) {
      sep();
      tokens.push({ type: "text", text: "(" });
      tokens.push({ type: "player", text: ownNoMin[1], scorer: OWN_GOAL_QUERY });
      tokens.push({ type: "text", text: " s)" });
      continue;
    }

    if (isNotePart(part, 30)) {
      sep();
      tokens.push({ type: "text", text: part });
      continue;
    }

    if (JUST_MINUTE.test(part)) {
      const digits = /\d+/.exec(part)![0];
      sep();
      tokens.push({ type: "minute", text: part, minute: digits });
      continue;
    }

    const m = MINUTE_TAIL.exec(part);
    const namePart = m ? part.slice(0, m.index).trim() : part;
    const minutePart = m ? part.slice(m.index).trim() : null;
    const nameClean = namePart.replace(/^\(+|\)+$/g, "");
    sep();
    tokens.push({ type: "player", text: namePart, scorer: nameClean });
    if (minutePart && m) {
      tokens.push({ type: "text", text: " " });
      tokens.push({ type: "minute", text: minutePart, minute: m[1] });
    }
  }
  return tokens;
}

/* ------------------------------------------------------------------------ */
/* Oś czasu meczu                                                           */
/* ------------------------------------------------------------------------ */

export type TimelineType = "goal" | "penalty" | "own_goal" | "card_yellow" | "card_red";

export interface TimelineEvent {
  minute: string;
  type: TimelineType;
  player: string;
  isHome: boolean;
}

const GOAL_TAIL = /\s+(\d+(?:\+\d+)?)\s*(?:\(?(k|s)\)?|')?$/i;
const OWN_INNER = /^(?:(.*?)\s+)?(\d+(?:\+\d+)?)?s$/;

export function parseGoalEvents(goals: string | null, isHome: boolean): TimelineEvent[] {
  if (!goals) return [];
  const events: TimelineEvent[] = [];
  let last = "";
  for (const raw of goals.split(";")) {
    let part = raw.trim();
    if (!part) continue;

    let own = false;
    if (part.startsWith("(") && part.endsWith(")")) {
      const inner = part.slice(1, -1).trim();
      const om = OWN_INNER.exec(inner);
      if (!om) continue; // notatka informacyjna (dogrywka, karne, stadion...)
      own = true;
      events.push({ minute: om[2] ?? "", type: "own_goal", player: (om[1] ?? "").trim(), isHome });
      continue;
    }
    if (part.toLowerCase() === "walkower") continue;

    if (/^\d+(?:\+\d+)?\s*(?:\(?k\)?|')?$/i.test(part)) {
      // sama minuta – kolejna bramka poprzedniego strzelca
      const min = /\d+(?:\+\d+)?/.exec(part)![0];
      events.push({ minute: min, type: /k/i.test(part) ? "penalty" : "goal", player: last, isHome });
      continue;
    }

    const m = GOAL_TAIL.exec(part);
    let minute = "";
    let penalty = false;
    if (m) {
      minute = m[1];
      const suffix = (m[2] ?? "").toLowerCase();
      penalty = suffix === "k";
      own = suffix === "s";
      part = part.slice(0, m.index).trim();
    } else if (part.length > 30) {
      continue;
    }
    last = part;
    events.push({ minute, type: own ? "own_goal" : penalty ? "penalty" : "goal", player: part, isHome });
  }
  return events;
}

export function minuteValue(minute: string): number {
  const s = minute.replace(/'/g, "").trim();
  if (!s) return 999;
  const parts = s.split("+").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return 999;
  // 45+2 sortuje się przed 46
  return parts[0] + (parts[1] ?? 0) * 0.01;
}
