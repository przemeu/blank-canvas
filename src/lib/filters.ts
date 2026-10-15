import type { Filters, Match } from "./types";
import { ALL_LEAGUES_CODE, isLeagueCode, normalizeScorerQuery, parseKolejkaFilter } from "./parsing";

export const EMPTY_FILTERS: Filters = {
  season: "",
  opponent: "",
  league: "",
  wynik: "",
  result: "",
  place: "",
  referee: "",
  player: "",
  scorer: "",
  goal_minute: "",
  kolejka: "",
  date: "",
  from_date: "",
  to_date: "",
  rok: "",
  sort_order: "asc",
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "2017/05" -> "2017-05-01" (od) / "2017-05-31" (do); "2017" -> cały rok. */
function normalizeBoundary(value: string, end: boolean): string | null {
  const v = value.trim().replace(/[./]/g, "-");
  const parts = v.split("-").filter(Boolean);
  if (!parts.length || !/^\d{4}$/.test(parts[0])) return null;
  const y = parts[0];
  const m = parts[1] ? parts[1].padStart(2, "0") : end ? "12" : "01";
  const d = parts[2] ? parts[2].padStart(2, "0") : end ? "31" : "01";
  return `${y}-${m}-${d}`;
}

/** Normalizuje "9.7", "09/07", "09.07." -> "09.07" */
function normalizeDayOfYear(value: string): string {
  const parts = value
    .trim()
    .replace(/[/-]/g, ".")
    .split(".")
    .filter(Boolean);
  return parts.map((p) => (/^\d$/.test(p) ? `0${p}` : p)).join(".");
}

export function applyFilters(matches: Match[], f: Filters): Match[] {
  const scorerQ = f.scorer.trim() ? normalizeScorerQuery(f.scorer.trim()).toLowerCase() : "";
  const playerQ = f.player.trim().toLowerCase();
  const exact = f.result.trim().replace(/\s/g, "").replace(/-/g, ":");
  const minuteDigits = /\d+/.exec(f.goal_minute)?.[0];
  const minuteRe = minuteDigits ? new RegExp(`(?:\\s|^)${minuteDigits}(?:k|s|'|;|\\s|\\)|$)`, "i") : null;
  const kolejki = f.kolejka.trim() ? new Set(parseKolejkaFilter(f.kolejka)) : null;
  const day = f.date.trim() ? normalizeDayOfYear(f.date) : "";
  const from = f.from_date.trim() ? normalizeBoundary(f.from_date, false) : null;
  const to = f.to_date.trim() ? normalizeBoundary(f.to_date, true) : null;
  const playerRe = playerQ ? new RegExp(escapeRegex(playerQ)) : null;

  return matches.filter((m) => {
    if (f.season && m.sezon !== f.season) return false;
    if (f.opponent && m.przeciwnik !== f.opponent) return false;
    if (f.league) {
      if (f.league === ALL_LEAGUES_CODE || f.league.toUpperCase() === "LIGA" || f.league === "Mecze ligowe" || f.league === "mecze-ligowe") {
        if (!isLeagueCode(m.liga)) return false;
      } else if (m.liga !== f.league) {
        return false;
      }
    }
    if (f.place && m.miejsce !== f.place) return false;
    if (f.referee && m.sedzia !== f.referee && !m.sedzia?.startsWith(f.referee + " (")) return false;
    if (f.rok && String(m.rok) !== f.rok.trim()) return false;

    if (f.wynik) {
      if (m.goalsFor === null || m.goalsAgainst === null) return false;
      if (f.wynik === "Wygrana" && !(m.goalsFor > m.goalsAgainst)) return false;
      if (f.wynik === "Remis" && m.goalsFor !== m.goalsAgainst) return false;
      if (f.wynik === "Porażka" && !(m.goalsFor < m.goalsAgainst)) return false;
    }
    if (exact && m.wynik !== exact) return false;

    if (scorerQ) {
      const a = (m.strzelcy ?? "").toLowerCase();
      const b = (m.golPrzeciwnika ?? "").toLowerCase();
      if (!a.includes(scorerQ) && !b.includes(scorerQ)) return false;
    }
    if (playerRe && !playerRe.test(m.squadSearch)) return false;
    if (minuteRe && !minuteRe.test(m.strzelcy ?? "")) return false;
    if (kolejki && !kolejki.has(m.kolejka.toUpperCase())) return false;
    if (day && !m.data.startsWith(`${day}.`)) return false;
    if (from && m.fullDate < from) return false;
    if (to && m.fullDate > to) return false;
    return true;
  });
}

export function sortMatches(matches: Match[], order: "asc" | "desc"): Match[] {
  const dir = order === "desc" ? -1 : 1;
  return [...matches].sort((a, b) => {
    if (a.fullDate !== b.fullDate) return a.fullDate < b.fullDate ? -dir : dir;
    return (a.id - b.id) * dir;
  });
}

export function filtersFromParams(params: URLSearchParams): Filters {
  const f: Filters = { ...EMPTY_FILTERS };
  for (const key of Object.keys(EMPTY_FILTERS) as (keyof Filters)[]) {
    const v = params.get(key);
    if (v === null || v === "None") continue;
    if (key === "sort_order") {
      f.sort_order = v === "desc" ? "desc" : "asc";
    } else if (key === "league" && (v.toUpperCase() === "LIGA" || v === "Mecze ligowe" || v === "mecze-ligowe")) {
      f.league = ALL_LEAGUES_CODE;
    } else {
      f[key] = v;
    }
  }
  return f;
}

export function countActiveFilters(f: Filters): number {
  return (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).filter((k) => k !== "sort_order" && f[k]).length;
}
