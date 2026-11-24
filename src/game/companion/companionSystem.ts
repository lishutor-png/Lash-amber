import {
  AnimalSpecies,
  CompanionDiet,
  CompanionRarity,
  CompanionRole,
  CompanionState,
  ItemId,
  PlayerState,
} from '../core/types';
import { ITEMS } from '../inventory/items';

export interface CompanionSpeciesConfig {
  species: AnimalSpecies;
  displayName: string;
  tameEligible: boolean;
  role: CompanionRole;
  rarity: CompanionRarity;
  diet: CompanionDiet;
  foodPreferences: ItemId[];
  baseHp: number;
  baseAttack: number;
  defenseBonus: number;
  healPower: number;
  luckBonus: number;
  abilityName: string;
  abilityDescription: string;
}

export const ROLE_META: Record<
  CompanionRole,
  { label: string; color: string; shortDesc: string }
> = {
  ATTACKER: {
    label: 'Penyerang',
    color: '#E5534B',
    shortDesc: 'Menyerang musuh otomatis di pertarungan.',
  },
  HEALER: {
    label: 'Penyembuh',
    color: '#8FC79A',
    shortDesc: 'Memulihkan HP pemain secara berkala tanpa menyerang.',
  },
  LUCK_SUPPORT: {
    label: 'Pembawa Tuah',
    color: '#FFD166',
    shortDesc: 'Meningkatkan peluang rampasan, sumber daya, & ikan langka.',
  },
  DEFENDER: {
    label: 'Pelindung',
    color: '#7EC4E0',
    shortDesc: 'Memberi perisai penahan damage di pertarungan.',
  },
};

export const COMPANION_RARITY_LABELS: Record<CompanionRarity, string> = {
  COMMON: 'Umum',
  UNCOMMON: 'Tidak Umum',
  RARE: 'Langka',
  EPIC: 'Epik',
};

export const DIET_LABELS: Record<CompanionDiet, string> = {
  CARNIVORE: 'Karnivora (Daging & Ikan)',
  HERBIVORE: 'Herbivora (Tanaman, Beri, Sayur)',
  OMNIVORE: 'Omnivora (Daging, Ikan, Beri, Jamur)',
};

