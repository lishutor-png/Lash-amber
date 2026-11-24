import React, { useMemo, useState } from 'react';
import { Coins, ShoppingBag, Store, Tag, X } from 'lucide-react';
import { LOOT_RARITY_COLORS, LOOT_RARITY_LABELS } from '../combat/lootSystem';
import { soundEngine } from '../core/audio';
import { ItemId, MerchantEntity, PlayerState, WorldState } from '../core/types';
import { ITEM_ORDER, ITEMS } from '../inventory/items';
import {
  buyFromMerchant,
  getItemSellPrice,
  sellToMerchant,
} from '../merchant/merchantSystem';
import { ItemPixelIcon } from './PixelPortrait';

interface MerchantModalProps {
  player: PlayerState;
  world: WorldState;
  merchant: MerchantEntity;
  onClose: () => void;
  onUpdate: (message?: string) => void;
}

export const MerchantModal: React.FC<MerchantModalProps> = ({
  player,
  world,
  merchant,
  onClose,
  onUpdate,
}) => {
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const sellableItems = useMemo(() => {
    return ITEM_ORDER.filter((id) => (player.inventory[id] ?? 0) > 0);
  }, [player.inventory]);

  const handleBuy = (itemId: ItemId, qty: number) => {
    const res = buyFromMerchant(player, world, merchant, itemId, qty);
    if (res.success) {
      soundEngine.playVictory();
    } else {
      soundEngine.playClick();
    }
    setFeedback({ ok: res.success, text: res.message });
    onUpdate(res.success ? res.message : undefined);
  };

  const handleSell = (itemId: ItemId, qty: number) => {
    const res = sellToMerchant(player, merchant, itemId, qty);
    if (res.success) {
      soundEngine.playGather('MINERAL');
    } else {
      soundEngine.playClick();
    }
    setFeedback({ ok: res.success, text: res.message });
    onUpdate(res.success ? res.message : undefined);
  };

  const renderResistTags = (itemId: ItemId) => {
    const def = ITEMS[itemId];
    const tags: string[] = [];
    if (def.bonusAtk) tags.push(`+${def.bonusAtk} ATK`);
    if (def.bonusDef) tags.push(`+${def.bonusDef} DEF`);
    if (def.healHp) tags.push(`+${def.healHp} HP`);
    if (def.coldResist) tags.push(`Tahan Dingin +${def.coldResist}`);
    if (def.heatResist) tags.push(`Tahan Panas +${def.heatResist}`);
    if (def.fireResist) tags.push(`Tahan Api +${def.fireResist}`);
    if (def.poisonResist) tags.push(`Kebal Racun +${def.poisonResist}`);
    if (def.buffType === 'COLD_RESIST') tags.push('Kebal Dingin 3m');
    if (def.buffType === 'HEAT_RESIST') tags.push('Kebal Panas 3m');
    if (def.buffType === 'FIRE_RESIST') tags.push('Kebal Api 3m');
    if (def.buffType === 'POISON_RESIST') tags.push('Kebal Racun 3m');
    return tags;
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/88 flex items-center justify-center p-2.5 sm:p-4">
      <div className="w-full max-w-4xl max-h-[92dvh] bg-[#14171A] border border-[#C89B3C]/65 rounded shadow-2xl flex flex-col overflow-hidden">
        <header className="px-4 py-2.5 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded bg-[#1C2024] border border-[#C89B3C]/70 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-[#E5B85A]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-bold text-[#F5E6C4] truncate">
                {merchant.name} — {merchant.title}
              </h2>
              <p className="text-[11px] text-[#9BA3AB] truncate">
                “{merchant.greeting}”
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#0D0F10] border border-[#C89B3C]/70 rounded px-3 py-1.5 text-xs font-mono-num">
              <Coins className="w-3.5 h-3.5 text-[#FFD166]" />
              <span className="font-bold text-[#FFD166]">{player.gold ?? 0}</span>
              <span className="text-[#C7C2B6] hidden sm:inline">Koin Emas</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Toko Pedagang"
              className="min-h-[40px] min-w-[40px] rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-4 py-2 bg-[#101315] border-b border-[#252A2E] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab('BUY');
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                tab === 'BUY'
                  ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                  : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Beli Barang ({merchant.stock.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab('SELL');
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                tab === 'SELL'
                  ? 'bg-[#C89B3C] text-[#0D0F10] border-[#F5E6C4]'
                  : 'bg-[#1C2024] text-[#E6E2D8] border-[#3A4046]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Jual dari Tas ({sellableItems.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-[#8F969E] hidden sm:inline">
            Stok pedagang terisi ulang berkala setiap 6 menit waktu dunia
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 gap-2.5 overflow-hidden">
          {feedback && (
            <div
              className={`shrink-0 px-3 py-2 rounded border text-xs ${
                feedback.ok
                  ? 'bg-[#17281E] border-[#8FC79A]/70 text-[#F5E6C4]'
                  : 'bg-[#2C1618] border-[#9E2A2B] text-[#E5989B]'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex-1 overflow-y-auto ember-scroll pr-1">
            {tab === 'BUY' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {merchant.stock.map((entry) => {
                  const def = ITEMS[entry.itemId];
                  const rarity = def.rarity ?? 'COMMON';
                  const rarityColor = LOOT_RARITY_COLORS[rarity];
                  const owned = player.inventory[entry.itemId] ?? 0;
                  const canBuy1 = entry.stock > 0 && (player.gold ?? 0) >= entry.price;
                  const canBuy5 = entry.stock >= 5 && (player.gold ?? 0) >= entry.price * 5;
                  const tags = renderResistTags(entry.itemId);

                  return (
                    <div
                      key={entry.itemId}
                      className="p-3 rounded bg-[#0D0F10] border border-[#2A3036] flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-10 h-10 shrink-0 rounded bg-[#14171A] border flex items-center justify-center"
                          style={{
                            borderColor: rarity !== 'COMMON' ? `${rarityColor}88` : '#252A2E',
                          }}
                        >
                          <ItemPixelIcon itemId={entry.itemId} size={28} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: rarity !== 'COMMON' ? rarityColor : '#F5E6C4' }}
                            >
                              {def.name}
                            </span>
                            <span className="text-[11px] font-mono-num text-[#9BA3AB] shrink-0">
                              Stok: {entry.stock} · Tas: {owned}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9BA3AB] mt-0.5 leading-snug">
                            {def.description}
                          </p>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] font-mono-num text-[#8FC79A]">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-[#14171A] border border-[#252A2E]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1F2327]">
                        <div className="flex items-center gap-1 text-xs font-mono-num font-bold text-[#FFD166]">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{entry.price} Emas</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={!canBuy1}
                            onClick={() => handleBuy(entry.itemId, 1)}
                            className="min-h-[40px] px-3 py-1 rounded bg-[#264D34] hover:bg-[#326343] disabled:bg-[#1C2024] disabled:text-[#5A626A] border border-[#8FC79A]/60 disabled:border-[#2A3036] text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed"
                          >
                            {entry.stock <= 0 ? 'Habis' : 'Beli x1'}
                          </button>
                          {entry.maxStock >= 5 && (
                            <button
                              type="button"
                              disabled={!canBuy5}
                              onClick={() => handleBuy(entry.itemId, 5)}
                              className="min-h-[40px] px-2.5 py-1 rounded bg-[#1C2024] hover:bg-[#2A3036] disabled:opacity-40 border border-[#C89B3C]/60 text-xs font-bold text-[#E5B85A] cursor-pointer disabled:cursor-not-allowed"
                            >
                              x5
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : sellableItems.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-[#8F969E] bg-[#0D0F10] border border-[#252A2E] rounded">
                Tas kamu kosong atau belum ada barang yang dapat dijual.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sellableItems.map((id) => {
                  const def = ITEMS[id];
                  const qty = player.inventory[id] ?? 0;
                  const unitSell = getItemSellPrice(id);
                  const rarity = def.rarity ?? 'COMMON';
                  const rarityColor = LOOT_RARITY_COLORS[rarity];

                  return (
                    <div
                      key={id}
                      className="p-3 rounded bg-[#0D0F10] border border-[#2A3036] flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 shrink-0 rounded bg-[#14171A] border border-[#252A2E] flex items-center justify-center">
                          <ItemPixelIcon itemId={id} size={28} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: rarity !== 'COMMON' ? rarityColor : '#F5E6C4' }}
                            >
                              {def.name}
                            </span>
                            <span className="text-xs font-mono-num text-[#E5B85A] shrink-0">
                              x{qty}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#9BA3AB]">
                            {LOOT_RARITY_LABELS[rarity]} · Harga jual {unitSell} Emas/buah
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1F2327]">
                        <div className="flex items-center gap-1 text-xs font-mono-num font-bold text-[#FFD166]">
                          <Coins className="w-3.5 h-3.5" />
                          <span>+{unitSell}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSell(id, 1)}
                            className="min-h-[40px] px-3 py-1 rounded bg-[#3C3429] hover:bg-[#524637] border border-[#C89B3C]/60 text-xs font-bold text-[#F5E6C4] cursor-pointer"
                          >
                            Jual 1
                          </button>
                          {qty >= 5 && (
                            <button
                              type="button"
                              onClick={() => handleSell(id, 5)}
                              className="min-h-[40px] px-2.5 py-1 rounded bg-[#1C2024] hover:bg-[#2A3036] border border-[#3A4046] text-xs font-bold text-[#E5B85A] cursor-pointer"
                            >
                              x5
                            </button>
                          )}
                          {qty > 1 && (
                            <button
                              type="button"
                              onClick={() => handleSell(id, qty)}
                              className="min-h-[40px] px-2.5 py-1 rounded bg-[#1C2024] hover:bg-[#2A3036] border border-[#3A4046] text-xs font-semibold text-[#C7C2B6] cursor-pointer"
                            >
                              Semua
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
