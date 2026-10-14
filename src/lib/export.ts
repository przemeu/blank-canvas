import type { Match, SquadPlayer } from "./types";
import { friendlyLeagueName } from "./parsing";

function squadToText(squad: SquadPlayer[]): string {
  return squad
    .map((p) => (p.status === "off" ? `${p.name} (↓${p.minute}')` : p.status === "on" ? `${p.name} (↑${p.minute}')` : p.name))
    .join("; ");
}

/** Eksport listy meczów do pliku .xlsx w przeglądarce (biblioteka ładowana na żądanie). */
export async function exportMatchesToXlsx(matches: Match[], filename: string): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = matches.map((m, i) => ({
    "#": i + 1,
    Sezon: m.sezon,
    Kolejka: m.kolejka,
    Data: m.fullDate,
    Rok: m.rok,
    Liga: friendlyLeagueName(m.liga, m.sezon),
    Miejsce: m.miejsce,
    Przeciwnik: m.przeciwnik,
    Wynik: m.wynik ?? "",
    Strzelcy: m.strzelcy ?? "",
    "Gole przeciwnika": m.golPrzeciwnika ?? "",
    Frekwencja: m.frekwencja ?? "",
    Sędzia: m.sedzia ?? "",
    "Skład Arki": squadToText(m.skladArka),
    "Skład przeciwnika": squadToText(m.skladPrzeciwnika),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 }, { wch: 9 }, { wch: 8 }, { wch: 11 }, { wch: 6 }, { wch: 18 }, { wch: 10 }, { wch: 26 },
    { wch: 7 }, { wch: 40 }, { wch: 30 }, { wch: 11 }, { wch: 28 }, { wch: 60 }, { wch: 60 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mecze");
  XLSX.writeFile(wb, filename);
}
