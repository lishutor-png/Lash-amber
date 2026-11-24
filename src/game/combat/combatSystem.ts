import { CHARACTER_CLASSES } from '../character/classes';
import {
  COMPANION_SPECIES_CONFIG,
  calculateTameProbability,
  createCompanionFromSpecies,
  getCompanionActions,
  grantCompanionExp,
} from '../companion/companionSystem';
import {
  AnimalSpecies,
  ClassSkillDef,
  CombatEnemyState,
  CombatState,
  ElementType,
  EnemyIntentType,
  EnemyType,
  ItemId,
  MonsterEntity,
  PlayerState,
  WildlifeEntity,
  WorldState,
} from '../core/types';
import { ITEMS } from '../inventory/items';
import {
  grantInventoryItem,
  recalculatePlayerStats,
} from '../survival/survivalSystem';
import { rollEnemyLoot, rollGoldReward } from './lootSystem';

let vfxCounter = 1;

function nextVfxId(): number {
  return vfxCounter++;
}

export const TAME_HP_THRESHOLD = 0.45;

export function chooseNextEnemyIntent(
  enemy: CombatEnemyState,
  turnCount: number
): EnemyIntentType {
  if (enemy.isPrepared) {
    return 'HEAVY_ATTACK';
  }
  const roll = Math.random();
  if (turnCount % 4 === 2 && enemy.hp > enemy.maxHp * 0.35 && roll < 0.55) {
    return 'PREPARE_ATTACK';
  }
  if (enemy.hp < enemy.maxHp * 0.7 && roll < 0.28) {
    return 'DEFENSIVE_STANCE';
  }
  if (roll > 0.75) {
    return 'HEAVY_ATTACK';
  }
  return 'NORMAL_ATTACK';
}

export function getEnemyIntentDescription(enemy: CombatEnemyState): {
  label: string;
  detail: string;
} {
  if (enemy.isStaggered) {
    return {
      label: 'Terguncang!',
      detail: 'Kehilangan keseimbangan pada giliran ini',
    };
  }
  const isBeast =
    enemy.type === 'WILD_BOAR' ||
    enemy.type === 'FOREST_WOLF' ||
    enemy.type === 'EMBER_FOX' ||
    enemy.type === 'SPIRIT_DEER' ||
    enemy.type === 'TURTLE' ||
    enemy.type === 'DEER' ||
    enemy.type === 'SAVANNA_HYENA' ||
    enemy.type === 'DIRE_WOLF' ||
    enemy.type === 'DESERT_SCORPION';

  switch (enemy.intent) {
    case 'HEAVY_ATTACK': {
      const mult = enemy.isPrepared ? 1.75 : 1.38;
      const est = Math.max(2, Math.round(enemy.attack * mult));
      return {
        label: isBeast ? 'Serangan Buas' : 'Serangan Berat',
        detail: `Bersiap menghantam keras (~${est} ATK)`,
      };
    }
    case 'DEFENSIVE_STANCE':
      return {
        label: 'Posisi Bertahan',
        detail: isBeast
          ? 'Merunduk menahan serangan (-50% dmg masuk)'
          : 'Merapatkan pertahanan (-50% dmg masuk)',
      };
    case 'PREPARE_ATTACK':
      return {
        label: 'Mengisi Tenaga',
        detail: isBeast
          ? 'Menggeram, bersiap menerkam keras!'
          : 'Mengumpulkan energi gelap untuk giliran depan',
      };
    default:
      return {
        label: isBeast ? 'Serangan Liar' : 'Serangan Biasa',
        detail: `Serangan standar (~${enemy.attack} ATK)`,
      };
  }
}

function getElementAffinity(type: EnemyType): {
  weakness: ElementType[];
  resistance: ElementType[];
} {
  switch (type) {
    case 'FOREST_SKELETON':
    case 'UNDEAD_KNIGHT':
      return { weakness: ['HOLY', 'FIRE'], resistance: ['DARK', 'POISON'] };
    case 'SLIME':
      return { weakness: ['FIRE', 'LIGHTNING'], resistance: ['POISON', 'PHYSICAL'] };
    case 'GOBLIN':
      return { weakness: ['FIRE', 'HOLY'], resistance: ['POISON'] };
    case 'DARK_CREATURE':
    case 'CORRUPTED_STAG':
      return { weakness: ['HOLY', 'LIGHTNING'], resistance: ['DARK', 'ICE'] };
    case 'FROST_GOLEM':
      return { weakness: ['FIRE', 'LIGHTNING'], resistance: ['ICE', 'PHYSICAL'] };
    case 'MAGMA_FIEND':
      return { weakness: ['ICE', 'LIGHTNING'], resistance: ['FIRE', 'POISON'] };
    case 'DESERT_SCORPION':
      return { weakness: ['ICE', 'PHYSICAL'], resistance: ['POISON', 'FIRE'] };
    case 'CAVE_TROLL':
      return { weakness: ['FIRE', 'HOLY'], resistance: ['PHYSICAL', 'ICE'] };
    case 'WILD_BOAR':
    case 'FOREST_WOLF':
    case 'SAVANNA_HYENA':
    case 'DIRE_WOLF':
      return { weakness: ['FIRE', 'POISON'], resistance: ['PHYSICAL'] };
    default:
      return { weakness: ['FIRE'], resistance: ['NATURE'] };
  }
}

