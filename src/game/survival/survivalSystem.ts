import { CHARACTER_CLASSES } from '../character/classes';
import {
  getActiveLuckBonus,
  normalizeCompanionState,
} from '../companion/companionSystem';
import {
  EnvironmentHazard,
  EquipmentSlot,
  ItemId,
  PlayerState,
  RegionData,
  ResourceNode,
  WorldState,
} from '../core/types';
import { CRAFTING_RECIPES, ITEM_ORDER, ITEMS } from '../inventory/items';
import {
  REGION_SPAWN_X,
  REGION_SPAWN_Y,
  getMineralLabel,
  getPlantLabel,
  getTreeLabel,
} from '../world/worldGenerator';

export const DAY_DURATION_SECONDS = 180; // 3 real minutes = 1 full in-game day

export function getTimeOfDayInfo(gameTimeSeconds: number): {
  day: number;
  clockLabel: string;
  phaseLabel: string;
  nightFactor: number;
  isNight: boolean;
} {
  const day = Math.floor(gameTimeSeconds / DAY_DURATION_SECONDS) + 1;
  const dayProgress = (gameTimeSeconds % DAY_DURATION_SECONDS) / DAY_DURATION_SECONDS;

  const shiftedProgress = (dayProgress + 7 / 24) % 1;
  const totalMinutes = Math.floor(shiftedProgress * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const clockLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  let phaseLabel = 'Pagi';
  let nightFactor = 0;

  if (hours >= 5 && hours < 11) {
    phaseLabel = 'Pagi';
    nightFactor = hours < 6 ? 0.24 : 0;
  } else if (hours >= 11 && hours < 16) {
    phaseLabel = 'Siang';
    nightFactor = 0;
  } else if (hours >= 16 && hours < 19) {
    phaseLabel = 'Senja';
    nightFactor = ((hours - 16) / 3) * 0.44;
  } else {
    phaseLabel = 'Malam';
    nightFactor = 0.56;
  }

  return { day, clockLabel, phaseLabel, nightFactor, isNight: hours >= 19 || hours < 5 };
}

export function getCompletedNightsForGameTime(gameTimeSeconds: number): number {
  // Day starts at 07:00; 05:00 Dawn after first night happens at (22/24)*DAY_DURATION_SECONDS.
  const dawnOffset = (2 / 24) * DAY_DURATION_SECONDS;
  return Math.max(0, Math.floor((gameTimeSeconds + dawnOffset) / DAY_DURATION_SECONDS));
}

export function getEffectiveResistances(player: PlayerState, world?: WorldState) {
  const nowSec = world ? world.gameTimeSeconds : 0;
  const buffs = player.activeBuffs ?? {};
  const torchColdBonus = player.torchSecondsRemaining > 0 ? 1 : 0;
  const buffCold = buffs.coldResistUntil && buffs.coldResistUntil > nowSec ? 2 : 0;
  const buffHeat = buffs.heatResistUntil && buffs.heatResistUntil > nowSec ? 2 : 0;
  const buffFire = buffs.fireResistUntil && buffs.fireResistUntil > nowSec ? 2 : 0;
  const buffPoison = buffs.poisonResistUntil && buffs.poisonResistUntil > nowSec ? 2 : 0;

  return {
    cold: (player.coldResist ?? 0) + torchColdBonus + buffCold,
    heat: (player.heatResist ?? 0) + buffHeat + (buffFire > 0 ? 1 : 0),
    fire: (player.fireResist ?? 0) + buffFire,
    poison: (player.poisonResist ?? 0) + buffPoison,
  };
}

export function getHazardWarningInfo(
  hazard: EnvironmentHazard,
  player: PlayerState,
  world?: WorldState
): { label: string; mitigated: boolean; advice: string } | null {
  if (hazard === 'NONE') return null;
  const r = getEffectiveResistances(player, world);
  switch (hazard) {
    case 'COLD':
      return {
        label: 'Hawa Dingin',
        mitigated: r.cold >= 1,
        advice: 'Kenakan Jubah Bulu, Obor, atau minum Ramuan Penghangat.',
      };
    case 'EXTREME_COLD':
      return {
        label: 'Beku Ekstrem',
        mitigated: r.cold >= 2,
        advice: 'Butuh Jubah Bulu + Sepatu Salju / Ramuan Penghangat!',
      };
    case 'HEAT':
      return {
        label: 'Terik Panas',
        mitigated: r.heat >= 1,
        advice: 'Kenakan Jubah Linen Gurun atau minum Ramuan Pendingin.',
      };
    case 'EXTREME_HEAT':
      return {
        label: 'Panas Gurun Ekstrem',
        mitigated: r.heat >= 2,
        advice: 'Butuh Jubah Linen + Sepatu Gurun / Ramuan Pendingin!',
      };
    case 'VOLCANIC':
      return {
        label: 'Bara Vulkanik',
        mitigated: r.fire >= 2,
        advice: 'Butuh Zirah Obsidian & Eliksir Tahan Api!',
      };
    case 'POISON':
      return {
        label: 'Kabut Beracun',
        mitigated: r.poison >= 2,
        advice: 'Gunakan Topeng Filter Rimba atau Penawar Racun!',
      };
    default:
      return null;
  }
}

export interface SurvivalTickResult {
  diedOfStarvation: boolean;
  cause: 'STARVATION' | 'DEHYDRATION' | 'ENVIRONMENT' | null;
  nightEscalated: boolean;
  newCompletedNights: number;
  hazardStatus: { label: string; mitigated: boolean; advice: string } | null;
}

export function tickSurvival(
  player: PlayerState,
  world: WorldState,
  dt: number,
  region?: RegionData
): SurvivalTickResult {
  world.gameTimeSeconds += dt;
  world.dayCount = Math.floor(world.gameTimeSeconds / DAY_DURATION_SECONDS) + 1;

  const prevNights = world.completedNights ?? 0;
  const computedNights = Math.max(prevNights, getCompletedNightsForGameTime(world.gameTimeSeconds));
  const nightEscalated = computedNights > prevNights;
  world.completedNights = computedNights;

  if (player.torchSecondsRemaining > 0) {
    player.torchSecondsRemaining = Math.max(0, player.torchSecondsRemaining - dt);
  }

  const hazard: EnvironmentHazard = region?.hazard ?? 'NONE';
  const hazardInfo = getHazardWarningInfo(hazard, player, world);
  const res = getEffectiveResistances(player, world);

  // Hunger & Thirst decay gradually (faster in heat hazards unless mitigated)
  let hungerDrain = player.isMoving ? 0.36 : 0.22;
  let thirstDrain = player.isMoving ? 0.44 : 0.27;
  if (player.classId === 'shaman') {
    hungerDrain *= 0.8;
    thirstDrain *= 0.85;
  }
  if (hazard === 'HEAT' && res.heat < 1) thirstDrain *= 1.35;
  if (hazard === 'EXTREME_HEAT' && res.heat < 2) thirstDrain *= res.heat === 1 ? 1.45 : 1.95;
  if (hazard === 'VOLCANIC' && res.fire < 2) thirstDrain *= 1.65;

  player.hunger = Math.max(0, player.hunger - hungerDrain * dt);
  player.thirst = Math.max(0, player.thirst - thirstDrain * dt);

  // Stamina regeneration / drain (slower in cold hazards unless mitigated)
  const staminaFactor = player.classId === 'rogue' ? 0.75 : 1;
  const coldPenalty =
    hazard === 'COLD' && res.cold < 1
      ? 1.35
      : hazard === 'EXTREME_COLD' && res.cold < 2
      ? res.cold === 1
        ? 1.45
        : 1.95
      : 1;

  if (player.isMoving) {
    if (player.hunger <= 20 || player.thirst <= 20) {
      player.stamina = Math.max(0, player.stamina - 4.0 * staminaFactor * coldPenalty * dt);
    } else {
      player.stamina = Math.max(0, player.stamina - 0.9 * staminaFactor * coldPenalty * dt);
    }
  } else {
    const regenRate = (player.hunger > 25 && player.thirst > 25 ? 12 : 5) / coldPenalty;
    player.stamina = Math.min(player.maxStamina, player.stamina + regenRate * dt);
  }

  // Unmitigated harsh environmental HP drain (safe zones block hazard drain)
  if (!region?.isSafeZone && hazard !== 'NONE') {
    let envDmgPerSec = 0;
    if (hazard === 'EXTREME_COLD' && res.cold < 2) envDmgPerSec = res.cold === 1 ? 0.45 : 1.15;
    else if (hazard === 'EXTREME_HEAT' && res.heat < 2) envDmgPerSec = res.heat === 1 ? 0.4 : 1.0;
    else if (hazard === 'VOLCANIC' && res.fire < 2) envDmgPerSec = res.fire === 1 ? 0.75 : 1.7;
    else if (hazard === 'POISON' && res.poison < 2) envDmgPerSec = res.poison === 1 ? 0.4 : 1.1;

    if (envDmgPerSec > 0) {
      player.hp = Math.max(0, player.hp - envDmgPerSec * dt);
      if (player.hp <= 0) {
        return {
          diedOfStarvation: true,
          cause: 'ENVIRONMENT',
          nightEscalated,
          newCompletedNights: computedNights,
          hazardStatus: hazardInfo,
        };
      }
    }
  }

  // Gradual HP regeneration out of combat (disabled during active unmitigated hazard)
  const hazardBlockedRegen = hazardInfo !== null && !hazardInfo.mitigated && !region?.isSafeZone;
  if (!hazardBlockedRegen && player.hunger > 30 && player.thirst > 30 && player.hp < player.maxHp) {
    const wellFedBonus = player.hunger > 65 && player.thirst > 65 ? 1.4 : 1.0;
    const baseHpRegen = player.isMoving ? 0.18 : 0.55;
    player.hp = Math.min(player.maxHp, player.hp + baseHpRegen * wellFedBonus * dt);
  }

  // Gradual MP regeneration out of combat
  if (player.hunger > 20 && player.thirst > 20 && player.mana < player.maxMana) {
    const classBonus = player.classId === 'mage' ? 0.45 : player.classId === 'shaman' ? 0.35 : 0;
    const baseMpRegen = player.isMoving ? 0.7 : 1.55;
    const totalMpRegen = baseMpRegen + classBonus + (player.bonusManaRegen ?? 0);
    player.mana = Math.min(player.maxMana, player.mana + totalMpRegen * dt);
  }

  // Critical starvation or dehydration drains HP
  if (player.hunger <= 0 || player.thirst <= 0) {
    player.hp = Math.max(0, player.hp - 1.65 * dt);
    if (player.hp <= 0) {
      return {
        diedOfStarvation: true,
        cause: player.thirst <= 0 ? 'DEHYDRATION' : 'STARVATION',
        nightEscalated,
        newCompletedNights: computedNights,
        hazardStatus: hazardInfo,
      };
    }
  }

  return {
    diedOfStarvation: false,
    cause: null,
    nightEscalated,
    newCompletedNights: computedNights,
    hazardStatus: hazardInfo,
  };
}

export interface GatherResult {
  success: boolean;
  drops: { itemId: ItemId; quantity: number }[];
  message: string;
}

export function gatherFromNode(
  player: PlayerState,
  world: WorldState,
  node: ResourceNode
): GatherResult {
  if (node.remaining <= 0) {
    return { success: false, drops: [], message: 'Sumber daya sudah habis.' };
  }

  if (node.requiresTool === 'PICKAXE' && !player.hasPickaxe) {
    return {
      success: false,
      drops: [],
      message: `Butuh Beliung Batu untuk menambang ${getMineralLabel(node.mineralSpecies)}!`,
    };
  }

  const staminaCost = player.classId === 'villager' || player.classId === 'rogue' ? 4 : 5;
  if (player.stamina < staminaCost) {
    return {
      success: false,
      drops: [],
      message: 'Stamina terlalu rendah! Istirahat atau makan dulu.',
    };
  }

  player.stamina = Math.max(0, player.stamina - staminaCost);
  node.remaining -= 1;
  world.harvestedNodes[node.id] = (world.harvestedNodes[node.id] ?? 0) + 1;

  const villagerBonus = player.classId === 'villager' ? 1 : 0;
  const luckBonus = getActiveLuckBonus(player);
  const drops: { itemId: ItemId; quantity: number }[] = [];

  if (node.kind === 'TREE') {
    const axeBonus = player.hasAxe ? 1 : 0;
    const woodQty =
      (node.treeSpecies === 'ANCIENT' ? 2 : 1) + axeBonus + (villagerBonus > 0 ? 1 : 0);

    if (node.treeSpecies === 'CHARRED') {
      drops.push({ itemId: 'batu_bara', quantity: 1 });
      drops.push({ itemId: 'abu_vulkanik', quantity: 1 });
    } else if (node.treeSpecies === 'CACTUS') {
      drops.push({ itemId: 'sayur_liar', quantity: 1 });
      drops.push({ itemId: 'kayu', quantity: 1 });
    } else {
      drops.push({ itemId: 'kayu', quantity: woodQty });
    }

    if (node.treeSpecies === 'FRUIT_TREE' || node.treeSpecies === 'BUSH_TREE') {
      drops.push({ itemId: 'beri', quantity: 1 });
    }
    if (
      node.treeSpecies === 'YOUNG' ||
      node.treeSpecies === 'OAK' ||
      node.treeSpecies === 'BIRCH' ||
      node.treeSpecies === 'ACACIA'
    ) {
      if (Math.random() < 0.45 + luckBonus * 0.4) drops.push({ itemId: 'benih', quantity: 1 });
    }
    if (node.treeSpecies === 'CORRUPTED' || node.treeSpecies === 'ANCIENT') {
      if (Math.random() < 0.4 + luckBonus * 0.5) drops.push({ itemId: 'tanaman_langka', quantity: 1 });
    }
  } else if (node.kind === 'MINERAL') {
    const qty = 1 + villagerBonus;
    switch (node.mineralSpecies) {
      case 'IRON':
        drops.push({ itemId: 'bijih_besi', quantity: qty });
        if (Math.random() < 0.4) drops.push({ itemId: 'batu', quantity: 1 });
        break;
      case 'GOLD':
        drops.push({ itemId: 'bijih_emas', quantity: Math.random() < luckBonus * 0.6 ? 2 : 1 });
        break;
      case 'COPPER':
        drops.push({ itemId: 'bijih_tembaga', quantity: qty });
        break;
      case 'COAL':
        drops.push({ itemId: 'batu_bara', quantity: qty });
        drops.push({ itemId: 'batu', quantity: 1 });
        break;
      case 'OBSIDIAN':
        drops.push({ itemId: 'obsidian', quantity: 1 });
        drops.push({ itemId: 'abu_vulkanik', quantity: 1 });
        break;
      case 'ICE_CRYSTAL':
        drops.push({ itemId: 'kristal_es', quantity: 1 });
        break;
      default:
        drops.push({ itemId: 'batu', quantity: qty });
        if (Math.random() < 0.15 * (1 + luckBonus * 2)) drops.push({ itemId: 'bijih_besi', quantity: 1 });
        break;
    }
  } else if (node.kind === 'PLANT') {
    const qty = 1 + villagerBonus;
    switch (node.plantSpecies) {
      case 'WILD_GRASS':
        drops.push({ itemId: 'rumput_liar', quantity: 1 + qty });
        break;
      case 'MEDICINAL_HERB':
      case 'DESERT_HERB':
        drops.push({ itemId: 'herba_obat', quantity: qty });
        break;
      case 'WILD_VEGETABLE':
        drops.push({ itemId: 'sayur_liar', quantity: qty });
        break;
      case 'BERRY_BUSH':
        drops.push({ itemId: 'beri', quantity: 1 + qty });
        if (Math.random() < 0.35 + luckBonus * 0.4) drops.push({ itemId: 'benih', quantity: 1 });
        break;
      case 'MUSHROOM':
        drops.push({ itemId: 'jamur', quantity: qty });
        break;
      case 'SEED_SPROUT':
        drops.push({ itemId: 'benih', quantity: 1 + qty });
        break;
      case 'FROST_BLOOM':
        drops.push({ itemId: 'kristal_es', quantity: 1 });
        drops.push({ itemId: 'herba_obat', quantity: 1 });
        break;
      case 'ASH_FERN':
        drops.push({ itemId: 'abu_vulkanik', quantity: 1 });
        break;
      case 'SPECIAL_PLANT':
        drops.push({ itemId: 'tanaman_langka', quantity: Math.random() < luckBonus * 0.5 ? 2 : 1 });
        break;
      default:
        drops.push({ itemId: 'beri', quantity: 1 });
        break;
    }
  }

  for (const d of drops) {
    grantInventoryItem(player, d.itemId, d.quantity);
    player.resourcesGathered += d.quantity;
  }

  const label =
    node.kind === 'TREE'
      ? getTreeLabel(node.treeSpecies)
      : node.kind === 'MINERAL'
      ? getMineralLabel(node.mineralSpecies)
      : getPlantLabel(node.plantSpecies);

  const summary = drops.map((d) => `+${d.quantity} ${ITEMS[d.itemId].name}`).join(', ');
  return {
    success: true,
    drops,
    message: `${label}: ${summary}`,
  };
}

export function drinkFromWater(player: PlayerState): { success: boolean; message: string } {
  const before = player.thirst;
  player.thirst = Math.min(player.maxThirst, player.thirst + 42);
  player.hp = Math.min(player.maxHp, player.hp + 4);
  player.stamina = Math.min(player.maxStamina, player.stamina + 10);
  const gained = Math.round(player.thirst - before);
  return {
    success: true,
    message: gained > 0 ? `Minum air bersih (+${gained} Haus, +4 HP)` : 'Dahaga sudah penuh!',
  };
}

export function fillWaterContainer(player: PlayerState): { success: boolean; message: string } {
  if (player.waterCharges >= player.maxWaterCharges) {
    return {
      success: false,
      message: `Kantung air sudah penuh (${player.waterCharges}/${player.maxWaterCharges}).`,
    };
  }
  player.waterCharges = player.maxWaterCharges;
  return {
    success: true,
    message: `Mengisi Kantung Air (${player.waterCharges}/${player.maxWaterCharges})`,
  };
}

export function drinkFromContainer(player: PlayerState): { success: boolean; message: string } {
  if (player.waterCharges <= 0) {
    return {
      success: false,
      message: 'Kantung air kosong! Cari kolam atau sungai untuk mengisi ulang.',
    };
  }
  player.waterCharges -= 1;
  player.thirst = Math.min(player.maxThirst, player.thirst + 36);
  player.stamina = Math.min(player.maxStamina, player.stamina + 8);
  return {
    success: true,
    message: `Minum dari Kantung Air (+36 Haus, sisa ${player.waterCharges}/${player.maxWaterCharges}).`,
  };
}

export function grantInventoryItem(
  player: PlayerState,
  itemId: ItemId,
  quantity: number
): void {
  if (quantity <= 0) return;
  player.inventory[itemId] = (player.inventory[itemId] ?? 0) + quantity;
  if (!player.newlyAcquiredItems) player.newlyAcquiredItems = {};
  player.newlyAcquiredItems[itemId] = true;
  if (!player.itemAcquiredOrder) player.itemAcquiredOrder = {};
  const nextSeq = (player.itemAcquiredSeq ?? 0) + 1;
  player.itemAcquiredSeq = nextSeq;
  player.itemAcquiredOrder[itemId] = nextSeq;
}

export function clearNewlyAcquiredItem(player: PlayerState, itemId: ItemId): void {
  if (player.newlyAcquiredItems && player.newlyAcquiredItems[itemId]) {
    delete player.newlyAcquiredItems[itemId];
  }
}

export function normalizeEquipSlot(slot?: string): EquipmentSlot | null {
  if (!slot) return null;
  if (slot === 'ARMOR') return 'CHEST';
  if (
    slot === 'WEAPON' ||
    slot === 'OFFHAND' ||
    slot === 'HELMET' ||
    slot === 'CHEST' ||
    slot === 'GLOVES' ||
    slot === 'BOOTS' ||
    slot === 'ACCESSORY'
  ) {
    return slot;
  }
  return null;
}

export const EQUIPMENT_SLOT_META: Record<EquipmentSlot, { label: string; shortLabel: string }> = {
  WEAPON: { label: 'Senjata Utama', shortLabel: 'Senjata' },
  OFFHAND: { label: 'Tangan Kiri / Perisai', shortLabel: 'Perisai' },
  HELMET: { label: 'Pelindung Kepala', shortLabel: 'Kepala' },
  CHEST: { label: 'Pelindung Dada', shortLabel: 'Dada' },
  GLOVES: { label: 'Sarung Tangan', shortLabel: 'Tangan' },
  BOOTS: { label: 'Sepatu', shortLabel: 'Kaki' },
  ACCESSORY: { label: 'Aksesori / Jimat', shortLabel: 'Aksesori' },
};

export function recalculatePlayerStats(player: PlayerState): void {
  const cls = CHARACTER_CLASSES[player.classId] ?? CHARACTER_CLASSES.villager;
  const lvlBonus = Math.max(0, (player.level ?? 1) - 1);

  let weaponBonusAtk = 0;
  let gearBonusAtk = 0;
  let gearBonusDef = 0;
  let gearBonusManaRegen = 0;
  let gearSpeedBonus = 0;
  let gearCritBonus = 0;
  let coldResist = 0;
  let heatResist = 0;
  let fireResist = 0;
  let poisonResist = 0;

  let weaponVisual = cls.weaponVisual;
  let armorVisual = cls.armorVisual;
  let offhandVisual: PlayerState['equippedOffhandVisual'] = 'NONE';
  let helmetVisual: PlayerState['equippedHelmetVisual'] = 'NONE';

  const equippedNames: string[] = [];
  const slots = player.equippedSlots ?? {};

  (Object.keys(EQUIPMENT_SLOT_META) as EquipmentSlot[]).forEach((slot) => {
    const id = slots[slot];
    if (!id) return;
    const def = ITEMS[id];
    if (!def) return;
    equippedNames.push(def.name);

    if (slot === 'WEAPON') {
      weaponBonusAtk += def.bonusAtk ?? 0;
      if (def.weaponVisual) weaponVisual = def.weaponVisual;
    } else {
      gearBonusAtk += def.bonusAtk ?? 0;
    }

    if (slot === 'CHEST' && def.armorVisual) armorVisual = def.armorVisual;
    if (slot === 'OFFHAND' && def.offhandVisual) offhandVisual = def.offhandVisual;
    if (slot === 'HELMET' && def.helmetVisual) helmetVisual = def.helmetVisual;

    gearBonusDef += def.bonusDef ?? 0;
    gearBonusManaRegen += def.bonusManaRegen ?? 0;
    gearSpeedBonus += def.speedBonus ?? 0;
    gearCritBonus += def.critBonus ?? 0;
    coldResist += def.coldResist ?? 0;
    heatResist += def.heatResist ?? 0;
    fireResist += def.fireResist ?? 0;
    poisonResist += def.poisonResist ?? 0;
  });

  const baseClassCrit =
    player.classId === 'archer'
      ? 0.26
      : player.classId === 'rogue'
      ? 0.18
      : 0.08;

  player.attack = cls.baseAttack + lvlBonus * 2 + gearBonusAtk;
  player.weaponDamage = cls.weaponDamage + weaponBonusAtk;
  player.defense = cls.baseDefense + lvlBonus + gearBonusDef;
  player.speed = cls.baseSpeed + gearSpeedBonus;
  player.bonusManaRegen = gearBonusManaRegen;
  player.critChance = Math.min(0.85, baseClassCrit + gearCritBonus);
  player.coldResist = coldResist;
  player.heatResist = heatResist;
  player.fireResist = fireResist;
  player.poisonResist = poisonResist;

  player.equippedWeaponVisual = weaponVisual;
  player.equippedArmorVisual = armorVisual;
  player.equippedOffhandVisual = offhandVisual;
  player.equippedHelmetVisual = helmetVisual;
  player.equipment = equippedNames.length > 0 ? equippedNames : [...cls.startingEquipment];
}

export function equipInventoryItem(
  player: PlayerState,
  itemId: ItemId
): { success: boolean; message: string } {
  const count = player.inventory[itemId] ?? 0;
  if (count <= 0) {
    return { success: false, message: 'Item tidak tersedia di tas.' };
  }
  const def = ITEMS[itemId];
  const slot = normalizeEquipSlot(def.equipSlot);
  if (def.category !== 'EQUIPMENT' || !slot) {
    return { success: false, message: `${def.name} bukan perlengkapan yang bisa dipasang.` };
  }

  if (!player.equippedSlots) player.equippedSlots = {};
  const currentlyEquipped = player.equippedSlots[slot];
  if (currentlyEquipped === itemId) {
    return { success: false, message: `${def.name} sudah terpasang di slot ini.` };
  }

  player.inventory[itemId] = count - 1;
  clearNewlyAcquiredItem(player, itemId);

  if (currentlyEquipped && ITEMS[currentlyEquipped]) {
    player.inventory[currentlyEquipped] = (player.inventory[currentlyEquipped] ?? 0) + 1;
  }

  player.equippedSlots[slot] = itemId;
  recalculatePlayerStats(player);

  return {
    success: true,
    message: currentlyEquipped
      ? `Mengganti ${ITEMS[currentlyEquipped].name} dengan ${def.name}.`
      : `Memasang ${def.name} di ${EQUIPMENT_SLOT_META[slot].label}!`,
  };
}

export function unequipSlot(
  player: PlayerState,
  slot: EquipmentSlot
): { success: boolean; message: string } {
  if (!player.equippedSlots) player.equippedSlots = {};
  const equippedId = player.equippedSlots[slot];
  if (!equippedId || !ITEMS[equippedId]) {
    return { success: false, message: 'Slot perlengkapan sudah kosong.' };
  }
  const def = ITEMS[equippedId];
  player.equippedSlots[slot] = null;
  player.inventory[equippedId] = (player.inventory[equippedId] ?? 0) + 1;
  recalculatePlayerStats(player);
  return {
    success: true,
    message: `Melepas ${def.name} dan mengembalikannya ke tas.`,
  };
}

export function dropInventoryItem(
  player: PlayerState,
  itemId: ItemId,
  quantity = 1
): { success: boolean; message: string } {
  const owned = player.inventory[itemId] ?? 0;
  if (owned <= 0) {
    return { success: false, message: 'Item tidak ada di tas.' };
  }
  const removeQty = Math.min(owned, Math.max(1, quantity));
  player.inventory[itemId] = owned - removeQty;
  clearNewlyAcquiredItem(player, itemId);
  return {
    success: true,
    message: `Membuang ${removeQty}x ${ITEMS[itemId].name} dari tas.`,
  };
}

export function useItemInExploration(
  player: PlayerState,
  itemId: ItemId,
  currentGameTimeSeconds = 0
): { success: boolean; message: string } {
  const count = player.inventory[itemId] ?? 0;
  if (count <= 0) {
    return { success: false, message: 'Jumlah barang tidak cukup.' };
  }
  const def = ITEMS[itemId];
  clearNewlyAcquiredItem(player, itemId);

  if (!def.usableInExploration) {
    return {
      success: false,
      message: `${def.name} digunakan untuk meracik atau pertarungan.`,
    };
  }

  if (itemId === 'kapak_batu') {
    player.hasAxe = true;
    return { success: true, message: 'Kapak Batu siap dipakai menebang lebih cepat.' };
  }
  if (itemId === 'beliung_batu') {
    player.hasPickaxe = true;
    return { success: true, message: 'Beliung Batu siap menambang Bijih Besi & Emas.' };
  }
  if (itemId === 'pancing_dasar') {
    player.hasFishingRod = true;
    return { success: true, message: 'Joran Pancing Bambu siap dipakai di tepi sungai atau kolam!' };
  }

  if (def.category === 'EQUIPMENT' && def.equipSlot) {
    return equipInventoryItem(player, itemId);
  }

  const shamanMult =
    player.classId === 'shaman' && (itemId === 'beri' || itemId === 'herba_obat') ? 1.45 : 1;

  if (def.healHp) {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(def.healHp * shamanMult));
  }
  if (def.restoreMana) {
    player.mana = Math.min(player.maxMana, player.mana + def.restoreMana);
  }
  if (def.restoreHunger) {
    player.hunger = Math.min(
      player.maxHunger,
      player.hunger + Math.round(def.restoreHunger * shamanMult)
    );
  }
  if (def.restoreThirst) {
    player.thirst = Math.min(player.maxThirst, player.thirst + def.restoreThirst);
  }
  if (def.restoreStamina) {
    player.stamina = Math.min(player.maxStamina, player.stamina + def.restoreStamina);
  }
  if (itemId === 'obor') {
    player.torchSecondsRemaining = 110;
  }
  if (def.buffType && def.buffDurationSeconds) {
    if (!player.activeBuffs) player.activeBuffs = {};
    const until = currentGameTimeSeconds + def.buffDurationSeconds;
    if (def.buffType === 'COLD_RESIST') player.activeBuffs.coldResistUntil = until;
    else if (def.buffType === 'HEAT_RESIST') player.activeBuffs.heatResistUntil = until;
    else if (def.buffType === 'FIRE_RESIST') player.activeBuffs.fireResistUntil = until;
    else if (def.buffType === 'POISON_RESIST') player.activeBuffs.poisonResistUntil = until;
  }

  player.inventory[itemId] = count - 1;
  return { success: true, message: `Menggunakan ${def.name}.` };
}

