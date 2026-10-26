import { DayRatings, TesterId } from '../types.ts';

export interface ScoreStyle {
  color: string;
  bgSubtle: string;
  borderColor: string;
  textClass: string;
  glow: string;
  label: string;
  adjective: string;
  iconName: 'snowflake' | 'sparkle' | 'flame' | 'trophy' | 'beer';
}

/**
 * Returns dynamic color representation transitioning from
 * cool frosty blues (0.0 - 3.5) to warm spiced amber/golds (4.0 - 6.9)
 * to rich Scandinavian Christmas reds/crimsons (7.0 - 10.0).
 */
export function getScoreStyle(score: number): ScoreStyle {
  const rounded = Math.round(score * 10) / 10;

  if (rounded < 2.0) {
    return {
      color: '#38bdf8', // Ice blue
      bgSubtle: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      textClass: 'text-sky-400',
      glow: '0 0 16px rgba(56, 189, 248, 0.45)',
      label: 'Djupfryst / Iskall',
      adjective: 'Knappt drickbar',
      iconName: 'snowflake',
    };
  } else if (rounded < 4.0) {
    return {
      color: '#0ea5e9', // Deep sky blue
      bgSubtle: 'rgba(14, 165, 233, 0.12)',
      borderColor: 'rgba(14, 165, 233, 0.35)',
      textClass: 'text-sky-300',
      glow: '0 0 16px rgba(14, 165, 233, 0.45)',
      label: 'Kall & Dämpad',
      adjective: 'Lite blek julstämning',
      iconName: 'snowflake',
    };
  } else if (rounded < 5.5) {
    return {
      color: '#10b981', // Evergreen spruce
      bgSubtle: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      textClass: 'text-emerald-400',
      glow: '0 0 16px rgba(16, 185, 129, 0.45)',
      label: 'Granbarr & Hederlig',
      adjective: 'Godkänd vardagsjulöl',
      iconName: 'beer',
    };
  } else if (rounded < 7.0) {
    return {
      color: '#f59e0b', // Festive gold / amber
      bgSubtle: 'rgba(245, 158, 11, 0.14)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      textClass: 'text-amber-400',
      glow: '0 0 18px rgba(245, 158, 11, 0.5)',
      label: 'Varm Kryddamber',
      adjective: 'Riktigt god & mysig',
      iconName: 'sparkle',
    };
  } else if (rounded < 8.5) {
    return {
      color: '#f97316', // Spiced orange-red
      bgSubtle: 'rgba(249, 115, 22, 0.16)',
      borderColor: 'rgba(249, 115, 22, 0.45)',
      textClass: 'text-orange-400',
      glow: '0 0 20px rgba(249, 115, 22, 0.55)',
      label: 'Lingon & Pepparkaka',
      adjective: 'Underbar julbordskandidat',
      iconName: 'flame',
    };
  } else if (rounded < 9.5) {
    return {
      color: '#dc2626', // Festive Nordic Crimson
      bgSubtle: 'rgba(220, 38, 38, 0.18)',
      borderColor: 'rgba(220, 38, 38, 0.55)',
      textClass: 'text-red-400',
      glow: '0 0 24px rgba(220, 38, 38, 0.65)',
      label: 'Strålande Julafton',
      adjective: 'Högsta hantverksklass!',
      iconName: 'flame',
    };
  } else {
    return {
      color: '#b91c1c', // Deep Royal Red & Gold Halo
      bgSubtle: 'rgba(185, 28, 28, 0.22)',
      borderColor: 'rgba(234, 179, 8, 0.65)',
      textClass: 'text-red-300 font-bold',
      glow: '0 0 32px rgba(220, 38, 38, 0.8), 0 0 12px rgba(245, 158, 11, 0.8)',
      label: 'Julens Mästare 10.0!',
      adjective: 'Oslagbar julmagi i glaset!',
      iconName: 'trophy',
    };
  }
}

/**
 * Returns dynamic CSS background gradient for the active slider track
 */
export function getSliderTrackBackground(score: number): string {
  const percent = Math.min(100, Math.max(0, (score / 10) * 100));
  const style = getScoreStyle(score);
  return `linear-gradient(to right, #38bdf8 0%, #10b981 35%, #f59e0b 65%, #dc2626 90%, #b91c1c 100%)`;
}

/**
 * Computes average, completion count, and standard deviation
 */
export function computeDayRatingStats(ratings: DayRatings) {
  const testers: TesterId[] = ['isak', 'ingrid', 'gustav', 'louise'];
  const activeEntries = testers
    .map((id) => ratings[id])
    .filter((r): r is NonNullable<typeof r> => r !== undefined && typeof r.score === 'number');

  const count = activeEntries.length;
  const isComplete = count === 4;

  if (count === 0) {
    return {
      average: null,
      formattedAverage: '–',
      count: 0,
      isComplete: false,
      stdDev: null,
      highScore: null,
      lowScore: null,
    };
  }

  const sum = activeEntries.reduce((acc, curr) => acc + curr.score, 0);
  const average = Math.round((sum / count) * 10) / 10;
  const scores = activeEntries.map((e) => e.score);
  const highScore = Math.max(...scores);
  const lowScore = Math.min(...scores);

  // Standard deviation
  const variance =
    activeEntries.reduce((acc, curr) => acc + Math.pow(curr.score - average, 2), 0) / count;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  return {
    average,
    formattedAverage: average.toFixed(1),
    count,
    isComplete,
    stdDev,
    highScore,
    lowScore,
  };
}
