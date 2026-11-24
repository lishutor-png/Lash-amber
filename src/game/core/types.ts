export type CharacterClassId =
  | 'villager'
  | 'warrior'
  | 'archer'
  | 'mage'
  | 'shaman'
  | 'necromancer'
  | 'paladin'
  | 'rogue';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type ElementType =
  | 'PHYSICAL'
  | 'FIRE'
  | 'ICE'
  | 'LIGHTNING'
  | 'NATURE'
  | 'HOLY'
  | 'DARK'
  | 'POISON';

export type CharacterAnimState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'ATTACK'
  | 'HEAVY_ATTACK'
  | 'TAKE_DAMAGE'
  | 'DODGE'
  | 'CAST_SPELL'
  | 'DEFEND'
  | 'DEATH';

export type EnemyIntentType =
  | 'NORMAL_ATTACK'
  | 'HEAVY_ATTACK'
  | 'DEFENSIVE_STANCE'
  | 'PREPARE_ATTACK';

export type TileType =
  | 'GRASS'
  | 'FOREST_FLOOR'
  | 'CLEARING'
  | 'TRAIL'
  | 'WATER'
  | 'CLIFF'
  | 'RUIN_STONE'
  | 'TREE'
  | 'ROCK'
  | 'PLANT'
  | 'SAND'
  | 'SNOW'
  | 'ICE'
  | 'LAVA'
  | 'ASH'
  | 'SAVANNA_GRASS'
  | 'ROAD'
  | 'WOOD_FLOOR';

export type BiomeId =
  | 'FORGOTTEN_FOREST'
  | 'GREEN_SAVANNA'
  | 'VERDANT_GRASSLANDS'
  | 'FROZEN_HIGHLANDS'
  | 'DEEPWOOD'
  | 'SCORCHED_DESERT'
  | 'FALLEN_KINGDOM'
  | 'ASHEN_VOLCANO'
  | 'ANCIENT_MOUNTAINS';

export type EnvironmentHazard =
  | 'NONE'
  | 'COLD'
  | 'EXTREME_COLD'
  | 'HEAT'
  | 'EXTREME_HEAT'
  | 'VOLCANIC'
  | 'POISON';

export type WeatherKind = 'CLEAR' | 'SNOW' | 'ASH' | 'HEATWAVE' | 'MIST' | 'RAIN';

export type SettlementKind =
  | 'NONE'
  | 'TRADING_OUTPOST'
  | 'MERCHANT_VILLAGE'
  | 'BLACKSMITH'
  | 'ALCHEMIST'
  | 'RARE_TRADER'
  | 'DUNGEON'
  | 'CAVE'
  | 'BOSS_LAIR';

export type MerchantRoleKind =
  | 'TRADING_OUTPOST'
  | 'MERCHANT_VILLAGE'
  | 'BLACKSMITH'
  | 'ALCHEMIST'
  | 'RARE_TRADER';

export type TreeSpecies =
  | 'YOUNG'
  | 'OAK'
  | 'PINE'
  | 'BIRCH'
  | 'DEAD'
  | 'ANCIENT'
  | 'BUSH_TREE'
  | 'FRUIT_TREE'
  | 'CORRUPTED'
  | 'ACACIA'
  | 'CACTUS'
  | 'SNOW_PINE'
  | 'CHARRED';

export type PlantSpecies =
  | 'WILD_GRASS'
  | 'MEDICINAL_HERB'
  | 'WILD_VEGETABLE'
  | 'BERRY_BUSH'
  | 'MUSHROOM'
  | 'SEED_SPROUT'
  | 'SPECIAL_PLANT'
  | 'DESERT_HERB'
  | 'FROST_BLOOM'
  | 'ASH_FERN';

export type MineralSpecies =
  | 'STONE'
  | 'IRON'
  | 'GOLD'
  | 'COPPER'
  | 'COAL'
  | 'OBSIDIAN'
  | 'ICE_CRYSTAL';

export type ResourceKind = 'TREE' | 'MINERAL' | 'PLANT' | 'WATER';

export type AnimalSpecies =
  | 'DEER'
  | 'SPIRIT_DEER'
  | 'BOAR'
  | 'WOLF'
  | 'RABBIT'
  | 'BIRD'
  | 'EMBER_FOX'
  | 'TURTLE'
  | 'GAZELLE'
  | 'HYENA'
  | 'SNOW_WOLF'
  | 'ARCTIC_FOX'
  | 'MOUNTAIN_GOAT'
  | 'DIRE_WOLF'
  | 'DESERT_FOX'
  | 'SCORPION'
  | 'FIRE_BEAST'
  | 'EAGLE';

