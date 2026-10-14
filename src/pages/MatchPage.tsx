import { useMemo, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowDown, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Flag, Info, Timer, Users } from "lucide-react";
import { useData } from "@/context/AppContext";
import { filterHref } from "@/hooks/useFilterParams";
import type { Card, Match, SquadPlayer } from "@/lib/types";
import { OWN_GOAL_QUERY, friendlyLeagueName, isNumericRound, minuteValue, parseGoalEvents, roundLabel, type TimelineEvent } from "@/lib/parsing";
import { cn, fmtDate, fmtInt } from "@/lib/format";
import TeamLogo from "@/components/TeamLogo";
import NotFound from "./NotFound";

const ARKA = "Arka Gdynia";

function cardEvents(cards: Card[], isHome: boolean): TimelineEvent[] {
  return cards.map((c) => ({ minute: c.minute, type: c.type === "red" ? "card_red" : "card_yellow", player: c.name, isHome }));
}

function EventIcon({ type }: { type: TimelineEvent["type"] }) {
  switch (type) {
    case "goal":
      return <span title="Gol">⚽</span>;
    case "penalty":
      return <span title="Rzut karny">🥅</span>;
    case "own_goal":
      return <span title="Bramka samobójcza">❌</span>;
    case "card_yellow":
      return <span className="inline-block h-4 w-3 rounded-[2px] bg-yellow-400 shadow" title="Żółta kartka" />;
    case "card_red":
      return <span className="inline-block h-4 w-3 rounded-[2px] bg-red-600 shadow" title="Czerwona kartka" />;
  }
}

