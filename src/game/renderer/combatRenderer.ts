import { CombatState, ElementType, PlayerState } from '../core/types';
import {
  drawAnimalPixelSprite,
  drawCharacterPixelSprite,
  drawMonsterPixelSprite,
} from './pixelSprites';

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
    startedAt: number;
    durationMs: number;
  } | null;
  activeSlash: {
    x: number;
    y: number;
    element: ElementType;
    heavy: boolean;
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
      return ['#FF6B35', '#E53935', '#FFD166'];
    case 'ICE':
      return ['#7EC4E0', '#3B9ED8', '#E0F7FF'];
    case 'LIGHTNING':
      return ['#FFE066', '#FFF8C4', '#4ECDC4'];
    case 'NATURE':
      return ['#4CAF50', '#8FC79A', '#C8E6C9'];
    case 'HOLY':
      return ['#E5B85A', '#FFF1C2', '#C89B3C'];
    case 'DARK':
      return ['#9D6CE0', '#5E35B1', '#1A1326'];
    case 'POISON':
      return ['#76C84D', '#43A047', '#C5E1A5'];
    default:
      return ['#E6E2D8', '#C89B3C', '#9AA3AD'];
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
  ctx.imageSmoothingEnabled = false;

  const playerAnchorX = Math.round(width * 0.27);
  const enemyAnchorX = Math.round(width * 0.73);
  const groundY = Math.round(height * 0.76);

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
        startedAt: nowMs,
        durationMs: vfx.kind === 'HEAVY_SLASH' ? 320 : 240,
      };
    }

    if (vfx.kind === 'PROJECTILE') {
      runner.activeProjectile = {
        startX: playerAnchorX + 20,
        startY: groundY - 52,
        endX: enemyAnchorX,
        endY: groundY - 48,
        element: vfx.element,
        startedAt: nowMs,
        durationMs: 260,
      };
    }

    const count =
      vfx.kind === 'HEAVY_SLASH' || vfx.kind === 'PROJECTILE' || vfx.kind === 'TAME_ATTEMPT'
        ? 22
        : 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 35 + Math.random() * 95;
      runner.particles.push({
        x: targetX + (Math.random() * 14 - 7),
        y: targetY + (Math.random() * 14 - 7),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: Math.random() > 0.4 ? 4 : 3,
        color: palette[i % palette.length],
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
      });
    }

    if (vfx.damageText) {
      runner.floatingNumbers.push({
        x: targetX,
        y: targetY - 26,
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
    shakeX = Math.round((Math.random() * 2 - 1) * runner.shakeStrength * decay);
    shakeY = Math.round((Math.random() * 2 - 1) * runner.shakeStrength * decay);
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Dark Fantasy Forest Ruins Backdrop
  ctx.fillStyle = '#0D1311';
  ctx.fillRect(-12, -12, width + 24, height + 24);

  ctx.fillStyle = '#14221B';
  for (let i = 0; i < 9; i++) {
    const tx = Math.round((width / 8) * i);
    ctx.fillRect(tx - 10, 14, 20, groundY - 14);
  }
  ctx.fillStyle = '#252B30';
  ctx.fillRect(Math.round(width * 0.44), 24, 18, groundY - 24);
  ctx.fillRect(Math.round(width * 0.52), 40, 14, groundY - 40);

  ctx.fillStyle = '#182A1F';
  ctx.fillRect(-12, groundY - 6, width + 24, height - groundY + 18);
  ctx.fillStyle = '#243B2C';
  ctx.fillRect(-12, groundY - 6, width + 24, 4);

  for (let i = 0; i < 12; i++) {
    const fx = Math.round(((Math.sin(nowMs * 0.0005 + i * 3.1) * 0.5 + 0.5) * width));
    const fy = Math.round(((nowMs * 0.02 + i * 47) % height) * -1 + height);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(126,196,224,0.35)' : 'rgba(229,184,90,0.45)';
    ctx.fillRect(fx, fy, 2, 2);
  }

  const spriteScale = 2;
  const spriteSize = 48 * spriteScale;

  const pElapsed = (nowMs - combat.playerAnim.startedAt) / 420;
  const pAnim = pElapsed > 1 && combat.playerAnim.state !== 'DEATH'
    ? 'IDLE'
    : combat.playerAnim.state;
  const pFlash = Date.now() - combat.lastPlayerHitFlash < 180;

  drawCharacterPixelSprite(
    ctx,
    player.classId,
    playerAnchorX - spriteSize / 2,
    groundY - spriteSize + 8,
    spriteScale,
    {
      facing: 'right',
      animState: combat.turn === 'DEFEAT' ? 'DEATH' : pAnim,
      animProgress: Math.min(1, pElapsed),
      weaponVisual: player.equippedWeaponVisual,
      armorVisual: player.equippedArmorVisual,
      offhandVisual: player.equippedOffhandVisual ?? 'NONE',
      helmetVisual: player.equippedHelmetVisual ?? 'NONE',
      nowMs,
      hitFlash: pFlash,
    }
  );

  if (player.companion && player.companion.active && combat.turn !== 'DEFEAT') {
    const compScale = 1.45;
    const compSize = 48 * compScale;
    drawAnimalPixelSprite(
      ctx,
      player.companion.species,
      playerAnchorX - spriteSize / 2 - 44,
      groundY - compSize + 12,
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
  const eAnim = eElapsed > 1 && combat.enemyAnim.state !== 'DEATH'
    ? 'IDLE'
    : combat.enemyAnim.state;
  const eFlash = Date.now() - combat.lastEnemyHitFlash < 180;

  drawMonsterPixelSprite(
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

  // 4. Slash Arc Trail VFX
  if (runner.activeSlash) {
    const s = runner.activeSlash;
    const prog = (nowMs - s.startedAt) / s.durationMs;
    if (prog >= 1) {
      runner.activeSlash = null;
    } else {
      const palette = getElementPalette(s.element);
      ctx.save();
      ctx.globalAlpha = 1 - prog;
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = s.heavy ? 6 : 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.heavy ? 36 : 26, -Math.PI * 0.7, Math.PI * 0.35);
      ctx.stroke();

      ctx.strokeStyle = palette[1];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x + 3, s.y + 2, s.heavy ? 30 : 20, -Math.PI * 0.55, Math.PI * 0.25);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5. Magic Projectile VFX
  if (runner.activeProjectile) {
    const proj = runner.activeProjectile;
    const prog = (nowMs - proj.startedAt) / proj.durationMs;
    if (prog >= 1) {
      runner.activeProjectile = null;
    } else {
      const px = Math.round(proj.startX + (proj.endX - proj.startX) * prog);
      const py = Math.round(
        proj.startY + (proj.endY - proj.startY) * prog - Math.sin(prog * Math.PI) * 18
      );
      const palette = getElementPalette(proj.element);

      if (proj.element === 'LIGHTNING') {
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(proj.startX, proj.startY);
        ctx.lineTo((proj.startX + proj.endX) / 2, proj.startY - 16);
        ctx.lineTo(proj.endX, proj.endY);
        ctx.stroke();
      } else {
        ctx.fillStyle = palette[0];
        ctx.fillRect(px - 6, py - 6, 12, 12);
        ctx.fillStyle = palette[2];
        ctx.fillRect(px - 3, py - 3, 6, 6);
        // Trail
        ctx.fillStyle = palette[1];
        ctx.fillRect(px - 14, py - 2, 6, 4);
      }
    }
  }

  // 6. Update & Draw Particles
  const aliveParticles: CombatParticle[] = [];
  for (const pt of runner.particles) {
    pt.life -= effDt;
    if (pt.life <= 0) continue;
    pt.x += pt.vx * effDt;
    pt.y += pt.vy * effDt;
    pt.vy += 120 * effDt; // subtle gravity
    aliveParticles.push(pt);

    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  runner.particles = aliveParticles;

  // 7. Floating Damage & Critical Numbers
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
      ? 'bold 18px "JetBrains Mono", monospace'
      : 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#090B0C';
    ctx.fillText(fn.text, drawX + 1, drawY + 1);
    ctx.fillStyle = fn.color;
    ctx.fillText(fn.text, drawX, drawY);

    if (fn.subText) {
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFD166';
      ctx.fillText(fn.subText, drawX, drawY - 16);
    }
  }
  ctx.globalAlpha = 1;
  runner.floatingNumbers = aliveNumbers;

  ctx.restore();
}
