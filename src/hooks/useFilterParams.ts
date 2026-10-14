import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Filters } from "@/lib/types";
import { filtersFromParams } from "@/lib/filters";

/**
 * Filtry przechowywane w query stringu URL – dzięki temu działa "Cofnij filtr"
 * (historia przeglądarki), linki są udostępnialne, a odświeżenie strony zachowuje stan.
 */
export function useFilterParams() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const selectedOnly = params.get("selected") === "1";

  const commit = useCallback(
    (next: URLSearchParams, replace = false) => {
      const qs = next.toString();
      navigate({ pathname: "/", search: qs ? `?${qs}` : "" }, { replace });
    },
    [navigate],
  );

  /** Ustawia jeden filtr (zachowując pozostałe). */
  const setFilter = useCallback(
    (key: keyof Filters, value: string, replace = false) => {
      const next = new URLSearchParams(params);
      next.delete("selected");
      if (value && !(key === "sort_order" && value === "asc")) next.set(key, value);
      else next.delete(key);
      commit(next, replace);
    },
    [params, commit],
  );

  /** Ustawia wyłącznie podany filtr (jak linki w oryginalnej tabeli), zachowując sortowanie. */
  const jumpTo = useCallback(
    (key: keyof Filters, value: string) => {
      const next = new URLSearchParams();
      if (filters.sort_order === "desc") next.set("sort_order", "desc");
      if (value) next.set(key, value);
      commit(next);
    },
    [filters.sort_order, commit],
  );

  const clearAll = useCallback(() => commit(new URLSearchParams()), [commit]);

  const setSelectedOnly = useCallback(
    (on: boolean) => {
      const next = new URLSearchParams(params);
      if (on) next.set("selected", "1");
      else next.delete("selected");
      commit(next);
    },
    [params, commit],
  );

  return { filters, selectedOnly, setFilter, jumpTo, clearAll, setSelectedOnly };
}

/** Buduje link do widoku wyników z jednym filtrem (używane np. na karcie meczu). */
export function filterHref(key: keyof Filters, value: string): string {
  return `/?${new URLSearchParams({ [key]: value }).toString()}`;
}
