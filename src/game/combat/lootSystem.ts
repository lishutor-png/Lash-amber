import { getActiveLuckBonus } from '../companion/companionSystem';
import {
  AnimalSpecies,
  EnemyType,
  ItemId,
  LootRarity,
  PlayerState,
} from '../core/types';

export interface LootTableEntry {
  itemId: ItemId;
  minQty: number;
  maxQty: number;
  chance: number; // 0..1
  rarity: LootRarity;
}

export interface RolledLootDrop {
  itemId: ItemId;
  quantity: number;
  rarity: LootRarity;
}

export const LOOT_RARITY_LABELS: Record<LootRarity, string> = {
  COMMON: 'Umum',
  UNCOMMON: 'Tidak Umum',
  RARE: 'Langka',
  EPIC: 'Epik',
  LEGENDARY: 'Legendaris',
};

export const LOOT_RARITY_COLORS: Record<LootRarity, string> = {
  COMMON: '#C4CDD6',
  UNCOMMON: '#8FC79A',
  RARE: '#7EC4E0',
  EPIC: '#B388FF',
  LEGENDARY: '#FFD166',
};

export const ENEMY_LOOT_TABLES: Record<EnemyType, LootTableEntry[]> = {
  FOREST_SKELETON: [
    { itemId: 'tulang', minQty: 1, maxQty: 2, chance: 0.92, rarity: 'COMMON' },
    { itemId: 'pecahan_zirah', minQty: 1, maxQty: 1, chance: 0.42, rarity: 'UNCOMMON' },
    { itemId: 'koin_kuno', minQty: 1, maxQty: 2, chance: 0.36, rarity: 'UNCOMMON' },
    { itemId: 'pedang_karat', minQty: 1, maxQty: 1, chance: 0.14, rarity: 'RARE' },
  ],
  WILD_BOAR: [
    { itemId: 'daging_mentah', minQty: 1, maxQty: 2, chance: 0.95, rarity: 'COMMON' },
    { itemId: 'kulit', minQty: 1, maxQty: 2, chance: 0.68, rarity: 'COMMON' },
    { itemId: 'taring', minQty: 1, maxQty: 1, chance: 0.34, rarity: 'UNCOMMON' },
  ],
  FOREST_WOLF: [
    { itemId: 'daging_mentah', minQty: 1, maxQty: 2, chance: 0.88, rarity: 'COMMON' },
    { itemId: 'kulit_serigala', minQty: 1, maxQty: 1, chance: 0.56, rarity: 'UNCOMMON' },
    { itemId: 'taring', minQty: 1, maxQty: 2, chance: 0.48, rarity: 'UNCOMMON' },
  ],
  SLIME: [
    { itemId: 'lendir_slime', minQty: 1, maxQty: 3, chance: 0.94, rarity: 'COMMON' },
    { itemId: 'herba_obat', minQty: 1, maxQty: 1, chance: 0.3, rarity: 'COMMON' },
    { itemId: 'inti_slime', minQty: 1, maxQty: 1, chance: 0.18, rarity: 'RARE' },
  ],
  GOBLIN: [
    { itemId: 'kain_goblin', minQty: 1, maxQty: 2, chance: 0.85, rarity: 'COMMON' },
    { itemId: 'koin_kuno', minQty: 1, maxQty: 3, chance: 0.52, rarity: 'UNCOMMON' },
    { itemId: 'ramuan_sembuh', minQty: 1, maxQty: 1, chance: 0.28, rarity: 'UNCOMMON' },
    { itemId: 'pedang_karat', minQty: 1, maxQty: 1, chance: 0.16, rarity: 'RARE' },
  ],
  DARK_CREATURE: [
    { itemId: 'tulang', minQty: 1, maxQty: 2, chance: 0.75, rarity: 'COMMON' },
    { itemId: 'esensi_gelap', minQty: 1, maxQty: 1, chance: 0.55, rarity: 'EPIC' },
    { itemId: 'tanaman_langka', minQty: 1, maxQty: 1, chance: 0.32, rarity: 'RARE' },
    { itemId: 'relik_terkutuk', minQty: 1, maxQty: 1, chance: 0.12, rarity: 'LEGENDARY' },
  ],
  SPIRIT_DEER: [
    { itemId: 'tanaman_langka', minQty: 1, maxQty: 1, chance: 0.65, rarity: 'RARE' },
    { itemId: 'herba_obat', minQty: 1, maxQty: 2, chance: 0.85, rarity: 'COMMON' },
  ],
  EMBER_FOX: [
    { itemId: 'kulit', minQty: 1, maxQty: 1, chance: 0.8, rarity: 'COMMON' },
    { itemId: 'daging_mentah', minQty: 1, maxQty: 1, chance: 0.75, rarity: 'COMMON' },
  ],
  TURTLE: [
    { itemId: 'pecahan_zirah', minQty: 1, maxQty: 1, chance: 0.6, rarity: 'UNCOMMON' },
    { itemId: 'daging_mentah', minQty: 1, maxQty: 1, chance: 0.8, rarity: 'COMMON' },
  ],
  DEER: [
    { itemId: 'daging_mentah', minQty: 1, maxQty: 2, chance: 0.95, rarity: 'COMMON' },
    { itemId: 'kulit', minQty: 1, maxQty: 1, chance: 0.75, rarity: 'COMMON' },
  ],
  FROST_GOLEM: [
    { itemId: 'kristal_es', minQty: 1, maxQty: 2, chance: 0.88, rarity: 'RARE' },
    { itemId: 'batu', minQty: 2, maxQty: 4, chance: 0.9, rarity: 'COMMON' },
    { itemId: 'bijih_besi', minQty: 1, maxQty: 2, chance: 0.45, rarity: 'UNCOMMON' },
  ],
  DESERT_SCORPION: [
    { itemId: 'taring_kalajengking', minQty: 1, maxQty: 2, chance: 0.85, rarity: 'UNCOMMON' },
    { itemId: 'kulit', minQty: 1, maxQty: 1, chance: 0.6, rarity: 'COMMON' },
    { itemId: 'penawar_racun', minQty: 1, maxQty: 1, chance: 0.22, rarity: 'RARE' },
  ],
  MAGMA_FIEND: [
    { itemId: 'abu_vulkanik', minQty: 1, maxQty: 3, chance: 0.92, rarity: 'UNCOMMON' },
    { itemId: 'obsidian', minQty: 1, maxQty: 2, chance: 0.62, rarity: 'RARE' },
    { itemId: 'batu_bara', minQty: 1, maxQty: 2, chance: 0.7, rarity: 'COMMON' },
  ],
  SAVANNA_HYENA: [
    { itemId: 'daging_mentah', minQty: 1, maxQty: 2, chance: 0.9, rarity: 'COMMON' },
    { itemId: 'taring', minQty: 1, maxQty: 2, chance: 0.58, rarity: 'UNCOMMON' },
    { itemId: 'kulit', minQty: 1, maxQty: 1, chance: 0.65, rarity: 'COMMON' },
  ],
  UNDEAD_KNIGHT: [
    { itemId: 'pecahan_zirah', minQty: 1, maxQty: 2, chance: 0.85, rarity: 'UNCOMMON' },
    { itemId: 'koin_kuno', minQty: 2, maxQty: 4, chance: 0.72, rarity: 'UNCOMMON' },
    { itemId: 'bijih_besi', minQty: 1, maxQty: 2, chance: 0.55, rarity: 'UNCOMMON' },
    { itemId: 'pedang_karat', minQty: 1, maxQty: 1, chance: 0.28, rarity: 'RARE' },
  ],
  CAVE_TROLL: [
    { itemId: 'batu', minQty: 2, maxQty: 4, chance: 0.95, rarity: 'COMMON' },
    { itemId: 'bijih_besi', minQty: 1, maxQty: 2, chance: 0.65, rarity: 'UNCOMMON' },
    { itemId: 'bijih_emas', minQty: 1, maxQty: 1, chance: 0.32, rarity: 'RARE' },
    { itemId: 'tulang', minQty: 1, maxQty: 3, chance: 0.75, rarity: 'COMMON' },
  ],
  CORRUPTED_STAG: [
    { itemId: 'esensi_gelap', minQty: 1, maxQty: 2, chance: 0.68, rarity: 'EPIC' },
    { itemId: 'tanaman_langka', minQty: 1, maxQty: 1, chance: 0.45, rarity: 'RARE' },
    { itemId: 'kulit', minQty: 1, maxQty: 2, chance: 0.8, rarity: 'COMMON' },
  ],
  DIRE_WOLF: [
    { itemId: 'kulit_serigala', minQty: 1, maxQty: 2, chance: 0.85, rarity: 'UNCOMMON' },
    { itemId: 'taring', minQty: 1, maxQty: 2, chance: 0.75, rarity: 'UNCOMMON' },
    { itemId: 'daging_mentah', minQty: 1, maxQty: 2, chance: 0.9, rarity: 'COMMON' },
  ],
};

