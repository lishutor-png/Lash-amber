import { COMPANION_SPECIES_CONFIG } from '../companion/companionSystem';
import {
  AnimalSpecies,
  BiomeId,
  EnemyType,
  EnvironmentHazard,
  GroundLootItem,
  MerchantEntity,
  MineralSpecies,
  MonsterEntity,
  PlantSpecies,
  RegionData,
  RegionExit,
  RegionLandmark,
  ResourceNode,
  SettlementKind,
  TileType,
  TreeSpecies,
  WeatherKind,
  WildlifeEntity,
  WorldState,
} from '../core/types';
import { buildRegionMerchants, syncMerchantsWithWorld } from '../merchant/merchantSystem';
import { BIOME_CONFIGS, getCuratedRegionSpec, WildlifeHabitatSpec } from './biomes';
import { fbm2D, hashCoords } from './noise';

export const REGION_WIDTH = 40;
export const REGION_HEIGHT = 30;
export const TILE_SIZE = 32;
export const REGION_PIXEL_WIDTH = REGION_WIDTH * TILE_SIZE;
export const REGION_PIXEL_HEIGHT = REGION_HEIGHT * TILE_SIZE;

export const REGION_SPAWN_X = 20 * TILE_SIZE + TILE_SIZE / 2;
export const REGION_SPAWN_Y = 15 * TILE_SIZE + TILE_SIZE / 2;

export function getRegionKey(rx: number, ry: number): string {
  return `${rx},${ry}`;
}

export function getRegionInfo(
  seed: number,
  rx: number,
  ry: number
): {
  name: string;
  subAreaName: string;
  description: string;
  biomeId: BiomeId;
  biomeTheme: RegionData['biomeTheme'];
  hazard: EnvironmentHazard;
  weather: WeatherKind;
  settlementKind: SettlementKind;
  isSafeZone: boolean;
  isIndoor: boolean;
} {
  const spec = getCuratedRegionSpec(seed, rx, ry);
  const cfg = BIOME_CONFIGS[spec.biomeId];
  return {
    name: `${cfg.displayName} — ${spec.subAreaName}`,
    subAreaName: spec.subAreaName,
    description: spec.description,
    biomeId: spec.biomeId,
    biomeTheme: cfg.legacyTheme,
    hazard: cfg.hazard,
    weather: cfg.weather,
    settlementKind: spec.settlementKind,
    isSafeZone: spec.isSafeZone,
    isIndoor: spec.isIndoor,
  };
}

export function worldToTile(worldCoord: number): number {
  return Math.floor(worldCoord / TILE_SIZE);
}

export function isTerrainTileSolid(tile: TileType): boolean {
  return tile === 'WATER' || tile === 'LAVA' || tile === 'RUIN_STONE' || tile === 'CLIFF';
}

export function isTileSolid(tile: TileType, node?: ResourceNode): boolean {
  if (isTerrainTileSolid(tile)) return true;
  if (tile === 'TREE' || tile === 'ROCK') {
    if (!node) return true;
    return node.remaining > 0;
  }
  return false;
}

function pickWeighted<T>(
  pool: { item: T; weight: number }[],
  roll: number
): T {
  let total = 0;
  for (const p of pool) total += p.weight;
  let cursor = roll * total;
  for (const p of pool) {
    cursor -= p.weight;
    if (cursor <= 0) return p.item;
  }
  return pool[0].item;
}

const TREE_SPECIES_LIST: TreeSpecies[] = [
  'YOUNG',
  'OAK',
  'PINE',
  'BIRCH',
  'DEAD',
  'ANCIENT',
  'BUSH_TREE',
  'FRUIT_TREE',
  'CORRUPTED',
  'ACACIA',
  'CACTUS',
  'SNOW_PINE',
  'CHARRED',
];

const PLANT_SPECIES_LIST: PlantSpecies[] = [
  'WILD_GRASS',
  'MEDICINAL_HERB',
  'WILD_VEGETABLE',
  'BERRY_BUSH',
  'MUSHROOM',
  'SEED_SPROUT',
  'SPECIAL_PLANT',
  'DESERT_HERB',
  'FROST_BLOOM',
  'ASH_FERN',
];

function chooseTreeSpeciesForBiome(
  seed: number,
  tx: number,
  ty: number,
  biomeId: BiomeId
): TreeSpecies {
  const cfg = BIOME_CONFIGS[biomeId];
  const r = hashCoords(seed, tx, ty, 311);
  return pickWeighted(
    cfg.treePool.map((p) => ({ item: p.species, weight: p.weight })),
    r
  );
}

function choosePlantSpeciesForBiome(
  seed: number,
  tx: number,
  ty: number,
  biomeId: BiomeId
): PlantSpecies {
  const cfg = BIOME_CONFIGS[biomeId];
  const r = hashCoords(seed, tx, ty, 353);
  return pickWeighted(
    cfg.plantPool.map((p) => ({ item: p.species, weight: p.weight })),
    r
  );
}

function chooseMineralSpeciesForBiome(
  seed: number,
  tx: number,
  ty: number,
  biomeId: BiomeId,
  distFromCenter: number
): MineralSpecies {
  const cfg = BIOME_CONFIGS[biomeId];
  const r = hashCoords(seed, tx, ty, 389);
  const picked = pickWeighted(
    cfg.mineralPool.map((p) => ({ item: p.species, weight: p.weight })),
    r
  );
  if (picked === 'GOLD' && distFromCenter < 5) {
    return 'IRON';
  }
  return picked;
}

export function computeNightEscalationMultiplier(
  completedNights: number,
  rate: number,
  isOutdoorWild: boolean,
  isSafeZone = false,
  isIndoor = false
): number {
  if (!isOutdoorWild || isSafeZone || isIndoor || completedNights <= 0) {
    return 1;
  }
  return 1 + Math.max(0, completedNights) * (rate > 0 ? rate : 0.05);
}

