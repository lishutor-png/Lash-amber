import { CHARACTER_CLASSES } from '../character/classes';
import {
  AnimalSpecies,
  ArmorVisualKind,
  CharacterAnimState,
  CharacterClassId,
  Direction,
  EnemyType,
  HelmetVisualKind,
  ItemId,
  MerchantRoleKind,
  OffhandVisualKind,
  WeaponVisualKind,
} from '../core/types';

export interface CharacterSpriteOptions {
  facing?: Direction;
  walkPhase?: number;
  animState?: CharacterAnimState;
  animProgress?: number; // 0..1
  weaponVisual?: WeaponVisualKind;
  armorVisual?: ArmorVisualKind;
  offhandVisual?: OffhandVisualKind;
  helmetVisual?: HelmetVisualKind;
  nowMs?: number;
  hitFlash?: boolean;
}

/**
 * Draws a crisp 48x48 logical HD pixel-art character sprite onto a 2D canvas context
 * inside box (x, y) scaled by `pixelSize` (integer or crisp nearest-neighbor).
 */
export function drawCharacterPixelSprite(
  ctx: CanvasRenderingContext2D,
  classId: CharacterClassId,
  x: number,
  y: number,
  pixelSize: number,
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

  // Animation offsets in logical 48x48 pixels
  let offsetX = 0;
  let offsetY = 0;
  let bob = 0;
  let weaponLift = 0;
  let weaponThrust = 0;
  let shieldRaise = 0;
  let legStride = 0;
  let isDead = false;

  if (animState === 'IDLE') {
    bob = Math.sin(nowMs * 0.004) > 0.4 ? -1 : 0;
  } else if (animState === 'WALK') {
    bob = Math.abs(Math.sin(walkPhase)) > 0.5 ? -1 : 0;
    legStride = Math.round(Math.sin(walkPhase) * 2.5);
  } else if (animState === 'ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = Math.round(lunge * (facing === 'left' ? -6 : 6));
    weaponThrust = Math.round(lunge * 7);
    weaponLift = Math.round(-lunge * 4);
  } else if (animState === 'HEAVY_ATTACK') {
    if (t < 0.35) {
      const wind = t / 0.35;
      offsetX = Math.round(-wind * 4);
      weaponLift = Math.round(-wind * 9);
    } else {
      const cleave = Math.sin(((t - 0.35) / 0.65) * Math.PI);
      offsetX = Math.round(cleave * (facing === 'left' ? -9 : 9));
      weaponThrust = Math.round(cleave * 10);
      weaponLift = Math.round(cleave * 4);
    }
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = Math.round((facing === 'left' ? 4 : -4) * recoil);
    offsetY = Math.round(-recoil * 2);
  } else if (animState === 'DODGE') {
    const hop = Math.sin(t * Math.PI);
    offsetX = Math.round((facing === 'left' ? 9 : -9) * hop);
    offsetY = Math.round(-hop * 5);
    bob = 2;
  } else if (animState === 'CAST_SPELL') {
    const pulse = Math.sin(t * Math.PI);
    weaponLift = Math.round(-pulse * 8);
    bob = -Math.round(pulse * 2);
  } else if (animState === 'DEFEND') {
    shieldRaise = -4;
    offsetX = facing === 'left' ? 2 : -2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = options.hitFlash ? '#F5E6C4' : color;
    ctx.fillRect(
      Math.round(x + (gx + offsetX) * pixelSize),
      Math.round(y + (gy + offsetY) * pixelSize),
      Math.max(1, Math.round(w * pixelSize)),
      Math.max(1, Math.round(h * pixelSize))
    );
  };

  // Ground shadow (smooth elliptical dark fantasy contact shadow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(
    x + (24 + offsetX * 0.6) * pixelSize,
    y + 44 * pixelSize,
    13 * pixelSize,
    4.2 * pixelSize,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Dodge afterimage silhouette
  if (animState === 'DODGE' && t > 0.1 && t < 0.85) {
    ctx.fillStyle = 'rgba(126, 196, 224, 0.25)';
    ctx.fillRect(
      Math.round(x + 15 * pixelSize),
      Math.round(y + 12 * pixelSize),
      Math.round(16 * pixelSize),
      Math.round(28 * pixelSize)
    );
  }

  if (isDead) {
    // Fallen defeated silhouette
    px(8, 35, 30, 8, '#0A0B0D');
    px(10, 36, 16, 6, secondary);
    px(26, 36, 10, 6, skin);
    px(12, 34, 8, 2, accent);
    return;
  }

  const outline = '#090B0C';
  const armorTone =
    armorKind === 'REINFORCED'
      ? '#6E5038'
      : armorKind === 'CLOTH'
      ? '#4A5D47'
      : primary;
  const armorTrim =
    armorKind === 'REINFORCED'
      ? '#E5B85A'
      : armorKind === 'CLOTH'
      ? '#8FC79A'
      : accent;

  // Ambient dark/holy/arcane aura for magical classes
  if (classId === 'necromancer') {
    const pulse = Math.floor((Math.sin(nowMs * 0.006) + 1) * 2);
    px(10, 26 - pulse, 2, 2, '#9D6CE0');
    px(36, 22 + pulse, 2, 2, '#4D8FAC');
  } else if (classId === 'mage' && animState === 'CAST_SPELL') {
    px(11, 16, 2, 2, '#7EC4E0');
    px(35, 16, 2, 2, '#E5B85A');
  }

  // Cloak / Cape back layer
  if (
    classId === 'archer' ||
    classId === 'mage' ||
    classId === 'necromancer' ||
    classId === 'rogue' ||
    classId === 'paladin'
  ) {
    px(13, 21 + bob, 22, 16, outline);
    px(14, 22 + bob, 20, 14, secondary);
  }

  // Legs & Shaded Boots (with stride)
  const leftLegY = 34 + (legStride > 0 ? -2 : 0);
  const rightLegY = 34 + (legStride < 0 ? -2 : 0);

  // Left leg + boot
  px(16, leftLegY, 6, 9, outline);
  px(17, leftLegY, 4, 5, '#2A2520');
  px(17, leftLegY + 5, 4, 3, '#4A3525');
  px(16, leftLegY + 7, 5, 2, '#1C1612');

  // Right leg + boot
  px(26, rightLegY, 6, 9, outline);
  px(27, rightLegY, 4, 5, '#2A2520');
  px(27, rightLegY + 5, 4, 3, '#4A3525');
  px(27, rightLegY + 7, 5, 2, '#1C1612');

  // Torso & Armor / Tunic
  px(14, 20 + bob, 20, 15, outline);
  px(15, 21 + bob, 18, 13, armorTone);
  px(17, 22 + bob, 14, 10, secondary);

  // Chestplate / Tunic detail
  if (armorKind === 'PLATE' || armorKind === 'REINFORCED') {
    px(16, 21 + bob, 16, 7, '#7D858E');
    px(18, 22 + bob, 12, 2, '#B0B8C2');
    // Pauldrons
    px(12, 20 + bob, 5, 5, outline);
    px(13, 21 + bob, 3, 3, '#9AA3AD');
    px(31, 20 + bob, 5, 5, outline);
    px(32, 21 + bob, 3, 3, '#9AA3AD');
  } else {
    px(18, 22 + bob, 12, 3, armorTone);
    px(22, 21 + bob, 4, 8, armorTrim);
  }

  // Belt & Antique Gold Buckle
  px(15, 30 + bob, 18, 3, '#2B1E16');
  px(22, 30 + bob, 4, 3, '#E5B85A');

  // Arms & Gauntlets
  px(11, 22 + bob, 4, 10, outline);
  px(12, 23 + bob, 3, 6, armorTone);
  px(12, 29 + bob, 3, 2, skin);

  px(33, 22 + bob + weaponLift, 4, 10, outline);
  px(33, 23 + bob + weaponLift, 3, 6, armorTone);
  px(33, 29 + bob + weaponLift, 3, 2, skin);

  // Head & Face (outlined)
  px(16, 7 + bob, 16, 14, outline);
  px(17, 8 + bob, 14, 12, skin);
  // Subtle jaw shadow
  px(17, 18 + bob, 14, 2, '#B38866');

  // Headgear / Hair / Helmet / Hood per class
  if (classId === 'villager') {
    px(17, 8 + bob, 14, 4, hair);
    px(13, 7 + bob, 22, 3, outline);
    px(14, 8 + bob, 20, 2, '#9E7D4A');
    px(16, 4 + bob, 16, 4, outline);
    px(17, 5 + bob, 14, 3, '#B38E55');
  } else if (classId === 'warrior') {
    px(15, 5 + bob, 18, 7, outline);
    px(16, 6 + bob, 16, 5, '#7D858E');
    px(18, 6 + bob, 12, 2, '#B0B8C2');
    // Plume crest
    px(22, 3 + bob, 4, 5, '#B84A39');
    // Cheek guards
    px(16, 11 + bob, 3, 7, '#5A626A');
    px(29, 11 + bob, 3, 7, '#5A626A');
  } else if (classId === 'archer') {
    px(15, 5 + bob, 18, 7, outline);
    px(16, 6 + bob, 16, 5, primary);
    px(17, 7 + bob, 14, 2, '#366948');
    px(21, 9 + bob, 6, 2, accent);
    // Quiver strap across chest
    px(18, 22 + bob, 3, 8, '#6E5038');
  } else if (classId === 'mage') {
    px(12, 8 + bob, 24, 3, outline);
    px(13, 9 + bob, 22, 2, primary);
    px(17, 2 + bob, 14, 7, outline);
    px(18, 3 + bob, 12, 6, primary);
    px(20, 3 + bob, 6, 2, accent);
    // Beard/hair tufts
    px(17, 17 + bob, 4, 4, hair);
    px(27, 17 + bob, 4, 4, hair);
  } else if (classId === 'shaman') {
    px(17, 7 + bob, 14, 4, hair);
    // Antler bone horns
    px(12, 3 + bob, 4, 6, outline);
    px(13, 4 + bob, 2, 4, '#DCD6C8');
    px(32, 3 + bob, 4, 6, outline);
    px(33, 4 + bob, 2, 4, '#DCD6C8');
    px(17, 9 + bob, 14, 2, accent);
  } else if (classId === 'necromancer') {
    px(15, 4 + bob, 18, 10, outline);
    px(16, 5 + bob, 16, 8, secondary);
    px(18, 8 + bob, 12, 4, '#0D0F10'); // deep shadow hood
    px(20, 6 + bob, 8, 2, accent);
  } else if (classId === 'paladin') {
    px(15, 4 + bob, 18, 13, outline);
    px(16, 5 + bob, 16, 11, '#B0B8C2');
    px(22, 5 + bob, 4, 11, '#E5B85A'); // golden cross visor
    px(17, 10 + bob, 14, 2, '#0D0F10'); // visor slit
  } else if (classId === 'rogue') {
    px(15, 5 + bob, 18, 7, outline);
    px(16, 6 + bob, 16, 5, '#1D2126');
    // Lower face mask
    px(17, 14 + bob, 14, 6, '#2A3036');
    px(17, 14 + bob, 14, 1, accent);
  }

  // Expressive Eyes (unless facing up or masked Paladin visor)
  if (facing !== 'up' && classId !== 'paladin') {
    const eyeColor =
      classId === 'necromancer'
        ? '#9D6CE0'
        : classId === 'mage'
        ? '#7EC4E0'
        : '#14171A';
    const shift = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
    px(20 + shift, 12 + bob, 2, 2, '#FFFFFF');
    px(21 + shift, 12 + bob, 1, 2, eyeColor);
    px(26 + shift, 12 + bob, 2, 2, '#FFFFFF');
    px(27 + shift, 12 + bob, 1, 2, eyeColor);
  } else if (classId === 'paladin' && facing !== 'up') {
    px(20, 10 + bob, 2, 2, '#FFF1C2');
    px(26, 10 + bob, 2, 2, '#FFF1C2');
  }

  // Equipped Helmet Overlay (when LEATHER_HELM or IRON_HELM is equipped)
  if (helmetKind === 'LEATHER_HELM') {
    px(15, 5 + bob, 18, 6, outline);
    px(16, 6 + bob, 16, 4, '#6E5038');
    px(18, 6 + bob, 12, 2, '#9A7452');
    px(16, 10 + bob, 3, 5, '#593F2B');
    px(29, 10 + bob, 3, 5, '#593F2B');
  } else if (helmetKind === 'IRON_HELM') {
    px(15, 4 + bob, 18, 7, outline);
    px(16, 5 + bob, 16, 5, '#7D858E');
    px(18, 5 + bob, 12, 2, '#C4CDD6');
    px(22, 3 + bob, 4, 3, '#E5B85A');
    px(16, 10 + bob, 3, 6, '#5A626A');
    px(29, 10 + bob, 3, 6, '#5A626A');
  }

  // Off-hand Shield: render equipped shield, or class/defend fallback only when offhandVisual isn't explicitly 'NONE'
  const showEquippedShield =
    offhandKind === 'WOOD_SHIELD' || offhandKind === 'IRON_SHIELD';
  const showBaseShield =
    offhandKind === undefined
      ? classId === 'paladin' || classId === 'warrior' || animState === 'DEFEND'
      : animState === 'DEFEND';

  if (showEquippedShield || showBaseShield) {
    const sx = facing === 'left' ? 32 : 7;
    const sy = 21 + bob + shieldRaise;
    const shieldBase =
      offhandKind === 'WOOD_SHIELD'
        ? '#7A5434'
        : offhandKind === 'IRON_SHIELD'
        ? '#9AA3AD'
        : classId === 'paladin'
        ? '#B0B8C2'
        : '#5A626A';
    const shieldBoss =
      offhandKind === 'WOOD_SHIELD'
        ? '#C89B3C'
        : offhandKind === 'IRON_SHIELD'
        ? '#E5B85A'
        : classId === 'paladin'
        ? '#E5B85A'
        : '#B84A39';
    px(sx, sy, 8, 12, outline);
    px(sx + 1, sy + 1, 6, 10, shieldBase);
    px(sx + 3, sy + 2, 2, 8, shieldBoss);
  }

  // Primary Equipped Weapon (visibly changes when weapon upgrades!)
  const wx = (facing === 'left' ? 6 : 36) + (facing === 'left' ? -weaponThrust : weaponThrust);
  const wy = 14 + bob + weaponLift;

  if (weaponKind === 'FORGED_BLADE') {
    px(wx, wy - 4, 4, 18, outline);
    px(wx + 1, wy - 3, 2, 13, '#A8B2BC');
    px(wx + 1, wy - 3, 1, 11, '#E6E2D8');
    px(wx - 2, wy + 10, 8, 2, '#E5B85A');
    px(wx + 1, wy + 12, 2, 3, '#6E5038');
  } else if (weaponKind === 'SWORD') {
    px(wx, wy - 2, 4, 16, outline);
    px(wx + 1, wy - 1, 2, 11, '#C4CDD6');
    px(wx - 2, wy + 10, 8, 2, '#8A6822');
    px(wx + 1, wy + 12, 2, 3, '#4A3525');
  } else if (weaponKind === 'SICKLE') {
    px(wx + 1, wy + 4, 3, 11, outline);
    px(wx + 2, wy + 5, 1, 9, '#6E5038');
    px(wx - 3, wy + 2, 6, 4, outline);
    px(wx - 2, wy + 3, 4, 2, '#B0B8C2');
  } else if (weaponKind === 'BOW') {
    px(wx, wy, 4, 16, outline);
    px(wx + 1, wy + 1, 2, 14, '#8A6822');
    px(wx - 1, wy + 2, 1, 12, '#D9D2C5'); // bowstring
    px(wx + 2, wy + 7, 5, 1, '#C4CDD6'); // nocked arrow
  } else if (weaponKind === 'STAFF') {
    px(wx + 1, wy - 2, 3, 22, outline);
    px(wx + 2, wy - 1, 1, 20, '#5E422C');
    px(wx, wy - 6, 5, 5, outline);
    px(wx + 1, wy - 5, 3, 3, '#7EC4E0'); // arcane orb
    px(wx + 2, wy - 4, 1, 1, '#FFFFFF');
  } else if (weaponKind === 'TOTEM') {
    px(wx + 1, wy, 3, 20, outline);
    px(wx + 2, wy + 1, 1, 18, '#4F3725');
    px(wx - 1, wy - 2, 7, 4, outline);
    px(wx, wy - 1, 5, 2, '#E5B85A');
  } else if (weaponKind === 'SCYTHE') {
    px(wx + 1, wy - 2, 3, 22, outline);
    px(wx + 2, wy - 1, 1, 20, '#3B3442');
    px(wx - 6, wy - 3, 10, 4, outline);
    px(wx - 5, wy - 2, 8, 2, '#C4CDD6');
    px(wx - 6, wy, 3, 2, '#9D6CE0');
  } else if (weaponKind === 'HAMMER') {
    px(wx + 1, wy + 1, 3, 17, outline);
    px(wx + 2, wy + 2, 1, 15, '#6E5038');
    px(wx - 3, wy - 3, 10, 6, outline);
    px(wx - 2, wy - 2, 8, 4, '#E5B85A');
  } else if (weaponKind === 'DAGGERS') {
    px(8, 26 + bob, 4, 7, '#C4CDD6');
    px(wx, 24 + bob + weaponLift, 4, 8, '#C4CDD6');
  } else if (weaponKind === 'KNIFE') {
    px(wx, wy + 5, 3, 9, outline);
    px(wx + 1, wy + 6, 1, 5, '#D5DDE5');
    px(wx + 1, wy + 11, 1, 2, '#6E5038');
  } else if (weaponKind === 'SPEAR') {
    px(wx + 1, wy - 4, 3, 24, outline);
    px(wx + 2, wy - 1, 1, 20, '#7B5A3C');
    px(wx, wy - 8, 5, 6, outline);
    px(wx + 1, wy - 7, 3, 4, '#DCE4EC');
    px(wx + 2, wy - 9, 1, 2, '#FFFFFF');
  }
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

/**
 * Draws a crisp 48x48 logical HD pixel-art Forest Skeleton monster sprite.
 */
export function drawSkeletonPixelSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixelSize: number,
  options: SkeletonSpriteOptions = {}
) {
  const walkPhase = options.walkPhase ?? 0;
  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;

  let offsetX = 0;
  let offsetY = 0;
  let bob = Math.sin(walkPhase) > 0.35 ? -1 : 0;
  let swordLift = 0;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = Math.round(-lunge * (animState === 'HEAVY_ATTACK' ? 9 : 6));
    swordLift = Math.round(-lunge * 6);
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = Math.round(recoil * 5);
    offsetY = Math.round(-recoil * 2);
  } else if (animState === 'DEFEND') {
    offsetX = 2;
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = options.hitFlash ? '#FFFFFF' : color;
    ctx.fillRect(
      Math.round(x + (gx + offsetX) * pixelSize),
      Math.round(y + (gy + offsetY) * pixelSize),
      Math.max(1, Math.round(w * pixelSize)),
      Math.max(1, Math.round(h * pixelSize))
    );
  };

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(
    Math.round(x + (12 + offsetX * 0.5) * pixelSize),
    Math.round(y + 42 * pixelSize),
    Math.round(24 * pixelSize),
    Math.round(4 * pixelSize)
  );

  if (isDead) {
    // Pile of bones on forest ground
    px(12, 36, 22, 6, '#090B0C');
    px(14, 37, 8, 4, '#DCD6C8');
    px(24, 38, 9, 3, '#BFB8A8');
    px(17, 34, 6, 4, '#E2DDD0');
    return;
  }

  const outline = '#090B0C';
  const bone = '#DDD6C7';
  const boneShade = '#A8A090';

  // Prepared heavy-attack crimson aura
  if (options.isPrepared) {
    const p = Math.floor((Math.sin(nowMs * 0.009) + 1) * 2);
    px(11, 15 - p, 2, 2, '#E5534B');
    px(35, 18 + p, 2, 2, '#E5B85A');
  }

  // Tattered mossy cloak back
  px(13, 20 + bob, 22, 16, outline);
  px(14, 21 + bob, 20, 14, '#1B3B28');
  px(16, 22 + bob, 16, 12, '#112419');

  // Bone Legs
  px(17, 34, 4, 9, outline);
  px(18, 34, 2, 8, bone);
  px(27, 34, 4, 9, outline);
  px(28, 34, 2, 8, bone);

  // Ribcage & Spine
  px(18, 21 + bob, 12, 11, boneShade);
  px(22, 21 + bob, 4, 11, bone);
  px(17, 22 + bob, 14, 2, bone);
  px(18, 25 + bob, 12, 2, bone);
  px(19, 28 + bob, 10, 2, bone);

  // Detailed Skull
  px(16, 6 + bob, 16, 14, outline);
  px(17, 7 + bob, 14, 10, '#EAE4D7');
  px(19, 16 + bob, 10, 3, boneShade); // Jaw + teeth
  px(20, 17 + bob, 2, 2, '#EAE4D7');
  px(23, 17 + bob, 2, 2, '#EAE4D7');
  px(26, 17 + bob, 2, 2, '#EAE4D7');

  // Moss patches on skull
  px(17, 7 + bob, 5, 2, '#264D34');

  // Eye Sockets + Eerie Glint
  px(19, 11 + bob, 4, 3, '#090B0C');
  px(25, 11 + bob, 4, 3, '#090B0C');
  const eyeGlow = options.isPrepared ? '#E5534B' : '#7EC4E0';
  px(20, 12 + bob, 2, 2, eyeGlow);
  px(26, 12 + bob, 2, 2, eyeGlow);

  // Bone Arms
  px(12, 22 + bob + swordLift, 4, 9, outline);
  px(13, 23 + bob + swordLift, 2, 7, bone);
  px(32, 22 + bob, 4, 9, outline);
  px(33, 23 + bob, 2, 7, bone);

  // Rusted Notched Blade (left-facing in combat or right in world)
  px(8, 12 + bob + swordLift, 4, 16, outline);
  px(9, 13 + bob + swordLift, 2, 11, '#8B6D56');
  px(7, 23 + bob + swordLift, 6, 2, '#5A626A');

  // Bone Shield when guarding
  if (options.isGuarding || animState === 'DEFEND') {
    px(10, 20 + bob, 8, 13, outline);
    px(11, 21 + bob, 6, 11, '#5A626A');
    px(12, 23 + bob, 4, 7, '#7D858E');
  }
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

