import sqlite3
import json

db_path = "Kalendarium.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Krupski: Jacek Krupski -> Jarosław Krupski
cur.execute("SELECT id, sklad_arka, kartki_arka FROM mecze WHERE sklad_arka LIKE '%Jacek Krupski%' OR kartki_arka LIKE '%Jacek Krupski%'")
rows = cur.fetchall()
print(f"Liczba meczów z 'Jacek Krupski': {len(rows)}")

for row_id, sklad_arka, kartki_arka in rows:
    new_sklad = sklad_arka.replace("Jacek Krupski", "Jarosław Krupski") if sklad_arka else sklad_arka
    new_kartki = kartki_arka.replace("Jacek Krupski", "Jarosław Krupski") if kartki_arka else kartki_arka
    cur.execute("UPDATE mecze SET sklad_arka = ?, kartki_arka = ? WHERE id = ?", (new_sklad, new_kartki, row_id))

# 2. Superpuchar 2017 (ID 1021, 2017-07-07)
sklad_arka_1021 = "Pavels Steinbors; Damian Zbozień; Michał Marcjanik; Krzysztof Sobieraj; Marcin Warcholak; Patryk Kun 90; 90 Michał Żebrakowski; Marcus da Silva 63; 63 Dawid Sołdecki; Yannick Kakoko; Adam Marciniak 77; 77 Michał Nalepa; Grzegorz Piesio 84; 84 Tadeusz Socha; Rafał Siemaszko 67; 67 Rubén Jurado"
sklad_legia_1021 = "Arkadiusz Malarz; Artur Jędrzejczyk 90; 90 Mateusz Żyro; Maciej Dąbrowski; Michał Pazdan; Adam Hloušek; Guilherme Marques; Michał Kopczyński; Thibault Moulin; Kasper Hämäläinen 67; 67 Vamara Sanogo; Dominik Nagy 64; 64 Sebastian Szymański; Jarosław Niezgoda 57; 57 Mateusz Szwoch"
kartki_arka_1021 = json.dumps([{"name": "Krzysztof Sobieraj", "type": "yellow", "minute": ""}])
kartki_legia_1021 = json.dumps([
    {"name": "Michał Pazdan", "type": "yellow", "minute": ""},
    {"name": "Mateusz Szwoch", "type": "yellow", "minute": ""},
    {"name": "Artur Jędrzejczyk", "type": "yellow", "minute": ""},
    {"name": "Artur Jędrzejczyk", "type": "red", "minute": "90"}
])
gol_przeciwnika_1021 = "Thibault Moulin 27"
strzelcy_1021 = "(Michał Pazdan 20s); (karne 4:3)"

cur.execute("""
    UPDATE mecze 
    SET sklad_arka = ?,
        sklad_przeciwnika = ?,
        kartki_arka = ?,
        kartki_przeciwnik = ?,
        gol_przeciwnika = ?,
        Strzelcy = ?
    WHERE id = 1021
""", (sklad_arka_1021, sklad_legia_1021, kartki_arka_1021, kartki_legia_1021, gol_przeciwnika_1021, strzelcy_1021))
print(f"Zaktualizowano mecz ID 1021, zmieniono wierszy: {cur.rowcount}")

# 3. Gole Marcusa da Silvy z karnych w meczach 870, 935, 1024
# ID 870 (2013-08-24): Marcus da Silva 34; Marcus da Silva 38k; Arkadiusz Aleksander 71
cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 870", ("Marcus da Silva 34; Marcus da Silva 38k; Arkadiusz Aleksander 71",))

# ID 935 (2015-05-17): Marcus da Silva 8; Marcin Warcholak 60; Marcus da Silva 62; Marcus da Silva 75k
cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 935", ("Marcus da Silva 8; Marcin Warcholak 60; Marcus da Silva 62; Marcus da Silva 75k",))

# ID 1024 (2017-07-27): Marcus da Silva 31; Marcus da Silva 39k; Rafał Siemaszko 90
cur.execute("UPDATE mecze SET Strzelcy = ? WHERE id = 1024", ("Marcus da Silva 31; Marcus da Silva 39k; Rafał Siemaszko 90",))

conn.commit()
conn.close()
print("Koniec aktualizacji Kalendarium.db")