export function applyNightEscalationToRegion(region: RegionData, world: WorldState): void {
  const nights = world.completedNights ?? 0;
  const rate = world.nightEscalationRate ?? 0.05;

  for (const m of region.monsters) {
    if (m.defeated) continue;
    const mult = computeNightEscalationMultiplier(
      nights,
      rate,
      m.isOutdoorWild,
      Boolean(region.isSafeZone || m.isSafeZone),
      Boolean(region.isIndoor || m.isIndoor)
    );
    const prevMax = Math.max(1, m.maxHp);
    const ratio = m.hp / prevMax;
    const nextMax = Math.max(1, Math.round(m.baseMaxHp * mult));
    m.maxHp = nextMax;
    m.hp = Math.max(1, Math.min(nextMax, Math.round(nextMax * ratio)));
    m.attack = Math.max(1, Math.round(m.baseAttack * mult));
    m.defense = Math.max(0, Math.round(m.baseDefense * (1 + Math.max(0, mult - 1) * 0.6)));
  }

  for (const w of region.wildlife) {
    if (w.defeated || w.tamed) continue;
    const mult = computeNightEscalationMultiplier(
      nights,
      rate,
      w.isOutdoorWild,
      Boolean(region.isSafeZone),
      Boolean(region.isIndoor)
    );
    const prevMax = Math.max(1, w.maxHp);
    const ratio = w.hp / prevMax;
    const nextMax = Math.max(1, Math.round(w.baseMaxHp * mult));
    w.maxHp = nextMax;
    w.hp = Math.max(1, Math.min(nextMax, Math.round(nextMax * ratio)));
    w.attack = w.baseAttack > 0 ? Math.max(1, Math.round(w.baseAttack * mult)) : 0;
  }
}

