import React, { useEffect, useState } from 'react';
import splashBackdropImg from '../../assets/images/splash_ember_backdrop_1795524126214.jpg';
import { GameLogo } from './GameLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

const SPARKS = [
  { left: '44%', delay: '0s', size: 4 },
  { left: '48%', delay: '0.5s', size: 5 },
  { left: '51%', delay: '1.1s', size: 3 },
  { left: '54%', delay: '0.3s', size: 4 },
  { left: '46%', delay: '1.7s', size: 3 },
  { left: '52%', delay: '2.1s', size: 5 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const start = performance.now();
    const duration = 2200;
    let rafId = 0;

    const tick = (now: number) => {
      const pct = Math.min(100, 10 + ((now - start) / duration) * 90);
      setProgress(pct);
      if (now - start < duration) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    rafId = window.requestAnimationFrame(tick);

    const timer = window.setTimeout(() => {
      onComplete();
    }, duration + 180);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <button
      type="button"
      onClick={onComplete}
      aria-label="Layar pembuka The Last Ember, ketuk untuk melanjutkan"
      className="relative w-full h-full overflow-hidden bg-[#0D0F10] flex flex-col items-center justify-center p-6 text-center cursor-pointer focus:outline-none"
    >
      {!imgFailed ? (
        <img
          src={splashBackdropImg}
          alt="Kuil bara api di tengah Hutan Terlupakan"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#090B0C] via-[#132219] to-[#0D0F10]"
          aria-hidden="true"
        />
      )}

      <div
        className="absolute inset-0 bg-radial from-transparent via-[#0D0F10]/65 to-[#0D0F10]/95"
        aria-hidden="true"
      />

      {/* Rising Ember Sparks */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 h-36 overflow-hidden">
        {SPARKS.map((sp, i) => (
          <span
            key={i}
            style={{
              left: sp.left,
              animationDelay: sp.delay,
              width: sp.size,
              height: sp.size,
            }}
            className="absolute bottom-0 rounded-full bg-[#FFD166] shadow-[0_0_8px_#FF6B35] animate-splash-spark"
          />
        ))}
      </div>

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center gap-6">
        <GameLogo size="lg" layout="vertical" showTagline />

        <div className="w-64 sm:w-72 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-[#1C2024]/90 border border-[#3A4046] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#9E2A2B] via-[#E55A2B] to-[#FFD166] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-medium text-[#B8B2A6] tracking-wide">
            Menyalakan bara terakhir... Ketuk layar untuk masuk
          </div>
        </div>
      </div>
    </button>
  );
};
