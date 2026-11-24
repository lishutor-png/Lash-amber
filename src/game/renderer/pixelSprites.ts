import {
  AnimalSpecies,
  CharacterClassId,
  EnemyType,
  ItemId,
  MerchantRoleKind,
} from '../core/types';
import {
  AnimalSpriteOptions,
  CharacterSpriteOptions,
  MonsterSpriteOptions,
  SkeletonSpriteOptions,
  drawIllustratedAnimal,
  drawIllustratedCharacter,
  drawIllustratedItem,
  drawIllustratedMerchant,
  drawIllustratedMonster,
  drawIllustratedSkeleton,
} from './illustratedSprites';

export type {
  AnimalSpriteOptions,
  CharacterSpriteOptions,
  MonsterSpriteOptions,
  SkeletonSpriteOptions,
};

export function drawCharacterPixelSprite(
  ctx: CanvasRenderingContext2D,
  classId: CharacterClassId,
  x: number,
  y: number,
  scale: number,
  options: CharacterSpriteOptions = {}
) {
  drawIllustratedCharacter(ctx, classId, x, y, scale, options);
}

export function drawSkeletonPixelSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  options: SkeletonSpriteOptions = {}
) {
  drawIllustratedSkeleton(ctx, x, y, scale, options);
}

export function drawAnimalPixelSprite(
  ctx: CanvasRenderingContext2D,
  species: AnimalSpecies,
  x: number,
  y: number,
  scale: number,
  options: AnimalSpriteOptions = {}
) {
  drawIllustratedAnimal(ctx, species, x, y, scale, options);
}

export function drawMonsterPixelSprite(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number,
  y: number,
  scale: number,
  options: MonsterSpriteOptions = {}
) {
  drawIllustratedMonster(ctx, enemyType, x, y, scale, options);
}

export function drawMerchantNpcSprite(
  ctx: CanvasRenderingContext2D,
  kind: MerchantRoleKind,
  x: number,
  y: number,
  scale: number,
  nowMs = 0
) {
  drawIllustratedMerchant(ctx, kind, x, y, scale, nowMs);
}

export function drawItemPixelIcon(
  ctx: CanvasRenderingContext2D,
  itemId: ItemId,
  x: number,
  y: number,
  pixelSize: number
) {
  drawIllustratedItem(ctx, itemId, x, y, 16 * pixelSize);
}
