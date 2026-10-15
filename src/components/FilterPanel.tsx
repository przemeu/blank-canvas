import { useEffect, useRef, useState } from "react";
import { ChevronDown, Filter, RotateCcw, Undo2, X } from "lucide-react";
import type { Filters } from "@/lib/types";
import { leagueOptionLabel, refereeOptionLabel, scorerOptionLabel } from "@/lib/parsing";
import { cn } from "@/lib/format";

export interface FilterOptions {
  seasons: string[];
  opponents: string[];
  leagues: string[];
  places: string[];
  referees: string[];
  scorers: string[];
}

interface Props {
  filters: Filters;
  options: FilterOptions;
  activeCount: number;
  setFilter: (key: keyof Filters, value: string, replace?: boolean) => void;
  clearAll: () => void;
  goBack: () => void;
}

function Select({
  value,
  onChange,
  placeholder,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="block">
      <span
        className={cn(
          "mb-1 block text-[11px] font-semibold uppercase tracking-wide",
          value ? "text-amber-800 font-bold dark:text-arka-gold" : "text-slate-500 dark:text-slate-400"
        )}
      >
        {label}
      </span>
      <select className={cn("field pr-8", value && "field-active")} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          {placeholder}
        </option>
        {value && !options.some((o) => o.value === value) && (
          <option value={value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {value}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Pole tekstowe z opóźnionym (debounce) zatwierdzaniem – filtrowanie na żywo bez zaśmiecania historii. */
function TextFilter({
  value,
  onCommit,
  placeholder,
  label,
  display,
}: {
  value: string;
  onCommit: (v: string, replace: boolean) => void;
  placeholder: string;
  label: string;
  display?: (v: string) => string;
}) {
  const shown = display ? display(value) : value;
  const [local, setLocal] = useState(shown);
  const session = useRef(false);
  const timer = useRef<number>();

  useEffect(() => {
    setLocal(display ? display(value) : value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commit = (v: string) => {
    window.clearTimeout(timer.current);
    if (v.trim() === shown.trim()) return;
    onCommit(v.trim(), session.current);
    session.current = true;
  };

  return (
    <label className="block">
      <span
        className={cn(
          "mb-1 block text-[11px] font-semibold uppercase tracking-wide",
          value ? "text-amber-800 font-bold dark:text-arka-gold" : "text-slate-500 dark:text-slate-400"
        )}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type="text"
          className={cn("field pr-8", value && "field-active")}
          placeholder={placeholder}
          value={local}
          onChange={(e) => {
            const v = e.target.value;
            setLocal(v);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => commit(v), 400);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(local);
          }}
          onBlur={() => {
            commit(local);
            session.current = false;
          }}
        />
        {local && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-900 dark:text-amber-200 dark:hover:text-amber-100"
            onClick={() => {
              setLocal("");
              session.current = false;
              commit("");
            }}
            aria-label={`Wyczyść: ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </label>
  );
}

export default function FilterPanel({ filters, options, activeCount, setFilter, clearAll, goBack }: Props) {
  const [open, setOpen] = useState(true);
  const opt = (arr: string[], label?: (v: string) => string) => arr.map((v) => ({ value: v, label: label ? label(v) : v }));

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
          open && "border-b border-slate-200 dark:border-slate-800"
        )}
      >
        <span className="flex items-center gap-2 font-semibold text-arka-navy dark:text-arka-gold">
          <Filter className="h-4 w-4" />
          Filtry
          {activeCount > 0 && (
            <span className="rounded-full bg-arka-gold px-2 py-0.5 text-xs font-bold text-arka-navy">{activeCount}</span>
          )}
        </span>
        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="animate-fade-in p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
            <Select label="Sezon" placeholder="Wszystkie sezony" value={filters.season} onChange={(v) => setFilter("season", v)} options={opt(options.seasons)} />
            <Select label="Przeciwnik" placeholder="Wszyscy rywale" value={filters.opponent} onChange={(v) => setFilter("opponent", v)} options={opt(options.opponents)} />
            <Select
              label="Liga / rozgrywki"
              placeholder="Wszystkie rozgrywki"
              value={filters.league}
              onChange={(v) => setFilter("league", v)}
              options={opt(options.leagues, leagueOptionLabel)}
            />
            <Select
              label="Wynik"
              placeholder="Dowolny"
              value={filters.wynik}
              onChange={(v) => setFilter("wynik", v)}
              options={opt(["Wygrana", "Remis", "Porażka"])}
            />
            <TextFilter label="Dokładny wynik" placeholder="np. 1:1, 2:0" value={filters.result} onCommit={(v, r) => setFilter("result", v, r)} />
            <Select label="Miejsce" placeholder="Wszystkie" value={filters.place} onChange={(v) => setFilter("place", v)} options={opt(options.places)} />
            <Select
              label="Sędzia"
              placeholder="Wszyscy sędziowie"
              value={filters.referee}
              onChange={(v) => setFilter("referee", v)}
              options={opt(options.referees, refereeOptionLabel)}
            />
            <TextFilter label="Zawodnik (skład)" placeholder="np. Marcjanik" value={filters.player} onCommit={(v, r) => setFilter("player", v, r)} />
            <Select
              label="Strzelec"
              placeholder="Wszyscy strzelcy"
              value={filters.scorer}
              onChange={(v) => setFilter("scorer", v)}
              options={opt(options.scorers, scorerOptionLabel)}
            />
            <TextFilter label="Minuta gola" placeholder="np. 90" value={filters.goal_minute} onCommit={(v, r) => setFilter("goal_minute", v, r)} />
            <TextFilter label="Kolejka" placeholder="np. 5 · 1, 3, 7 · 21-34 · PP" value={filters.kolejka} onCommit={(v, r) => setFilter("kolejka", v, r)} />
            <TextFilter label="Dzień w roku" placeholder="np. 09.07" value={filters.date} onCommit={(v, r) => setFilter("date", v, r)} />
            <TextFilter label="Data od" placeholder="rrrr/mm, np. 2017/05" value={filters.from_date} onCommit={(v, r) => setFilter("from_date", v, r)} />
            <TextFilter label="Data do" placeholder="rrrr/mm, np. 2025/01" value={filters.to_date} onCommit={(v, r) => setFilter("to_date", v, r)} />
            <TextFilter label="Rok" placeholder="np. 1979" value={filters.rok} onCommit={(v, r) => setFilter("rok", v, r)} />
            <Select
              label="Sortowanie"
              placeholder="Od najstarszych"
              value={filters.sort_order === "desc" ? "desc" : ""}
              onChange={(v) => setFilter("sort_order", v || "asc")}
              options={[{ value: "desc", label: "Od najnowszych" }]}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={goBack}>
              <Undo2 className="h-4 w-4" /> Cofnij filtr
            </button>
            <button type="button" className="btn-danger" onClick={clearAll} disabled={activeCount === 0}>
              <RotateCcw className="h-4 w-4" /> Wyczyść filtry
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
