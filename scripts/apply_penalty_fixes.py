import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('Kalendarium.db')
cur = conn.cursor()

# 1. Podwójne karne Glazy (mecz 15642 i 15687)
cur.execute("UPDATE mecze SET Strzelcy = 'Grzegorz Glaza (k); Grzegorz Glaza (k)' WHERE id = 15642")
print("Zaktualizowano mecz 15642: Grzegorz Glaza x2 (k)")

cur.execute("UPDATE mecze SET Strzelcy = 'Grzegorz Glaza (k); Grzegorz Glaza (k); Sławomir Lisewski' WHERE id = 15687")
print("Zaktualizowano mecz 15687: Grzegorz Glaza x2 (k); Sławomir Lisewski")

# 2. Marko Vejinović (mecz 1107)
cur.execute("UPDATE mecze SET Strzelcy = 'Adam Deja 5; Marko Vejinović 44k; Marko Vejinović 58' WHERE id = 1107")
print("Zaktualizowano mecz 1107: Marko Vejinović 44k")

# 3. Formaty (k) ze spacją (427, 428, 453, 454, 16206)
cur.execute("UPDATE mecze SET Strzelcy = 'Krzysztof Kobus 1k' WHERE id = 427")
cur.execute("UPDATE mecze SET Strzelcy = 'Andrzej Piątek 54; Adam Merchut 82k' WHERE id = 428")
cur.execute("UPDATE mecze SET Strzelcy = 'Daniel Laskowski 3; Rafał Murawski 31k' WHERE id = 453")
cur.execute("UPDATE mecze SET Strzelcy = 'Rafał Murawski 27k' WHERE id = 454")
cur.execute("UPDATE mecze SET Strzelcy = 'Franciszek Bieliński 26k; Janusz Kupcewicz 89' WHERE id = 16206")
print("Zaktualizowano mecze 427, 428, 453, 454, 16206: ujednolicono format k")

# 4. Brakujące bramki w meczach 922, 869, 921, 956
cur.execute("UPDATE mecze SET Strzelcy = 'Alan 29; Marcus da Silva 60k' WHERE id = 922")
cur.execute("UPDATE mecze SET Strzelcy = 'Arkadiusz Aleksander 56; Arkadiusz Aleksander 76; Marcus da Silva 81' WHERE id = 869")
cur.execute("UPDATE mecze SET Strzelcy = 'Alan 14; Marcus da Silva 38; Paweł Wojowski 44' WHERE id = 921")
cur.execute("UPDATE mecze SET Strzelcy = 'Alan 39; Alan 71; Grzegorz Tomasiewicz 82' WHERE id = 956")
print("Zaktualizowano mecze 922, 869, 921, 956: uzupełniono brakujące bramki Alana i Aleksandra")

conn.commit()
conn.close()
print("Koniec aktualizacji.")