export function startCombat(player: PlayerState, monster: MonsterEntity): CombatState {
  const playerInitiative = player.speed + (player.classId === 'rogue' ? 10 : 0);
  const playerFirst = playerInitiative >= monster.speed;
  const affinity = getElementAffinity(monster.type);

  const enemyState: CombatEnemyState = {
    id: monster.id,
    name: monster.name,
    type: monster.type,
    hp: monster.hp,
    maxHp: monster.maxHp,
    attack: monster.attack,
    defense: monster.defense,
    speed: monster.speed,
    expReward: monster.expReward,
    isGuarding: false,
    isPrepared: false,
    isStaggered: false,
    intent: 'NORMAL_ATTACK',
    elementalWeakness: affinity.weakness,
    elementalResistance: affinity.resistance,
    statusEffects: [],
    sourceAnimalId: monster.sourceAnimalId,
    tameEligible: monster.tameEligible,
    animalSpecies: monster.animalSpecies,
  };
  enemyState.intent = chooseNextEnemyIntent(enemyState, 1);

  const now = Date.now();
  const introLog = [
    `${monster.name} menghadangmu di hutan!`,
    monster.tameEligible
      ? `Satwa ini bisa dijinakkan! Lemahkan HP hingga <= 45% lalu pilih Beri Makan.`
      : playerFirst
      ? 'Kecepatanmu unggul — giliranmu lebih dulu.'
      : `${monster.name} lebih sigap! Perhatikan niat serangannya.`,
  ];

  return {
    active: true,
    turn: playerFirst ? 'PLAYER' : 'ENEMY',
    enemy: enemyState,
    playerDefending: false,
    playerDodging: false,
    playerWardTurns: 0,
    companionCooldown: 0,
    companionCooldowns: {},
    companionShieldActive: false,
    companionGuardActive: false,
    playerAtkBuffTurns: 0,
    playerCritBuffTurns: 0,
    playerRegenTurns: 0,
    playerRegenAmount: 0,
    combatLuckBonus: 0,
    tameAttempts: 0,
    skillCooldowns: {},
    log: introLog,
    lastPlayerHitFlash: 0,
    lastEnemyHitFlash: 0,
    playerAnim: { state: 'IDLE', startedAt: now },
    enemyAnim: { state: 'IDLE', startedAt: now },
    lastVfx: null,
    turnCount: 1,
  };
}

export function createAnimalCombatMonster(animal: WildlifeEntity): MonsterEntity {
  const typeMap: Record<AnimalSpecies, EnemyType> = {
    BOAR: 'WILD_BOAR',
    WOLF: 'FOREST_WOLF',
    SPIRIT_DEER: 'SPIRIT_DEER',
    EMBER_FOX: 'EMBER_FOX',
    TURTLE: 'TURTLE',
    DEER: 'DEER',
    RABBIT: 'DEER',
    BIRD: 'DEER',
    GAZELLE: 'DEER',
    HYENA: 'SAVANNA_HYENA',
    SNOW_WOLF: 'FOREST_WOLF',
    ARCTIC_FOX: 'EMBER_FOX',
    MOUNTAIN_GOAT: 'TURTLE',
    DIRE_WOLF: 'DIRE_WOLF',
    DESERT_FOX: 'EMBER_FOX',
    SCORPION: 'DESERT_SCORPION',
    FIRE_BEAST: 'MAGMA_FIEND',
    EAGLE: 'DEER',
  };
  return {
    id: `ani_${animal.id}`,
    type: typeMap[animal.species],
    name: animal.name,
    x: animal.x,
    y: animal.y,
    originX: animal.originX,
    originY: animal.originY,
    hp: animal.hp,
    maxHp: animal.maxHp,
    baseMaxHp: animal.baseMaxHp,
    attack: Math.max(4, animal.attack || 6),
    baseAttack: Math.max(4, animal.baseAttack || animal.attack || 6),
    defense: animal.species === 'TURTLE' || animal.species === 'SCORPION' ? 5 : 2,
    baseDefense: animal.species === 'TURTLE' || animal.species === 'SCORPION' ? 5 : 2,
    speed: Math.round(animal.speed / 8),
    expReward: animal.rarity === 'EPIC' ? 42 : animal.rarity === 'RARE' ? 32 : 22,
    facing: animal.facing,
    patrolPhase: 0,
    defeated: false,
    isOutdoorWild: animal.isOutdoorWild,
    sourceAnimalId: animal.id,
    tameEligible: animal.tameEligible,
    animalSpecies: animal.species,
  };
}

export const createBoarCombatMonster = createAnimalCombatMonster;

function calculateDamageToEnemy(
  player: PlayerState,
  enemy: CombatEnemyState,
  multiplier: number,
  element: ElementType,
  extraCritChance = 0,
  combatBuffs?: Pick<CombatState, 'playerAtkBuffTurns' | 'playerCritBuffTurns'>
): {
  damage: number;
  isCrit: boolean;
  effectivenessNote: string | null;
} {
  let rawAtk = (player.attack + (player.weaponDamage ?? 4)) * multiplier;

  if (combatBuffs && combatBuffs.playerAtkBuffTurns > 0) {
    rawAtk *= 1.25;
  }

  if (player.classId === 'warrior' && player.hp <= player.maxHp * 0.5) {
    rawAtk *= 1.25;
  }

  if (player.hunger <= 15 || player.thirst <= 15) {
    rawAtk *= 0.82;
  }

  let critChance =
    (typeof player.critChance === 'number' ? player.critChance : 0.08) +
    extraCritChance;
  if (combatBuffs && combatBuffs.playerCritBuffTurns > 0) {
    critChance += 0.2;
  }

  const isCrit = Math.random() < Math.min(0.95, critChance);
  if (isCrit) {
    rawAtk *= 1.65;
  }

  const effectiveDef =
    player.classId === 'mage' ? Math.floor(enemy.defense * 0.65) : enemy.defense;

  let dmg = Math.max(
    3,
    Math.round(rawAtk - effectiveDef * 0.55 + (Math.random() * 2 - 1))
  );

  let effectivenessNote: string | null = null;
  if (enemy.elementalWeakness.includes(element)) {
    dmg = Math.round(dmg * 1.35);
    effectivenessNote = 'Kelemahan Elemen!';
  } else if (enemy.elementalResistance.includes(element)) {
    dmg = Math.max(2, Math.round(dmg * 0.85));
    effectivenessNote = 'Musuh Tahan Elemen';
  }

  if (enemy.isGuarding) {
    dmg = Math.max(2, Math.floor(dmg * 0.5));
  }

  return { damage: dmg, isCrit, effectivenessNote };
}

