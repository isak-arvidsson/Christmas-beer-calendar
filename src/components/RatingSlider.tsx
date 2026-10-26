import React from 'react';
import { Minus, Plus, Sparkles, Snowflake, Flame, Trophy } from 'lucide-react';
import { getScoreStyle } from '../utils/colors.ts';

interface RatingSliderProps {
  value: number; // 0.0 to 10.0
  onChange: (newValue: number) => void;
  disabled?: boolean;
  tasterName?: string;
}

export const RatingSlider: React.FC<RatingSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentStyle = getScoreStyle(value);

  const handleStep = (delta: number) => {
    if (disabled) return;
    const next = Math.min(10.0, Math.max(0.0, Math.round((value + delta) * 10) / 10));
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw)) {
      onChange(Math.round(raw * 10) / 10);
    }
  };

  // Percent along the track
  const percent = (value / 10) * 100;

  return (
    <div
      className="relative rounded-2xl border p-5 md:p-6 transition-all duration-300"
      style={{
        backgroundColor: '#121d19',
        borderColor: currentStyle.borderColor,
        boxShadow: currentStyle.glow,
      }}
    >
      {/* Header with Sensory Label & Live Numeric Score */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: currentStyle.color }}>
            {currentStyle.label}
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs text-slate-400 italic">
            {currentStyle.adjective}
          </span>
        </div>

        {/* Large Score Display with 1-decimal accuracy */}
        <div className="flex items-baseline gap-1">
          <div
            className="text-4xl md:text-5xl font-extrabold tabular-nums tracking-tight transition-colors duration-200"
            style={{ color: currentStyle.color }}
          >
            {value.toFixed(1)}
          </div>
          <span className="text-sm font-semibold text-slate-500">/ 10.0</span>
        </div>
      </div>

      {/* Dynamic Visual Slider Bar */}
      <div className="relative py-4">
        {/* Custom Track Background */}
        <div className="relative h-4 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          {/* Chromatic color gradient fill */}
          <div
            className="h-full transition-all duration-75 rounded-full"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(to right, #38bdf8 0%, #10b981 35%, #f59e0b 65%, #dc2626 90%, #b91c1c 100%)`,
              boxShadow: `0 0 16px ${currentStyle.color}`,
            }}
          />
        </div>

        {/* Native Range Input with Custom Styled Thumb */}
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Betyg 0.0 till 10.0"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ zIndex: 10 }}
        />

        {/* Visible Thumb Pin Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75 flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 bg-white shadow-xl"
          style={{
            left: `${percent}%`,
            boxShadow: `0 0 14px ${currentStyle.color}, 0 4px 6px rgba(0,0,0,0.5)`,
          }}
        >
          {value >= 9.8 ? (
            <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
          ) : value >= 7.0 ? (
            <Flame className="w-4 h-4 text-red-600" />
          ) : value >= 4.0 ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <Snowflake className="w-3.5 h-3.5 text-sky-500" />
          )}
        </div>
      </div>

      {/* Granular Step Controls (±0.1) */}
      <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => handleStep(-0.1)}
          disabled={disabled || value <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors border border-slate-800"
          title="Minska med 0.1"
        >
          <Minus className="w-3 h-3" />
          0.1
        </button>
        <button
          type="button"
          onClick={() => handleStep(0.1)}
          disabled={disabled || value >= 10}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors border border-slate-800"
          title="Öka med 0.1"
        >
          <Plus className="w-3 h-3" />
          0.1
        </button>
      </div>
    </div>
  );
};