export function craftItem(
  player: PlayerState,
  recipeId: string
): { success: boolean; message: string } {
  const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) {
    return { success: false, message: 'Resep tidak ditemukan.' };
  }

  if (recipe.waterCost && player.waterCharges < recipe.waterCost) {
    return {
      success: false,
      message: `Air di Kantung Air kurang! Butuh ${recipe.waterCost} takaran air.`,
    };
  }

  for (const ing of recipe.ingredients) {
    if ((player.inventory[ing.itemId] ?? 0) < ing.quantity) {
      return {
        success: false,
        message: `Bahan kurang: butuh ${ing.quantity} ${ITEMS[ing.itemId].name}.`,
      };
    }
  }

  if (recipe.waterCost) {
    player.waterCharges -= recipe.waterCost;
  }
  for (const ing of recipe.ingredients) {
    player.inventory[ing.itemId] -= ing.quantity;
  }

  grantInventoryItem(player, recipe.outputItemId, recipe.outputQuantity);
  player.craftedCount = (player.craftedCount ?? 0) + 1;

  if (recipe.outputItemId === 'kapak_batu') player.hasAxe = true;
  if (recipe.outputItemId === 'beliung_batu') player.hasPickaxe = true;
  if (recipe.outputItemId === 'pancing_dasar') player.hasFishingRod = true;

  return {
    success: true,
    message: `Berhasil membuat ${recipe.outputQuantity}x ${ITEMS[recipe.outputItemId].name}!`,
  };
}

