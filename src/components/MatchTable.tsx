import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Filters, Match } from "@/lib/types";
import { friendlyLeagueName, roundLabel, scorerTokens } from "@/lib/parsing";
import { cn, fmtInt } from "@/lib/format";
import TeamLogo from "./TeamLogo";

type JumpTo = (key: keyof Filters, value: string) => void;

const PAGE = 150;

function Cell({ onClick, children, title }: { onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} className="link text-left" title={title}>
      {children}
    </button>
  );
}

function resultClass(m: Match) {
  if (m.goalsFor === null || m.goalsAgainst === null) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (m.goalsFor > m.goalsAgainst) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
  if (m.goalsFor < m.goalsAgainst) return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
}

export function Scorers({ text, jumpTo }: { text: string | null; jumpTo: JumpTo }) {
  const tokens = scorerTokens(text);
  if (!tokens.length) return null;
  return (
    <span className="leading-relaxed">
      {tokens.map((t, i) =>
        t.type === "player" ? (
          <button key={i} type="button" className="link" onClick={() => jumpTo("scorer", t.scorer)} title={`Mecze, w których strzelał: ${t.scorer}`}>
            {t.text}
          </button>
        ) : t.type === "minute" ? (
          <button
            key={i}
            type="button"
            className="cursor-pointer text-slate-500 hover:text-arka-navy hover:underline dark:text-slate-400 dark:hover:text-arka-gold"
            onClick={() => jumpTo("goal_minute", t.minute)}
            title={`Gole w ${t.minute}. minucie`}
          >
            {t.text}
          </button>
        ) : (
          <span key={i} className="text-slate-500 dark:text-slate-400">
            {t.text}
          </span>
        ),
      )}
    </span>
  );
}

const MatchRow = memo(function MatchRow({
  m,
  index,
  checked,
  onToggle,
  jumpTo,
}: {
  m: Match;
  index: number;
  checked: boolean;
  onToggle: (id: number) => void;
  jumpTo: JumpTo;
}) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-arka-navy/[0.03] dark:border-slate-800/80 dark:hover:bg-white/[0.03]",
        checked && "bg-arka-gold/10 hover:bg-arka-gold/15 dark:bg-arka-gold/10",
      )}
    >
      <td className="px-2 py-2 text-center">
        <input type="checkbox" className="checkbox" checked={checked} onChange={() => onToggle(m.id)} aria-label={`Zaznacz mecz ${m.przeciwnik} ${m.fullDate}`} />
      </td>
      <td className="px-2 py-2 text-right text-xs text-slate-400">{index + 1}</td>
      <td className="whitespace-nowrap px-2 py-2">
        <Cell onClick={() => jumpTo("season", m.sezon)}>{m.sezon}</Cell>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-center">
        <Cell onClick={() => jumpTo("kolejka", m.kolejka)}>{roundLabel(m.kolejka)}</Cell>
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        <Cell onClick={() => jumpTo("date", m.data.replace(/\.$/, ""))} title="Mecze rozegrane tego dnia w innych latach">
          {m.data}
        </Cell>
      </td>
      <td className="whitespace-nowrap px-2 py-2">{m.rok !== null && <Cell onClick={() => jumpTo("rok", String(m.rok))}>{m.rok}</Cell>}</td>
      <td className="whitespace-nowrap px-2 py-2">
        <Cell onClick={() => jumpTo("league", m.liga)}>{friendlyLeagueName(m.liga, m.sezon)}</Cell>
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        <Cell onClick={() => jumpTo("place", m.miejsce)}>{m.miejsce}</Cell>
      </td>
      <td className="px-2 py-2">
        <div className="flex min-w-[170px] items-center gap-2">
          <TeamLogo team={m.przeciwnik} />
          <Cell onClick={() => jumpTo("opponent", m.przeciwnik)}>{m.przeciwnik}</Cell>
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-center">
        {m.wynik && (
          <button
            type="button"
            onClick={() => jumpTo("result", m.wynik!)}
            className={cn("rounded-md px-2 py-0.5 font-mono text-sm font-bold transition hover:ring-2 hover:ring-arka-gold", resultClass(m))}
          >
            {m.wynik}
          </button>
        )}
      </td>
      <td className="min-w-[200px] max-w-[380px] px-2 py-2 text-[13px]">
        <Scorers text={m.strzelcy} jumpTo={jumpTo} />
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{m.frekwencja ? fmtInt(m.frekwencja) : ""}</td>
      <td className="min-w-[150px] px-2 py-2 text-[13px]">{m.sedzia && <Cell onClick={() => jumpTo("referee", m.sedzia!)}>{m.sedzia}</Cell>}</td>
      <td className="px-2 py-2 text-center">
        <Link
          to={`/mecz/${m.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-arka-navy text-white transition hover:scale-110 hover:bg-arka-navy-light dark:bg-arka-gold dark:text-arka-navy"
          title="Szczegóły meczu"
          aria-label="Szczegóły meczu"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
});

interface Props {
  matches: Match[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[], value: boolean) => void;
  jumpTo: JumpTo;
}

export default function MatchTable({ matches, selected, onToggle, onToggleAll, jumpTo }: Props) {
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLimit(PAGE), [matches]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setLimit((l) => Math.min(l + PAGE, matches.length));
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [matches, limit >= matches.length]);

  const checkedCount = matches.reduce((acc, m) => acc + (selected.has(m.id) ? 1 : 0), 0);
  const allChecked = matches.length > 0 && checkedCount === matches.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = checkedCount > 0 && !allChecked;
  }, [checkedCount, allChecked]);

  const visible = matches.slice(0, limit);
  const headers = ["#", "Sezon", "Kolejka", "Data", "Rok", "Liga", "Miejsce", "Przeciwnik", "Wynik", "Strzelcy", "Frekwencja", "Sędzia", "Szczegóły"];

  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-arka-navy text-left text-xs uppercase tracking-wide text-white dark:bg-slate-800">
              <th className="px-2 py-3 text-center">
                <input
                  ref={allRef}
                  type="checkbox"
                  className="checkbox"
                  checked={allChecked}
                  onChange={() => onToggleAll(matches.map((m) => m.id), !allChecked)}
                  title="Zaznacz wszystkie przefiltrowane mecze"
                  aria-label="Zaznacz wszystkie"
                />
              </th>
              {headers.map((h) => (
                <th key={h} className={cn("whitespace-nowrap px-2 py-3 font-semibold", (h === "Wynik" || h === "Szczegóły" || h === "Kolejka") && "text-center", (h === "#" || h === "Frekwencja") && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((m, i) => (
              <MatchRow key={m.id} m={m} index={i} checked={selected.has(m.id)} onToggle={onToggle} jumpTo={jumpTo} />
            ))}
          </tbody>
        </table>
        {matches.length === 0 && <div className="p-10 text-center text-slate-500">Brak meczów spełniających wybrane kryteria.</div>}
      </div>
      {limit < matches.length && (
        <div ref={sentinel} className="flex justify-center p-4">
          <button type="button" className="btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
            Pokaż więcej ({matches.length - limit} pozostało)
          </button>
        </div>
      )}
    </div>
  );
}
