import {
  ItemId,
  MerchantEntity,
  MerchantRoleKind,
  MerchantStockEntry,
  PlayerState,
  SettlementKind,
  WorldState,
} from '../core/types';
import { getItemBasePrice, ITEMS } from '../inventory/items';
import { grantInventoryItem } from '../survival/survivalSystem';

export const MERCHANT_RESTOCK_INTERVAL_SECONDS = 360;

interface MerchantTemplate {
  kind: MerchantRoleKind;
  name: string;
  title: string;
  greeting: string;
  offsetTileX: number;
  offsetTileY: number;
  catalog: { itemId: ItemId; stock: number; priceMult?: number }[];
}

const TEMPLATES: Record<MerchantRoleKind, MerchantTemplate> = {
  TRADING_OUTPOST: {
    kind: 'TRADING_OUTPOST',
    name: 'Aldo si Pedagang Kelana',
    title: 'Pos Dagang Lembah',
    greeting:
      'Selamat datang di Pos Dagang! Aku menyediakan perbekalan, obor, dan pakaian pengembara.',
    offsetTileX: 20,
    offsetTileY: 13,
    catalog: [
      { itemId: 'ramuan_sembuh', stock: 5 },
      { itemId: 'ramuan_pendingin', stock: 3 },
      { itemId: 'ramuan_hangat', stock: 3 },
      { itemId: 'obor', stock: 5 },
      { itemId: 'daging_masak', stock: 4 },
      { itemId: 'umpan_pancing', stock: 8 },
      { itemId: 'pakaian_gurun', stock: 1 },
      { itemId: 'sepatu_pasir', stock: 1 },
      { itemId: 'kapak_batu', stock: 1 },
      { itemId: 'beliung_batu', stock: 1 },
    ],
  },
  MERCHANT_VILLAGE: {
    kind: 'MERCHANT_VILLAGE',
    name: 'Nadia Pemilik Pasar Tua',
    title: 'Pedagang Desa',
    greeting:
      'Alun-alun ini masih aman dari kegelapan. Tukarkan hasil buruanmu atau lengkapi perbekalanmu.',
    offsetTileX: 18,
    offsetTileY: 14,
    catalog: [
      { itemId: 'sup_ikan', stock: 4 },
      { itemId: 'ramuan_sembuh', stock: 6 },
      { itemId: 'ramuan_pulih', stock: 4 },
      { itemId: 'ramuan_hangat', stock: 3 },
      { itemId: 'jubah_bulu', stock: 1 },
      { itemId: 'sepatu_hangat', stock: 1 },
      { itemId: 'helm_kulit', stock: 1 },
      { itemId: 'pancing_dasar', stock: 1 },
    ],
  },
  BLACKSMITH: {
    kind: 'BLACKSMITH',
    name: 'Pandai Besi Darma',
    title: 'Pandai Besi',
    greeting:
      'Api tungku tidak pernah padam di sini. Bilah baja dan zirah besi siap melindungimu.',
    offsetTileX: 22,
    offsetTileY: 14,
    catalog: [
      { itemId: 'senjata_tempa', stock: 1 },
      { itemId: 'perisai_besi', stock: 1 },
      { itemId: 'helm_besi', stock: 1 },
      { itemId: 'sarung_besi', stock: 1 },
      { itemId: 'sepatu_besi', stock: 1 },
      { itemId: 'zirah_kulit', stock: 1 },
      { itemId: 'bijih_besi', stock: 6 },
    ],
  },
  ALCHEMIST: {
    kind: 'ALCHEMIST',
    name: 'Alkemis Rimba Sari',
    title: 'Alkemis',
    greeting:
      'Spora beracun Rimba Dalam berbahaya. Bawalah penawar racun dan topeng filter sebelum melangkah jauh.',
    offsetTileX: 20,
    offsetTileY: 14,
    catalog: [
      { itemId: 'penawar_racun', stock: 6 },
      { itemId: 'ramuan_pulih', stock: 5 },
      { itemId: 'ramuan_bara', stock: 4 },
      { itemId: 'ramuan_racun', stock: 4 },
      { itemId: 'topeng_racun', stock: 1 },
      { itemId: 'jubah_penangkal', stock: 1 },
      { itemId: 'tanaman_langka', stock: 3 },
    ],
  },
  RARE_TRADER: {
    kind: 'RARE_TRADER',
    name: 'Karavan Zafir',
    title: 'Pedagang Langka',
    greeting:
      'Hanya pengembara tangguh yang mencapai oasis ini. Kuat menahan panas, atau ingin perlengkapan vulkanik?',
    offsetTileX: 20,
    offsetTileY: 13,
    catalog: [
      { itemId: 'ramuan_pendingin', stock: 5 },
      { itemId: 'ramuan_tahan_api', stock: 4 },
      { itemId: 'pakaian_gurun', stock: 2 },
      { itemId: 'sepatu_pasir', stock: 2 },
      { itemId: 'zirah_tahan_api', stock: 1 },
      { itemId: 'sepatu_vulkanik', stock: 1 },
      { itemId: 'jimat_pelindung', stock: 1 },
      { itemId: 'obsidian', stock: 4 },
      { itemId: 'kristal_es', stock: 4 },
    ],
  },
};

function createStockList(template: MerchantTemplate): MerchantStockEntry[] {
  return template.catalog.map((c) => {
    const base = getItemBasePrice(c.itemId);
    const price = Math.max(4, Math.round(base * (c.priceMult ?? 1)));
    return {
      itemId: c.itemId,
      price,
      stock: c.stock,
      maxStock: c.stock,
    };
  });
}