function nextTurnAfterPlayer(player: PlayerState): CombatState['turn'] {
  return player.companion && player.companion.active ? 'COMPANION' : 'ENEMY';
}

/**
 * Companion Turn: player selects a tactical action for the active companion.
 * Respects role specialization (HEALER / DEFENDER / LUCK_SUPPORT never attack enemy).
 */
export function performCompanionAction(
  combat: CombatState,
  player: PlayerState,
  world: WorldState,
  actionId: string
): CombatState {
  if (combat.turn !== 'COMPANION') return combat;
  const comp = player.companion;
  if (!comp || !comp.active) {
    const fallback = cloneCombat(combat);
    fallback.turn = 'ENEMY';
    return fallback;
  }

  const actions = getCompanionActions(comp);
  const action = actions.find((a) => a.id === actionId) ?? actions[0];
  if (!action) {
    const fallback = cloneCombat(combat);
    fallback.turn = 'ENEMY';
    return fallback;
  }

  const cd = combat.companionCooldowns?.[action.id] ?? 0;
  if (cd > 0) {
    return appendLogOnly(combat, `${action.name} masih cooldown (${cd} giliran).`);
  }

  const now = Date.now();
  const next = cloneCombat(combat);
  if (!next.companionCooldowns) next.companionCooldowns = {};
  if (action.cooldownTurns > 0) {
    next.companionCooldowns[action.id] = action.cooldownTurns;
  }

  if (action.kind === 'ATTACK' && comp.role === 'ATTACKER') {
    if (action.id === 'wolf_howl') {
      next.playerAtkBuffTurns = Math.max(next.playerAtkBuffTurns, 2);
      next.playerCritBuffTurns = Math.max(next.playerCritBuffTurns, 2);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'NATURE',
        target: 'PLAYER',
        damageText: '+25% ATK',
        subText: '+Kritis',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} menggunakan ${action.name}: Serangan & peluang kritis meningkat selama 2 giliran!`,
      ];
      next.turn = 'ENEMY';
      return next;
    }

    const mult =
      action.id === 'wolf_savage' || action.id === 'boar_heavy' ? 1.48 : 1.05;
    const rawCompDmg = (comp.attack || 8) * mult + Math.random() * 3 - next.enemy.defense * 0.22;
    const compDmg = Math.max(4, Math.round(rawCompDmg));
    next.enemy.hp = Math.max(0, next.enemy.hp - compDmg);
    next.enemy.isGuarding = false;
    next.lastEnemyHitFlash = now;
    next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };

    let extra = '';
    if (action.id === 'wolf_savage') {
      next.enemy.statusEffects.push({ type: 'POISON', turns: 2, power: 4 });
      extra = ' (Musuh terluka -4 HP/g)';
    } else if (action.id === 'boar_heavy' && Math.random() < 0.6) {
      next.enemy.isStaggered = true;
      next.enemy.isPrepared = false;
      extra = ' (Musuh terguncang!)';
    }

    next.lastVfx = {
      id: nextVfxId(),
      kind: 'COMPANION_STRIKE',
      element: 'PHYSICAL',
      target: 'ENEMY',
      damageText: `-${compDmg}`,
      subText: comp.name,
      shakeIntensity: 5,
      hitStopMs: 25,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${comp.name} memakai ${action.name}: ${compDmg} damage!${extra}`,
    ];

    if (next.enemy.hp <= 0) {
      return resolveVictory(next, player, world);
    }
    next.turn = 'ENEMY';
    return next;
  }

  if (action.kind === 'HEAL') {
    const baseHeal = Math.max(8, comp.healPower || 12);
    if (action.id === 'heal_regen') {
      const tickHeal = Math.max(5, Math.round(baseHeal * 0.55));
      next.playerRegenTurns = 3;
      next.playerRegenAmount = tickHeal;
      player.hp = Math.min(player.maxHp, player.hp + tickHeal);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'NATURE',
        target: 'PLAYER',
        damageText: `+${tickHeal} HP`,
        subText: 'Regen 3g',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} mengaktifkan ${action.name}: +${tickHeal} HP sekarang & regenerasi 3 giliran!`,
      ];
    } else if (action.id === 'heal_purify') {
      player.mana = Math.min(player.maxMana, player.mana + 12);
      player.stamina = Math.min(player.maxStamina, player.stamina + 14);
      next.playerWardTurns = Math.max(next.playerWardTurns, 1);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'HOLY',
        target: 'PLAYER',
        damageText: '+12 MP · +14 STM',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} memakai ${action.name}: +12 MP, +14 Stamina, dan perlindungan cahaya!`,
      ];
    } else {
      player.hp = Math.min(player.maxHp, player.hp + baseHeal);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'NATURE',
        target: 'PLAYER',
        damageText: `+${baseHeal} HP`,
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} memulihkan penyintas dengan ${action.name} (+${baseHeal} HP)!`,
      ];
    }
    next.turn = 'ENEMY';
    return next;
  }

  if (action.kind === 'LUCK') {
    if (action.id === 'luck_treasure') {
      next.playerAtkBuffTurns = Math.max(next.playerAtkBuffTurns, 2);
      next.combatLuckBonus = Math.min(0.45, next.combatLuckBonus + 0.2);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'HOLY',
        target: 'PLAYER',
        damageText: 'TUAH +20%',
        subText: '+ATK',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} menggunakan ${action.name}: Peluang rampasan langka & seranganmu meningkat!`,
      ];
    } else {
      next.playerCritBuffTurns = Math.max(next.playerCritBuffTurns, 2);
      next.combatLuckBonus = Math.min(0.45, next.combatLuckBonus + 0.12);
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'HEAL',
        element: 'FIRE',
        target: 'PLAYER',
        damageText: '+20% KRITIS',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `${comp.name} memberkati dengan ${action.name}: +20% peluang Kritis & tuah barang!`,
      ];
    }
    next.turn = 'ENEMY';
    return next;
  }

  // DEFEND / GUARD actions
  if (action.id === 'def_shell') {
    next.playerWardTurns = Math.max(next.playerWardTurns, 2);
    next.companionShieldActive = true;
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'SHIELD',
      element: 'PHYSICAL',
      target: 'PLAYER',
      damageText: 'PERISAI 2G',
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${comp.name} menegakkan ${action.name}: Perlindungan aktif selama 2 giliran!`,
    ];
  } else if (action.id === 'def_fortify') {
    player.hp = Math.min(player.maxHp, player.hp + 6);
    player.stamina = Math.min(player.maxStamina, player.stamina + 14);
    next.companionShieldActive = true;
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'SHIELD',
      element: 'NATURE',
      target: 'PLAYER',
      damageText: '+6 HP · +14 STM',
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${comp.name} menggunakan ${action.name}: +6 HP, +14 Stamina & perisai ringan!`,
    ];
  } else {
    next.companionGuardActive = true;
    next.companionShieldActive = true;
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'SHIELD',
      element: 'PHYSICAL',
      target: 'PLAYER',
      damageText: 'LINDUNGI!',
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${comp.name} melompat melindungi penyintas (${action.name}: -50% damage masuk)!`,
    ];
  }

  next.turn = 'ENEMY';
  return next;
}

/**
 * Normal Quick Attack: 0 MP & 0 Stamina — always usable when player can act!
 */
export function performQuickAttack(
  combat: CombatState,
  player: PlayerState,
  world: WorldState
): CombatState {
  if (combat.turn !== 'PLAYER') return combat;

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;

  const finisherMult = next.enemy.hp <= next.enemy.maxHp * 0.35 ? 1.15 : 0.9;
  const { damage, isCrit } = calculateDamageToEnemy(
    player,
    next.enemy,
    finisherMult,
    'PHYSICAL',
    0.04,
    next
  );

  next.enemy.hp = Math.max(0, next.enemy.hp - damage);
  next.enemy.isGuarding = false;
  next.lastEnemyHitFlash = now;
  next.playerAnim = { state: 'ATTACK', startedAt: now };
  next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };

  let drainNote = '';
  if (player.classId === 'necromancer') {
    const drain = Math.max(1, Math.floor(damage * 0.25));
    player.hp = Math.min(player.maxHp, player.hp + drain);
    drainNote = ` · +${drain} HP`;
  }

  next.lastVfx = {
    id: nextVfxId(),
    kind: 'SLASH',
    element: 'PHYSICAL',
    target: 'ENEMY',
    damageText: `-${damage}`,
    isCritical: isCrit,
    subText: isCrit ? 'KRITIS!' : undefined,
    shakeIntensity: isCrit ? 6 : 3,
    hitStopMs: isCrit ? 45 : 0,
    createdAt: now,
  };

  next.log = [
    ...next.log.slice(-5),
    `Serang Cepat${isCrit ? ' [KRITIS!]' : ''}: ${damage} damage.${drainNote}`,
  ];

  if (next.enemy.hp <= 0) {
    return resolveVictory(next, player, world);
  }

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

/**
 * Heavy Attack: consumes Stamina (0 MP).
 */
export function performHeavyAttack(
  combat: CombatState,
  player: PlayerState,
  world: WorldState
): CombatState {
  if (combat.turn !== 'PLAYER') return combat;
  const staminaCost = player.classId === 'rogue' ? 12 : 16;
  if (player.stamina < staminaCost) {
    return appendLogOnly(
      combat,
      `Stamina kurang (${staminaCost} dibutuhkan) untuk Serang Berat!`
    );
  }

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;
  player.stamina = Math.max(0, player.stamina - staminaCost);

  const { damage, isCrit } = calculateDamageToEnemy(
    player,
    next.enemy,
    1.55,
    'PHYSICAL',
    0.05,
    next
  );

  next.enemy.hp = Math.max(0, next.enemy.hp - damage);
  next.enemy.isGuarding = false;

  let staggered = false;
  if (Math.random() < 0.42) {
    next.enemy.isStaggered = true;
    next.enemy.isPrepared = false;
    staggered = true;
  }

  next.lastEnemyHitFlash = now;
  next.playerAnim = { state: 'HEAVY_ATTACK', startedAt: now };
  next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };

  next.lastVfx = {
    id: nextVfxId(),
    kind: 'HEAVY_SLASH',
    element: 'PHYSICAL',
    target: 'ENEMY',
    damageText: `-${damage}`,
    isCritical: isCrit,
    subText: staggered ? 'TERGUNCANG!' : isCrit ? 'HANCUR!' : undefined,
    shakeIntensity: 9,
    hitStopMs: 65,
    createdAt: now,
  };

  next.log = [
    ...next.log.slice(-5),
    `Serang Berat${isCrit ? ' [KRITIS!]' : ''}: ${damage} damage!${
      staggered ? ' Musuh terguncang!' : ''
    }`,
  ];

  if (next.enemy.hp <= 0) {
    return resolveVictory(next, player, world);
  }

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

/**
 * Class Skills: all consume MP.
 */
export function performClassSkill(
  combat: CombatState,
  player: PlayerState,
  world: WorldState,
  skillId: string
): CombatState {
  if (combat.turn !== 'PLAYER') return combat;
  const cls = CHARACTER_CLASSES[player.classId];
  const skill: ClassSkillDef | undefined = cls.skills.find((s) => s.id === skillId);
  if (!skill) return combat;

  const cd = combat.skillCooldowns[skill.id] ?? 0;
  if (cd > 0) {
    return appendLogOnly(combat, `${skill.name} masih cooldown (${cd} giliran).`);
  }

  if (player.mana < skill.cost) {
    return appendLogOnly(
      combat,
      `MP tidak cukup untuk ${skill.name} (Butuh ${skill.cost} MP)!`
    );
  }

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;

  player.mana = Math.max(0, player.mana - skill.cost);
  next.skillCooldowns[skill.id] = skill.cooldownTurns;

  const isSpell =
    skill.element === 'FIRE' ||
    skill.element === 'ICE' ||
    skill.element === 'LIGHTNING' ||
    skill.element === 'NATURE' ||
    skill.element === 'HOLY' ||
    skill.element === 'DARK';

  next.playerAnim = {
    state: isSpell ? 'CAST_SPELL' : 'HEAVY_ATTACK',
    startedAt: now,
  };

  if (skill.damageMultiplier <= 0) {
    if (skill.healAmount) {
      player.hp = Math.min(player.maxHp, player.hp + skill.healAmount);
    }
    if (skill.id === 'healing_totem') {
      player.stamina = Math.min(player.maxStamina, player.stamina + 12);
    }
    if (skill.grantDefend) {
      next.playerDefending = true;
      next.playerWardTurns = Math.max(next.playerWardTurns, 1);
    }
    next.lastVfx = {
      id: nextVfxId(),
      kind: skill.healAmount ? 'HEAL' : 'SHIELD',
      element: skill.element,
      target: 'PLAYER',
      damageText: skill.healAmount ? `+${skill.healAmount} HP` : 'PERISAI',
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${skill.name}: ${
        skill.healAmount ? `Pulih +${skill.healAmount} HP` : 'Pertahanan aktif'
      }.`,
    ];
    next.turn = nextTurnAfterPlayer(player);
    return next;
  }

  const hits = skill.hits ?? 1;
  let totalDamage = 0;
  let anyCrit = false;
  let effNote: string | null = null;

  for (let i = 0; i < hits; i++) {
    let mult = skill.damageMultiplier;
    if (skill.id === 'backstab' && (next.enemy.isPrepared || next.enemy.isGuarding)) {
      mult = 1.95;
    }
    const res = calculateDamageToEnemy(
      player,
      next.enemy,
      mult,
      skill.element,
      skill.id === 'precise_shot' ? 0.25 : 0.06,
      next
    );
    totalDamage += res.damage;
    if (res.isCrit) anyCrit = true;
    if (res.effectivenessNote) effNote = res.effectivenessNote;
  }

  next.enemy.hp = Math.max(0, next.enemy.hp - totalDamage);
  next.enemy.isGuarding = false;
  next.lastEnemyHitFlash = now;
  next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };

  if (skill.lifestealRatio) {
    const heal = Math.max(2, Math.round(totalDamage * skill.lifestealRatio));
    player.hp = Math.min(player.maxHp, player.hp + heal);
  }
  if (skill.grantDefend) next.playerDefending = true;
  if (skill.grantDodgeBoost) next.playerDodging = true;

  let staggered = false;
  if (skill.staggerChance && Math.random() < skill.staggerChance) {
    next.enemy.isStaggered = true;
    next.enemy.isPrepared = false;
    staggered = true;
  }

  if (skill.statusEffect) {
    const existing = next.enemy.statusEffects.find(
      (e) => e.type === skill.statusEffect!.type
    );
    if (existing) {
      existing.turns = skill.statusEffect.turns;
    } else {
      next.enemy.statusEffects.push({ ...skill.statusEffect });
    }
  }

  next.lastVfx = {
    id: nextVfxId(),
    kind: isSpell || skill.element !== 'PHYSICAL' || skill.hits ? 'PROJECTILE' : 'HEAVY_SLASH',
    element: skill.element,
    target: 'ENEMY',
    damageText: `-${totalDamage}`,
    isCritical: anyCrit,
    subText: staggered ? 'TERGUNCANG!' : effNote ?? (anyCrit ? 'KRITIS!' : undefined),
    shakeIntensity: 8,
    hitStopMs: 55,
    createdAt: now,
  };

  next.log = [
    ...next.log.slice(-5),
    `${skill.name}${anyCrit ? ' [KRITIS!]' : ''}: ${totalDamage} damage${
      hits > 1 ? ` (${hits}x serangan)` : ''
    }${effNote ? ` · ${effNote}` : ''}${staggered ? ' · Musuh terguncang!' : ''}`,
  ];

  if (next.enemy.hp <= 0) {
    return resolveVictory(next, player, world);
  }

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