export function rollEnemyLoot(enemyType: EnemyType, player: PlayerState): RolledLootDrop[] {
  const table = ENEMY_LOOT_TABLES[enemyType] ?? ENEMY_LOOT_TABLES.FOREST_SKELETON;
  const luckBonus = getActiveLuckBonus(player); // Capped <= 0.35
  const drops: RolledLootDrop[] = [];

  for (const entry of table) {
    const isRareOrHigher = entry.rarity !== 'COMMON';
    const effectiveChance = isRareOrHigher
      ? Math.min(0.88, entry.chance * (1 + luckBonus))
      : entry.chance;

    if (Math.random() <= effectiveChance) {
      const qty =
        entry.minQty +
        Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1));
      drops.push({
        itemId: entry.itemId,
        quantity: qty,
        rarity: entry.rarity,
      });
    }
  }

  // Guarantee at least 1 primary drop so victory always feels fair
  if (drops.length === 0 && table.length > 0) {
    drops.push({
      itemId: table[0].itemId,
      quantity: table[0].minQty,
      rarity: table[0].rarity,
    });
  }

  return drops;
}

export function rollGoldReward(
  enemyType: EnemyType,
  expReward: number,
  isAnimal: boolean,
  player: PlayerState
): number {
  const luckBonus = getActiveLuckBonus(player);
  let baseGold = isAnimal
    ? Math.max(2, Math.round(expReward * 0.25))
    : Math.max(6, Math.round(expReward * 0.45));
  if (enemyType === 'GOBLIN' || enemyType === 'UNDEAD_KNIGHT') baseGold += 8;
  if (enemyType === 'CAVE_TROLL' || enemyType === 'MAGMA_FIEND' || enemyType === 'FROST_GOLEM') {
    baseGold += 14;
  }
  const variance = 0.85 + Math.random() * 0.35;
  return Math.max(2, Math.round(baseGold * variance * (1 + luckBonus * 0.4)));
}

