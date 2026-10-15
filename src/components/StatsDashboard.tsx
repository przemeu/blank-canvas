import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarRange,
  ChevronDown,
  Crown,
  Flame,
  Goal,
  Hash,
  Heart,
  Percent,
  Shield,
  ShieldOff,
  Skull,
  Swords,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react";
import type { Stats, Streak } from "@/lib/stats";
import type { Match } from "@/lib/types";
import { avg, cn, fmtDate, fmtInt, pct, playersWord, plural, signed } from "@/lib/format";

function Card({ title, icon, children, accent }: { title: string; icon: ReactNode; children: ReactNode; accent?: string }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className={`absolute inset-y-0 left-0 w-1 ${accent ?? "bg-arka-navy dark:bg-arka-gold"}`} />
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <span className="text-arka-navy dark:text-arka-gold">{icon}</span>
        {title}
      </h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

const V = ({ children }: { children: ReactNode }) => <span className="stat-value">{children}</span>;

function StreakCard({ title, icon, streak, accent }: { title: string; icon: ReactNode; streak: Streak; accent?: string }) {
  return (
    <Card title={title} icon={icon} accent={accent}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-arka-navy dark:text-arka-gold">{streak.length}</span>
        <span className="text-xs text-slate-500">{streak.length === 1 ? "mecz" : "meczów z rzędu"}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <CalendarRange className="h-3.5 w-3.5" />
        {streak.length ? (
          <span>
            {fmtDate(streak.from)} – {fmtDate(streak.to)}
          </span>
        ) : (
          <span>–</span>
        )}
      </div>
    </Card>
  );
}

function MatchRef({ m }: { m: Match | null }) {
  if (!m) return <>–</>;
  return (
    <Link to={`/mecz/${m.id}`} className="hover:underline">
      <V>{m.wynik}</V> <span className="text-slate-600 dark:text-slate-300">vs {m.przeciwnik}</span>{" "}
      <span className="whitespace-nowrap text-xs text-slate-500">({m.sezon})</span>
    </Link>
  );
}

function Bar({ w, d, l }: { w: number; d: number; l: number }) {
  const t = w + d + l;
  if (!t) return null;
  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="bg-emerald-500" style={{ width: `${(w / t) * 100}%` }} title={`Wygrane ${w}`} />
      <div className="bg-amber-400" style={{ width: `${(d / t) * 100}%` }} title={`Remisy ${d}`} />
      <div className="bg-red-500" style={{ width: `${(l / t) * 100}%` }} title={`Porażki ${l}`} />
    </div>
  );
}