export function generateRegion(world: WorldState, rx: number, ry: number): RegionData {
  const seed = world.seed;
  const info = getRegionInfo(seed, rx, ry);
  const cfg = BIOME_CONFIGS[info.biomeId];
  const tiles: TileType[][] = [];
  const tileVariants: number[][] = [];
  const resources: ResourceNode[] = [];
  const monsters: MonsterEntity[] = [];
  const wildlife: WildlifeEntity[] = [];

  const centerX = 20;
  const centerY = 15;
  const isStartRegion = rx === 0 && ry === 0;
  const hasSettlement =
    info.settlementKind === 'TRADING_OUTPOST' ||
    info.settlementKind === 'MERCHANT_VILLAGE' ||
    info.settlementKind === 'BLACKSMITH' ||
    info.settlementKind === 'ALCHEMIST' ||
    info.settlementKind === 'RARE_TRADER';

  // 1. Base terrain, cliff enclosure, water/lava pools, and cross-region trails
  for (let ly = 0; ly < REGION_HEIGHT; ly++) {
    const row: TileType[] = [];
    const varRow: number[] = [];

    for (let lx = 0; lx < REGION_WIDTH; lx++) {
      const gx = rx * REGION_WIDTH + lx;
      const gy = ry * REGION_HEIGHT + ly;

      const elevation = fbm2D(seed, gx, gy, 18, 11);
      const moisture = fbm2D(seed, gx, gy, 15, 37);
      const ruinNoise = fbm2D(seed, gx, gy, 24, 73);
      const detail = hashCoords(seed, gx, gy, 99);
      const variant = Math.floor(hashCoords(seed, gx, gy, 151) * 4);
      varRow.push(variant);

      // Exit corridors (2-tile wide trails at N/S/E/W borders)
      const isNorthExit = ly <= 2 && lx >= 19 && lx <= 20;
      const isSouthExit = ly >= REGION_HEIGHT - 3 && lx >= 19 && lx <= 20;
      const isWestExit = lx <= 2 && ly >= 14 && ly <= 15;
      const isEastExit = lx >= REGION_WIDTH - 3 && ly >= 14 && ly <= 15;

      if (isNorthExit || isSouthExit || isWestExit || isEastExit) {
        row.push(cfg.pathTile);
        continue;
      }

      // Organic rocky cliff enclosure around edges
      const edgeDist = Math.min(lx, REGION_WIDTH - 1 - lx, ly, REGION_HEIGHT - 1 - ly);
      if (
        edgeDist === 0 ||
        (edgeDist === 1 && detail < 0.85) ||
        (edgeDist === 2 && detail < 0.22)
      ) {
        row.push('CLIFF');
        continue;
      }

      // Main gentle winding paths leading from center to the 4 exits
      const trailWiggleX = Math.round(Math.sin(ly * 0.35 + rx * 2) * 1);
      const trailWiggleY = Math.round(Math.cos(lx * 0.28 + ry * 2) * 1);
      const onVerticalTrail =
        Math.abs(lx - (20 + trailWiggleX)) <= 0 && ly >= 2 && ly <= REGION_HEIGHT - 3;
      const onHorizontalTrail =
        Math.abs(ly - (15 + trailWiggleY)) <= 0 && lx >= 2 && lx <= REGION_WIDTH - 3;

      if (onVerticalTrail || onHorizontalTrail) {
        row.push(cfg.pathTile);
        continue;
      }

      const distCenter = Math.hypot(lx - centerX, ly - centerY);

      // Settlement plaza or Safe central clearing around spawn
      if (hasSettlement && Math.abs(lx - centerX) <= 4 && Math.abs(ly - centerY) <= 3) {
        row.push(
          Math.abs(lx - centerX) <= 2 && Math.abs(ly - centerY) <= 2 ? 'WOOD_FLOOR' : 'ROAD'
        );
        continue;
      }

      if (distCenter < 3.6) {
        row.push(info.biomeId === 'FORGOTTEN_FOREST' ? 'CLEARING' : cfg.baseTerrain);
        continue;
      }

      // Guaranteed pond & stream in Starting Region (0,0)
      if (isStartRegion) {
        const pondDist = Math.hypot(lx - 12, ly - 9);
        const isStream =
          lx >= 7 && lx <= 12 && Math.abs(ly - (9 + Math.round(Math.sin(lx * 0.7)))) <= 0;
        if (pondDist <= 2.3 || isStream) {
          row.push('WATER');
          continue;
        }
      } else if (info.biomeId === 'VERDANT_GRASSLANDS') {
        const riverX = 12 + Math.round(Math.sin(ly * 0.35) * 2);
        if (Math.abs(lx - riverX) <= 1 && Math.abs(ly - 15) > 2) {
          row.push('WATER');
          continue;
        }
      } else if (info.biomeId === 'SCORCHED_DESERT') {
        // Oasis pool near (24, 10)
        if (Math.hypot(lx - 24, ly - 10) <= 2.1) {
          row.push('WATER');
          continue;
        }
      } else if (info.biomeId === 'ASHEN_VOLCANO') {
        if (
          (Math.hypot(lx - 11, ly - 9) <= 2.3 || Math.hypot(lx - 29, ly - 21) <= 2.2) &&
          distCenter > 5
        ) {
          row.push('LAVA');
          continue;
        }
      } else if (info.biomeId === 'FROZEN_HIGHLANDS') {
        if (Math.hypot(lx - 11, ly - 10) <= 2.4 && distCenter > 5) {
          row.push('ICE');
          continue;
        }
      } else if (moisture > 0.75 && elevation < 0.46 && distCenter > 5.5) {
        row.push(cfg.waterTile);
        continue;
      }

      // Ruins / Dungeon / Cave masonry walls
      if (
        ((info.biomeId === 'FALLEN_KINGDOM' && ruinNoise > 0.62) ||
          (info.settlementKind === 'DUNGEON' && Math.hypot(lx - 29, ly - 8) < 3.4 && Math.hypot(lx - 29, ly - 8) > 1.8) ||
          ruinNoise > 0.81) &&
        detail < 0.28 &&
        distCenter > 5.5
      ) {
        row.push('RUIN_STONE');
        continue;
      }

      // Natural biome resource placement
      if (detail < cfg.treeChance) {
        row.push('TREE');
      } else if (detail < cfg.treeChance + cfg.rockChance) {
        row.push('ROCK');
      } else if (detail < cfg.treeChance + cfg.rockChance + cfg.plantChance) {
        row.push('PLANT');
      } else if (elevation > 0.54 || moisture > 0.58) {
        row.push(cfg.secondaryTerrain);
      } else {
        row.push(cfg.baseTerrain);
      }
    }

    tiles.push(row);
    tileVariants.push(varRow);
  }

  // 2. Guarantee balanced rich diversity in Starting Region (0,0)
  if (isStartRegion) {
    const guaranteedTreeSpots: [number, number, TreeSpecies][] = [
      [16, 12, 'YOUNG'],
      [24, 11, 'OAK'],
      [26, 18, 'PINE'],
      [22, 10, 'BIRCH'],
      [14, 20, 'DEAD'],
      [29, 9, 'ANCIENT'],
      [17, 19, 'BUSH_TREE'],
      [23, 19, 'FRUIT_TREE'],
      [31, 22, 'CORRUPTED'],
    ];
    for (const [tx, ty, sp] of guaranteedTreeSpots) {
      if (tiles[ty]?.[tx] !== 'TRAIL' && tiles[ty]?.[tx] !== 'WATER') {
        tiles[ty][tx] = 'TREE';
        addTreeNode(resources, world, rx, ry, tx, ty, sp);
      }
    }

    const guaranteedPlants: [number, number, PlantSpecies][] = [
      [18, 12, 'WILD_GRASS'],
      [16, 10, 'MEDICINAL_HERB'],
      [22, 13, 'WILD_VEGETABLE'],
      [18, 17, 'BERRY_BUSH'],
      [14, 12, 'MUSHROOM'],
      [23, 17, 'SEED_SPROUT'],
      [10, 12, 'SPECIAL_PLANT'],
    ];
    for (const [tx, ty, sp] of guaranteedPlants) {
      if (tiles[ty]?.[tx] !== 'TRAIL' && tiles[ty]?.[tx] !== 'WATER') {
        tiles[ty][tx] = 'PLANT';
        addPlantNode(resources, world, rx, ry, tx, ty, sp);
      }
    }

    const guaranteedMinerals: [number, number, MineralSpecies][] = [
      [25, 13, 'STONE'],
      [15, 16, 'STONE'],
      [27, 12, 'IRON'],
      [9, 18, 'IRON'],
      [33, 6, 'GOLD'],
      [6, 23, 'GOLD'],
      [30, 17, 'COPPER'],
      [8, 6, 'COAL'],
    ];
    for (const [tx, ty, sp] of guaranteedMinerals) {
      if (tiles[ty]?.[tx] !== 'TRAIL' && tiles[ty]?.[tx] !== 'WATER') {
        tiles[ty][tx] = 'ROCK';
        addMineralNode(resources, world, rx, ry, tx, ty, sp);
      }
    }
  }

  // 3. Populate ResourceNode objects for every procedural TREE, ROCK, PLANT tile not already added
  const occupied = new Set(resources.map((r) => `${r.tileX},${r.tileY}`));
  for (let ly = 0; ly < REGION_HEIGHT; ly++) {
    for (let lx = 0; lx < REGION_WIDTH; lx++) {
      const tile = tiles[ly][lx];
      const key = `${lx},${ly}`;
      if (occupied.has(key)) continue;

      const gx = rx * REGION_WIDTH + lx;
      const gy = ry * REGION_HEIGHT + ly;
      const distCenter = Math.hypot(lx - centerX, ly - centerY);

      if (tile === 'TREE') {
        const sp = chooseTreeSpeciesForBiome(seed, gx, gy, info.biomeId);
        addTreeNode(resources, world, rx, ry, lx, ly, sp);
      } else if (tile === 'ROCK') {
        const sp = chooseMineralSpeciesForBiome(seed, gx, gy, info.biomeId, distCenter);
        addMineralNode(resources, world, rx, ry, lx, ly, sp);
      } else if (tile === 'PLANT') {
        const sp = choosePlantSpeciesForBiome(seed, gx, gy, info.biomeId);
        addPlantNode(resources, world, rx, ry, lx, ly, sp);
      }
    }
  }

  const resourceByTile = new Map<string, ResourceNode>();
  for (const node of resources) {
    resourceByTile.set(`${node.tileX},${node.tileY}`, node);
  }

  // 4. Spawn Habitat-Matched Wildlife respecting terrain & population limits
  let wAttempt = 0;
  for (const hab of cfg.wildlifeHabitats) {
    for (let countIdx = 0; countIdx < hab.popLimit; countIdx++) {
      let placed = false;
      let tries = 0;
      while (!placed && tries < 28) {
        tries++;
        wAttempt++;
        const lx =
          4 + Math.floor(hashCoords(seed, rx, ry, 500 + wAttempt * 3) * (REGION_WIDTH - 8));
        const ly =
          4 + Math.floor(hashCoords(seed, rx, ry, 501 + wAttempt * 3) * (REGION_HEIGHT - 8));
        const tile = tiles[ly]?.[lx];
        if (!tile || isTileSolid(tile, resourceByTile.get(`${lx},${ly}`)) || tile === 'PLANT') {
          continue;
        }
        if (
          hab.preferredTerrains.length > 0 &&
          !hab.preferredTerrains.includes(tile) &&
          tries < 16
        ) {
          continue;
        }

        const distCenter = Math.hypot(lx - centerX, ly - centerY);
        if (hab.temperament === 'AGGRESSIVE' && distCenter < 7.0) continue;
        if (distCenter < 4.5) continue;

        const animalId = `ani_${rx}_${ry}_${hab.species}_${countIdx}`;
        if (world.defeatedAnimals[animalId] || world.tamedCreatures[animalId]) {
          placed = true;
          continue;
        }

        const wx = lx * TILE_SIZE + TILE_SIZE / 2;
        const wy = ly * TILE_SIZE + TILE_SIZE / 2;
        wildlife.push(createWildlifeFromHabitat(animalId, hab, wx, wy));
        placed = true;
      }
    }
  }

  // 5. Spawn Biome Monsters (none inside full safe-zone settlements; outer perimeter only in Fallen Kingdom)
  const regionDist = Math.abs(rx) + Math.abs(ry);
  const difficulty = Math.min(6, regionDist);
  const monsterPool = info.isSafeZone
    ? info.biomeId === 'FALLEN_KINGDOM'
      ? (['UNDEAD_KNIGHT', 'FOREST_SKELETON'] as EnemyType[])
      : []
    : cfg.monsterPool;

  let mAttempt = 0;
  for (const mType of monsterPool) {
    let placed = false;
    let tries = 0;
    while (!placed && tries < 36) {
      tries++;
      mAttempt++;
      const lx =
        4 + Math.floor(hashCoords(seed, rx, ry, 800 + mAttempt * 3) * (REGION_WIDTH - 8));
      const ly =
        4 + Math.floor(hashCoords(seed, rx, ry, 801 + mAttempt * 3) * (REGION_HEIGHT - 8));
      const tile = tiles[ly]?.[lx];
      if (
        !tile ||
        isTileSolid(tile, resourceByTile.get(`${lx},${ly}`)) ||
        tile === 'PLANT' ||
        tile === cfg.pathTile ||
        tile === 'ROAD' ||
        tile === 'WOOD_FLOOR'
      ) {
        continue;
      }

      const distCenter = Math.hypot(lx - centerX, ly - centerY);
      const minDist = info.isSafeZone ? 12.5 : 8.5;
      if (distCenter < minDist) continue;

      const monsterId = `mon_${mType}_${rx}_${ry}_${mAttempt}`;
      if (world.defeatedMonsters[monsterId]) {
        placed = true;
        continue;
      }

      const wx = lx * TILE_SIZE + TILE_SIZE / 2;
      const wy = ly * TILE_SIZE + TILE_SIZE / 2;
      monsters.push(
        createMonsterEntity(
          monsterId,
          mType,
          wx,
          wy,
          difficulty,
          hashCoords(seed, lx, ly, 777),
          !info.isIndoor,
          false,
          info.isIndoor
        )
      );
      placed = true;
    }
  }

  const key = getRegionKey(rx, ry);
  const builtMerchants = buildRegionMerchants(
    key,
    info.settlementKind,
    world.gameTimeSeconds,
    TILE_SIZE
  );
  const merchants: MerchantEntity[] =
    builtMerchants.length > 0 ? syncMerchantsWithWorld(world, key, builtMerchants) : [];

  const exits: RegionExit[] = [
    {
      direction: 'NORTH',
      tileX: 19,
      tileY: 0,
      targetRX: rx,
      targetRY: ry - 1,
      targetName: getRegionInfo(seed, rx, ry - 1).name,
    },
    {
      direction: 'SOUTH',
      tileX: 19,
      tileY: REGION_HEIGHT - 1,
      targetRX: rx,
      targetRY: ry + 1,
      targetName: getRegionInfo(seed, rx, ry + 1).name,
    },
    {
      direction: 'WEST',
      tileX: 0,
      tileY: 14,
      targetRX: rx - 1,
      targetRY: ry,
      targetName: getRegionInfo(seed, rx - 1, ry).name,
    },
    {
      direction: 'EAST',
      tileX: REGION_WIDTH - 1,
      tileY: 14,
      targetRX: rx + 1,
      targetRY: ry,
      targetName: getRegionInfo(seed, rx + 1, ry).name,
    },
  ];

  const groundLoot = (world.groundLootByRegion?.[key] ?? []).map((item) => ({ ...item }));

  const region: RegionData = {
    key,
    rx,
    ry,
    name: info.name,
    subAreaName: info.subAreaName,
    description: info.description,
    biomeId: info.biomeId,
    biomeTheme: info.biomeTheme,
    hazard: info.hazard,
    weather: info.weather,
    isSafeZone: info.isSafeZone,
    isIndoor: info.isIndoor,
    settlementKind: info.settlementKind,
    width: REGION_WIDTH,
    height: REGION_HEIGHT,
    tiles,
    tileVariants,
    resources,
    resourceByTile,
    monsters,
    wildlife,
    merchants,
    groundLoot,
    exits,
  };

  // Apply deterministic night escalation from base stats without ever compounding!
  applyNightEscalationToRegion(region, world);

  return region;
}

