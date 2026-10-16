import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('Kalendarium.db')
cur = conn.cursor()

# 1. Poprawka meczów Pucharu Polski z sezonu 1980/81 (błędnie jako I liga, kol. 31, 32)
cur.execute("""
    UPDATE Mecze 
    SET Liga = 'PP', Kolejka = 'PP'
    WHERE ID IN (16199, 16200)
""")
print(f"Zaktualizowano mecze 1980/81 (ID 16199, 16200): {cur.rowcount} wierszy")

# 2. Poprawka meczów Pucharu Polski z sezonu 1981/82 (błędnie jako I liga, kol. 31, 32, 33, 34)
cur.execute("""
    UPDATE Mecze 
    SET Liga = 'PP', Kolejka = 'PP'
    WHERE ID IN (16165, 16166, 16167, 16168)
""")
print(f"Zaktualizowano mecze 1981/82 (ID 16165-16168): {cur.rowcount} wierszy")

# 3. Poprawka meczu 30. kolejki Ekstraklasy 2006/07 z Wisłą Płock (błędnie jako PP)
cur.execute("""
    UPDATE Mecze 
    SET Liga = 'I', Kolejka = '30'
    WHERE ID = 645
""")
print(f"Zaktualizowano mecz 2006/07 (ID 645): {cur.rowcount} wierszy")

conn.commit()
conn.close()
print("Poprawki zapisane pomyślnie w bazie.")