export const COMPANION_SPECIES_CONFIG: Record<AnimalSpecies, CompanionSpeciesConfig> = {
  WOLF: {
    species: 'WOLF',
    displayName: 'Serigala Rimba',
    tameEligible: true,
    role: 'ATTACKER',
    rarity: 'UNCOMMON',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_masak', 'daging_mentah', 'ikan_panggang', 'ikan_sungai'],
    baseHp: 46,
    baseAttack: 9,
    defenseBonus: 1,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Taring Rimba',
    abilityDescription: 'Menyerang musuh di setiap seranganmu dengan taring tajam.',
  },
  SPIRIT_DEER: {
    species: 'SPIRIT_DEER',
    displayName: 'Rusa Roh',
    tameEligible: true,
    role: 'HEALER',
    rarity: 'RARE',
    diet: 'HERBIVORE',
    foodPreferences: ['tanaman_langka', 'herba_obat', 'beri', 'sayur_liar'],
    baseHp: 52,
    baseAttack: 0,
    defenseBonus: 2,
    healPower: 14,
    luckBonus: 0,
    abilityName: 'Embun Penyembuh',
    abilityDescription: 'Memulihkan +14 HP pemain setiap 2 giliran tanpa menyerang musuh.',
  },
  EMBER_FOX: {
    species: 'EMBER_FOX',
    displayName: 'Rubah Bara',
    tameEligible: true,
    role: 'LUCK_SUPPORT',
    rarity: 'RARE',
    diet: 'OMNIVORE',
    foodPreferences: ['ikan_emas', 'ikan_panggang', 'daging_masak', 'beri'],
    baseHp: 40,
    baseAttack: 0,
    defenseBonus: 1,
    healPower: 0,
    luckBonus: 0.25,
    abilityName: 'Tuah Bara',
    abilityDescription: 'Meningkatkan peluang rampasan langka, sumber daya khusus, & ikan langka (+25%).',
  },
  TURTLE: {
    species: 'TURTLE',
    displayName: 'Kura-Kura Batu',
    tameEligible: true,
    role: 'DEFENDER',
    rarity: 'UNCOMMON',
    diet: 'HERBIVORE',
    foodPreferences: ['sayur_liar', 'rumput_liar', 'ikan_kecil', 'herba_obat'],
    baseHp: 64,
    baseAttack: 0,
    defenseBonus: 5,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Tempurung Pelindung',
    abilityDescription: 'Mengaktifkan perisai pelindung (-30% damage masuk) setiap 2 giliran.',
  },
  BOAR: {
    species: 'BOAR',
    displayName: 'Babi Hutan',
    tameEligible: true,
    role: 'ATTACKER',
    rarity: 'COMMON',
    diet: 'OMNIVORE',
    foodPreferences: ['jamur', 'sayur_liar', 'daging_mentah', 'beri'],
    baseHp: 50,
    baseAttack: 8,
    defenseBonus: 2,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Serudukan Liar',
    abilityDescription: 'Membantu menyeruduk musuh saat kamu menyerang.',
  },
  DEER: {
    species: 'DEER',
    displayName: 'Rusa Hutan',
    tameEligible: true,
    role: 'HEALER',
    rarity: 'COMMON',
    diet: 'HERBIVORE',
    foodPreferences: ['herba_obat', 'beri', 'sayur_liar', 'rumput_liar'],
    baseHp: 38,
    baseAttack: 0,
    defenseBonus: 1,
    healPower: 9,
    luckBonus: 0,
    abilityName: 'Napas Rimba',
    abilityDescription: 'Memulihkan +9 HP pemain setiap 2 giliran di pertarungan.',
  },
  RABBIT: {
    species: 'RABBIT',
    displayName: 'Kelinci Hutan',
    tameEligible: false,
    role: 'LUCK_SUPPORT',
    rarity: 'COMMON',
    diet: 'HERBIVORE',
    foodPreferences: ['sayur_liar', 'rumput_liar'],
    baseHp: 14,
    baseAttack: 0,
    defenseBonus: 0,
    healPower: 0,
    luckBonus: 0.1,
    abilityName: 'Langkah Ringan',
    abilityDescription: 'Satwa liar kecil yang lincah.',
  },
  BIRD: {
    species: 'BIRD',
    displayName: 'Burung Rimba',
    tameEligible: false,
    role: 'LUCK_SUPPORT',
    rarity: 'COMMON',
    diet: 'OMNIVORE',
    foodPreferences: ['beri', 'benih'],
    baseHp: 12,
    baseAttack: 0,
    defenseBonus: 0,
    healPower: 0,
    luckBonus: 0.1,
    abilityName: 'Pengintai',
    abilityDescription: 'Satwa liar bersayap.',
  },
  GAZELLE: {
    species: 'GAZELLE',
    displayName: 'Gazel Sabana',
    tameEligible: true,
    role: 'HEALER',
    rarity: 'COMMON',
    diet: 'HERBIVORE',
    foodPreferences: ['rumput_liar', 'sayur_liar', 'beri', 'herba_obat'],
    baseHp: 40,
    baseAttack: 0,
    defenseBonus: 1,
    healPower: 10,
    luckBonus: 0,
    abilityName: 'Angin Padang',
    abilityDescription: 'Memulihkan +10 HP & menenangkan penyintas di tengah sabana.',
  },
  HYENA: {
    species: 'HYENA',
    displayName: 'Hyena Sabana',
    tameEligible: false,
    role: 'ATTACKER',
    rarity: 'UNCOMMON',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_mentah', 'taring'],
    baseHp: 48,
    baseAttack: 10,
    defenseBonus: 1,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Rahang Sabana',
    abilityDescription: 'Pemburu berkelompok sabana yang agresif.',
  },
  SNOW_WOLF: {
    species: 'SNOW_WOLF',
    displayName: 'Serigala Salju',
    tameEligible: true,
    role: 'ATTACKER',
    rarity: 'RARE',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_masak', 'daging_mentah', 'ikan_panggang'],
    baseHp: 56,
    baseAttack: 12,
    defenseBonus: 2,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Taring Beku',
    abilityDescription: 'Menyerang dengan kekuatan puncak pegunungan es.',
  },
  ARCTIC_FOX: {
    species: 'ARCTIC_FOX',
    displayName: 'Rubah Salju',
    tameEligible: true,
    role: 'LUCK_SUPPORT',
    rarity: 'RARE',
    diet: 'OMNIVORE',
    foodPreferences: ['ikan_emas', 'ikan_sungai', 'beri', 'daging_mentah'],
    baseHp: 42,
    baseAttack: 0,
    defenseBonus: 2,
    healPower: 0,
    luckBonus: 0.28,
    abilityName: 'Kilau Salju',
    abilityDescription: 'Meningkatkan peluang rampasan & barang langka (+28%).',
  },
  MOUNTAIN_GOAT: {
    species: 'MOUNTAIN_GOAT',
    displayName: 'Kambing Tebing',
    tameEligible: true,
    role: 'DEFENDER',
    rarity: 'UNCOMMON',
    diet: 'HERBIVORE',
    foodPreferences: ['herba_obat', 'rumput_liar', 'sayur_liar'],
    baseHp: 62,
    baseAttack: 0,
    defenseBonus: 5,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Tanduk Karang',
    abilityDescription: 'Menahan serangan musuh di medan terjal.',
  },
  DIRE_WOLF: {
    species: 'DIRE_WOLF',
    displayName: 'Serigala Purba',
    tameEligible: false,
    role: 'ATTACKER',
    rarity: 'EPIC',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_masak', 'daging_mentah'],
    baseHp: 66,
    baseAttack: 14,
    defenseBonus: 3,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Cakar Rimba Dalam',
    abilityDescription: 'Predator malam buas penghuni Rimba Dalam.',
  },
  DESERT_FOX: {
    species: 'DESERT_FOX',
    displayName: 'Rubah Pasir',
    tameEligible: true,
    role: 'LUCK_SUPPORT',
    rarity: 'UNCOMMON',
    diet: 'OMNIVORE',
    foodPreferences: ['ikan_kecil', 'daging_mentah', 'beri'],
    baseHp: 38,
    baseAttack: 0,
    defenseBonus: 1,
    healPower: 0,
    luckBonus: 0.22,
    abilityName: 'Jejak Karavan',
    abilityDescription: 'Penciuman tajam penemu barang berharga di padang pasir.',
  },
  SCORPION: {
    species: 'SCORPION',
    displayName: 'Kalajengking Gurun',
    tameEligible: false,
    role: 'ATTACKER',
    rarity: 'UNCOMMON',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_mentah'],
    baseHp: 44,
    baseAttack: 11,
    defenseBonus: 3,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Sengat Pasir',
    abilityDescription: 'Satwa gurun berbisa dengan cangkang keras.',
  },
  FIRE_BEAST: {
    species: 'FIRE_BEAST',
    displayName: 'Rubah Magma',
    tameEligible: true,
    role: 'ATTACKER',
    rarity: 'EPIC',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_masak', 'abu_vulkanik', 'ikan_emas'],
    baseHp: 60,
    baseAttack: 13,
    defenseBonus: 3,
    healPower: 0,
    luckBonus: 0,
    abilityName: 'Cakar Bara',
    abilityDescription: 'Pendamping vulkanik bertenaga panas bumi.',
  },
  EAGLE: {
    species: 'EAGLE',
    displayName: 'Elang Pegunungan',
    tameEligible: false,
    role: 'LUCK_SUPPORT',
    rarity: 'RARE',
    diet: 'CARNIVORE',
    foodPreferences: ['daging_mentah', 'ikan_sungai'],
    baseHp: 32,
    baseAttack: 7,
    defenseBonus: 1,
    healPower: 0,
    luckBonus: 0.2,
    abilityName: 'Mata Langit',
    abilityDescription: 'Burung pemangsa penjaga tebing pegunungan.',
  },
};

