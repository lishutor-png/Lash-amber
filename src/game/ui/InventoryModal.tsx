import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Backpack,
  Coins,
  Droplets,
  Hammer,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { LOOT_RARITY_COLORS, LOOT_RARITY_LABELS } from '../combat/lootSystem';
import {
  CraftingCategory,
  EquipmentSlot,
  InventoryFilterCategory,
  InventorySortMode,
  ItemId,
  LootRarity,
  PlayerState,
} from '../core/types';
import {
  CRAFTING_CATEGORIES,
  CRAFTING_RECIPES,
  ITEM_ORDER,
  ITEMS,
  getItemInventoryGroup,
} from '../inventory/items';
import {
  EQUIPMENT_SLOT_META,
  normalizeEquipSlot,
} from '../survival/survivalSystem';
import { ItemPixelIcon } from './PixelPortrait';

interface InventoryModalProps {
  player: PlayerState;
  feedbackMessage: string | null;
  onUseItem: (itemId: ItemId) => void;
  onUnequipSlot: (slot: EquipmentSlot) => void;
  onDropItem: (itemId: ItemId, quantity: number) => void;
  onInspectItem: (itemId: ItemId) => void;
  onDrinkContainer: () => void;
  onCraft: (recipeId: string) => void;
  onOpenEquipment?: () => void;
  onClose: () => void;
}

const INVENTORY_FILTER_TABS: {
  id: InventoryFilterCategory;
  label: string;
}[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'WEAPONS', label: 'Senjata' },
  { id: 'ARMOR', label: 'Zirah' },
  { id: 'MATERIALS', label: 'Bahan' },
  { id: 'FOOD', label: 'Makanan' },
  { id: 'POTIONS', label: 'Ramuan' },
  { id: 'TOOLS', label: 'Alat' },
  { id: 'MISCELLANEOUS', label: 'Lain-lain' },
];

