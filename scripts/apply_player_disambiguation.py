#!/usr/bin/env python3
"""
Migracja bazy Kalendarium.db – ujednoznacznienie zawodników o takich samych imionach i nazwiskach:
1. Zawodnicy rywali vs Zawodnicy Arki:
   - Piłkarz Arki pozostaje czysty ("Imię Nazwisko")
   - Piłkarz rywala otrzymuje pozycję w nawiasie ("Imię Nazwisko (pozycja)")
2. Zawodnicy rywali vs Zawodnicy rywali:
   - Wyróżnienie numeracją rzymską wg chronologii debiutu ("Imię Nazwisko I", "Imię Nazwisko II")
"""
import json
import re
import shutil
import sqlite3
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "Kalendarium.db"
BAK_PATH = ROOT / "Kalendarium.db.bak"

RE_OFF_OLD = re.compile(r"^(.*?)\s+(\d+)'?$")
RE_ON_OLD = re.compile(r"^(\d+)'?\s+(.*)$")
RE_OFF_NEW = re.compile(r"^(.*?)\s+\((\d+)'?\)$")

def replace_player_in_squad(squad: str | None, old_name: str, new_name: str) -> str | None:
    if not squad or old_name not in squad:
        return squad
    tokens = [t.strip() for t in squad.split(";")]
    new_tokens = []
    for t in tokens:
        if not t:
            continue
        m_new = RE_OFF_NEW.match(t)
        m_off = RE_OFF_OLD.match(t)
        m_on = RE_ON_OLD.match(t)
        if m_new and m_new.group(1).strip() == old_name:
            new_tokens.append(f"{new_name} ({m_new.group(2)}')")
        elif m_off and m_off.group(1).strip() == old_name:
            new_tokens.append(f"{new_name} {m_off.group(2)}")
        elif m_on and m_on.group(2).strip() == old_name:
            new_tokens.append(f"{m_on.group(1)} {new_name}")
        elif t == old_name:
            new_tokens.append(new_name)
        else:
            new_tokens.append(t)
    return "; ".join(new_tokens)

def replace_player_in_goals(goals: str | None, old_name: str, new_name: str) -> str | None:
    if not goals or old_name not in goals:
        return goals
    # Replace old_name with new_name
    return goals.replace(old_name, new_name)

def replace_player_in_cards(cards_raw: str | None, old_name: str, new_name: str) -> str | None:
    if not cards_raw or old_name not in cards_raw:
        return cards_raw
    try:
        cards = json.loads(cards_raw)
        if isinstance(cards, list):
            changed = False
            for c in cards:
                if isinstance(c, dict) and c.get("name") == old_name:
                    c["name"] = new_name
                    changed = True
            if changed:
                return json.dumps(cards, ensure_ascii=False)
    except Exception:
        pass
    return cards_raw


# Definicje ujednoznacznień:
# Każdy wpis to krotka: (old_name, new_name, match_filter_func)
# match_filter_func(id, full_date, opponent) -> bool

