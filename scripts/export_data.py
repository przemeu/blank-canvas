#!/usr/bin/env python3
"""
Eksport danych Kalendarium (SQLite -> JSON) + kopiowanie herbów.

Użycie (z katalogu głównego projektu):
    python scripts/export_data.py

Wynik:
    public/data/matches.json  – kompaktowy JSON ze wszystkimi meczami (< 500 KB)
    public/logos/*            – herby klubów + mapping.json

Format pliku matches.json (v2)
------------------------------
{
  "v": 2,
  "columns": [...],                 # nazwy kolumn wiersza
  "dicts":   {kolumna: [wartości]}, # słowniki wartości kategorycznych (wiersz trzyma indeks)
  "players": [...],                 # słownik nazwisk (składy + kartki)
  "rows":    [[...], ...]
}

* Kolumny słownikowe (sezon, kolejka, liga, miejsce, przeciwnik, sedzia) -> indeks w `dicts`.
* `data` / `rok` są null, jeśli da się je odtworzyć z `fullDate` (dd.mm. / rrrr).
* Składy: tokeny rozdzielone przecinkiem, nazwisko jako indeks base36 w `players`:
      "<id>"        – zawodnik wyjściowej jedenastki
      "<id>-<min>"  – zszedł w danej minucie
      "<id>+<min>"  – wszedł w danej minucie ("<id>+" = w minucie zejścia poprzednika)
* `fullDate` jako liczba rrrrmmdd; końcowe wartości null w wierszu są obcinane.
* Kartki: tokeny rozdzielone przecinkiem: "<y|r><minuta>.<id>"
"""
from __future__ import annotations

import json
import re
import shutil
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "Kalendarium.db"
OUT_JSON = ROOT / "public" / "data" / "matches.json"
OUT_LOGOS = ROOT / "public" / "logos"
LOGO_SOURCES = [ROOT / "static" / "logos", ROOT / "legacy" / "static" / "logos"]

COLUMNS = [
    "id", "sezon", "kolejka", "data", "rok", "liga", "miejsce", "przeciwnik",
    "wynik", "strzelcy", "frekwencja", "fullDate", "golPrzeciwnika",
    "skladArka", "skladPrzeciwnika", "sedzia", "kartkiArka", "kartkiPrzeciwnik",
]
DICT_COLUMNS = ["sezon", "kolejka", "liga", "miejsce", "przeciwnik", "sedzia"]

B36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def b36(n: int) -> str:
    if n == 0:
        return "0"
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = B36[r] + out
    return out


# --------------------------------------------------------------------------- #
# Czyszczenie wartości
# --------------------------------------------------------------------------- #
def clean_text(value):
    """Trim, drop empty/NULL markers and unescape stored \\' sequences."""
    if value is None:
        return None
    text = str(value).replace("\\'", "'").strip()
    if not text or text.upper() in {"NULL", "NONE"}:
        return None
    return text


def clean_attendance(value):
    if value is None:
        return None
    try:
        num = int(float(str(value).replace(" ", "").replace(",", ".")))
    except ValueError:
        return None
    return num if num > 0 else None


def clean_place(value):
    text = clean_text(value)
    if text in ("Neutralny", "Neutralne"):
        return "Neutralne"
    return text


REFEREE_MAPPINGS = {
    "Karol Arys": "Karol Arys (Szczecin)",
    "Łukasz Szczech": "Łukasz Szczech (Warszawa)",
    "Marcin Kochanek": "Marcin Kochanek (Opole)",
    "Paweł Malec": "Paweł Malec (Łódź)",
    "Piotr Rzucidlo": "Piotr Rzucidło (Warszawa)",
    "Piotr Rzucidło": "Piotr Rzucidło (Warszawa)",
    "Sylwester Rasmus": "Sylwester Rasmus (Toruń)",
    "Tomasz Marciniak": "Tomasz Marciniak (Płock)",
    "Tomasz Wajda": "Tomasz Wajda (Żywiec)",
}


def clean_referee(value):
    text = clean_text(value)
    if not text:
        return None
    return REFEREE_MAPPINGS.get(text, text)


# --------------------------------------------------------------------------- #
# Słowniki
# --------------------------------------------------------------------------- #
class Interner:
    def __init__(self) -> None:
        self.values: list = []
        self.index: dict = {}

    def get(self, value) -> int:
        if value not in self.index:
            self.index[value] = len(self.values)
            self.values.append(value)
        return self.index[value]


# --------------------------------------------------------------------------- #
# Składy – port funkcji process_squad z oryginalnej aplikacji Flask
# --------------------------------------------------------------------------- #
RE_OFF_OLD = re.compile(r"^(.*?)\s+(\d+)$")
RE_ON_OLD = re.compile(r"^(\d+)\s+(.*)$")
RE_OFF_NEW = re.compile(r"^(.*?)\s+\((\d+)'?\)$")


