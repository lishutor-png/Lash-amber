import {
  AnimalSpecies,
  BiomeId,
  CompanionRarity,
  EnemyType,
  EnvironmentHazard,
  MineralSpecies,
  PlantSpecies,
  RegionData,
  SettlementKind,
  TileType,
  TreeSpecies,
  WeatherKind,
} from '../core/types';
import { hashCoords } from './noise';

export interface WildlifeHabitatSpec {
  species: AnimalSpecies;
  name: string;
  preferredTerrains: TileType[];
  activeTime: 'DAY' | 'NIGHT' | 'ANY';
  popLimit: number;
  temperament: 'FLEE' | 'AGGRESSIVE' | 'TAMEABLE';
  tameEligible: boolean;
  rarity: CompanionRarity;
  baseHp: number;
  baseAttack: number;
  speed: number;
}

export interface BiomeConfig {
  id: BiomeId;
  displayName: string;
  legacyTheme: RegionData['biomeTheme'];
  baseTerrain: TileType;
  secondaryTerrain: TileType;
  pathTile: TileType;
  wallTile: TileType;
  waterTile: 'WATER' | 'ICE' | 'LAVA';
  hazard: EnvironmentHazard;
  weather: WeatherKind;
  fogTint: string;
  palette: {
    groundA: string;
    groundB: string;
    groundC: string;
    path: string;
    cliff: string;
    water: string;
  };
  subAreaNames: string[];
  descriptions: string[];
  treeChance: number;
  rockChance: number;
  plantChance: number;
  treePool: { species: TreeSpecies; weight: number }[];
  plantPool: { species: PlantSpecies; weight: number }[];
  mineralPool: { species: MineralSpecies; weight: number }[];
  wildlifeHabitats: WildlifeHabitatSpec[];
  monsterPool: EnemyType[];
}

