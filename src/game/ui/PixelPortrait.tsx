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
  drawIllustratedAnimal,
  drawIllustratedCharacter,
  drawIllustratedItem,
  drawIllustratedMonster,
} from '../renderer/illustratedSprites';
import { getCachedOffscreenSprite } from '../renderer/spriteCache';

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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(size * dpr);
    const targetH = Math.round(size * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetW, targetH);

    const cacheKey = `char:${classId}:${targetW}:${weaponVisual ?? 'def'}:${armorVisual ?? 'def'}:${offhandVisual ?? 'def'}:${helmetVisual ?? 'def'}`;
    const cached = getCachedOffscreenSprite(cacheKey, targetW, targetH, (octx, w) => {
      const spriteScale = w / 48;
      drawIllustratedCharacter(octx, classId, 0, 0, spriteScale, {
        facing: 'down',
        animState: 'IDLE',
        weaponVisual,
        armorVisual,
        offhandVisual,
        helmetVisual,
        nowMs: 0,
      });
    });

    if (cached) {
      ctx.drawImage(cached, 0, 0);
    }
  }, [classId, size, weaponVisual, armorVisual, offhandVisual, helmetVisual]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`illustrated-canvas block shrink-0 ${className}`}
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(size * dpr);
    const targetH = Math.round(size * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetW, targetH);

    const cacheKey = `enemy:${enemyType}:${targetW}:${isGuarding ? 1 : 0}:${isPrepared ? 1 : 0}`;
    const cached = getCachedOffscreenSprite(cacheKey, targetW, targetH, (octx, w) => {
      drawIllustratedMonster(octx, enemyType, 0, 0, w / 48, {
        isGuarding,
        isPrepared,
        animState: 'IDLE',
        nowMs: 0,
      });
    });

    if (cached) {
      ctx.drawImage(cached, 0, 0);
    }
  }, [size, enemyType, isGuarding, isPrepared]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`illustrated-canvas block shrink-0 ${className}`}
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(size * dpr);
    const targetH = Math.round(size * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetW, targetH);

    const cacheKey = `animal:${species}:${targetW}`;
    const cached = getCachedOffscreenSprite(cacheKey, targetW, targetH, (octx, w) => {
      drawIllustratedAnimal(octx, species, 0, 0, w / 48, {
        facing: 'right',
        animState: 'IDLE',
        nowMs: 0,
      });
    });

    if (cached) {
      ctx.drawImage(cached, 0, 0);
    }
  }, [species, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`illustrated-canvas block shrink-0 ${className}`}
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
  size = 40,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(size * dpr);
    const targetH = Math.round(size * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetW, targetH);

    const cacheKey = `item:${itemId}:${targetW}`;
    const cached = getCachedOffscreenSprite(cacheKey, targetW, targetH, (octx, w) => {
      drawIllustratedItem(octx, itemId, 0, 0, w);
    });

    if (cached) {
      ctx.drawImage(cached, 0, 0);
    }
  }, [itemId, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`illustrated-canvas block shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
};

export const ItemIllustration = ItemPixelIcon;