const RARITY_RANK: Record<LootRarity, number> = {
  LEGENDARY: 5,
  EPIC: 4,
  RARE: 3,
  UNCOMMON: 2,
  COMMON: 1,
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  feedbackMessage,
  onUseItem,
  onUnequipSlot,
  onDropItem,
  onInspectItem,
  onDrinkContainer,
  onCraft,
  onOpenEquipment,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'BAG' | 'CRAFT'>('BAG');
  const [craftCat, setCraftCat] = useState<CraftingCategory>('FOOD');
  const [categoryFilter, setCategoryFilter] = useState<InventoryFilterCategory>('ALL');
  const [showUnowned, setShowUnowned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<InventorySortMode>('NEWEST');
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const [dropConfirmTarget, setDropConfirmTarget] = useState<{
    itemId: ItemId;
    qty: number;
  } | null>(null);

  const equippedIdToSlot = useMemo(() => {
    const map = new Map<ItemId, EquipmentSlot>();
    const slots = player.equippedSlots ?? {};
    (Object.keys(slots) as EquipmentSlot[]).forEach((slot) => {
      const id = slots[slot];
      if (id) map.set(id, slot);
    });
    return map;
  }, [player.equippedSlots]);

  const bagItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = ITEM_ORDER.filter((id) => {
      const qty = player.inventory[id] ?? 0;
      const isEquipped = equippedIdToSlot.has(id);
      if (!showUnowned && qty <= 0 && !isEquipped) return false;
      if (categoryFilter !== 'ALL' && getItemInventoryGroup(id) !== categoryFilter) {
        return false;
      }
      if (q) {
        const def = ITEMS[id];
        if (
          !def.name.toLowerCase().includes(q) &&
          !def.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'NEWEST') {
        const oa = player.itemAcquiredOrder?.[a] ?? 0;
        const ob = player.itemAcquiredOrder?.[b] ?? 0;
        if (ob !== oa) return ob - oa;
        return ITEMS[a].name.localeCompare(ITEMS[b].name, 'id');
      }
      if (sortMode === 'NAME') {
        return ITEMS[a].name.localeCompare(ITEMS[b].name, 'id');
      }
      if (sortMode === 'QUANTITY') {
        const qa = player.inventory[a] ?? 0;
        const qb = player.inventory[b] ?? 0;
        if (qb !== qa) return qb - qa;
        return ITEMS[a].name.localeCompare(ITEMS[b].name, 'id');
      }
      // RARITY
      const ra = RARITY_RANK[ITEMS[a].rarity ?? 'COMMON'];
      const rb = RARITY_RANK[ITEMS[b].rarity ?? 'COMMON'];
      if (rb !== ra) return rb - ra;
      const qa = player.inventory[a] ?? 0;
      const qb = player.inventory[b] ?? 0;
      if ((qb > 0 ? 1 : 0) !== (qa > 0 ? 1 : 0)) {
        return qb > 0 ? 1 : -1;
      }
      return ITEMS[a].name.localeCompare(ITEMS[b].name, 'id');
    });
  }, [
    categoryFilter,
    equippedIdToSlot,
    player.inventory,
    player.itemAcquiredOrder,
    searchQuery,
    showUnowned,
    sortMode,
  ]);

  const activeSelectedId: ItemId | null = useMemo(() => {
    if (selectedItemId && bagItems.includes(selectedItemId)) return selectedItemId;
    return bagItems[0] ?? null;
  }, [bagItems, selectedItemId]);

  const selectedDef = activeSelectedId ? ITEMS[activeSelectedId] : null;
  const selectedQty = activeSelectedId ? player.inventory[activeSelectedId] ?? 0 : 0;
  const selectedEquippedSlot = activeSelectedId
    ? equippedIdToSlot.get(activeSelectedId) ?? null
    : null;
  const selectedTargetSlot = selectedDef
    ? normalizeEquipSlot(selectedDef.equipSlot)
    : null;
  const currentlyInTargetSlot =
    selectedTargetSlot && player.equippedSlots?.[selectedTargetSlot]
      ? ITEMS[player.equippedSlots[selectedTargetSlot]!]
      : null;

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => r.category === craftCat);

  const handleSelectBagItem = (id: ItemId) => {
    setSelectedItemId(id);
    if (player.newlyAcquiredItems?.[id]) {
      onInspectItem(id);
    }
  };

  const requestDropItem = (id: ItemId, qtyToDrop: number) => {
    const def = ITEMS[id];
    const rarity = def.rarity ?? 'COMMON';
    const isValuable =
      rarity === 'RARE' ||
      rarity === 'EPIC' ||
      rarity === 'LEGENDARY' ||
      def.category === 'EQUIPMENT' ||
      def.category === 'TOOL';

    if (isValuable) {
      setDropConfirmTarget({ itemId: id, qty: qtyToDrop });
    } else {
      onDropItem(id, qtyToDrop);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/85 flex items-center justify-center p-2 sm:p-4 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
      <div className="w-full max-w-5xl h-[94dvh] bg-[#14171A] border border-[#3A4046] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <header className="px-4 py-2.5 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#F5E6C4] truncate">
              Tas & Peracikan Penyintas
            </h2>

            <div className="flex items-center gap-1.5 bg-[#0D0F10] border border-[#264E63] rounded-lg px-2.5 py-1 text-xs font-mono-num shrink-0">
              <Droplets className="w-4 h-4 text-[#7EC4E0]" />
              <span className="text-[#7EC4E0]">
                Air: {player.waterCharges}/{player.maxWaterCharges}
              </span>
              <button
                type="button"
                disabled={player.waterCharges <= 0}
                onClick={onDrinkContainer}
                className="ml-1.5 min-h-[34px] px-2.5 py-1 rounded bg-[#264E63] hover:bg-[#31647E] disabled:opacity-40 text-[11px] font-semibold text-white cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                Minum
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0D0F10] border border-[#C89B3C]/65 rounded-lg px-2.5 py-1.5 text-xs font-mono-num shrink-0">
              <Coins className="w-4 h-4 text-[#FFD166]" />
              <span className="font-bold text-[#FFD166]">{player.gold ?? 0}</span>
              <span className="text-[#C7C2B6] hidden sm:inline">Emas</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Tas"
            className="min-h-[48px] min-w-[48px] rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Primary Landscape Tabs */}
        <div className="px-4 py-2 bg-[#101315] border-b border-[#252A2E] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('BAG')}
              className={`min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                activeTab === 'BAG'
                  ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                  : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
              }`}
            >
              <Backpack className="w-4 h-4" />
              <span>Tas Barang</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CRAFT')}
              className={`min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                activeTab === 'CRAFT'
                  ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                  : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>Meja Racik (7 Kategori)</span>
            </button>
            {onOpenEquipment && (
              <button
                type="button"
                onClick={onOpenEquipment}
                className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E5B85A] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Slot Perlengkapan</span>
              </button>
            )}
          </div>

          {activeTab === 'BAG' && (
            <button
              type="button"
              onClick={() => setShowUnowned((v) => !v)}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                showUnowned
                  ? 'bg-[#264D34] border-[#8FC79A] text-white'
                  : 'bg-[#1C2024] border-[#3A4046] text-[#9BA3AB]'
              }`}
            >
              {showUnowned ? 'Semua Katalog' : 'Hanya Dimiliki'}
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 sm:p-4 gap-2.5">
          {feedbackMessage && (
            <div className="shrink-0 px-3 py-2 rounded-lg bg-[#17281E] border border-[#C89B3C]/60 text-xs text-[#F5E6C4]">
              {feedbackMessage}
            </div>
          )}

          {activeTab === 'BAG' ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5">
              {/* 8 Category Tabs + Search (with clear X) & Sort Bar */}
              <div className="shrink-0 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {INVENTORY_FILTER_TABS.map((tabItem) => (
                    <button
                      key={tabItem.id}
                      type="button"
                      onClick={() => setCategoryFilter(tabItem.id)}
                      className={`min-h-[42px] px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                        categoryFilter === tabItem.id
                          ? 'bg-[#264D34] border-[#8FC79A] text-[#F5E6C4]'
                          : 'bg-[#0D0F10] border-[#2A3036] text-[#9BA3AB] hover:text-[#F5E6C4]'
                      }`}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-[#8F969E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari item berdasarkan nama atau efek..."
                      className="w-full min-h-[46px] pl-9 pr-10 py-1.5 rounded-lg bg-[#0D0F10] border border-[#2A3036] focus:border-[#C89B3C] text-xs sm:text-sm text-[#F5E6C4] placeholder:text-[#676E75] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Hapus pencarian"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center text-[#9BA3AB] hover:text-[#F5E6C4] hover:bg-[#1C2024] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-[#0D0F10] border border-[#2A3036] rounded-lg px-3 min-h-[46px] text-xs text-[#C7C2B6]">
                    <ArrowUpDown className="w-4 h-4 text-[#E5B85A] shrink-0" />
                    <span>Urut:</span>
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as InventorySortMode)}
                      className="bg-transparent text-[#F5E6C4] font-semibold focus:outline-none cursor-pointer py-1"
                    >
                      <option value="NEWEST" className="bg-[#14171A]">
                        Terbaru
                      </option>
                      <option value="RARITY" className="bg-[#14171A]">
                        Kelangkaan
                      </option>
                      <option value="QUANTITY" className="bg-[#14171A]">
                        Jumlah
                      </option>
                      <option value="NAME" className="bg-[#14171A]">
                        Nama (A-Z)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Split Layout: Enlarged Item Grid (Left) + Item Inspect Panel (Right) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7 overflow-y-auto ember-scroll pr-1">
                  {bagItems.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-2 bg-[#0D0F10] border border-[#252A2E] rounded-lg">
                      <div className="text-sm font-bold text-[#F5E6C4]">
                        Item tidak ditemukan
                      </div>
                      <p className="text-xs text-[#8F969E]">
                        {searchQuery.trim()
                          ? `Tidak ada barang yang cocok dengan pencarian "${searchQuery.trim()}".`
                          : 'Belum ada barang di kategori ini.'}
                      </p>
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="min-h-[42px] px-4 py-1.5 rounded bg-[#1C2024] border border-[#3A4046] text-xs font-semibold text-[#E5B85A] cursor-pointer"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {bagItems.map((id) => {
                        const def = ITEMS[id];
                        const qty = player.inventory[id] ?? 0;
                        const rarity = def.rarity ?? 'COMMON';
                        const rarityColor = LOOT_RARITY_COLORS[rarity];
                        const isNew = Boolean(player.newlyAcquiredItems?.[id]);
                        const isEquipped = equippedIdToSlot.has(id);
                        const isSelected = activeSelectedId === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleSelectBagItem(id)}
                            className={`p-2.5 rounded-lg border-2 text-left flex items-center gap-3 transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#17281E]/85 border-[#E5B85A] shadow-md shadow-[#C89B3C]/15'
                                : qty > 0 || isEquipped
                                ? 'bg-[#0D0F10] border-[#2A3036] hover:border-[#5A626A]'
                                : 'bg-[#0D0F10]/55 border-[#1F2327] opacity-60'
                            }`}
                          >
                            {/* Enlarged 56x56 rarity-tinted slot with 44px illustrated artwork */}
                            <div
                              className="w-14 h-14 shrink-0 rounded-lg border flex items-center justify-center relative"
                              style={{
                                borderColor:
                                  rarity !== 'COMMON' ? `${rarityColor}99` : '#32383F',
                                background:
                                  rarity !== 'COMMON'
                                    ? `radial-gradient(circle at center, ${rarityColor}24, #14171A 78%)`
                                    : '#14171A',
                              }}
                            >
                              <ItemPixelIcon itemId={id} size={44} />
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-[#0D0F10] border border-[#3A4046] text-[10px] font-mono-num font-bold text-[#E5B85A]">
                                {qty}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold truncate"
                                style={{
                                  color: rarity !== 'COMMON' ? rarityColor : '#F5E6C4',
                                }}
                              >
                                {def.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-1">
                                {isNew && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#C89B3C] text-[#0D0F10] font-bold">
                                    Baru
                                  </span>
                                )}
                                {isEquipped && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#264D34] text-[#8FC79A] font-semibold">
                                    Terpasang
                                  </span>
                                )}
                                <span
                                  style={{
                                    color: rarity !== 'COMMON' ? rarityColor : '#8F969E',
                                  }}
                                >
                                  {LOOT_RARITY_LABELS[rarity]}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Item Inspection & Context Actions Panel */}
                <div className="md:col-span-5 bg-[#0D0F10] border border-[#2A3036] rounded-lg p-3.5 flex flex-col justify-between gap-3 overflow-y-auto ember-scroll">
                  {selectedDef && activeSelectedId ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-20 h-20 shrink-0 rounded-lg border-2 flex items-center justify-center"
                            style={{
                              borderColor:
                                (selectedDef.rarity ?? 'COMMON') !== 'COMMON'
                                  ? LOOT_RARITY_COLORS[selectedDef.rarity ?? 'COMMON']
                                  : '#3A4046',
                              background:
                                (selectedDef.rarity ?? 'COMMON') !== 'COMMON'
                                  ? `radial-gradient(circle at center, ${LOOT_RARITY_COLORS[selectedDef.rarity ?? 'COMMON']}25, #14171A 75%)`
                                  : '#14171A',
                            }}
                          >
                            <ItemPixelIcon itemId={activeSelectedId} size={64} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm sm:text-base font-bold"
                              style={{
                                color:
                                  (selectedDef.rarity ?? 'COMMON') !== 'COMMON'
                                    ? LOOT_RARITY_COLORS[selectedDef.rarity ?? 'COMMON']
                                    : '#F5E6C4',
                              }}
                            >
                              {selectedDef.name}
                            </div>
                            <div className="text-xs text-[#9BA3AB] mt-1 flex flex-wrap items-center gap-2">
                              <span>
                                {LOOT_RARITY_LABELS[selectedDef.rarity ?? 'COMMON']}
                              </span>
                              <span>·</span>
                              <span className="font-mono-num text-[#E5B85A] font-semibold">
                                Stok: {selectedQty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#C7C2B6] leading-relaxed">
                          {selectedDef.description}
                        </p>

                        {/* Stat Effects / Comparison */}
                        <div className="p-2.5 rounded-lg bg-[#14171A] border border-[#252A2E] space-y-1.5 text-xs">
                          {selectedDef.category === 'EQUIPMENT' && selectedTargetSlot && (
                            <div className="text-[#E5B85A] font-semibold">
                              Slot: {EQUIPMENT_SLOT_META[selectedTargetSlot].label}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono-num text-[#8FC79A]">
                            {selectedDef.bonusAtk && <span>+{selectedDef.bonusAtk} ATK</span>}
                            {selectedDef.bonusDef && <span>+{selectedDef.bonusDef} DEF</span>}
                            {selectedDef.speedBonus && <span>+{selectedDef.speedBonus} SPD</span>}
                            {selectedDef.critBonus && (
                              <span>+{Math.round(selectedDef.critBonus * 100)}% Kritis</span>
                            )}
                            {selectedDef.bonusManaRegen && (
                              <span>+{selectedDef.bonusManaRegen} Regen MP</span>
                            )}
                            {selectedDef.healHp && <span>+{selectedDef.healHp} HP</span>}
                            {selectedDef.restoreMana && <span>+{selectedDef.restoreMana} MP</span>}
                            {selectedDef.restoreHunger && (
                              <span>+{selectedDef.restoreHunger} Lapar</span>
                            )}
                            {selectedDef.restoreThirst && (
                              <span>+{selectedDef.restoreThirst} Haus</span>
                            )}
                            {selectedDef.restoreStamina && (
                              <span>+{selectedDef.restoreStamina} Stamina</span>
                            )}
                            {selectedDef.coldResist && (
                              <span className="text-[#7EC4E0]">
                                +{selectedDef.coldResist} Tahan Dingin
                              </span>
                            )}
                            {selectedDef.heatResist && (
                              <span className="text-[#FFD166]">
                                +{selectedDef.heatResist} Tahan Panas
                              </span>
                            )}
                            {selectedDef.fireResist && (
                              <span className="text-[#FF8A50]">
                                +{selectedDef.fireResist} Tahan Api
                              </span>
                            )}
                            {selectedDef.poisonResist && (
                              <span className="text-[#81C784]">
                                +{selectedDef.poisonResist} Kebal Racun
                              </span>
                            )}
                            {selectedDef.buffType === 'COLD_RESIST' && (
                              <span className="text-[#7EC4E0]">Kebal Dingin (3 Menit)</span>
                            )}
                            {selectedDef.buffType === 'HEAT_RESIST' && (
                              <span className="text-[#FFD166]">Kebal Panas (3 Menit)</span>
                            )}
                            {selectedDef.buffType === 'FIRE_RESIST' && (
                              <span className="text-[#FF8A50]">Kebal Api (3 Menit)</span>
                            )}
                            {selectedDef.buffType === 'POISON_RESIST' && (
                              <span className="text-[#81C784]">Kebal Racun (3 Menit)</span>
                            )}
                            {selectedDef.isPetFood && (
                              <span className="text-[#FFD166]">Cocok untuk Pakan Pendamping</span>
                            )}
                          </div>

                          {selectedDef.category === 'EQUIPMENT' &&
                            currentlyInTargetSlot &&
                            currentlyInTargetSlot.id !== selectedDef.id && (
                              <div className="pt-1 border-t border-[#252A2E] text-[11px] text-[#9BA3AB]">
                                Saat ini terpasang di slot ini:{' '}
                                <strong className="text-[#F5E6C4]">
                                  {currentlyInTargetSlot.name}
                                </strong>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Context Action Buttons (>= 48px height) */}
                      <div className="pt-2 border-t border-[#252A2E] flex flex-wrap gap-2">
                        {selectedEquippedSlot && (
                          <button
                            type="button"
                            onClick={() => onUnequipSlot(selectedEquippedSlot)}
                            className="flex-1 min-h-[48px] px-3.5 py-2 rounded-lg bg-[#264E63] hover:bg-[#31647E] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                          >
                            Lepas ke Tas
                          </button>
                        )}

                        {selectedDef.usableInExploration && selectedQty > 0 && (
                          <button
                            type="button"
                            onClick={() => onUseItem(activeSelectedId)}
                            className="flex-1 min-h-[48px] px-3.5 py-2 rounded-lg bg-[#264D34] hover:bg-[#326343] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                          >
                            {selectedDef.category === 'EQUIPMENT'
                              ? currentlyInTargetSlot
                                ? 'Ganti Perlengkapan'
                                : 'Pasang'
                              : selectedDef.category === 'TOOL'
                              ? 'Aktifkan Alat'
                              : 'Gunakan'}
                          </button>
                        )}

                        {selectedQty > 0 && (
                          <button
                            type="button"
                            onClick={() => requestDropItem(activeSelectedId, 1)}
                            className="min-h-[48px] px-3.5 py-2 rounded-lg bg-[#2C1618] hover:bg-[#442024] border border-[#9E2A2B] text-[#E5989B] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Buang 1</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#8F969E]">
                      Pilih barang di daftar untuk melihat detail dan tindakannya.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto ember-scroll space-y-3 pr-1">
              {/* 7 Crafting Category Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {CRAFTING_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCraftCat(cat.id)}
                    className={`min-h-[42px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      craftCat === cat.id
                        ? 'bg-[#264D34] border-[#8FC79A] text-[#F5E6C4]'
                        : 'bg-[#0D0F10] border-[#2A3036] text-[#9BA3AB] hover:text-[#F5E6C4]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredRecipes.map((recipe) => {
                  const hasItems = recipe.ingredients.every(
                    (ing) => (player.inventory[ing.itemId] ?? 0) >= ing.quantity
                  );
                  const hasWater =
                    !recipe.waterCost || player.waterCharges >= recipe.waterCost;
                  const canCraft = hasItems && hasWater;

                  return (
                    <div
                      key={recipe.id}
                      className="p-3 rounded-lg bg-[#0D0F10] border border-[#2A3036] flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-[#14171A] border border-[#252A2E] flex items-center justify-center">
                          <ItemPixelIcon itemId={recipe.outputItemId} size={38} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#F5E6C4] truncate">
                              {recipe.label}
                            </span>
                            <span className="text-xs font-mono-num text-[#E5B85A]">
                              +{recipe.outputQuantity}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9BA3AB] mt-0.5 leading-snug">
                            {recipe.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1F2327]">
                        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] font-mono-num">
                          {recipe.ingredients.map((ing) => {
                            const owned = player.inventory[ing.itemId] ?? 0;
                            const ok = owned >= ing.quantity;
                            return (
                              <span
                                key={ing.itemId}
                                className={ok ? 'text-[#8FC79A]' : 'text-[#E5989B]'}
                              >
                                {ITEMS[ing.itemId].name} {owned}/{ing.quantity}
                              </span>
                            );
                          })}
                          {recipe.waterCost && (
                            <span
                              className={hasWater ? 'text-[#7EC4E0]' : 'text-[#E5989B]'}
                            >
                              Air {player.waterCharges}/{recipe.waterCost}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!canCraft}
                          onClick={() => onCraft(recipe.id)}
                          className="min-h-[46px] px-4 py-1.5 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] disabled:bg-[#1C2024] disabled:text-[#5A626A] text-[#0D0F10] text-xs font-bold shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Buat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drop Confirmation Dialog */}
      {dropConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-[#0D0F10]/85 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#14171A] border border-[#9E2A2B] rounded-lg p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center shrink-0">
                <ItemPixelIcon itemId={dropConfirmTarget.itemId} size={38} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5E6C4]">
                  Buang {dropConfirmTarget.qty}x {ITEMS[dropConfirmTarget.itemId].name}?
                </h3>
                <div className="text-[11px] text-[#E5B85A]">
                  Barang berharga / langka akan hilang permanen
                </div>
              </div>
            </div>
            <p className="text-xs text-[#C7C2B6] leading-relaxed">
              Apakah kamu yakin ingin membuang item ini dari tas? Barang yang dibuang tidak dapat diambil kembali.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDropConfirmTarget(null)}
                className="min-h-[46px] px-4 py-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E6E2D8] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDropItem(dropConfirmTarget.itemId, dropConfirmTarget.qty);
                  setDropConfirmTarget(null);
                }}
                className="min-h-[46px] px-4 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#B83335] text-xs font-bold text-white cursor-pointer"
              >
                Ya, Buang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