const CARNIVORE_FOODS = new Set<ItemId>([
  'daging_mentah',
  'daging_masak',
  'ikan_kecil',
  'ikan_sungai',
  'ikan_kolam',
  'ikan_emas',
  'ikan_mistis',
  'ikan_panggang',
]);

const HERBIVORE_FOODS = new Set<ItemId>([
  'rumput_liar',
  'herba_obat',
  'sayur_liar',
  'beri',
  'jamur',
  'tanaman_langka',
  'hidangan_beri',
]);

export function classifyFoodForDiet(
  species: AnimalSpecies,
  foodId: ItemId
): 'PREFERRED' | 'MATCH' | 'DISLIKED' {
  const cfg = COMPANION_SPECIES_CONFIG[species];
  if (cfg.foodPreferences.includes(foodId)) {
    return 'PREFERRED';
  }
  if (cfg.diet === 'CARNIVORE') {
    return CARNIVORE_FOODS.has(foodId) ? 'MATCH' : 'DISLIKED';
  }
  if (cfg.diet === 'HERBIVORE') {
    return HERBIVORE_FOODS.has(foodId) ? 'MATCH' : 'DISLIKED';
  }
  return CARNIVORE_FOODS.has(foodId) || HERBIVORE_FOODS.has(foodId) ? 'MATCH' : 'DISLIKED';
}