/**
 * Draws a crisp 48x48 logical pixel-art wildlife/companion sprite.
 */
export function drawAnimalPixelSprite(
  ctx: CanvasRenderingContext2D,
  species: AnimalSpecies,
  x: number,
  y: number,
  pixelSize: number,
  options: AnimalSpriteOptions = {}
) {
  const facing = options.facing ?? 'right';
  const walkPhase = options.walkPhase ?? 0;
  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const moving = options.isMoving ?? false;
  const eating = Boolean(options.isEating && !moving && animState === 'IDLE');

  let offsetX = 0;
  let offsetY = 0;
  const bob = moving
    ? Math.sin(walkPhase) > 0
      ? -1
      : 0
    : eating
    ? Math.sin(nowMs * 0.012) > 0.2
      ? 1
      : 0
    : Math.sin(nowMs * 0.004) > 0.6
    ? -1
    : 0;
  const stride = moving ? Math.round(Math.sin(walkPhase) * 2) : 0;
  const eatDip = eating ? 4 + (Math.sin(nowMs * 0.014) > 0 ? 1 : 0) : 0;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = Math.round((facing === 'left' ? -1 : 1) * lunge * 8);
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = Math.round((facing === 'left' ? 4 : -4) * recoil);
    offsetY = Math.round(-recoil * 2);
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  const flip = facing === 'left';
  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    const drawGX = flip ? 48 - gx - w : gx;
    ctx.fillStyle = options.hitFlash ? '#FFFFFF' : color;
    ctx.fillRect(
      Math.round(x + (drawGX + offsetX) * pixelSize),
      Math.round(y + (gy + offsetY) * pixelSize),
      Math.max(1, Math.round(w * pixelSize)),
      Math.max(1, Math.round(h * pixelSize))
    );
  };

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(
    Math.round(x + (11 + offsetX * 0.5) * pixelSize),
    Math.round(y + 41 * pixelSize),
    Math.round(26 * pixelSize),
    Math.round(4 * pixelSize)
  );

  const outline = '#090B0C';

  if (isDead) {
    px(12, 35, 22, 6, outline);
    px(
      14,
      36,
      18,
      4,
      species === 'BOAR'
        ? '#584439'
        : species === 'WOLF'
        ? '#5B6470'
        : species === 'TURTLE'
        ? '#3E6347'
        : '#9B7553'
    );
    return;
  }

  if (species === 'DEER' || species === 'SPIRIT_DEER') {
    const isSpirit = species === 'SPIRIT_DEER';
    const coat = isSpirit ? '#6EA9B5' : '#9A6E47';
    const coatLight = isSpirit ? '#A5DCE6' : '#B6875D';
    const belly = isSpirit ? '#E0F7FF' : '#D8C2A4';
    const legCol = isSpirit ? '#477E8A' : '#7A5434';
    const antlerCol = isSpirit ? '#FFD166' : '#E6DEC8';

    if (isSpirit) {
      const sp = Math.floor((Math.sin(nowMs * 0.005) + 1) * 2);
      px(10, 18 - sp, 2, 2, '#7EC4E0');
      px(36, 12 + sp, 2, 2, '#FFD166');
    }

    // Body
    px(13, 24 + bob, 18, 10, outline);
    px(14, 25 + bob, 16, 8, coat);
    px(15, 29 + bob, 12, 3, belly);
    // Legs
    px(14 + stride, 33, 3, 9, outline);
    px(15 + stride, 33, 1, 8, legCol);
    px(20 - stride, 33, 3, 9, outline);
    px(21 - stride, 33, 1, 8, legCol);
    px(26 + stride, 33, 3, 9, outline);
    px(27 + stride, 33, 1, 8, legCol);
    // Neck & head (dips down when grazing)
    px(26, 15 + bob + eatDip, 8, 12 - Math.min(4, eatDip), outline);
    px(27, 16 + bob + eatDip, 6, 10 - Math.min(4, eatDip), coatLight);
    px(29, 14 + bob + eatDip, 9, 7, outline);
    px(30, 15 + bob + eatDip, 7, 5, coatLight);
    px(34, 16 + bob + eatDip, 2, 2, isSpirit ? '#FFF1C2' : '#14171A');
    px(37, 17 + bob + eatDip, 2, 2, '#1E1A18');
    // Antlers
    px(28, 8 + bob + eatDip, 2, 7, antlerCol);
    px(26, 9 + bob + eatDip, 3, 2, antlerCol);
    px(32, 7 + bob + eatDip, 2, 8, antlerCol);
    px(33, 9 + bob + eatDip, 3, 2, antlerCol);
    // Tail
    px(11, 24 + bob, 3, 3, isSpirit ? '#7EC4E0' : '#EAE4D7');
  } else if (species === 'BOAR') {
    px(10, 22 + bob, 24, 13, outline);
    px(11, 23 + bob, 22, 11, '#584237');
    px(13, 24 + bob, 16, 4, '#73584A');
    px(17, 19 + bob, 12, 4, '#2E221D');
    px(13 + stride, 34, 4, 8, outline);
    px(14 + stride, 34, 2, 7, '#3D2D25');
    px(27 - stride, 34, 4, 8, outline);
    px(28 - stride, 34, 2, 7, '#3D2D25');
    px(29, 24 + bob + Math.min(3, eatDip), 9, 8, outline);
    px(30, 25 + bob + Math.min(3, eatDip), 7, 6, '#6E5245');
    px(36, 27 + bob + Math.min(3, eatDip), 3, 4, '#A8786C');
    px(32, 26 + bob + Math.min(3, eatDip), 2, 2, '#E5534B');
    px(35, 30 + bob + Math.min(3, eatDip), 4, 2, '#F5E6C4');
    px(38, 28 + bob + Math.min(3, eatDip), 2, 3, '#F5E6C4');
  } else if (species === 'WOLF') {
    // Bushy tail
    px(8, 24 + bob, 8, 5, outline);
    px(9, 25 + bob, 6, 3, '#4E5661');
    px(8, 25 + bob, 2, 2, '#B9C1CA');
    // Body
    px(14, 23 + bob, 18, 11, outline);
    px(15, 24 + bob, 16, 9, '#5F6975');
    px(17, 25 + bob, 11, 4, '#7E8996'); // silver scruff
    px(18, 30 + bob, 10, 3, '#B9C1CA');
    // Legs
    px(15 + stride, 33, 3, 9, outline);
    px(16 + stride, 33, 1, 8, '#464E57');
    px(27 - stride, 33, 3, 9, outline);
    px(28 - stride, 33, 1, 8, '#464E57');
    // Head + pointed wolf ears + snout
    px(27, 14 + bob + Math.min(3, eatDip), 3, 5, outline);
    px(28, 15 + bob + Math.min(3, eatDip), 1, 3, '#7E8996');
    px(31, 14 + bob + Math.min(3, eatDip), 3, 5, outline);
    px(32, 15 + bob + Math.min(3, eatDip), 1, 3, '#7E8996');
    px(26, 18 + bob + Math.min(3, eatDip), 12, 9, outline);
    px(27, 19 + bob + Math.min(3, eatDip), 10, 7, '#6D7885');
    px(34, 22 + bob + Math.min(3, eatDip), 5, 4, '#9DA7B3'); // muzzle
    px(38, 22 + bob + Math.min(3, eatDip), 2, 2, '#14171A'); // nose
    px(32, 20 + bob + Math.min(3, eatDip), 2, 2, '#FFD166'); // sharp amber eye
  } else if (species === 'TURTLE') {
    // Sturdy Guardian Turtle with mossy stone shell
    px(12, 23 + bob, 21, 12, outline);
    px(13, 24 + bob, 19, 10, '#415D47');
    px(15, 23 + bob, 15, 6, '#5A7D5F'); // domed shell top
    px(17, 25 + bob, 4, 3, '#304735'); // shell scutes
    px(23, 25 + bob, 4, 3, '#304735');
    px(16, 29 + bob, 13, 2, '#8F7A4D'); // golden shell rim
    // Stubby legs
    px(14 + stride, 34, 4, 7, outline);
    px(15 + stride, 34, 2, 6, '#5D804F');
    px(27 - stride, 34, 4, 7, outline);
    px(28 - stride, 34, 2, 6, '#5D804F');
    // Head
    px(31, 27 + bob + Math.min(2, eatDip), 8, 6, outline);
    px(32, 28 + bob + Math.min(2, eatDip), 6, 4, '#6A9459');
    px(35, 29 + bob + Math.min(2, eatDip), 2, 1, '#14171A');
  } else if (species === 'RABBIT') {
    px(16, 29 + bob, 12, 9, outline);
    px(17, 30 + bob, 10, 7, '#B8AEA0');
    px(19, 32 + bob, 6, 4, '#E8E3D9');
    px(14, 32 + bob, 3, 3, '#FFFFFF');
    px(22, 19 + bob + Math.min(3, eatDip), 3, 7, outline);
    px(23, 20 + bob + Math.min(3, eatDip), 1, 5, '#C9BBAE');
    px(26, 20 + bob + Math.min(3, eatDip), 3, 6, outline);
    px(27, 21 + bob + Math.min(3, eatDip), 1, 4, '#E5989B');
    px(23, 25 + bob + Math.min(3, eatDip), 8, 7, outline);
    px(24, 26 + bob + Math.min(3, eatDip), 6, 5, '#C9BFB2');
    px(28, 27 + bob + Math.min(3, eatDip), 1, 2, '#14171A');
  } else if (species === 'BIRD') {
    const wingY = eating ? 1 : Math.sin(nowMs * 0.015) > 0 ? -3 : 1;
    px(16, 23 + bob, 12, 8, outline);
    px(17, 24 + bob, 10, 6, '#3D6E7D');
    px(18, 27 + bob, 7, 3, '#D8A45C');
    px(19, 22 + bob + wingY, 7, 4, '#5994A6');
    px(26, 21 + bob + Math.min(4, eatDip), 6, 6, outline);
    px(27, 22 + bob + Math.min(4, eatDip), 4, 4, '#4C8291');
    px(29, 23 + bob + Math.min(4, eatDip), 1, 1, '#FFFFFF');
    px(31, 24 + bob + Math.min(4, eatDip), 3, 2, '#E5B85A');
    px(20, 31, 1, 8, '#B88446');
    px(24, 31, 1, 8, '#B88446');
  } else if (species === 'EMBER_FOX') {
    const emberPulse = Math.sin(nowMs * 0.008) > 0 ? '#FFD166' : '#FF7B3B';
    px(8, 24 + bob, 9, 6, outline);
    px(9, 25 + bob, 6, 4, '#C85328');
    px(7, 24 + bob, 4, 4, emberPulse);
    px(16, 26 + bob, 15, 9, outline);
    px(17, 27 + bob, 13, 7, '#D4622C');
    px(19, 31 + bob, 9, 3, '#F5E6C4');
    px(17 + stride, 34, 3, 7, outline);
    px(18 + stride, 34, 1, 6, '#261E1A');
    px(27 - stride, 34, 3, 7, outline);
    px(28 - stride, 34, 1, 6, '#261E1A');
    px(26, 17 + bob + Math.min(3, eatDip), 4, 5, outline);
    px(27, 18 + bob + Math.min(3, eatDip), 2, 3, '#D4622C');
    px(31, 17 + bob + Math.min(3, eatDip), 4, 5, outline);
    px(32, 18 + bob + Math.min(3, eatDip), 2, 3, '#D4622C');
    px(26, 21 + bob + Math.min(3, eatDip), 11, 8, outline);
    px(27, 22 + bob + Math.min(3, eatDip), 9, 6, '#E07238');
    px(31, 25 + bob + Math.min(3, eatDip), 6, 3, '#F5E6C4');
    px(33, 23 + bob + Math.min(3, eatDip), 2, 2, '#FFF1C2');
    px(36, 25 + bob + Math.min(3, eatDip), 2, 2, '#14171A');
  } else if (species === 'GAZELLE') {
    px(14, 23 + bob, 16, 9, outline);
    px(15, 24 + bob, 14, 7, '#C28A4E');
    px(16, 28 + bob, 11, 3, '#EFE2C9');
    px(16 + stride, 32, 2, 10, '#966534');
    px(26 - stride, 32, 2, 10, '#966534');
    px(27, 14 + bob + eatDip, 6, 11, outline);
    px(28, 15 + bob + eatDip, 4, 9, '#D1995A');
    px(29, 13 + bob + eatDip, 8, 6, '#D9A76C');
    px(28, 7 + bob + eatDip, 2, 6, '#3D2E24');
    px(32, 6 + bob + eatDip, 2, 7, '#3D2E24');
    px(33, 15 + bob + eatDip, 2, 2, '#14171A');
  } else if (species === 'HYENA') {
    px(12, 23 + bob, 18, 11, outline);
    px(13, 24 + bob, 16, 9, '#8C7454');
    px(16, 25 + bob, 3, 3, '#3B2F22');
    px(22, 27 + bob, 3, 3, '#3B2F22');
    px(15 + stride, 34, 3, 8, '#5E4B35');
    px(26 - stride, 34, 3, 8, '#5E4B35');
    px(27, 17 + bob + eatDip, 10, 9, outline);
    px(28, 18 + bob + eatDip, 8, 7, '#998060');
    px(34, 21 + bob + eatDip, 4, 4, '#2A221B');
    px(31, 19 + bob + eatDip, 2, 2, '#FFD166');
    px(28, 13 + bob + eatDip, 3, 4, '#6E5A42');
  } else if (species === 'SNOW_WOLF' || species === 'DIRE_WOLF') {
    const isSnow = species === 'SNOW_WOLF';
    const coat = isSnow ? '#C9D6E2' : '#323842';
    const trim = isSnow ? '#EFF5FA' : '#586270';
    const eye = isSnow ? '#7EC4E0' : '#E5534B';
    px(7, 23 + bob, 9, 5, outline);
    px(8, 24 + bob, 7, 3, coat);
    px(13, 22 + bob, 20, 12, outline);
    px(14, 23 + bob, 18, 10, coat);
    px(16, 24 + bob, 11, 5, trim);
    px(15 + stride, 33, 3, 9, coat);
    px(27 - stride, 33, 3, 9, coat);
    px(27, 13 + bob + eatDip, 3, 5, outline);
    px(31, 13 + bob + eatDip, 3, 5, outline);
    px(26, 17 + bob + eatDip, 12, 9, outline);
    px(27, 18 + bob + eatDip, 10, 7, coat);
    px(32, 19 + bob + eatDip, 2, 2, eye);
    px(36, 22 + bob + eatDip, 3, 2, '#14171A');
  } else if (species === 'ARCTIC_FOX' || species === 'DESERT_FOX') {
    const isArctic = species === 'ARCTIC_FOX';
    const coat = isArctic ? '#E6EEF5' : '#D6A96E';
    const accentC = isArctic ? '#B5C8D8' : '#8C5C32';
    px(8, 25 + bob, 8, 5, outline);
    px(9, 26 + bob, 6, 3, coat);
    px(16, 26 + bob, 15, 9, outline);
    px(17, 27 + bob, 13, 7, coat);
    px(18 + stride, 34, 2, 7, accentC);
    px(27 - stride, 34, 2, 7, accentC);
    px(27, 17 + bob + eatDip, 3, 5, accentC);
    px(31, 17 + bob + eatDip, 3, 5, accentC);
    px(26, 21 + bob + eatDip, 10, 7, coat);
    px(33, 23 + bob + eatDip, 2, 2, '#14171A');
  } else if (species === 'MOUNTAIN_GOAT') {
    px(14, 23 + bob, 17, 11, outline);
    px(15, 24 + bob, 15, 9, '#DCD8CE');
    px(17, 26 + bob, 10, 4, '#EFECE4');
    px(15 + stride, 34, 3, 8, '#544E46');
    px(26 - stride, 34, 3, 8, '#544E46');
    px(28, 16 + bob + eatDip, 9, 8, outline);
    px(29, 17 + bob + eatDip, 7, 6, '#EAE6DC');
    px(27, 11 + bob + eatDip, 3, 6, '#3B342E');
    px(31, 11 + bob + eatDip, 3, 6, '#3B342E');
    px(33, 19 + bob + eatDip, 2, 2, '#14171A');
  } else if (species === 'SCORPION') {
    px(13, 27 + bob, 18, 9, outline);
    px(14, 28 + bob, 16, 7, '#7A4628');
    px(16, 29 + bob, 12, 3, '#A86238');
    // Tail stinger curved above
    px(10, 21 + bob, 5, 7, '#61341B');
    px(12, 16 + bob, 7, 5, '#8F4D28');
    px(18, 15 + bob, 3, 3, '#FFD166');
    // Claws
    px(30, 25 + bob, 7, 4, '#8F4D28');
    px(32, 30 + bob, 6, 4, '#8F4D28');
    px(16 + stride, 35, 2, 5, '#4A2814');
    px(21 - stride, 35, 2, 5, '#4A2814');
    px(26 + stride, 35, 2, 5, '#4A2814');
  } else if (species === 'FIRE_BEAST') {
    const flame = Math.sin(nowMs * 0.01) > 0 ? '#FFD166' : '#FF5722';
    px(7, 23 + bob, 9, 6, flame);
    px(15, 24 + bob, 17, 10, outline);
    px(16, 25 + bob, 15, 8, '#9E2A1C');
    px(18, 26 + bob, 10, 4, '#D94E28');
    px(17 + stride, 34, 3, 7, '#2A1815');
    px(27 - stride, 34, 3, 7, '#2A1815');
    px(26, 17 + bob + eatDip, 11, 9, outline);
    px(27, 18 + bob + eatDip, 9, 7, '#C83E22');
    px(32, 20 + bob + eatDip, 2, 2, '#FFF1C2');
    px(27, 14 + bob + eatDip, 3, 4, flame);
  } else if (species === 'EAGLE') {
    const flap = Math.sin(nowMs * 0.014) * 3;
    px(15, 21 + bob, 14, 9, outline);
    px(16, 22 + bob, 12, 7, '#4E3929');
    px(10, 17 + bob + flap, 10, 5, '#6E5038');
    px(24, 17 + bob - flap, 10, 5, '#6E5038');
    px(27, 18 + bob, 7, 7, '#EAE4D7');
    px(33, 21 + bob, 4, 3, '#E5B85A');
    px(30, 20 + bob, 2, 2, '#14171A');
  }
}