def process_squad(squad: str | None):
    if not squad:
        return []
    result = []
    last_off = None
    for player in squad.split(";"):
        player = player.strip()
        if not player:
            continue
        m_off_old = RE_OFF_OLD.match(player)
        m_on_old = RE_ON_OLD.match(player)
        m_off_new = RE_OFF_NEW.match(player)
        if m_off_old:
            name, minute = m_off_old.groups()
            result.append((name.strip(), "-", minute))
            last_off = minute
        elif m_on_old:
            minute, name = m_on_old.groups()
            result.append((name.strip(), "+", minute))
            last_off = None
        elif m_off_new:
            name, minute = m_off_new.groups()
            result.append((name.strip(), "-", minute))
            last_off = minute
        elif last_off:
            result.append((player, "+", last_off))
            last_off = None
        else:
            result.append((player, "", None))
    return result


def encode_squad(squad: str | None, players: Interner):
    entries = process_squad(squad)
    if not entries:
        return None
    tokens = []
    prev_off = None
    for name, status, minute in entries:
        tok = b36(players.get(name))
        if status == "+" and minute == prev_off:
            tok += "+"  # minuta wejścia = minuta zejścia poprzedniego zawodnika
        elif status:
            tok += status + minute
        prev_off = minute if status == "-" else None
        tokens.append(tok)
    return ",".join(tokens)


def encode_cards(raw, players: Interner):
    if not raw:
        return None
    try:
        cards = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
    tokens = []
    for c in cards if isinstance(cards, list) else []:
        if not isinstance(c, dict):
            continue
        kind = "r" if c.get("type") == "red" else "y"
        minute = re.sub(r"[^0-9+]", "", str(c.get("minute") or ""))
        name = str(c.get("name") or "").strip()
        tokens.append(f"{kind}{minute}.{b36(players.get(name))}")
    return ",".join(tokens) or None


def derivable_day(data, full_date):
    if not data or not full_date or len(full_date) < 10:
        return False
    return data == f"{full_date[8:10]}.{full_date[5:7]}."


# --------------------------------------------------------------------------- #
# Eksport
# --------------------------------------------------------------------------- #
def export_matches() -> None:
    if not DB_PATH.exists():
        sys.exit(f"Nie znaleziono bazy: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM Mecze ORDER BY `Full date` ASC, ID ASC").fetchall()
    conn.close()

    dicts = {col: Interner() for col in DICT_COLUMNS}
    players = Interner()

    def d(col, value):
        return None if value is None else dicts[col].get(value)

    out_rows = []
    for r in rows:
        score = clean_text(r["Wynik"])
        if score:
            score = re.sub(r"\s+", "", score)
        full_date = clean_text(r["Full date"])
        data = clean_text(r["Data"])
        rok = r["Rok"]
        if derivable_day(data, full_date):
            data = None
        if full_date and rok is not None and str(rok) == full_date[:4]:
            rok = None

        out_rows.append([
            r["ID"],
            d("sezon", clean_text(r["Sezon"])),
            d("kolejka", clean_text(r["Kolejka"])),
            data,
            rok,
            d("liga", clean_text(r["Liga"])),
            d("miejsce", clean_place(r["Miejsce"])),
            d("przeciwnik", clean_text(r["Przeciwnik"])),
            score,
            clean_text(r["Strzelcy"]),
            clean_attendance(r["Frekwencja"]),
            int(full_date.replace("-", "")) if full_date and re.fullmatch(r"\d{4}-\d{2}-\d{2}", full_date) else full_date,
            clean_text(r["gol_przeciwnika"]),
            encode_squad(clean_text(r["sklad_arka"]), players),
            encode_squad(clean_text(r["sklad_przeciwnika"]), players),
            d("sedzia", clean_referee(r["sedzia"])),
            encode_cards(r["kartki_arka"], players),
            encode_cards(r["kartki_przeciwnik"], players),
        ])
        while out_rows[-1] and out_rows[-1][-1] is None:
            out_rows[-1].pop()  # obcięcie końcowych wartości null

    payload = {
        "v": 2,
        "columns": COLUMNS,
        "dicts": {col: it.values for col, it in dicts.items()},
        "players": players.values,
        "rows": out_rows,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUT_JSON.stat().st_size / 1024
    print(f"Zapisano {len(out_rows)} meczów -> {OUT_JSON.relative_to(ROOT)} ({size_kb:.0f} KB)")


def copy_logos() -> None:
    src = next((p for p in LOGO_SOURCES if p.exists()), None)
    if src is None:
        print("Brak katalogu z herbami – pomijam kopiowanie.")
        return
    OUT_LOGOS.mkdir(parents=True, exist_ok=True)
    count = 0
    for item in src.iterdir():
        if item.is_file():
            shutil.copy2(item, OUT_LOGOS / item.name)
            count += 1
    print(f"Skopiowano {count} plików z {src.relative_to(ROOT)} -> {OUT_LOGOS.relative_to(ROOT)}")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    export_matches()
    copy_logos()