export function getPetFoodItemsOwned(player: PlayerState): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter(
    (id) => ITEMS[id].isPetFood && (player.inventory[id] ?? 0) > 0
  );
}

export function calculateTameProbability(
  species: AnimalSpecies,
  hpRatio: number,
  foodId: ItemId,
  player: PlayerState
): {
  chance: number;
  dietMatch: 'PREFERRED' | 'MATCH' | 'DISLIKED';
  isPreferred: boolean;
} {
  const cfg = COMPANION_SPECIES_CONFIG[species];
  const dietMatch = classifyFoodForDiet(species, foodId);
  const foodQuality = ITEMS[foodId]?.foodQuality ?? 1;

  // Base chance scales stronger as HP gets closer to 1%
  let chance = 34 + Math.max(0, (0.45 - hpRatio) * 65);

  if (dietMatch === 'PREFERRED') {
    chance += 26;
  } else if (dietMatch === 'MATCH') {
    chance += 10;
  } else {
    chance -= 20;
  }

  chance += (foodQuality - 1) * 5;

  if (cfg.rarity === 'UNCOMMON') chance -= 6;
  else if (cfg.rarity === 'RARE') chance -= 14;
  else if (cfg.rarity === 'EPIC') chance -= 22;

  chance += Math.min(18, Math.max(0, (player.tamingSkillLevel ?? 1) - 1) * 4);
  if (player.classId === 'shaman') chance += 8;

  const clamped = Math.max(5, Math.min(92, Math.round(chance)));
  return {
    chance: clamped,
    dietMatch,
    isPreferred: dietMatch === 'PREFERRED',
  };
}

export function createCompanionFromSpecies(
  id: string,
  species: AnimalSpecies,
  x: number,
  y: number,
  facing: CompanionState['facing'],
  playerLevel: number,
  active: boolean
): CompanionState {
  const cfg = COMPANION_SPECIES_CONFIG[species];
  const lvl = Math.max(1, playerLevel);
  const scaleBonus = Math.max(0, lvl - 1);

  return {
    id,
    species,
    name: cfg.displayName,
    role: cfg.role,
    rarity: cfg.rarity,
    diet: cfg.diet,
    foodPreferences: [...cfg.foodPreferences],
    level: lvl,
    exp: 0,
    expToNext: 45 + lvl * 20,
    hp: cfg.baseHp + scaleBonus * 6,
    maxHp: cfg.baseHp + scaleBonus * 6,
    attack: cfg.baseAttack > 0 ? cfg.baseAttack + scaleBonus * 2 : 0,
    defenseBonus: cfg.defenseBonus + Math.floor(scaleBonus * 0.5),
    healPower: cfg.healPower > 0 ? cfg.healPower + scaleBonus * 2 : 0,
    luckBonus: cfg.luckBonus,
    abilityName: cfg.abilityName,
    abilityDescription: cfg.abilityDescription,
    tamedAt: Date.now(),
    status: active ? 'ACTIVE' : 'STORED',
    active,
    x,
    y,
    facing,
  };
}

export function activateCompanion(player: PlayerState, companionId: string): boolean {
  const target = player.companions.find((c) => c.id === companionId);
  if (!target) return false;

  for (const c of player.companions) {
    if (c.id === companionId) {
      c.active = true;
      c.status = 'ACTIVE';
      c.x = player.x - 24;
      c.y = player.y + 10;
      c.facing = player.facing;
    } else {
      c.active = false;
      c.status = 'STORED';
    }
  }
  player.companion = target;
  return true;
}

export function deactivateCompanion(player: PlayerState, companionId: string) {
  for (const c of player.companions) {
    if (c.id === companionId) {
      c.active = false;
      c.status = 'STORED';
    }
  }
  if (player.companion?.id === companionId) {
    player.companion = null;
  }
}

