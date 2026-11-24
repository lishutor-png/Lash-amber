import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CHARACTER_CLASS_LIST } from '../character/classes';
import { soundEngine } from '../core/audio';
import { CharacterPortrait } from './PixelPortrait';

interface CollectionScreenProps {
  onBack: () => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ onBack }) => {
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
          Koleksi Karakter
        </h1>

        <span className="text-xs text-[#8F969E]">8 Kelas Penyintas</span>
      </header>

      <div className="flex-1 overflow-y-auto ember-scroll p-4 sm:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {CHARACTER_CLASS_LIST.map((cls) => (
            <div
              key={cls.id}
              className="p-4 rounded bg-[#14171A] border border-[#2A3036] flex flex-col justify-between gap-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-[72px] h-[72px] shrink-0 rounded-lg bg-[#0D0F10] border border-[#252A2E] flex items-center justify-center">
                    <CharacterPortrait classId={cls.id} size={58} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold text-[#F5E6C4] truncate">
                      {cls.name}
                    </h2>
                    <div className="text-xs text-[#C89B3C] truncate">{cls.title}</div>
                  </div>
                </div>

                <p className="text-xs text-[#B8B2A6] leading-relaxed">{cls.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#252A2E] text-xs">
                <div className="flex items-center justify-between font-mono-num text-[#E6E2D8]">
                  <span>HP {cls.baseHp}</span>
                  <span>MP {cls.baseMana}</span>
                  <span>ATK {cls.baseAttack}</span>
                  <span>DEF {cls.baseDefense}</span>
                </div>
                <div className="text-[11px] text-[#9BA3AB]">
                  Bekal: {cls.startingEquipment.join(', ')}
                </div>
                <div className="text-[11px] text-[#B388FF]">
                  Keahlian: {cls.skills.map((s) => s.name).join(' · ')}
                </div>
                <div className="p-2 rounded bg-[#112419]/60 border border-[#264D34] text-[11px]">
                  <span className="text-[#E5B85A] font-semibold">{cls.passiveName}: </span>
                  <span className="text-[#C7C2B6]">{cls.passiveDescription}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
