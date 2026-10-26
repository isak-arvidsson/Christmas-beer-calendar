import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Flame,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BeerDay, CalendarRatings, TesterId } from '../types.ts';
import { TESTERS } from '../data/initialBeers.ts';
import { BeerBottleIllustration } from './BeerBottleIllustration.tsx';
import { computeDayRatingStats, getScoreStyle } from '../utils/colors.ts';

interface CalendarOverviewProps {
  beers: BeerDay[];
  ratings: CalendarRatings;
  activeTesterId: TesterId;
  onSelectDay: (day: number) => void;
  onOpenSync: () => void;
}

export const CalendarOverview: React.FC<CalendarOverviewProps> = ({
  beers,
  ratings,
  activeTesterId,
  onSelectDay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending-me' | 'complete' | 'top'>('all');

  const activeTester = TESTERS.find((t) => t.id === activeTesterId) || TESTERS[0];

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalRatingsLogged = 0;
    let completedDaysCount = 0;

    beers.forEach((b) => {
      const dayRating = ratings[b.day] || {};
      const stats = computeDayRatingStats(dayRating);
      totalRatingsLogged += stats.count;
      if (stats.isComplete) completedDaysCount++;
    });

    return {
      totalRatingsLogged,
      completedDaysCount,
      totalPossibleRatings: beers.length * 4,
    };
  }, [beers, ratings]);

  // Filtered beers
  const filteredBeers = useMemo(() => {
    return beers.filter((beer) => {
      // Search matching
      const matchesSearch =
        beer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beer.brewery.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beer.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `dag ${beer.day}`.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const dayRating = ratings[beer.day] || {};
      const stats = computeDayRatingStats(dayRating);
      const myRating = dayRating[activeTesterId];

      if (filterMode === 'pending-me') {
        return !myRating;
      }
      if (filterMode === 'complete') {
        return stats.isComplete;
      }
      if (filterMode === 'top') {
        return stats.average !== null && stats.average >= 7.0;
      }

      return true;
    });
  }, [beers, ratings, searchQuery, filterMode, activeTesterId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14201c] via-[#1b2b26] to-[#14201c] p-6 sm:p-8 border border-amber-950/40 shadow-2xl mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Julölskalendern 2026 · 24 Dagar av Hantverksöl
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white font-cinzel tracking-tight text-balance">
            Välkommen till Julölsprovningen
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Varje dag fram till julafton öppnar vi en ny svensk julöl och sätter betyg från 0.0 till 10.0.
            Klicka på en dag för att registrera dagens betyg eller följa ställningen på topplistan.
          </p>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-medium">Fullständiga dagar</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                {overallStats.completedDaysCount} / 24 <span className="text-xs text-amber-400 font-normal">klara</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-medium">Betyg registrerade</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                {overallStats.totalRatingsLogged} / {overallStats.totalPossibleRatings}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-medium">Aktiv provsmakare</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: activeTester.avatarColor }}
                />
                {activeTester.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alla (24)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending-me')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'pending-me'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Väntar på mig ({activeTester.name})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('complete')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'complete'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alla 4 provat
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('top')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'top'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toppbetyg (≥ 7.0)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Sök öl eller bryggeri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* 24 Advent Calendar Cards Grid */}
      {filteredBeers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#14201c] p-12 text-center text-slate-400">
          <p className="text-sm">Inga öl matchade din sökning eller filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="mt-3 text-xs font-medium text-amber-400 underline hover:text-amber-300"
          >
            Återställ filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBeers.map((beer) => {
            const dayRating = ratings[beer.day] || {};
            const stats = computeDayRatingStats(dayRating);
            const myRating = dayRating[activeTesterId];
            const scoreStyle = stats.average !== null ? getScoreStyle(stats.average) : null;

            return (
              <div
                key={beer.day}
                onClick={() => onSelectDay(beer.day)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectDay(beer.day)}
                className="group relative flex flex-col justify-between rounded-2xl bg-[#14201c] p-5 border border-amber-950/30 hover:border-amber-500/50 hover:bg-[#182622] transition-all duration-200 shadow-lg cursor-pointer text-left"
              >
                {/* Top Door Header: Day Number & Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-cinzel text-lg font-bold group-hover:bg-amber-500/20">
                        {beer.day}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                        Dec {beer.day}
                      </span>
                    </div>

                    {/* Average Score Badge */}
                    {stats.average !== null ? (
                      <div
                        className="flex items-baseline gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono tabular-nums shadow-sm"
                        style={{
                          backgroundColor: scoreStyle?.bgSubtle,
                          color: scoreStyle?.color,
                          border: `1px solid ${scoreStyle?.borderColor}`,
                        }}
                      >
                        <span>{stats.formattedAverage}</span>
                        <span className="text-[10px] opacity-75 font-normal">/10</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Ej provad</span>
                    )}
                  </div>

                  {/* Bottle Illustration Preview */}
                  <div className="py-2 flex justify-center">
                    <BeerBottleIllustration
                      beer={beer}
                      averageScore={stats.average}
                      size="sm"
                    />
                  </div>

                  {/* Beer Info */}
                  <div className="mt-3">
                    <div className="text-xs text-amber-400/90 font-medium tracking-wide uppercase line-clamp-1">
                      {beer.brewery}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                      {beer.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <span className="truncate">{beer.style}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-semibold text-amber-300 shrink-0">
                        {beer.abv}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: 4-Tester Completion Status */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {TESTERS.map((tester) => {
                        const hasRated = dayRating[tester.id]?.score !== undefined;
                        return (
                          <span
                            key={tester.id}
                            title={`${tester.name}: ${
                              hasRated ? `${dayRating[tester.id]?.score?.toFixed(1)}/10` : 'Ej betygsatt'
                            }`}
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-transform ${
                              hasRated
                                ? 'text-slate-950 scale-105 ring-1 ring-white/40'
                                : 'opacity-30 bg-slate-800 text-slate-400'
                            }`}
                            style={{ backgroundColor: hasRated ? tester.avatarColor : undefined }}
                          >
                            {tester.shortName}
                          </span>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      {stats.isComplete ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Alla 4
                        </span>
                      ) : (
                        <span>{stats.count}/4 provat</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
