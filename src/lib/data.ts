import type { Card, Match, SquadPlayer } from "./types";
import { parseScore } from "./parsing";

interface RawPayload {
  v: number;
  columns: string[];
  dicts: Record<string, string[]>;
  players: string[];
  rows: unknown[][];
}

const DICT_COLUMNS = ["sezon", "kolejka", "liga", "miejsce", "przeciwnik", "sedzia"];

function decodeSquad(encoded: unknown, players: string[]): SquadPlayer[] {
  if (typeof encoded !== "string" || !encoded) return [];
  const result: SquadPlayer[] = [];
  let prevOff: string | null = null;
  for (const tok of encoded.split(",")) {
    const m = /^([0-9a-z]+)(?:([+-])(\d*))?$/.exec(tok);
    if (!m) continue;
    const name = players[parseInt(m[1], 36)] ?? "?";
    if (m[2] === "-") {
      result.push({ name, status: "off", minute: m[3] || null });
      prevOff = m[3] || null;
    } else if (m[2] === "+") {
      result.push({ name, status: "on", minute: m[3] || prevOff });
      prevOff = null;
    } else {
      result.push({ name, status: "start", minute: null });
      prevOff = null;
    }
  }
  return result;
}

function decodeCards(encoded: unknown, players: string[]): Card[] {
  if (typeof encoded !== "string" || !encoded) return [];
  const cards: Card[] = [];
  for (const tok of encoded.split(",")) {
    const m = /^([yr])([0-9+]*)\.([0-9a-z]+)$/.exec(tok);
    if (!m) continue;
    cards.push({ type: m[1] === "r" ? "red" : "yellow", minute: m[2], name: players[parseInt(m[3], 36)] ?? "" });
  }
  return cards;
}

function decodeDate(v: unknown): string {
  if (typeof v === "number") {
    const s = String(v);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return typeof v === "string" ? v : "";
}

export function decodePayload(payload: RawPayload): Match[] {
  const idx = Object.fromEntries(payload.columns.map((c, i) => [c, i])) as Record<string, number>;
  const { dicts, players } = payload;

  return payload.rows.map((row) => {
    const get = (col: string): unknown => {
      const v = row[idx[col]];
      if (v === undefined || v === null) return null;
      if (DICT_COLUMNS.includes(col) && typeof v === "number") return dicts[col][v];
      return v;
    };
    const str = (col: string) => {
      const v = get(col);
      return v === null ? null : String(v);
    };

    const fullDate = decodeDate(get("fullDate"));
    const data = str("data") ?? (fullDate ? `${fullDate.slice(8, 10)}.${fullDate.slice(5, 7)}.` : "");
    const rokRaw = get("rok");
    const rok = rokRaw !== null ? Number(rokRaw) : fullDate ? parseInt(fullDate.slice(0, 4), 10) : null;
    const wynik = str("wynik");
    const score = parseScore(wynik);
    const skladArka = decodeSquad(get("skladArka"), players);
    const skladPrzeciwnika = decodeSquad(get("skladPrzeciwnika"), players);

    return {
      id: Number(get("id")),
      sezon: str("sezon") ?? "",
      kolejka: str("kolejka") ?? "",
      data,
      rok,
      liga: str("liga") ?? "",
      miejsce: str("miejsce") ?? "",
      przeciwnik: str("przeciwnik") ?? "",
      wynik,
      strzelcy: str("strzelcy"),
      frekwencja: (get("frekwencja") as number | null) ?? null,
      fullDate,
      golPrzeciwnika: str("golPrzeciwnika"),
      skladArka,
      skladPrzeciwnika,
      sedzia: str("sedzia"),
      kartkiArka: decodeCards(get("kartkiArka"), players),
      kartkiPrzeciwnik: decodeCards(get("kartkiPrzeciwnik"), players),
      goalsFor: score ? score[0] : null,
      goalsAgainst: score ? score[1] : null,
      squadSearch: [...skladArka, ...skladPrzeciwnika].map((p) => p.name).join("|").toLowerCase(),
      historicalName: str("historicalName"),
    } satisfies Match;
  });
}

export async function loadMatches(): Promise<Match[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/matches.json`);
  if (!res.ok) throw new Error(`Nie udało się wczytać danych (${res.status})`);
  return decodePayload((await res.json()) as RawPayload);
}

export async function loadLogoMapping(): Promise<Record<string, string | null>> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}logos/mapping.json`);
    if (!res.ok) return {};
    return (await res.json()) as Record<string, string | null>;
  } catch {
    return {};
  }
}
