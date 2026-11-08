import sqlite3
import sys

def apply_fixes():
    conn = sqlite3.connect('Kalendarium.db')
    cur = conn.cursor()

    # 1 & 2 & 3 & 4 for Season 2000/01
    # Format: (kolejka, data, przeciwnik_like, wynik, strzelcy, sedzia)
    matches_2000 = [
        ("1", "05.08.", "Kaliski", "0:0", "", "Meller (Toruń)"),
        ("2", "12.08.", "Błękitni", "2:2", "Marek Rybkiewicz 70; Marek Rybkiewicz 87", "Przybyłowski (Płock)"),
        ("3", "16.08.", "Bałtyk", "3:1", "Marek Rybkiewicz 9; Mariusz Kaliński 21; Michał Smarzyński 62", "Demczur (Szczecin)"),
        ("4", "19.08.", "Pomerania", "4:0", "Michał Smarzyński 25; Michał Smarzyński 26; Michał Smarzyński 34; Marek Rybkiewicz 60", "Parys (Legnica)"),
        ("5", "26.08.", "Obra", "1:3", "Ireneusz Stencel 44", "Knicki (Koszalin)"),
        ("6", "30.08.", "Flota", "2:2", "Marek Rybkiewicz 21; Wojciech Hartman 47", "Zalesiak (Bydgoszcz)"),
        ("7", "06.09.", "Astra", "1:1", "Łukasz Kowalski 44", "Nowak (Koszalin)"),
        ("8", "10.09.", "Amica", "2:0", "Adam Merchut 41k; Rafał Murawski 80", "Kapłan (Toruń)"),
        ("9", "17.09.", "Zawisza", "0:0", "", "Augustyniak (Szczecin)"),
        ("10", "23.09.", "Sparta", "3:1", "Adam Merchut 3k; Łukasz Kowalski 45; Michał Smarzyński 55", "Pracz (Szczecin)"),
        ("11", "27.09.", "Lignomat", "3:1", "Rafał Andruszko 73; Adam Merchut 85; Mariusz Radoń 89", "Rogoziński (Toruń)"),
        ("12", "01.10.", "Mień", "2:0", "Robert Sikorski 57; Robert Sikorski 75", "Krawczyk (Poznań)"),
        ("13", "07.10.", "Goplania", "1:0", "Michał Smarzyński 83", "Gałązka (Szczecin)"),
        ("14", "15.10.", "Gryf", "0:0", "", "Twardosz (Poznań)"),
        ("15", "18.10.", "Warta", "1:0", "Marek Rybkiewicz 66", "Wandelewski (Poznań)"),
        ("16", "22.10.", "Kotwica", "3:0", "walkower", "walkower"),
        ("17", "28.10.", "Chemik", "1:2", "Marek Rybkiewicz 83", "Burluta (Szczecin)"),
        ("18", "05.11.", "Huragan", "5:0", "Marek Rybkiewicz 2; Marek Rybkiewicz 13; Adam Merchut 20; Rafał Andruszko 33; Rafał Andruszko 47", "Jabłoński (Koszalin)"),
        ("19", "11.11.", "Unia", "1:0", "Rafał Andruszko 65", "Kricki (Koszalin)"),
        ("20", "18.11.", "Kaszubia", "1:0", "Marek Rybkiewicz 24", "Tołoczko (Poznań)"),
        ("21", "17.03.", "Błękitni", "1:1", "Michał Smarzyński 33", "Augustyniak (Szczecin)"),
        ("22", "24.03.", "Bałtyk", "3:1", "Adam Merchut 45; Adam Merchut 76; Adam Merchut 80k", "Rutkowski (Poznań)"),
        ("23", "28.03.", "Pomerania", "1:1", "Rafał Andruszko 38", "Sadowski (Ciechanów)"),
        ("24", "31.03.", "Obra", "0:0", "", "Przybyłowski (Płock)"),
        ("25", "07.04.", "Flota", "1:1", "Michał Smarzyński 52", "Zelek (Bydgoszcz)"),
        ("26", "11.04.", "Astra", "3:0", "Michał Smarzyński 7; Michał Smarzyński 10; Michał Smarzyński 48", "Łęźny (Opole)"),
        ("27", "14.04.", "Kaliski", "1:0", "Michał Smarzyński 49", "Augustyniak (Szczecin)"),
        ("28", "19.04.", "Amica", "0:0", "", "Nowicki (Bydgoszcz)"),
        ("29", "24.04.", "Zawisza", "2:0", "Adam Merchut 64k; Michał Smarzyński 73", "Kordy (Płock)"),
        ("30", "28.04.", "Sparta", "0:1", "", "Posuniak (Radom)"),
        ("31", "02.05.", "Lignomat", "5:1", "Michał Smarzyński 7; Adam Merchut 15; Marek Rybkiewicz 23; Marek Rybkiewicz 40; Adam Merchut 58", "Górski (Łódź)"),
        ("32", "06.05.", "Mień", "1:0", "Michał Smarzyński 48", "Przybyłowski (Płock)"),
        ("33", "13.05.", "Goplania", "4:0", "Ireneusz Stencel 51; Wojciech Hartman 61; Wojciech Hartman 68; Michał Smarzyński 75", "Majcher (Katowice)"),
        ("34", "17.05.", "Gryf", "3:0", "Marek Rybkiewicz 25; Ireneusz Stencel 54; Robert Kalkowski 71", "Jabłoński (Koszalin)"),
        ("35", "19.05.", "Warta", "2:1", "Marek Rybkiewicz 60; Adam Merchut 67k", "Jabłoński (Koszalin)"),
        ("36", "26.05.", "Kotwica", "0:0", "", "Posuniak (Radom)"),
        ("37", "02.06.", "Chemik", "1:0", "Artur Pomorski 30", "Konarski (Poznań)"),
        ("38", "06.06.", "Huragan", "1:0", "Maciej Faltyński 80", "Burluta (Szczecin)"),
        ("39", "10.06.", "Unia", "2:2", "Grzegorz Witt 14; Wojciech Hartman 56", "Pracz (Szczecin)"),
        ("40", "17.06.", "Kaszubia", "1:1", "Robert Kalkowski 61", "Gonera (Szczecin)"),
        ("PP", "09.05.", "Orlęta", "3:0", "Tomasz Godlewski 16; Tomasz Godlewski 69; Artur Pomorski 87", "Zelek (Bydgoszcz)"),
        ("PP", "30.05.", "Kaszubia", "0:1", "", "Witkowski (Gdańsk)")
    ]

    print("Updating 2000/01 matches...")
    for kol, data, opp, wyn, strz, sedz in matches_2000:
        if kol == 'PP':
            cur.execute("""
                UPDATE Mecze 
                SET Wynik = ?, Strzelcy = ?, sedzia = ?
                WHERE Sezon = '2000/01' AND Kolejka = 'PP' AND Przeciwnik LIKE ?
            """, (wyn, strz, sedz, f"%{opp}%"))
        else:
            cur.execute("""
                UPDATE Mecze 
                SET Wynik = ?, Strzelcy = ?, sedzia = ?
                WHERE Sezon = '2000/01' AND Kolejka = ?
            """, (wyn, strz, sedz, kol))

    # Season 2001/02 matches (Jesień)
    # Referees for 23 league matches + 2 PL matches + corrections
    matches_2001 = [
        ("PL", "14.07.", "Dom", "Jagiellonia", "Lisiecki (Poznań)", None),
        ("PL", "17.07.", "Wyjazd", "Jagiellonia", "Górski (Łódź)", "17.07."),
        ("1", "21.07.", "Dom", "Orlen", "Kozłowski (Poznań)", None),
        ("2", "28.07.", "Wyjazd", "Ruch", "Gawron (Rzeszów)", None),
        ("3", "04.08.", "Dom", "Szczakowianka", "Ryżek (Poznań)", None),
        ("4", "11.08.", "Wyjazd", "Polar", "Lisiecki (Poznań)", None),
        ("5", "18.08.", "Dom", "Jagiellonia", "Pracz (Szczecin)", None),
        ("6", "25.08.", "Wyjazd", "Górnik", "Kowal (Katowice)", None), # also fix scorer Krzysztof Piątek
        ("7", "01.09.", "Dom", "Zagłębie", "Bakaluk (Olsztyn)", None),
        ("8", "04.09.", "Wyjazd", "Lech", "Kamiński (Olsztyn)", None),
        ("9", "08.09.", "Dom", "Hutnik", "Szymański (Kielce)", None),
        ("10", "15.09.", "Wyjazd", "Odra", "Maurek (Kraków)", None),
        ("11", "22.09.", "Dom", "Łódzki", "Kozłowski (Poznań)", None),
        ("12", "29.09.", "Wyjazd", "Tłoki", "Olędzki (Szczecin)", None),
        ("13", "06.10.", "Dom", "Górnik Łęczna", "Rębilas (Kraków)", None),
        ("14", "13.10.", "Wyjazd", "Świt", "Jankowski (Szczecin)", None),
        ("15", "20.10.", "Dom", "Włókniarz", "Kozłowski (Poznań)", None),
        ("16", "24.10.", "Wyjazd", "Bełchatów", "Pracz (Szczecin)", None),
        ("17", "27.10.", "Dom", "Ceramika", "Oparcik (Radom)", None),
        ("18", "03.11.", "Dom", "Myszków", "Setla (Katowice)", None),
        ("19", "10.11.", "Wyjazd", "Hetman", "Ryżek (Poznań)", None),
        ("20", "14.11.", "Wyjazd", "Orlen", "Augustyniak (Szczecin)", None),
        ("21", "17.11.", "Dom", "Ruch", "Nowak (Katowice)", None),
        ("22", "24.11.", "Wyjazd", "Szczakowianka", "Kamiński (Olsztyn)", None),
        ("23", "28.11.", "Dom", "Polar", "Bakaluk (Olsztyn)", None)
    ]

    print("Updating 2001/02 matches...")
    for kol, data, msc, opp, sedz, new_data in matches_2001:
        if kol == 'PL':
            if new_data:
                cur.execute("""
                    UPDATE Mecze 
                    SET sedzia = ?, Data = ?
                    WHERE Sezon = '2001/02' AND Kolejka = 'PL' AND Miejsce = ?
                """, (sedz, new_data, msc))
            else:
                cur.execute("""
                    UPDATE Mecze 
                    SET sedzia = ?
                    WHERE Sezon = '2001/02' AND Kolejka = 'PL' AND Miejsce = ?
                """, (sedz, msc))
        else:
            if kol == '6':
                # Fix Krzysztof Piątek (Point 4)
                cur.execute("""
                    UPDATE Mecze 
                    SET sedzia = ?, Strzelcy = 'Krzysztof Piątek 56; Adam Merchut 83k'
                    WHERE Sezon = '2001/02' AND Kolejka = '6'
                """, (sedz,))
            else:
                cur.execute("""
                    UPDATE Mecze 
                    SET sedzia = ?
                    WHERE Sezon = '2001/02' AND Kolejka = ?
                """, (sedz, kol))

    conn.commit()
    conn.close()
    print("Database updates successfully committed!")

if __name__ == '__main__':
    apply_fixes()
