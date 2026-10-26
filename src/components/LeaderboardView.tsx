import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  ArrowUpDown,
  Sparkles,
  Award,
  ChevronRight,
  Beer,
} from 'lucide-react';
import { BeerDay, CalendarRatings, TesterId } from '../types.ts';
import { TESTERS } from '../data/initialBeers.ts';
import { computeDayRatingStats, getScoreStyle } from '../utils/colors.ts';
import { BeerBottleIllustration } from './BeerBottleIllustration.tsx';

interface LeaderboardViewProps {
  beers: BeerDay[];
  ratings: CalendarRatings;
  onSelectDay: (day: number) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  beers,
  ratings,
  onSelectDay,
}) => {
  const [sortOption, setSortOption] = useState<
    'average' | 'count' | 'highest-single' | 'isak' | 'ingrid' | 'gustav' | 'louise'
  >('average');

  // Compute stats for all beers
  const beerStatsList = useMemo(() => {
    return beers.map((beer) => {
      const dayRating = ratings[beer.day] || {};
      const stats = computeDayRatingStats(dayRating);
      return {
        beer,
        dayRating,
        stats,
      };
    });
  }, [beers, ratings]);

  // Sort according to active selection
  const sortedBeers = useMemo(() => {
    const list = [...beerStatsList];

    list.sort((a, b) => {
      if (sortOption === 'average') {
        const avgA = a.stats.average ?? -1;
        const avgB = b.stats.average ?? -1;
        if (avgB !== avgA) return avgB - avgA;
        return b.stats.count - a.stats.count;
      }
      if (sortOption === 'count') {
        if (b.stats.count !== a.stats.count) return b.stats.count - a.stats.count;
        return (b.stats.average ?? -1) - (a.stats.average ?? -1);
      }
      if (sortOption === 'highest-single') {
        const highA = a.stats.highScore ?? -1;
        const highB = b.stats.highScore ?? -1;
        return highB - highA;
      }
      // Individual tester sorts
      const tA = a.dayRating[sortOption]?.score ?? -1;
      const tB = b.dayRating[sortOption]?.score ?? -1;
      return tB - tA;
    });

    return list;
  }, [beerStatsList, sortOption]);

  // Top 3 Podium (from beers with at least 1 rating)
  const ratedBeers = sortedBeers.filter((item) => item.stats.average !== null);
  const top1 = ratedBeers[0];
  const top2 = ratedBeers[1];
  const top3 = ratedBeers[2];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5" />
          Julens Stora Topplista
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-cinzel tracking-tight">
          Hantverksölen Som Regerar Julbordet
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Realtidssummering av Isaks, Ingrids, Gustavs och Louises provsmakningar.
        </p>
      </div>

      {/* Top 3 Festive Podium */}
      {ratedBeers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12 items-end max-w-4xl mx-auto">
          {/* Silver - 2nd Place */}
          {top2 ? (
            <div
              onClick={() => onSelectDay(top2.beer.day)}
              role="button"
              tabIndex={0}
              className="order-2 md:order-1 rounded-2xl bg-[#14201c] p-5 border border-slate-700/60 hover:border-slate-400 transition-all cursor-pointer text-center relative shadow-xl"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-bold text-xs shadow-md">
                2
              </div>
              <div className="flex justify-center pt-2">
                <BeerBottleIllustration beer={top2.beer} size="sm" />
              </div>
              <div className="mt-3">
                <span className="text-[11px] text-amber-400 uppercase font-semibold">
                  Dag {top2.beer.day} · {top2.beer.brewery}
                </span>
                <h3 className="text-base font-bold text-white line-clamp-1">{top2.beer.name}</h3>
                <div className="text-2xl font-extrabold text-slate-200 font-mono mt-1">
                  {top2.stats.formattedAverage} <span className="text-xs text-slate-500">/10</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="order-2 md:order-1 p-6 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl text-xs">
              2:a plats ledig
            </div>
          )}

          {/* Gold - 1st Place Champion */}
          {top1 && (
            <div
              onClick={() => onSelectDay(top1.beer.day)}
              role="button"
              tabIndex={0}
              className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-950/40 via-[#14201c] to-[#14201c] p-6 border-2 border-amber-500/60 hover:border-amber-400 transition-all cursor-pointer text-center relative shadow-2xl scale-105 z-10"
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>1:a Plats</span>
              </div>
              <div className="flex justify-center pt-3">
                <BeerBottleIllustration beer={top1.beer} size="md" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-amber-300 uppercase font-bold tracking-wider">
                  Dag {top1.beer.day} · {top1.beer.brewery}
                </span>
                <h2 className="text-lg font-bold text-white line-clamp-1">{top1.beer.name}</h2>
                <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
                  {top1.stats.formattedAverage} <span className="text-xs text-slate-500">/10</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                  {top1.stats.count}/4 provsmakare har satt betyg
                </div>
              </div>
            </div>
          )}

          {/* Bronze - 3rd Place */}
          {top3 ? (
            <div
              onClick={() => onSelectDay(top3.beer.day)}
              role="button"
              tabIndex={0}
              className="order-3 rounded-2xl bg-[#14201c] p-5 border border-amber-900/40 hover:border-amber-700 transition-all cursor-pointer text-center relative shadow-xl"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-white font-bold text-xs shadow-md">
                3
              </div>
              <div className="flex justify-center pt-2">
                <BeerBottleIllustration beer={top3.beer} size="sm" />
              </div>
              <div className="mt-3">
                <span className="text-[11px] text-amber-400 uppercase font-semibold">
                  Dag {top3.beer.day} · {top3.beer.brewery}
                </span>
                <h3 className="text-base font-bold text-white line-clamp-1">{top3.beer.name}</h3>
                <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
                  {top3.stats.formattedAverage} <span className="text-xs text-slate-500">/10</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="order-3 p-6 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl text-xs">
              3:e plats ledig
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-md mx-auto mb-10 p-6 rounded-2xl bg-[#14201c] border border-slate-800 text-center text-slate-400 text-sm">
          Inga öl har betygsatts än! Klicka på Kalender och öppna Dag 1 för att börja provsmaka.
        </div>
      )}

      {/* Sorting Tabs Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sortera efter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSortOption('average')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              sortOption === 'average'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Snittbetyg
          </button>
          <button
            type="button"
            onClick={() => setSortOption('highest-single')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              sortOption === 'highest-single'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Högsta singelbetyg
          </button>
          {TESTERS.map((tester) => (
            <button
              key={tester.id}
              type="button"
              onClick={() => setSortOption(tester.id as any)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                sortOption === tester.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: tester.avatarColor }}
              />
              {tester.name}s topp
            </button>
          ))}
        </div>
      </div>

      {/* Complete Rankings Table */}
      <div className="overflow-hidden rounded-2xl bg-[#14201c] border border-amber-950/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-2 font-medium">
                  Placering
                </th>
                <th scope="col" className="py-3.5 px-3 font-medium">
                  Öl & Bryggeri
                </th>
                <th scope="col" className="py-3.5 px-3 font-medium text-center">
                  Snitt
                </th>
                <th scope="col" className="py-3.5 px-2 font-medium text-center">
                  Isak
                </th>
                <th scope="col" className="py-3.5 px-2 font-medium text-center">
                  Ingrid
                </th>
                <th scope="col" className="py-3.5 px-2 font-medium text-center">
                  Gustav
                </th>
                <th scope="col" className="py-3.5 px-2 font-medium text-center">
                  Louise
                </th>
                <th scope="col" className="py-3.5 pr-4 pl-2 font-medium text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sortedBeers.map((item, index) => {
                const { beer, dayRating, stats } = item;
                const scoreStyle = stats.average !== null ? getScoreStyle(stats.average) : null;
                const isTop3 = index < 3 && stats.average !== null;

                return (
                  <tr
                    key={beer.day}
                    onClick={() => onSelectDay(beer.day)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Rank Number */}
                    <td className="py-4 pl-4 pr-2 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5">
                        {isTop3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40">
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium pl-1.5">#{index + 1}</span>
                        )}
                      </div>
                    </td>

                    {/* Beer & Brewery */}
                    <td className="py-4 px-3">
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>{beer.name}</span>
                          <span className="text-[10px] text-amber-500/80 font-normal border border-amber-500/30 px-1 rounded">
                            Dag {beer.day}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {beer.brewery} · {beer.style} ({beer.abv}%)
                        </div>
                      </div>
                    </td>

                    {/* Average Score */}
                    <td className="py-4 px-3 text-center">
                      {stats.average !== null ? (
                        <div
                          className="inline-block px-2.5 py-1 rounded-lg text-sm font-extrabold font-mono tabular-nums shadow-sm"
                          style={{
                            backgroundColor: scoreStyle?.bgSubtle,
                            color: scoreStyle?.color,
                            border: `1px solid ${scoreStyle?.borderColor}`,
                          }}
                        >
                          {stats.formattedAverage}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">–</span>
                      )}
                    </td>

                    {/* Individual scores for Isak, Ingrid, Gustav, Louise */}
                    {(['isak', 'ingrid', 'gustav', 'louise'] as TesterId[]).map((testerId) => {
                      const score = dayRating[testerId]?.score;
                      const hasScore = typeof score === 'number';
                      const testerStyle = hasScore ? getScoreStyle(score) : null;
                      return (
                        <td key={testerId} className="py-4 px-2 text-center font-mono tabular-nums">
                          {hasScore ? (
                            <span
                              className="text-xs font-bold"
                              style={{ color: testerStyle?.color }}
                            >
                              {score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">–</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Completion count & chevron */}
                    <td className="py-4 pr-4 pl-2 text-right">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono tabular-nums">{stats.count}/4</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
