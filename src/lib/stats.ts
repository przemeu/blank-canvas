import type { Match } from "./types";
import { extractScorerNames } from "./parsing";

export interface Streak {
  length: number;
  from: string | null;
  to: string | null;
}

export interface OpponentRecord {
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface RefereeRecord {
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  possiblePoints: number;
  pointsPct: number;
}

export interface ScoreCount {
  score: string | null;
  count: number;
}

export interface Stats {
  total: number;
  home: number;
  away: number;
  wins: number;
  draws: number;
  losses: number;
  homeRecord: { w: number; d: number; l: number };
  awayRecord: { w: number; d: number; l: number };
  goalsFor: number;
  goalsAgainst: number;
  homeGoals: [number, number];
  awayGoals: [number, number];
  attendance: {
    homeMax: number;
    homeMaxYear: string | null;
    homeAvg: number | null;
    awayMax: number;
    awayMaxYear: string | null;
    awayAvg: number | null;
  };
  topScorers: { name: string; goals: number }[];
  topScorerHome: { name: string; goals: number } | null;
  topScorerAway: { name: string; goals: number } | null;
  cleanSheets: number;
  homeCleanSheets: number;
  awayCleanSheets: number;
  streaks: {
    wins: Streak;
    unbeaten: Streak;
    scoring: Streak;
    cleanSheets: Streak;
    winless: Streak;
    noCleanSheet: Streak;
  };
  biggestWin: Match | null;
  biggestLoss: Match | null;
  commonScore: { total: ScoreCount; home: ScoreCount; away: ScoreCount };
  bestOpponent: OpponentRecord | null;
  worstOpponent: OpponentRecord | null;
  bestReferee: RefereeRecord | null;
  worstReferee: RefereeRecord | null;
}

class StreakTracker {
  private current = 0;
  private start: string | null = null;
  best: Streak = { length: 0, from: null, to: null };