export function buildRegionMerchants(
  regionKey: string,
  settlementKind: SettlementKind,
  currentGameSeconds: number,
  tileSize = 32
): MerchantEntity[] {
  const roles: MerchantRoleKind[] = [];
  if (settlementKind === 'TRADING_OUTPOST') roles.push('TRADING_OUTPOST');
  else if (settlementKind === 'MERCHANT_VILLAGE') {
    roles.push('MERCHANT_VILLAGE', 'BLACKSMITH');
  } else if (settlementKind === 'BLACKSMITH') roles.push('BLACKSMITH');
  else if (settlementKind === 'ALCHEMIST') roles.push('ALCHEMIST');
  else if (settlementKind === 'RARE_TRADER') roles.push('RARE_TRADER');

  return roles.map((role) => {
    const tpl = TEMPLATES[role];
    return {
      id: `merch_${regionKey}_${role}`,
      kind: role,
      name: tpl.name,
      title: tpl.title,
      greeting: tpl.greeting,
      x: tpl.offsetTileX * tileSize + tileSize / 2,
      y: tpl.offsetTileY * tileSize + tileSize / 2,
      regionKey,
      stock: createStockList(tpl),
      lastRestockedAtGameSeconds: currentGameSeconds,
      goldReserve: 9999,
    };
  });
}

export function syncMerchantsWithWorld(
  world: WorldState,
  regionKey: string,
  generated: MerchantEntity[]
): MerchantEntity[] {
  if (!world.merchantsByRegion) world.merchantsByRegion = {};
  const stored = world.merchantsByRegion[regionKey];
  if (!stored || stored.length === 0) {
    world.merchantsByRegion[regionKey] = generated.map((m) => ({
      ...m,
      stock: m.stock.map((s) => ({ ...s })),
    }));
    return generated;
  }

  // Hydrate and check restock timer deterministically against gameTimeSeconds
  const hydrated = stored.map((m) => {
    const template = TEMPLATES[m.kind];
    let stock = Array.isArray(m.stock) ? m.stock.map((s) => ({ ...s })) : createStockList(template);
    let lastRestock = typeof m.lastRestockedAtGameSeconds === 'number' ? m.lastRestockedAtGameSeconds : 0;

    if (world.gameTimeSeconds - lastRestock >= MERCHANT_RESTOCK_INTERVAL_SECONDS) {
      stock = createStockList(template);
      lastRestock = world.gameTimeSeconds;
    }

    return {
      ...m,
      stock,
      lastRestockedAtGameSeconds: lastRestock,
    };
  });

  world.merchantsByRegion[regionKey] = hydrated.map((m) => ({
    ...m,
    stock: m.stock.map((s) => ({ ...s })),
  }));
  return hydrated;
}

export function getItemBuyPrice(itemId: ItemId, merchant?: MerchantEntity): number {
  const entry = merchant?.stock.find((s) => s.itemId === itemId);
  if (entry) return entry.price;
  return getItemBasePrice(itemId);
}

/**
 * Sell price is strictly <= 45% of base price (min 1) so buy->sell loops cannot generate infinite gold.
 */
export function getItemSellPrice(itemId: ItemId): number {
  const base = getItemBasePrice(itemId);
  return Math.max(1, Math.floor(base * 0.45));
}

export function buyFromMerchant(
  player: PlayerState,
  world: WorldState,
  merchant: MerchantEntity,
  itemId: ItemId,
  quantity = 1
): { success: boolean; message: string } {
  const entry = merchant.stock.find((s) => s.itemId === itemId);
  if (!entry || entry.stock <= 0) {
    return { success: false, message: 'Stok barang habis. Tunggu pengisian ulang.' };
  }
  const qty = Math.min(quantity, entry.stock);
  const totalCost = entry.price * qty;
  if ((player.gold ?? 0) < totalCost) {
    return {
      success: false,
      message: `Koin Emas tidak cukup (Butuh ${totalCost} Emas).`,
    };
  }

  player.gold -= totalCost;
  entry.stock -= qty;
  grantInventoryItem(player, itemId, qty);

  if (itemId === 'kapak_batu') player.hasAxe = true;
  if (itemId === 'beliung_batu') player.hasPickaxe = true;
  if (itemId === 'pancing_dasar') player.hasFishingRod = true;

  if (!world.merchantsByRegion) world.merchantsByRegion = {};
  world.merchantsByRegion[merchant.regionKey] = (world.merchantsByRegion[merchant.regionKey] ?? []).map(
    (m) => (m.id === merchant.id ? { ...merchant, stock: merchant.stock.map((s) => ({ ...s })) } : m)
  );

  return {
    success: true,
    message: `Membeli ${qty}x ${ITEMS[itemId].name} seharga ${totalCost} Koin Emas.`,
  };
}

export function sellToMerchant(
  player: PlayerState,
  merchant: MerchantEntity,
  itemId: ItemId,
  quantity = 1
): { success: boolean; message: string } {
  const owned = player.inventory[itemId] ?? 0;
  if (owned <= 0) {
    return { success: false, message: 'Barang tidak ada di tas.' };
  }
  const qty = Math.min(owned, Math.max(1, quantity));
  const unitSell = getItemSellPrice(itemId);
  const totalGain = unitSell * qty;

  player.inventory[itemId] = owned - qty;
  player.gold = (player.gold ?? 0) + totalGain;

  return {
    success: true,
    message: `Menjual ${qty}x ${ITEMS[itemId].name} seharga +${totalGain} Koin Emas.`,
  };
}
