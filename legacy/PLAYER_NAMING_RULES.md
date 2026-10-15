# Player Naming Conventions for Kalendarium Arki

Dokumentacja reguł nazewnictwa zawodników w bazie danych `Kalendarium.db` oraz pliku eksportu `public/data/matches.json`.

---

## 1. Zawodnik Arki vs Zawodnik Rywala (Homofonia)
Gdy zawodnik rywali nazywa się tak samo jak zawodnik Arki Gdynia, aby statystyki i filtry nie mieszały tych osób:
- **Piłkarz Arki** pozostaje w czystej postaci: `Imię Nazwisko` (np. w `sklad_arka`, `Strzelcy`, `kartki_arka`).
- **Piłkarz rywala** otrzymuje dopisek z pozycją w nawiasie: `Imię Nazwisko (pozycja)` (w `sklad_przeciwnika`, `gol_przeciwnika`, `kartki_przeciwnik`).

### Zidentyfikowane i ujednoznacznione przypadki:
1. **Krzysztof Kamiński**:
   - Arka Gdynia: pomocnik/napastnik (1987–1990, 62 mecze) -> `Krzysztof Kamiński`
   - Rywal (Wisła Płock, Ruch Chorzów, Pogoń Szczecin 2011–2025): bramkarz (ur. 1990) -> `Krzysztof Kamiński (bramkarz)`
2. **Marcin Komorowski**:
   - Arka Gdynia: pomocnik/napastnik (wiosna 2000, 3 mecze) -> `Marcin Komorowski`
   - Rywal (Polonia Bytom, Legia Warszawa, Polonia Warszawa 2008–2011): obrońca (ur. 1984) -> `Marcin Komorowski (obrońca)`
3. **Michał Nalepa**:
   - Arka Gdynia: pomocnik (2014–2020, 177 meczów, zdobywca Pucharu Polski) -> `Michał Nalepa`
   - Rywal (Ruch Radzionków, Bruk-Bet Termalica, Lechia Gdańsk, Zagłębie Lubin 2011–2025): obrońca (ur. 1993) -> `Michał Nalepa (obrońca)`
4. **Krzysztof Sobieraj**:
   - Arka Gdynia: wieloletni kapitan i obrońca (2004–2018, 374 mecze) -> `Krzysztof Sobieraj`
   - Bałtyk Gdynia: obrońca grający przeciwko Arce w latach 1992–1995 -> `Krzysztof Sobieraj (Bałtyk Gdynia)`

---

## 2. Zawodnik Rywala vs Inny Zawodnik Rywala (Homofonia)
Gdy dwóch różnych zawodników rywali nosi to samo imię i nazwisko (np. z różnych klubów lub epok), rozróżniamy ich numeracją rzymską wg kolejności chronologicznej debiutu przeciwko Arce: `Imię Nazwisko I`, `Imię Nazwisko II`.

### Zidentyfikowane i ujednoznacznione przypadki:
1. **Maciej Żurawski**:
   - `Maciej Żurawski I`: Wisła Kraków (2003–2011)
   - `Maciej Żurawski II`: Warta Poznań (2024–2025)
2. **Michał Wróbel**:
   - `Michał Wróbel I`: Wisła Kraków (1976–1982)
   - `Michał Wróbel II`: Śląsk Wrocław, Unia Janikowo, Olimpia Grudziądz (2004–2013)
3. **Zbigniew Kowalski**:
   - `Zbigniew Kowalski I`: Lechia Gdańsk (1968–1984)
   - `Zbigniew Kowalski II`: Znicz Pruszków (2007–2008)
4. **Paweł Wojciechowski**:
   - `Paweł Wojciechowski I`: Cracovia (2006–2007)
   - `Paweł Wojciechowski II`: Olimpia Elbląg, Chrobry Głogów, Górnik Łęczna, Resovia (2011–2022)
5. **Michał Goliński**:
   - `Michał Goliński I`: Lech Poznań, Dyskobolia, Cracovia, Warta Poznań (2004–2011)
   - `Michał Goliński II`: Górnik Łęczna (2021)
6. **Marcin Kaczmarek**:
   - `Marcin Kaczmarek I`: Stomil Olsztyn (2003)
   - `Marcin Kaczmarek II`: Ceramika Opoczno, KSZO, Korona, Lechia, Olimpia Grudziądz (2002–2016)
7. **Paweł Tomczyk**:
   - `Paweł Tomczyk I`: Motor Lublin (2007)
   - `Paweł Tomczyk II`: Lech Poznań, Podbeskidzie, Widzew, Polonia Warszawa (2017–2023)
8. **Marek Kowalczyk**:
   - `Marek Kowalczyk I`: Lechia Gdańsk (1983–1984)
   - `Marek Kowalczyk II`: Śląsk Wrocław (2002–2004)
9. **Marcin Wróbel**:
   - `Marcin Wróbel I`: KSZO Ostrowiec Świętokrzyski (ur. 1978)
   - `Marcin Wróbel II`: Drwęca Nowe Miasto Lubawskie (ur. 1980)
10. **Paweł Olszewski**:
    - `Paweł Olszewski I`: Tur Turek (2007)
    - `Paweł Olszewski II`: Polonia Warszawa (2025)
11. **Marek Bockenheim**:
    - `Marek Bockenheim I`: Lechia Gdańsk senior (1968–1976)
    - `Marek Bockenheim II`: Lechia Gdańsk junior (1992–1995)
12. **Jerzy Kruszczyński**:
    - `Jerzy Kruszczyński I`: Lechia Gdańsk (1972–1973)
    - `Jerzy Kruszczyński II`: Lechia Gdańsk (1983–1984)
---

## 3. Zawodnicy brazylijscy (zamiast numeracji rzymskiej – imię i nazwisko / przydomek)
W przypadku zawodników brazylijskich występujących w polskich klubach pod pojedynczymi imionami lub pseudonimami (np. Leandro, Guilherme, Thiago), **zamiast numeracji rzymskiej stosujemy ich pełniejsze imiona i nazwiska / przydomki**:
1. **Leandro**:
   - `Leandro Messias`: Górnik Łęczna (2016–2021, Leândro Messias dos Santos)
   - `Leandro Rossi`: Radomiak Radom (2020–2026, Leândro Rossi Pereira)
2. **Guilherme**:
   - `Guilherme Marques`: Legia Warszawa (2016–2017, Guilherme Costa Marques)
   - `Guilherme Sityá`: Bruk-Bet Termalica & Jagiellonia Białystok (2016–2026, Guilherme Haubert Sityá)
3. **Thiago**:
   - `Thiago Gomes`: Pogoń Szczecin (2007, Thiago Gomes de Oliveira)
   - `Thiago Rodrigues`: Cracovia & Stal Stalowa Wola (2020–2024, Thiago Rodrigues de Souza)

---

## 4. Marcus da Silva
- Zawsze używaj zapisu `Marcus da Silva` (zamiast `Marcus`, `Marcus Vinicius` czy `Marcus Vinícius`) we wszystkich tabelach bazy danych (`Kalendarium.db`), składach (`sklad_arka`), strzelcach (`Strzelcy`), kartkach (`kartki_arka`) oraz we wszelkich skryptach scrapujących i walidujących.