/**
 * Combat-Based Taming Attempt:
 * - Only available when enemy is tameEligible and HP <= 45%
 * - Consumes 1 food item; NEVER damages or kills the target animal!
 */
export function performTameAttempt(
  combat: CombatState,
  player: PlayerState,
  world: WorldState,
  foodItemId: ItemId
): CombatState {
  if (combat.turn !== 'PLAYER') return combat;
  const species = combat.enemy.animalSpecies;
  if (!combat.enemy.tameEligible || !species) {
    return appendLogOnly(combat, `${combat.enemy.name} tidak dapat dijinakkan.`);
  }
  const hpRatio = combat.enemy.hp / Math.max(1, combat.enemy.maxHp);
  if (hpRatio > TAME_HP_THRESHOLD) {
    return appendLogOnly(
      combat,
      `Lemahkan ${combat.enemy.name} hingga HP <= 45% sebelum memberi makan!`
    );
  }
  const qty = player.inventory[foodItemId] ?? 0;
  if (qty <= 0) {
    return appendLogOnly(combat, `Stok ${ITEMS[foodItemId].name} habis.`);
  }

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;
  player.inventory[foodItemId] = qty - 1;
  next.tameAttempts += 1;

  const { chance, dietMatch } = calculateTameProbability(species, hpRatio, foodItemId, player);
  const roll = Math.random() * 100;
  const cfg = COMPANION_SPECIES_CONFIG[species];

  next.playerAnim = { state: 'CAST_SPELL', startedAt: now };

  if (roll < chance) {
    const compId = combat.enemy.sourceAnimalId ?? combat.enemy.id;
    const setAsActive = player.companion === null;
    const companion = createCompanionFromSpecies(
      compId,
      species,
      player.x - 24,
      player.y + 12,
      player.facing,
      player.level,
      setAsActive
    );

    player.companions.push(companion);
    if (setAsActive) {
      player.companion = companion;
    }
    if (combat.enemy.sourceAnimalId) {
      world.tamedCreatures[combat.enemy.sourceAnimalId] = true;
    } else {
      world.defeatedMonsters[combat.enemy.id] = true;
    }
    player.tamingSkillLevel = Math.min(10, (player.tamingSkillLevel ?? 1) + 1);

    next.turn = 'TAMED';
    next.tamedCompanion = companion;
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'TAME_ATTEMPT',
      element: 'HOLY',
      target: 'ENEMY',
      damageText: 'BERHASIL JINAK!',
      subText: `${cfg.displayName} Bergabung`,
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-4),
      `Kamu memberi ${ITEMS[foodItemId].name} (peluang ${chance}%). ${cfg.displayName} luluh dan menjadi pendampingmu!`,
    ];
    return next;
  }

  // Failed attempt — never damages or kills animal; allows retrying if player survives
  const reactionHint =
    dietMatch === 'PREFERRED'
      ? 'Ia menyukai makanan ini, coba lagi!'
      : dietMatch === 'DISLIKED'
      ? `Ia kurang suka ${ITEMS[foodItemId].name}.`
      : 'Hampir berhasil, coba beri makan lagi!';

  next.lastVfx = {
    id: nextVfxId(),
    kind: 'TAME_ATTEMPT',
    element: 'NATURE',
    target: 'ENEMY',
    damageText: 'MENOLAK...',
    subText: `Peluang ${chance}%`,
    shakeIntensity: 0,
    hitStopMs: 0,
    createdAt: now,
  };
  next.log = [
    ...next.log.slice(-4),
    `Memberi ${ITEMS[foodItemId].name} (peluang ${chance}%) — gagal. ${reactionHint}`,
  ];
  next.turn = nextTurnAfterPlayer(player);
  return next;
}

