import sqlite3
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('Kalendarium.db')
cur = conn.cursor()

# 1. Wołodymyr Azacki (zastępuje Ołeksandr Azaćkyj)
# sklad_arka
cur.execute("SELECT id, sklad_arka, kartki_arka, Strzelcy FROM mecze WHERE sklad_arka LIKE '%Azaćkyj%' OR kartki_arka LIKE '%Azaćkyj%' OR Strzelcy LIKE '%Azaćkyj%'")
rows_aza = cur.fetchall()
print(f"Liczba meczów z Ołeksandr Azaćkyj: {len(rows_aza)}")
for r_id, sklad, kartki, strz in rows_aza:
    new_sklad = sklad.replace('Ołeksandr Azaćkyj', 'Wołodymyr Azacki') if sklad else sklad
    new_kartki = kartki.replace('Ołeksandr Azaćkyj', 'Wołodymyr Azacki') if kartki else kartki
    new_strz = strz.replace('Ołeksandr Azaćkyj', 'Wołodymyr Azacki') if strz else strz
    cur.execute("UPDATE mecze SET sklad_arka = ?, kartki_arka = ?, Strzelcy = ? WHERE id = ?", (new_sklad, new_kartki, new_strz, r_id))

# 2. Baczynski -> Baczyński (mecz 314)
cur.execute("SELECT id, Strzelcy FROM mecze WHERE id = 314")
row = cur.fetchone()
if row and 'Baczynski' in row[1]:
    cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 314", (row[1].replace('Baczynski', 'Baczyński'),))
    print("Zaktualizowano mecz 314: Baczynski -> Baczyński")

# 3. Wawinski -> Wawiński (mecz 357)
cur.execute("SELECT id, Strzelcy FROM mecze WHERE id = 357")
row = cur.fetchone()
if row and 'Wawinski' in row[1]:
    cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 357", (row[1].replace('Wawinski', 'Wawiński'),))
    print("Zaktualizowano mecz 357: Wawinski -> Wawiński")

# 4. Wądolowski -> Wądołowski (mecz 230)
cur.execute("SELECT id, Strzelcy FROM mecze WHERE id = 230")
row = cur.fetchone()
if row and 'Wądolowski' in row[1]:
    cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 230", (row[1].replace('Wądolowski', 'Wądołowski'),))
    print("Zaktualizowano mecz 230: Wądolowski -> Wądołowski")

# 5. Moskalewicz -> Olgierd Moskalewicz 84k (mecz 650)
cur.execute("SELECT id, Strzelcy FROM mecze WHERE id = 650")
row = cur.fetchone()
if row and 'Moskalewicz (k)' in row[1]:
    cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 650", (row[1].replace('Moskalewicz (k)', 'Olgierd Moskalewicz 84k'),))
    print("Zaktualizowano mecz 650: Moskalewicz (k) -> Olgierd Moskalewicz 84k")

# 6. Pāvels Šteinbors (mecz 1021)
cur.execute("SELECT id, sklad_arka FROM mecze WHERE id = 1021")
row = cur.fetchone()
if row and 'Pavels Steinbors' in row[1]:
    cur.execute("UPDATE mecze SET sklad_arka = ? WHERE id = 1021", (row[1].replace('Pavels Steinbors', 'Pāvels Šteinbors'),))
    print("Zaktualizowano mecz 1021: Pavels Steinbors -> Pāvels Šteinbors")

# 7. Hałąburda -> Hałaburda (mecz 15747)
cur.execute("SELECT id, sklad_arka FROM mecze WHERE id = 15747")
row = cur.fetchone()
if row and 'Hałąburda' in row[1]:
    cur.execute("UPDATE mecze SET sklad_arka = ? WHERE id = 15747", (row[1].replace('Hałąburda', 'Hałaburda'),))
    print("Zaktualizowano mecz 15747: Hałąburda -> Hałaburda")

# 8. Bożemoj -> Bożemój (mecz 15897)
cur.execute("SELECT id, sklad_arka FROM mecze WHERE id = 15897")
row = cur.fetchone()
if row and 'Bożemoj' in row[1]:
    cur.execute("UPDATE mecze SET sklad_arka = ? WHERE id = 15897", (row[1].replace('Bożemoj', 'Bożemój'),))
    print("Zaktualizowano mecz 15897: Bożemoj -> Bożemój")

# 9. Czyszczenie apostrofów przy minutach zmian w meczach 16209, 16210, 16211
for m_id in [16209, 16210, 16211]:
    cur.execute("SELECT id, sklad_arka FROM mecze WHERE id = ?", (m_id,))
    row = cur.fetchone()
    if row and row[1]:
        # usuń apostrofy występujące tuż po cyfrach, np. 35' -> 35
        cleaned = re.sub(r"(\d+)'", r"\1", row[1])
        cur.execute("UPDATE mecze SET sklad_arka = ? WHERE id = ?", (cleaned, m_id))
        print(f"Zaktualizowano mecz {m_id}: usunięto apostrofy przy minutach")

# 10. Usunięcie doklejonych tabel ligowych w skład_arka (od 'L.p.')
cur.execute("SELECT id, sklad_arka FROM mecze WHERE sklad_arka LIKE '%L.p.%' OR sklad_arka LIKE '%drużyna%'")
rows_tables = cur.fetchall()
print(f"Czyszczenie doklejonych tabel ligowych w {len(rows_tables)} meczach...")
for r_id, sklad in rows_tables:
    idx = sklad.find('L.p.')
    if idx == -1: idx = sklad.find('drużyna')
    if idx != -1:
        # obetnij i usuń końcowy średnik lub spacje
        cleaned_sklad = sklad[:idx].rstrip('; ')
        cur.execute("UPDATE mecze SET sklad_arka = ? WHERE id = ?", (cleaned_sklad, r_id))
        print(f"  Mecz {r_id}: obcięto tabelę, długość z {len(sklad)} do {len(cleaned_sklad)}")

# 11. Marek Bartoś -> Marek Bartoš (mecz 15470)
cur.execute("SELECT id, sklad_przeciwnika FROM mecze WHERE id = 15470")
row = cur.fetchone()
if row and 'Marek Bartoś' in row[1]:
    cur.execute("UPDATE mecze SET sklad_przeciwnika = ? WHERE id = 15470", (row[1].replace('Marek Bartoś', 'Marek Bartoš'),))
    print("Zaktualizowano mecz 15470: Marek Bartoś -> Marek Bartoš")

conn.commit()
conn.close()
print("Koniec aktualizacji bazy.")