function createMonsterEntity(
  id: string,
  type: EnemyType,
  x: number,
  y: number,
  difficulty: number,
  phaseSeed: number,
  isOutdoorWild = true,
  isSafeZone = false,
  isIndoor = false
): MonsterEntity {
  const lvSuffix = difficulty > 0 ? ` (Lv.${1 + difficulty})` : '';
  const build = (
    name: string,
    hp: number,
    attack: number,
    defense: number,
    speed: number,
    expReward: number,
    facing: MonsterEntity['facing'] = 'down',
    extra?: Partial<MonsterEntity>
  ): MonsterEntity => ({
    id,
    type,
    name: `${name}${lvSuffix}`,
    x,
    y,
    originX: x,
    originY: y,
    hp,
    maxHp: hp,
    baseMaxHp: hp,
    attack,
    baseAttack: attack,
    defense,
    baseDefense: defense,
    speed,
    expReward,
    facing,
    patrolPhase: phaseSeed * Math.PI * 2,
    defeated: false,
    isOutdoorWild,
    isSafeZone,
    isIndoor,
    ...extra,
  });

  switch (type) {
    case 'SLIME':
      return build('Slime Rimba', 34 + difficulty * 10, 7 + difficulty * 2, 2 + difficulty, 6 + difficulty, 24 + difficulty * 8);
    case 'GOBLIN':
      return build('Goblin Penjarah', 42 + difficulty * 12, 10 + difficulty * 2, 4 + difficulty, 11 + difficulty, 32 + difficulty * 10, 'left');
    case 'FOREST_WOLF':
      return build('Serigala Buas', 44 + difficulty * 11, 11 + difficulty * 2, 3 + difficulty, 13 + difficulty, 30 + difficulty * 10, 'left', {
        tameEligible: true,
        animalSpecies: 'WOLF',
      });
    case 'DARK_CREATURE':
      return build('Makhluk Kegelapan', 62 + difficulty * 16, 14 + difficulty * 3, 6 + difficulty, 10 + difficulty, 52 + difficulty * 14);
    case 'FROST_GOLEM':
      return build('Golem Es Abadi', 78 + difficulty * 16, 15 + difficulty * 3, 8 + difficulty, 7 + difficulty, 62 + difficulty * 14);
    case 'DESERT_SCORPION':
      return build('Kalajengking Raksasa', 54 + difficulty * 12, 13 + difficulty * 2, 6 + difficulty, 12 + difficulty, 42 + difficulty * 10);
    case 'MAGMA_FIEND':
      return build('Iblis Magma', 84 + difficulty * 18, 17 + difficulty * 3, 7 + difficulty, 11 + difficulty, 72 + difficulty * 16);
    case 'SAVANNA_HYENA':
      return build('Hyena Sabana', 48 + difficulty * 11, 12 + difficulty * 2, 4 + difficulty, 14 + difficulty, 36 + difficulty * 9, 'left');
    case 'UNDEAD_KNIGHT':
      return build('Ksatria Terkutuk', 70 + difficulty * 14, 15 + difficulty * 3, 8 + difficulty, 9 + difficulty, 58 + difficulty * 14);
    case 'CAVE_TROLL':
      return build('Troll Gua Purba', 88 + difficulty * 18, 16 + difficulty * 3, 7 + difficulty, 6 + difficulty, 68 + difficulty * 16);
    case 'CORRUPTED_STAG':
      return build('Rusa Terkorupsi', 64 + difficulty * 14, 14 + difficulty * 2, 5 + difficulty, 13 + difficulty, 54 + difficulty * 12);
    case 'DIRE_WOLF':
      return build('Serigala Purba', 60 + difficulty * 13, 14 + difficulty * 3, 5 + difficulty, 14 + difficulty, 48 + difficulty * 12, 'left');
    case 'WILD_BOAR':
      return build('Babi Hutan Buas', 42 + difficulty * 10, 9 + difficulty * 2, 3 + difficulty, 10 + difficulty, 28 + difficulty * 8);
    default:
      return build('Kerangka Hutan', 40 + difficulty * 12, 9 + difficulty * 2, 4 + difficulty, 8 + difficulty, 28 + difficulty * 10);
  }
}