export function rollAnimalHuntLoot(
  species: AnimalSpecies,
  player: PlayerState
): RolledLootDrop[] {
  const luckBonus = getActiveLuckBonus(player);
  const drops: RolledLootDrop[] = [];

  if (species === 'SCORPION') {
    drops.push({ itemId: 'taring_kalajengking', quantity: 1, rarity: 'UNCOMMON' });
    return drops;
  }
  if (species === 'FIRE_BEAST') {
    drops.push({ itemId: 'abu_vulkanik', quantity: 2, rarity: 'UNCOMMON' });
    drops.push({ itemId: 'daging_mentah', quantity: 1, rarity: 'COMMON' });
    return drops;
  }

  drops.push({
    itemId: 'daging_mentah',
    quantity: species === 'DEER' || species === 'BOAR' || species === 'GAZELLE' ? 2 : 1,
    rarity: 'COMMON',
  });

  if (
    species === 'DEER' ||
    species === 'RABBIT' ||
    species === 'GAZELLE' ||
    species === 'MOUNTAIN_GOAT'
  ) {
    drops.push({ itemId: 'kulit', quantity: 1, rarity: 'COMMON' });
  }
  if (species === 'SNOW_WOLF' || species === 'DIRE_WOLF' || species === 'WOLF') {
    drops.push({ itemId: 'kulit_serigala', quantity: 1, rarity: 'UNCOMMON' });
  }
  if (species === 'BIRD' || species === 'EAGLE') {
    drops.push({
      itemId: 'bulu',
      quantity: Math.random() < 0.35 + luckBonus * 0.5 ? 2 : 1,
      rarity: 'COMMON',
    });
  }
  return drops;
}
