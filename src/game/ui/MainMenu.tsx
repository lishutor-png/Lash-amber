import React, { useState } from 'react';
import { SaveSlotRecord } from '../core/types';
import { soundEngine } from '../core/audio';
import { CHARACTER_CLASSES } from '../character/classes';

interface MainMenuProps {
  recentSave: SaveSlotRecord | null;
  onNewGame: () => void;
  onContinue: () => void;
  onLoadGame: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onCredits: () => void;
}

const BACKDROP_URL = '/src/assets/images/main_menu_forest_backdrop_1795498352096.jpg';

export const MainMenu: React.FC<MainMenuProps> = ({
  recentSave,
  onNewGame,
  onContinue,
  onLoadGame,
  onCollection,
  onSettings,
  onCredits,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const recentClass =
    recentSave?.player ? CHARACTER_CLASSES[recentSave.player.classId] : null;

  const clickWrap = (fn: () => void) => () => {
    soundEngine.playClick();
    fn();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0D0F10] flex items-center">
      {/* Atmospheric Forest Key Art Backdrop */}
      {!imgFailed ? (
        <img
          src={BACKDROP_URL}
          alt="Hutan Terlupakan pada senja kelam"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0D0F10] via-[#112419] to-[#1C2024]"
          aria-hidden="true"
        />
      )}

      {/* Measured contrast scrim preserving right-side forest ruins */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0D0F10]/95 via-[#0D0F10]/75 to-[#0D0F10]/25"
        aria-hidden="true"
      />

      {/* Left-aligned Game Shell Lockup & Menu */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 py-6 flex flex-col justify-center h-full">
        <div className="max-w-md space-y-5">
          {/* Bespoke SVG Ember Crest + Title Lockup */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
                className="shrink-0 animate-ember-float"
              >
                <rect x="16" y="4" width="4" height="4" fill="#E5B85A" />
                <rect x="12" y="8" width="12" height="4" fill="#C89B3C" />
                <rect x="10" y="12" width="16" height="8" fill="#C85A32" />
                <rect x="14" y="14" width="8" height="6" fill="#E5B85A" />
                <rect x="12" y="20" width="12" height="4" fill="#8A6822" />
                <rect x="8" y="26" width="20" height="4" fill="#5A626A" />
                <rect x="6" y="30" width="24" height="2" fill="#3A4046" />
              </svg>
              <span className="text-xs tracking-wider text-[#C89B3C] font-medium">
                Hutan Terlupakan · Edisi Awal
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-wide text-[#F5E6C4] leading-tight text-balance">
              THE LAST EMBER
            </h1>

            <p className="text-sm sm:text-base text-[#B8B2A6] italic">
              &ldquo;Survive. Die. Remember. Rise Again.&rdquo;
            </p>
          </div>

          {/* Primary Menu Buttons */}
          <nav aria-label="Menu Utama" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={clickWrap(onNewGame)}
              className="sm:col-span-2 min-h-[46px] px-5 py-2.5 rounded bg-[#C89B3C] hover:bg-[#E5B85A] active:scale-[0.99] text-[#0D0F10] font-semibold text-sm tracking-wide transition-all flex items-center justify-between cursor-pointer whitespace-nowrap"
            >
              <span>Permainan Baru</span>
              <span className="text-xs font-mono-num opacity-80">Mulai Petualangan</span>
            </button>

            <button
              type="button"
              disabled={!recentSave}
              onClick={clickWrap(onContinue)}
              className={`sm:col-span-2 min-h-[46px] px-5 py-2.5 rounded border text-sm font-medium transition-all flex items-center justify-between whitespace-nowrap ${
                recentSave
                  ? 'bg-[#17281E]/90 hover:bg-[#1E3527] border-[#C89B3C]/60 text-[#F5E6C4] cursor-pointer'
                  : 'bg-[#14171A]/60 border-[#3A4046]/50 text-[#6F767E] cursor-not-allowed'
              }`}
            >
              <span>Lanjutkan</span>
              <span className="text-xs font-mono-num truncate max-w-[200px]">
                {recentSave && recentSave.player && recentClass
                  ? `Slot ${recentSave.slotIndex} · ${recentClass.name} Lv.${recentSave.player.level}`
                  : 'Belum ada simpanan'}
              </span>
            </button>

            <button
              type="button"
              onClick={clickWrap(onLoadGame)}
              className="min-h-[44px] px-4 py-2 rounded bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Muat Permainan
            </button>

            <button
              type="button"
              onClick={clickWrap(onCollection)}
              className="min-h-[44px] px-4 py-2 rounded bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Koleksi Karakter
            </button>

            <button
              type="button"
              onClick={clickWrap(onSettings)}
              className="min-h-[44px] px-4 py-2 rounded bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Pengaturan
            </button>

            <button
              type="button"
              onClick={clickWrap(onCredits)}
              className="min-h-[44px] px-4 py-2 rounded bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Kredit
            </button>
          </nav>

          <p className="text-xs text-[#8F969E]">
            Kontrol: Joystick Sentuh atau WASD/Panah · Spasi Serang · F/E Interaksi · I Tas
          </p>
        </div>
      </div>
    </div>
  );
};