function createWildlifeFromHabitat(
  id: string,
  hab: WildlifeHabitatSpec,
  x: number,
  y: number
): WildlifeEntity {
  const cfg = COMPANION_SPECIES_CONFIG[hab.species];
  return {
    id,
    species: hab.species,
    name: hab.name || cfg.displayName,
    x,
    y,
    originX: x,
    originY: y,
    hp: hab.baseHp,
    maxHp: hab.baseHp,
    baseMaxHp: hab.baseHp,
    attack: hab.baseAttack,
    baseAttack: hab.baseAttack,
    speed: hab.speed,
    temperament: hab.temperament,
    tameEligible: hab.tameEligible,
    rarity: hab.rarity,
    facing: 'right',
    vx: 0,
    vy: 0,
    aiTimer: 1.5,
    isEating: false,
    behaviorState: 'ROAM',
    activeTime: hab.activeTime,
    isOutdoorWild: true,
    hitFlashUntil: 0,
    defeated: false,
    tamed: false,
  };
}

function addTreeNode(
  resources: ResourceNode[],
  world: WorldState,
  rx: number,
  ry: number,
  tileX: number,
  tileY: number,
  treeSpecies: TreeSpecies
) {
  const maxAmount =
    treeSpecies === 'ANCIENT' ? 5 : treeSpecies === 'YOUNG' || treeSpecies === 'BUSH_TREE' ? 2 : 3;
  const id = `TREE_${rx}_${ry}_${tileX}_${tileY}`;
  const harvested = world.harvestedNodes[id] ?? 0;
  resources.push({
    id,
    kind: 'TREE',
    treeSpecies,
    tileX,
    tileY,
    remaining: Math.max(0, maxAmount - harvested),
    maxAmount,
  });
}

function addPlantNode(
  resources: ResourceNode[],
  world: WorldState,
  rx: number,
  ry: number,
  tileX: number,
  tileY: number,
  plantSpecies: PlantSpecies
) {
  const maxAmount = plantSpecies === 'BERRY_BUSH' || plantSpecies === 'WILD_GRASS' ? 2 : 1;
  const id = `PLANT_${rx}_${ry}_${tileX}_${tileY}`;
  const harvested = world.harvestedNodes[id] ?? 0;
  resources.push({
    id,
    kind: 'PLANT',
    plantSpecies,
    tileX,
    tileY,
    remaining: Math.max(0, maxAmount - harvested),
    maxAmount,
  });
}

