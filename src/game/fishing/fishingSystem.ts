import { getActiveLuckBonus } from '../companion/companionSystem';
import { ItemId, LootRarity, PlayerState } from '../core/types';
import { ITEMS } from '../inventory/items';

export type WaterSpotType = 'RIVER' | 'POND';

export interface FishCatchResult {
  itemId: ItemId;
  name: string;
  rarity: LootRarity;
  sizeCm: number;
  exp: number;
  isPoisonous: boolean;
}

interface FishPoolEntry {
  itemId: ItemId;
  rarity: LootRarity;
  baseWeight: number;
  minCm: number;
  maxCm: number;
  exp: number;
  riverMult: number;
  pondMult: number;
  nightMult: number;
}

const FISH_LOOT_POOL: FishPoolEntry[] = [
  {
    itemId: 'ikan_kecil',
    rarity: 'COMMON',
    baseWeight: 42,
    minCm: 10,
    maxCm: 18,
    exp: 6,
    riverMult: 1.0,
    pondMult: 1.15,
    nightMult: 0.95,
  },
  {
    itemId: 'ikan_sungai',
    rarity: 'COMMON',
    baseWeight: 32,
    minCm: 20,
    maxCm: 36,
    exp: 10,
    riverMult: 1.45,
    pondMult: 0.75,
    nightMult: 1.0,
  },
  {
    itemId: 'ikan_kolam',
    rarity: 'UNCOMMON',
    baseWeight: 26,
    minCm: 22,
    maxCm: 40,
    exp: 12,
    riverMult: 0.7,
    pondMult: 1.5,
    nightMult: 1.0,
  },
  {
    itemId: 'ikan_beracun',
    rarity: 'UNCOMMON',
    baseWeight: 12,
    minCm: 16,
    maxCm: 28,
    exp: 14,
    riverMult: 0.9,
    pondMult: 1.15,
    nightMult: 1.4,
  },
  {
    itemId: 'ikan_emas',
    rarity: 'RARE',
    baseWeight: 8,
    minCm: 24,
    maxCm: 38,
    exp: 22,
    riverMult: 1.1,
    pondMult: 1.15,
    nightMult: 0.9,
  },
  {
    itemId: 'ikan_mistis',
    rarity: 'EPIC',
    baseWeight: 4,
    minCm: 32,
    maxCm: 54,
    exp: 36,
    riverMult: 1.15,
    pondMult: 1.0,
    nightMult: 1.75,
  },
];

export function rollFishingCatch(
  waterSpot: WaterSpotType,
  usedBait: boolean,
  timePhase: string,
  player: PlayerState
): FishCatchResult {
  const luckBonus = getActiveLuckBonus(player); // <= 0.35
  const skillFactor = 1 + Math.min(0.4, ((player.fishingSkillLevel ?? 1) - 1) * 0.08);
  const isNightOrDusk = timePhase === 'Malam' || timePhase === 'Senja';

  const weighted = FISH_LOOT_POOL.map((entry) => {
    let w = entry.baseWeight;
    w *= waterSpot === 'RIVER' ? entry.riverMult : entry.pondMult;
    if (isNightOrDusk) w *= entry.nightMult;

    if (entry.rarity === 'RARE' || entry.rarity === 'EPIC') {
      w *= (usedBait ? 1.8 : 1.0) * (1 + luckBonus * 1.6) * skillFactor;
    } else if (entry.rarity === 'UNCOMMON') {
      w *= (usedBait ? 1.25 : 1.0) * (1 + luckBonus * 0.7);
    } else if (usedBait) {
      w *= 0.82;
    }
    return { entry, weight: Math.max(0.5, w) };
  });

  const total = weighted.reduce((acc, item) => acc + item.weight, 0);
  let roll = Math.random() * total;
  let chosen = weighted[0].entry;

  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) {
      chosen = w.entry;
      break;
    }
  }

  const sizeCm =
    chosen.minCm + Math.floor(Math.random() * (chosen.maxCm - chosen.minCm + 1));

  return {
    itemId: chosen.itemId,
    name: ITEMS[chosen.itemId].name,
    rarity: chosen.rarity,
    sizeCm,
    exp: chosen.exp,
    isPoisonous: chosen.itemId === 'ikan_beracun',
  };
}