export const BIOME_CONFIGS: Record<BiomeId, BiomeConfig> = {
  FORGOTTEN_FOREST: {
    id: 'FORGOTTEN_FOREST',
    displayName: 'Hutan Terlupakan',
    legacyTheme: 'FOREST',
    baseTerrain: 'GRASS',
    secondaryTerrain: 'FOREST_FLOOR',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'NONE',
    weather: 'MIST',
    fogTint: 'rgba(18, 28, 22, 0.08)',
    palette: {
      groundA: '#2D4732',
      groundB: '#35533A',
      groundC: '#243928',
      path: '#6E5A44',
      cliff: '#3A3E42',
      water: '#295F78',
    },
    subAreaNames: [
      'Pembukaan Rimba Awal',
      'Hutan Ek Purba',
      'Lembah Lumut Tua',
      'Batas Kabut Timur',
    ],
    descriptions: [
      'Rimba purba yang lebat dengan sumber air jernih, kayu, herba, dan satwa liar.',
      'Kanopi tua tempat sisa bara kehidupan masih menyala di balik kabut tipis.',
    ],
    treeChance: 0.19,
    rockChance: 0.055,
    plantChance: 0.08,
    treePool: [
      { species: 'OAK', weight: 25 },
      { species: 'PINE', weight: 20 },
      { species: 'BIRCH', weight: 16 },
      { species: 'YOUNG', weight: 14 },
      { species: 'BUSH_TREE', weight: 12 },
      { species: 'FRUIT_TREE', weight: 8 },
      { species: 'ANCIENT', weight: 5 },
    ],
    plantPool: [
      { species: 'WILD_GRASS', weight: 25 },
      { species: 'BERRY_BUSH', weight: 22 },
      { species: 'MEDICINAL_HERB', weight: 18 },
      { species: 'WILD_VEGETABLE', weight: 15 },
      { species: 'MUSHROOM', weight: 12 },
      { species: 'SEED_SPROUT', weight: 5 },
      { species: 'SPECIAL_PLANT', weight: 3 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 52 },
      { species: 'IRON', weight: 24 },
      { species: 'COPPER', weight: 12 },
      { species: 'COAL', weight: 8 },
      { species: 'GOLD', weight: 4 },
    ],
    wildlifeHabitats: [
      {
        species: 'DEER',
        name: 'Rusa Hutan',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'FLEE',
        tameEligible: true,
        rarity: 'COMMON',
        baseHp: 28,
        baseAttack: 4,
        speed: 82,
      },
      {
        species: 'SPIRIT_DEER',
        name: 'Rusa Roh',
        preferredTerrains: ['FOREST_FLOOR', 'CLEARING'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 42,
        baseAttack: 6,
        speed: 80,
      },
      {
        species: 'RABBIT',
        name: 'Kelinci Hutan',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'FLEE',
        tameEligible: false,
        rarity: 'COMMON',
        baseHp: 12,
        baseAttack: 0,
        speed: 96,
      },
      {
        species: 'BIRD',
        name: 'Burung Rimba',
        preferredTerrains: ['GRASS', 'FOREST_FLOOR'],
        activeTime: 'DAY',
        popLimit: 1,
        temperament: 'FLEE',
        tameEligible: false,
        rarity: 'COMMON',
        baseHp: 10,
        baseAttack: 0,
        speed: 92,
      },
      {
        species: 'BOAR',
        name: 'Babi Hutan',
        preferredTerrains: ['FOREST_FLOOR', 'GRASS'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'AGGRESSIVE',
        tameEligible: true,
        rarity: 'COMMON',
        baseHp: 38,
        baseAttack: 8,
        speed: 64,
      },
      {
        species: 'WOLF',
        name: 'Serigala Rimba',
        preferredTerrains: ['FOREST_FLOOR', 'TRAIL'],
        activeTime: 'NIGHT',
        popLimit: 1,
        temperament: 'AGGRESSIVE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 44,
        baseAttack: 10,
        speed: 74,
      },
      {
        species: 'EMBER_FOX',
        name: 'Rubah Bara',
        preferredTerrains: ['CLEARING', 'GRASS'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 34,
        baseAttack: 7,
        speed: 78,
      },
      {
        species: 'TURTLE',
        name: 'Kura-Kura Batu',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 46,
        baseAttack: 5,
        speed: 38,
      },
    ],
    monsterPool: ['FOREST_SKELETON', 'SLIME', 'GOBLIN', 'FOREST_WOLF'],
  },

  VERDANT_GRASSLANDS: {
    id: 'VERDANT_GRASSLANDS',
    displayName: 'Padang Rumput Hijau',
    legacyTheme: 'RIVER',
    baseTerrain: 'GRASS',
    secondaryTerrain: 'CLEARING',
    pathTile: 'ROAD',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'NONE',
    weather: 'CLEAR',
    fogTint: 'rgba(120, 180, 90, 0.04)',
    palette: {
      groundA: '#446E3A',
      groundB: '#527F44',
      groundC: '#395C31',
      path: '#9A8261',
      cliff: '#4B5054',
      water: '#2F7A9C',
    },
    subAreaNames: [
      'Pos Dagang Lembah Bunga',
      'Tepian Sungai Timur',
      'Padang Rumput Subur',
      'Jalur Karavan Hijau',
    ],
    descriptions: [
      'Hamparan padang rumput terbuka dengan aliran sungai jernih dan jalur pedagang.',
      'Wilayah ramah dengan banyak beri, sayur liar, spot memancing, serta persinggahan pedagang.',
    ],
    treeChance: 0.08,
    rockChance: 0.04,
    plantChance: 0.11,
    treePool: [
      { species: 'FRUIT_TREE', weight: 32 },
      { species: 'BIRCH', weight: 28 },
      { species: 'YOUNG', weight: 24 },
      { species: 'OAK', weight: 16 },
    ],
    plantPool: [
      { species: 'WILD_GRASS', weight: 28 },
      { species: 'BERRY_BUSH', weight: 26 },
      { species: 'WILD_VEGETABLE', weight: 24 },
      { species: 'MEDICINAL_HERB', weight: 14 },
      { species: 'SEED_SPROUT', weight: 8 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 65 },
      { species: 'COPPER', weight: 20 },
      { species: 'IRON', weight: 15 },
    ],
    wildlifeHabitats: [
      {
        species: 'DEER',
        name: 'Rusa Padang',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'FLEE',
        tameEligible: true,
        rarity: 'COMMON',
        baseHp: 28,
        baseAttack: 4,
        speed: 85,
      },
      {
        species: 'RABBIT',
        name: 'Kelinci Padang',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'FLEE',
        tameEligible: false,
        rarity: 'COMMON',
        baseHp: 12,
        baseAttack: 0,
        speed: 98,
      },
      {
        species: 'TURTLE',
        name: 'Kura-Kura Sungai',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 46,
        baseAttack: 5,
        speed: 38,
      },
      {
        species: 'EMBER_FOX',
        name: 'Rubah Bara',
        preferredTerrains: ['GRASS', 'CLEARING'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 35,
        baseAttack: 7,
        speed: 80,
      },
    ],
    monsterPool: ['SLIME', 'GOBLIN', 'WILD_BOAR'],
  },

  GREEN_SAVANNA: {
    id: 'GREEN_SAVANNA',
    displayName: 'Sabana Hijau',
    legacyTheme: 'HILLS',
    baseTerrain: 'SAVANNA_GRASS',
    secondaryTerrain: 'SAND',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'HEAT',
    weather: 'HEATWAVE',
    fogTint: 'rgba(180, 140, 50, 0.08)',
    palette: {
      groundA: '#7B7D35',
      groundB: '#8E883E',
      groundC: '#67682B',
      path: '#A78556',
      cliff: '#6E5A49',
      water: '#3E7A80',
    },
    subAreaNames: [
      'Padang Akasia Kering',
      'Sabana Emas Berangin',
      'Dataran Perburuan Hyena',
      'Cekungan Air Sabana',
    ],
    descriptions: [
      'Sabana luas bersemak keemasan dengan pohon akasia dan terik matahari siang.',
      'Rumah bagi kawanan gazel lincah dan hyena pemburu. Waspadai dehidrasi akibat hawa panas.',
    ],
    treeChance: 0.08,
    rockChance: 0.06,
    plantChance: 0.075,
    treePool: [
      { species: 'ACACIA', weight: 68 },
      { species: 'DEAD', weight: 18 },
      { species: 'BUSH_TREE', weight: 14 },
    ],
    plantPool: [
      { species: 'WILD_GRASS', weight: 40 },
      { species: 'DESERT_HERB', weight: 28 },
      { species: 'MEDICINAL_HERB', weight: 18 },
      { species: 'SEED_SPROUT', weight: 14 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 45 },
      { species: 'COPPER', weight: 30 },
      { species: 'IRON', weight: 18 },
      { species: 'GOLD', weight: 7 },
    ],
    wildlifeHabitats: [
      {
        species: 'GAZELLE',
        name: 'Gazel Sabana',
        preferredTerrains: ['SAVANNA_GRASS', 'SAND'],
        activeTime: 'DAY',
        popLimit: 3,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'COMMON',
        baseHp: 34,
        baseAttack: 4,
        speed: 96,
      },
      {
        species: 'HYENA',
        name: 'Hyena Sabana',
        preferredTerrains: ['SAVANNA_GRASS', 'TRAIL'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'AGGRESSIVE',
        tameEligible: false,
        rarity: 'UNCOMMON',
        baseHp: 48,
        baseAttack: 11,
        speed: 82,
      },
      {
        species: 'BIRD',
        name: 'Burung Sabana',
        preferredTerrains: ['SAVANNA_GRASS'],
        activeTime: 'DAY',
        popLimit: 1,
        temperament: 'FLEE',
        tameEligible: false,
        rarity: 'COMMON',
        baseHp: 12,
        baseAttack: 0,
        speed: 94,
      },
    ],
    monsterPool: ['SAVANNA_HYENA', 'GOBLIN', 'WILD_BOAR'],
  },

  SCORCHED_DESERT: {
    id: 'SCORCHED_DESERT',
    displayName: 'Gurun Membara',
    legacyTheme: 'CLIFFS',
    baseTerrain: 'SAND',
    secondaryTerrain: 'SAVANNA_GRASS',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'EXTREME_HEAT',
    weather: 'HEATWAVE',
    fogTint: 'rgba(220, 140, 50, 0.14)',
    palette: {
      groundA: '#C29A5B',
      groundB: '#B18749',
      groundC: '#D1AC6E',
      path: '#9A7442',
      cliff: '#825B3B',
      water: '#338896',
    },
    subAreaNames: [
      'Oasis & Karavan Pasir',
      'Bukit Pasir Terik',
      'Ngarai Kalajengking',
      'Lembah Matahari',
    ],
    descriptions: [
      'Hamparan pasir panas ekstrem yang menguras dahaga cepat tanpa Jubah Linen atau Ramuan Pendingin.',
      'Pedagang karavan langka sesekali singgah di dekat oasis gurun.',
    ],
    treeChance: 0.055,
    rockChance: 0.07,
    plantChance: 0.05,
    treePool: [
      { species: 'CACTUS', weight: 74 },
      { species: 'DEAD', weight: 26 },
    ],
    plantPool: [
      { species: 'DESERT_HERB', weight: 58 },
      { species: 'WILD_GRASS', weight: 22 },
      { species: 'SPECIAL_PLANT', weight: 20 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 40 },
      { species: 'GOLD', weight: 18 },
      { species: 'COPPER', weight: 28 },
      { species: 'IRON', weight: 14 },
    ],
    wildlifeHabitats: [
      {
        species: 'DESERT_FOX',
        name: 'Rubah Pasir',
        preferredTerrains: ['SAND'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 34,
        baseAttack: 6,
        speed: 88,
      },
      {
        species: 'SCORPION',
        name: 'Kalajengking Gurun',
        preferredTerrains: ['SAND'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'AGGRESSIVE',
        tameEligible: false,
        rarity: 'UNCOMMON',
        baseHp: 44,
        baseAttack: 11,
        speed: 68,
      },
    ],
    monsterPool: ['DESERT_SCORPION', 'GOBLIN', 'FOREST_SKELETON'],
  },

  FROZEN_HIGHLANDS: {
    id: 'FROZEN_HIGHLANDS',
    displayName: 'Dataran Tinggi Beku',
    legacyTheme: 'CLIFFS',
    baseTerrain: 'SNOW',
    secondaryTerrain: 'ICE',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'ICE',
    hazard: 'EXTREME_COLD',
    weather: 'SNOW',
    fogTint: 'rgba(170, 210, 240, 0.14)',
    palette: {
      groundA: '#CBD8E4',
      groundB: '#B5C8D8',
      groundC: '#DCE6F0',
      path: '#8E9EAD',
      cliff: '#5D6E7E',
      water: '#7FB7D9',
    },
    subAreaNames: [
      'Puncak Salju Utara',
      'Ruang Es Terkubur',
      'Lembah Serigala Putih',
      'Gletser Abadi',
    ],
    descriptions: [
      'Dataran bersalju ekstrem dengan badai salju yang menguras stamina dan HP tanpa Jubah Bulu atau Obor.',
      'Kristal Es Abadi tumbuh di celah tebing dan dijaga oleh Golem Es purba.',
    ],
    treeChance: 0.12,
    rockChance: 0.08,
    plantChance: 0.055,
    treePool: [
      { species: 'SNOW_PINE', weight: 76 },
      { species: 'DEAD', weight: 24 },
    ],
    plantPool: [
      { species: 'FROST_BLOOM', weight: 62 },
      { species: 'MEDICINAL_HERB', weight: 24 },
      { species: 'SPECIAL_PLANT', weight: 14 },
    ],
    mineralPool: [
      { species: 'ICE_CRYSTAL', weight: 38 },
      { species: 'IRON', weight: 28 },
      { species: 'STONE', weight: 24 },
      { species: 'GOLD', weight: 10 },
    ],
    wildlifeHabitats: [
      {
        species: 'SNOW_WOLF',
        name: 'Serigala Salju',
        preferredTerrains: ['SNOW', 'ICE'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'AGGRESSIVE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 52,
        baseAttack: 12,
        speed: 80,
      },
      {
        species: 'ARCTIC_FOX',
        name: 'Rubah Salju',
        preferredTerrains: ['SNOW'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 38,
        baseAttack: 6,
        speed: 86,
      },
      {
        species: 'MOUNTAIN_GOAT',
        name: 'Kambing Tebing',
        preferredTerrains: ['SNOW', 'TRAIL'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 56,
        baseAttack: 7,
        speed: 70,
      },
    ],
    monsterPool: ['FROST_GOLEM', 'DARK_CREATURE', 'DIRE_WOLF'],
  },

  ANCIENT_MOUNTAINS: {
    id: 'ANCIENT_MOUNTAINS',
    displayName: 'Pegunungan Kuno',
    legacyTheme: 'CLIFFS',
    baseTerrain: 'FOREST_FLOOR',
    secondaryTerrain: 'CLEARING',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'COLD',
    weather: 'MIST',
    fogTint: 'rgba(130, 155, 180, 0.10)',
    palette: {
      groundA: '#495256',
      groundB: '#596368',
      groundC: '#3B4246',
      path: '#6E6659',
      cliff: '#2F353A',
      water: '#2F657E',
    },
    subAreaNames: [
      'Celah Tambang & Gua Batu',
      'Punggung Batu Utara',
      'Sarang Elang Karang',
      'Ngarai Bijih Emas',
    ],
    descriptions: [
      'Pegunungan batu kaya akan bijih besi, tembaga, batu bara, dan urat emas.',
      'Angin dingin pegunungan bertiup kencang dan gua batu menyimpan Troll Purba.',
    ],
    treeChance: 0.1,
    rockChance: 0.13,
    plantChance: 0.055,
    treePool: [
      { species: 'PINE', weight: 62 },
      { species: 'DEAD', weight: 24 },
      { species: 'SNOW_PINE', weight: 14 },
    ],
    plantPool: [
      { species: 'MEDICINAL_HERB', weight: 38 },
      { species: 'MUSHROOM', weight: 32 },
      { species: 'FROST_BLOOM', weight: 18 },
      { species: 'WILD_GRASS', weight: 12 },
    ],
    mineralPool: [
      { species: 'IRON', weight: 38 },
      { species: 'STONE', weight: 28 },
      { species: 'COAL', weight: 16 },
      { species: 'COPPER', weight: 10 },
      { species: 'GOLD', weight: 8 },
    ],
    wildlifeHabitats: [
      {
        species: 'MOUNTAIN_GOAT',
        name: 'Kambing Tebing',
        preferredTerrains: ['FOREST_FLOOR', 'CLEARING'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 56,
        baseAttack: 7,
        speed: 70,
      },
      {
        species: 'EAGLE',
        name: 'Elang Pegunungan',
        preferredTerrains: ['FOREST_FLOOR', 'TRAIL'],
        activeTime: 'DAY',
        popLimit: 2,
        temperament: 'AGGRESSIVE',
        tameEligible: false,
        rarity: 'RARE',
        baseHp: 32,
        baseAttack: 8,
        speed: 98,
      },
    ],
    monsterPool: ['CAVE_TROLL', 'FOREST_SKELETON', 'GOBLIN'],
  },

  DEEPWOOD: {
    id: 'DEEPWOOD',
    displayName: 'Rimba Dalam',
    legacyTheme: 'HILLS',
    baseTerrain: 'FOREST_FLOOR',
    secondaryTerrain: 'GRASS',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'WATER',
    hazard: 'POISON',
    weather: 'RAIN',
    fogTint: 'rgba(65, 115, 70, 0.16)',
    palette: {
      groundA: '#223829',
      groundB: '#1C2E22',
      groundC: '#2C4733',
      path: '#54493C',
      cliff: '#2B322E',
      water: '#29574B',
    },
    subAreaNames: [
      'Kanopi Kabut & Pondok Alkemis',
      'Lembah Spora Beracun',
      'Rawa Akar Purba',
      'Sarang Serigala Purba',
    ],
    descriptions: [
      'Hutan terdalam diselimuti spora beracun tipis yang mengikis HP tanpa Topeng Filter atau Penawar Racun.',
      'Seorang Alkemis pertapa berdiam di ruang aman kecil untuk meracik penawar bagi pengembara.',
    ],
    treeChance: 0.23,
    rockChance: 0.05,
    plantChance: 0.095,
    treePool: [
      { species: 'ANCIENT', weight: 34 },
      { species: 'CORRUPTED', weight: 30 },
      { species: 'OAK', weight: 22 },
      { species: 'DEAD', weight: 14 },
    ],
    plantPool: [
      { species: 'MUSHROOM', weight: 36 },
      { species: 'SPECIAL_PLANT', weight: 24 },
      { species: 'MEDICINAL_HERB', weight: 24 },
      { species: 'BERRY_BUSH', weight: 16 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 45 },
      { species: 'COAL', weight: 25 },
      { species: 'IRON', weight: 22 },
      { species: 'GOLD', weight: 8 },
    ],
    wildlifeHabitats: [
      {
        species: 'DIRE_WOLF',
        name: 'Serigala Purba',
        preferredTerrains: ['FOREST_FLOOR'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'AGGRESSIVE',
        tameEligible: false,
        rarity: 'EPIC',
        baseHp: 64,
        baseAttack: 14,
        speed: 82,
      },
      {
        species: 'SPIRIT_DEER',
        name: 'Rusa Roh',
        preferredTerrains: ['GRASS', 'FOREST_FLOOR'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'RARE',
        baseHp: 44,
        baseAttack: 6,
        speed: 82,
      },
    ],
    monsterPool: ['CORRUPTED_STAG', 'DIRE_WOLF', 'DARK_CREATURE', 'SLIME'],
  },

  FALLEN_KINGDOM: {
    id: 'FALLEN_KINGDOM',
    displayName: 'Kerajaan Runtuh',
    legacyTheme: 'RUINS',
    baseTerrain: 'CLEARING',
    secondaryTerrain: 'FOREST_FLOOR',
    pathTile: 'ROAD',
    wallTile: 'RUIN_STONE',
    waterTile: 'WATER',
    hazard: 'NONE',
    weather: 'MIST',
    fogTint: 'rgba(110, 100, 125, 0.10)',
    palette: {
      groundA: '#3D423A',
      groundB: '#4A4E44',
      groundC: '#323630',
      path: '#7A756B',
      cliff: '#585A60',
      water: '#335D70',
    },
    subAreaNames: [
      'Alun-Alun Pasar Tua',
      'Gerbang Reruntuhan Barat',
      'Benteng Ksatria Gugur',
      'Makam Raja Terlupakan',
    ],
    descriptions: [
      'Bekas kota kerajaan tua. Pusat alun-alun masih dijaga pedagang dan pandai besi, sementara reruntuhan luar dijaga ksatria mayat hidup.',
    ],
    treeChance: 0.09,
    rockChance: 0.08,
    plantChance: 0.06,
    treePool: [
      { species: 'DEAD', weight: 46 },
      { species: 'CORRUPTED', weight: 28 },
      { species: 'OAK', weight: 26 },
    ],
    plantPool: [
      { species: 'MUSHROOM', weight: 35 },
      { species: 'WILD_GRASS', weight: 35 },
      { species: 'MEDICINAL_HERB', weight: 20 },
      { species: 'SPECIAL_PLANT', weight: 10 },
    ],
    mineralPool: [
      { species: 'STONE', weight: 40 },
      { species: 'IRON', weight: 38 },
      { species: 'GOLD', weight: 12 },
      { species: 'COAL', weight: 10 },
    ],
    wildlifeHabitats: [
      {
        species: 'BIRD',
        name: 'Gagak Puing',
        preferredTerrains: ['CLEARING', 'ROAD'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'FLEE',
        tameEligible: false,
        rarity: 'COMMON',
        baseHp: 14,
        baseAttack: 0,
        speed: 92,
      },
      {
        species: 'WOLF',
        name: 'Serigala Puing',
        preferredTerrains: ['FOREST_FLOOR', 'CLEARING'],
        activeTime: 'NIGHT',
        popLimit: 1,
        temperament: 'AGGRESSIVE',
        tameEligible: true,
        rarity: 'UNCOMMON',
        baseHp: 46,
        baseAttack: 11,
        speed: 78,
      },
    ],
    monsterPool: ['UNDEAD_KNIGHT', 'FOREST_SKELETON', 'DARK_CREATURE'],
  },

  ASHEN_VOLCANO: {
    id: 'ASHEN_VOLCANO',
    displayName: 'Gunung Berapi Kelabu',
    legacyTheme: 'CLIFFS',
    baseTerrain: 'ASH',
    secondaryTerrain: 'FOREST_FLOOR',
    pathTile: 'TRAIL',
    wallTile: 'CLIFF',
    waterTile: 'LAVA',
    hazard: 'VOLCANIC',
    weather: 'ASH',
    fogTint: 'rgba(195, 75, 35, 0.16)',
    palette: {
      groundA: '#332C2B',
      groundB: '#443836',
      groundC: '#272120',
      path: '#5B463F',
      cliff: '#221B1A',
      water: '#D9531E',
    },
    subAreaNames: [
      'Kaldera Abu & Lahar',
      'Lereng Obsidian',
      'Retakan Api Purba',
      'Tahta Bara Kelabu',
    ],
    descriptions: [
      'Wilayah vulkanik mematikan penuh abu panas dan aliran lahar. Wajib membawa Zirah Obsidian atau Eliksir Tahan Api.',
      'Sumber utama Obsidian Vulkanik dan Abu Bara Purba.',
    ],
    treeChance: 0.06,
    rockChance: 0.12,
    plantChance: 0.045,
    treePool: [
      { species: 'CHARRED', weight: 78 },
      { species: 'DEAD', weight: 22 },
    ],
    plantPool: [
      { species: 'ASH_FERN', weight: 72 },
      { species: 'SPECIAL_PLANT', weight: 28 },
    ],
    mineralPool: [
      { species: 'OBSIDIAN', weight: 42 },
      { species: 'COAL', weight: 28 },
      { species: 'IRON', weight: 18 },
      { species: 'GOLD', weight: 12 },
    ],
    wildlifeHabitats: [
      {
        species: 'FIRE_BEAST',
        name: 'Rubah Magma',
        preferredTerrains: ['ASH', 'TRAIL'],
        activeTime: 'ANY',
        popLimit: 2,
        temperament: 'TAMEABLE',
        tameEligible: true,
        rarity: 'EPIC',
        baseHp: 58,
        baseAttack: 13,
        speed: 84,
      },
      {
        species: 'SCORPION',
        name: 'Kalajengking Bara',
        preferredTerrains: ['ASH'],
        activeTime: 'ANY',
        popLimit: 1,
        temperament: 'AGGRESSIVE',
        tameEligible: false,
        rarity: 'UNCOMMON',
        baseHp: 50,
        baseAttack: 12,
        speed: 72,
      },
    ],
    monsterPool: ['MAGMA_FIEND', 'DARK_CREATURE', 'CAVE_TROLL'],
  },
};

export interface CuratedRegionSpec {
  biomeId: BiomeId;
  subAreaName: string;
  description: string;
  settlementKind: SettlementKind;
  isSafeZone: boolean;
  isIndoor: boolean;
}

export function getCuratedRegionSpec(seed: number, rx: number, ry: number): CuratedRegionSpec {
  if (rx === 0 && ry === 0) {
    return {
      biomeId: 'FORGOTTEN_FOREST',
      subAreaName: 'Pembukaan Rimba Awal',
      description: BIOME_CONFIGS.FORGOTTEN_FOREST.descriptions[0],
      settlementKind: 'NONE',
      isSafeZone: false,
      isIndoor: false,
    };
  }
  if (rx === 1 && ry === 0) {
    return {
      biomeId: 'VERDANT_GRASSLANDS',
      subAreaName: 'Pos Dagang Lembah Bunga',
      description: 'Pos dagang aman di tepi sungai Padang Rumput Hijau. Tempat bertukar barang dan beristirahat.',
      settlementKind: 'TRADING_OUTPOST',
      isSafeZone: true,
      isIndoor: false,
    };
  }
  if (rx === 2 && ry === 0) {
    return {
      biomeId: 'GREEN_SAVANNA',
      subAreaName: 'Padang Akasia Kering',
      description: BIOME_CONFIGS.GREEN_SAVANNA.descriptions[0],
      settlementKind: 'NONE',
      isSafeZone: false,
      isIndoor: false,
    };
  }
  if ((rx === 2 && ry === 1) || (rx === 3 && ry === 0)) {
    return {
      biomeId: 'SCORCHED_DESERT',
      subAreaName: rx === 3 ? 'Ngarai Kalajengking' : 'Oasis & Karavan Pasir',
      description:
        rx === 3
          ? BIOME_CONFIGS.SCORCHED_DESERT.descriptions[0]
          : 'Oasis Gurun Membara tempat Pedagang Karavan Langka menjajakan relik dan zirah tahan panas.',
      settlementKind: rx === 3 ? 'NONE' : 'RARE_TRADER',
      isSafeZone: rx !== 3,
      isIndoor: false,
    };
  }
  if (rx === -1 && ry === 0) {
    return {
      biomeId: 'FALLEN_KINGDOM',
      subAreaName: 'Alun-Alun Pasar Tua',
      description:
        'Alun-alun aman Kerajaan Runtuh dengan Pedagang Desa & Pandai Besi. Bagian luar dikelilingi puing ksatria mati.',
      settlementKind: 'MERCHANT_VILLAGE',
      isSafeZone: true,
      isIndoor: false,
    };
  }
  if (rx === 0 && ry === 1) {
    return {
      biomeId: 'DEEPWOOD',
      subAreaName: 'Kanopi Kabut & Pondok Alkemis',
      description:
        'Rimba Dalam beracun tempat seorang Alkemis pertapa menjual penawar racun dan ramuan langka.',
      settlementKind: 'ALCHEMIST',
      isSafeZone: false,
      isIndoor: false,
    };
  }
  if (rx === 0 && ry === -1) {
    return {
      biomeId: 'ANCIENT_MOUNTAINS',
      subAreaName: 'Celah Tambang & Gua Batu',
      description:
        'Pegunungan kaya bijih emas dan besi dengan pintu Gua Batu tempat Troll Purba bersemayam.',
      settlementKind: 'CAVE',
      isSafeZone: false,
      isIndoor: false,
    };
  }
  if (rx === 0 && ry === -2) {
    return {
      biomeId: 'FROZEN_HIGHLANDS',
      subAreaName: 'Puncak Salju & Ruang Es',
      description:
        'Dataran Tinggi Beku ekstrem dengan Dungeon Ruang Es kuno dan Golem Es penjaga.',
      settlementKind: 'DUNGEON',
      isSafeZone: false,
      isIndoor: false,
    };
  }
  if ((rx === -1 && ry === -1) || (rx === -2 && ry === 0)) {
    return {
      biomeId: 'ASHEN_VOLCANO',
      subAreaName: rx === -2 ? 'Tahta Bara Kelabu' : 'Kaldera Abu & Lahar',
      description: BIOME_CONFIGS.ASHEN_VOLCANO.descriptions[0],
      settlementKind: rx === -2 ? 'BOSS_LAIR' : 'NONE',
      isSafeZone: false,
      isIndoor: false,
    };
  }

  // Deterministic procedural biome assignment for outer regions based on coordinates & seed
  const biomeOrder: BiomeId[] = [
    'FORGOTTEN_FOREST',
    'VERDANT_GRASSLANDS',
    'GREEN_SAVANNA',
    'SCORCHED_DESERT',
    'ANCIENT_MOUNTAINS',
    'FROZEN_HIGHLANDS',
    'DEEPWOOD',
    'FALLEN_KINGDOM',
    'ASHEN_VOLCANO',
  ];

  // Bias biomes naturally by latitude/longitude while guaranteeing variety
  let picked: BiomeId;
  if (ry <= -2) {
    picked = hashCoords(seed, rx, ry, 911) < 0.65 ? 'FROZEN_HIGHLANDS' : 'ANCIENT_MOUNTAINS';
  } else if (rx >= 2 && ry >= 0) {
    picked = hashCoords(seed, rx, ry, 912) < 0.55 ? 'SCORCHED_DESERT' : 'GREEN_SAVANNA';
  } else if (rx <= -2) {
    picked = hashCoords(seed, rx, ry, 913) < 0.55 ? 'ASHEN_VOLCANO' : 'FALLEN_KINGDOM';
  } else if (ry >= 2) {
    picked = hashCoords(seed, rx, ry, 914) < 0.6 ? 'DEEPWOOD' : 'VERDANT_GRASSLANDS';
  } else {
    const idx = Math.floor(hashCoords(seed, rx, ry, 915) * biomeOrder.length);
    picked = biomeOrder[idx] ?? 'FORGOTTEN_FOREST';
  }

  const cfg = BIOME_CONFIGS[picked];
  const subIdx = Math.floor(hashCoords(seed, rx, ry, 919) * cfg.subAreaNames.length);
  const descIdx = Math.floor(hashCoords(seed, rx, ry, 923) * cfg.descriptions.length);

  // Occasional procedural settlement/dungeon in distant regions
  const poiRoll = hashCoords(seed, rx, ry, 937);
  let settlementKind: SettlementKind = 'NONE';
  if (picked === 'VERDANT_GRASSLANDS' && poiRoll < 0.25) settlementKind = 'TRADING_OUTPOST';
  else if (picked === 'FALLEN_KINGDOM' && poiRoll < 0.3) settlementKind = 'BLACKSMITH';
  else if (picked === 'ANCIENT_MOUNTAINS' && poiRoll < 0.32) settlementKind = 'CAVE';
  else if (picked === 'FROZEN_HIGHLANDS' && poiRoll < 0.28) settlementKind = 'DUNGEON';
  else if (picked === 'ASHEN_VOLCANO' && poiRoll < 0.24) settlementKind = 'BOSS_LAIR';

  return {
    biomeId: picked,
    subAreaName: cfg.subAreaNames[subIdx] ?? cfg.displayName,
    description: cfg.descriptions[descIdx] ?? cfg.descriptions[0],
    settlementKind,
    isSafeZone: settlementKind === 'TRADING_OUTPOST' || settlementKind === 'BLACKSMITH',
    isIndoor: false,
  };
}