export function grantCompanionExp(player: PlayerState, expAmount: number): boolean {
  const comp = player.companion;
  if (!comp || !comp.active) return false;
  comp.exp = (comp.exp ?? 0) + expAmount;
  let leveled = false;
  while (comp.exp >= (comp.expToNext || 60)) {
    comp.exp -= comp.expToNext || 60;
    comp.level += 1;
    comp.expToNext = Math.round((comp.expToNext || 60) * 1.4);
    comp.maxHp += 6;
    comp.hp = comp.maxHp;
    if (comp.attack > 0) comp.attack += 2;
    if (comp.healPower > 0) comp.healPower += 2;
    if (comp.defenseBonus > 0) comp.defenseBonus += 1;
    leveled = true;
  }
  // Keep collection entry synchronized
  const entry = player.companions.find((c) => c.id === comp.id);
  if (entry && entry !== comp) {
    Object.assign(entry, comp);
  }
  return leveled;
}

export function getActiveLuckBonus(player: PlayerState): number {
  const comp = player.companion;
  if (!comp || !comp.active || comp.role !== 'LUCK_SUPPORT') return 0;
  return Math.min(0.35, comp.luckBonus ?? 0.25);
}

export interface CompanionActionDef {
  id: string;
  name: string;
  description: string;
  effectLabel: string;
  cooldownTurns: number;
  kind: 'ATTACK' | 'HEAL' | 'LUCK' | 'DEFEND';
}

export function getCompanionActions(companion: CompanionState): CompanionActionDef[] {
  const atkBase = Math.max(6, companion.attack || 8);
  const healBase = Math.max(8, companion.healPower || 12);

  if (companion.role === 'ATTACKER') {
    if (companion.species === 'BOAR') {
      return [
        {
          id: 'boar_charge',
          name: 'Serudukan Liar',
          description: 'Menyeruduk musuh dengan taring keras.',
          effectLabel: `~${atkBase} DMG`,
          cooldownTurns: 0,
          kind: 'ATTACK',
        },
        {
          id: 'boar_heavy',
          name: 'Tumbukan Ganas',
          description: 'Hantaman berat dengan peluang mengguncang musuh.',
          effectLabel: `~${Math.round(atkBase * 1.45)} DMG · Guncang`,
          cooldownTurns: 2,
          kind: 'ATTACK',
        },
        {
          id: 'comp_guard',
          name: 'Siaga Bertahan',
          description: 'Pendamping menahan serangan untukmu (-35% dmg masuk).',
          effectLabel: 'Perisai 1g',
          cooldownTurns: 2,
          kind: 'DEFEND',
        },
      ];
    }

    // Default Attacker (Wolf / other attackers)
    return [
      {
        id: 'wolf_bite',
        name: 'Gigitan Cepat',
        description: 'Menerkam musuh dengan taring cepat.',
        effectLabel: `~${atkBase} DMG`,
        cooldownTurns: 0,
        kind: 'ATTACK',
      },
      {
        id: 'wolf_savage',
        name: 'Gigitan Ganas',
        description: 'Serangan bertenaga + efek racun/luka selama 2 giliran.',
        effectLabel: `~${Math.round(atkBase * 1.5)} DMG + Luka`,
        cooldownTurns: 2,
        kind: 'ATTACK',
      },
      {
        id: 'wolf_howl',
        name: 'Lolongan Rimba',
        description: 'Membangkitkan semangat tempur pemain (+25% ATK & +12% Kritis, 2 giliran).',
        effectLabel: 'Buff ATK/Kritis',
        cooldownTurns: 3,
        kind: 'ATTACK',
      },
      {
        id: 'comp_guard',
        name: 'Jaga Diri',
        description: 'Siaga melindungi penyintas (-35% damage masuk).',
        effectLabel: 'Perisai 1g',
        cooldownTurns: 2,
        kind: 'DEFEND',
      },
    ];
  }

  if (companion.role === 'HEALER') {
    return [
      {
        id: 'heal_dew',
        name: 'Embun Penyembuh',
        description: 'Memulihkan HP penyintas secara instan.',
        effectLabel: `+${healBase} HP`,
        cooldownTurns: 0,
        kind: 'HEAL',
      },
      {
        id: 'heal_regen',
        name: 'Regenerasi Alam',
        description: 'Memberi pemulihan HP bertahap selama 3 giliran.',
        effectLabel: `+${Math.max(5, Math.round(healBase * 0.55))} HP/g (3g)`,
        cooldownTurns: 3,
        kind: 'HEAL',
      },
      {
        id: 'heal_purify',
        name: 'Pemurnian Roh',
        description: 'Memulihkan Mana & Stamina serta memberi perlindungan tipis.',
        effectLabel: '+12 MP · +14 STM',
        cooldownTurns: 2,
        kind: 'HEAL',
      },
    ];
  }

  if (companion.role === 'LUCK_SUPPORT') {
    return [
      {
        id: 'luck_blessing',
        name: 'Berkat Tuah Bara',
        description: 'Meningkatkan peluang kritis seranganmu (+20% Kritis, 2 giliran) & tuah rampasan.',
        effectLabel: '+20% Kritis · Tuah',
        cooldownTurns: 0,
        kind: 'LUCK',
      },
      {
        id: 'luck_treasure',
        name: 'Penciuman Harta',
        description: 'Menandai celah lemah musuh (+25% ATK giliran depan) & menaikkan peluang drop langka.',
        effectLabel: '+Drop Langka · +ATK',
        cooldownTurns: 2,
        kind: 'LUCK',
      },
      {
        id: 'comp_guard',
        name: 'Langkah Lincah',
        description: 'Membantu mengalihkan perhatian musuh (-30% dmg masuk).',
        effectLabel: 'Perisai 1g',
        cooldownTurns: 2,
        kind: 'DEFEND',
      },
    ];
  }

  // DEFENDER (Turtle)
  return [
    {
      id: 'def_protect',
      name: 'Lindungi Penyintas',
      description: 'Menahan hantaman berikutnya dengan tempurung (-50% damage masuk).',
      effectLabel: '-50% DMG Masuk',
      cooldownTurns: 0,
      kind: 'DEFEND',
    },
    {
      id: 'def_shell',
      name: 'Perisai Tempurung',
      description: 'Memberikan selubung pertahanan bertahan selama 2 giliran.',
      effectLabel: 'Perisai 2 Giliran',
      cooldownTurns: 3,
      kind: 'DEFEND',
    },
    {
      id: 'def_fortify',
      name: 'Perkuat Pertahanan',
      description: 'Menenangkan napas penyintas (+6 HP & +14 Stamina).',
      effectLabel: '+6 HP · +14 STM',
      cooldownTurns: 2,
      kind: 'DEFEND',
    },
  ];
}