RULES = [
    # ---------------- Arka vs Opponent (pozycja dla rywala) ----------------
    (
        "Krzysztof Kamiński",
        "Krzysztof Kamiński (bramkarz)",
        lambda mid, d, opp: mid in {803, 825, 868, 1140, 15439} or (d and d >= "2010" and opp in {"Wisła Płock", "Ruch Chorzów", "Pogoń Szczecin"})
    ),
    (
        "Marcin Komorowski",
        "Marcin Komorowski (obrońca)",
        lambda mid, d, opp: mid in {699, 727, 732, 766, 772, 781, 787} or (d and d >= "2008" and opp in {"Polonia Bytom", "Legia Warszawa", "Polonia Warszawa"})
    ),
    (
        "Michał Nalepa",
        "Michał Nalepa (obrońca)",
        lambda mid, d, opp: mid in {795, 817, 838, 853, 1059, 1082, 1095, 1099, 1121, 15445} or (opp in {"Ruch Radzionków", "Bruk-Bet Termalica Nieciecza", "Lechia Gdańsk", "Zagłębie Lubin"}) or (mid == 1095)
    ),
    (
        "Krzysztof Sobieraj",
        "Krzysztof Sobieraj (Bałtyk Gdynia)",
        lambda mid, d, opp: mid in {15701, 15718, 15734, 15751, 15780, 15797} or (opp and "Bałtyk" in opp and d and "1992" <= d[:4] <= "1995")
    ),

    # ---------------- Opponent vs Opponent (numery rzymskie) ----------------
    # 1. Maciej Żurawski
    (
        "Maciej Żurawski",
        "Maciej Żurawski I",
        lambda mid, d, opp: d and d < "2020" and "Wisła" in opp
    ),
    (
        "Maciej Żurawski",
        "Maciej Żurawski II",
        lambda mid, d, opp: d and d >= "2020" and "Warta" in opp
    ),

    # 2. Michał Wróbel
    (
        "Michał Wróbel",
        "Michał Wróbel I",
        lambda mid, d, opp: d and d < "1990" and "Wisła" in opp
    ),
    (
        "Michał Wróbel",
        "Michał Wróbel II",
        lambda mid, d, opp: d and d >= "1990"
    ),

    # 3. Zbigniew Kowalski
    (
        "Zbigniew Kowalski",
        "Zbigniew Kowalski I",
        lambda mid, d, opp: d and d < "2000" and "Lechia" in opp
    ),
    (
        "Zbigniew Kowalski",
        "Zbigniew Kowalski II",
        lambda mid, d, opp: d and d >= "2000" and "Znicz" in opp
    ),

    # 4. Paweł Wojciechowski
    (
        "Paweł Wojciechowski",
        "Paweł Wojciechowski I",
        lambda mid, d, opp: d and d < "2010" and "Cracovia" in opp
    ),
    (
        "Paweł Wojciechowski",
        "Paweł Wojciechowski II",
        lambda mid, d, opp: d and d >= "2010"
    ),

    # 5. Michał Goliński
    (
        "Michał Goliński",
        "Michał Goliński I",
        lambda mid, d, opp: d and d < "2020"
    ),
    (
        "Michał Goliński",
        "Michał Goliński II",
        lambda mid, d, opp: d and d >= "2020" and "Łęczna" in opp
    ),

    # 6. Marcin Kaczmarek
    (
        "Marcin Kaczmarek",
        "Marcin Kaczmarek I",
        lambda mid, d, opp: "Stomil" in opp
    ),
    (
        "Marcin Kaczmarek",
        "Marcin Kaczmarek II",
        lambda mid, d, opp: "Stomil" not in opp
    ),

    # 7. Paweł Tomczyk
    (
        "Paweł Tomczyk",
        "Paweł Tomczyk I",
        lambda mid, d, opp: "Motor" in opp
    ),
    (
        "Paweł Tomczyk",
        "Paweł Tomczyk II",
        lambda mid, d, opp: "Motor" not in opp
    ),

    # 8. Marek Kowalczyk
    (
        "Marek Kowalczyk",
        "Marek Kowalczyk I",
        lambda mid, d, opp: d and d < "1990" and "Lechia" in opp
    ),
    (
        "Marek Kowalczyk",
        "Marek Kowalczyk II",
        lambda mid, d, opp: d and d >= "1990" and "Śląsk" in opp
    ),

    # 9. Marcin Wróbel
    (
        "Marcin Wróbel",
        "Marcin Wróbel I",
        lambda mid, d, opp: "KSZO" in opp
    ),
    (
        "Marcin Wróbel",
        "Marcin Wróbel II",
        lambda mid, d, opp: "Drwęca" in opp
    ),

    # 10. Paweł Olszewski
    (
        "Paweł Olszewski",
        "Paweł Olszewski I",
        lambda mid, d, opp: "Tur" in opp
    ),
    (
        "Paweł Olszewski",
        "Paweł Olszewski II",
        lambda mid, d, opp: "Polonia" in opp
    ),

    # 11. Marek Bockenheim
    (
        "Marek Bockenheim",
        "Marek Bockenheim I",
        lambda mid, d, opp: d and d < "1980"
    ),
    (
        "Marek Bockenheim",
        "Marek Bockenheim II",
        lambda mid, d, opp: d and d >= "1990"
    ),

    # 12. Jerzy Kruszczyński
    (
        "Jerzy Kruszczyński",
        "Jerzy Kruszczyński I",
        lambda mid, d, opp: d and d < "1980"
    ),
    (
        "Jerzy Kruszczyński",
        "Jerzy Kruszczyński II",
        lambda mid, d, opp: d and d >= "1980"
    ),

    # 13. Guilherme
    (
        "Guilherme",
        "Guilherme I",
        lambda mid, d, opp: "Legia" in opp
    ),
    (
        "Guilherme",
        "Guilherme II",
        lambda mid, d, opp: "Legia" not in opp
    ),

    # 14. Leândro
    (
        "Leândro",
        "Leândro I",
        lambda mid, d, opp: "Łęczna" in opp or "Górnik" in opp
    ),
    (
        "Leândro",
        "Leândro II",
        lambda mid, d, opp: "Radomiak" in opp
    ),

    # 15. Thiago
    (
        "Thiago",
        "Thiago I",
        lambda mid, d, opp: "Pogoń" in opp
    ),
    (
        "Thiago",
        "Thiago II",
        lambda mid, d, opp: "Pogoń" not in opp
    ),
]


def run_migration():
    print(f"Tworzenie kopii zapasowej {DB_PATH} -> {BAK_PATH}...")
    shutil.copy2(DB_PATH, BAK_PATH)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    rows = c.execute("SELECT ID, [Full date], Przeciwnik, sklad_przeciwnika, gol_przeciwnika, kartki_przeciwnik FROM Mecze").fetchall()
    
    updates = 0
    for r in rows:
        mid, d, opp, squad, goals, cards = r
        d_str = str(d) if d else ""
        opp_str = str(opp) if opp else ""

        new_squad = squad
        new_goals = goals
        new_cards = cards

        for old_name, new_name, check_func in RULES:
            try:
                if check_func(mid, d_str, opp_str):
                    if new_squad and old_name in new_squad:
                        new_squad = replace_player_in_squad(new_squad, old_name, new_name)
                    if new_goals and old_name in new_goals:
                        new_goals = replace_player_in_goals(new_goals, old_name, new_name)
                    if new_cards and old_name in new_cards:
                        new_cards = replace_player_in_cards(new_cards, old_name, new_name)
            except Exception as e:
                print(f"Error checking rule for {old_name} in match {mid}: {e}")

        if (new_squad != squad) or (new_goals != goals) or (new_cards != cards):
            c.execute("""
                UPDATE Mecze
                SET sklad_przeciwnika = ?, gol_przeciwnika = ?, kartki_przeciwnik = ?
                WHERE ID = ?
            """, (new_squad, new_goals, new_cards, mid))
            updates += 1

    conn.commit()
    conn.close()
    print(f"Migracja zakończona sukcesem! Zaktualizowano {updates} meczów w bazie Kalendarium.db.")


if __name__ == "__main__":
    run_migration()