function addMineralNode(
  resources: ResourceNode[],
  world: WorldState,
  rx: number,
  ry: number,
  tileX: number,
  tileY: number,
  mineralSpecies: MineralSpecies
) {
  const maxAmount = mineralSpecies === 'GOLD' || mineralSpecies === 'OBSIDIAN' ? 2 : 3;
  const id = `MINERAL_${rx}_${ry}_${tileX}_${tileY}`;
  const harvested = world.harvestedNodes[id] ?? 0;
  resources.push({
    id,
    kind: 'MINERAL',
    mineralSpecies,
    tileX,
    tileY,
    remaining: Math.max(0, maxAmount - harvested),
    maxAmount,
    requiresTool:
      mineralSpecies === 'IRON' ||
      mineralSpecies === 'GOLD' ||
      mineralSpecies === 'COPPER' ||
      mineralSpecies === 'OBSIDIAN' ||
      mineralSpecies === 'ICE_CRYSTAL'
        ? 'PICKAXE'
        : undefined,
  });
}

export function getTreeLabel(species?: TreeSpecies): string {
  switch (species) {
    case 'YOUNG':
      return 'Pohon Muda';
    case 'OAK':
      return 'Pohon Ek';
    case 'PINE':
      return 'Pohon Pinus';
    case 'BIRCH':
      return 'Pohon Birch';
    case 'DEAD':
      return 'Pohon Mati';
    case 'ANCIENT':
      return 'Pohon Purba';
    case 'BUSH_TREE':
      return 'Pohon Semak';
    case 'FRUIT_TREE':
      return 'Pohon Buah';
    case 'CORRUPTED':
      return 'Pohon Terkorupsi';
    case 'ACACIA':
      return 'Pohon Akasia';
    case 'CACTUS':
      return 'Kaktus Gurun';
    case 'SNOW_PINE':
      return 'Pinus Salju';
    case 'CHARRED':
      return 'Pohon Hangus';
    default:
      return 'Pohon';
  }
}

export function getPlantLabel(species?: PlantSpecies): string {
  switch (species) {
    case 'WILD_GRASS':
      return 'Rumput Liar';
    case 'MEDICINAL_HERB':
      return 'Herba Obat';
    case 'WILD_VEGETABLE':
      return 'Sayur Liar';
    case 'BERRY_BUSH':
      return 'Semak Beri';
    case 'MUSHROOM':
      return 'Jamur Hutan';
    case 'SEED_SPROUT':
      return 'Tunas Benih';
    case 'SPECIAL_PLANT':
      return 'Bunga Embun';
    case 'DESERT_HERB':
      return 'Herba Gurun';
    case 'FROST_BLOOM':
      return 'Bunga Beku';
    case 'ASH_FERN':
      return 'Pakis Abu';
    default:
      return 'Tanaman Liar';
  }
}

export function getMineralLabel(species?: MineralSpecies): string {
  switch (species) {
    case 'IRON':
      return 'Urat Bijih Besi';
    case 'GOLD':
      return 'Urat Bijih Emas';
    case 'COPPER':
      return 'Urat Tembaga';
    case 'COAL':
      return 'Bongkahan Batu Bara';
    case 'OBSIDIAN':
      return 'Urat Obsidian';
    case 'ICE_CRYSTAL':
      return 'Kristal Es Abadi';
    default:
      return 'Batu Purba';
  }
}

export class WorldRegionManager {
  private regions = new Map<string, RegionData>();

  public clear() {
    this.regions.clear();
  }

  public loadRegion(world: WorldState, rx: number, ry: number): {
    region: RegionData;
    newlyExplored: boolean;
  } {
    const key = getRegionKey(rx, ry);
    let region = this.regions.get(key);
    if (!region) {
      region = generateRegion(world, rx, ry);
      this.regions.set(key, region);
    } else {
      applyNightEscalationToRegion(region, world);
      if (region.merchants.length > 0) {
        region.merchants = syncMerchantsWithWorld(world, key, region.merchants);
      }
    }
    const newlyExplored = !world.exploredRegions.includes(key);
    if (newlyExplored) {
      world.exploredRegions.push(key);
    }
    return { region, newlyExplored };
  }

  public getCurrentRegion(world: WorldState): RegionData {
    return this.loadRegion(world, world.currentRegionX, world.currentRegionY).region;
  }

  public getTileAt(region: RegionData, tileX: number, tileY: number): TileType {
    if (tileX < 0 || tileX >= region.width || tileY < 0 || tileY >= region.height) {
      return 'CLIFF';
    }
    return region.tiles[tileY][tileX];
  }

