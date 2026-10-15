import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Star } from "lucide-react";
import { useData, useSelection } from "@/context/AppContext";
import { useFilterParams } from "@/hooks/useFilterParams";
import { applyFilters, countActiveFilters, sortMatches } from "@/lib/filters";
import { computeStats } from "@/lib/stats";
import { exportMatchesToXlsx } from "@/lib/export";
import { LEAGUE_ORDER, compareOpponents, refereeOptionLabel, seasonStartYear } from "@/lib/parsing";
import { plural } from "@/lib/format";
import FilterPanel, { type FilterOptions } from "@/components/FilterPanel";
import StatsDashboard from "@/components/StatsDashboard";
import MatchTable from "@/components/MatchTable";
import SelectionBar from "@/components/SelectionBar";

const collator = new Intl.Collator("pl", { sensitivity: "base" });

export default function ResultsPage() {
  const navigate = useNavigate();
  const { matches } = useData();
  const { selected, toggle, setMany, clear } = useSelection();
  const { filters, selectedOnly, setFilter, jumpTo, clearAll, setSelectedOnly } = useFilterParams();
  const [exporting, setExporting] = useState(false);

  const options = useMemo<FilterOptions>(() => {
    const uniq = (f: (m: (typeof matches)[number]) => string | null) => [...new Set(matches.map(f).filter((v): v is string => !!v))];
    const leagues = uniq((m) => m.liga);
    return {
      seasons: uniq((m) => m.sezon).sort((a, b) => (seasonStartYear(b) ?? 0) - (seasonStartYear(a) ?? 0) || collator.compare(b, a)),
      opponents: uniq((m) => m.przeciwnik).sort((a, b) => compareOpponents(a, b, collator)),
      leagues: leagues.sort((a, b) => {
        const ia = LEAGUE_ORDER.indexOf(a);
        const ib = LEAGUE_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }),
      places: uniq((m) => m.miejsce).sort((a, b) => ["Dom", "Wyjazd", "Neutralne"].indexOf(a) - ["Dom", "Wyjazd", "Neutralne"].indexOf(b)),
      referees: uniq((m) => m.sedzia).sort((a, b) => collator.compare(refereeOptionLabel(a), refereeOptionLabel(b))),
    };
  }, [matches]);

  const filtered = useMemo(() => {
    const base = selectedOnly ? matches.filter((m) => selected.has(m.id)) : applyFilters(matches, filters);
    return sortMatches(base, filters.sort_order);
  }, [matches, filters, selectedOnly, selected]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const activeCount = countActiveFilters(filters);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportMatchesToXlsx(filtered, selectedOnly ? "zaznaczone_mecze.xlsx" : activeCount ? "Kalendarium_filtrowane_mecze.xlsx" : "Kalendarium_wszystkie_mecze.xlsx");
    } finally {
      setExporting(false);
    }
  }, [filtered, selectedOnly, activeCount]);

  return (
    <div className="space-y-4 pb-24">
      {selectedOnly ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-arka-gold/50 p-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-arka-navy dark:text-arka-gold">
              <Star className="h-5 w-5 fill-arka-gold text-arka-gold" /> Zaznaczone mecze ({filtered.length})
            </h2>
            <p className="text-sm text-slate-500">Statystyki poniżej dotyczą wyłącznie Twojego koszyka meczów.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setSelectedOnly(false)}>
            <ArrowLeft className="h-4 w-4" /> Powrót do filtrów
          </button>
        </div>
      ) : (
        <FilterPanel filters={filters} options={options} activeCount={activeCount} setFilter={setFilter} clearAll={clearAll} goBack={() => navigate(-1)} />
      )}

      <StatsDashboard stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">
          {filtered.length} {plural(filtered.length, "mecz", "mecze", "meczów")}
          {!selectedOnly && activeCount > 0 && <span className="ml-2 text-sm font-normal text-slate-500">(z {matches.length} w kronice)</span>}
        </h2>
        <button type="button" className="btn-primary" onClick={handleExport} disabled={exporting || filtered.length === 0}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Eksportuj do XLS
        </button>
      </div>

      <MatchTable matches={filtered} selected={selected} onToggle={toggle} onToggleAll={setMany} jumpTo={jumpTo} />

      <SelectionBar count={selected.size} selectedOnly={selectedOnly} onShowSelected={setSelectedOnly} onClear={clear} />
    </div>
  );
}