export type EnemyType =
  | 'FOREST_SKELETON'
  | 'WILD_BOAR'
  | 'FOREST_WOLF'
  | 'SLIME'
  | 'GOBLIN'
  | 'DARK_CREATURE'
  | 'SPIRIT_DEER'
  | 'EMBER_FOX'
  | 'TURTLE'
  | 'DEER'
  | 'FROST_GOLEM'
  | 'DESERT_SCORPION'
  | 'MAGMA_FIEND'
  | 'SAVANNA_HYENA'
  | 'UNDEAD_KNIGHT'
  | 'CAVE_TROLL'
  | 'CORRUPTED_STAG'
  | 'DIRE_WOLF';

export type CompanionRole = 'ATTACKER' | 'HEALER' | 'LUCK_SUPPORT' | 'DEFENDER';
export type CompanionRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';
export type CompanionDiet = 'CARNIVORE' | 'HERBIVORE' | 'OMNIVORE';
export type LootRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type ItemId =
  | 'kayu'
  | 'batu'
  | 'bijih_besi'
  | 'bijih_emas'
  | 'bijih_tembaga'
  | 'batu_bara'
  | 'obsidian'
  | 'kristal_es'
  | 'abu_vulkanik'
  | 'rumput_liar'
  | 'herba_obat'
  | 'sayur_liar'
  | 'beri'
  | 'jamur'
  | 'benih'
  | 'tanaman_langka'
  | 'daging_mentah'
  | 'kulit'
  | 'tulang'
  | 'bulu'
  | 'taring_kalajengking'
  | 'ikan_kecil'
  | 'ikan_sungai'
  | 'ikan_kolam'
  | 'ikan_emas'
  | 'ikan_mistis'
  | 'ikan_beracun'
  | 'ikan_panggang'
  | 'daging_masak'
  | 'sup_sayur'
  | 'sup_ikan'
  | 'hidangan_beri'
  | 'ramuan_sembuh'
  | 'ramuan_pulih'
  | 'ramuan_bara'
  | 'ramuan_racun'
  | 'ramuan_hangat'
  | 'ramuan_pendingin'
  | 'ramuan_tahan_api'
  | 'penawar_racun'
  | 'kapak_batu'
  | 'beliung_batu'
  | 'pancing_dasar'
  | 'umpan_pancing'
  | 'obor'
  | 'tombak_kayu'
  | 'pisau_batu'
  | 'busur_kayu'
  | 'pedang_karat'
  | 'senjata_tempa'
  | 'zirah_kain'
  | 'zirah_kulit'
  | 'jubah_bulu'
  | 'pakaian_gurun'
  | 'zirah_tahan_api'
  | 'perisai_kayu'
  | 'perisai_besi'
  | 'helm_kulit'
  | 'helm_besi'
  | 'topeng_racun'
  | 'sarung_kulit'
  | 'sarung_besi'
  | 'sepatu_kulit'
  | 'sepatu_besi'
  | 'sepatu_hangat'
  | 'sepatu_pasir'
  | 'sepatu_vulkanik'
  | 'jimat_pelindung'
  | 'jubah_penangkal'
  | 'papan_kayu'
  | 'balok_batu'
  | 'koin_kuno'
  | 'pecahan_zirah'
  | 'kulit_serigala'
  | 'taring'
  | 'lendir_slime'
  | 'inti_slime'
  | 'kain_goblin'
  | 'esensi_gelap'
  | 'relik_terkutuk';

export type CraftingCategory =
  | 'FOOD'
  | 'MEDICINE'
  | 'TOOLS'
  | 'WEAPONS'
  | 'EQUIPMENT'
  | 'SURVIVAL'
  | 'BUILDING';

export type ScreenRoute =
  | 'SPLASH'
  | 'MAIN_MENU'
  | 'CHARACTER_SELECT'
  | 'LOAD_GAME'
  | 'COLLECTION'
  | 'SETTINGS'
  | 'CREDITS'
  | 'PLAYING';

export type WeaponVisualKind =
  | 'SICKLE'
  | 'SWORD'
  | 'BOW'
  | 'STAFF'
  | 'TOTEM'
  | 'SCYTHE'
  | 'HAMMER'
  | 'DAGGERS'
  | 'FORGED_BLADE'
  | 'SPEAR'
  | 'KNIFE';