function EventLabel({ ev }: { ev: TimelineEvent }) {
  if (ev.type === "goal" || ev.type === "penalty")
    return (
      <>
        {ev.player ? (
          <Link to={filterHref("scorer", ev.player)} className="link font-medium">
            {ev.player}
          </Link>
        ) : (
          <span className="text-slate-500">gol</span>
        )}
        {ev.type === "penalty" && <span className="text-xs text-slate-500"> (k.)</span>}
      </>
    );
  if (ev.type === "own_goal")
    return (
      <>
        <Link to={filterHref("scorer", OWN_GOAL_QUERY)} className="link font-medium">
          {ev.player || "Bramka samobójcza"}
        </Link>
        <span className="text-xs text-slate-500"> (samob.)</span>
      </>
    );
  return <span>{ev.player}</span>;
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-arka-navy/40 via-arka-gold/60 to-arka-navy/40 dark:from-arka-gold/30 dark:via-arka-gold/50 dark:to-arka-gold/30" />
      <ul className="space-y-2">
        {events.map((ev, i) => (
          <li key={i} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <div className={cn("text-right", !ev.isHome && "invisible")}>{ev.isHome && <EventLabel ev={ev} />}</div>
            <div className="z-10 flex min-w-[64px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <EventIcon type={ev.type} />
              <span className="tabular-nums text-arka-navy dark:text-arka-gold">{ev.minute ? `${ev.minute}'` : "–"}</span>
            </div>
            <div className={cn(ev.isHome && "invisible")}>{!ev.isHome && <EventLabel ev={ev} />}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lineup({ team, players, align }: { team: string; players: SquadPlayer[]; align: "left" | "right" }) {
  const starters = players.filter((p) => p.status !== "on");
  const subs = players.filter((p) => p.status === "on");
  const Item = ({ p }: { p: SquadPlayer }) => (
    <li className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-slate-50 dark:odd:bg-slate-800/50", align === "right" && "flex-row-reverse text-right")}>
      <Link to={filterHref("player", p.name)} className="link min-w-0 flex-1 truncate">
        {p.name}
      </Link>
      {p.status === "off" && (
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-red-600 dark:text-red-400" title={`Zszedł (${p.minute}')`}>
          <ArrowDown className="h-3.5 w-3.5" />
          {p.minute}'
        </span>
      )}
      {p.status === "on" && (
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400" title={`Wszedł (${p.minute}')`}>
          <ArrowUp className="h-3.5 w-3.5" />
          {p.minute}'
        </span>
      )}
    </li>
  );
  return (
    <div className="min-w-0">
      <h4 className={cn("mb-2 flex items-center gap-2 font-bold text-arka-navy dark:text-arka-gold", align === "right" && "flex-row-reverse text-right")}>
        <TeamLogo team={team} />
        <span className="truncate">{team}</span>
      </h4>
      {players.length === 0 ? (
        <p className={cn("text-sm text-slate-500", align === "right" && "text-right")}>Brak danych o składzie.</p>
      ) : (
        <>
          <ul className="space-y-0.5 text-sm">
            {starters.map((p, i) => (
              <Item key={`s${i}`} p={p} />
            ))}
          </ul>
          {subs.length > 0 && (
            <>
              <div className={cn("mb-1 mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400", align === "right" && "text-right")}>Rezerwowi</div>
              <ul className="space-y-0.5 text-sm">
                {subs.map((p, i) => (
                  <Item key={`r${i}`} p={p} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        <span className="text-arka-navy dark:text-arka-gold">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, byId } = useData();
  const match = byId.get(Number(id));

  const neighbours = useMemo(() => {
    if (!match) return { prev: null as Match | null, next: null as Match | null };
    const idx = matches.indexOf(match); // dane są posortowane chronologicznie
    return { prev: matches[idx - 1] ?? null, next: matches[idx + 1] ?? null };
  }, [matches, match]);

  const view = useMemo(() => {
    if (!match) return null;
    const away = match.miejsce === "Wyjazd";
    const arkaHome = !away;
    const homeTeam = arkaHome ? ARKA : match.przeciwnik;
    const awayTeam = arkaHome ? match.przeciwnik : ARKA;
    const score = match.goalsFor !== null && match.goalsAgainst !== null ? (arkaHome ? [match.goalsFor, match.goalsAgainst] : [match.goalsAgainst, match.goalsFor]) : null;

    const events = [
      ...parseGoalEvents(match.strzelcy, arkaHome),
      ...parseGoalEvents(match.golPrzeciwnika, !arkaHome),
      ...cardEvents(match.kartkiArka, arkaHome),
      ...cardEvents(match.kartkiPrzeciwnik, !arkaHome),
    ]
      .map((e, i) => ({ e, i }))
      .sort((a, b) => minuteValue(a.e.minute) - minuteValue(b.e.minute) || a.i - b.i)
      .map(({ e }) => e);

    return {
      homeTeam,
      awayTeam,
      score,
      events,
      homeSquad: arkaHome ? match.skladArka : match.skladPrzeciwnika,
      awaySquad: arkaHome ? match.skladPrzeciwnika : match.skladArka,
    };
  }, [match]);

  if (!match || !view) return <NotFound />;

  const outcome =
    match.goalsFor === null || match.goalsAgainst === null ? null : match.goalsFor > match.goalsAgainst ? "W" : match.goalsFor < match.goalsAgainst ? "P" : "R";

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
          <ArrowLeft className="h-4 w-4" /> Powrót
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost px-3" disabled={!neighbours.prev} onClick={() => neighbours.prev && navigate(`/mecz/${neighbours.prev.id}`, { replace: true })} title="Poprzedni mecz">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Poprzedni</span>
          </button>
          <button type="button" className="btn-ghost px-3" disabled={!neighbours.next} onClick={() => neighbours.next && navigate(`/mecz/${neighbours.next.id}`, { replace: true })} title="Następny mecz">
            <span className="hidden sm:inline">Następny</span> <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-arka-navy-dark via-arka-navy to-arka-navy-light p-5 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-arka-gold/10 blur-3xl" />
        <div className="relative mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-white/80 sm:text-sm">
          <Link to={filterHref("season", match.sezon)} className="hover:text-arka-gold">
            Sezon {match.sezon}
          </Link>
          <span className="text-arka-gold">•</span>
          <Link to={filterHref("league", match.liga)} className="hover:text-arka-gold">
            {friendlyLeagueName(match.liga, match.sezon)}
          </Link>
          <span className="text-arka-gold">•</span>
          <span>{isNumericRound(match.kolejka) ? `Kolejka ${match.kolejka}` : roundLabel(match.kolejka)}</span>
        </div>

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          {[view.homeTeam, view.awayTeam].map((team, i) => (
            <div key={team + i} className={cn("flex flex-col items-center gap-3 text-center", i === 1 && "order-3")}>
              <div className="rounded-full bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur sm:p-4">
                <TeamLogo team={team} size="lg" />
              </div>
              <h2 className="text-sm font-bold leading-tight sm:text-xl">
                {team === ARKA ? (
                  team
                ) : (
                  <Link to={filterHref("opponent", team)} className="hover:text-arka-gold">
                    {team}
                  </Link>
                )}
              </h2>
            </div>
          ))}
          <div className="order-2 flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-black/25 px-4 py-2 font-mono text-4xl font-black tabular-nums tracking-tight text-arka-gold ring-1 ring-white/10 sm:px-6 sm:text-6xl">
              {view.score ? `${view.score[0]}:${view.score[1]}` : match.wynik ?? "–"}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold">{match.miejsce}</span>
              {outcome && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-black",
                    outcome === "W" ? "bg-emerald-500" : outcome === "P" ? "bg-red-500" : "bg-amber-400 text-arka-navy",
                  )}
                  title={outcome === "W" ? "Wygrana Arki" : outcome === "P" ? "Porażka Arki" : "Remis"}
                >
                  {outcome}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <Section title="Informacje o meczu" icon={<Info className="h-4 w-4" />}>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-500">
                  <CalendarDays className="h-4 w-4" /> Data
                </dt>
                <dd className="font-semibold">{fmtDate(match.fullDate)}</dd>
              </div>
              {match.frekwencja ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" /> Frekwencja
                  </dt>
                  <dd className="font-semibold">{fmtInt(match.frekwencja)} widzów</dd>
                </div>
              ) : null}
              {match.sedzia && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-500">
                    <Flag className="h-4 w-4" /> Sędzia
                  </dt>
                  <dd className="text-right">
                    <Link to={filterHref("referee", match.sedzia)} className="link font-semibold">
                      {match.sedzia}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Section>

          <Section title="Przebieg meczu" icon={<Timer className="h-4 w-4" />}>
            {view.events.length ? (
              <>
                <div className="mb-3 grid grid-cols-[1fr_auto_1fr] gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <span className="truncate text-right">{view.homeTeam}</span>
                  <span className="min-w-[64px]" />
                  <span className="truncate">{view.awayTeam}</span>
                </div>
                <Timeline events={view.events} />
              </>
            ) : (
              <p className="text-sm text-slate-500">Brak szczegółowych danych o przebiegu meczu.</p>
            )}
          </Section>
        </div>

        <Section title="Składy" icon={<ClipboardList className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <Lineup team={view.homeTeam} players={view.homeSquad} align="left" />
            <Lineup team={view.awayTeam} players={view.awaySquad} align="right" />
          </div>
        </Section>
      </div>
    </div>
  );
}
