export type SquadStatus = "start" | "off" | "on";

export interface SquadPlayer {
  name: string;
  status: SquadStatus;
  minute: string | null;
}

export interface Card {
  name: string;
  type: "yellow" | "red";
  minute: string;
}

export interface Match {
  id: number;
  sezon: string;
  kolejka: string;
  /** Dzień w roku w formacie "dd.mm." */
  data: string;
  rok: number | null;
  liga: string;
  miejsce: string;
  przeciwnik: string;
  wynik: string | null;
  strzelcy: string | null;
  frekwencja: number | null;
  /** Data w formacie ISO "rrrr-mm-dd" */
  fullDate: string;
  golPrzeciwnika: string | null;
  skladArka: SquadPlayer[];
  skladPrzeciwnika: SquadPlayer[];
  sedzia: string | null;
  kartkiArka: Card[];
  kartkiPrzeciwnik: Card[];
  /** Bramki Arki (pierwsza liczba wyniku) */
  goalsFor: number | null;
  /** Bramki rywala (druga liczba wyniku) */
  goalsAgainst: number | null;
  /** Złączone, zapisane małymi literami nazwiska z obu składów – do wyszukiwania */
  squadSearch: string;
  /** Nazwa historyczna/sponsorska rywala w tym konkretnym meczu */
  historicalName?: string | null;
}

export type LogoMapping = Record<string, string | null>;

export interface Filters {
  season: string;
  opponent: string;
  league: string;
  wynik: string;
  result: string;
  place: string;
  referee: string;
  player: string;
  scorer: string;
  goal_minute: string;
  kolejka: string;
  date: string;
  from_date: string;
  to_date: string;
  rok: string;
  sort_order: "asc" | "desc";
}

export const FILTER_KEYS: (keyof Filters)[] = [
  "season",
  "opponent",
  "league",
  "wynik",
  "result",
  "place",
  "referee",
  "player",
  "scorer",
  "goal_minute",
  "kolejka",
  "date",
  "from_date",
  "to_date",
  "rok",
  "sort_order",
];