export type ArmorVisualKind = 'CLOTH' | 'LEATHER' | 'PLATE' | 'ROBE' | 'REINFORCED';
export type OffhandVisualKind = 'NONE' | 'WOOD_SHIELD' | 'IRON_SHIELD';
export type HelmetVisualKind = 'NONE' | 'LEATHER_HELM' | 'IRON_HELM';

export type EquipmentSlot =
  | 'WEAPON'
  | 'OFFHAND'
  | 'HELMET'
  | 'CHEST'
  | 'GLOVES'
  | 'BOOTS'
  | 'ACCESSORY';

export type InventoryFilterCategory =
  | 'ALL'
  | 'WEAPONS'
  | 'ARMOR'
  | 'MATERIALS'
  | 'FOOD'
  | 'POTIONS'
  | 'TOOLS'
  | 'MISCELLANEOUS';

export type InventorySortMode = 'NEWEST' | 'NAME' | 'RARITY' | 'QUANTITY';
export type CameraZoomLevel = 'VERY_CLOSE' | 'CLOSE' | 'NORMAL' | 'FAR';

export interface ClassSkillDef {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  resourceType: 'MANA';
  cost: number;
  cooldownTurns: number;
  damageMultiplier: number;
  hits?: number;
  staggerChance?: number;
  healAmount?: number;
  lifestealRatio?: number;
  grantDefend?: boolean;
  grantDodgeBoost?: boolean;
  statusEffect?: {
    type: 'BURN' | 'FROST' | 'POISON';
    turns: number;
    power: number;
  };
}

export interface CharacterClassDef {
  id: CharacterClassId;
  name: string;
  title: string;
  description: string;
  baseHp: number;
  baseMana: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  weaponDamage: number;
  weaponVisual: WeaponVisualKind;
  armorVisual: ArmorVisualKind;
  startingEquipment: string[];
  passiveName: string;
  passiveDescription: string;
  skills: ClassSkillDef[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
  };
}

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  category: 'MATERIAL' | 'CONSUMABLE' | 'COMBAT' | 'TOOL' | 'EQUIPMENT';
  inventoryGroup?: InventoryFilterCategory;
  usableInExploration: boolean;
  usableInCombat: boolean;
  healHp?: number;
  restoreMana?: number;
  restoreHunger?: number;
  restoreThirst?: number;
  restoreStamina?: number;
  combatDamage?: number;
  equipSlot?: EquipmentSlot | 'ARMOR';
  weaponVisual?: WeaponVisualKind;
  armorVisual?: ArmorVisualKind;
  offhandVisual?: OffhandVisualKind;
  helmetVisual?: HelmetVisualKind;
  bonusAtk?: number;
  bonusDef?: number;
  bonusManaRegen?: number;
  critBonus?: number;
  speedBonus?: number;
  coldResist?: number;
  heatResist?: number;
  fireResist?: number;
  poisonResist?: number;
  buffDurationSeconds?: number;
  buffType?: 'COLD_RESIST' | 'HEAT_RESIST' | 'FIRE_RESIST' | 'POISON_RESIST';
  basePrice?: number;
  rarity?: LootRarity;
  isPetFood?: boolean;
  foodQuality?: number;
}

export interface ResourceNode {
  id: string;
  kind: ResourceKind;
  treeSpecies?: TreeSpecies;
  plantSpecies?: PlantSpecies;
  mineralSpecies?: MineralSpecies;
  tileX: number;
  tileY: number;
  remaining: number;
  maxAmount: number;
  requiresTool?: 'AXE' | 'PICKAXE';
}

export type WildlifeBehaviorState =
  | 'ROAM'
  | 'GRAZE'
  | 'DRINK'
  | 'REST'
  | 'FLEE'
  | 'HUNT'
  | 'DEFEND';

export interface WildlifeEntity {
  id: string;
  species: AnimalSpecies;
  name: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  hp: number;
  maxHp: number;
  baseMaxHp: number;
  attack: number;
  baseAttack: number;
  speed: number;
  temperament: 'FLEE' | 'AGGRESSIVE' | 'TAMEABLE';
  tameEligible: boolean;
  rarity: CompanionRarity;
  facing: Direction;
  vx: number;
  vy: number;
  aiTimer: number;
  isEating?: boolean;
  behaviorState: WildlifeBehaviorState;
  activeTime: 'DAY' | 'NIGHT' | 'ANY';
  isOutdoorWild: boolean;
  hitFlashUntil: number;
  defeated: boolean;
  tamed?: boolean;
}

