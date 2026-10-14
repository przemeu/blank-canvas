# Kalendarium Arki Gdynia

Kronika wszystkich meczów Arki Gdynia od 1953 roku – wyniki, składy, strzelcy, frekwencja, sędziowie
i statystyki liczone na żywo w przeglądarce.

Aplikacja jest w pełni statycznym SPA (**React 18 + Vite + TypeScript + Tailwind CSS**), gotowym do
pracy na platformie [Lovable](https://lovable.dev) lub dowolnym hostingu plików statycznych.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # produkcyjny build do katalogu dist/
```

## Dane

Źródłem danych jest baza SQLite `Kalendarium.db` (tabela `Mecze`). Skrypt eksportu zamienia ją na
kompaktowy plik `public/data/matches.json` (< 500 KB, ~170 KB po gzip) i kopiuje herby klubów do
`public/logos/` (razem z `mapping.json`):

```bash
npm run export-data        # = python scripts/export_data.py
```

Po aktualizacji bazy wystarczy ponownie uruchomić eksport i zbudować aplikację.

## Funkcje

- **Filtry na żywo**: sezon, przeciwnik, rozgrywki, wynik (W/R/P), dokładny wynik, miejsce, sędzia,
  zawodnik, strzelec (również bramki samobójcze), minuta gola, kolejka (`5`, `1, 3, 7`, `21-34`, `PP`),
  dzień w roku (`09.07`), zakres dat (`2017/05` – `2025/01`), rok, sortowanie. Stan filtrów trzymany
  jest w URL – działa „Cofnij filtr”, a linki można udostępniać.
- **Panel statystyk** liczony dla bieżącego zestawu meczów: bilanse, bramki, frekwencja, strzelcy,
  czyste konta, serie (z datami od–do), rekordowe wyniki, najczęstszy wynik, ulubiony/najtrudniejszy rywal.
- **Tabela meczów** z herbami, klikalnymi wartościami (przenoszą do filtrów), zaznaczaniem meczów,
  koszykiem „Pokaż tylko zaznaczone” i eksportem do **XLSX**.
- **Karta meczu**: tablica wyników, metadane, oś czasu (gole, karne, samobóje, kartki), składy z
  oznaczeniem zmian, nawigacja do poprzedniego/następnego meczu.
- Tryb jasny/ciemny (zapamiętywany w `localStorage`), pełna responsywność.

## Struktura

```
public/data/matches.json   dane meczów (generowane)
public/logos/              herby + mapping.json (generowane)
scripts/export_data.py     eksport SQLite -> JSON + kopiowanie herbów
src/lib/                   parsowanie, filtry, statystyki, eksport XLSX
src/components/            UI (filtry, statystyki, tabela, pasek zaznaczenia, layout)
src/pages/                 widok wyników, karta meczu, 404
legacy/                    poprzednia wersja aplikacji (Flask) – tylko do wglądu
```

Dane: *Żółto-niebiescy. Monografia* M. Witczaka oraz [90minut.pl](http://www.90minut.pl/).
