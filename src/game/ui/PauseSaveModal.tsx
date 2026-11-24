import React, { useState } from 'react';
import { Save, X, Home, Play } from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import { SaveSlotRecord } from '../core/types';

interface PauseSaveModalProps {
  activeSlotIndex: 1 | 2 | 3;
  saveSlots: SaveSlotRecord[];
  onResume: () => void;
  onSaveToSlot: (slotIndex: 1 | 2 | 3) => Promise<void>;
  onQuitToMenu: () => void;
}

export const PauseSaveModal: React.FC<PauseSaveModalProps> = ({
  activeSlotIndex,
  saveSlots,
  onResume,
  onSaveToSlot,
  onQuitToMenu,
}) => {
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = async (slotIndex: 1 | 2 | 3) => {
    await onSaveToSlot(slotIndex);
    setSavedNotice(`Permainan berhasil disimpan ke Slot ${slotIndex}.`);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/85 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md bg-[#14171A] border border-[#3A4046] rounded shadow-2xl overflow-hidden">
        <header className="px-4 py-3 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#F5E6C4]">
            Jeda & Simpan
          </h2>
          <button
            type="button"
            onClick={onResume}
            aria-label="Lanjutkan Bermain"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          {savedNotice && (
            <div className="px-3 py-2 rounded bg-[#17281E] border border-[#C89B3C]/60 text-xs text-[#F5E6C4]">
              {savedNotice}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#C89B3C]">
              Pilih Slot Penyimpanan Lokal
            </div>
            {saveSlots.map((slot) => {
              const cls = slot.player ? CHARACTER_CLASSES[slot.player.classId] : null;
              const isCurrent = slot.slotIndex === activeSlotIndex;
              return (
                <button
                  key={slot.slotIndex}
                  type="button"
                  onClick={() => handleSave(slot.slotIndex)}
                  className={`w-full min-h-[54px] px-3.5 py-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#17281E]/70 border-[#C89B3C]/70 hover:bg-[#1E3527]'
                      : 'bg-[#0D0F10] border-[#2A3036] hover:border-[#5A626A]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#F5E6C4]">
                      Slot {slot.slotIndex} {isCurrent ? '(Aktif)' : ''}
                    </div>
                    <div className="text-[11px] text-[#8F969E] truncate">
                      {slot.exists && slot.player && slot.world && cls
                        ? `${cls.name} Lv.${slot.player.level} · Hari ${slot.world.dayCount}`
                        : 'Kosong — Klik untuk menyimpan di sini'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E5B85A] shrink-0">
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#252A2E]">
            <button
              type="button"
              onClick={onResume}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Lanjut Main</span>
            </button>

            <button
              type="button"
              onClick={onQuitToMenu}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-[#1C2024] hover:bg-[#2A3036] border border-[#3A4046] text-[#E6E2D8] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Menu Utama</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