export function performPlayerDefend(combat: CombatState, player: PlayerState): CombatState {
  if (combat.turn !== 'PLAYER') return combat;

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = true;
  next.playerDodging = false;
  player.stamina = Math.min(player.maxStamina, player.stamina + 16);
  player.mana = Math.min(player.maxMana, player.mana + 7);
  next.playerAnim = { state: 'DEFEND', startedAt: now };

  const baseMsg =
    player.classId === 'paladin'
      ? 'Perisai Cahaya aktif (+6 HP, +16 Stamina, +7 MP, -72% damage masuk).'
      : 'Posisi Bertahan aktif (+16 Stamina, +7 MP, -55% damage masuk).';

  if (player.classId === 'paladin') {
    player.hp = Math.min(player.maxHp, player.hp + 6);
  }

  next.log = [...next.log.slice(-5), baseMsg];

  next.lastVfx = {
    id: nextVfxId(),
    kind: 'SHIELD',
    element: player.classId === 'paladin' ? 'HOLY' : 'PHYSICAL',
    target: 'PLAYER',
    damageText: 'BERTAHAN',
    shakeIntensity: 0,
    hitStopMs: 0,
    createdAt: now,
  };

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

export function performPlayerDodge(combat: CombatState, player: PlayerState): CombatState {
  if (combat.turn !== 'PLAYER') return combat;
  const staminaCost = player.classId === 'rogue' ? 9 : 12;
  if (player.stamina < staminaCost) {
    return appendLogOnly(combat, 'Stamina tidak cukup untuk Menghindar!');
  }

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = true;
  player.stamina = Math.max(0, player.stamina - staminaCost);
  next.playerAnim = { state: 'DODGE', startedAt: now };

  next.lastVfx = {
    id: nextVfxId(),
    kind: 'DODGE',
    element: 'PHYSICAL',
    target: 'PLAYER',
    damageText: 'SIAP ELAK',
    shakeIntensity: 0,
    hitStopMs: 0,
    createdAt: now,
  };

  next.log = [
    ...next.log.slice(-5),
    'Kamu merendahkan kuda-kuda untuk menghindari serangan musuh berikutnya!',
  ];

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

export function performPlayerUseItem(
  combat: CombatState,
  player: PlayerState,
  world: WorldState,
  itemId: ItemId
): CombatState {
  if (combat.turn !== 'PLAYER') return combat;
  const count = player.inventory[itemId] ?? 0;
  if (count <= 0) return combat;

  const def = ITEMS[itemId];
  if (!def.usableInCombat) return combat;

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;
  player.inventory[itemId] = count - 1;

  if (def.combatDamage) {
    const dmg = def.combatDamage;
    next.enemy.hp = Math.max(0, next.enemy.hp - dmg);
    next.lastEnemyHitFlash = now;
    next.playerAnim = { state: 'ATTACK', startedAt: now };
    next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'PROJECTILE',
      element: itemId === 'ramuan_racun' || itemId === 'ikan_beracun' ? 'POISON' : 'PHYSICAL',
      target: 'ENEMY',
      damageText: `-${dmg}`,
      shakeIntensity: 5,
      hitStopMs: 30,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `Kamu melempar ${def.name} dan memberi ${dmg} damage!`,
    ];
    if (next.enemy.hp <= 0) {
      return resolveVictory(next, player, world);
    }
  } else {
    const shamanMult = player.classId === 'shaman' && itemId === 'beri' ? 1.45 : 1;
    const heal = def.healHp ? Math.round(def.healHp * shamanMult) : 0;
    const manaGain = def.restoreMana ?? 0;
    const hungerGain = def.restoreHunger ? Math.round(def.restoreHunger * shamanMult) : 0;
    const thirstGain = def.restoreThirst ?? 0;
    const staminaGain = def.restoreStamina ?? 0;

    if (heal > 0) player.hp = Math.min(player.maxHp, player.hp + heal);
    if (manaGain > 0) player.mana = Math.min(player.maxMana, player.mana + manaGain);
    if (hungerGain > 0) player.hunger = Math.min(player.maxHunger, player.hunger + hungerGain);
    if (thirstGain > 0) player.thirst = Math.min(player.maxThirst, player.thirst + thirstGain);
    if (staminaGain > 0) player.stamina = Math.min(player.maxStamina, player.stamina + staminaGain);

    next.playerAnim = { state: 'CAST_SPELL', startedAt: now };
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'HEAL',
      element: 'NATURE',
      target: 'PLAYER',
      damageText: heal > 0 ? `+${heal} HP` : manaGain > 0 ? `+${manaGain} MP` : `+${staminaGain} STM`,
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };

    const parts: string[] = [];
    if (heal > 0) parts.push(`+${heal} HP`);
    if (manaGain > 0) parts.push(`+${manaGain} MP`);
    if (hungerGain > 0) parts.push(`+${hungerGain} Lapar`);
    if (thirstGain > 0) parts.push(`+${thirstGain} Haus`);
    if (staminaGain > 0) parts.push(`+${staminaGain} Stamina`);

    next.log = [...next.log.slice(-5), `Menggunakan ${def.name} (${parts.join(', ')}).`];
  }

  next.turn = nextTurnAfterPlayer(player);
  return next;
}