  /**
   * Accurate organic collision:
   * - Solid barriers (CLIFF, WATER, LAVA, RUIN_STONE) block across tile bounds.
   * - Living TREE and ROCK use compact centered trunk/boulder circle hitboxes (~7.5px / ~9.5px)
   *   and immediately become walkable as soon as node.remaining <= 0!
   * - PLANT, flowers, grass, and chopped stumps NEVER block movement.
   */
  public isPositionWalkable(region: RegionData, worldX: number, worldY: number, radius = 8): boolean {
    const minTx = worldToTile(worldX - radius - 8);
    const maxTx = worldToTile(worldX + radius + 8);
    const minTy = worldToTile(worldY - radius - 8);
    const maxTy = worldToTile(worldY + radius + 8);

    // 1. Hard terrain bounds check at player perimeter points
    const checkPts = [
      { x: worldX - radius, y: worldY - radius },
      { x: worldX + radius, y: worldY - radius },
      { x: worldX - radius, y: worldY + radius },
      { x: worldX + radius, y: worldY + radius },
    ];
    for (const pt of checkPts) {
      const tx = worldToTile(pt.x);
      const ty = worldToTile(pt.y);
      const tile = this.getTileAt(region, tx, ty);
      if (isTerrainTileSolid(tile)) {
        return false;
      }
    }

    // 2. Centered trunk / boulder hitboxes ONLY for unharvested TREE and ROCK nodes
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tile = this.getTileAt(region, tx, ty);
        if (tile !== 'TREE' && tile !== 'ROCK') continue;

        const node = region.resourceByTile?.get(`${tx},${ty}`);
        if (node && node.remaining <= 0) {
          continue; // Destroyed tree stump or mined rubble is freely walkable!
        }

        const cx = tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = tile === 'TREE' ? ty * TILE_SIZE + TILE_SIZE * 0.62 : ty * TILE_SIZE + TILE_SIZE * 0.56;
        const obsRadius = tile === 'TREE' ? 7.5 : 9.5;
        if (Math.hypot(worldX - cx, worldY - cy) < radius + obsRadius) {
          return false;
        }
      }
    }

    return true;
  }

  public checkRegionExit(region: RegionData, worldX: number, worldY: number): RegionExit | null {
    const tx = worldToTile(worldX);
    const ty = worldToTile(worldY);
    if (ty <= 0 && tx >= 18 && tx <= 21) {
      return region.exits.find((e) => e.direction === 'NORTH') ?? null;
    }
    if (ty >= region.height - 1 && tx >= 18 && tx <= 21) {
      return region.exits.find((e) => e.direction === 'SOUTH') ?? null;
    }
    if (tx <= 0 && ty >= 13 && ty <= 16) {
      return region.exits.find((e) => e.direction === 'WEST') ?? null;
    }
    if (tx >= region.width - 1 && ty >= 13 && ty <= 16) {
      return region.exits.find((e) => e.direction === 'EAST') ?? null;
    }
    return null;
  }

  public findNearestResource(region: RegionData, playerX: number, playerY: number, maxDistance = 54): ResourceNode | null {
    let best: ResourceNode | null = null;
    let bestDist = maxDistance;
    for (const node of region.resources) {
      if (node.remaining <= 0) continue;
      const nx = node.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ny = node.tileY * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.hypot(nx - playerX, ny - playerY);
      if (dist <= bestDist) {
        bestDist = dist;
        best = node;
      }
    }
    return best;
  }

  public isNearWater(region: RegionData, playerX: number, playerY: number): { tileX: number; tileY: number } | null {
    const ptx = worldToTile(playerX);
    const pty = worldToTile(playerY);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = ptx + dx;
        const ty = pty + dy;
        if (this.getTileAt(region, tx, ty) === 'WATER') {
          const cx = tx * TILE_SIZE + TILE_SIZE / 2;
          const cy = ty * TILE_SIZE + TILE_SIZE / 2;
          if (Math.hypot(cx - playerX, cy - playerY) <= 46) {
            return { tileX: tx, tileY: ty };
          }
        }
      }
    }
    return null;
  }

  public findNearestMerchant(
    region: RegionData,
    playerX: number,
    playerY: number,
    maxDistance = 58
  ): MerchantEntity | null {
    let best: MerchantEntity | null = null;
    let bestDist = maxDistance;
    for (const merch of region.merchants) {
      const dist = Math.hypot(merch.x - playerX, merch.y - playerY);
      if (dist <= bestDist) {
        bestDist = dist;
        best = merch;
      }
    }
    return best;
  }

  public findNearestMonster(region: RegionData, playerX: number, playerY: number, maxDistance = 52): MonsterEntity | null {
    let best: MonsterEntity | null = null;
    let bestDist = maxDistance;
    for (const m of region.monsters) {
      if (m.defeated) continue;
      const dist = Math.hypot(m.x - playerX, m.y - playerY);
      if (dist <= bestDist) {
        bestDist = dist;
        best = m;
      }
    }
    return best;
  }

  public findNearestWildlife(region: RegionData, playerX: number, playerY: number, maxDistance = 58): WildlifeEntity | null {
    let best: WildlifeEntity | null = null;
    let bestDist = maxDistance;
    for (const w of region.wildlife) {
      if (w.defeated || w.tamed) continue;
      const dist = Math.hypot(w.x - playerX, w.y - playerY);
      if (dist <= bestDist) {
        bestDist = dist;
        best = w;
      }
    }
    return best;
  }

  public findNearestGroundLoot(
    region: RegionData,
    playerX: number,
    playerY: number,
    maxDistance = 48
  ): GroundLootItem | null {
    let best: GroundLootItem | null = null;
    let bestDist = maxDistance;
    for (const loot of region.groundLoot) {
      const dist = Math.hypot(loot.x - playerX, loot.y - playerY);
      if (dist <= bestDist) {
        bestDist = dist;
        best = loot;
      }
    }
    return best;
  }

  public addGroundLoot(world: WorldState, region: RegionData, loot: GroundLootItem) {
    region.groundLoot.push(loot);
    if (!world.groundLootByRegion) world.groundLootByRegion = {};
    world.groundLootByRegion[region.key] = region.groundLoot.map((l) => ({ ...l }));
  }

  public removeGroundLoot(world: WorldState, region: RegionData, lootId: string) {
    region.groundLoot = region.groundLoot.filter((l) => l.id !== lootId);
    if (!world.groundLootByRegion) world.groundLootByRegion = {};
    world.groundLootByRegion[region.key] = region.groundLoot.map((l) => ({ ...l }));
  }

  public markMonsterDefeated(monsterId: string, tamed = false) {
    for (const reg of this.regions.values()) {
      for (const m of reg.monsters) {
        if (m.id === monsterId) m.defeated = true;
      }
      for (const w of reg.wildlife) {
        if (w.id === monsterId || `ani_${w.id}` === monsterId || `boar_${w.id}` === monsterId) {
          if (tamed) w.tamed = true;
          else w.defeated = true;
        }
      }
    }
  }
}

export const DEFAULT_VISIBILITY_RADIUS_TILES = 7.5;
export const DEFAULT_VISIBILITY_RADIUS_PX = DEFAULT_VISIBILITY_RADIUS_TILES * TILE_SIZE;

export function getVisibilityRadiusPx(playerTorchSeconds: number): number {
  return playerTorchSeconds > 0
    ? (DEFAULT_VISIBILITY_RADIUS_TILES + 1.5) * TILE_SIZE
    : DEFAULT_VISIBILITY_RADIUS_PX;
}

export function isTileExplored(
  world: WorldState,
  regionKey: string,
  tx: number,
  ty: number
): boolean {
  if (tx < 0 || tx >= REGION_WIDTH || ty < 0 || ty >= REGION_HEIGHT) return false;
  const mask = world.exploredTilesByRegion?.[regionKey];
  if (!mask) return false;
  return mask.charCodeAt(ty * REGION_WIDTH + tx) === 49;
}

export function getRegionExploredCount(world: WorldState, regionKey: string): number {
  const mask = world.exploredTilesByRegion?.[regionKey];
  if (!mask) return 0;
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask.charCodeAt(i) === 49) count++;
  }
  return count;
}