export interface MonsterEntity {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  hp: number;
  maxHp: number;
  baseMaxHp: number;
  attack: number;
  baseAttack: number;
  defense: number;
  baseDefense: number;
  speed: number;
  expReward: number;
  facing: Direction;
  patrolPhase: number;
  defeated: boolean;
  isOutdoorWild: boolean;
  isIndoor?: boolean;
  isSafeZone?: boolean;
  sourceAnimalId?: string;
  tameEligible?: boolean;
  animalSpecies?: AnimalSpecies;
}

export interface MerchantStockEntry {
  itemId: ItemId;
  price: number;
  stock: number;
  maxStock: number;
}

export interface MerchantEntity {
  id: string;
  kind: MerchantRoleKind;
  name: string;
  title: string;
  greeting: string;
  x: number;
  y: number;
  regionKey: string;
  stock: MerchantStockEntry[];
  lastRestockedAtGameSeconds: number;
  goldReserve: number;
}

export interface GroundLootItem {
  id: string;
  itemId: ItemId;
  quantity: number;
  rarity: LootRarity;
  x: number;
  y: number;
  spawnedAt: number;
}

export interface RegionExit {
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  tileX: number;
  tileY: number;
  targetRX: number;
  targetRY: number;
  targetName: string;
}

export interface RegionData {
  key: string;
  rx: number;
  ry: number;
  name: string;
  subAreaName: string;
  description: string;
  biomeId: BiomeId;
  biomeTheme: 'FOREST' | 'CLIFFS' | 'RIVER' | 'RUINS' | 'HILLS';
  hazard: EnvironmentHazard;
  weather: WeatherKind;
  isSafeZone?: boolean;
  isIndoor?: boolean;
  settlementKind: SettlementKind;
  width: number;
  height: number;
  tiles: TileType[][];
  tileVariants: number[][];
  resources: ResourceNode[];
  resourceByTile: Map<string, ResourceNode>;
  monsters: MonsterEntity[];
  wildlife: WildlifeEntity[];
  merchants: MerchantEntity[];
  groundLoot: GroundLootItem[];
  exits: RegionExit[];
}

export interface CompanionState {
  id: string;
  species: AnimalSpecies;
  name: string;
  role: CompanionRole;
  rarity: CompanionRarity;
  diet: CompanionDiet;
  foodPreferences: ItemId[];
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  attack: number;
  defenseBonus: number;
  healPower: number;
  luckBonus: number; // e.g., 0.25 = +25% relative rare boost
  abilityName: string;
  abilityDescription: string;
  tamedAt: number;
  status: 'ACTIVE' | 'STORED' | 'RESTING';
  active: boolean;
  x: number;
  y: number;
  facing: Direction;
}

export interface PlayerActiveBuffs {
  coldResistUntil?: number;
  heatResistUntil?: number;
  fireResistUntil?: number;
  poisonResistUntil?: number;
}

export interface PlayerState {
  classId: CharacterClassId;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  x: number;
  y: number;
  facing: Direction;
  isMoving: boolean;
  animTime: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina: number;
  maxStamina: number;
  waterCharges: number;
  maxWaterCharges: number;
  attack: number;
  defense: number;
  speed: number;
  weaponDamage: number;
  bonusManaRegen: number;
  coldResist: number;
  heatResist: number;
  fireResist: number;
  poisonResist: number;
  activeBuffs?: PlayerActiveBuffs;
  equippedWeaponVisual?: WeaponVisualKind;
  equippedArmorVisual?: ArmorVisualKind;
  equippedOffhandVisual?: OffhandVisualKind;
  equippedHelmetVisual?: HelmetVisualKind;
  equippedSlots: Partial<Record<EquipmentSlot, ItemId | null>>;
  critChance: number;
  equipment: string[];
  hasAxe: boolean;
  hasPickaxe: boolean;
  hasFishingRod: boolean;
  tamingSkillLevel: number;
  fishingSkillLevel: number;
  fishCaught: number;
  inventory: Record<ItemId, number>;
  newlyAcquiredItems?: Partial<Record<ItemId, boolean>>;
  itemAcquiredOrder?: Partial<Record<ItemId, number>>;
  itemAcquiredSeq?: number;
  worldAttackStartedAt?: number;
  worldAttackUntil?: number;
  monstersDefeated: number;
  animalsHunted: number;
  resourcesGathered: number;
  craftedCount: number;
  torchSecondsRemaining: number;
  companion: CompanionState | null;
  companions: CompanionState[];
  kennelBuilt: boolean;
  kennelCapacity: number;
}

