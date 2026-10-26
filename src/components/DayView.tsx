import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Share2,
  CalendarDays,
  Thermometer,
  MapPin,
} from 'lucide-react';
import { BeerDay, DayRatings, TesterId, UserRating } from '../types.ts';
import { TESTERS, FLAVOR_TAGS } from '../data/initialBeers.ts';
import { BeerBottleIllustration } from './BeerBottleIllustration.tsx';
import { RatingSlider } from './RatingSlider.tsx';
import { computeDayRatingStats, getScoreStyle } from '../utils/colors.ts';

interface DayViewProps {
  day: number;
  beer: BeerDay;
  totalDays: number;
  ratings: DayRatings;
  activeTesterId: TesterId;
  onUpdateRating: (day: number, testerId: TesterId, rating: UserRating) => void;
  onNavigateDay: (day: number) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  day,
  beer,
  totalDays,
  ratings,
  activeTesterId,
  onUpdateRating,
  onNavigateDay,
}) => {
  const activeTester = TESTERS.find((t) => t.id === activeTesterId) || TESTERS[0];
  const userCurrentRating = ratings[activeTesterId];

  // Local state for immediate slider responsiveness
  const [sliderScore, setSliderScore] = useState<number>(userCurrentRating?.score ?? 7.0);
  const [tastingNotes, setTastingNotes] = useState<string>(userCurrentRating?.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(userCurrentRating?.flavorTags ?? []);
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [hasSavedFeedback, setHasSavedFeedback] = useState<boolean>(false);

  // Sync local state if active tester changes or beer day changes
  React.useEffect(() => {
    const existing = ratings[activeTesterId];
    setSliderScore(existing?.score ?? 7.0);
    setTastingNotes(existing?.notes ?? '');
    setSelectedTags(existing?.flavorTags ?? []);
  }, [day, activeTesterId, ratings]);

  const stats = computeDayRatingStats(ratings);
  const averageStyle = stats.average !== null ? getScoreStyle(stats.average) : null;

  // Handle immediate slider change
  const handleScoreChange = (newScore: number) => {
    setSliderScore(newScore);
    onUpdateRating(day, activeTesterId, {
      score: newScore,
      notes: tastingNotes,
      flavorTags: selectedTags,
      ratedAt: new Date().toISOString(),
    });
    setHasSavedFeedback(true);
    setTimeout(() => setHasSavedFeedback(false), 1500);
  };

  const handleToggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(nextTags);
    onUpdateRating(day, activeTesterId, {
      score: sliderScore,
      notes: tastingNotes,
      flavorTags: nextTags,
      ratedAt: new Date().toISOString(),
    });
  };

  const handleNotesBlur = () => {
    onUpdateRating(day, activeTesterId, {
      score: sliderScore,
      notes: tastingNotes,
      flavorTags: selectedTags,
      ratedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Top Breadcrumb & Day Stepper Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => onNavigateDay(day > 1 ? day - 1 : totalDays)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#14201c] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-amber-950/40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Föregående dag</span>
          <span className="sm:hidden">Dag {day > 1 ? day - 1 : totalDays}</span>
        </button>

        {/* Day Indicator & Quick Jump Carousel */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-center">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
              December
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white font-cinzel">
              {day}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 24</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateDay(day < totalDays ? day + 1 : 1)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#14201c] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-amber-950/40"
        >
          <span className="hidden sm:inline">Nästa dag</span>
          <span className="sm:hidden">Dag {day < totalDays ? day + 1 : 1}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Beer Showcase Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl bg-[#14201c] p-6 border border-amber-950/40 shadow-xl overflow-hidden">
            {/* Background Christmas Ribbon Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none" />

            {/* Beer Bottle Centerpiece */}
            <div className="flex justify-center py-4">
              <BeerBottleIllustration
                beer={beer}
                averageScore={stats.average}
                size="lg"
              />
            </div>

            {/* Beer Metadata */}
            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <div className="text-xs font-semibold text-amber-400/90 tracking-wide uppercase">
                {beer.brewery}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
                {beer.name}
              </h1>

              {/* Style & ABV Clean Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="text-slate-200 font-medium">{beer.style}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-amber-300 font-semibold">{beer.abv}% ABV</span>
                {beer.origin && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {beer.origin}
                    </span>
                  </>
                )}
                {beer.servingTemp && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-slate-500" />
                      {beer.servingTemp}
                    </span>
                  </>
                )}
              </div>

              {/* Description Prose */}
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {beer.description}
              </p>

              {/* Systembolaget Link Button */}
              {beer.systembolagetUrl && (
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <a
                    href={beer.systembolagetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>Läs mer på Systembolaget</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Group Tasting Summary Widget */}
          <div className="rounded-2xl bg-[#14201c] p-4 border border-amber-950/40">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Gruppens status
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {stats.isComplete ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Alla 4 har betygsatt!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    {stats.count} av 4 har betygsatt
                  </span>
                )}
              </div>
            </div>

            {/* Tester Avatar Checklist */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {TESTERS.map((tester) => {
                const r = ratings[tester.id];
                const hasRated = r !== undefined && typeof r.score === 'number';
                return (
                  <div
                    key={tester.id}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      hasRated
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-slate-950 mb-1"
                      style={{ backgroundColor: tester.avatarColor }}
                    >
                      {tester.shortName}
                    </span>
                    <span className="text-xs font-medium truncate w-full">{tester.name}</span>
                    <span className="text-[11px] font-mono tabular-nums mt-0.5 font-bold">
                      {hasRated ? r.score.toFixed(1) : '–'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Rating, Flavor Tags, Notes & Leaderboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Tester Rating Box */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Ditt betyg</span>
                {hasSavedFeedback && (
                  <span className="text-xs font-normal text-emerald-400 animate-pulse">
                    Sparat!
                  </span>
                )}
              </h2>

              {/* Blind Mode Toggle */}
              <button
                type="button"
                onClick={() => setBlindMode(!blindMode)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                title="Dölj andras betyg tills du smakat klart för att undvika partiskhet"
              >
                {blindMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{blindMode ? 'Blindprovning aktiv' : 'Blindprovning'}</span>
              </button>
            </div>

            {/* Chromatic Rating Slider */}
            <RatingSlider
              value={sliderScore}
              onChange={handleScoreChange}
              tasterName={activeTester.name}
            />

            {/* Optional Flavor Tags (As requested in user questionnaire) */}
            <div className="rounded-2xl bg-[#14201c] p-5 border border-amber-950/40">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Smaknoteringar & Karaktär (Valfritt)</span>
                <span className="text-[11px] text-slate-500 lowercase">
                  {selectedTags.length} valda
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {FLAVOR_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Personal Tasting Notes Text Input */}
              <div className="mt-4">
                <textarea
                  rows={2}
                  placeholder={`Skriv ${activeTester.name}s tankar om doft, skum, sötma eller julbordsmatchning...`}
                  value={tastingNotes}
                  onChange={(e) => setTastingNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Group Results for Day */}
          <div className="rounded-2xl bg-[#14201c] p-5 border border-amber-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Resultat för Dag {day}</span>
              </h3>
              {stats.average !== null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-400 uppercase font-medium">Snitt:</span>
                  <span
                    className="text-2xl font-extrabold font-mono tabular-nums"
                    style={{ color: averageStyle?.color }}
                  >
                    {stats.formattedAverage}
                  </span>
                  <span className="text-xs text-slate-500">/ 10.0</span>
                </div>
              )}
            </div>

            {blindMode && !userCurrentRating ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800">
                <EyeOff className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <div className="text-sm font-semibold text-slate-200">
                  Blindprovningsläge påslaget
                </div>
                <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Sätt ditt eget betyg ovan för att avslöja vad Isak, Ingrid, Gustav och Louise tyckte!
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {TESTERS.map((tester) => {
                  const rating = ratings[tester.id];
                  const hasRated = rating !== undefined && typeof rating.score === 'number';
                  const testerScoreStyle = hasRated ? getScoreStyle(rating.score) : null;

                  return (
                    <div
                      key={tester.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-slate-950"
                          style={{ backgroundColor: tester.avatarColor }}
                        >
                          {tester.shortName}
                        </span>
                        <div>
                          <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                            <span>{tester.name}</span>
                            {tester.id === activeTesterId && (
                              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-normal">
                                (du)
                              </span>
                            )}
                          </div>
                          {rating?.notes && (
                            <div className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">
                              "{rating.notes}"
                            </div>
                          )}
                          {rating?.flavorTags && rating.flavorTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rating.flavorTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {rating.flavorTags.length > 3 && (
                                <span className="text-[10px] text-slate-500">
                                  +{rating.flavorTags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {hasRated ? (
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-xl font-bold font-mono tabular-nums"
                              style={{ color: testerScoreStyle?.color }}
                            >
                              {rating.score.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">/10</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Ej provat än</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
