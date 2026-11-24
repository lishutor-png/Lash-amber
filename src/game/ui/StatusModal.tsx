import React, { useMemo, useState } from 'react';
import {
  Check,
  Coins,
  Edit3,
  Home,
  PawPrint,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import { LOOT_RARITY_COLORS } from '../combat/lootSystem';
import {
  COMPANION_RARITY_LABELS,
  DIET_LABELS,
  ROLE_META,
} from '../companion/companionSystem';
import {
  EquipmentSlot,
  ItemId,
  PlayerState,
  WorldState,
} from '../core/types';
import { ITEM_ORDER, ITEMS } from '../inventory/items';
import {
  EQUIPMENT_SLOT_META,
  getEffectiveResistances,
  normalizeEquipSlot,
} from '../survival/survivalSystem';
import { getRegionInfo } from '../world/worldGenerator';
import { AnimalPortrait, CharacterPortrait, ItemPixelIcon } from './PixelPortrait';

interface StatusModalProps {
  player: PlayerState;
  world: WorldState;
  onSelectCompanion: (companionId: string | null) => void;
  onEquipItem: (itemId: ItemId) => { success: boolean; message: string };
  onUnequipSlot: (slot: EquipmentSlot) => { success: boolean; message: string };
  onRenameCompanion: (companionId: string, newName: string) => boolean;
  onReleaseCompanion: (companionId: string) => void;
  onClose: () => void;
}

const SLOT_ORDER: EquipmentSlot[] = [
  'WEAPON',
  'OFFHAND',
  'HELMET',
  'CHEST',
  'GLOVES',
  'BOOTS',
  'ACCESSORY',
];

function formatStatDiff(delta: number, label: string, suffix = ''): string | null {
  if (delta === 0) return null;
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  return `${sign}${suffix} ${label}`;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  player,
  world,
  onSelectCompanion,
  onEquipItem,
  onUnequipSlot,
  onRenameCompanion,
  onReleaseCompanion,
  onClose,
}) => {
  const [tab, setTab] = useState<'STATUS' | 'COMPANIONS'>('STATUS');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('WEAPON');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [releaseCandidateId, setReleaseCandidateId] = useState<string | null>(null);

  const cls = CHARACTER_CLASSES[player.classId];
  const expPct = Math.min(100, (player.exp / player.expToNext) * 100);
  const regionInfo = getRegionInfo(
    world.seed,
    world.currentRegionX,
    world.currentRegionY
  );

  const equippedId = player.equippedSlots?.[selectedSlot] ?? null;
  const equippedDef = equippedId ? ITEMS[equippedId] : null;

  const compatibleBagItems = useMemo(() => {
    return ITEM_ORDER.filter((id) => {
      if ((player.inventory[id] ?? 0) <= 0) return false;
      const def = ITEMS[id];
      if (def.category !== 'EQUIPMENT') return false;
      return normalizeEquipSlot(def.equipSlot) === selectedSlot;
    });
  }, [player.inventory, selectedSlot]);

  const releaseTarget = releaseCandidateId
    ? player.companions.find((c) => c.id === releaseCandidateId) ?? null
    : null;
  const manaRegenTotal = +(1.6 + (player.bonusManaRegen ?? 0)).toFixed(1);
  const envResists = getEffectiveResistances(player, world);

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/85 flex items-center justify-center p-2.5 sm:p-4">
      <div className="w-full max-w-4xl bg-[#14171A] border border-[#3A4046] rounded shadow-2xl overflow-hidden flex flex-col max-h-[93dvh]">
        <header className="px-4 py-2.5 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#F5E6C4] truncate">
              Status Penyintas, Perlengkapan & Pendamping
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Status"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Landscape Tab Bar */}
        <div className="px-4 py-2 bg-[#101315] border-b border-[#252A2E] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab('STATUS')}
            className={`min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
              tab === 'STATUS'
                ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Status & Perlengkapan</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('COMPANIONS')}
            className={`min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
              tab === 'COMPANIONS'
                ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
            }`}
          >
            <PawPrint className="w-4 h-4" />
            <span>Koleksi Pendamping ({player.companions.length})</span>
          </button>
        </div>

        <div className="p-3.5 sm:p-4 space-y-3.5 flex-1 overflow-y-auto ember-scroll">
          {feedback && (
            <div
              className={`px-3 py-2 rounded border text-xs ${
                feedback.ok
                  ? 'bg-[#17281E] border-[#C89B3C]/70 text-[#F5E6C4]'
                  : 'bg-[#2C1618] border-[#9E2A2B] text-[#E5989B]'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {tab === 'STATUS' ? (
            <>
              {/* Character Summary & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 p-3 rounded bg-[#0D0F10] border border-[#252A2E] space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 shrink-0 rounded bg-[#14171A] border border-[#C89B3C]/65 flex items-center justify-center">
                      <CharacterPortrait
                        classId={player.classId}
                        size={56}
                        weaponVisual={player.equippedWeaponVisual}
                        armorVisual={player.equippedArmorVisual}
                        offhandVisual={player.equippedOffhandVisual}
                        helmetVisual={player.equippedHelmetVisual}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base sm:text-lg font-bold text-[#F5E6C4] truncate">
                        {cls.name}
                      </div>
                      <div className="text-xs text-[#C89B3C]">
                        {cls.title} · Level {player.level}
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono-num text-[#9BA3AB]">
                          <span>EXP</span>
                          <span>
                            {player.exp}/{player.expToNext}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#14171A] rounded overflow-hidden">
                          <div className="h-full bg-[#C89B3C]" style={{ width: `${expPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Combat & Survival Stat Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5 text-xs">
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">HP</div>
                      <div className="font-mono-num font-bold text-[#E5989B]">
                        {Math.ceil(player.hp)}/{player.maxHp}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">MP / Regen</div>
                      <div className="font-mono-num font-bold text-[#B388FF]">
                        {Math.round(player.mana)}/{player.maxMana} (+{manaRegenTotal})
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">Serangan + Senjata</div>
                      <div className="font-mono-num font-bold text-[#F5E6C4]">
                        {player.attack}+{player.weaponDamage} ({player.attack + player.weaponDamage})
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">Pertahanan (DEF)</div>
                      <div className="font-mono-num font-bold text-[#7EC4E0]">
                        {player.defense}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">Kecepatan / Kritis</div>
                      <div className="font-mono-num font-bold text-[#FFD166]">
                        {player.speed} SPD · {Math.round((player.critChance ?? 0.08) * 100)}%
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#14171A] border border-[#252A2E]">
                      <div className="text-[10px] text-[#8F969E]">Stamina / Jinak / Pancing</div>
                      <div className="font-mono-num font-bold text-[#8FC79A]">
                        {Math.round(player.stamina)} · J{player.tamingSkillLevel} · P{player.fishingSkillLevel}
                      </div>
                    </div>
                  </div>

                  {/* Gold & Environmental Survival Resistances */}
                  <div className="p-2 rounded bg-[#14171A] border border-[#252A2E] space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9BA3AB] flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#FFD166]" />
                        <span>Koin Emas</span>
                      </span>
                      <span className="font-mono-num font-bold text-[#FFD166]">
                        {player.gold ?? 0} Emas
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono-num text-[10px] pt-1 border-t border-[#252A2E]">
                      <span className="text-[#7EC4E0]">Dingin: {envResists.cold}</span>
                      <span className="text-[#FFD166]">Panas: {envResists.heat}</span>
                      <span className="text-[#FF8A50]">Api: {envResists.fire}</span>
                      <span className="text-[#81C784]">Racun: {envResists.poison}</span>
                    </div>
                  </div>

                  {/* Active Companion Banner */}
                  <div className="p-2.5 rounded bg-[#14171A] border border-[#252A2E]">
                    {player.companion ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-11 h-11 shrink-0 rounded-lg bg-[#0D0F10] border border-[#C89B3C]/60 flex items-center justify-center">
                            <AnimalPortrait species={player.companion.species} size={38} />
                          </div>
                          <div className="min-w-0 text-xs">
                            <div className="font-bold text-[#E5B85A] truncate">
                              {player.companion.name} (Lv.{player.companion.level})
                            </div>
                            <div
                              className="text-[10px] font-semibold"
                              style={{ color: ROLE_META[player.companion.role].color }}
                            >
                              {ROLE_META[player.companion.role].label}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab('COMPANIONS')}
                          className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-bold text-[#F5E6C4] cursor-pointer whitespace-nowrap"
                        >
                          Kelola
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#8F969E]">
                        Belum ada pendamping aktif. Lemahkan satwa hingga &le;45% HP lalu beri makan untuk menjinakkannya.
                      </div>
                    )}
                  </div>
                </div>

                {/* 7 Interactive Equipment Slots + Bag Gear Picker */}
                <div className="md:col-span-7 p-3 rounded bg-[#0D0F10] border border-[#252A2E] flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#E5B85A] uppercase tracking-wider">
                      7 Slot Perlengkapan Karakter
                    </h3>
                    <span className="text-[11px] text-[#9BA3AB]">
                      Pilih slot untuk pasang, ganti, atau lepas
                    </span>
                  </div>

                  {/* Slot Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SLOT_ORDER.map((slot) => {
                      const itemId = player.equippedSlots?.[slot] ?? null;
                      const def = itemId ? ITEMS[itemId] : null;
                      const active = selectedSlot === slot;
                      const rarityColor = def?.rarity
                        ? LOOT_RARITY_COLORS[def.rarity]
                        : '#8F969E';

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center gap-2 min-h-[64px] ${
                            active
                              ? 'bg-[#17281E] border-[#C89B3C]'
                              : 'bg-[#14171A] border-[#2A3036] hover:border-[#5A626A]'
                          }`}
                        >
                          <div className="w-11 h-11 shrink-0 rounded-lg bg-[#0D0F10] border border-[#252A2E] flex items-center justify-center">
                            {itemId ? (
                              <ItemPixelIcon itemId={itemId} size={36} />
                            ) : (
                              <Shield className="w-4 h-4 text-[#3A4046]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-[#8F969E] truncate">
                              {EQUIPMENT_SLOT_META[slot].shortLabel}
                            </div>
                            <div
                              className="text-[11px] font-semibold truncate"
                              style={{ color: def ? rarityColor : '#676E75' }}
                            >
                              {def ? def.name : 'Kosong'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Slot Detail & Unequip */}
                  <div className="p-2.5 rounded-lg bg-[#14171A] border border-[#2A3036] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-[#9BA3AB]">
                          Slot Terpilih: <strong className="text-[#F5E6C4]">{EQUIPMENT_SLOT_META[selectedSlot].label}</strong>
                        </div>
                        {equippedDef ? (
                          <div className="text-xs font-bold text-[#E5B85A] mt-0.5">
                            Terpasang: {equippedDef.name}
                          </div>
                        ) : (
                          <div className="text-xs text-[#676E75] mt-0.5">
                            Belum ada perlengkapan terpasang di slot ini.
                          </div>
                        )}
                      </div>

                      {equippedId && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = onUnequipSlot(selectedSlot);
                            setFeedback({ ok: res.success, text: res.message });
                          }}
                          className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#2C1618] hover:bg-[#442024] border border-[#9E2A2B] text-xs font-bold text-[#F5E6C4] cursor-pointer whitespace-nowrap"
                        >
                          Lepas ke Tas
                        </button>
                      )}
                    </div>

                    {equippedDef && (
                      <div className="text-[11px] text-[#9BA3AB]">
                        {equippedDef.description}
                      </div>
                    )}
                  </div>

                  {/* Compatible Items in Bag */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#C7C2B6]">
                      Perlengkapan Cocok di Tas ({compatibleBagItems.length})
                    </div>
                    {compatibleBagItems.length === 0 ? (
                      <div className="p-3 rounded bg-[#14171A] border border-[#252A2E] text-[11px] text-[#8F969E]">
                        Tidak ada perlengkapan untuk slot {EQUIPMENT_SLOT_META[selectedSlot].shortLabel} di tas. Buat di Meja Racik atau dapatkan dari rampasan!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto ember-scroll">
                        {compatibleBagItems.map((itemId) => {
                          const def = ITEMS[itemId];
                          const qty = player.inventory[itemId] ?? 0;
                          const diffs = [
                            formatStatDiff(
                              (def.bonusAtk ?? 0) - (equippedDef?.bonusAtk ?? 0),
                              'ATK'
                            ),
                            formatStatDiff(
                              (def.bonusDef ?? 0) - (equippedDef?.bonusDef ?? 0),
                              'DEF'
                            ),
                            formatStatDiff(
                              (def.speedBonus ?? 0) - (equippedDef?.speedBonus ?? 0),
                              'SPD'
                            ),
                            formatStatDiff(
                              Math.round(((def.critBonus ?? 0) - (equippedDef?.critBonus ?? 0)) * 100),
                              'Kritis',
                              '%'
                            ),
                            formatStatDiff(
                              +(
                                (def.bonusManaRegen ?? 0) -
                                (equippedDef?.bonusManaRegen ?? 0)
                              ).toFixed(1),
                              'Regen MP'
                            ),
                          ].filter(Boolean) as string[];

                          return (
                            <div
                              key={itemId}
                              className="p-2.5 rounded-lg bg-[#14171A] border border-[#2A3036] flex items-center justify-between gap-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-11 shrink-0 rounded-lg bg-[#0D0F10] border border-[#252A2E] flex items-center justify-center">
                                  <ItemPixelIcon itemId={itemId} size={36} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#F5E6C4] truncate">
                                    {def.name} <span className="text-[#9BA3AB] font-mono-num">x{qty}</span>
                                  </div>
                                  <div className="text-[10px] font-mono-num text-[#8FC79A] truncate">
                                    {diffs.length > 0 ? diffs.join(' · ') : 'Setara'}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const res = onEquipItem(itemId);
                                  setFeedback({ ok: res.success, text: res.message });
                                }}
                                className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-[#264D34] hover:bg-[#326343] border border-[#8FC79A]/70 text-xs font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
                              >
                                {equippedId ? 'Ganti' : 'Pasang'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Passive, Skills & Survival Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded bg-[#112419]/60 border border-[#264D34] space-y-1">
                  <div className="font-semibold text-[#E5B85A]">
                    Kemampuan Pasif: {cls.passiveName}
                  </div>
                  <div className="text-[#C7C2B6] leading-snug">{cls.passiveDescription}</div>
                </div>
                <div className="p-3 rounded bg-[#0D0F10] border border-[#252A2E] space-y-1">
                  <div className="text-[#8F969E]">Alat Bertahan</div>
                  <div className="text-[#E6E2D8] font-medium">
                    {player.hasAxe ? 'Kapak Batu' : 'Tanpa Kapak'} ·{' '}
                    {player.hasPickaxe ? 'Beliung Batu' : 'Tanpa Beliung'} ·{' '}
                    {player.hasFishingRod ? 'Joran Pancing' : 'Tanpa Pancingan'}
                  </div>
                  <div className="text-[11px] font-mono-num text-[#9BA3AB] pt-0.5">
                    Wilayah: {regionInfo.name} · Terbuka: {world.exploredRegions.length} · Benih: {world.seed}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[#C7C2B6]">
                  Batas aktif saat menjelajah:{' '}
                  <strong className="text-[#E5B85A]">1 Pendamping Aktif</strong> (
                  {player.companions.length} dijinakkan)
                </div>
                <div className="text-[11px] text-[#9BA3AB]">
                  Ubah nama, aktifkan, istirahatkan, atau lepaskan pendamping di sini.
                </div>
              </div>

              {player.companions.length === 0 ? (
                <div className="p-6 rounded bg-[#0D0F10] border border-[#252A2E] text-center space-y-2 text-xs">
                  <div className="text-[#E5B85A] font-semibold">
                    Belum Ada Pendamping Dijinakkan
                  </div>
                  <p className="text-[#9BA3AB] max-w-md mx-auto">
                    Temukan Rusa Roh, Rubah Bara, Kura-Kura Batu, Serigala Rimba, atau Babi Hutan di hutan. Masuk pertarungan, lemahkan hingga HP &le; 45%, lalu beri makan sesuai selera mereka!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {player.companions.map((comp) => {
                    const roleMeta = ROLE_META[comp.role];
                    const compExpPct = Math.min(
                      100,
                      (comp.exp / Math.max(1, comp.expToNext)) * 100
                    );
                    const isEditing = editingCompanionId === comp.id;

                    return (
                      <div
                        key={comp.id}
                        className={`p-3 rounded border flex flex-col justify-between gap-2.5 ${
                          comp.active
                            ? 'bg-[#112419]/50 border-[#C89B3C]'
                            : 'bg-[#0D0F10] border-[#2A3036]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 shrink-0 rounded-lg bg-[#14171A] border border-[#3A4046] flex items-center justify-center">
                            <AnimalPortrait species={comp.species} size={48} />
                          </div>
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={renameDraft}
                                  maxLength={24}
                                  onChange={(e) => setRenameDraft(e.target.value)}
                                  className="min-w-0 flex-1 min-h-[38px] px-2.5 py-1 rounded bg-[#14171A] border border-[#C89B3C] text-xs text-[#F5E6C4] focus:outline-none"
                                  placeholder="Nama baru..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ok = onRenameCompanion(comp.id, renameDraft);
                                    if (ok) {
                                      setFeedback({
                                        ok: true,
                                        text: `Nama pendamping diperbarui menjadi ${renameDraft.trim()}.`,
                                      });
                                    }
                                    setEditingCompanionId(null);
                                  }}
                                  className="min-h-[38px] min-w-[38px] px-2 rounded bg-[#264D34] text-white cursor-pointer flex items-center justify-center"
                                  aria-label="Simpan Nama"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCompanionId(null)}
                                  className="min-h-[38px] min-w-[38px] px-2 rounded bg-[#1C2024] text-[#9BA3AB] cursor-pointer flex items-center justify-center"
                                  aria-label="Batal Ubah Nama"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-bold text-[#F5E6C4] truncate">
                                    {comp.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCompanionId(comp.id);
                                      setRenameDraft(comp.name);
                                    }}
                                    aria-label={`Ubah nama ${comp.name}`}
                                    className="p-1 text-[#8F969E] hover:text-[#E5B85A] cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-[11px] font-mono-num text-[#E5B85A] shrink-0">
                                  Lv.{comp.level}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] mt-0.5">
                              <span className="font-semibold" style={{ color: roleMeta.color }}>
                                {roleMeta.label}
                              </span>
                              <span className="text-[#8F969E]">·</span>
                              <span className="text-[#C7C2B6]">
                                {COMPANION_RARITY_LABELS[comp.rarity]}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#9BA3AB] mt-0.5">
                              Pola makan: {DIET_LABELS[comp.diet]}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#C7C2B6] bg-[#14171A]/75 rounded p-2 border border-[#252A2E] space-y-1">
                          <div className="font-semibold text-[#E5B85A]">
                            {comp.abilityName}
                          </div>
                          <div className="text-[#9BA3AB] leading-snug">
                            {comp.abilityDescription}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 font-mono-num text-[10px] text-[#C4CDD6]">
                            <span>HP {comp.maxHp}</span>
                            {comp.attack > 0 && <span>ATK {comp.attack}</span>}
                            {comp.defenseBonus > 0 && <span>DEF +{comp.defenseBonus}</span>}
                            {comp.healPower > 0 && <span>HEAL +{comp.healPower}</span>}
                            {comp.luckBonus > 0 && (
                              <span>TUAH +{Math.round(comp.luckBonus * 100)}%</span>
                            )}
                          </div>
                          <div className="h-1 bg-[#0D0F10] rounded overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#C89B3C]"
                              style={{ width: `${compExpPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCompanion(comp.active ? null : comp.id)}
                            className={`flex-1 min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border whitespace-nowrap ${
                              comp.active
                                ? 'bg-[#22272B] hover:bg-[#2F353B] border-[#5A626A] text-[#E6E2D8]'
                                : 'bg-[#264D34] hover:bg-[#326343] border-[#8FC79A] text-white'
                            }`}
                          >
                            {comp.active ? 'Istirahatkan' : 'Aktifkan'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setReleaseCandidateId(comp.id)}
                            title="Lepaskan Pendamping"
                            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-[#2C1618] hover:bg-[#442024] border border-[#9E2A2B] text-[#E5989B] text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Lepas</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Future Kennel UI Preview */}
              <div className="p-3 rounded bg-[#0D0F10] border border-[#2A3036] space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-[#F5E6C4]">
                    <Home className="w-4 h-4 text-[#C89B3C]" />
                    <span>Kandang Pendamping (Rancangan Markas)</span>
                  </div>
                  <span className="font-mono-num text-[11px] text-[#9BA3AB]">
                    Kapasitas 0/{player.kennelCapacity} · {player.kennelBuilt ? 'Aktif' : 'Persiapan'}
                  </span>
                </div>
                <p className="text-[11px] text-[#9BA3AB] leading-relaxed">
                  Kelak kamu bisa membangun Kandang Pendamping di perkemahan menggunakan <span className="text-[#E5B85A]">Papan Kayu</span> dan <span className="text-[#E5B85A]">Balok Batu</span> untuk menyimpan dan melatih pendamping yang sedang beristirahat.
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono-num text-[#7EC4E0]">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Papan Kayu: {player.inventory.papan_kayu ?? 0}/6 · Balok Batu:{' '}
                    {player.inventory.balok_batu ?? 0}/4
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Release Companion Confirmation Modal */}
      {releaseTarget && (
        <div className="fixed inset-0 z-50 bg-[#0D0F10]/85 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#14171A] border border-[#9E2A2B] rounded p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center shrink-0">
                <AnimalPortrait species={releaseTarget.species} size={34} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5E6C4]">
                  Lepaskan {releaseTarget.name}?
                </h3>
                <div className="text-[11px] text-[#9BA3AB]">
                  Level {releaseTarget.level} · {ROLE_META[releaseTarget.role].label}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#C7C2B6] leading-relaxed">
              Melepaskan pendamping ke alam liar akan menghapusnya secara permanen dari koleksimu dan menghentikan dukungannya selama eksplorasi maupun pertarungan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReleaseCandidateId(null)}
                className="min-h-[38px] px-3.5 py-1.5 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E6E2D8] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const releasedName = releaseTarget.name;
                  onReleaseCompanion(releaseTarget.id);
                  setReleaseCandidateId(null);
                  setFeedback({
                    ok: true,
                    text: `${releasedName} telah dilepaskan kembali ke alam liar.`,
                  });
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded bg-[#9E2A2B] hover:bg-[#B83335] text-xs font-bold text-white cursor-pointer"
              >
                Lepaskan Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