function createEmptyInventory(): Record<ItemId, number> {
  const inv = {} as Record<ItemId, number>;
  for (const id of ITEM_ORDER) {
    inv[id] = 0;
  }
  return inv;
}

export function createInitialPlayer(classId: PlayerState['classId']): PlayerState {
  const def = CHARACTER_CLASSES[classId];
  const inventory = createEmptyInventory();
  inventory.beri = 3;
  inventory.ramuan_bara = 1;

  const baseCrit =
    classId === 'archer' ? 0.26 : classId === 'rogue' ? 0.18 : 0.08;

  return {
    classId,
    level: 1,
    exp: 0,
    expToNext: 60,
    gold: 40,
    x: REGION_SPAWN_X,
    y: REGION_SPAWN_Y,
    facing: 'down',
    isMoving: false,
    animTime: 0,
    hp: def.baseHp,
    maxHp: def.baseHp,
    mana: def.baseMana,
    maxMana: def.baseMana,
    hunger: 100,
    maxHunger: 100,
    thirst: 100,
    maxThirst: 100,
    stamina: 100,
    maxStamina: 100,
    waterCharges: 3,
    maxWaterCharges: 5,
    attack: def.baseAttack,
    defense: def.baseDefense,
    speed: def.baseSpeed,
    weaponDamage: def.weaponDamage,
    bonusManaRegen: 0,
    coldResist: 0,
    heatResist: 0,
    fireResist: 0,
    poisonResist: 0,
    activeBuffs: {},
    equippedWeaponVisual: def.weaponVisual,
    equippedArmorVisual: def.armorVisual,
    equippedOffhandVisual: 'NONE',
    equippedHelmetVisual: 'NONE',
    equippedSlots: {},
    critChance: baseCrit,
    equipment: [...def.startingEquipment],
    hasAxe: false,
    hasPickaxe: false,
    hasFishingRod: false,
    tamingSkillLevel: 1,
    fishingSkillLevel: 1,
    fishCaught: 0,
    inventory,
    newlyAcquiredItems: {},
    itemAcquiredOrder: { beri: 1, ramuan_bara: 2 },
    itemAcquiredSeq: 2,
    monstersDefeated: 0,
    animalsHunted: 0,
    resourcesGathered: 0,
    craftedCount: 0,
    torchSecondsRemaining: 0,
    companion: null,
    companions: [],
    kennelBuilt: false,
    kennelCapacity: 6,
  };
}

