import combatArenaBackdropUrl from '../../assets/images/combat_arena_backdrop_1795524125741.jpg';
import { CHARACTER_CLASSES } from '../character/classes';
import { CombatState, ElementType, PlayerState, WeaponVisualKind } from '../core/types';
import {
  drawIllustratedAnimal,
  drawIllustratedCharacter,
  drawIllustratedMonster,
} from './illustratedSprites';

let cachedArenaImage: HTMLImageElement | null = null;
let arenaImageLoaded = false;

function getArenaBackdropImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!cachedArenaImage) {
    cachedArenaImage = new Image();
    cachedArenaImage.onload = () => {
      arenaImageLoaded = true;
    };
    cachedArenaImage.onerror = () => {
      arenaImageLoaded = false;
    };
    cachedArenaImage.src = combatArenaBackdropUrl;
  }
  return arenaImageLoaded && cachedArenaImage.naturalWidth > 0 ? cachedArenaImage : null;
}

export interface CombatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface CombatFloatingNumber {
  x: number;
  y: number;
  text: string;
  subText?: string;
  color: string;
  isCritical?: boolean;
  life: number;
  maxLife: number;
}

export interface CombatVfxRunner {
  particles: CombatParticle[];
  floatingNumbers: CombatFloatingNumber[];
  lastHandledVfxId: number;
  shakeRemaining: number;
  shakeStrength: number;
  hitStopUntil: number;
  activeProjectile: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    element: ElementType;
    weaponVisual?: WeaponVisualKind;
    startedAt: number;
    durationMs: number;
  } | null;
  activeSlash: {
    x: number;
    y: number;
    element: ElementType;
    heavy: boolean;
    weaponVisual?: WeaponVisualKind;
    target: 'ENEMY' | 'PLAYER';
    startedAt: number;
    durationMs: number;
  } | null;
}

export function createCombatVfxRunner(): CombatVfxRunner {
  return {
    particles: [],
    floatingNumbers: [],
    lastHandledVfxId: 0,
    shakeRemaining: 0,
    shakeStrength: 0,
    hitStopUntil: 0,
    activeProjectile: null,
    activeSlash: null,
  };
}

export function getElementPalette(element: ElementType): string[] {
  switch (element) {
    case 'FIRE':
      return ['#FF7A3D', '#E53935', '#FFD166'];
    case 'ICE':
      return ['#7EC4E0', '#3B9ED8', '#E0F7FF'];
    case 'LIGHTNING':
      return ['#FFE066', '#FFF8C4', '#4ECDC4'];
    case 'NATURE':
      return ['#56C271', '#8FC79A', '#D6F5DD'];
    case 'HOLY':
      return ['#E5B85A', '#FFF1C2', '#FFD166'];
    case 'DARK':
      return ['#9D6CE0', '#5E35B1', '#E3C7FF'];
    case 'POISON':
      return ['#76C84D', '#43A047', '#C5E1A5'];
    default:
      return ['#EAE4D7', '#C89B3C', '#9AA3AD'];
  }
}

