import { CHARACTER_CLASSES } from '../character/classes';
import {
  AnimalSpecies,
  ArmorVisualKind,
  CharacterAnimState,
  CharacterClassId,
  Direction,
  EnemyType,
  HelmetVisualKind,
  MerchantRoleKind,
  OffhandVisualKind,
  WeaponVisualKind,
} from '../core/types';
export { drawIllustratedItem } from './illustratedItems';

export interface CharacterSpriteOptions {
  facing?: Direction;
  walkPhase?: number;
  animState?: CharacterAnimState;
  animProgress?: number;
  weaponVisual?: WeaponVisualKind;
  armorVisual?: ArmorVisualKind;
  offhandVisual?: OffhandVisualKind;
  helmetVisual?: HelmetVisualKind;
  nowMs?: number;
  hitFlash?: boolean;
}

export interface SkeletonSpriteOptions {
  walkPhase?: number;
  isGuarding?: boolean;
  isPrepared?: boolean;
  animState?: CharacterAnimState;
  animProgress?: number;
  nowMs?: number;
  hitFlash?: boolean;
}

export interface AnimalSpriteOptions {
  facing?: Direction;
  walkPhase?: number;
  animState?: CharacterAnimState;
  animProgress?: number;
  nowMs?: number;
  hitFlash?: boolean;
  isMoving?: boolean;
  isEating?: boolean;
}

export interface MonsterSpriteOptions extends SkeletonSpriteOptions {
  facing?: Direction;
}

const INK = '#0D0F12';

function gradV(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  yBot: number,
  topCol: string,
  botCol: string
) {
  const g = ctx.createLinearGradient(x, yTop, x, yBot);
  g.addColorStop(0, topCol);
  g.addColorStop(1, botCol);
  return g;
}

function tint(hitFlash: boolean | undefined, fill: string | CanvasGradient): string | CanvasGradient {
  return hitFlash ? '#FFF6DD' : fill;
}

function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  fill: string | CanvasGradient,
  outlineW = 1.6
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = width + outlineW * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const g = ctx.createRadialGradient(cx, cy, rx * 0.15, cx, cy, rx);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws an HD 2D dark-fantasy illustrated character sprite inside a 48*scale logical box.
 */
