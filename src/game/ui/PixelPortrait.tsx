import React, { useEffect, useRef } from 'react';
import {
  AnimalSpecies,
  ArmorVisualKind,
  CharacterClassId,
  EnemyType,
  HelmetVisualKind,
  ItemId,
  OffhandVisualKind,
  WeaponVisualKind,
} from '../core/types';
import {
  drawAnimalPixelSprite,
  drawCharacterPixelSprite,
  drawItemPixelIcon,
  drawMonsterPixelSprite,
} from '../renderer/pixelSprites';

interface CharacterPortraitProps {
  classId: CharacterClassId;
  size?: number;
  weaponVisual?: WeaponVisualKind;
  armorVisual?: ArmorVisualKind;
  offhandVisual?: OffhandVisualKind;
  helmetVisual?: HelmetVisualKind;
  className?: string;
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  classId,
  size = 48,
  weaponVisual,
  armorVisual,
  offhandVisual,
  helmetVisual,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelScale = Math.max(1, canvas.width / 48);
    const drawSize = 48 * pixelScale;
    const offset = Math.floor((canvas.width - drawSize) / 2);
    drawCharacterPixelSprite(ctx, classId, offset, offset, pixelScale, {
      facing: 'down',
      animState: 'IDLE',
      weaponVisual,
      armorVisual,
      offhandVisual,
      helmetVisual,
      nowMs: 0,
    });
  }, [classId, size, weaponVisual, armorVisual, offhandVisual, helmetVisual]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated block ${className}`}
      aria-hidden="true"
    />
  );
};

interface SkeletonPortraitProps {
  size?: number;
  enemyType?: EnemyType;
  isGuarding?: boolean;
  isPrepared?: boolean;
  className?: string;
}

export const SkeletonPortrait: React.FC<SkeletonPortraitProps> = ({
  size = 64,
  enemyType = 'FOREST_SKELETON',
  isGuarding = false,
  isPrepared = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelScale = Math.max(1, canvas.width / 48);
    const drawSize = 48 * pixelScale;
    const offset = Math.floor((canvas.width - drawSize) / 2);
    drawMonsterPixelSprite(ctx, enemyType, offset, offset, pixelScale, {
      isGuarding,
      isPrepared,
      animState: 'IDLE',
      nowMs: 0,
    });
  }, [size, enemyType, isGuarding, isPrepared]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated block ${className}`}
      aria-hidden="true"
    />
  );
};

interface AnimalPortraitProps {
  species: AnimalSpecies;
  size?: number;
  className?: string;
}

export const AnimalPortrait: React.FC<AnimalPortraitProps> = ({
  species,
  size = 48,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelScale = Math.max(1, canvas.width / 48);
    const drawSize = 48 * pixelScale;
    const offset = Math.floor((canvas.width - drawSize) / 2);
    drawAnimalPixelSprite(ctx, species, offset, offset, pixelScale, {
      facing: 'right',
      animState: 'IDLE',
      nowMs: 0,
    });
  }, [species, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated block ${className}`}
      aria-hidden="true"
    />
  );
};

interface ItemIconProps {
  itemId: ItemId;
  size?: number;
  className?: string;
}

export const ItemPixelIcon: React.FC<ItemIconProps> = ({
  itemId,
  size = 32,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelScale = Math.max(1, Math.floor(canvas.width / 16));
    const offset = Math.floor((canvas.width - 16 * pixelScale) / 2);
    drawItemPixelIcon(ctx, itemId, offset, offset, pixelScale);
  }, [itemId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated block ${className}`}
      aria-hidden="true"
    />
  );
};
