import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LogoMapping, Match } from "@/lib/types";
import { loadLogoMapping, loadMatches } from "@/lib/data";

interface DataState {
  matches: Match[];
  byId: Map<number, Match>;
  logos: LogoMapping;
  loading: boolean;
  error: string | null;
  logoFor: (team: string) => string | null;
}

interface SelectionState {
  selected: Set<number>;
  toggle: (id: number) => void;
  setMany: (ids: number[], value: boolean) => void;
  clear: () => void;
}

const DataContext = createContext<DataState | null>(null);
const SelectionContext = createContext<SelectionState | null>(null);

const SELECTION_KEY = "selectedMatches";
const ARKA_LOGO = "arka_gdynia.png";

export function AppProviders({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [logos, setLogos] = useState<LogoMapping>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMatches(), loadLogoMapping()])
      .then(([m, l]) => {
        if (cancelled) return;
        setMatches(m);
        setLogos(l);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  const logoFor = useCallback(
    (team: string) => {
      const file = team === "Arka Gdynia" ? (logos[team] ?? ARKA_LOGO) : logos[team];
      return file ? `${import.meta.env.BASE_URL}logos/${file}` : null;
    },
    [logos],
  );

  const data = useMemo<DataState>(
    () => ({ matches, byId, logos, loading, error, logoFor }),
    [matches, byId, logos, loading, error, logoFor],
  );

  // ---- zaznaczanie meczów (zapamiętywane w localStorage) ----
  const [selected, setSelected] = useState<Set<number>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SELECTION_KEY) ?? "[]");
      return new Set(Array.isArray(raw) ? raw.map(Number).filter((n) => !Number.isNaN(n)) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(SELECTION_KEY, JSON.stringify([...selected]));
  }, [selected]);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setMany = useCallback((ids: number[], value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selection = useMemo<SelectionState>(() => ({ selected, toggle, setMany, clear }), [selected, toggle, setMany, clear]);

  return (
    <DataContext.Provider value={data}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside AppProviders");
  return ctx;
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used inside AppProviders");
  return ctx;
}