export function drawIllustratedCharacter(
  ctx: CanvasRenderingContext2D,
  classId: CharacterClassId,
  x: number,
  y: number,
  scale: number,
  options: CharacterSpriteOptions = {}
) {
  const def = CHARACTER_CLASSES[classId];
  const { primary, secondary, accent, skin, hair } = def.colors;

  const facing = options.facing ?? 'down';
  const walkPhase = options.walkPhase ?? 0;
  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const weaponKind = options.weaponVisual ?? def.weaponVisual;
  const armorKind = options.armorVisual ?? def.armorVisual;
  const offhandKind = options.offhandVisual;
  const helmetKind = options.helmetVisual;
  const hf = options.hitFlash;

  let offsetX = 0;
  let offsetY = 0;
  let bob = 0;
  let bodyLean = 0;
  let weaponAngle = -0.35;
  let weaponOffsetX = 0;
  let weaponOffsetY = 0;
  let shieldOffsetY = 0;
  let leftStride = 0;
  let rightStride = 0;
  let isDead = false;

  if (animState === 'IDLE') {
    bob = Math.sin(nowMs * 0.0038) * 0.8;
    weaponAngle = -0.3 + Math.sin(nowMs * 0.003) * 0.05;
  } else if (animState === 'WALK' || animState === 'RUN') {
    const isRun = animState === 'RUN';
    const amp = isRun ? 4.4 : 2.8;
    bob = -Math.abs(Math.sin(walkPhase)) * (isRun ? 2.4 : 1.5);
    leftStride = Math.sin(walkPhase) * amp;
    rightStride = -leftStride;
    bodyLean = isRun ? 0.12 : 0.04;
    weaponAngle = -0.3 + Math.cos(walkPhase) * 0.25;
  } else if (animState === 'ATTACK') {
    const swing = Math.sin(t * Math.PI);
    const dir = facing === 'left' ? -1 : 1;
    offsetX = swing * 6.5 * dir;
    bodyLean = swing * 0.16 * dir;
    if (weaponKind === 'BOW') {
      weaponAngle = -0.15;
      weaponOffsetX = -swing * 2;
    } else if (weaponKind === 'SPEAR') {
      weaponAngle = 0.05;
      weaponOffsetX = swing * 8;
    } else if (weaponKind === 'STAFF' || weaponKind === 'TOTEM' || weaponKind === 'SCYTHE') {
      weaponAngle = -0.9 + swing * 1.4;
      weaponOffsetY = -swing * 3;
    } else {
      // Sword/Blade/Daggers/Sickle/Knife sweeping arc
      weaponAngle = -1.4 + t * 2.5;
      weaponOffsetX = swing * 4;
      weaponOffsetY = -Math.sin(t * Math.PI) * 3;
    }
  } else if (animState === 'HEAVY_ATTACK') {
    const dir = facing === 'left' ? -1 : 1;
    if (t < 0.35) {
      const wind = t / 0.35;
      offsetX = -wind * 3.5 * dir;
      bodyLean = -wind * 0.15 * dir;
      weaponAngle = -1.9 * wind;
      weaponOffsetY = -wind * 5;
    } else {
      const smash = (t - 0.35) / 0.65;
      const impact = Math.sin(smash * Math.PI);
      offsetX = impact * 9 * dir;
      bodyLean = impact * 0.24 * dir;
      weaponAngle = -1.9 + smash * 3.0;
      weaponOffsetX = impact * 5;
      weaponOffsetY = smash * 3;
    }
  } else if (animState === 'CAST_SPELL') {
    const pulse = Math.sin(t * Math.PI);
    bob = -pulse * 2.6;
    weaponAngle = -0.6 - pulse * 0.55;
    weaponOffsetY = -pulse * 5;
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    const dir = facing === 'left' ? 1 : -1;
    offsetX = recoil * 4.5 * dir;
    offsetY = -recoil * 2;
    bodyLean = -0.18 * recoil;
  } else if (animState === 'DODGE') {
    const hop = Math.sin(t * Math.PI);
    const dir = facing === 'left' ? 1 : -1;
    offsetX = hop * 8.5 * dir;
    offsetY = -hop * 5.5;
    bodyLean = -0.22 * hop * dir;
  } else if (animState === 'DEFEND') {
    shieldOffsetY = -3.5;
    offsetX = facing === 'left' ? 2 : -2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawShadow(ctx, 24 + offsetX * 0.6, 43.5, 13.5, 4.4);

  if (animState === 'DODGE' && t > 0.1 && t < 0.85) {
    ctx.fillStyle = 'rgba(126, 196, 224, 0.24)';
    ctx.beginPath();
    ctx.ellipse(21, 27, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isDead) {
    ctx.save();
    ctx.translate(24, 38);
    ctx.rotate(facing === 'left' ? -1.35 : 1.35);
    ctx.fillStyle = tint(hf, secondary);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, skin);
    ctx.beginPath();
    ctx.arc(0, -13, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.translate(24 + offsetX, 24 + offsetY);
  if (facing === 'left') {
    ctx.scale(-1, 1);
  }
  ctx.rotate(bodyLean);
  ctx.translate(-24, -24);

  const armorTone =
    armorKind === 'REINFORCED'
      ? '#7B5A3F'
      : armorKind === 'CLOTH'
      ? '#4E634B'
      : primary;
  const armorTrim =
    armorKind === 'REINFORCED'
      ? '#E5B85A'
      : armorKind === 'CLOTH'
      ? '#8FC79A'
      : accent;

  // Ambient class sparks
  if (classId === 'necromancer') {
    const p = Math.sin(nowMs * 0.005) * 2.5;
    ctx.fillStyle = 'rgba(157, 108, 224, 0.72)';
    ctx.beginPath();
    ctx.arc(10, 25 - p, 1.5, 0, Math.PI * 2);
    ctx.arc(38, 22 + p, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === 'mage' && animState === 'CAST_SPELL') {
    ctx.fillStyle = 'rgba(126, 196, 224, 0.8)';
    ctx.beginPath();
    ctx.arc(11, 16, 1.9, 0, Math.PI * 2);
    ctx.arc(37, 16, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flowing cloak behind body
  if (
    classId === 'archer' ||
    classId === 'mage' ||
    classId === 'necromancer' ||
    classId === 'rogue' ||
    classId === 'paladin'
  ) {
    const sway = Math.sin(nowMs * 0.004 + walkPhase) * 1.4;
    ctx.fillStyle = tint(hf, gradV(ctx, 24, 20 + bob, 39 + bob, secondary, '#121417'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(16, 20 + bob);
    ctx.quadraticCurveTo(11 - sway, 31 + bob, 13 - sway, 38 + bob);
    ctx.quadraticCurveTo(24, 36 + bob, 35 + sway * 0.5, 38 + bob);
    ctx.quadraticCurveTo(37, 30 + bob, 32, 20 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Articulated legs + sturdy boots
  drawCapsule(ctx, 19.5, 32 + bob, 18.5 + leftStride * 0.6, 39.5, 4.2, tint(hf, '#2E2823'));
  drawCapsule(ctx, 28.5, 32 + bob, 29.5 + rightStride * 0.6, 39.5, 4.2, tint(hf, '#2E2823'));

  // Leather / iron boots
  for (const [bx, by] of [
    [18.5 + leftStride * 0.6, 40.5],
    [29.5 + rightStride * 0.6, 40.5],
  ]) {
    ctx.fillStyle = tint(hf, armorKind === 'PLATE' ? '#6B747E' : '#4E3725');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(bx + 1, by, 3.3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Off-hand arm
  drawCapsule(ctx, 15, 22 + bob, 11.5, 30 + bob + shieldOffsetY * 0.4, 3.4, tint(hf, armorTone));

  // Torso / Chest armor
  ctx.fillStyle = tint(hf, gradV(ctx, 24, 19 + bob, 34 + bob, armorTone, secondary));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(15.5, 21 + bob);
  ctx.quadraticCurveTo(24, 18.5 + bob, 32.5, 21 + bob);
  ctx.lineTo(31.5, 33 + bob);
  ctx.quadraticCurveTo(24, 34.5 + bob, 16.5, 33 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armor details & pauldrons
  if (armorKind === 'PLATE' || armorKind === 'REINFORCED') {
    ctx.fillStyle = tint(hf, '#9CA6B2');
    ctx.beginPath();
    ctx.roundRect(17.5, 21.5 + bob, 13, 6.5, 2.5);
    ctx.fill();
    ctx.strokeStyle = '#D5DEE8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(19, 23.2 + bob);
    ctx.lineTo(29, 23.2 + bob);
    ctx.stroke();

    // Rounded shoulder pauldrons
    for (const px of [14.5, 33.5]) {
      ctx.fillStyle = tint(hf, '#8F99A5');
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(px, 21.5 + bob, 3.2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Tunic sash / lapel
    ctx.fillStyle = tint(hf, armorTrim);
    ctx.beginPath();
    ctx.moveTo(22.5, 20.5 + bob);
    ctx.lineTo(25.5, 20.5 + bob);
    ctx.lineTo(24.8, 30 + bob);
    ctx.lineTo(23.2, 30 + bob);
    ctx.closePath();
    ctx.fill();
  }

  // Belt & Antique Gold Buckle
  ctx.fillStyle = tint(hf, '#2E2016');
  ctx.fillRect(16.5, 30 + bob, 15, 2.5);
  ctx.fillStyle = tint(hf, '#E5B85A');
  ctx.beginPath();
  ctx.roundRect(22, 29.6 + bob, 4, 3.2, 0.8);
  ctx.fill();

  // Head & expressive neck/face
  ctx.fillStyle = tint(hf, gradV(ctx, 24, 7 + bob, 20 + bob, skin, '#B58965'));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(24, 13.5 + bob, 6.8, 6.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Class headgear / hair
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  if (classId === 'villager') {
    ctx.fillStyle = tint(hf, hair);
    ctx.beginPath();
    ctx.arc(24, 11.5 + bob, 6.6, Math.PI, 0);
    ctx.fill();
    // Straw brimmed adventurer hat
    ctx.fillStyle = tint(hf, '#A8844C');
    ctx.beginPath();
    ctx.ellipse(24, 9 + bob, 10.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#C49B5D');
    ctx.beginPath();
    ctx.ellipse(24, 6.8 + bob, 6.5, 3.2, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (classId === 'warrior') {
    ctx.fillStyle = tint(hf, '#7E8791');
    ctx.beginPath();
    ctx.arc(24, 11.5 + bob, 7.2, Math.PI * 0.95, Math.PI * 0.05);
    ctx.lineTo(31, 15 + bob);
    ctx.lineTo(28.5, 15 + bob);
    ctx.lineTo(28, 11.5 + bob);
    ctx.lineTo(20, 11.5 + bob);
    ctx.lineTo(19.5, 15 + bob);
    ctx.lineTo(17, 15 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Crimson crest plume
    ctx.fillStyle = tint(hf, '#C44A39');
    ctx.beginPath();
    ctx.ellipse(24, 4.5 + bob, 2.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (classId === 'archer') {
    ctx.fillStyle = tint(hf, primary);
    ctx.beginPath();
    ctx.arc(24, 11.5 + bob, 7.4, Math.PI * 0.9, Math.PI * 0.1);
    ctx.quadraticCurveTo(24, 9 + bob, 16.5, 12.5 + bob);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, accent);
    ctx.beginPath();
    ctx.ellipse(24, 8.8 + bob, 2.8, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === 'mage') {
    ctx.fillStyle = tint(hf, primary);
    // Pointed wizard hat
    ctx.beginPath();
    ctx.ellipse(24, 9.5 + bob, 11.2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(17, 9 + bob);
    ctx.quadraticCurveTo(23, 1 + bob, 27, 2 + bob);
    ctx.lineTo(30.5, 9 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, hair);
    ctx.beginPath();
    ctx.ellipse(24, 19.2 + bob, 3.5, 2.2, 0, 0, Math.PI);
    ctx.fill();
  } else if (classId === 'shaman') {
    ctx.fillStyle = tint(hf, hair);
    ctx.beginPath();
    ctx.arc(24, 11 + bob, 6.8, Math.PI, 0);
    ctx.fill();
    // Bone antlers
    ctx.strokeStyle = tint(hf, '#EAE2D2') as string;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(19, 8 + bob);
    ctx.quadraticCurveTo(14, 5 + bob, 15, 2 + bob);
    ctx.moveTo(29, 8 + bob);
    ctx.quadraticCurveTo(34, 5 + bob, 33, 2 + bob);
    ctx.stroke();
  } else if (classId === 'necromancer') {
    ctx.fillStyle = tint(hf, secondary);
    ctx.beginPath();
    ctx.arc(24, 12 + bob, 7.8, Math.PI * 0.85, Math.PI * 0.15);
    ctx.quadraticCurveTo(24, 10 + bob, 16.5, 13 + bob);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(13, 15, 18, 0.72)';
    ctx.beginPath();
    ctx.ellipse(24, 12.2 + bob, 5.4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === 'paladin') {
    ctx.fillStyle = tint(hf, gradV(ctx, 24, 5 + bob, 19 + bob, '#C8D1DA', '#7C8590'));
    ctx.beginPath();
    ctx.arc(24, 12 + bob, 7.5, Math.PI, 0);
    ctx.lineTo(31.5, 18.5 + bob);
    ctx.quadraticCurveTo(24, 21 + bob, 16.5, 18.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#E5B85A');
    ctx.fillRect(23, 6 + bob, 2, 12);
    ctx.fillStyle = '#0D0F12';
    ctx.fillRect(18.5, 12 + bob, 11, 2);
  } else if (classId === 'rogue') {
    ctx.fillStyle = tint(hf, '#1E2328');
    ctx.beginPath();
    ctx.arc(24, 11.5 + bob, 7.2, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    // Lower face scarf mask
    ctx.fillStyle = tint(hf, '#2D343B');
    ctx.beginPath();
    ctx.ellipse(24, 16.5 + bob, 6.2, 3.6, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Expressive eyes
  if (facing !== 'up') {
    const eyeGlow =
      classId === 'necromancer'
        ? '#B388FF'
        : classId === 'mage'
        ? '#7EC4E0'
        : classId === 'paladin'
        ? '#FFF1C2'
        : '#14171A';
    for (const ex of [21.3, 26.7]) {
      if (classId !== 'paladin') {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ex, 13.4 + bob, 1.5, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(ex + 0.3, 13.4 + bob, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Equipped Helmet Overlay
  if (helmetKind === 'LEATHER_HELM') {
    ctx.fillStyle = tint(hf, '#7D583B');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(24, 11 + bob, 7.4, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (helmetKind === 'IRON_HELM') {
    ctx.fillStyle = tint(hf, '#9CA6B2');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(24, 11 + bob, 7.6, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#E5B85A');
    ctx.beginPath();
    ctx.ellipse(24, 5.5 + bob, 1.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shield (offhand)
  const showEquippedShield = offhandKind === 'WOOD_SHIELD' || offhandKind === 'IRON_SHIELD';
  const showBaseShield =
    offhandKind === undefined
      ? classId === 'paladin' || classId === 'warrior' || animState === 'DEFEND'
      : animState === 'DEFEND';

  if (showEquippedShield || showBaseShield) {
    const sx = 10.5;
    const sy = 27.5 + bob + shieldOffsetY;
    const shieldCol =
      offhandKind === 'WOOD_SHIELD'
        ? '#7D5635'
        : offhandKind === 'IRON_SHIELD'
        ? '#A5B0BC'
        : classId === 'paladin'
        ? '#B8C2CC'
        : '#626B75';
    const bossCol = offhandKind === 'WOOD_SHIELD' ? '#C89B3C' : '#E5B85A';

    ctx.fillStyle = tint(hf, shieldCol);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy - 5);
    ctx.lineTo(sx + 4, sy - 5);
    ctx.lineTo(sx + 4, sy + 2);
    ctx.quadraticCurveTo(sx, sy + 7, sx - 4, sy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tint(hf, bossCol);
    ctx.beginPath();
    ctx.arc(sx, sy - 0.5, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Primary Weapon Arm + Illustrated Weapon
  const handX = 33.5 + weaponOffsetX;
  const handY = 28 + bob + weaponOffsetY;
  drawCapsule(ctx, 32, 22 + bob, handX, handY, 3.4, tint(hf, armorTone));

  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(weaponAngle);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;

  if (weaponKind === 'FORGED_BLADE' || weaponKind === 'SWORD') {
    const isForged = weaponKind === 'FORGED_BLADE';
    ctx.fillStyle = tint(hf, isForged ? '#DCE6F0' : '#B4BDC7');
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(2.4, -12);
    ctx.lineTo(2.2, 0);
    ctx.lineTo(-2.2, 0);
    ctx.lineTo(-2.4, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, isForged ? '#FFD166' : '#8A6822');
    ctx.beginPath();
    ctx.roundRect(-4.5, -0.5, 9, 2.2, 1);
    ctx.fill();
    ctx.stroke();
  } else if (weaponKind === 'SICKLE') {
    ctx.fillStyle = '#7A5434';
    ctx.fillRect(-1, -4, 2, 7);
    ctx.fillStyle = tint(hf, '#C7D0D9');
    ctx.beginPath();
    ctx.arc(0, -8, 5, Math.PI * 0.6, Math.PI * 1.9);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = tint(hf, '#C7D0D9') as string;
    ctx.stroke();
  } else if (weaponKind === 'BOW') {
    ctx.strokeStyle = tint(hf, '#8C6239') as string;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(-3, -3, 10, -1.25, 1.25);
    ctx.stroke();
    ctx.strokeStyle = '#E6DEC8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 6);
    ctx.stroke();
    // Nocked arrow
    ctx.strokeStyle = '#DCE4EC';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -3);
    ctx.lineTo(11, -3);
    ctx.stroke();
  } else if (weaponKind === 'STAFF' || weaponKind === 'TOTEM') {
    ctx.fillStyle = '#5E422C';
    ctx.beginPath();
    ctx.roundRect(-1.3, -15, 2.6, 22, 1);
    ctx.fill();
    ctx.stroke();
    if (weaponKind === 'STAFF') {
      ctx.fillStyle = '#7EC4E0';
      ctx.beginPath();
      ctx.arc(0, -17.5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#E5B85A';
      ctx.beginPath();
      ctx.roundRect(-3.8, -16, 7.6, 3.5, 1);
      ctx.fill();
      ctx.stroke();
    }
  } else if (weaponKind === 'SCYTHE') {
    ctx.fillStyle = '#3B3442';
    ctx.beginPath();
    ctx.roundRect(-1.2, -16, 2.4, 23, 1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#D0D8E0');
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(-9, -15, -10, -9);
    ctx.quadraticCurveTo(-5, -12, 0, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (weaponKind === 'HAMMER') {
    ctx.fillStyle = '#6E5038';
    ctx.beginPath();
    ctx.roundRect(-1.2, -13, 2.4, 18, 1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#E5B85A');
    ctx.beginPath();
    ctx.roundRect(-5, -16, 10, 5.5, 1.5);
    ctx.fill();
    ctx.stroke();
  } else if (weaponKind === 'DAGGERS' || weaponKind === 'KNIFE') {
    ctx.fillStyle = tint(hf, '#D0D8E0');
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(2, -2);
    ctx.lineTo(-2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (weaponKind === 'SPEAR') {
    ctx.fillStyle = '#7B5A3C';
    ctx.beginPath();
    ctx.roundRect(-1.1, -15, 2.2, 23, 1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tint(hf, '#DCE4EC');
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(2.8, -14);
    ctx.lineTo(-2.8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Draws an HD 2D illustrated Forest Skeleton inside 48*scale box.
 */
export function drawIllustratedSkeleton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  options: SkeletonSpriteOptions = {}
) {
  const walkPhase = options.walkPhase ?? 0;
  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const hf = options.hitFlash;

  let offsetX = 0;
  let offsetY = 0;
  const bob = Math.sin(walkPhase || nowMs * 0.004) * 0.9;
  let swordAngle = 0.25;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = -lunge * (animState === 'HEAVY_ATTACK' ? 8.5 : 5.5);
    swordAngle = -1.1 + lunge * 1.8;
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = recoil * 5;
    offsetY = -recoil * 2;
  } else if (animState === 'DEFEND') {
    offsetX = 2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawShadow(ctx, 24 + offsetX * 0.5, 43, 13, 4.2);

  if (isDead) {
    ctx.fillStyle = tint(hf, '#DDD6C7');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(20, 38, 8, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(29, 36, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.translate(offsetX, offsetY);

  if (options.isPrepared) {
    ctx.strokeStyle = 'rgba(229, 83, 75, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 24, 17 + Math.sin(nowMs * 0.01) * 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  const bone = '#E3DDD0';
  // Mossy tattered forest cloak
  ctx.fillStyle = tint(hf, gradV(ctx, 24, 19 + bob, 37 + bob, '#224730', '#0F1F15'));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(15, 20 + bob);
  ctx.lineTo(33, 20 + bob);
  ctx.lineTo(36, 36 + bob);
  ctx.lineTo(28, 34 + bob);
  ctx.lineTo(24, 37 + bob);
  ctx.lineTo(19, 34 + bob);
  ctx.lineTo(12, 36 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bone legs & arms
  drawCapsule(ctx, 20, 32 + bob, 19, 41, 2.5, tint(hf, bone));
  drawCapsule(ctx, 28, 32 + bob, 29, 41, 2.5, tint(hf, bone));

  // Ribcage
  ctx.fillStyle = tint(hf, '#B5AD9D');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(24, 26 + bob, 5.8, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = tint(hf, bone) as string;
  ctx.lineWidth = 1.6;
  for (const ry of [23, 26, 29]) {
    ctx.beginPath();
    ctx.moveTo(19, ry + bob);
    ctx.lineTo(29, ry + bob);
    ctx.stroke();
  }

  // Skull
  ctx.fillStyle = tint(hf, '#EFE9DC');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(24, 12.5 + bob, 6.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Jaw
  ctx.beginPath();
  ctx.roundRect(20, 16 + bob, 8, 3.6, 1.5);
  ctx.fill();
  ctx.stroke();
  // Moss patch
  ctx.fillStyle = tint(hf, '#2E5E3F');
  ctx.beginPath();
  ctx.ellipse(20.5, 8.2 + bob, 3.5, 1.8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets + glowing eyes
  const eyeGlow = options.isPrepared ? '#FF5757' : '#7EC4E0';
  for (const ex of [21.3, 26.7]) {
    ctx.fillStyle = '#090B0C';
    ctx.beginPath();
    ctx.arc(ex, 12.5 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(ex, 12.5 + bob, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sword arm + Rusted blade
  drawCapsule(ctx, 16, 22 + bob, 11.5, 28 + bob, 2.3, tint(hf, bone));
  ctx.save();
  ctx.translate(11.5, 28 + bob);
  ctx.rotate(swordAngle);
  ctx.fillStyle = tint(hf, '#8F735E');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(2.4, -11);
  ctx.lineTo(2, 0);
  ctx.lineTo(-2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (options.isGuarding || animState === 'DEFEND') {
    ctx.fillStyle = tint(hf, '#68717A');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(9, 21 + bob, 7.5, 11, 2.5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws an HD 2D illustrated Animal / Wildlife / Companion inside 48*scale box.
 */
export function drawIllustratedAnimal(
  ctx: CanvasRenderingContext2D,
  species: AnimalSpecies,
  x: number,
  y: number,
  scale: number,
  options: AnimalSpriteOptions = {}
) {
  const facing = options.facing ?? 'right';
  const walkPhase = options.walkPhase ?? 0;
  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const moving = options.isMoving ?? false;
  const eating = Boolean(options.isEating && !moving && animState === 'IDLE');
  const hf = options.hitFlash;

  let offsetX = 0;
  let offsetY = 0;
  const bob = moving
    ? -Math.abs(Math.sin(walkPhase)) * 1.4
    : eating
    ? Math.sin(nowMs * 0.01) * 0.9
    : Math.sin(nowMs * 0.004) * 0.5;
  const stride = moving ? Math.sin(walkPhase) * 2.5 : 0;
  const eatDip = eating ? 4.5 + Math.sin(nowMs * 0.012) * 1.2 : 0;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = (facing === 'left' ? -1 : 1) * lunge * 8;
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = (facing === 'left' ? 4 : -4) * recoil;
    offsetY = -recoil * 2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawShadow(ctx, 24 + offsetX * 0.5, 42, 13.5, 4);

  if (isDead) {
    ctx.fillStyle = tint(hf, '#6B594B');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(24, 38, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.translate(24 + offsetX, 24 + offsetY);
  if (facing === 'left') ctx.scale(-1, 1);
  ctx.translate(-24, -24);

  // Quadruped palette helper for mammals
  if (
    species === 'DEER' ||
    species === 'SPIRIT_DEER' ||
    species === 'GAZELLE' ||
    species === 'MOUNTAIN_GOAT'
  ) {
    const isSpirit = species === 'SPIRIT_DEER';
    const isGazelle = species === 'GAZELLE';
    const isGoat = species === 'MOUNTAIN_GOAT';
    const coat = isSpirit ? '#6EA9B5' : isGazelle ? '#C78F52' : isGoat ? '#E3DFD5' : '#9E7047';
    const belly = isSpirit ? '#DFF6FF' : '#EFE3CC';
    const legC = isSpirit ? '#487B87' : isGoat ? '#635C54' : '#7A5232';
    const hornC = isSpirit ? '#FFD166' : isGoat || isGazelle ? '#3E352D' : '#EAE2CE';

    if (isSpirit) {
      ctx.fillStyle = 'rgba(126, 196, 224, 0.7)';
      ctx.beginPath();
      ctx.arc(11, 18 + Math.sin(nowMs * 0.005) * 2, 1.5, 0, Math.PI * 2);
      ctx.arc(36, 12 - Math.sin(nowMs * 0.005) * 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawCapsule(ctx, 16, 30 + bob, 15 + stride, 41, 2.4, tint(hf, legC));
    drawCapsule(ctx, 21, 30 + bob, 20 - stride, 41, 2.4, tint(hf, legC));
    drawCapsule(ctx, 29, 30 + bob, 30 + stride, 41, 2.4, tint(hf, legC));

    // Body
    ctx.fillStyle = tint(hf, gradV(ctx, 23, 22 + bob, 34 + bob, coat, belly));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(22.5, 28 + bob, 9.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neck & head
    drawCapsule(ctx, 29.5, 26 + bob, 33, 17 + bob + eatDip, 4.4, tint(hf, coat));
    ctx.fillStyle = tint(hf, coat);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(34.5, 16.5 + bob + eatDip, 4.8, 3.3, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Horns / Antlers
    ctx.strokeStyle = tint(hf, hornC) as string;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(31, 14 + bob + eatDip);
    ctx.quadraticCurveTo(28, 8 + bob + eatDip, 31, 6 + bob + eatDip);
    ctx.moveTo(33, 14 + bob + eatDip);
    ctx.quadraticCurveTo(36, 8 + bob + eatDip, 34, 5 + bob + eatDip);
    ctx.stroke();

    ctx.fillStyle = isSpirit ? '#FFF1C2' : '#14171A';
    ctx.beginPath();
    ctx.arc(36, 16 + bob + eatDip, 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (
    species === 'WOLF' ||
    species === 'SNOW_WOLF' ||
    species === 'DIRE_WOLF' ||
    species === 'HYENA' ||
    species === 'EMBER_FOX' ||
    species === 'ARCTIC_FOX' ||
    species === 'DESERT_FOX' ||
    species === 'FIRE_BEAST'
  ) {
    const pal: Record<string, [string, string, string]> = {
      WOLF: ['#6A7582', '#C2CAD4', '#FFD166'],
      SNOW_WOLF: ['#CFDCE8', '#F2F7FC', '#7EC4E0'],
      DIRE_WOLF: ['#353B45', '#626C7A', '#FF5757'],
      HYENA: ['#998060', '#4A3B2B', '#FFD166'],
      EMBER_FOX: ['#DC692F', '#FFD166', '#FFF1C2'],
      ARCTIC_FOX: ['#E8F0F7', '#B5C8D8', '#14171A'],
      DESERT_FOX: ['#D9AC71', '#F5E6C4', '#14171A'],
      FIRE_BEAST: ['#B3311E', '#FF7B2E', '#FFF1C2'],
    };
    const [coat, trim, eye] = pal[species];

    // Bushy tail
    ctx.fillStyle = tint(hf, species === 'EMBER_FOX' || species === 'FIRE_BEAST' ? trim : coat);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(11, 26 + bob, 5.5, 2.8, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawCapsule(ctx, 17, 31 + bob, 16 + stride, 41, 2.5, tint(hf, coat));
    drawCapsule(ctx, 28, 31 + bob, 29 - stride, 41, 2.5, tint(hf, coat));

    // Body
    ctx.fillStyle = tint(hf, gradV(ctx, 23, 22 + bob, 34 + bob, coat, trim));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(23, 28 + bob, 9.8, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pointed ears
    ctx.fillStyle = tint(hf, coat);
    ctx.beginPath();
    ctx.moveTo(28.5, 19 + bob + eatDip);
    ctx.lineTo(29.8, 13.5 + bob + eatDip);
    ctx.lineTo(32, 18.5 + bob + eatDip);
    ctx.moveTo(32.5, 19 + bob + eatDip);
    ctx.lineTo(34.2, 13.5 + bob + eatDip);
    ctx.lineTo(35.8, 19 + bob + eatDip);
    ctx.fill();
    ctx.stroke();

    // Snout & Head
    ctx.beginPath();
    ctx.ellipse(32.5, 22 + bob + eatDip, 6.2, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(34, 21 + bob + eatDip, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14171A';
    ctx.beginPath();
    ctx.arc(38.5, 22.2 + bob + eatDip, 1.2, 0, Math.PI * 2);
    ctx.fill();

    if (species === 'HYENA') {
      ctx.fillStyle = trim;
      for (const [sx, sy] of [
        [19, 27],
        [24, 29],
        [21, 30],
      ]) {
        ctx.beginPath();
        ctx.arc(sx, sy + bob, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (species === 'BOAR') {
    drawCapsule(ctx, 16, 32 + bob, 15 + stride, 41, 2.8, tint(hf, '#453229'));
    drawCapsule(ctx, 29, 32 + bob, 30 - stride, 41, 2.8, tint(hf, '#453229'));

    ctx.fillStyle = tint(hf, gradV(ctx, 23, 21 + bob, 35 + bob, '#6E5245', '#422F26'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(23.5, 28 + bob, 11.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tusk & snout
    ctx.fillStyle = tint(hf, '#A8786C');
    ctx.beginPath();
    ctx.ellipse(35.5, 29 + bob + eatDip * 0.5, 3, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#F5E6C4';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(34, 31 + bob);
    ctx.quadraticCurveTo(38.5, 31 + bob, 38.5, 27 + bob);
    ctx.stroke();

    ctx.fillStyle = '#E5534B';
    ctx.beginPath();
    ctx.arc(31.5, 26 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (species === 'TURTLE') {
    drawCapsule(ctx, 16, 33 + bob, 15 + stride, 40, 3.2, tint(hf, '#5D804F'));
    drawCapsule(ctx, 29, 33 + bob, 30 - stride, 40, 3.2, tint(hf, '#5D804F'));

    ctx.fillStyle = tint(hf, gradV(ctx, 22, 22 + bob, 34 + bob, '#5A7D5F', '#324A36'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(22.5, 32 + bob, 10.5, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tint(hf, '#6A9459');
    ctx.beginPath();
    ctx.ellipse(35, 30 + bob, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (species === 'RABBIT') {
    ctx.fillStyle = tint(hf, '#C7BEB0');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(22, 33 + bob, 6.5, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(26, 22 + bob, 1.8, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(28.5, 22.5 + bob, 1.8, 4.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(27.5, 28.5 + bob, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(15.5, 33.5 + bob, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (species === 'BIRD' || species === 'EAGLE') {
    const isEagle = species === 'EAGLE';
    const flap = Math.sin(nowMs * 0.014) * 3.5;
    ctx.fillStyle = tint(hf, isEagle ? '#5E422E' : '#417888');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(22, 26 + bob, isEagle ? 8.5 : 6.5, isEagle ? 5.2 : 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Wings
    ctx.fillStyle = tint(hf, isEagle ? '#7B583E' : '#5D98AA');
    ctx.beginPath();
    ctx.ellipse(20, 22 + bob + flap * 0.5, 7, 3.2, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Head
    ctx.fillStyle = tint(hf, isEagle ? '#EAE4D7' : '#4E8A9B');
    ctx.beginPath();
    ctx.arc(29.5, 22.5 + bob, isEagle ? 4.2 : 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Beak
    ctx.fillStyle = '#E5B85A';
    ctx.beginPath();
    ctx.moveTo(33, 21.5 + bob);
    ctx.lineTo(37, 23 + bob);
    ctx.lineTo(33, 24.5 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (species === 'SCORPION') {
    ctx.fillStyle = tint(hf, '#8F4D28');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(22, 31 + bob, 9.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tail arch + stinger
    ctx.strokeStyle = '#6B361A';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(14, 29 + bob);
    ctx.bezierCurveTo(8, 22 + bob, 14, 13 + bob, 22, 16 + bob);
    ctx.stroke();
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(23, 16.5 + bob, 2, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    drawCapsule(ctx, 30, 29 + bob, 37, 25 + bob, 2.5, '#A86238');
    drawCapsule(ctx, 30, 32 + bob, 37, 35 + bob, 2.5, '#A86238');
  }

  ctx.restore();
}

/**
 * Draws all 18 Monster EnemyTypes with smooth HD 2D dark-fantasy illustrations.
 */
export function drawIllustratedMonster(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number,
  y: number,
  scale: number,
  options: MonsterSpriteOptions = {}
) {
  if (enemyType === 'FOREST_SKELETON') {
    drawIllustratedSkeleton(ctx, x, y, scale, options);
    return;
  }
  if (
    enemyType === 'WILD_BOAR' ||
    enemyType === 'FOREST_WOLF' ||
    enemyType === 'SPIRIT_DEER' ||
    enemyType === 'EMBER_FOX' ||
    enemyType === 'TURTLE' ||
    enemyType === 'DEER' ||
    enemyType === 'DESERT_SCORPION' ||
    enemyType === 'SAVANNA_HYENA' ||
    enemyType === 'DIRE_WOLF'
  ) {
    const mapped: AnimalSpecies =
      enemyType === 'WILD_BOAR'
        ? 'BOAR'
        : enemyType === 'FOREST_WOLF'
        ? 'WOLF'
        : enemyType === 'DESERT_SCORPION'
        ? 'SCORPION'
        : enemyType === 'SAVANNA_HYENA'
        ? 'HYENA'
        : enemyType;
    drawIllustratedAnimal(ctx, mapped, x, y, scale, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }

  if (enemyType === 'CORRUPTED_STAG') {
    drawIllustratedAnimal(ctx, 'SPIRIT_DEER', x, y, scale, {
      facing: options.facing ?? 'left',
      hitFlash: options.hitFlash,
      nowMs: options.nowMs,
      animState: options.animState,
      animProgress: options.animProgress,
    });
    // Violet corruption aura over stag
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(157, 108, 224, 0.55)';
    ctx.beginPath();
    ctx.arc(20, 14, 2.2, 0, Math.PI * 2);
    ctx.arc(27, 14, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const walkPhase = options.walkPhase ?? 0;
  const hf = options.hitFlash;

  let offsetX = 0;
  let offsetY = 0;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = -lunge * (animState === 'HEAVY_ATTACK' ? 9 : 6);
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = recoil * 5;
    offsetY = -recoil * 2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  const bob = Math.sin(walkPhase || nowMs * 0.005) * 1.1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawShadow(ctx, 24 + offsetX * 0.5, 42.5, 13.5, 4.2);

  if (isDead) {
    ctx.fillStyle = tint(hf, '#3A3E42');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(24, 38, 13, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.translate(offsetX, offsetY);

  if (enemyType === 'SLIME') {
    const squish = Math.sin(nowMs * 0.007) * 1.6;
    ctx.fillStyle = tint(hf, gradV(ctx, 24, 20 + bob, 40, '#6CE09A', '#215E3C'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(11 - squish, 38);
    ctx.bezierCurveTo(10, 18 + bob + squish, 38, 18 + bob + squish, 37 + squish, 38);
    ctx.quadraticCurveTo(24, 41, 11 - squish, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner glowing nucleus & eyes
    ctx.fillStyle = options.isPrepared ? '#FFD166' : '#B8FFD4';
    ctx.beginPath();
    ctx.arc(24, 32 + bob, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090B0C';
    ctx.beginPath();
    ctx.arc(19, 29 + bob + squish * 0.3, 1.7, 0, Math.PI * 2);
    ctx.arc(28, 29 + bob + squish * 0.3, 1.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemyType === 'GOBLIN') {
    drawCapsule(ctx, 19, 32 + bob, 18.5, 41, 3, tint(hf, '#4B7539'));
    drawCapsule(ctx, 28, 32 + bob, 28.5, 41, 3, tint(hf, '#4B7539'));

    ctx.fillStyle = tint(hf, '#694F3A');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(16.5, 22 + bob, 15, 11.5, 3.5);
    ctx.fill();
    ctx.stroke();

    // Pointed goblin ears
    ctx.fillStyle = tint(hf, '#64964E');
    ctx.beginPath();
    ctx.moveTo(16, 15 + bob);
    ctx.lineTo(10, 13.5 + bob);
    ctx.lineTo(16, 18 + bob);
    ctx.moveTo(32, 15 + bob);
    ctx.lineTo(38, 13.5 + bob);
    ctx.lineTo(32, 18 + bob);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.ellipse(24, 16 + bob, 7.6, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(20.5, 15.5 + bob, 1.4, 0, Math.PI * 2);
    ctx.arc(27.5, 15.5 + bob, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Dagger
    ctx.fillStyle = '#B8C2CC';
    ctx.beginPath();
    ctx.moveTo(10, 17 + bob);
    ctx.lineTo(12, 26 + bob);
    ctx.lineTo(8.5, 26 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemyType === 'FROST_GOLEM' || enemyType === 'MAGMA_FIEND' || enemyType === 'CAVE_TROLL') {
    const isIce = enemyType === 'FROST_GOLEM';
    const isMagma = enemyType === 'MAGMA_FIEND';
    const cTop = isIce ? '#9AD4F2' : isMagma ? '#6E3228' : '#6F8070';
    const cBot = isIce ? '#3D6F8E' : isMagma ? '#261816' : '#3E4A3F';
    const coreC = isIce ? '#E0F7FF' : isMagma ? '#FF7B2E' : '#FFD166';

    drawCapsule(ctx, 17, 32 + bob, 16.5, 41, 4.4, tint(hf, cBot));
    drawCapsule(ctx, 31, 32 + bob, 31.5, 41, 4.4, tint(hf, cBot));
    drawCapsule(ctx, 12, 20 + bob, 9.5, 31 + bob, 4.2, tint(hf, cBot));
    drawCapsule(ctx, 36, 20 + bob, 38.5, 31 + bob, 4.2, tint(hf, cBot));

    ctx.fillStyle = tint(hf, gradV(ctx, 24, 15 + bob, 34 + bob, cTop, cBot));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.roundRect(12.5, 16 + bob, 23, 18, 5);
    ctx.fill();
    ctx.stroke();

    // Chest glow/core
    ctx.fillStyle = coreC;
    ctx.beginPath();
    ctx.arc(24, 24.5 + bob, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = tint(hf, cTop);
    ctx.beginPath();
    ctx.ellipse(24, 12 + bob, 6.8, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (isMagma) {
      ctx.fillStyle = '#2B1F1E';
      ctx.beginPath();
      ctx.moveTo(18, 9 + bob);
      ctx.lineTo(14.5, 4 + bob);
      ctx.lineTo(20, 7.5 + bob);
      ctx.moveTo(30, 9 + bob);
      ctx.lineTo(33.5, 4 + bob);
      ctx.lineTo(28, 7.5 + bob);
      ctx.fill();
    }
    ctx.fillStyle = coreC;
    ctx.beginPath();
    ctx.arc(21.2, 12 + bob, 1.3, 0, Math.PI * 2);
    ctx.arc(26.8, 12 + bob, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemyType === 'UNDEAD_KNIGHT') {
    drawCapsule(ctx, 19, 32 + bob, 18.5, 41, 3.6, tint(hf, '#333940'));
    drawCapsule(ctx, 29, 32 + bob, 29.5, 41, 3.6, tint(hf, '#333940'));

    ctx.fillStyle = tint(hf, gradV(ctx, 24, 18 + bob, 34 + bob, '#69727D', '#373D45'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(15.5, 19 + bob, 17, 15, 3.5);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(24, 12 + bob, 6.5, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#090B0C';
    ctx.fillRect(19, 11.5 + bob, 10, 2);
    ctx.fillStyle = '#B388FF';
    ctx.beginPath();
    ctx.arc(21.5, 12.5 + bob, 1.1, 0, Math.PI * 2);
    ctx.arc(26.5, 12.5 + bob, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Broadsword
    ctx.fillStyle = '#9BA5B0';
    ctx.beginPath();
    ctx.roundRect(8.5, 12 + bob, 3.2, 18, 1);
    ctx.fill();
    ctx.stroke();
  } else {
    // DARK_CREATURE wraith
    ctx.fillStyle = tint(hf, gradV(ctx, 24, 17 + bob, 40 + bob, '#2B1D3D', '#0F0A17'));
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(15, 20 + bob);
    ctx.lineTo(33, 20 + bob);
    ctx.lineTo(36, 40 + bob);
    ctx.lineTo(29, 36 + bob);
    ctx.lineTo(24, 41 + bob);
    ctx.lineTo(19, 36 + bob);
    ctx.lineTo(12, 40 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Horns + Shadow Hood
    ctx.fillStyle = '#2B1F3B';
    ctx.beginPath();
    ctx.moveTo(18, 10 + bob);
    ctx.lineTo(14, 3 + bob);
    ctx.lineTo(20.5, 8 + bob);
    ctx.moveTo(30, 10 + bob);
    ctx.lineTo(34, 3 + bob);
    ctx.lineTo(27.5, 8 + bob);
    ctx.fill();

    ctx.fillStyle = '#120E1A';
    ctx.beginPath();
    ctx.ellipse(24, 13.5 + bob, 6.8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = options.isPrepared ? '#FF5757' : '#B388FF';
    ctx.beginPath();
    ctx.arc(21.3, 13.5 + bob, 1.4, 0, Math.PI * 2);
    ctx.arc(26.7, 13.5 + bob, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9D6CE0';
    ctx.beginPath();
    ctx.arc(24, 26.5 + bob, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws all 5 MerchantRoleKinds with warm dark-fantasy character details.
 */
export function drawIllustratedMerchant(
  ctx: CanvasRenderingContext2D,
  kind: MerchantRoleKind,
  x: number,
  y: number,
  scale: number,
  nowMs = 0
) {
  const bob = Math.sin(nowMs * 0.003) * 0.7;
  const robeTop =
    kind === 'BLACKSMITH'
      ? '#59402F'
      : kind === 'ALCHEMIST'
      ? '#2C6E4D'
      : kind === 'RARE_TRADER'
      ? '#6B3E8F'
      : kind === 'MERCHANT_VILLAGE'
      ? '#9A6532'
      : '#42667D';
  const trimCol =
    kind === 'BLACKSMITH' ? '#A3ACB6' : kind === 'ALCHEMIST' ? '#8FC79A' : '#E5B85A';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawShadow(ctx, 24, 43, 13, 4);

  drawCapsule(ctx, 19.5, 32, 19, 40.5, 3.6, '#261C15');
  drawCapsule(ctx, 28.5, 32, 29, 40.5, 3.6, '#261C15');

  ctx.fillStyle = gradV(ctx, 24, 19 + bob, 34 + bob, robeTop, '#181A1E');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(15.5, 20 + bob, 17, 13.5, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = trimCol;
  ctx.beginPath();
  ctx.roundRect(21.5, 21 + bob, 5, 10, 1.5);
  ctx.fill();

  ctx.fillStyle = gradV(ctx, 24, 8 + bob, 19 + bob, '#E5C09D', '#BC936E');
  ctx.beginPath();
  ctx.ellipse(24, 13.5 + bob, 6.4, 6.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Signature headgear per merchant
  if (kind === 'RARE_TRADER') {
    ctx.fillStyle = '#8A4BB8';
    ctx.beginPath();
    ctx.ellipse(24, 8.5 + bob, 9.5, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(24, 6 + bob, 4, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'ALCHEMIST') {
    ctx.fillStyle = '#1E4A34';
    ctx.beginPath();
    ctx.arc(24, 10.5 + bob, 6.8, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'BLACKSMITH') {
    ctx.fillStyle = '#2B2F36';
    ctx.beginPath();
    ctx.arc(24, 10.5 + bob, 6.5, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#7A5434';
    ctx.beginPath();
    ctx.ellipse(24, 9 + bob, 9, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#14171A';
  ctx.beginPath();
  ctx.arc(21.4, 13.5 + bob, 1, 0, Math.PI * 2);
  ctx.arc(26.6, 13.5 + bob, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