export function normalizePlayerState(raw: PlayerState): PlayerState {
  const def = CHARACTER_CLASSES[raw.classId] ?? CHARACTER_CLASSES.villager;
  const inventory = createEmptyInventory();
  for (const id of ITEM_ORDER) {
    inventory[id] = raw.inventory?.[id] ?? 0;
  }

  const legacyOrigin = Math.abs(raw.x) < 48 && Math.abs(raw.y) < 48;
  const safeX = legacyOrigin ? REGION_SPAWN_X : raw.x;
  const safeY = legacyOrigin ? REGION_SPAWN_Y : raw.y;

  const rawCompanions = Array.isArray(raw.companions)
    ? raw.companions.map((c) => normalizeCompanionState(c))
    : [];
  let activeComp = raw.companion ? normalizeCompanionState(raw.companion) : null;
  if (activeComp && !rawCompanions.some((c) => c.id === activeComp!.id)) {
    rawCompanions.push(activeComp);
  }
  if (!activeComp) {
    activeComp = rawCompanions.find((c) => c.active) ?? null;
  } else {
    const matched = rawCompanions.find((c) => c.id === activeComp!.id);
    if (matched) activeComp = matched;
  }

  const equippedSlots: Partial<Record<EquipmentSlot, ItemId | null>> = {
    ...(raw.equippedSlots ?? {}),
  };
  if (Object.keys(equippedSlots).length === 0 && Array.isArray(raw.equipment)) {
    for (const eqName of raw.equipment) {
      const matchedItem = ITEM_ORDER.find((id) => ITEMS[id].name === eqName);
      if (matchedItem) {
        const slot = normalizeEquipSlot(ITEMS[matchedItem].equipSlot);
        if (slot && !equippedSlots[slot]) {
          equippedSlots[slot] = matchedItem;
        }
      }
    }
  }

  const normalized: PlayerState = {
    ...raw,
    gold: typeof raw.gold === 'number' ? raw.gold : 40,
    x: safeX,
    y: safeY,
    mana: typeof raw.mana === 'number' ? raw.mana : def.baseMana,
    maxMana: typeof raw.maxMana === 'number' ? raw.maxMana : def.baseMana,
    thirst: typeof raw.thirst === 'number' ? raw.thirst : 100,
    maxThirst: typeof raw.maxThirst === 'number' ? raw.maxThirst : 100,
    waterCharges: typeof raw.waterCharges === 'number' ? raw.waterCharges : 3,
    maxWaterCharges: typeof raw.maxWaterCharges === 'number' ? raw.maxWaterCharges : 5,
    weaponDamage: typeof raw.weaponDamage === 'number' ? raw.weaponDamage : def.weaponDamage,
    bonusManaRegen: typeof raw.bonusManaRegen === 'number' ? raw.bonusManaRegen : 0,
    coldResist: typeof raw.coldResist === 'number' ? raw.coldResist : 0,
    heatResist: typeof raw.heatResist === 'number' ? raw.heatResist : 0,
    fireResist: typeof raw.fireResist === 'number' ? raw.fireResist : 0,
    poisonResist: typeof raw.poisonResist === 'number' ? raw.poisonResist : 0,
    activeBuffs: raw.activeBuffs ?? {},
    equippedWeaponVisual: raw.equippedWeaponVisual ?? def.weaponVisual,
    equippedArmorVisual: raw.equippedArmorVisual ?? def.armorVisual,
    equippedOffhandVisual: raw.equippedOffhandVisual ?? 'NONE',
    equippedHelmetVisual: raw.equippedHelmetVisual ?? 'NONE',
    equippedSlots,
    critChance: typeof raw.critChance === 'number' ? raw.critChance : 0.08,
    hasAxe: Boolean(raw.hasAxe) || inventory.kapak_batu > 0,
    hasPickaxe: Boolean(raw.hasPickaxe) || inventory.beliung_batu > 0,
    hasFishingRod: Boolean(raw.hasFishingRod) || inventory.pancing_dasar > 0,
    tamingSkillLevel: typeof raw.tamingSkillLevel === 'number' ? raw.tamingSkillLevel : 1,
    fishingSkillLevel: typeof raw.fishingSkillLevel === 'number' ? raw.fishingSkillLevel : 1,
    fishCaught: typeof raw.fishCaught === 'number' ? raw.fishCaught : 0,
    animalsHunted: typeof raw.animalsHunted === 'number' ? raw.animalsHunted : 0,
    craftedCount: typeof raw.craftedCount === 'number' ? raw.craftedCount : 0,
    companion: activeComp,
    companions: rawCompanions,
    kennelBuilt: Boolean(raw.kennelBuilt),
    kennelCapacity: typeof raw.kennelCapacity === 'number' ? raw.kennelCapacity : 6,
    inventory,
    newlyAcquiredItems: raw.newlyAcquiredItems ?? {},
    itemAcquiredOrder: raw.itemAcquiredOrder ?? {},
    itemAcquiredSeq: typeof raw.itemAcquiredSeq === 'number' ? raw.itemAcquiredSeq : 0,
  };

  recalculatePlayerStats(normalized);
  return normalized;
}