export function performPlayerEscape(combat: CombatState, player: PlayerState): CombatState {
  if (combat.turn !== 'PLAYER') return combat;

  const now = Date.now();
  const next = cloneCombat(combat);
  next.playerDefending = false;
  next.playerDodging = false;

  let escapeChance = 0.7;
  if (player.classId === 'archer' || player.classId === 'rogue') {
    escapeChance += 0.18;
  }

  if (Math.random() < escapeChance) {
    next.turn = 'ESCAPED';
    next.playerAnim = { state: 'DODGE', startedAt: now };
    next.log = [...next.log.slice(-5), 'Kamu berhasil menyelinap kabur ke balik pepohonan!'];
  } else {
    next.log = [...next.log.slice(-5), `Gagal melarikan diri! ${next.enemy.name} menutup jalanmu.`];
    next.turn = 'ENEMY';
  }
  return next;
}

export function performEnemyTurn(
  combat: CombatState,
  player: PlayerState,
  world?: WorldState
): CombatState {
  if (combat.turn !== 'ENEMY') return combat;

  const now = Date.now();
  const next = cloneCombat(combat);

  if (next.enemy.statusEffects.length > 0) {
    let dotDamage = 0;
    const activeNotes: string[] = [];
    const remaining = [];
    for (const eff of next.enemy.statusEffects) {
      if (eff.type === 'BURN' || eff.type === 'POISON') {
        dotDamage += eff.power;
        activeNotes.push(eff.type === 'BURN' ? `Terbakar -${eff.power}` : `Racun -${eff.power}`);
      }
      if (eff.turns - 1 > 0) {
        remaining.push({ ...eff, turns: eff.turns - 1 });
      }
    }
    next.enemy.statusEffects = remaining;
    if (dotDamage > 0) {
      next.enemy.hp = Math.max(0, next.enemy.hp - dotDamage);
      next.log = [...next.log.slice(-5), `Efek status: ${activeNotes.join(', ')} HP musuh.`];
      if (next.enemy.hp <= 0 && world) {
        return resolveVictory(next, player, world);
      }
    }
  }

  for (const key of Object.keys(next.skillCooldowns)) {
    if (next.skillCooldowns[key] > 0) {
      next.skillCooldowns[key] -= 1;
    }
  }
  if (next.companionCooldowns) {
    for (const key of Object.keys(next.companionCooldowns)) {
      if (next.companionCooldowns[key] > 0) {
        next.companionCooldowns[key] -= 1;
      }
    }
  }
  if (next.playerWardTurns > 0) {
    next.playerWardTurns -= 1;
  }
  if (next.companionCooldown > 0) {
    next.companionCooldown -= 1;
  }
  if (next.playerAtkBuffTurns > 0) {
    next.playerAtkBuffTurns -= 1;
  }
  if (next.playerCritBuffTurns > 0) {
    next.playerCritBuffTurns -= 1;
  }
  if (next.playerRegenTurns > 0) {
    next.playerRegenTurns -= 1;
    if (next.playerRegenAmount > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + next.playerRegenAmount);
    }
  }

  if (next.enemy.isStaggered) {
    next.enemy.isStaggered = false;
    next.enemy.isPrepared = false;
    next.playerDefending = false;
    next.playerDodging = false;
    next.companionShieldActive = false;
    next.companionGuardActive = false;
    next.enemyAnim = { state: 'TAKE_DAMAGE', startedAt: now };
    applyCombatTurnRegen(player);
    next.turnCount += 1;
    next.enemy.intent = chooseNextEnemyIntent(next.enemy, next.turnCount);
    next.turn = 'PLAYER';
    next.log = [
      ...next.log.slice(-5),
      `${next.enemy.name} masih terguncang dan gagal menyerang!`,
    ];
    return next;
  }

  const executedIntent = next.enemy.intent;

  if (executedIntent === 'DEFENSIVE_STANCE') {
    next.enemy.isGuarding = true;
    next.enemyAnim = { state: 'DEFEND', startedAt: now };
    next.lastVfx = {
      id: nextVfxId(),
      kind: 'SHIELD',
      element: 'PHYSICAL',
      target: 'ENEMY',
      damageText: 'BERTAHAN',
      shakeIntensity: 0,
      hitStopMs: 0,
      createdAt: now,
    };
    next.log = [
      ...next.log.slice(-5),
      `${next.enemy.name} merapatkan pertahanan!`,
    ];
  } else if (executedIntent === 'PREPARE_ATTACK') {
    next.enemy.isPrepared = true;
    next.enemyAnim = { state: 'CAST_SPELL', startedAt: now };
    next.log = [
      ...next.log.slice(-5),
      `${next.enemy.name} mengumpulkan tenaga — serangan berikutnya sangat kuat!`,
    ];
  } else {
    const isHeavy = executedIntent === 'HEAVY_ATTACK';
    const wasPrepared = next.enemy.isPrepared;
    next.enemy.isPrepared = false;

    next.enemyAnim = {
      state: isHeavy ? 'HEAVY_ATTACK' : 'ATTACK',
      startedAt: now,
    };

    let dodgeChance = 0;
    if (next.playerDodging) {
      dodgeChance =
        0.72 + (player.classId === 'rogue' ? 0.16 : player.classId === 'archer' ? 0.12 : 0);
    }

    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      next.playerAnim = { state: 'DODGE', startedAt: now };
      next.lastVfx = {
        id: nextVfxId(),
        kind: 'DODGE',
        element: 'PHYSICAL',
        target: 'PLAYER',
        damageText: 'TERHINDAR!',
        shakeIntensity: 0,
        hitStopMs: 0,
        createdAt: now,
      };
      next.log = [
        ...next.log.slice(-5),
        `Kamu melompat menghindar tepat waktu dari serangan ${next.enemy.name}!`,
      ];
    } else {
      const mult = isHeavy ? (wasPrepared ? 1.75 : 1.38) : 1.0;
      const rawEnemyAtk = Math.round(next.enemy.attack * mult);
      const compDefBonus =
        player.companion?.active && player.companion.role === 'DEFENDER'
          ? player.companion.defenseBonus
          : 0;
      let dmg = Math.max(2, rawEnemyAtk - Math.floor((player.defense + compDefBonus) * 0.55));

      if (next.playerDefending || next.playerWardTurns > 0) {
        const reduction = player.classId === 'paladin' ? 0.28 : 0.45;
        dmg = Math.max(1, Math.floor(dmg * reduction));
      }

      if (next.companionGuardActive) {
        dmg = Math.max(1, Math.floor(dmg * 0.5));
      } else if (next.companionShieldActive) {
        dmg = Math.max(1, Math.floor(dmg * 0.7));
      }

      player.hp = Math.max(0, player.hp - dmg);
      next.lastPlayerHitFlash = now;
      next.playerAnim = {
        state: player.hp <= 0 ? 'DEATH' : 'TAKE_DAMAGE',
        startedAt: now,
      };

      next.lastVfx = {
        id: nextVfxId(),
        kind: 'ENEMY_STRIKE',
        element: isHeavy ? 'DARK' : 'PHYSICAL',
        target: 'PLAYER',
        damageText: `-${dmg}`,
        isCritical: isHeavy,
        shakeIntensity: isHeavy ? 8 : 4,
        hitStopMs: isHeavy ? 50 : 0,
        createdAt: now,
      };

      const label = isHeavy ? 'Serangan Berat' : 'serangan';
      next.log = [
        ...next.log.slice(-5),
        `${next.enemy.name} melancarkan ${label} dan memberi ${dmg} damage!`,
      ];

      if (player.hp <= 0) {
        next.turn = 'DEFEAT';
        next.log = [...next.log.slice(-5), 'Bara kehidupanmu padam di Hutan Terlupakan...'];
        return next;
      }
    }
  }

  applyCombatTurnRegen(player);

  next.playerDefending = false;
  next.playerDodging = false;
  next.companionShieldActive = false;
  next.companionGuardActive = false;
  next.turnCount += 1;
  next.enemy.intent = chooseNextEnemyIntent(next.enemy, next.turnCount);
  next.turn = 'PLAYER';
  return next;
}

