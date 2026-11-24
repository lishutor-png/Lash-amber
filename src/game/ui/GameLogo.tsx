import React, { useState } from 'react';
import logoEmblemImg from '../../assets/images/ember_game_logo_1795524125269.jpg';

interface GameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  showTagline?: boolean;
  className?: string;
}

export const GameLogo: React.FC<GameLogoProps> = ({
  size = 'md',
  layout = 'horizontal',
  showTagline = true,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const emblemBox =
    size === 'lg'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : size === 'sm'
      ? 'w-12 h-12'
      : 'w-16 h-16 sm:w-20 sm:h-20';

  const titleClass =
    size === 'lg'
      ? 'text-3xl sm:text-5xl'
      : size === 'sm'
      ? 'text-lg sm:text-xl'
      : 'text-3xl sm:text-4xl';

  return (
    <div
      className={`flex ${
        layout === 'vertical'
          ? 'flex-col items-center text-center gap-3'
          : 'items-center gap-3.5 sm:gap-4 text-left'
      } ${className}`}
    >
      {/* Emblem Crest */}
      <div
        className={`${emblemBox} shrink-0 rounded-xl overflow-hidden border-2 border-[#C89B3C]/80 bg-[#0D0F10] animate-ember-glow relative flex items-center justify-center`}
      >
        {!imgFailed ? (
          <img
            src={logoEmblemImg}
            alt="Lambang The Last Ember"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover scale-105"
          />
        ) : (
          <svg
            viewBox="0 0 64 64"
            className="w-4/5 h-4/5"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M32 6 L54 16 L51 42 C49 51 41 57 32 60 C23 57 15 51 13 42 L10 16 Z"
              fill="#171A1E"
              stroke="#E5B85A"
              strokeWidth="2.5"
            />
            <path d="M32 12 L34.5 19 L34 45 L30 45 L29.5 19 Z" fill="#D5DEE8" />
            <path d="M23 44 H41 L39.5 47 H24.5 Z" fill="#E5B85A" />
            <path
              d="M32 20 C38 27 42 33 42 40 C42 46 37.5 51 32 52 C26.5 51 22 46 22 40 C22 34 25 29 29 25 C28 29 30 32 32 33 Z"
              fill="#E55A2B"
            />
            <path
              d="M32 29 C35.5 34 37.5 38 37.5 42.5 C37.5 46.5 35 49 32 50 C29 49 26.5 46.5 26.5 42.5 C26.5 38 28.5 34 32 29 Z"
              fill="#FFD166"
            />
          </svg>
        )}
      </div>

      {/* Title & Tagline */}
      <div className="space-y-1 min-w-0">
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#E5B85A]">
          Hutan Terlupakan · Dark Fantasy RPG
        </div>
        <h1
          className={`font-display ${titleClass} font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#FFF1C2] via-[#F5E6C4] to-[#C89B3C] drop-shadow-[0_2px_10px_rgba(200,90,50,0.45)] leading-none`}
        >
          THE LAST EMBER
        </h1>
        {showTagline && (
          <p className="text-xs sm:text-sm text-[#C7C2B6] italic">
            &ldquo;Survive. Die. Remember. Rise Again.&rdquo;
          </p>
        )}
      </div>
    </div>
  );
};