export interface MonsterSpriteOptions extends SkeletonSpriteOptions {
  facing?: Direction;
}

/**
 * Draws crisp 48x48 logical pixel-art monsters for all enemy types.
 */
export function drawMonsterPixelSprite(
  ctx: CanvasRenderingContext2D,
  enemyType: EnemyType,
  x: number,
  y: number,
  pixelSize: number,
  options: MonsterSpriteOptions = {}
) {
  if (enemyType === 'FOREST_SKELETON') {
    drawSkeletonPixelSprite(ctx, x, y, pixelSize, options);
    return;
  }
  if (enemyType === 'WILD_BOAR') {
    drawAnimalPixelSprite(ctx, 'BOAR', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }
  if (enemyType === 'FOREST_WOLF') {
    drawAnimalPixelSprite(ctx, 'WOLF', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }
  if (
    enemyType === 'SPIRIT_DEER' ||
    enemyType === 'EMBER_FOX' ||
    enemyType === 'TURTLE' ||
    enemyType === 'DEER'
  ) {
    drawAnimalPixelSprite(ctx, enemyType, x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }

  const animState = options.animState ?? 'IDLE';
  const t = Math.max(0, Math.min(1, options.animProgress ?? 0));
  const nowMs = options.nowMs ?? 0;
  const walkPhase = options.walkPhase ?? 0;
  let offsetX = 0;
  let offsetY = 0;
  let isDead = false;

  if (animState === 'ATTACK' || animState === 'HEAVY_ATTACK') {
    const lunge = Math.sin(t * Math.PI);
    offsetX = Math.round(-lunge * (animState === 'HEAVY_ATTACK' ? 9 : 6));
  } else if (animState === 'TAKE_DAMAGE') {
    const recoil = Math.sin(t * Math.PI);
    offsetX = Math.round(recoil * 5);
    offsetY = Math.round(-recoil * 2);
  } else if (animState === 'DEATH') {
    isDead = true;
  }

  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = options.hitFlash ? '#FFFFFF' : color;
    ctx.fillRect(
      Math.round(x + (gx + offsetX) * pixelSize),
      Math.round(y + (gy + offsetY) * pixelSize),
      Math.max(1, Math.round(w * pixelSize)),
      Math.max(1, Math.round(h * pixelSize))
    );
  };

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(
    Math.round(x + (11 + offsetX * 0.5) * pixelSize),
    Math.round(y + 41 * pixelSize),
    Math.round(26 * pixelSize),
    Math.round(4 * pixelSize)
  );

  const outline = '#090B0C';
  const bob = Math.sin(walkPhase || nowMs * 0.005) > 0.3 ? -1 : 0;

  if (enemyType === 'SLIME') {
    if (isDead) {
      px(10, 36, 28, 6, '#265E40');
      px(14, 37, 20, 4, '#56C47B');
      return;
    }
    const squish = Math.sin(nowMs * 0.007) > 0 ? 1 : 0;
    px(11 - squish, 23 + bob + squish, 26 + squish * 2, 18 - squish, outline);
    px(12 - squish, 24 + bob + squish, 24 + squish * 2, 16 - squish, '#2E7D52');
    px(14, 21 + bob + squish, 20, 15 - squish, '#4BB576');
    px(17, 22 + bob + squish, 14, 6, '#7FE3A4');
    // Glowing core
    px(20, 29 + bob, 8, 6, '#1E5238');
    px(22, 30 + bob, 4, 4, options.isPrepared ? '#FFD166' : '#A5F7C4');
    // Gloss & eyes
    px(16, 24 + bob + squish, 4, 2, '#E0FFF0');
    px(17, 29 + bob + squish, 3, 3, '#090B0C');
    px(27, 29 + bob + squish, 3, 3, '#090B0C');
    return;
  }

  if (enemyType === 'GOBLIN') {
    if (isDead) {
      px(11, 36, 24, 6, outline);
      px(13, 37, 16, 4, '#466E36');
      return;
    }
    // Legs
    px(17, 34, 4, 8, outline);
    px(18, 34, 2, 7, '#466E36');
    px(26, 34, 4, 8, outline);
    px(27, 34, 2, 7, '#466E36');
    // Hunched body + ragged tunic
    px(15, 22 + bob, 18, 13, outline);
    px(16, 23 + bob, 16, 11, '#584434');
    px(18, 24 + bob, 12, 5, '#7A5B43');
    // Goblin head + long pointed ears
    px(10, 13 + bob, 6, 4, outline);
    px(11, 14 + bob, 4, 2, '#5F8F49');
    px(32, 13 + bob, 6, 4, outline);
    px(33, 14 + bob, 4, 2, '#5F8F49');
    px(15, 11 + bob, 18, 12, outline);
    px(16, 12 + bob, 16, 10, '#5F8F49');
    px(21, 17 + bob, 6, 3, '#7BB35F'); // big nose
    // Fierce yellow eyes
    px(18, 15 + bob, 3, 2, '#FFD166');
    px(27, 15 + bob, 3, 2, '#FFD166');
    // Rusty dagger
    px(9, 17 + bob, 4, 12, outline);
    px(10, 18 + bob, 2, 8, '#A0A8B0');
    px(8, 25 + bob, 6, 2, '#8A6822');
    return;
  }

  if (enemyType === 'FROST_GOLEM') {
    if (isDead) {
      px(10, 35, 28, 7, '#3D627A');
      px(14, 34, 16, 4, '#A5E3FF');
      return;
    }
    px(14, 33, 6, 9, '#4D7894');
    px(28, 33, 6, 9, '#4D7894');
    px(11, 15 + bob, 26, 20, outline);
    px(12, 16 + bob, 24, 18, '#5C8FAE');
    px(15, 18 + bob, 18, 12, '#8CC4E3');
    px(8, 18 + bob, 5, 13, '#4B7894');
    px(35, 18 + bob, 5, 13, '#4B7894');
    px(16, 7 + bob, 16, 10, outline);
    px(17, 8 + bob, 14, 8, '#8CC4E3');
    px(20, 11 + bob, 3, 2, '#E0F7FF');
    px(26, 11 + bob, 3, 2, '#E0F7FF');
    px(21, 22 + bob, 6, 6, '#E0F7FF');
    return;
  }

  if (enemyType === 'MAGMA_FIEND') {
    if (isDead) {
      px(11, 35, 26, 7, '#332422');
      px(15, 36, 16, 4, '#FF6B35');
      return;
    }
    px(15, 33, 5, 9, '#2B1F1E');
    px(28, 33, 5, 9, '#2B1F1E');
    px(12, 16 + bob, 24, 19, outline);
    px(13, 17 + bob, 22, 17, '#3B2825');
    px(16, 19 + bob, 16, 12, '#8F2D1C');
    px(20, 22 + bob, 8, 7, '#FF7B2E');
    px(22, 23 + bob, 4, 4, '#FFD166');
    px(16, 7 + bob, 16, 11, outline);
    px(17, 8 + bob, 14, 9, '#4F302B');
    px(14, 4 + bob, 3, 5, '#2B1F1E');
    px(31, 4 + bob, 3, 5, '#2B1F1E');
    px(19, 11 + bob, 3, 2, '#FFD166');
    px(26, 11 + bob, 3, 2, '#FFD166');
    return;
  }

  if (enemyType === 'DESERT_SCORPION') {
    drawAnimalPixelSprite(ctx, 'SCORPION', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }
  if (enemyType === 'SAVANNA_HYENA') {
    drawAnimalPixelSprite(ctx, 'HYENA', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }
  if (enemyType === 'DIRE_WOLF') {
    drawAnimalPixelSprite(ctx, 'DIRE_WOLF', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      ...options,
    });
    return;
  }
  if (enemyType === 'CORRUPTED_STAG') {
    drawAnimalPixelSprite(ctx, 'SPIRIT_DEER', x, y, pixelSize, {
      facing: options.facing ?? 'left',
      hitFlash: options.hitFlash,
      nowMs,
    });
    px(18, 12 + bob, 3, 3, '#9D6CE0');
    px(26, 12 + bob, 3, 3, '#E5534B');
    return;
  }
  if (enemyType === 'UNDEAD_KNIGHT') {
    if (isDead) {
      px(10, 36, 26, 6, '#3A3F45');
      return;
    }
    px(16, 33, 5, 9, '#2B3036');
    px(27, 33, 5, 9, '#2B3036');
    px(14, 18 + bob, 20, 16, outline);
    px(15, 19 + bob, 18, 14, '#4B525C');
    px(18, 21 + bob, 12, 8, '#6B7480');
    px(16, 6 + bob, 16, 13, outline);
    px(17, 7 + bob, 14, 11, '#5B636E');
    px(19, 12 + bob, 10, 2, '#090B0C');
    px(20, 12 + bob, 3, 2, '#9D6CE0');
    px(25, 12 + bob, 3, 2, '#9D6CE0');
    px(9, 14 + bob, 3, 18, '#8E97A3');
    px(7, 25 + bob, 7, 2, '#C89B3C');
    return;
  }
  if (enemyType === 'CAVE_TROLL') {
    if (isDead) {
      px(10, 35, 28, 7, '#4B564C');
      return;
    }
    px(14, 33, 6, 9, '#3A423B');
    px(28, 33, 6, 9, '#3A423B');
    px(10, 15 + bob, 28, 19, outline);
    px(11, 16 + bob, 26, 17, '#586659');
    px(15, 18 + bob, 18, 11, '#708071');
    px(16, 7 + bob, 16, 11, outline);
    px(17, 8 + bob, 14, 9, '#627363');
    px(19, 11 + bob, 3, 2, '#FFD166');
    px(26, 11 + bob, 3, 2, '#FFD166');
    px(20, 14 + bob, 2, 3, '#EAE4D7');
    px(26, 14 + bob, 2, 3, '#EAE4D7');
    return;
  }

  // DARK_CREATURE
  if (isDead) {
    px(12, 36, 24, 6, '#1A1326');
    px(16, 35, 14, 4, '#6A3DA8');
    return;
  }
  const aura = Math.floor((Math.sin(nowMs * 0.008) + 1) * 2);
  px(10, 16 - aura, 2, 2, '#9D6CE0');
  px(36, 19 + aura, 2, 2, '#E5534B');
  // Shadow robe & tendrils
  px(12, 19 + bob, 24, 21, outline);
  px(13, 20 + bob, 22, 18, '#1B1426');
  px(16, 22 + bob, 16, 14, '#2A1D3D');
  px(14, 38 + bob, 4, 4, '#130D1C');
  px(22, 38 + bob, 4, 4, '#130D1C');
  px(30, 38 + bob, 4, 4, '#130D1C');
  // Horned shadow crown
  px(13, 4 + bob, 3, 8, '#2D2140');
  px(32, 4 + bob, 3, 8, '#2D2140');
  px(16, 8 + bob, 16, 13, outline);
  px(17, 9 + bob, 14, 11, '#120E1A');
  // Glowing violet/crimson eyes + chest rune
  px(19, 13 + bob, 3, 2, options.isPrepared ? '#E5534B' : '#B388FF');
  px(26, 13 + bob, 3, 2, options.isPrepared ? '#E5534B' : '#B388FF');
  px(22, 25 + bob, 4, 5, '#9D6CE0');
  px(23, 26 + bob, 2, 3, '#E0C8FF');
}

export function drawMerchantNpcSprite(
  ctx: CanvasRenderingContext2D,
  kind: MerchantRoleKind,
  x: number,
  y: number,
  pixelSize: number,
  nowMs = 0
) {
  const bob = Math.sin(nowMs * 0.003) > 0.3 ? -1 : 0;
  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x + gx * pixelSize),
      Math.round(y + gy * pixelSize),
      Math.max(1, Math.round(w * pixelSize)),
      Math.max(1, Math.round(h * pixelSize))
    );
  };

  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(x + 24 * pixelSize, y + 43 * pixelSize, 13 * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
  ctx.fill();

  const robeCol =
    kind === 'BLACKSMITH'
      ? '#4E3829'
      : kind === 'ALCHEMIST'
      ? '#265E42'
      : kind === 'RARE_TRADER'
      ? '#5D357A'
      : kind === 'MERCHANT_VILLAGE'
      ? '#8A5A2B'
      : '#3A5A6E';
  const trimCol =
    kind === 'BLACKSMITH'
      ? '#9AA3AD'
      : kind === 'ALCHEMIST'
      ? '#8FC79A'
      : '#E5B85A';

  px(16, 34, 5, 8, '#261C15');
  px(27, 34, 5, 8, '#261C15');
  px(14, 20 + bob, 20, 15, '#090B0C');
  px(15, 21 + bob, 18, 13, robeCol);
  px(19, 22 + bob, 10, 10, trimCol);
  px(16, 7 + bob, 16, 13, '#090B0C');
  px(17, 8 + bob, 14, 11, '#E0B996');
  // Hat/Hood
  if (kind === 'RARE_TRADER') {
    px(14, 5 + bob, 20, 6, '#FFD166');
    px(16, 3 + bob, 16, 4, '#8A4BB8');
  } else if (kind === 'ALCHEMIST') {
    px(15, 5 + bob, 18, 6, '#1E4A34');
  } else if (kind === 'BLACKSMITH') {
    px(16, 6 + bob, 16, 4, '#2B2F36');
  } else {
    px(14, 6 + bob, 20, 4, '#7A5434');
  }
  px(20, 13 + bob, 2, 2, '#14171A');
  px(26, 13 + bob, 2, 2, '#14171A');
}

/**
 * Draws a crisp 16x16 pixel-art item icon for all 35 inventory items.
 */
export function drawItemPixelIcon(
  ctx: CanvasRenderingContext2D,
  itemId: ItemId,
  x: number,
  y: number,
  pixelSize: number
) {
  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x + gx * pixelSize),
      Math.round(y + gy * pixelSize),
      Math.ceil(w * pixelSize),
      Math.ceil(h * pixelSize)
    );
  };

  switch (itemId) {
    case 'kayu':
      px(2, 9, 12, 4, '#6E5038');
      px(3, 8, 10, 1, '#856246');
      px(2, 9, 3, 4, '#A68361');
      px(6, 5, 6, 3, '#583E2B');
      break;
    case 'batu':
      px(4, 5, 8, 7, '#5A626A');
      px(3, 7, 10, 5, '#4A5158');
      px(5, 5, 5, 2, '#8A939E');
      px(4, 11, 8, 2, '#34393E');
      break;
    case 'bijih_besi':
      px(3, 5, 10, 8, '#4A5158');
      px(5, 4, 6, 2, '#6E7780');
      px(5, 7, 3, 3, '#B86B43');
      px(9, 8, 3, 3, '#D18B64');
      break;
    case 'bijih_emas':
      px(3, 5, 10, 8, '#4F5358');
      px(5, 6, 3, 3, '#E5B85A');
      px(9, 8, 3, 3, '#FFD166');
      px(6, 10, 2, 2, '#FFF1C2');
      break;
    case 'bijih_tembaga':
      px(3, 5, 10, 8, '#4B4745');
      px(5, 6, 3, 3, '#C86D44');
      px(9, 9, 3, 2, '#E0895E');
      break;
    case 'batu_bara':
      px(4, 5, 8, 8, '#181B1E');
      px(3, 7, 10, 5, '#22262B');
      px(5, 6, 3, 2, '#4A5158');
      break;
    case 'rumput_liar':
      px(7, 5, 2, 9, '#3B734D');
      px(4, 6, 2, 8, '#4E8F62');
      px(10, 7, 2, 7, '#2F5E3E');
      px(5, 12, 6, 2, '#8A6822');
      break;
    case 'herba_obat':
      px(7, 4, 2, 10, '#2F6E49');
      px(4, 6, 4, 4, '#56A874');
      px(8, 5, 4, 4, '#6EC48C');
      px(6, 3, 4, 2, '#A5E6BA');
      break;
    case 'sayur_liar':
      px(5, 7, 6, 6, '#C87D32');
      px(6, 12, 4, 2, '#9E5B20');
      px(5, 3, 6, 4, '#3B734D');
      px(7, 2, 2, 3, '#6EC48C');
      break;
    case 'beri':
      px(5, 3, 6, 2, '#264D34');
      px(4, 5, 4, 4, '#9E2A2B');
      px(8, 6, 4, 4, '#8A2022');
      px(6, 8, 4, 4, '#B83335');
      px(5, 6, 1, 1, '#E5989B');
      break;
    case 'jamur':
      px(6, 8, 4, 5, '#DCD6C8');
      px(3, 5, 10, 4, '#9E4B3B');
      px(5, 4, 6, 2, '#C86D5B');
      px(5, 6, 2, 1, '#F5E6C4');
      px(9, 6, 2, 1, '#F5E6C4');
      break;
    case 'benih':
      px(5, 6, 3, 4, '#9E7D4A');
      px(9, 7, 3, 4, '#B38E55');
      px(7, 4, 2, 3, '#6EC48C');
      break;
    case 'tanaman_langka':
      px(7, 7, 2, 7, '#2F6E49');
      px(4, 4, 8, 4, '#4D8FAC');
      px(6, 3, 4, 4, '#7EC4E0');
      px(7, 4, 2, 2, '#E0F7FF');
      break;
    case 'daging_mentah':
      px(3, 5, 10, 7, '#9E2A2B');
      px(4, 6, 8, 5, '#C84B4E');
      px(10, 6, 3, 3, '#EAE4D7');
      px(5, 7, 3, 2, '#E5989B');
      break;
    case 'kulit':
      px(3, 4, 10, 8, '#7A5434');
      px(4, 5, 8, 6, '#9A6E47');
      px(5, 7, 6, 2, '#6E5038');
      break;
    case 'tulang':
      px(4, 7, 8, 2, '#EAE4D7');
      px(3, 6, 2, 4, '#DCD6C8');
      px(11, 6, 2, 4, '#DCD6C8');
      break;
    case 'bulu':
      px(4, 10, 2, 3, '#DCD6C8');
      px(5, 5, 6, 6, '#C4CDD6');
      px(8, 3, 4, 5, '#EAE4D7');
      break;
    case 'daging_masak':
      px(3, 5, 10, 7, '#6E3B23');
      px(4, 6, 8, 5, '#9E5432');
      px(10, 6, 3, 3, '#F5E6C4');
      px(5, 4, 1, 2, '#E5B85A');
      px(8, 3, 1, 2, '#E5B85A');
      break;
    case 'sup_sayur':
      px(3, 7, 10, 5, '#6E5038');
      px(4, 6, 8, 3, '#D98A32');
      px(6, 6, 2, 2, '#6EC48C');
      px(9, 7, 2, 1, '#E5534B');
      break;
    case 'hidangan_beri':
      px(4, 7, 8, 6, '#5A626A');
      px(5, 6, 6, 5, '#B83335');
      px(6, 5, 4, 2, '#E5989B');
      break;
    case 'ramuan_sembuh':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#4CAF50');
      px(6, 7, 2, 2, '#A5E6BA');
      break;
    case 'ramuan_pulih':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#3B9ED8');
      px(6, 7, 2, 2, '#E0F7FF');
      break;
    case 'ramuan_bara':
      px(6, 2, 4, 2, '#8A6822');
      px(6, 4, 4, 2, '#7D858E');
      px(4, 6, 8, 7, '#2B3137');
      px(5, 7, 6, 5, '#C85A32');
      px(6, 8, 2, 2, '#E5B85A');
      break;
    case 'kapak_batu':
      px(7, 4, 2, 10, '#6E5038');
      px(4, 3, 5, 4, '#7D858E');
      px(3, 4, 2, 3, '#C4CDD6');
      break;
    case 'beliung_batu':
      px(7, 5, 2, 9, '#6E5038');
      px(3, 3, 10, 3, '#7D858E');
      px(3, 4, 2, 2, '#C4CDD6');
      px(11, 4, 2, 2, '#C4CDD6');
      break;
    case 'obor':
      px(7, 6, 2, 8, '#6E5038');
      px(6, 5, 4, 2, '#3A4046');
      px(6, 2, 4, 3, '#D97724');
      px(7, 1, 2, 3, '#E5B85A');
      break;
    case 'pisau_batu':
      px(7, 3, 2, 6, '#C4CDD6');
      px(6, 9, 4, 2, '#5A626A');
      px(7, 11, 2, 3, '#6E5038');
      break;
    case 'tombak_kayu':
      px(7, 5, 2, 10, '#7A5434');
      px(6, 2, 4, 4, '#EAE4D7');
      px(7, 1, 2, 2, '#FFFFFF');
      break;
    case 'busur_kayu':
      px(5, 2, 3, 12, '#8A6822');
      px(8, 3, 1, 10, '#DCD6C8');
      px(4, 7, 8, 1, '#C4CDD6');
      break;
    case 'senjata_tempa':
      px(7, 2, 2, 9, '#A8B2BC');
      px(8, 2, 1, 8, '#E6E2D8');
      px(5, 10, 6, 2, '#E5B85A');
      px(7, 12, 2, 3, '#6E5038');
      break;
    case 'zirah_kain':
      px(4, 3, 8, 10, '#4A5D47');
      px(5, 4, 6, 8, '#364734');
      px(6, 5, 4, 2, '#8FC79A');
      break;
    case 'zirah_kulit':
      px(4, 3, 8, 10, '#6E5038');
      px(5, 4, 6, 8, '#4A3525');
      px(6, 5, 4, 2, '#E5B85A');
      px(4, 9, 8, 2, '#8A6822');
      break;
    case 'perisai_kayu':
      px(3, 2, 10, 12, '#3B281A');
      px(4, 3, 8, 10, '#856246');
      px(6, 3, 4, 10, '#6E5038');
      px(7, 6, 2, 4, '#E5B85A');
      break;
    case 'perisai_besi':
      px(3, 2, 10, 12, '#2B3137');
      px(4, 3, 8, 10, '#8A939E');
      px(5, 4, 6, 3, '#C4CDD6');
      px(7, 6, 2, 5, '#E5B85A');
      break;
    case 'helm_kulit':
      px(4, 4, 8, 7, '#5A3E28');
      px(5, 5, 6, 4, '#8A6242');
      px(3, 9, 3, 4, '#4A3525');
      px(10, 9, 3, 4, '#4A3525');
      break;
    case 'helm_besi':
      px(4, 3, 8, 9, '#4C545C');
      px(5, 4, 6, 4, '#9AA3AD');
      px(7, 2, 2, 7, '#E5B85A');
      px(5, 8, 6, 2, '#14171A');
      break;
    case 'sarung_kulit':
      px(3, 5, 4, 7, '#6E5038');
      px(9, 5, 4, 7, '#6E5038');
      px(4, 4, 3, 2, '#8A6822');
      px(9, 4, 3, 2, '#8A6822');
      break;
    case 'sarung_besi':
      px(3, 4, 4, 8, '#5A626A');
      px(9, 4, 4, 8, '#5A626A');
      px(3, 6, 4, 2, '#C4CDD6');
      px(9, 6, 4, 2, '#C4CDD6');
      break;
    case 'sepatu_kulit':
      px(3, 4, 4, 8, '#5A3E28');
      px(3, 10, 6, 3, '#3B281A');
      px(9, 4, 4, 8, '#5A3E28');
      px(9, 10, 5, 3, '#3B281A');
      break;
    case 'sepatu_besi':
      px(3, 4, 4, 8, '#5A626A');
      px(3, 10, 6, 3, '#9AA3AD');
      px(9, 4, 4, 8, '#5A626A');
      px(9, 10, 5, 3, '#9AA3AD');
      break;
    case 'jimat_pelindung':
      px(5, 2, 6, 3, '#8A6822');
      px(5, 5, 6, 7, '#E5B85A');
      px(6, 6, 4, 5, '#4D8FAC');
      px(7, 7, 2, 2, '#E0F7FF');
      break;
    case 'papan_kayu':
      px(2, 4, 12, 3, '#9A7959');
      px(2, 8, 12, 3, '#856246');
      px(3, 5, 2, 1, '#6E5038');
      px(10, 9, 2, 1, '#6E5038');
      break;
    case 'balok_batu':
      px(2, 4, 12, 8, '#5A626A');
      px(3, 5, 10, 2, '#8A939E');
      px(7, 4, 1, 8, '#34393E');
      px(2, 8, 12, 1, '#34393E');
      break;
    case 'ikan_kecil':
      px(4, 6, 8, 4, '#8A9AA8');
      px(2, 7, 2, 2, '#5F6E7A');
      px(10, 7, 1, 1, '#090B0C');
      break;
    case 'ikan_sungai':
      px(3, 5, 9, 6, '#4D8FAC');
      px(1, 6, 2, 4, '#366880');
      px(5, 8, 5, 2, '#B6E0F2');
      px(10, 7, 1, 1, '#090B0C');
      break;
    case 'ikan_kolam':
      px(3, 4, 10, 7, '#649E7A');
      px(1, 6, 2, 4, '#3E6E52');
      px(5, 8, 6, 2, '#D0EAD8');
      px(11, 6, 1, 1, '#090B0C');
      break;
    case 'ikan_emas':
      px(3, 4, 10, 7, '#E5B85A');
      px(1, 6, 2, 4, '#C88D2B');
      px(5, 5, 5, 2, '#FFF1C2');
      px(11, 6, 1, 1, '#090B0C');
      break;
    case 'ikan_mistis':
      px(3, 4, 10, 7, '#4B7EE0');
      px(1, 5, 2, 5, '#9D6CE0');
      px(5, 6, 5, 2, '#A5F0FF');
      px(11, 6, 1, 1, '#FFD166');
      break;
    case 'ikan_beracun':
      px(3, 5, 9, 6, '#5D4E8A');
      px(5, 3, 2, 2, '#81C784');
      px(8, 3, 2, 2, '#81C784');
      px(1, 6, 2, 4, '#43386B');
      px(10, 7, 1, 1, '#E5534B');
      break;
    case 'ikan_panggang':
      px(3, 6, 10, 5, '#8A4F2B');
      px(5, 7, 6, 3, '#C87D44');
      px(6, 4, 1, 2, '#E5B85A');
      px(9, 3, 1, 2, '#E5B85A');
      break;
    case 'sup_ikan':
      px(3, 7, 10, 5, '#5E432E');
      px(4, 6, 8, 3, '#7EC4E0');
      px(6, 6, 3, 2, '#F5E6C4');
      px(10, 6, 2, 2, '#8FC79A');
      break;
    case 'ramuan_racun':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#23272B');
      px(5, 6, 6, 6, '#62B84A');
      px(6, 7, 2, 2, '#D4FFA8');
      break;
    case 'pancing_dasar':
      px(3, 12, 2, 2, '#6E5038');
      px(5, 9, 2, 3, '#856246');
      px(7, 6, 2, 3, '#9E7959');
      px(9, 3, 2, 3, '#B38E55');
      px(11, 4, 1, 7, '#DCD6C8');
      px(10, 11, 2, 2, '#E5534B');
      break;
    case 'umpan_pancing':
      px(5, 6, 6, 6, '#8A523B');
      px(6, 7, 4, 3, '#C85A4B');
      px(8, 5, 2, 2, '#8FC79A');
      break;
    case 'pedang_karat':
      px(7, 2, 2, 9, '#7D6D62');
      px(5, 10, 6, 2, '#5A626A');
      px(7, 12, 2, 3, '#4A3525');
      break;
    case 'koin_kuno':
      px(4, 4, 8, 8, '#C89B3C');
      px(5, 5, 6, 6, '#E5B85A');
      px(7, 6, 2, 4, '#8A6822');
      break;
    case 'pecahan_zirah':
      px(3, 4, 10, 8, '#5A626A');
      px(5, 5, 6, 4, '#8A939E');
      px(9, 7, 3, 4, '#34393E');
      break;
    case 'kulit_serigala':
      px(3, 4, 10, 8, '#4E5661');
      px(4, 5, 8, 6, '#6D7885');
      px(5, 6, 4, 2, '#B9C1CA');
      break;
    case 'taring':
      px(5, 3, 3, 9, '#F5E6C4');
      px(8, 5, 3, 6, '#DCD6C8');
      px(6, 11, 2, 2, '#A89F8D');
      break;
    case 'lendir_slime':
      px(4, 6, 8, 6, '#4BB576');
      px(5, 5, 6, 5, '#7FE3A4');
      px(6, 6, 2, 2, '#E0FFF0');
      break;
    case 'inti_slime':
      px(4, 4, 8, 8, '#2E9E7A');
      px(5, 5, 6, 6, '#6EE7B7');
      px(7, 6, 2, 3, '#FFFFFF');
      break;
    case 'kain_goblin':
      px(3, 4, 10, 8, '#5E4B3A');
      px(4, 6, 8, 4, '#7D6650');
      px(6, 5, 3, 2, '#466E36');
      break;
    case 'esensi_gelap':
      px(5, 3, 6, 10, '#3D2261');
      px(4, 5, 8, 6, '#7E57C2');
      px(6, 6, 4, 4, '#D1B3FF');
      break;
    case 'relik_terkutuk':
      px(4, 3, 8, 10, '#2B1840');
      px(5, 4, 6, 8, '#9D6CE0');
      px(6, 6, 4, 4, '#FFD166');
      px(7, 7, 2, 2, '#E5534B');
      break;
    case 'obsidian':
      px(4, 3, 8, 10, '#1B1524');
      px(5, 4, 6, 8, '#3B2852');
      px(6, 5, 2, 5, '#9D6CE0');
      break;
    case 'kristal_es':
      px(5, 2, 6, 12, '#4FA9D4');
      px(6, 3, 4, 10, '#A5E8FF');
      px(7, 4, 2, 6, '#FFFFFF');
      break;
    case 'abu_vulkanik':
      px(3, 8, 10, 5, '#4A3C39');
      px(5, 6, 6, 5, '#735A54');
      px(7, 7, 2, 2, '#FF6B35');
      break;
    case 'taring_kalajengking':
      px(5, 3, 5, 10, '#8C4E27');
      px(8, 3, 3, 5, '#D18243');
      px(6, 11, 2, 2, '#76C84D');
      break;
    case 'ramuan_hangat':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#FF6B35');
      px(6, 7, 2, 2, '#FFD166');
      break;
    case 'ramuan_pendingin':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#62D2FF');
      px(6, 7, 2, 2, '#FFFFFF');
      break;
    case 'ramuan_tahan_api':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#C83E22');
      px(6, 7, 3, 3, '#FFD166');
      break;
    case 'penawar_racun':
      px(6, 2, 4, 2, '#8A6822');
      px(4, 5, 8, 8, '#2B3137');
      px(5, 6, 6, 6, '#76C84D');
      px(6, 7, 2, 2, '#E6FFD1');
      break;
    case 'jubah_bulu':
      px(3, 3, 10, 10, '#8A6E58');
      px(4, 4, 8, 8, '#D9D0C3');
      px(6, 5, 4, 3, '#FFFFFF');
      break;
    case 'pakaian_gurun':
      px(4, 3, 8, 10, '#D4B47C');
      px(5, 4, 6, 8, '#EFE0BC');
      px(4, 9, 8, 2, '#8C5E34');
      break;
    case 'zirah_tahan_api':
      px(4, 3, 8, 10, '#2B1F24');
      px(5, 4, 6, 8, '#5E2B25');
      px(6, 5, 4, 4, '#FF6B35');
      break;
    case 'topeng_racun':
      px(4, 4, 8, 8, '#3B5E42');
      px(5, 6, 6, 4, '#24292E');
      px(6, 7, 4, 2, '#8FC79A');
      break;
    case 'sepatu_hangat':
      px(3, 4, 4, 8, '#D9D0C3');
      px(3, 10, 6, 3, '#5E4736');
      px(9, 4, 4, 8, '#D9D0C3');
      px(9, 10, 5, 3, '#5E4736');
      break;
    case 'sepatu_pasir':
      px(3, 4, 4, 8, '#C29A5B');
      px(3, 10, 6, 3, '#7A5434');
      px(9, 4, 4, 8, '#C29A5B');
      px(9, 10, 5, 3, '#7A5434');
      break;
    case 'sepatu_vulkanik':
      px(3, 4, 4, 8, '#2B1F24');
      px(3, 10, 6, 3, '#FF6B35');
      px(9, 4, 4, 8, '#2B1F24');
      px(9, 10, 5, 3, '#FF6B35');
      break;
    case 'jubah_penangkal':
      px(4, 2, 8, 11, '#2D5E47');
      px(5, 4, 6, 8, '#8FC79A');
      px(7, 5, 2, 4, '#E5B85A');
      break;
  }
}
