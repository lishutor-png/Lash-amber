import React, { useState } from 'react';
import menuBackdropUrl from '../../assets/images/main_menu_forest_backdrop_1795498352096.jpg';
import { CHARACTER_CLASSES } from '../character/classes';
import { soundEngine } from '../core/audio';
import { SaveSlotRecord } from '../core/types';
import { GameLogo } from './GameLogo';

interface MainMenuProps {
  recentSave: SaveSlotRecord | null;
  onNewGame: () => void;
  onContinue: () => void;
  onLoadGame: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onCredits: () => void;
}

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
          src={menuBackdropUrl}
          alt="Hutan Terlupakan pada senja kelam"
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
        className="absolute inset-0 bg-gradient-to-r from-[#0D0F10]/95 via-[#0D0F10]/78 to-[#0D0F10]/25"
        aria-hidden="true"
      />

      {/* Left-aligned Game Shell Lockup & Menu inside Android Safe Area */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 py-4 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] flex flex-col justify-center h-full">
        <div className="max-w-lg space-y-4">
          <GameLogo size="md" layout="horizontal" showTagline />

          {/* Primary Menu Buttons (Android touch-friendly >= 48px) */}
          <nav aria-label="Menu Utama" className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={clickWrap(onNewGame)}
              className="col-span-2 min-h-[52px] px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#E5B85A] hover:brightness-105 active:scale-[0.99] text-[#0D0F10] font-bold text-sm tracking-wide transition-all flex items-center justify-between cursor-pointer whitespace-nowrap shadow-lg shadow-[#C89B3C]/20"
            >
              <span>Permainan Baru</span>
              <span className="text-xs font-mono-num opacity-85">Mulai Petualangan</span>
            </button>

            <button
              type="button"
              disabled={!recentSave}
              onClick={clickWrap(onContinue)}
              className={`col-span-2 min-h-[50px] px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all flex items-center justify-between whitespace-nowrap ${
                recentSave
                  ? 'bg-[#17281E]/90 hover:bg-[#1E3527] border-[#C89B3C]/65 text-[#F5E6C4] cursor-pointer'
                  : 'bg-[#14171A]/65 border-[#3A4046]/50 text-[#6F767E] cursor-not-allowed'
              }`}
            >
              <span>Lanjutkan</span>
              <span className="text-xs font-mono-num truncate max-w-[220px]">
                {recentSave && recentSave.player && recentClass
                  ? `Slot ${recentSave.slotIndex} · ${recentClass.name} Lv.${recentSave.player.level}`
                  : 'Belum ada simpanan'}
              </span>
            </button>

            <button
              type="button"
              onClick={clickWrap(onLoadGame)}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Muat Permainan
            </button>

            <button
              type="button"
              onClick={clickWrap(onCollection)}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Koleksi Karakter
            </button>

            <button
              type="button"
              onClick={clickWrap(onSettings)}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              Pengaturan
            </button>

            <button
              type="button"
              onClick={clickWrap(onCredits)}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#16191C]/90 hover:bg-[#22272B] border border-[#3A4046] text-[#E6E2D8] text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap"
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