export default function StatsDashboard({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState(true);
  const s = stats;
  const n = s.total;
  const scorers =
    s.topScorers.length === 0 ? (
      <>–</>
    ) : s.topScorers.length > 3 ? (
      <>
        {playersWord(s.topScorers.length)} · <V>{s.topScorers[0].goals}</V>
      </>
    ) : (
      s.topScorers.map((t) => (
        <div key={t.name}>
          {t.name} · <V>{t.goals}</V>
        </div>
      ))
    );

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
          <BarChart3 className="h-4 w-4" />
          Statystyki na żywo
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            {fmtInt(n)} {plural(n, "mecz", "mecze", "meczów")}
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="animate-fade-in p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card title="Liczba meczów" icon={<Hash className="h-4 w-4" />}>
        <div className="text-3xl font-black text-arka-navy dark:text-arka-gold">{fmtInt(n)}</div>
        <Row label="Dom">
          <V>{s.home}</V>
        </Row>
        <Row label="Wyjazd / neutralne">
          <V>{s.away}</V>
        </Row>
      </Card>

      <Card title="Bilans meczowy" icon={<BarChart3 className="h-4 w-4" />}>
        <Row label="Wygrane">
          <V>{s.wins}</V> <span className="text-xs text-slate-500">({pct(s.wins, n)}%)</span>
        </Row>
        <Row label="Remisy">
          <V>{s.draws}</V> <span className="text-xs text-slate-500">({pct(s.draws, n)}%)</span>
        </Row>
        <Row label="Porażki">
          <V>{s.losses}</V> <span className="text-xs text-slate-500">({pct(s.losses, n)}%)</span>
        </Row>
        <Bar w={s.wins} d={s.draws} l={s.losses} />
      </Card>

      <Card title="Dom vs wyjazd (W-R-P)" icon={<Swords className="h-4 w-4" />}>
        <Row label="Dom">
          <V>
            {s.homeRecord.w}-{s.homeRecord.d}-{s.homeRecord.l}
          </V>
        </Row>
        <Bar w={s.homeRecord.w} d={s.homeRecord.d} l={s.homeRecord.l} />
        <Row label="Wyjazd">
          <V>
            {s.awayRecord.w}-{s.awayRecord.d}-{s.awayRecord.l}
          </V>
        </Row>
        <Bar w={s.awayRecord.w} d={s.awayRecord.d} l={s.awayRecord.l} />
      </Card>

      <Card title="Bilans bramkowy" icon={<Goal className="h-4 w-4" />}>
        <Row label="Łącznie">
          <V>
            {s.goalsFor} : {s.goalsAgainst}
          </V>{" "}
          <span className="text-xs text-slate-500">({signed(s.goalsFor - s.goalsAgainst)})</span>
        </Row>
        <Row label="Dom">
          <V>
            {s.homeGoals[0]} : {s.homeGoals[1]}
          </V>
        </Row>
        <Row label="Wyjazd">
          <V>
            {s.awayGoals[0]} : {s.awayGoals[1]}
          </V>
        </Row>
      </Card>

      <Card title="Średnia bramek na mecz" icon={<Activity className="h-4 w-4" />}>
        <Row label="Strzelone">
          <V>{avg(s.goalsFor, n)}</V>
        </Row>
        <Row label="Stracone">
          <V>{avg(s.goalsAgainst, n)}</V>
        </Row>
        <Row label="Łącznie w meczu">
          <V>{avg(s.goalsFor + s.goalsAgainst, n)}</V>
        </Row>
      </Card>

      <Card title="Frekwencja" icon={<Users className="h-4 w-4" />}>
        <Row label="Rekord dom">
          <V>{s.attendance.homeMax ? fmtInt(s.attendance.homeMax) : "–"}</V>
          {s.attendance.homeMaxYear && <span className="text-xs text-slate-500"> ({s.attendance.homeMaxYear})</span>}
        </Row>
        <Row label="Średnia dom">
          <V>{fmtInt(s.attendance.homeAvg)}</V>
        </Row>
        <Row label="Rekord wyjazd">
          <V>{s.attendance.awayMax ? fmtInt(s.attendance.awayMax) : "–"}</V>
          {s.attendance.awayMaxYear && <span className="text-xs text-slate-500"> ({s.attendance.awayMaxYear})</span>}
        </Row>
        <Row label="Średnia wyjazd">
          <V>{fmtInt(s.attendance.awayAvg)}</V>
        </Row>
      </Card>

      <Card title="Najlepszy strzelec" icon={<Crown className="h-4 w-4" />} accent="bg-arka-gold">
        <Row label="Łącznie">
          <div>{scorers}</div>
        </Row>
        <Row label="Dom">
          {s.topScorerHome ? (
            <>
              {s.topScorerHome.name} · <V>{s.topScorerHome.goals}</V>
            </>
          ) : (
            "–"
          )}
        </Row>
        <Row label="Wyjazd">
          {s.topScorerAway ? (
            <>
              {s.topScorerAway.name} · <V>{s.topScorerAway.goals}</V>
            </>
          ) : (
            "–"
          )}
        </Row>
      </Card>

      <Card title="Czyste konta" icon={<Shield className="h-4 w-4" />}>
        <Row label="Łącznie">
          <V>{s.cleanSheets}</V> <span className="text-xs text-slate-500">({pct(s.cleanSheets, n)}%)</span>
        </Row>
        <Row label="Dom">
          <V>{s.homeCleanSheets}</V> <span className="text-xs text-slate-500">({pct(s.homeCleanSheets, s.home)}%)</span>
        </Row>
        <Row label="Wyjazd">
          <V>{s.awayCleanSheets}</V> <span className="text-xs text-slate-500">({pct(s.awayCleanSheets, s.away)}%)</span>
        </Row>
      </Card>

      <StreakCard title="Seria wygranych" icon={<Flame className="h-4 w-4" />} streak={s.streaks.wins} accent="bg-emerald-500" />
      <StreakCard title="Seria bez porażki" icon={<Trophy className="h-4 w-4" />} streak={s.streaks.unbeaten} accent="bg-emerald-500" />
      <StreakCard title="Seria ze strzeloną bramką" icon={<Target className="h-4 w-4" />} streak={s.streaks.scoring} accent="bg-sky-500" />
      <StreakCard title="Seria czystych kont" icon={<Shield className="h-4 w-4" />} streak={s.streaks.cleanSheets} accent="bg-sky-500" />
      <StreakCard title="Seria bez zwycięstwa" icon={<Skull className="h-4 w-4" />} streak={s.streaks.winless} accent="bg-red-500" />
      <StreakCard title="Seria bez czystego konta" icon={<ShieldOff className="h-4 w-4" />} streak={s.streaks.noCleanSheet} accent="bg-red-500" />

      <Card title="Rekordowe wyniki" icon={<Trophy className="h-4 w-4" />}>
        <Row label="Zwycięstwo">
          <MatchRef m={s.biggestWin} />
        </Row>
        <Row label="Porażka">
          <MatchRef m={s.biggestLoss} />
        </Row>
      </Card>

      <Card title="Najczęstszy wynik" icon={<Percent className="h-4 w-4" />}>
        {(
          [
            ["Łącznie", s.commonScore.total],
            ["Dom", s.commonScore.home],
            ["Wyjazd", s.commonScore.away],
          ] as const
        ).map(([label, c]) => (
          <Row key={label} label={label}>
            <V>{c.score ?? "–"}</V>
            {c.count > 0 && <span className="text-xs text-slate-500"> ({c.count}×)</span>}
          </Row>
        ))}
      </Card>

      <Card title="Ulubiony rywal" icon={<Heart className="h-4 w-4" />} accent="bg-emerald-500">
        {s.bestOpponent ? (
          <>
            <div className="font-semibold">{s.bestOpponent.name}</div>
            <Row label="Bilans W-R-P">
              <V>
                {s.bestOpponent.wins}-{s.bestOpponent.draws}-{s.bestOpponent.losses}
              </V>{" "}
              <span className="text-xs text-slate-500">({s.bestOpponent.points} pkt)</span>
            </Row>
            <Row label="Bramki">
              <V>
                {s.bestOpponent.goalsFor}:{s.bestOpponent.goalsAgainst}
              </V>{" "}
              <span className="text-xs text-slate-500">({signed(s.bestOpponent.goalsFor - s.bestOpponent.goalsAgainst)})</span>
            </Row>
          </>
        ) : (
          "–"
        )}
      </Card>

      <Card title="Najtrudniejszy rywal" icon={<Skull className="h-4 w-4" />} accent="bg-red-500">
        {s.worstOpponent ? (
          <>
            <div className="font-semibold">{s.worstOpponent.name}</div>
            <Row label="Bilans W-R-P">
              <V>
                {s.worstOpponent.wins}-{s.worstOpponent.draws}-{s.worstOpponent.losses}
              </V>{" "}
              <span className="text-xs text-slate-500">({s.worstOpponent.points} pkt)</span>
            </Row>
            <Row label="Bramki">
              <V>
                {s.worstOpponent.goalsFor}:{s.worstOpponent.goalsAgainst}
              </V>{" "}
              <span className="text-xs text-slate-500">({signed(s.worstOpponent.goalsFor - s.worstOpponent.goalsAgainst)})</span>
            </Row>
          </>
        ) : (
          "–"
        )}
      </Card>

      <Card title="Ulubiony sędzia" icon={<ThumbsUp className="h-4 w-4" />} accent="bg-emerald-500">
        {s.bestReferee ? (
          <>
            <div className="font-semibold">{s.bestReferee.name}</div>
            <Row label="Punkty">
              <V>
                {s.bestReferee.points}/{s.bestReferee.possiblePoints}
              </V>{" "}
              <span className="text-xs text-slate-500">({s.bestReferee.pointsPct.toFixed(1)}%)</span>
            </Row>
            <Row label="Bilans W-R-P">
              <V>
                {s.bestReferee.wins}-{s.bestReferee.draws}-{s.bestReferee.losses}
              </V>{" "}
              <span className="text-xs text-slate-500">
                ({s.bestReferee.games} {plural(s.bestReferee.games, "mecz", "mecze", "meczów")})
              </span>
            </Row>
            <Row label="Bramki">
              <V>
                {s.bestReferee.goalsFor}:{s.bestReferee.goalsAgainst}
              </V>{" "}
              <span className="text-xs text-slate-500">({signed(s.bestReferee.goalsFor - s.bestReferee.goalsAgainst)})</span>
            </Row>
          </>
        ) : (
          "–"
        )}
      </Card>

      <Card title="Znienawidzony sędzia" icon={<ThumbsDown className="h-4 w-4" />} accent="bg-red-500">
        {s.worstReferee ? (
          <>
            <div className="font-semibold">{s.worstReferee.name}</div>
            <Row label="Porażki">
              <V>{s.worstReferee.losses}</V>{" "}
              <span className="text-xs text-slate-500">
                (z {s.worstReferee.games} {plural(s.worstReferee.games, "meczu", "meczów", "meczów")})
              </span>
            </Row>
            <Row label="Bilans W-R-P">
              <V>
                {s.worstReferee.wins}-{s.worstReferee.draws}-{s.worstReferee.losses}
              </V>{" "}
              <span className="text-xs text-slate-500">({s.worstReferee.points} pkt)</span>
            </Row>
            <Row label="Punkty">
              <V>
                {s.worstReferee.points}/{s.worstReferee.possiblePoints}
              </V>{" "}
              <span className="text-xs text-slate-500">({s.worstReferee.pointsPct.toFixed(1)}%)</span>
            </Row>
            <Row label="Bramki">
              <V>
                {s.worstReferee.goalsFor}:{s.worstReferee.goalsAgainst}
              </V>{" "}
              <span className="text-xs text-slate-500">({signed(s.worstReferee.goalsFor - s.worstReferee.goalsAgainst)})</span>
            </Row>
          </>
        ) : (
          "–"
        )}
      </Card>
          </div>
        </div>
      )}
    </section>
  );
}