  step(ok: boolean, date: string) {
    if (ok) {
      if (this.current === 0) this.start = date;
      this.current++;
      if (this.current > this.best.length) this.best = { length: this.current, from: this.start, to: date };
    } else {
      this.current = 0;
    }
  }
}

function topOf(counter: Map<string, number>): { name: string; goals: number } | null {
  let best: { name: string; goals: number } | null = null;
  for (const [name, goals] of counter) if (!best || goals > best.goals) best = { name, goals };
  return best;
}

function mostCommon(counter: Map<string, number>): ScoreCount {
  let best: ScoreCount = { score: null, count: 0 };
  for (const [score, count] of counter) if (count > best.count) best = { score, count };
  return best;
}

const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

/**
 * Wylicza wszystkie statystyki dla zestawu meczów (port calculate_metrics z app.py).
 * Serie liczone są zawsze chronologicznie, niezależnie od kierunku sortowania tabeli.
 */
export function computeStats(input: Match[]): Stats {
  const matches = [...input].sort((a, b) => (a.fullDate < b.fullDate ? -1 : a.fullDate > b.fullDate ? 1 : a.id - b.id));

  const s: Stats = {
    total: matches.length,
    home: 0,
    away: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    homeRecord: { w: 0, d: 0, l: 0 },
    awayRecord: { w: 0, d: 0, l: 0 },
    goalsFor: 0,
    goalsAgainst: 0,
    homeGoals: [0, 0],
    awayGoals: [0, 0],
    attendance: { homeMax: 0, homeMaxYear: null, homeAvg: null, awayMax: 0, awayMaxYear: null, awayAvg: null },
    topScorers: [],
    topScorerHome: null,
    topScorerAway: null,
    cleanSheets: 0,
    homeCleanSheets: 0,
    awayCleanSheets: 0,
    streaks: {
      wins: { length: 0, from: null, to: null },
      unbeaten: { length: 0, from: null, to: null },
      scoring: { length: 0, from: null, to: null },
      cleanSheets: { length: 0, from: null, to: null },
      winless: { length: 0, from: null, to: null },
      noCleanSheet: { length: 0, from: null, to: null },
    },
    biggestWin: null,
    biggestLoss: null,
    commonScore: { total: { score: null, count: 0 }, home: { score: null, count: 0 }, away: { score: null, count: 0 } },
    bestOpponent: null,
    worstOpponent: null,
    bestReferee: null,
    worstReferee: null,
  };

  const tWins = new StreakTracker();
  const tUnbeaten = new StreakTracker();
  const tScoring = new StreakTracker();
  const tClean = new StreakTracker();
  const tWinless = new StreakTracker();
  const tNoClean = new StreakTracker();

  const homeAtt: number[] = [];
  const awayAtt: number[] = [];
  const scorers = new Map<string, number>();
  const homeScorers = new Map<string, number>();
  const awayScorers = new Map<string, number>();
  const scoresTotal = new Map<string, number>();
  const scoresHome = new Map<string, number>();
  const scoresAway = new Map<string, number>();
  const opponents = new Map<string, OpponentRecord>();
  const referees = new Map<string, RefereeRecord>();
  let bestWinDiff = 0;
  let worstLossDiff = 0;

  for (const m of matches) {
    const isHome = m.miejsce === "Dom";
    const isAway = m.miejsce === "Wyjazd";
    if (isHome) s.home++;
    else s.away++;

    // Frekwencja
    if (m.frekwencja && m.frekwencja > 0) {
      const year = m.fullDate ? m.fullDate.slice(0, 4) : null;
      if (isHome) {
        homeAtt.push(m.frekwencja);
        if (m.frekwencja > s.attendance.homeMax) {
          s.attendance.homeMax = m.frekwencja;
          s.attendance.homeMaxYear = year;
        }
      } else if (isAway) {
        awayAtt.push(m.frekwencja);
        if (m.frekwencja > s.attendance.awayMax) {
          s.attendance.awayMax = m.frekwencja;
          s.attendance.awayMaxYear = year;
        }
      }
    }

    // Strzelcy
    for (const name of extractScorerNames(m.strzelcy)) {
      bump(scorers, name);
      bump(isHome ? homeScorers : awayScorers, name);
    }

    if (m.goalsFor === null || m.goalsAgainst === null || !m.fullDate) continue;
    const gf = m.goalsFor;
    const ga = m.goalsAgainst;
    const date = m.fullDate;

    s.goalsFor += gf;
    s.goalsAgainst += ga;
    if (isHome) {
      s.homeGoals[0] += gf;
      s.homeGoals[1] += ga;
    } else if (isAway) {
      s.awayGoals[0] += gf;
      s.awayGoals[1] += ga;
    }

    const rec = isHome ? s.homeRecord : s.awayRecord;
    if (gf > ga) {
      s.wins++;
      rec.w++;
    } else if (gf === ga) {
      s.draws++;
      rec.d++;
    } else {
      s.losses++;
      rec.l++;
    }

    const diff = gf - ga;
    if (diff > 0 && diff > bestWinDiff) {
      bestWinDiff = diff;
      s.biggestWin = m;
    }
    if (diff < 0 && diff < worstLossDiff) {
      worstLossDiff = diff;
      s.biggestLoss = m;
    }

    tWins.step(gf > ga, date);
    tUnbeaten.step(gf >= ga, date);
    tWinless.step(gf <= ga, date);
    tScoring.step(gf > 0, date);
    tClean.step(ga === 0, date);
    tNoClean.step(ga > 0, date);

    if (ga === 0) {
      s.cleanSheets++;
      if (isHome) s.homeCleanSheets++;
      else if (isAway) s.awayCleanSheets++;
    }

    if (m.wynik) {
      bump(scoresTotal, m.wynik);
      if (isHome) bump(scoresHome, m.wynik);
      else if (isAway) bump(scoresAway, m.wynik);
    }

    if (m.przeciwnik) {
      let o = opponents.get(m.przeciwnik);
      if (!o) {
        o = { name: m.przeciwnik, games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
        opponents.set(m.przeciwnik, o);
      }
      o.games++;
      o.goalsFor += gf;
      o.goalsAgainst += ga;
      if (gf > ga) o.wins++;
      else if (gf === ga) o.draws++;
      else o.losses++;
      o.points = o.wins * 3 + o.draws;
    }

    if (m.sedzia) {
      let r = referees.get(m.sedzia);
      if (!r) {
        r = {
          name: m.sedzia,
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          possiblePoints: 0,
          pointsPct: 0,
        };
        referees.set(m.sedzia, r);
      }
      r.games++;
      r.goalsFor += gf;
      r.goalsAgainst += ga;
      if (gf > ga) r.wins++;
      else if (gf === ga) r.draws++;
      else r.losses++;
      r.points = r.wins * 3 + r.draws;
      r.possiblePoints = r.games * 3;
      r.pointsPct = r.possiblePoints > 0 ? (r.points / r.possiblePoints) * 100 : 0;
    }
  }

  s.streaks = {
    wins: tWins.best,
    unbeaten: tUnbeaten.best,
    scoring: tScoring.best,
    cleanSheets: tClean.best,
    winless: tWinless.best,
    noCleanSheet: tNoClean.best,
  };

  if (homeAtt.length) s.attendance.homeAvg = Math.round(homeAtt.reduce((a, b) => a + b, 0) / homeAtt.length);
  if (awayAtt.length) s.attendance.awayAvg = Math.round(awayAtt.reduce((a, b) => a + b, 0) / awayAtt.length);

  if (scorers.size) {
    const max = Math.max(...scorers.values());
    s.topScorers = [...scorers].filter(([, g]) => g === max).map(([name, goals]) => ({ name, goals }));
  }
  s.topScorerHome = topOf(homeScorers);
  s.topScorerAway = topOf(awayScorers);

  s.commonScore = { total: mostCommon(scoresTotal), home: mostCommon(scoresHome), away: mostCommon(scoresAway) };

  // Ulubiony rywal: najwięcej zwycięstw, potem najlepszy bilans bramkowy
  // Najtrudniejszy rywal: najwięcej porażek, potem najgorszy bilans bramkowy
  let best: OpponentRecord | null = null;
  let worst: OpponentRecord | null = null;
  for (const o of opponents.values()) {
    const d = o.goalsFor - o.goalsAgainst;
    if (o.wins > 0 && (!best || o.wins > best.wins || (o.wins === best.wins && d > best.goalsFor - best.goalsAgainst))) best = o;
    if (o.losses > 0 && (!worst || o.losses > worst.losses || (o.losses === worst.losses && d < worst.goalsFor - worst.goalsAgainst)))
      worst = o;
  }
  s.bestOpponent = best;
  s.worstOpponent = worst;

  // Ulubiony i znienawidzony sędzia: punkty zdobyte na możliwe
  let bestRef: RefereeRecord | null = null;
  let worstRef: RefereeRecord | null = null;
  const refList = Array.from(referees.values());
  if (refList.length > 0) {
    let cands = refList;
    for (const minG of [3, 2, 1]) {
      const f = refList.filter((r) => r.games >= minG);
      if (f.length >= 2 || minG === 1) {
        cands = f;
        break;
      }
    }
    const sortedBest = [...cands].sort(
      (a, b) =>
        b.pointsPct - a.pointsPct ||
        b.games - a.games ||
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        a.name.localeCompare(b.name)
    );
    const sortedWorst = [...cands].sort(
      (a, b) =>
        a.pointsPct - b.pointsPct ||
        b.games - a.games ||
        b.losses - a.losses ||
        a.goalsFor - a.goalsAgainst - (b.goalsFor - b.goalsAgainst) ||
        a.name.localeCompare(b.name)
    );
    bestRef = sortedBest[0] ?? null;
    worstRef = sortedWorst[0] ?? null;
  }
  s.bestReferee = bestRef;
  s.worstReferee = worstRef;

  return s;
}
