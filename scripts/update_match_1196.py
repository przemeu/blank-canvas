import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "Kalendarium.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cols = [c[1] for c in cur.execute("PRAGMA table_info(Mecze)").fetchall()]
    print("Existing columns:", cols)

    if "uwagi" not in cols:
        cur.execute("ALTER TABLE Mecze ADD COLUMN uwagi TEXT")
        print("Added column 'uwagi' to Mecze")
    else:
        print("Column 'uwagi' already exists")

    note = "Mecz rozegrany w Gdyni (gospodarzem była Skra Częstochowa)"
    cur.execute("UPDATE Mecze SET uwagi = ? WHERE ID = 1196", (note,))
    conn.commit()

    cur.row_factory = sqlite3.Row
    row = cur.execute("SELECT ID, Sezon, Kolejka, Miejsce, Przeciwnik, uwagi FROM Mecze WHERE ID = 1196").fetchone()
    print("Updated match 1196:", dict(row))

    conn.close()

if __name__ == "__main__":
    main()
