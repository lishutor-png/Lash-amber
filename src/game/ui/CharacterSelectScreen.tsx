import React, { useState } from 'react';
import { ArrowLeft, Dices, Shield, Sword, Heart, Zap } from 'lucide-react';
import { CHARACTER_CLASS_LIST } from '../character/classes';
import { CharacterClassId, SaveSlotRecord } from '../core/types';
import { soundEngine } from '../core/audio';
import { CharacterPortrait } from './PixelPortrait';

interface CharacterSelectScreenProps {
  saveSlots: SaveSlotRecord[];
  onBack: () => void;
  onStartGame: (classId: CharacterClassId, seed: number, slotIndex: 1 | 2 | 3) => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  saveSlots,
  onBack,
  onStartGame,
}) => {
  const [selectedId, setSelectedId] = useState<CharacterClassId>('warrior');
  const [seedInput, setSeedInput] = useState<string>(() =>
    String(Math.floor(100000 + Math.random() * 899999))
  );

  // Pick first empty slot by default, else Slot 1
  const [targetSlot, setTargetSlot] = useState<1 | 2 | 3>(() => {
    const empty = saveSlots.find((s) => !s.exists);
    return empty ? empty.slotIndex : 1;
  });

  const selectedClass =
    CHARACTER_CLASS_LIST.find((c) => c.id === selectedId) ?? CHARACTER_CLASS_LIST[0];

  const regenerateSeed = () => {
    soundEngine.playClick();
    setSeedInput(String(Math.floor(100000 + Math.random() * 899999)));
  };

  const handleStart = () => {
    soundEngine.playClick();
    let numericSeed = parseInt(seedInput.trim(), 10);
    if (Number.isNaN(numericSeed)) {
      // Hash arbitrary string seed into integer
      numericSeed = Array.from(seedInput.trim() || 'ember').reduce(
        (acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0,
        1337
      );
    }
    onStartGame(selectedId, Math.abs(numericSeed) || 424242, targetSlot);
  };

  return (
    <div className="w-full h-full bg-[#0D0F10] text-[#E6E2D8] flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="shrink-0 px-5 py-3 border-b border-[#252A2E] bg-[#121517] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="min-h-[44px] px-4 py-1.5 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5E6C4] truncate">
          Pilih Penyintas
        </h1>

        <div className="text-xs text-[#9BA3AB] hidden sm:block whitespace-nowrap">
          Bioma Awal: Hutan Terlupakan
        </div>
      </header>

      {/* Main Split Content (Landscape-friendly) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5 overflow-y-auto ember-scroll">
        {/* Left: 8 Character Class Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 content-start">
          {CHARACTER_CLASS_LIST.map((cls) => {
            const active = cls.id === selectedId;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedId(cls.id);
                }}
                className={`p-3 rounded border text-left transition-all flex flex-col items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-[#17281E] border-[#C89B3C] shadow-md shadow-[#C89B3C]/10'
                    : 'bg-[#14171A] border-[#2A3036] hover:border-[#5A626A]'
                }`}
              >
                <div className="w-[72px] h-[72px] rounded-lg bg-[#0D0F10] border border-[#252A2E] flex items-center justify-center">
                  <CharacterPortrait classId={cls.id} size={58} />
                </div>
                <div className="w-full text-center">
                  <div className="text-sm font-semibold text-[#F5E6C4] truncate">
                    {cls.name}
                  </div>
                  <div className="text-[11px] text-[#8F969E] truncate">{cls.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Character Details & World Config */}
        <div className="lg:col-span-5 bg-[#14171A] border border-[#2A3036] rounded p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 shrink-0 rounded-lg bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center">
                <CharacterPortrait classId={selectedClass.id} size={76} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold text-[#F5E6C4]">
                  {selectedClass.name}
                </h2>
                <p className="text-xs text-[#C89B3C] font-medium">
                  {selectedClass.title}
                </p>
                <p className="text-xs text-[#B8B2A6] mt-1.5 leading-relaxed">
                  {selectedClass.description}
                </p>
              </div>
            </div>

            {/* Base Attributes */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#252A2E]">
              <div className="bg-[#0D0F10] p-2 rounded border border-[#252A2E]">
                <div className="flex items-center gap-1 text-[11px] text-[#9BA3AB]">
                  <Heart className="w-3 h-3 text-[#C85A32]" />
                  <span>HP</span>
                </div>
                <div className="font-mono-num text-sm font-semibold text-[#F5E6C4] mt-0.5">
                  {selectedClass.baseHp}
                </div>
              </div>
              <div className="bg-[#0D0F10] p-2 rounded border border-[#252A2E]">
                <div className="flex items-center gap-1 text-[11px] text-[#9BA3AB]">
                  <Sword className="w-3 h-3 text-[#E5B85A]" />
                  <span>Serang</span>
                </div>
                <div className="font-mono-num text-sm font-semibold text-[#F5E6C4] mt-0.5">
                  {selectedClass.baseAttack}
                </div>
              </div>
              <div className="bg-[#0D0F10] p-2 rounded border border-[#252A2E]">
                <div className="flex items-center gap-1 text-[11px] text-[#9BA3AB]">
                  <Shield className="w-3 h-3 text-[#7EC4E0]" />
                  <span>Tahan</span>
                </div>
                <div className="font-mono-num text-sm font-semibold text-[#F5E6C4] mt-0.5">
                  {selectedClass.baseDefense}
                </div>
              </div>
              <div className="bg-[#0D0F10] p-2 rounded border border-[#252A2E]">
                <div className="flex items-center gap-1 text-[11px] text-[#9BA3AB]">
                  <Zap className="w-3 h-3 text-[#8FC79A]" />
                  <span>Cepat</span>
                </div>
                <div className="font-mono-num text-sm font-semibold text-[#F5E6C4] mt-0.5">
                  {selectedClass.baseSpeed}
                </div>
              </div>
            </div>

            {/* Equipment, Passive & Skills */}
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[#8F969E]">Perlengkapan: </span>
                  <span className="text-[#E6E2D8] font-medium">
                    {selectedClass.startingEquipment.join(' · ')}
                  </span>
                </div>
                <span className="font-mono-num text-[#B388FF]">
                  MP {selectedClass.baseMana} · Senjata +{selectedClass.weaponDamage}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#112419]/60 border border-[#264D34]">
                <div className="text-[#E5B85A] font-semibold">
                  Pasif: {selectedClass.passiveName}
                </div>
                <div className="text-[#C7C2B6] mt-0.5 leading-relaxed">
                  {selectedClass.passiveDescription}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#0D0F10] border border-[#252A2E] space-y-1">
                <div className="text-[#B388FF] font-semibold">Keahlian Pertarungan</div>
                <div className="text-[#C7C2B6]">
                  {selectedClass.skills.map((s) => s.name).join(' · ')}
                </div>
              </div>
            </div>

            {/* World Seed & Save Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#252A2E]">
              <div>
                <label
                  htmlFor="world-seed-input"
                  className="block text-[11px] text-[#9BA3AB] mb-1"
                >
                  Benih Dunia (Seed)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="world-seed-input"
                    type="text"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-lg bg-[#0D0F10] border border-[#3A4046] text-xs font-mono-num text-[#F5E6C4] focus:outline-none focus:border-[#C89B3C]"
                  />
                  <button
                    type="button"
                    onClick={regenerateSeed}
                    title="Acak Benih Dunia"
                    className="min-h-[44px] min-w-[44px] rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
                  >
                    <Dices className="w-5 h-5 text-[#C89B3C]" />
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-[#9BA3AB] mb-1">
                  Simpan ke Slot
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {([1, 2, 3] as const).map((slotNum) => {
                    const occupied = saveSlots.find((s) => s.slotIndex === slotNum)?.exists;
                    const active = targetSlot === slotNum;
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setTargetSlot(slotNum);
                        }}
                        className={`min-h-[44px] px-2 rounded-lg border text-xs font-mono-num transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#C89B3C] border-[#F5E6C4] text-[#0D0F10] font-semibold'
                            : 'bg-[#0D0F10] border-[#3A4046] text-[#B8B2A6] hover:border-[#7D858E]'
                        }`}
                      >
                        {slotNum}
                        {occupied ? '•' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="w-full min-h-[52px] px-5 py-2.5 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] font-bold text-sm tracking-wide transition-colors cursor-pointer shadow-lg"
          >
            Masuki Hutan Terlupakan
          </button>
        </div>
      </div>
    </div>
  );
};
