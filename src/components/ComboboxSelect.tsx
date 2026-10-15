import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/format";

export interface ComboboxOption {
  value: string;
  label: string;
  sortKey: string;
}

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l");
}

function getInitialLetter(sortKey: string): string {
  if (!sortKey || sortKey.startsWith("(")) return "#";
  const first = sortKey.trim()[0].toUpperCase();
  return first;
}

/**
 * Wyświetla etykietę: imię zwykłą czcionką, nazwisko pogrubione.
 */
function renderOptionContent(label: string) {
  if (!label || label.startsWith("(") || label === "Bramki samobójcze") {
    return <span className="font-medium">{label}</span>;
  }
  const matchCity = /^(.*?)\s*(\(.*?\))$/.exec(label.trim());
  const fullName = matchCity ? matchCity[1].trim() : label.trim();
  const city = matchCity ? matchCity[2].trim() : null;

  const parts = fullName.split(/\s+/);
  if (parts.length >= 2) {
    if (parts.length === 3 && (parts[1].toLowerCase() === "da" || parts[1].toLowerCase() === "de")) {
      const firstName = parts[0];
      const surname = `${parts[1]} ${parts[2]}`;
      return (
        <span>
          <span className="text-slate-500 dark:text-slate-400">{firstName} </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{surname}</span>
          {city && <span className="text-[11px] text-slate-400 dark:text-slate-500"> {city}</span>}
        </span>
      );
    }
    const surname = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1).join(" ");
    return (
      <span>
        <span className="text-slate-500 dark:text-slate-400">{firstNames} </span>
        <span className="font-bold text-slate-900 dark:text-slate-100">{surname}</span>
        {city && <span className="text-[11px] text-slate-400 dark:text-slate-500"> {city}</span>}
      </span>
    );
  }

  return (
    <span>
      <span className="font-bold text-slate-900 dark:text-slate-100">{label}</span>
      {city && <span className="text-[11px] text-slate-400 dark:text-slate-500"> {city}</span>}
    </span>
  );
}

export default function ComboboxSelect({ label, placeholder, value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrowanie opcji po query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const qNorm = normalize(query.trim());
    return options.filter((o) => {
      const lNorm = normalize(o.label);
      const sNorm = normalize(o.sortKey || "");
      return lNorm.includes(qNorm) || sNorm.includes(qNorm);
    });
  }, [options, query]);

  // Wszystkie unikalne litery początkowe nazwisk dostępne na liście
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const opt of options) {
      const l = getInitialLetter(opt.sortKey);
      if (l !== "#") letters.add(l);
    }
    return Array.from(letters).sort((a, b) => a.localeCompare(b, "pl"));
  }, [options]);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const displayLabel = selectedOption ? selectedOption.label : value || placeholder;

  // Przewiń listę do pierwszej opcji na daną literę nazwiska
  const scrollKeyToLetter = (letter: string) => {
    const lNorm = normalize(letter);
    const targetIndex = filteredOptions.findIndex((o) => {
      const keyNorm = normalize(o.sortKey || "");
      return keyNorm.startsWith(lNorm);
    });

    if (targetIndex !== -1 && listRef.current) {
      const offset = !query ? 1 : 0;
      setHighlightedIndex(targetIndex + offset);
      const items = listRef.current.querySelectorAll("li");
      const targetEl = items[targetIndex + offset];
      if (targetEl) {
        targetEl.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }
  };

  // Zamknięcie po kliknięciu poza komponentem
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Po otwarciu reset wyszukiwania i focus na input
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Przewijanie do podświetlonej pozycji
  useEffect(() => {
    if (open && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      const activeEl = items[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, open]);

  // Klawiatura na zamkniętym przycisku (bezpośredni wybór po naciśnięciu litery nazwiska)
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const pressed = normalize(e.key);
      const match = options.find((o) => {
        const keyNorm = normalize(o.sortKey || "");
        return keyNorm.startsWith(pressed);
      });
      if (match) {
        onChange(match.value);
      }
    }
  };

  // Klawiatura wewnątrz pola wyszukiwania
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length ? prev + 1 : prev));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === 0 && !query) {
        onChange("");
      } else {
        const idx = !query ? highlightedIndex - 1 : highlightedIndex;
        const target = filteredOptions[idx] || filteredOptions[0];
        if (target) onChange(target.value);
      }
      setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="relative block" ref={containerRef}>
      <span
        className={cn(
          "mb-1 block text-[11px] font-semibold uppercase tracking-wide",
          value ? "text-amber-800 font-bold dark:text-arka-gold" : "text-slate-500 dark:text-slate-400"
        )}
      >
        {label}
      </span>

      {/* Przycisk wyzwalający o wyglądzie identycznym jak select .field */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "field flex w-full items-center justify-between pr-2 text-left",
          value && "field-active"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate", !value && "text-slate-400 dark:text-slate-500")}>
          {value ? displayLabel : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:text-amber-200 dark:hover:text-amber-100"
              title="Wyczyść filtr"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Rozwijane menu z alfabetem i listą */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Szybkie wyszukiwanie */}
          <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Wpisz nazwisko lub imię…"
              className="h-8 w-full rounded-md bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-arka-navy dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-arka-gold"
            />
          </div>

          {/* Klikalny pasek liter alfabetu (szybki skok do nazwiska) */}
          {!query && availableLetters.length > 0 && (
            <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="mr-1 text-[10px] font-semibold uppercase text-slate-400">Skok:</span>
              {availableLetters.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => scrollKeyToLetter(l)}
                  className="rounded px-1 text-[11px] font-bold text-slate-600 hover:bg-arka-navy hover:text-white dark:text-slate-300 dark:hover:bg-arka-gold dark:hover:text-arka-navy"
                  title={`Przewiń do nazwisk na literę ${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Lista pozycji */}
          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1 text-xs" role="listbox">
            {!query && (
              <li
                role="option"
                aria-selected={!value}
                onClick={() => handleSelect("")}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-3 py-2 text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
                  !value && "bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                  highlightedIndex === 0 && "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <span>{placeholder}</span>
                {!value && <Check className="h-3.5 w-3.5 text-arka-navy dark:text-arka-gold" />}
              </li>
            )}

            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Nie znaleziono pozycji
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const itemIndex = idx + (!query ? 1 : 0);
                const isSelected = opt.value === value;
                const isHighlighted = itemIndex === highlightedIndex;

                // Sprawdź czy pokazać separator litery
                const prevOpt = idx > 0 ? filteredOptions[idx - 1] : null;
                const currLetter = getInitialLetter(opt.sortKey);
                const prevLetter = prevOpt ? getInitialLetter(prevOpt.sortKey) : null;
                const showHeader = !query && currLetter !== "#" && currLetter !== prevLetter;

                return (
                  <div key={opt.value}>
                    {showHeader && (
                      <div className="sticky top-0 z-10 bg-slate-100/90 px-3 py-0.5 text-[10px] font-bold uppercase text-slate-500 backdrop-blur dark:bg-slate-800/90 dark:text-slate-400">
                        {currLetter}
                      </div>
                    )}
                    <li
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800/80",
                        isSelected && "bg-amber-100 font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-200",
                        isHighlighted && !isSelected && "bg-slate-50 dark:bg-slate-800/50"
                      )}
                    >
                      <div className="truncate">{renderOptionContent(opt.label)}</div>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-amber-800 dark:text-arka-gold" />}
                    </li>
                  </div>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
