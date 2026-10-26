import React from 'react';
import { BeerDay } from '../types.ts';
import { getScoreStyle } from '../utils/colors.ts';

interface BeerBottleIllustrationProps {
  beer: BeerDay;
  averageScore?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BeerBottleIllustration: React.FC<BeerBottleIllustrationProps> = ({
  beer,
  averageScore,
  size = 'md',
  className = '',
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const scoreStyle = typeof averageScore === 'number' ? getScoreStyle(averageScore) : null;

  // Height configurations
  const heightMap = {
    sm: 'h-28 w-20',
    md: 'h-48 w-32',
    lg: 'h-72 w-48',
    xl: 'h-96 w-64',
  };

  // Determine bottle theme color based on beer style / day
  const isDarkStout = beer.style.toLowerCase().includes('stout') || beer.style.toLowerCase().includes('dunkel');
  const isBelgian = beer.style.toLowerCase().includes('belgisk') || beer.style.toLowerCase().includes('kloster');
  const glassFill = isDarkStout ? '#1c1917' : isBelgian ? '#451a03' : '#78350f';
  const labelColor = beer.day % 2 === 0 ? '#991b1b' : '#14532d'; // Alternate Christmas ruby & pine
  const labelAccent = '#f59e0b'; // Gold trim

  if (beer.imageUrl && !imageFailed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/40 p-2 ${heightMap[size]} ${className}`}>
        <img
          src={beer.imageUrl}
          alt={`${beer.brewery} ${beer.name}`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain drop-shadow-lg transition-transform hover:scale-105"
        />
        {scoreStyle && (
          <div
            className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold shadow-md"
            style={{ backgroundColor: scoreStyle.color, color: '#fff' }}
          >
            {averageScore?.toFixed(1)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${heightMap[size]} ${className}`}>
      {/* Ambient glow behind bottle */}
      <div
        className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-30 transition-all duration-300"
        style={{
          backgroundColor: scoreStyle ? scoreStyle.color : '#f59e0b',
        }}
      />

      <svg
        viewBox="0 0 160 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto drop-shadow-xl transition-transform hover:scale-105 duration-200"
      >
        {/* Bottle Shadow */}
        <ellipse cx="80" cy="305" rx="45" ry="10" fill="rgba(0,0,0,0.5)" />

        {/* Glass Bottle Body */}
        <defs>
          <linearGradient id={`glassGrad-${beer.day}`} x1="30" y1="50" x2="130" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor={glassFill} />
            <stop offset="0.5" stopColor="#292524" />
            <stop offset="0.85" stopColor={glassFill} />
            <stop offset="1" stopColor="#0c0a09" />
          </linearGradient>

          <linearGradient id={`goldFoil-${beer.day}`} x1="60" y1="10" x2="100" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#eab308" />
            <stop offset="0.8" stopColor="#ca8a04" />
            <stop offset="1" stopColor="#854d0e" />
          </linearGradient>

          <linearGradient id={`labelGrad-${beer.day}`} x1="45" y1="130" x2="115" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor={labelColor} />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="glassReflection" x1="40" y1="60" x2="60" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Bottle Silhouette */}
        <path
          d="M70 20 H90 V60 C90 85 120 105 122 135 V285 C122 296 114 300 102 300 H58 C46 300 38 296 38 285 V135 C40 105 70 85 70 60 V20 Z"
          fill={`url(#glassGrad-${beer.day})`}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />

        {/* Cap & Neck Foil */}
        <rect x="68" y="14" width="24" height="9" rx="2" fill={`url(#goldFoil-${beer.day})`} />
        <path d="M70 23 H90 V62 C85 64 75 64 70 62 V23 Z" fill={`url(#goldFoil-${beer.day})`} />
        {/* Ribbon band */}
        <rect x="70" y="55" width="20" height="4" fill="#991b1b" />

        {/* Main Bottle Label */}
        <rect
          x="44"
          y="130"
          width="72"
          height="125"
          rx="5"
          fill={`url(#labelGrad-${beer.day})`}
          stroke={labelAccent}
          strokeWidth="1.5"
        />

        {/* Inner Label Border Frame */}
        <rect
          x="48"
          y="134"
          width="64"
          height="117"
          rx="3"
          fill="none"
          stroke="rgba(245, 158, 11, 0.4)"
          strokeWidth="0.8"
          strokeDasharray="2 1"
        />

        {/* Advent Star / Snowflake */}
        <g transform="translate(80, 150)">
          <circle cx="0" cy="0" r="11" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="0.8" />
          <path d="M0 -8 L0 8 M-8 0 L8 0 M-5 -5 L5 5 M-5 5 L5 -5" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Advent Day Number on Label */}
        <text
          x="80"
          y="180"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="18"
          fontWeight="800"
          fontFamily="Cinzel, serif"
        >
          {beer.day}
        </text>

        <text
          x="80"
          y="194"
          textAnchor="middle"
          fill="#fef3c7"
          fontSize="7.5"
          fontWeight="700"
          letterSpacing="1"
        >
          DECEMBER
        </text>

        {/* Divider line */}
        <line x1="56" y1="202" x2="104" y2="202" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="0.75" />

        {/* Brewery Initial / Julöl stamp */}
        <text
          x="80"
          y="218"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="0.5"
        >
          JULÖL
        </text>

        <text
          x="80"
          y="234"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="6.5"
          fontWeight="600"
        >
          {beer.abv}% VOL
        </text>

        {/* Glass highlight / reflection stripe */}
        <path
          d="M44 135 C45 110 68 95 68 65 H72 C72 95 49 110 48 135 V285 C48 290 46 295 44 295 V135 Z"
          fill="url(#glassReflection)"
        />
      </svg>
    </div>
  );
};