export function isWorldPointVisible(
  playerX: number,
  playerY: number,
  wx: number,
  wy: number,
  visibilityRadiusPx: number
): boolean {
  return Math.hypot(wx - playerX, wy - playerY) <= visibilityRadiusPx;
}

export function revealFogAroundPlayer(
  world: WorldState,
  region: RegionData,
  playerX: number,
  playerY: number,
  visibilityRadiusPx: number
): boolean {
  if (!world.exploredTilesByRegion) world.exploredTilesByRegion = {};
  if (!world.discoveredLandmarksByRegion) world.discoveredLandmarksByRegion = {};

  const totalTiles = REGION_WIDTH * REGION_HEIGHT;
  let mask = world.exploredTilesByRegion[region.key];
  if (!mask || mask.length !== totalTiles) {
    mask = '0'.repeat(totalTiles);
    world.exploredTilesByRegion[region.key] = mask;
  }

  const radiusTiles = visibilityRadiusPx / TILE_SIZE;
  const ptx = playerX / TILE_SIZE;
  const pty = playerY / TILE_SIZE;
  const minTx = Math.max(0, Math.floor(ptx - radiusTiles));
  const maxTx = Math.min(REGION_WIDTH - 1, Math.ceil(ptx + radiusTiles));
  const minTy = Math.max(0, Math.floor(pty - radiusTiles));
  const maxTy = Math.min(REGION_HEIGHT - 1, Math.ceil(pty + radiusTiles));

  let chars: string[] | null = null;
  let changed = false;

  const existingLandmarks = world.discoveredLandmarksByRegion[region.key] ?? [];
  const landmarkIds = new Set(existingLandmarks.map((l) => l.id));

  const addLandmark = (lm: RegionLandmark) => {
    if (landmarkIds.has(lm.id)) return;
    landmarkIds.add(lm.id);
    existingLandmarks.push(lm);
    world.discoveredLandmarksByRegion[region.key] = existingLandmarks;
    changed = true;
  };

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const dist = Math.hypot(tx + 0.5 - ptx, ty + 0.5 - pty);
      if (dist > radiusTiles) continue;

      const idx = ty * REGION_WIDTH + tx;
      if (mask.charCodeAt(idx) !== 49) {
        if (!chars) chars = mask.split('');
        chars[idx] = '1';
        changed = true;
      }

      const tile = region.tiles[ty][tx];
      if (tile === 'WATER') {
        const clusterKey = `WATER_${Math.floor(tx / 6)}_${Math.floor(ty / 6)}`;
        const isFishable = region.biomeId === 'VERDANT_GRASSLANDS' || region.biomeId === 'FORGOTTEN_FOREST';
        addLandmark({
          id: clusterKey,
          kind: isFishable ? 'FISHING' : 'WATER',
          label: isFishable ? 'Titik Pancing & Air' : 'Sumber Air / Oasis',
          tileX: tx,
          tileY: ty,
        });
      } else if (tile === 'RUIN_STONE') {
        const clusterKey = `RUINS_${Math.floor(tx / 8)}_${Math.floor(ty / 8)}`;
        addLandmark({
          id: clusterKey,
          kind: 'RUINS',
          label: 'Reruntuhan Kuno',
          tileX: tx,
          tileY: ty,
        });
      }
    }
  }

  for (const merch of region.merchants) {
    if (Math.hypot(merch.x - playerX, merch.y - playerY) <= visibilityRadiusPx) {
      const lmKind: RegionLandmark['kind'] =
        merch.kind === 'BLACKSMITH'
          ? 'BLACKSMITH'
          : merch.kind === 'ALCHEMIST'
          ? 'ALCHEMIST'
          : merch.kind === 'RARE_TRADER'
          ? 'RARE_TRADER'
          : merch.kind === 'MERCHANT_VILLAGE'
          ? 'TOWN'
          : 'MERCHANT';
      addLandmark({
        id: `MERCH_${merch.id}`,
        kind: lmKind,
        label: `${merch.title} (${merch.name})`,
        tileX: worldToTile(merch.x),
        tileY: worldToTile(merch.y),
      });
    }
  }

  if (
    (region.settlementKind === 'DUNGEON' ||
      region.settlementKind === 'CAVE' ||
      region.settlementKind === 'BOSS_LAIR') &&
    Math.hypot(REGION_SPAWN_X - playerX, REGION_SPAWN_Y - playerY) <= visibilityRadiusPx + 64
  ) {
    addLandmark({
      id: `SITE_${region.settlementKind}`,
      kind:
        region.settlementKind === 'DUNGEON'
          ? 'DUNGEON'
          : region.settlementKind === 'CAVE'
          ? 'CAVE'
          : 'BOSS',
      label: region.subAreaName,
      tileX: 20,
      tileY: 15,
    });
  }

  for (const exit of region.exits) {
    const ex = exit.tileX * TILE_SIZE + TILE_SIZE / 2;
    const ey = exit.tileY * TILE_SIZE + TILE_SIZE / 2;
    if (Math.hypot(ex - playerX, ey - playerY) <= visibilityRadiusPx) {
      addLandmark({
        id: `EXIT_${exit.direction}`,
        kind: 'EXIT',
        label: `Jalur ke ${exit.targetName}`,
        tileX: exit.tileX,
        tileY: exit.tileY,
      });
    }
  }

  for (const res of region.resources) {
    if (
      res.kind === 'MINERAL' &&
      (res.mineralSpecies === 'GOLD' || res.mineralSpecies === 'OBSIDIAN') &&
      res.remaining > 0
    ) {
      const rxp = res.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ryp = res.tileY * TILE_SIZE + TILE_SIZE / 2;
      if (Math.hypot(rxp - playerX, ryp - playerY) <= visibilityRadiusPx) {
        addLandmark({
          id: `MINERAL_${res.tileX}_${res.tileY}`,
          kind: 'GOLD_VEIN',
          label: getMineralLabel(res.mineralSpecies),
          tileX: res.tileX,
          tileY: res.tileY,
        });
      }
    }
  }

  if (chars) {
    world.exploredTilesByRegion[region.key] = chars.join('');
  }
  return changed;
}

export { TREE_SPECIES_LIST, PLANT_SPECIES_LIST };
