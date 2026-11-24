import React from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import { PlayerState, WorldState } from '../core/types';

interface DeathModalProps {
  cause: 'COMBAT' | 'STARVATION' | 'DEHYDRATION' | 'ENVIRONMENT';
  player: PlayerState;
  world: WorldState;
  hasSavedSlot: boolean;
  onLoadLastSave: () => void;
  onNewGame: () => void;
  onMainMenu: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  cause,
  player,
  world,
  hasSavedSlot,
  onLoadLastSave,
  onNewGame,
  onMainMenu,
}) => {
  const cls = CHARACTER_CLASSES[player.classId];

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0F10]/92 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#14171A] border border-[#9E2A2B]/70 rounded shadow-2xl p-6 text-center space-y-4">
        <div className="space-y-1">
          <div className="text-xs tracking-wider text-[#E5989B] font-semibold">
            BARA TELAH PADAM
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#F5E6C4]">
            Kamu Gugur di Alam Liar
          </h2>
          <p className="text-xs text-[#9BA3AB]">
            {cause === 'STARVATION'
              ? 'Kelaparan ekstrem merenggut sisa tenagamu di tengah rimba.'
              : cause === 'DEHYDRATION'
              ? 'Dahaga berkepanjangan mengeringkan daya hidupmu di alam liar.'
              : cause === 'ENVIRONMENT'
              ? 'Bahaya lingkungan ekstrem menguras habis daya tahan tubuhmu tanpa perlengkapan pelindung.'
              : 'Musuh rimba menumbangkan pertahananmu.'}
          </p>
        </div>

        <div className="p-3.5 rounded bg-[#0D0F10] border border-[#252A2E] grid grid-cols-2 gap-2 text-xs font-mono-num text-left">
          <div>
            <span className="text-[#7D858E]">Kelas: </span>
            <span className="text-[#F5E6C4]">{cls.name}</span>
          </div>
          <div>
            <span className="text-[#7D858E]">Level: </span>
            <span className="text-[#E5B85A]">{player.level}</span>
          </div>
          <div>
            <span className="text-[#7D858E]">Bertahan: </span>
            <span className="text-[#F5E6C4]">{world.dayCount} Hari</span>
          </div>
          <div>
            <span className="text-[#7D858E]">Musuh Kalah: </span>
            <span className="text-[#F5E6C4]">{player.monstersDefeated}</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {hasSavedSlot && (
            <button
              type="button"
              onClick={onLoadLastSave}
              className="w-full min-h-[44px] px-4 py-2 rounded bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Bangkit dari Simpanan Terakhir</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewGame}
            className="w-full min-h-[44px] px-4 py-2 rounded bg-[#264D34] hover:bg-[#326343] text-white text-xs font-bold cursor-pointer"
          >
            Mulai Penyintas Baru
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full min-h-[44px] px-4 py-2 rounded bg-[#1C2024] hover:bg-[#2A3036] border border-[#3A4046] text-[#E6E2D8] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Menu Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
};