export function normalizeWorldState(raw: WorldState): WorldState {
  const gameTime = typeof raw.gameTimeSeconds === 'number' ? raw.gameTimeSeconds : 0;
  const computedNights = getCompletedNightsForGameTime(gameTime);
  return {
    ...raw,
    currentRegionX: typeof raw.currentRegionX === 'number' ? raw.currentRegionX : 0,
    currentRegionY: typeof raw.currentRegionY === 'number' ? raw.currentRegionY : 0,
    exploredRegions: Array.isArray(raw.exploredRegions) ? raw.exploredRegions : ['0,0'],
    completedNights:
      typeof raw.completedNights === 'number'
        ? Math.max(raw.completedNights, computedNights)
        : computedNights,
    nightEscalationRate:
      typeof raw.nightEscalationRate === 'number' ? raw.nightEscalationRate : 0.05,
    harvestedNodes: raw.harvestedNodes ?? {},
    defeatedMonsters: raw.defeatedMonsters ?? {},
    defeatedAnimals: raw.defeatedAnimals ?? {},
    tamedCreatures: raw.tamedCreatures ?? {},
    groundLootByRegion: raw.groundLootByRegion ?? {},
    merchantsByRegion: raw.merchantsByRegion ?? {},
    exploredChunks: Array.isArray(raw.exploredChunks) ? raw.exploredChunks : [],
    exploredTilesByRegion: raw.exploredTilesByRegion ?? {},
    discoveredLandmarksByRegion: raw.discoveredLandmarksByRegion ?? {},
  };
}