export function renderCombatStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  combat: CombatState,
  player: PlayerState,
  runner: CombatVfxRunner,
  dt: number,
  nowMs: number
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const playerAnchorX = Math.round(width * 0.27);
  const enemyAnchorX = Math.round(width * 0.73);
  const groundY = Math.round(height * 0.77);
  const playerWeapon =
    player.equippedWeaponVisual ?? CHARACTER_CLASSES[player.classId].weaponVisual;

  if (combat.lastVfx && combat.lastVfx.id !== runner.lastHandledVfxId) {
    const vfx = combat.lastVfx;
    runner.lastHandledVfxId = vfx.id;

    const targetX = vfx.target === 'ENEMY' ? enemyAnchorX : playerAnchorX;
    const targetY = groundY - 46;
    const palette = getElementPalette(vfx.element);

    if (vfx.shakeIntensity > 0) {
      runner.shakeRemaining = 0.24;
      runner.shakeStrength = vfx.shakeIntensity;
    }
    if (vfx.hitStopMs > 0) {
      runner.hitStopUntil = nowMs + vfx.hitStopMs;
    }

    if (vfx.kind === 'SLASH' || vfx.kind === 'HEAVY_SLASH' || vfx.kind === 'ENEMY_STRIKE') {
      runner.activeSlash = {
        x: targetX,
        y: targetY,
        element: vfx.element,
        heavy: vfx.kind === 'HEAVY_SLASH',
        weaponVisual: vfx.target === 'ENEMY' ? playerWeapon : undefined,
        target: vfx.target,
        startedAt: nowMs,
        durationMs: vfx.kind === 'HEAVY_SLASH' ? 340 : 250,
      };
    }

    if (vfx.kind === 'PROJECTILE') {
      runner.activeProjectile = {
        startX: playerAnchorX + 24,
        startY: groundY - 52,
        endX: enemyAnchorX - 10,
        endY: groundY - 46,
        element: vfx.element,
        weaponVisual: playerWeapon,
        startedAt: nowMs,
        durationMs: 260,
      };
    }

    const count =
      vfx.kind === 'HEAVY_SLASH' || vfx.kind === 'PROJECTILE' || vfx.kind === 'TAME_ATTEMPT'
        ? 22
        : 14;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 38 + Math.random() * 100;
      runner.particles.push({
        x: targetX + (Math.random() * 16 - 8),
        y: targetY + (Math.random() * 16 - 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 22,
        size: 2.2 + Math.random() * 2.5,
        color: palette[i % palette.length],
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
      });
    }

    if (vfx.damageText) {
      runner.floatingNumbers.push({
        x: targetX,
        y: targetY - 28,
        text: vfx.damageText,
        subText: vfx.subText,
        color:
          vfx.kind === 'HEAL'
            ? '#8FC79A'
            : vfx.kind === 'TAME_ATTEMPT'
            ? '#FFD166'
            : vfx.kind === 'DODGE' || vfx.kind === 'SHIELD'
            ? '#7EC4E0'
            : vfx.isCritical
            ? '#FFD166'
            : '#F5E6C4',
        isCritical: vfx.isCritical,
        life: 1.05,
        maxLife: 1.05,
      });
    }
  }

  const inHitStop = nowMs < runner.hitStopUntil;
  const effDt = inHitStop ? 0 : dt;

  let shakeX = 0;
  let shakeY = 0;
  if (runner.shakeRemaining > 0) {
    runner.shakeRemaining = Math.max(0, runner.shakeRemaining - dt);
    const decay = runner.shakeRemaining / 0.24;
    shakeX = (Math.random() * 2 - 1) * runner.shakeStrength * decay;
    shakeY = (Math.random() * 2 - 1) * runner.shakeStrength * decay;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 1. Illustrated Dark Fantasy Forest Ruins Backdrop
  const arenaImg = getArenaBackdropImage();
  if (arenaImg) {
    const scale = Math.max((width + 24) / arenaImg.naturalWidth, (height + 24) / arenaImg.naturalHeight);
    const dw = arenaImg.naturalWidth * scale;
    const dh = arenaImg.naturalHeight * scale;
    ctx.drawImage(arenaImg, (width - dw) / 2, (height - dh) / 2, dw, dh);
    // Atmospheric foreground vignette for high combat readability
    const vignette = ctx.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, 'rgba(9, 12, 11, 0.35)');
    vignette.addColorStop(0.65, 'rgba(9, 12, 11, 0.18)');
    vignette.addColorStop(1, 'rgba(7, 9, 10, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(-12, -12, width + 24, height + 24);
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0C1412');
    skyGrad.addColorStop(0.68, '#172820');
    skyGrad.addColorStop(1, '#101814');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-12, -12, width + 24, height + 24);

    // Painted ruin pillars silhouette
    ctx.fillStyle = '#20282C';
    ctx.beginPath();
    ctx.roundRect(width * 0.42, 18, 22, groundY - 14, 4);
    ctx.roundRect(width * 0.54, 34, 18, groundY - 30, 4);
    ctx.fill();

    // Mossy stone ground platform
    const gGrad = ctx.createLinearGradient(0, groundY - 10, 0, height + 12);
    gGrad.addColorStop(0, '#233A2A');
    gGrad.addColorStop(1, '#0F1812');
    ctx.fillStyle = gGrad;
    ctx.fillRect(-12, groundY - 8, width + 24, height - groundY + 20);
  }

  // Soft stage contact pedestal glow beneath combatants
  for (const ax of [playerAnchorX, enemyAnchorX]) {
    const ped = ctx.createRadialGradient(ax, groundY + 2, 4, ax, groundY + 2, 54);
    ped.addColorStop(0, 'rgba(229, 184, 90, 0.14)');
    ped.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ped;
    ctx.beginPath();
    ctx.ellipse(ax, groundY + 2, 54, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating atmospheric embers
  for (let i = 0; i < 14; i++) {
    const fx = (Math.sin(nowMs * 0.0005 + i * 3.1) * 0.5 + 0.5) * width;
    const fy = (((nowMs * 0.02 + i * 47) % height) * -1) + height;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(126,196,224,0.4)' : 'rgba(255,198,107,0.5)';
    ctx.beginPath();
    ctx.arc(fx, fy, i % 2 === 0 ? 1.8 : 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Combatants
  const spriteScale = Math.max(1.75, Math.min(2.35, height / 118));
  const spriteSize = 48 * spriteScale;

  const pElapsed = (nowMs - combat.playerAnim.startedAt) / 420;
  const pAnim =
    pElapsed > 1 && combat.playerAnim.state !== 'DEATH'
      ? 'IDLE'
      : combat.playerAnim.state;
  const pFlash = Date.now() - combat.lastPlayerHitFlash < 180;

  drawIllustratedCharacter(
    ctx,
    player.classId,
    playerAnchorX - spriteSize / 2,
    groundY - spriteSize + 8,
    spriteScale,
    {
      facing: 'right',
      animState: combat.turn === 'DEFEAT' ? 'DEATH' : pAnim,
      animProgress: Math.min(1, pElapsed),
      weaponVisual: playerWeapon,
      armorVisual: player.equippedArmorVisual,
      offhandVisual: player.equippedOffhandVisual ?? 'NONE',
      helmetVisual: player.equippedHelmetVisual ?? 'NONE',
      nowMs,
      hitFlash: pFlash,
    }
  );

  if (player.companion && player.companion.active && combat.turn !== 'DEFEAT') {
    const compScale = spriteScale * 0.72;
    const compSize = 48 * compScale;
    drawIllustratedAnimal(
      ctx,
      player.companion.species,
      playerAnchorX - spriteSize / 2 - 42,
      groundY - compSize + 10,
      compScale,
      {
        facing: 'right',
        animState: combat.lastVfx?.kind === 'COMPANION_STRIKE' ? 'ATTACK' : 'IDLE',
        animProgress: combat.lastVfx?.kind === 'COMPANION_STRIKE' ? 0.5 : 0,
        nowMs,
      }
    );
  }

  const eElapsed = (nowMs - combat.enemyAnim.startedAt) / 420;
  const eAnim =
    eElapsed > 1 && combat.enemyAnim.state !== 'DEATH'
      ? 'IDLE'
      : combat.enemyAnim.state;
  const eFlash = Date.now() - combat.lastEnemyHitFlash < 180;

  drawIllustratedMonster(
    ctx,
    combat.enemy.type,
    enemyAnchorX - spriteSize / 2,
    groundY - spriteSize + 8,
    spriteScale,
    {
      facing: 'left',
      isGuarding: combat.enemy.isGuarding,
      isPrepared: combat.enemy.isPrepared,
      animState: combat.turn === 'VICTORY' ? 'DEATH' : eAnim,
      animProgress: Math.min(1, eElapsed),
      nowMs,
      hitFlash: eFlash,
    }
  );

  // 3. Weapon-tailored Slash & Shockwave VFX
  if (runner.activeSlash) {
    const s = runner.activeSlash;
    const prog = (nowMs - s.startedAt) / s.durationMs;
    if (prog >= 1) {
      runner.activeSlash = null;
    } else {
      const palette = getElementPalette(s.element);
      ctx.save();
      ctx.globalAlpha = 1 - prog;

      if (s.weaponVisual === 'HAMMER' && s.heavy) {
        // Golden heavy shockwave ring on impact
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 5 * (1 - prog * 0.6);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 24, 18 + prog * 42, 8 + prog * 14, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.weaponVisual === 'SPEAR') {
        // Piercing thrust streak
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x - 42, s.y + 10);
        ctx.lineTo(s.x + 28, s.y - 12);
        ctx.stroke();
      } else if (s.weaponVisual === 'DAGGERS' || s.weaponVisual === 'KNIFE' || s.weaponVisual === 'SICKLE') {
        // Dual cross-slash arcs
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(s.x - 24, s.y - 22);
        ctx.quadraticCurveTo(s.x + 4, s.y, s.x + 26, s.y + 22);
        ctx.moveTo(s.x + 24, s.y - 20);
        ctx.quadraticCurveTo(s.x - 2, s.y, s.x - 26, s.y + 22);
        ctx.stroke();
      } else {
        // Sweeping sword/weapon crescent arc
        const grad = ctx.createLinearGradient(s.x - 36, s.y - 36, s.x + 36, s.y + 36);
        grad.addColorStop(0, palette[2]);
        grad.addColorStop(0.5, palette[0]);
        grad.addColorStop(1, palette[1]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.heavy ? 7 : 4.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.heavy ? 38 : 28, -Math.PI * 0.72, Math.PI * 0.36);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(s.x + 2, s.y + 1, s.heavy ? 32 : 22, -Math.PI * 0.55, Math.PI * 0.24);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 4. Arrow & Elemental Spell Projectiles
  if (runner.activeProjectile) {
    const proj = runner.activeProjectile;
    const prog = (nowMs - proj.startedAt) / proj.durationMs;
    if (prog >= 1) {
      runner.activeProjectile = null;
    } else {
      const px = proj.startX + (proj.endX - proj.startX) * prog;
      const py =
        proj.startY + (proj.endY - proj.startY) * prog - Math.sin(prog * Math.PI) * 18;
      const palette = getElementPalette(proj.element);

      if (proj.element === 'LIGHTNING') {
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(proj.startX, proj.startY);
        ctx.lineTo((proj.startX + proj.endX) * 0.45, proj.startY - 18);
        ctx.lineTo((proj.startX + proj.endX) * 0.65, proj.endY - 4);
        ctx.lineTo(proj.endX, proj.endY);
        ctx.stroke();
      } else if (proj.weaponVisual === 'BOW' && proj.element === 'PHYSICAL') {
        // Feathered arrow projectile
        ctx.save();
        ctx.translate(px, py);
        ctx.strokeStyle = '#F5EFE4';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.fillStyle = '#E5B85A';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(7, -3.5);
        ctx.lineTo(7, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // Glowing radial orb + comet trail
        const orb = ctx.createRadialGradient(px, py, 1, px, py, 12);
        orb.addColorStop(0, '#FFFFFF');
        orb.addColorStop(0.35, palette[2]);
        orb.addColorStop(0.75, palette[0]);
        orb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 5. Smooth Circular Particles
  const aliveParticles: CombatParticle[] = [];
  for (const pt of runner.particles) {
    pt.life -= effDt;
    if (pt.life <= 0) continue;
    pt.x += pt.vx * effDt;
    pt.y += pt.vy * effDt;
    pt.vy += 120 * effDt;
    aliveParticles.push(pt);

    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  runner.particles = aliveParticles;

  // 6. Floating Damage & Critical Numbers
  const aliveNumbers: CombatFloatingNumber[] = [];
  ctx.textAlign = 'center';
  for (const fn of runner.floatingNumbers) {
    fn.life -= dt;
    if (fn.life <= 0) continue;
    aliveNumbers.push(fn);

    const progress = 1 - fn.life / fn.maxLife;
    const drawX = Math.round(fn.x);
    const drawY = Math.round(fn.y - progress * 24);
    ctx.globalAlpha = Math.min(1, fn.life * 2);

    ctx.font = fn.isCritical
      ? 'bold 19px "JetBrains Mono", monospace'
      : 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#090B0C';
    ctx.fillText(fn.text, drawX + 1.5, drawY + 1.5);
    ctx.fillStyle = fn.color;
    ctx.fillText(fn.text, drawX, drawY);

    if (fn.subText) {
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFD166';
      ctx.fillText(fn.subText, drawX, drawY - 17);
    }
  }
  ctx.globalAlpha = 1;
  runner.floatingNumbers = aliveNumbers;

  ctx.restore();
}
