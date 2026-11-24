import React, { useState } from 'react';
import { ArrowLeft, Trash2, Play } from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import { SaveSlotRecord } from '../core/types';
import { soundEngine } from '../core/audio';
import { CharacterPortrait } from './PixelPortrait';

interface LoadGameScreenProps {
  saveSlots: SaveSlotRecord[];
  onBack: () => void;
  onLoadSlot: (slotIndex: 1 | 2 | 3) => void;
  onDeleteSlot: (slotIndex: 1 | 2 | 3) => Promise<void>;
}

export const LoadGameScreen: React.FC<LoadGameScreenProps> = ({
  saveSlots,
  onBack,
  onLoadSlot,
  onDeleteSlot,
}) => {
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<1 | 2 | 3 | null>(null);

  const formatTimestamp = (ts: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full h-full bg-[#0D0F10] text-[#E6E2D8] flex flex-col overflow-hidden">
      <header className="shrink-0 px-5 py-3 border-b border-[#252A2E] bg-[#121517] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="min-h-[44px] px-4 py-1.5 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5E6C4]">
          Muat Permainan
        </h1>

        <span className="text-xs text-[#8F969E]">3 Slot Penyimpanan Lokal</span>
      </header>

      <div className="flex-1 overflow-y-auto ember-scroll p-5 flex items-center justify-center">
        <div className="w-full max-w-3xl grid grid-cols-1 gap-3.5">
          {saveSlots.map((slot) => {
            const player = slot.player;
            const world = slot.world;
            const cls = player ? CHARACTER_CLASSES[player.classId] : null;
            const confirming = confirmDeleteSlot === slot.slotIndex;

            return (
              <div
                key={slot.slotIndex}
                className="p-4 rounded bg-[#14171A] border border-[#2A3036] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-[72px] h-[72px] shrink-0 rounded-lg bg-[#0D0F10] border border-[#252A2E] flex items-center justify-center">
                    {player ? (
                      <CharacterPortrait classId={player.classId} size={58} />
                    ) : (
                      <span className="text-xs font-mono-num text-[#5A626A]">
                        #{slot.slotIndex}
                      </span>
                    )}
                  </div>

                  {slot.exists && player && world && cls ? (
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#F5E6C4]">
                        <span>Slot {slot.slotIndex}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cls.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num text-[#C89B3C]">
                          Lv.{player.level}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9BA3AB] font-mono-num">
                        <span>Hari {world.dayCount}</span>
                        <span>HP {Math.round(player.hp)}/{player.maxHp}</span>
                        <span>Lapar {Math.round(player.hunger)}%</span>
                        <span>Benih {world.seed}</span>
                      </div>

                      <div className="text-[11px] text-[#7D858E]">
                        Terakhir disimpan: {formatTimestamp(slot.updatedAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-[#8F969E]">
                        Slot {slot.slotIndex} — Kosong
                      </div>
                      <div className="text-xs text-[#5A626A]">
                        Belum ada data petualangan tersimpan di slot ini.
                      </div>
                    </div>
                  )}
                </div>

                {slot.exists && (
                  <div className="flex items-center gap-2 shrink-0">
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            soundEngine.playClick();
                            await onDeleteSlot(slot.slotIndex);
                            setConfirmDeleteSlot(null);
                          }}
                          className="min-h-[46px] px-4 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#B83335] text-white text-xs font-bold cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setConfirmDeleteSlot(null);
                          }}
                          className="min-h-[46px] px-4 py-2 rounded-lg bg-[#1C2024] border border-[#3A4046] text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onLoadSlot(slot.slotIndex);
                          }}
                          className="min-h-[46px] px-5 py-2 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Muat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setConfirmDeleteSlot(slot.slotIndex);
                          }}
                          aria-label={`Hapus Slot ${slot.slotIndex}`}
                          className="min-h-[46px] min-w-[46px] rounded-lg bg-[#1C2024] hover:bg-[#331B1C] border border-[#3A4046] hover:border-[#9E2A2B] text-[#9BA3AB] hover:text-[#E5989B] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