function applyCombatTurnRegen(player: PlayerState) {
  if (player.hunger > 25 && player.thirst > 25) {
    if (player.hunger > 60 && player.thirst > 60 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
    }
    const mpGain = 2 + Math.round(player.bonusManaRegen ?? 0);
    player.mana = Math.min(player.maxMana, player.mana + mpGain);
  }
}

function resolveVictory(
  combat: CombatState,
  player: PlayerState,
  world: WorldState
): CombatState {
  const now = Date.now();
  combat.turn = 'VICTORY';
  combat.enemyAnim = { state: 'DEATH', startedAt: now };

  if (combat.enemy.sourceAnimalId) {
    world.defeatedAnimals[combat.enemy.sourceAnimalId] = true;
    player.animalsHunted = (player.animalsHunted ?? 0) + 1;
  } else {
    world.defeatedMonsters[combat.enemy.id] = true;
    player.monstersDefeated += 1;
  }

  if (player.classId === 'mage') {
    player.hp = Math.min(player.maxHp, player.hp + 5);
  }
  player.mana = Math.min(player.maxMana, player.mana + 6);

  const expGained = combat.enemy.expReward;
  player.exp += expGained;

  let leveledUp = false;
  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level += 1;
    player.expToNext = Math.round(player.expToNext * 1.45);
    player.maxHp += 10;
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player.maxMana += 5;
    player.mana = player.maxMana;
    player.stamina = player.maxStamina;
    leveledUp = true;
  }

  if (leveledUp) {
    recalculatePlayerStats(player);
  }

  grantCompanionExp(player, Math.max(8, Math.round(expGained * 0.65)));

  const drops = rollEnemyLoot(combat.enemy.type, player);
  for (const drop of drops) {
    grantInventoryItem(player, drop.itemId, drop.quantity);
  }

  const goldGained = rollGoldReward(
    combat.enemy.type,
    expGained,
    Boolean(combat.enemy.sourceAnimalId),
    player
  );
  player.gold = (player.gold ?? 0) + goldGained;

  combat.rewardSummary = {
    expGained,
    goldGained,
    leveledUp,
    newLevel: player.level,
    drops,
  };

  combat.log = [
    ...combat.log.slice(-4),
    `${combat.enemy.name} kalah! (+${expGained} EXP · +${goldGained} Emas${
      leveledUp ? ` · NAIK LEVEL ${player.level}!` : ''
    })`,
  ];

  return combat;
}

function appendLogOnly(combat: CombatState, msg: string): CombatState {
  const next = cloneCombat(combat);
  next.log = [...next.log.slice(-5), msg];
  return next;
}

function cloneCombat(c: CombatState): CombatState {
  return {
    ...c,
    enemy: {
      ...c.enemy,
      statusEffects: c.enemy.statusEffects.map((s) => ({ ...s })),
    },
    skillCooldowns: { ...c.skillCooldowns },
    companionCooldowns: { ...(c.companionCooldowns ?? {}) },
    log: [...c.log],
  };
}