export interface RegionLandmark {
  id: string;
  kind:
    | 'WATER'
    | 'FISHING'
    | 'RUINS'
    | 'EXIT'
    | 'GOLD_VEIN'
    | 'TOWN'
    | 'MERCHANT'
    | 'BLACKSMITH'
    | 'ALCHEMIST'
    | 'RARE_TRADER'
    | 'DUNGEON'
    | 'CAVE'
    | 'BOSS';
  label: string;
  tileX: number;
  tileY: number;
}

export interface WorldState {
  seed: number;
  biomeName: string;
  currentRegionX: number;
  currentRegionY: number;
  exploredRegions: string[];
  gameTimeSeconds: number;
  dayCount: number;
  completedNights: number;
  nightEscalationRate: number;
  harvestedNodes: Record<string, number>;
  defeatedMonsters: Record<string, boolean>;
  defeatedAnimals: Record<string, boolean>;
  tamedCreatures: Record<string, boolean>;
  groundLootByRegion: Record<string, GroundLootItem[]>;
  merchantsByRegion: Record<string, MerchantEntity[]>;
  exploredChunks: string[];
  exploredTilesByRegion: Record<string, string>;
  discoveredLandmarksByRegion: Record<string, RegionLandmark[]>;
}

export interface EnemyStatusEffect {
  type: 'BURN' | 'FROST' | 'POISON';
  turns: number;
  power: number;
}

export interface CombatEnemyState {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  expReward: number;
  isGuarding: boolean;
  isPrepared: boolean;
  isStaggered: boolean;
  intent: EnemyIntentType;
  elementalWeakness: ElementType[];
  elementalResistance: ElementType[];
  statusEffects: EnemyStatusEffect[];
  sourceAnimalId?: string;
  tameEligible?: boolean;
  animalSpecies?: AnimalSpecies;
}

export interface CombatVfxEvent {
  id: number;
  kind:
    | 'SLASH'
    | 'HEAVY_SLASH'
    | 'PROJECTILE'
    | 'HEAL'
    | 'SHIELD'
    | 'DODGE'
    | 'ENEMY_STRIKE'
    | 'COMPANION_STRIKE'
    | 'TAME_ATTEMPT';
  element: ElementType;
  target: 'ENEMY' | 'PLAYER';
  damageText?: string;
  isCritical?: boolean;
  subText?: string;
  shakeIntensity: number;
  hitStopMs: number;
  createdAt: number;
}

export interface CombatState {
  active: boolean;
  turn: 'PLAYER' | 'COMPANION' | 'ENEMY' | 'VICTORY' | 'DEFEAT' | 'ESCAPED' | 'TAMED';
  enemy: CombatEnemyState;
  playerDefending: boolean;
  playerDodging: boolean;
  playerWardTurns: number;
  companionCooldown: number;
  companionCooldowns: Record<string, number>;
  companionShieldActive: boolean;
  companionGuardActive: boolean;
  playerAtkBuffTurns: number;
  playerCritBuffTurns: number;
  playerRegenTurns: number;
  playerRegenAmount: number;
  combatLuckBonus: number;
  tameAttempts: number;
  skillCooldowns: Record<string, number>;
  log: string[];
  lastPlayerHitFlash: number;
  lastEnemyHitFlash: number;
  playerAnim: {
    state: CharacterAnimState;
    startedAt: number;
  };
  enemyAnim: {
    state: CharacterAnimState;
    startedAt: number;
  };
  lastVfx: CombatVfxEvent | null;
  turnCount: number;
  tamedCompanion?: CompanionState;
  rewardSummary?: {
    expGained: number;
    goldGained?: number;
    leveledUp: boolean;
    newLevel: number;
    drops: { itemId: ItemId; quantity: number; rarity: LootRarity }[];
  };
}

export interface SaveSlotRecord {
  slotIndex: 1 | 2 | 3;
  exists: boolean;
  updatedAt: number;
  player: PlayerState | null;
  world: WorldState | null;
}

export interface GameSettings {
  sfxEnabled: boolean;
  masterVolume: number;
  showMinimap: boolean;
  showControlHints: boolean;
  touchJoystickSide: 'left' | 'right';
  cameraZoom: CameraZoomLevel;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}