export function renameCompanion(
  player: PlayerState,
  companionId: string,
  newName: string
): boolean {
  const cleaned = newName.trim().slice(0, 24);
  if (!cleaned) return false;
  const target = player.companions.find((c) => c.id === companionId);
  if (!target) return false;
  target.name = cleaned;
  if (player.companion?.id === companionId) {
    player.companion.name = cleaned;
  }
  return true;
}

export function releaseCompanion(player: PlayerState, companionId: string): CompanionState | null {
  const idx = player.companions.findIndex((c) => c.id === companionId);
  if (idx === -1) return null;
  const [removed] = player.companions.splice(idx, 1);
  if (player.companion?.id === companionId) {
    player.companion = null;
  }
  return removed;
}

export function normalizeCompanionState(raw: Partial<CompanionState>): CompanionState {
  const species: AnimalSpecies = raw.species ?? 'EMBER_FOX';
  const cfg = COMPANION_SPECIES_CONFIG[species] ?? COMPANION_SPECIES_CONFIG.EMBER_FOX;
  return {
    id: raw.id ?? `comp_${species}`,
    species,
    name: raw.name ?? cfg.displayName,
    role: raw.role ?? cfg.role,
    rarity: raw.rarity ?? cfg.rarity,
    diet: raw.diet ?? cfg.diet,
    foodPreferences: raw.foodPreferences ?? [...cfg.foodPreferences],
    level: raw.level ?? 1,
    exp: raw.exp ?? 0,
    expToNext: raw.expToNext ?? 65,
    hp: raw.hp ?? cfg.baseHp,
    maxHp: raw.maxHp ?? cfg.baseHp,
    attack: typeof raw.attack === 'number' ? raw.attack : cfg.baseAttack,
    defenseBonus: raw.defenseBonus ?? cfg.defenseBonus,
    healPower: raw.healPower ?? cfg.healPower,
    luckBonus: raw.luckBonus ?? cfg.luckBonus,
    abilityName: raw.abilityName ?? cfg.abilityName,
    abilityDescription: raw.abilityDescription ?? cfg.abilityDescription,
    tamedAt: raw.tamedAt ?? Date.now(),
    status: raw.active ? 'ACTIVE' : raw.status ?? 'STORED',
    active: Boolean(raw.active),
    x: raw.x ?? 0,
    y: raw.y ?? 0,
    facing: raw.facing ?? 'right',
  };
}
