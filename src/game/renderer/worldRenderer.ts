import { LOOT_RARITY_COLORS } from '../combat/lootSystem';
import {
  CameraZoomLevel,
  FloatingText,
  GroundLootItem,
  MerchantEntity,
  MonsterEntity,
  PlayerState,
  RegionData,
  ResourceNode,
  TileType,
  WildlifeEntity,
  WorldState,
} from '../core/types';
import { getTimeOfDayInfo } from '../survival/survivalSystem';
import { BIOME_CONFIGS } from '../world/biomes';
import { hashCoords } from '../world/noise';
import {
  REGION_HEIGHT,
  REGION_WIDTH,
  TILE_SIZE,
  isTileExplored,
  isWorldPointVisible,
} from '../world/worldGenerator';
import {
  drawIllustratedAnimal,
  drawIllustratedCharacter,
  drawIllustratedMerchant,
  drawIllustratedMonster,
} from './illustratedSprites';

export const CAMERA_ZOOM_SCALES: Record<CameraZoomLevel, number> = {
  VERY_CLOSE: 2.55,
  CLOSE: 2.1,
  NORMAL: 1.65,
  FAR: 1.2,
};

interface RenderWorldParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  cameraZoom: number;
  camX: number;
  camY: number;
  visibilityRadiusPx: number;
  player: PlayerState;
  world: WorldState;
  region: RegionData;
  nearestResource: ResourceNode | null;
  nearWaterTile: { tileX: number; tileY: number } | null;
  nearestWildlife: WildlifeEntity | null;
  nearestMerchant?: MerchantEntity | null;
  nearestGroundLoot?: GroundLootItem | null;
  floatingTexts: FloatingText[];
  nowMs: number;
}

export function computeClampedCameraOrigin(
  targetX: number,
  targetY: number,
  viewportW: number,
  viewportH: number,
  zoom: number,
  regionWidthTiles: number,
  regionHeightTiles: number
): { camX: number; camY: number; viewW: number; viewH: number } {
  const viewW = viewportW / zoom;
  const viewH = viewportH / zoom;
  const regionPxW = regionWidthTiles * TILE_SIZE;
  const regionPxH = regionHeightTiles * TILE_SIZE;

  const rawX = targetX - viewW / 2;
  const rawY = targetY - viewH / 2;

  const camX =
    viewW >= regionPxW
      ? (regionPxW - viewW) / 2
      : Math.max(0, Math.min(regionPxW - viewW, rawX));
  const camY =
    viewH >= regionPxH
      ? (regionPxH - viewH) / 2
      : Math.max(0, Math.min(regionPxH - viewH, rawY));

  return { camX, camY, viewW, viewH };
}

export function renderWorld({
  ctx,
  width,
  height,
  cameraZoom,
  camX: inputCamX,
  camY: inputCamY,
  visibilityRadiusPx,
  player,
  world,
  region,
  nearestResource,
  nearWaterTile,
  nearestWildlife,
  nearestMerchant,
  nearestGroundLoot,
  floatingTexts,
  nowMs,
}: RenderWorldParams) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = '#070809';
  ctx.fillRect(0, 0, width, height);

  const clamped = computeClampedCameraOrigin(
    inputCamX,
    inputCamY,
    width,
    height,
    cameraZoom,
    region.width,
    region.height
  );
  const camX = Math.round(clamped.camX * 10) / 10;
  const camY = Math.round(clamped.camY * 10) / 10;
  const viewW = clamped.viewW;
  const viewH = clamped.viewH;

  const minTileX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const maxTileX = Math.min(region.width - 1, Math.ceil((camX + viewW) / TILE_SIZE) + 1);
  const minTileY = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const maxTileY = Math.min(region.height - 1, Math.ceil((camY + viewH) / TILE_SIZE) + 1);

  const resourceByTile = region.resourceByTile ?? new Map<string, ResourceNode>();
  if (resourceByTile.size === 0 && region.resources.length > 0) {
    for (const res of region.resources) {
      resourceByTile.set(`${res.tileX},${res.tileY}`, res);
    }
  }

  ctx.save();
  ctx.scale(cameraZoom, cameraZoom);

  const isTileVisible = (tx: number, ty: number) =>
    isWorldPointVisible(
      player.x,
      player.y,
      tx * TILE_SIZE + TILE_SIZE / 2,
      ty * TILE_SIZE + TILE_SIZE / 2,
      visibilityRadiusPx
    );

  // 1. HD 2D ILLUSTRATED BIOME TERRAIN LAYER
  for (let ty = minTileY; ty <= maxTileY; ty++) {
    const sy = ty * TILE_SIZE - camY;
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const visible = isTileVisible(tx, ty);
      const explored = visible || isTileExplored(world, region.key, tx, ty);
      if (!explored) continue;

      const sx = tx * TILE_SIZE - camX;
      const tile = region.tiles[ty][tx];
      const variant = region.tileVariants[ty][tx];
      const nHash = hashCoords(world.seed, tx + region.rx * 40, ty + region.ry * 30, 41);

      drawIllustratedGroundTile(ctx, region, tile, variant, tx, ty, sx, sy, nHash, nowMs);
    }
  }

  // 1b. Exit directional markers
  const arrowPulse = 0.55 + Math.sin(nowMs * 0.005) * 0.25;
  ctx.fillStyle = `rgba(229, 184, 90, ${arrowPulse.toFixed(2)})`;
  for (const exit of region.exits) {
    if (
      !isTileVisible(exit.tileX, exit.tileY) &&
      !isTileExplored(world, region.key, exit.tileX, exit.tileY)
    ) {
      continue;
    }
    const ex = exit.tileX * TILE_SIZE - camX;
    const ey = exit.tileY * TILE_SIZE - camY;
    ctx.beginPath();
    if (exit.direction === 'NORTH') {
      ctx.moveTo(ex + 32, ey + 4);
      ctx.lineTo(ex + 40, ey + 14);
      ctx.lineTo(ex + 24, ey + 14);
    } else if (exit.direction === 'SOUTH') {
      ctx.moveTo(ex + 32, ey + 28);
      ctx.lineTo(ex + 40, ey + 18);
      ctx.lineTo(ex + 24, ey + 18);
    } else if (exit.direction === 'WEST') {
      ctx.moveTo(ex + 4, ey + 32);
      ctx.lineTo(ex + 14, ey + 24);
      ctx.lineTo(ex + 14, ey + 40);
    } else {
      ctx.moveTo(ex + 28, ey + 32);
      ctx.lineTo(ex + 18, ey + 24);
      ctx.lineTo(ex + 18, ey + 40);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 1c. Merchant stalls & warm lanterns in settlement areas
  for (const merch of region.merchants) {
    if (
      !isWorldPointVisible(player.x, player.y, merch.x, merch.y, visibilityRadiusPx) &&
      !isTileExplored(world, region.key, Math.floor(merch.x / TILE_SIZE), Math.floor(merch.y / TILE_SIZE))
    ) {
      continue;
    }
    const mx = merch.x - camX;
    const my = merch.y - camY;
    // Wooden stall canopy behind merchant with warm hanging lantern glow
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(mx, my + 8, 23, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden support beams
    ctx.fillStyle = '#4B3322';
    ctx.beginPath();
    ctx.roundRect(mx - 19, my - 26, 4, 24, 1.5);
    ctx.roundRect(mx + 15, my - 26, 4, 24, 1.5);
    ctx.roundRect(mx - 18, my - 25, 36, 9, 2);
    ctx.fill();

    // Curved fabric awning + scalloped gold trim
    const awningCol =
      merch.kind === 'ALCHEMIST'
        ? '#2B7A50'
        : merch.kind === 'BLACKSMITH'
        ? '#58626B'
        : merch.kind === 'RARE_TRADER'
        ? '#6D3FA6'
        : '#B54A35';
    ctx.fillStyle = awningCol;
    ctx.beginPath();
    ctx.moveTo(mx - 22, my - 24);
    ctx.quadraticCurveTo(mx, my - 35, mx + 22, my - 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0D0F12';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.strokeStyle = '#E5B85A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(mx - 20, my - 24);
    ctx.lineTo(mx + 20, my - 24);
    ctx.stroke();

    // Warm swinging lantern glow
    const lanternGlow = ctx.createRadialGradient(mx + 16, my - 19, 1, mx + 16, my - 19, 13);
    lanternGlow.addColorStop(0, 'rgba(255, 224, 128, 0.72)');
    lanternGlow.addColorStop(1, 'rgba(255, 180, 70, 0)');
    ctx.fillStyle = lanternGlow;
    ctx.beginPath();
    ctx.arc(mx + 16, my - 19, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. TARGETING HIGHLIGHT
  if (nearestMerchant) {
    const mx = Math.round(nearestMerchant.x - camX - 18);
    const my = Math.round(nearestMerchant.y - camY - 26);
    drawCornerBrackets(ctx, mx, my, 36, 36, '#FFD166');
  } else if (nearestGroundLoot) {
    const lx = Math.round(nearestGroundLoot.x - camX - 12);
    const ly = Math.round(nearestGroundLoot.y - camY - 12);
    drawCornerBrackets(ctx, lx, ly, 24, 24, LOOT_RARITY_COLORS[nearestGroundLoot.rarity]);
  } else if (nearestResource && nearestResource.remaining > 0) {
    const rx = nearestResource.tileX * TILE_SIZE - camX;
    const ry = nearestResource.tileY * TILE_SIZE - camY;
    drawCornerBrackets(ctx, rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4, '#E5B85A');
  } else if (nearWaterTile) {
    const wx = nearWaterTile.tileX * TILE_SIZE - camX;
    const wy = nearWaterTile.tileY * TILE_SIZE - camY;
    drawCornerBrackets(ctx, wx + 2, wy + 2, TILE_SIZE - 4, TILE_SIZE - 4, '#7EC4E0');
  } else if (nearestWildlife && !nearestWildlife.defeated) {
    const ax = Math.round(nearestWildlife.x - camX - 16);
    const ay = Math.round(nearestWildlife.y - camY - 16);
    drawCornerBrackets(
      ctx,
      ax,
      ay,
      32,
      32,
      nearestWildlife.tameEligible ? '#FFD166' : '#E5534B'
    );
  }

  // 3. GROUND LOOT ITEMS (cinched leather pouch + rarity aura)
  for (const loot of region.groundLoot) {
    if (!isWorldPointVisible(player.x, player.y, loot.x, loot.y, visibilityRadiusPx)) {
      continue;
    }
    const lx = Math.round(loot.x - camX);
    const ly = Math.round(loot.y - camY);
    const bob = Math.sin(nowMs * 0.006 + loot.x) * 1.6;
    const col = LOOT_RARITY_COLORS[loot.rarity];

    const halo = ctx.createRadialGradient(lx, ly + bob, 1, lx, ly + bob, 10);
    halo.addColorStop(0, `${col}55`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(lx, ly + bob, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(lx, ly + 6, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#735136';
    ctx.strokeStyle = '#0D0F12';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(lx, ly + 0.5 + bob, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(lx, ly - 4 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Y-SORTED WORLD PROPS & ACTORS
  type DrawActor =
    | { kind: 'TREE'; y: number; sx: number; sy: number; res?: ResourceNode; seed: number }
    | { kind: 'ROCK'; y: number; sx: number; sy: number; res?: ResourceNode; seed: number }
    | { kind: 'PLANT'; y: number; sx: number; sy: number; res?: ResourceNode; seed: number }
    | { kind: 'PLAYER'; y: number }
    | { kind: 'COMPANION'; y: number }
    | { kind: 'MERCHANT'; y: number; merch: MerchantEntity }
    | { kind: 'WILDLIFE'; y: number; w: WildlifeEntity }
    | { kind: 'MONSTER'; y: number; m: MonsterEntity };

  const actors: DrawActor[] = [{ kind: 'PLAYER', y: player.y }];
  if (player.companion && player.companion.active) {
    actors.push({ kind: 'COMPANION', y: player.companion.y });
  }

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    const sy = ty * TILE_SIZE - camY;
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const visible = isTileVisible(tx, ty);
      if (!visible && !isTileExplored(world, region.key, tx, ty)) continue;

      const sx = tx * TILE_SIZE - camX;
      const tile = region.tiles[ty][tx];
      const resNode = resourceByTile.get(`${tx},${ty}`);
      const nSeed = hashCoords(world.seed, tx + region.rx * 40, ty + region.ry * 30, 88);
      if (tile === 'TREE') {
        actors.push({ kind: 'TREE', y: ty * TILE_SIZE + 27, sx, sy, res: resNode, seed: nSeed });
      } else if (tile === 'ROCK') {
        actors.push({ kind: 'ROCK', y: ty * TILE_SIZE + 25, sx, sy, res: resNode, seed: nSeed });
      } else if (tile === 'PLANT') {
        actors.push({ kind: 'PLANT', y: ty * TILE_SIZE + 24, sx, sy, res: resNode, seed: nSeed });
      }
    }
  }

  for (const merch of region.merchants) {
    if (!isWorldPointVisible(player.x, player.y, merch.x, merch.y, visibilityRadiusPx)) continue;
    actors.push({ kind: 'MERCHANT', y: merch.y, merch });
  }
  for (const w of region.wildlife) {
    if (w.defeated || w.tamed) continue;
    if (!isWorldPointVisible(player.x, player.y, w.x, w.y, visibilityRadiusPx)) continue;
    actors.push({ kind: 'WILDLIFE', y: w.y, w });
  }
  for (const m of region.monsters) {
    if (m.defeated) continue;
    if (!isWorldPointVisible(player.x, player.y, m.x, m.y, visibilityRadiusPx)) continue;
    actors.push({ kind: 'MONSTER', y: m.y, m });
  }

  actors.sort((a, b) => a.y - b.y);

  for (const actor of actors) {
    if (actor.kind === 'TREE') {
      drawIllustratedTree(ctx, actor.sx, actor.sy, actor.res, actor.seed, nowMs);
    } else if (actor.kind === 'ROCK') {
      drawIllustratedRock(ctx, actor.sx, actor.sy, actor.res, actor.seed);
    } else if (actor.kind === 'PLANT') {
      drawIllustratedPlant(ctx, actor.sx, actor.sy, actor.res, actor.seed);
    } else if (actor.kind === 'MERCHANT') {
      const mx = Math.round(actor.merch.x - camX - 24);
      const my = Math.round(actor.merch.y - camY - 34);
      drawIllustratedMerchant(ctx, actor.merch.kind, mx, my, 1, nowMs);
      ctx.fillStyle = '#FFD166';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(actor.merch.title, actor.merch.x - camX, my - 2);
    } else if (actor.kind === 'PLAYER') {
      const px = Math.round(player.x - camX - 24);
      const py = Math.round(player.y - camY - 34);
      const isSwinging = Boolean(player.worldAttackUntil && nowMs < player.worldAttackUntil);
      const swingStart = player.worldAttackStartedAt ?? nowMs - 100;
      const swingDur = Math.max(180, (player.worldAttackUntil ?? nowMs) - swingStart);
      const swingProg = isSwinging ? Math.max(0, Math.min(1, (nowMs - swingStart) / swingDur)) : 0;

      drawIllustratedCharacter(ctx, player.classId, px, py, 1, {
        facing: player.facing,
        walkPhase: player.animTime * 11,
        animState: isSwinging ? 'ATTACK' : player.isMoving ? 'WALK' : 'IDLE',
        animProgress: swingProg,
        weaponVisual: player.equippedWeaponVisual,
        armorVisual: player.equippedArmorVisual,
        offhandVisual: player.equippedOffhandVisual ?? 'NONE',
        helmetVisual: player.equippedHelmetVisual ?? 'NONE',
        nowMs,
      });

      // Sweeping world exploration weapon slash arc
      if (isSwinging && swingProg < 0.95) {
        const dirAngle =
          player.facing === 'right'
            ? 0
            : player.facing === 'left'
            ? Math.PI
            : player.facing === 'down'
            ? Math.PI * 0.5
            : -Math.PI * 0.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - swingProg);
        ctx.strokeStyle = '#FFD166';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(
          player.x - camX,
          player.y - camY - 6,
          20,
          dirAngle - 0.85,
          dirAngle + 0.85
        );
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(
          player.x - camX,
          player.y - camY - 6,
          16,
          dirAngle - 0.65,
          dirAngle + 0.65
        );
        ctx.stroke();
        ctx.restore();
      }
    } else if (actor.kind === 'COMPANION' && player.companion) {
      const cx = Math.round(player.companion.x - camX - 20);
      const cy = Math.round(player.companion.y - camY - 30);
      drawIllustratedAnimal(ctx, player.companion.species, cx, cy, 0.85, {
        facing: player.companion.facing,
        walkPhase: nowMs * 0.01,
        isMoving: Math.hypot(player.x - player.companion.x, player.y - player.companion.y) > 36,
        nowMs,
      });
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(cx + 20, cy + 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (actor.kind === 'WILDLIFE') {
      const w = actor.w;
      const wx = Math.round(w.x - camX - 20);
      const wy = Math.round(w.y - camY - 30);
      const isMoving = Math.hypot(w.vx, w.vy) > 4;
      drawIllustratedAnimal(ctx, w.species, wx, wy, 0.85, {
        facing: w.facing,
        walkPhase: nowMs * 0.01 + w.aiTimer,
        isMoving,
        isEating: w.isEating || w.behaviorState === 'GRAZE' || w.behaviorState === 'DRINK',
        hitFlash: nowMs < w.hitFlashUntil,
        nowMs,
      });

      if (w.hp < w.maxHp) {
        const ratio = w.hp / w.maxHp;
        ctx.fillStyle = 'rgba(13, 15, 16, 0.85)';
        ctx.beginPath();
        ctx.roundRect(wx + 8, wy + 2, 24, 4, 2);
        ctx.fill();
        ctx.fillStyle =
          w.tameEligible && ratio <= 0.45
            ? '#8FC79A'
            : w.temperament === 'AGGRESSIVE'
            ? '#D94A38'
            : '#E5B85A';
        ctx.beginPath();
        ctx.roundRect(wx + 9, wy + 3, Math.max(2, 22 * ratio), 2, 1);
        ctx.fill();
      } else if (w.tameEligible) {
        ctx.fillStyle = w.species === 'SPIRIT_DEER' ? '#7EC4E0' : '#FFD166';
        ctx.beginPath();
        ctx.arc(wx + 20, wy + 2 + Math.sin(nowMs * 0.006) * 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (actor.kind === 'MONSTER') {
      const mx = Math.round(actor.m.x - camX - 24);
      const my = Math.round(actor.m.y - camY - 34);
      drawIllustratedMonster(ctx, actor.m.type, mx, my, 1, {
        facing: actor.m.facing,
        walkPhase: nowMs * 0.005 + actor.m.patrolPhase,
        animState: 'WALK',
        nowMs,
      });

      ctx.fillStyle = 'rgba(13, 15, 16, 0.85)';
      ctx.beginPath();
      ctx.roundRect(mx + 10, my - 3, 28, 4, 2);
      ctx.fill();
      ctx.fillStyle = actor.m.type === 'DARK_CREATURE' ? '#9D6CE0' : '#B84A39';
      ctx.beginPath();
      ctx.roundRect(mx + 11, my - 2, Math.max(2, 26 * (actor.m.hp / actor.m.maxHp)), 2, 1);
      ctx.fill();
    }
  }

  // 4b. FOG OF WAR LAYER
  for (let ty = minTileY; ty <= maxTileY; ty++) {
    const sy = ty * TILE_SIZE - camY;
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const sx = tx * TILE_SIZE - camX;
      const visible = isTileVisible(tx, ty);
      if (visible) continue;
      const explored = isTileExplored(world, region.key, tx, ty);
      ctx.fillStyle = explored ? 'rgba(7, 9, 11, 0.58)' : '#070809';
      ctx.fillRect(sx, sy, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
    }
  }

  const pCenterX = player.x - camX;
  const pCenterY = player.y - camY;
  const edgeGrad = ctx.createRadialGradient(
    pCenterX,
    pCenterY,
    visibilityRadiusPx * 0.65,
    pCenterX,
    pCenterY,
    visibilityRadiusPx + 14
  );
  edgeGrad.addColorStop(0, 'rgba(7, 9, 11, 0)');
  edgeGrad.addColorStop(1, 'rgba(7, 9, 11, 0.42)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(
    pCenterX - visibilityRadiusPx - 24,
    pCenterY - visibilityRadiusPx - 24,
    (visibilityRadiusPx + 24) * 2,
    (visibilityRadiusPx + 24) * 2
  );

  // 5. BIOME WEATHER PARTICLES (Snow, Ash, Rain, Mist/Fireflies)
  renderBiomeWeather(ctx, region, camX, camY, viewW, viewH, player, visibilityRadiusPx, nowMs);

  // 6. DAY / NIGHT OVERLAY + TORCH LIGHT
  const timeInfo = getTimeOfDayInfo(world.gameTimeSeconds);
  const darkness =
    player.torchSecondsRemaining > 0
      ? Math.max(0, timeInfo.nightFactor - 0.3)
      : timeInfo.nightFactor;

  if (darkness > 0.02) {
    ctx.fillStyle = `rgba(9, 14, 22, ${darkness.toFixed(2)})`;
    ctx.fillRect(0, 0, viewW, viewH);

    const glowRadius = player.torchSecondsRemaining > 0 ? 156 : 96;
    const grad = ctx.createRadialGradient(pCenterX, pCenterY, 18, pCenterX, pCenterY, glowRadius);
    grad.addColorStop(0, 'rgba(229, 184, 90, 0.24)');
    grad.addColorStop(1, 'rgba(229, 184, 90, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(pCenterX - glowRadius, pCenterY - glowRadius, glowRadius * 2, glowRadius * 2);
  }

  // 7. FLOATING TEXTS
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (const ft of floatingTexts) {
    const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
    const sx = Math.round(ft.x - camX);
    const sy = Math.round(ft.y - camY - (1 - alpha) * 20);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#0D0F10';
    ctx.fillText(ft.text, sx + 1, sy + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, sx, sy);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderBiomeWeather(
  ctx: CanvasRenderingContext2D,
  region: RegionData,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  player: PlayerState,
  visibilityRadiusPx: number,
  nowMs: number
) {
  const weather = region.weather;
  const count = weather === 'SNOW' || weather === 'ASH' || weather === 'RAIN' ? 20 : 10;

  for (let i = 0; i < count; i++) {
    const seed = i * 173;
    let fx: number;
    let fy: number;
    if (weather === 'SNOW') {
      fx = ((nowMs * 0.012 + seed * 19 + Math.sin(nowMs * 0.002 + i) * 18) % (viewW + 20) + viewW) % viewW;
      fy = (nowMs * 0.025 + seed * 11) % viewH;
      if (Math.hypot(fx + camX - player.x, fy + camY - player.y) > visibilityRadiusPx) continue;
      ctx.fillStyle = 'rgba(240, 248, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(fx, fy, i % 3 === 0 ? 1.8 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (weather === 'ASH') {
      fx = ((Math.sin(nowMs * 0.001 + seed) * 20 + seed * 29) % viewW + viewW) % viewW;
      fy = (((nowMs * 0.02 + seed * 13) % (viewH + 20)) * -1 + viewH + 10) % viewH;
      if (Math.hypot(fx + camX - player.x, fy + camY - player.y) > visibilityRadiusPx) continue;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 115, 45, 0.65)' : 'rgba(180, 165, 160, 0.45)';
      ctx.fillRect(fx, fy, 2, 2);
    } else if (weather === 'RAIN') {
      fx = ((nowMs * 0.04 + seed * 17) % viewW + viewW) % viewW;
      fy = (nowMs * 0.12 + seed * 13) % viewH;
      if (Math.hypot(fx + camX - player.x, fy + camY - player.y) > visibilityRadiusPx) continue;
      ctx.strokeStyle = 'rgba(130, 210, 175, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - 2, fy + 6);
      ctx.stroke();
    } else {
      fx = ((Math.sin(nowMs * 0.00035 + seed) * 0.5 + 0.5) * viewW) | 0;
      fy = (((nowMs * 0.018 + seed * 13) % (viewH + 40)) * -1 + viewH + 20) | 0;
      if (Math.hypot(fx + camX - player.x, fy + camY - player.y) > visibilityRadiusPx) continue;
      ctx.fillStyle =
        weather === 'HEATWAVE'
          ? 'rgba(255, 200, 100, 0.3)'
          : i % 3 === 0
          ? 'rgba(126, 196, 224, 0.34)'
          : 'rgba(229, 184, 90, 0.42)';
      ctx.fillRect(fx, fy, 2, 2);
    }
  }
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  const len = 7;
  ctx.fillRect(x, y, len, 2);
  ctx.fillRect(x, y, 2, len);
  ctx.fillRect(x + w - len, y, len, 2);
  ctx.fillRect(x + w - 2, y, 2, len);
  ctx.fillRect(x, y + h - 2, len, 2);
  ctx.fillRect(x, y + h - len, 2, len);
  ctx.fillRect(x + w - len, y + h - 2, len, 2);
  ctx.fillRect(x + w - 2, y + h - len, 2, len);
}

function drawIllustratedGroundTile(
  ctx: CanvasRenderingContext2D,
  region: RegionData,
  tile: TileType,
  variant: number,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  h: number,
  nowMs: number
) {
  const biome = BIOME_CONFIGS[region.biomeId] ?? BIOME_CONFIGS.FORGOTTEN_FOREST;
  const pal = biome.palette;

  if (tile === 'CLIFF') {
    ctx.fillStyle = '#15191C';
    ctx.fillRect(sx - 1, sy - 1, TILE_SIZE + 2, TILE_SIZE + 2);
    ctx.fillStyle = pal.cliff;
    ctx.beginPath();
    ctx.ellipse(sx + 16, sy + 14, 15, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx + 13 + (variant % 3), sy + 9, 9, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F1214';
    ctx.fillRect(sx + 4, sy + 24, 24, 6);
    return;
  }

  if (tile === 'LAVA') {
    ctx.fillStyle = '#2B1B18';
    ctx.fillRect(sx - 1, sy - 1, TILE_SIZE + 2, TILE_SIZE + 2);
    const pulse = Math.sin(nowMs * 0.004 + tx + ty) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(229, 75, 25, ${pulse.toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4, 6);
    ctx.fill();
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.ellipse(sx + 16 + Math.sin(nowMs * 0.003 + tx) * 3, sy + 16, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (tile === 'WATER' || tile === 'ICE') {
    const isIce = tile === 'ICE';
    const isNLand = region.tiles[ty - 1]?.[tx] !== tile;
    const isSLand = region.tiles[ty + 1]?.[tx] !== tile;
    const isWLand = region.tiles[ty]?.[tx - 1] !== tile;
    const isELand = region.tiles[ty]?.[tx + 1] !== tile;

    ctx.fillStyle = pal.groundC;
    ctx.fillRect(sx - 1, sy - 1, TILE_SIZE + 2, TILE_SIZE + 2);

    const insetN = isNLand ? 4 : -2;
    const insetS = isSLand ? 4 : -2;
    const insetW = isWLand ? 4 : -2;
    const insetE = isELand ? 4 : -2;

    ctx.fillStyle = isIce ? '#6FAAC9' : pal.water;
    ctx.beginPath();
    ctx.roundRect(
      sx + insetW,
      sy + insetN,
      TILE_SIZE - insetW - insetE,
      TILE_SIZE - insetN - insetS,
      isNLand || isSLand || isWLand || isELand ? 7 : 0
    );
    ctx.fill();

    if (isIce) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + 9);
      ctx.lineTo(sx + 18, sy + 18);
      ctx.lineTo(sx + 24, sy + 12);
      ctx.stroke();
    } else {
      const wave = Math.sin(nowMs * 0.004 + tx * 0.9 + ty * 0.5) * 3;
      ctx.strokeStyle = 'rgba(185, 238, 255, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx + 7 + wave, sy + 12);
      ctx.quadraticCurveTo(sx + 12 + wave, sy + 10.5, sx + 17 + wave, sy + 12);
      ctx.moveTo(sx + 12 - wave, sy + 21);
      ctx.quadraticCurveTo(sx + 16 - wave, sy + 19.5, sx + 20 - wave, sy + 21);
      ctx.stroke();
    }
    return;
  }

  // Base terrain tile with soft organic overlapping ellipse blotches (no grid lines)
  const isSecondary =
    tile === 'FOREST_FLOOR' ||
    tile === 'TREE' ||
    tile === 'ROCK' ||
    tile === biome.secondaryTerrain;
  const baseCol =
    tile === 'TRAIL' || tile === 'ROAD'
      ? pal.path
      : tile === 'WOOD_FLOOR'
      ? '#6E5138'
      : tile === 'SAND'
      ? variant % 2 === 0
        ? '#C29A5B'
        : '#B58D4E'
      : tile === 'SNOW'
      ? variant % 2 === 0
        ? '#CBD8E4'
        : '#BDCDDC'
      : tile === 'ASH'
      ? variant % 2 === 0
        ? '#332C2B'
        : '#3E3432'
      : tile === 'SAVANNA_GRASS'
      ? variant % 2 === 0
        ? '#7B7D35'
        : '#8B873C'
      : tile === 'CLEARING'
      ? pal.groundB
      : isSecondary
      ? pal.groundC
      : variant % 2 === 0
      ? pal.groundA
      : pal.groundB;

  ctx.fillStyle = baseCol;
  ctx.fillRect(sx - 1, sy - 1, TILE_SIZE + 2, TILE_SIZE + 2);

  // Soft overlapping organic turf texture
  const ox = Math.floor((h * 11) % 6) - 3;
  const oy = Math.floor((h * 37) % 6) - 3;
  ctx.fillStyle = isSecondary ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.ellipse(sx + 16 + ox, sy + 16 + oy, 15, 11, h * Math.PI, 0, Math.PI * 2);
  ctx.fill();

  if (tile === 'WOOD_FLOOR') {
    ctx.strokeStyle = 'rgba(28, 18, 10, 0.5)';
    ctx.lineWidth = 1;
    for (let y = 8; y < 32; y += 8) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + y);
      ctx.lineTo(sx + TILE_SIZE, sy + y);
      ctx.stroke();
    }
    return;
  }

  if (tile === 'TRAIL' || tile === 'ROAD') {
    ctx.fillStyle = tile === 'ROAD' ? 'rgba(215, 195, 165, 0.25)' : 'rgba(70, 50, 32, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx + 16 + ox, sy + 16 + oy, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (h > 0.55) {
      ctx.fillStyle = 'rgba(130, 125, 115, 0.55)';
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 18, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (tile === 'RUIN_STONE') {
    ctx.fillStyle = '#383E45';
    ctx.beginPath();
    ctx.roundRect(sx + 3, sy + 4, 26, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#5D6670';
    ctx.beginPath();
    ctx.roundRect(sx + 5, sy + 5, 16, 13, 3);
    ctx.fill();
    ctx.fillStyle = '#2B5939';
    ctx.beginPath();
    ctx.ellipse(sx + 19, sy + 20, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Organic micro-clutter (flowers, pebbles, sand ripples, snow drifts)
  if (tile === 'SAND') {
    if (h < 0.35) {
      ctx.fillStyle = 'rgba(145, 105, 55, 0.32)';
      ctx.fillRect(sx + 7 + ox, sy + 15, 13, 1.5);
    }
    return;
  }
  if (tile === 'SNOW') {
    if (h < 0.35) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(sx + 14 + ox, sy + 16, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (h < 0.22) {
    ctx.fillStyle = 'rgba(60, 135, 78, 0.65)';
    ctx.fillRect(sx + 8 + ox, sy + 12, 2, 4);
    ctx.fillStyle = h < 0.1 ? '#E5B85A' : '#E0F2FE';
    ctx.beginPath();
    ctx.arc(sx + 10 + ox, sy + 11, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (h < 0.45) {
    ctx.fillStyle = 'rgba(135, 95, 55, 0.42)';
    ctx.beginPath();
    ctx.ellipse(sx + 18, sy + 19 + oy, 2.2, 1.3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIllustratedTree(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  resNode: ResourceNode | undefined,
  seed: number,
  nowMs: number
) {
  const sp = resNode?.treeSpecies ?? 'OAK';
  const depleted = resNode && resNode.remaining <= 0;
  const sway = Math.sin(nowMs * 0.002 + seed * 10) * 1.1;

  // Soft elliptical directional shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(sx + 18, sy + 26, 13, 5.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  const trunkColor =
    sp === 'BIRCH'
      ? '#DCD6C8'
      : sp === 'DEAD' || sp === 'CORRUPTED' || sp === 'CHARRED'
      ? '#2E292B'
      : sp === 'CACTUS'
      ? '#2E6E3E'
      : sp === 'ANCIENT'
      ? '#4B3324'
      : '#6B4C35';
  const trunkW = sp === 'ANCIENT' ? 9 : sp === 'YOUNG' || sp === 'BIRCH' ? 5 : 7;
  const trunkX = sx + Math.floor((TILE_SIZE - trunkW) / 2);

  if (sp === 'CACTUS') {
    if (depleted) {
      ctx.fillStyle = '#3B5E38';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 23, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.fillStyle = '#245932';
    ctx.beginPath();
    ctx.roundRect(sx + 12, sy + 5, 8, 23, 4);
    ctx.roundRect(sx + 6, sy + 11, 6, 8, 3);
    ctx.roundRect(sx + 20, sy + 9, 6, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#4B995C';
    ctx.fillRect(sx + 14, sy + 7, 2, 18);
    return;
  }

  // Trunk with subtle flared base
  ctx.fillStyle = trunkColor;
  ctx.beginPath();
  ctx.roundRect(trunkX, sy + 14, trunkW, 14, 2);
  ctx.fill();

  if (sp === 'BIRCH') {
    ctx.fillStyle = '#2B2D30';
    ctx.fillRect(trunkX, sy + 17, 3, 1);
    ctx.fillRect(trunkX + 2, sy + 22, 3, 1);
  }

  if (depleted) {
    // Walkable stump marker
    ctx.fillStyle = '#A68361';
    ctx.beginPath();
    ctx.ellipse(sx + 16, sy + 21, trunkW * 0.65, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (sp === 'ACACIA') {
    ctx.fillStyle = '#3B5E28';
    ctx.beginPath();
    ctx.ellipse(sx + 16 + sway, sy + 8, 17, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5D873A';
    ctx.beginPath();
    ctx.ellipse(sx + 15 + sway, sy + 6, 13, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (sp === 'SNOW_PINE' || sp === 'PINE') {
    const darkLeaf = sp === 'SNOW_PINE' ? '#1E3F4A' : '#123322';
    const midLeaf = sp === 'SNOW_PINE' ? '#2E5E6B' : '#1F4F35';
    ctx.fillStyle = darkLeaf;
    ctx.beginPath();
    ctx.moveTo(sx + 16 + sway, sy - 6);
    ctx.lineTo(sx + 29 + sway, sy + 18);
    ctx.lineTo(sx + 3 + sway, sy + 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = midLeaf;
    ctx.beginPath();
    ctx.moveTo(sx + 16 + sway, sy - 8);
    ctx.lineTo(sx + 25 + sway, sy + 9);
    ctx.lineTo(sx + 7 + sway, sy + 9);
    ctx.closePath();
    ctx.fill();

    if (sp === 'SNOW_PINE') {
      ctx.fillStyle = '#E6F2FA';
      ctx.beginPath();
      ctx.moveTo(sx + 16 + sway, sy - 8);
      ctx.lineTo(sx + 21 + sway, sy + 1);
      ctx.lineTo(sx + 11 + sway, sy + 1);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (sp === 'DEAD' || sp === 'CHARRED') {
    ctx.strokeStyle = sp === 'CHARRED' ? '#231D1D' : '#574E49';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 16);
    ctx.lineTo(sx + 8, sy + 6);
    ctx.moveTo(sx + 16, sy + 14);
    ctx.lineTo(sx + 25, sy + 5);
    ctx.stroke();
    if (sp === 'CHARRED') {
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.arc(sx + 15, sy + 17, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // Smooth layered illustrated canopy for OAK, YOUNG, BIRCH, ANCIENT, BUSH_TREE, FRUIT_TREE, CORRUPTED
  const baseCanopy =
    sp === 'CORRUPTED'
      ? '#2C1838'
      : sp === 'BIRCH'
      ? '#3E7A3E'
      : sp === 'ANCIENT'
      ? '#143624'
      : '#1A4028';
  const topCanopy =
    sp === 'CORRUPTED'
      ? '#502869'
      : sp === 'BIRCH'
      ? '#6EB358'
      : sp === 'ANCIENT'
      ? '#2B5C41'
      : '#2E6641';

  const rxSize = sp === 'ANCIENT' ? 16 : sp === 'YOUNG' ? 10 : 14;
  const rySize = sp === 'ANCIENT' ? 12 : sp === 'YOUNG' ? 8 : 10;

  ctx.fillStyle = baseCanopy;
  ctx.beginPath();
  ctx.ellipse(sx + 16 + sway, sy + 9, rxSize, rySize, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = topCanopy;
  ctx.beginPath();
  ctx.ellipse(sx + 14 + sway, sy + 5, rxSize * 0.78, rySize * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sp === 'FRUIT_TREE') {
    ctx.fillStyle = '#D94A38';
    ctx.beginPath();
    ctx.arc(sx + 10 + sway, sy + 8, 2.2, 0, Math.PI * 2);
    ctx.arc(sx + 21 + sway, sy + 7, 2.2, 0, Math.PI * 2);
    ctx.arc(sx + 16 + sway, sy + 13, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (sp === 'CORRUPTED') {
    ctx.fillStyle = '#9D6CE0';
    ctx.beginPath();
    ctx.arc(sx + 12 + sway, sy + 6, 2, 0, Math.PI * 2);
    ctx.arc(sx + 20 + sway, sy + 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIllustratedRock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  resNode: ResourceNode | undefined,
  seed: number
) {
  const sp = resNode?.mineralSpecies ?? 'STONE';
  const depleted = resNode && resNode.remaining <= 0;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + 17, sy + 24, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (depleted) {
    // Low rubble visual (walkable!)
    ctx.fillStyle = '#40464C';
    ctx.beginPath();
    ctx.ellipse(sx + 13, sy + 21, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(sx + 20, sy + 22, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const baseColor =
    sp === 'OBSIDIAN'
      ? '#21182E'
      : sp === 'ICE_CRYSTAL'
      ? '#5EAED4'
      : sp === 'COAL'
      ? '#25292E'
      : '#4F575F';
  const highlight =
    sp === 'OBSIDIAN'
      ? '#4A316B'
      : sp === 'ICE_CRYSTAL'
      ? '#BCEFFF'
      : sp === 'COAL'
      ? '#3B4047'
      : '#7A858F';

  const rScale = seed > 0.5 ? 1.08 : 0.94;
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(sx + 5, sy + 22);
  ctx.lineTo(sx + 8, sy + 10 * rScale);
  ctx.lineTo(sx + 17, sy + 7 * rScale);
  ctx.lineTo(sx + 26, sy + 12);
  ctx.lineTo(sx + 27, sy + 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(sx + 14, sy + 13, 6, 3.5, -0.25, 0, Math.PI * 2);
  ctx.fill();

  if (sp === 'IRON') {
    ctx.fillStyle = '#C97549';
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 16, 2.5, 0, Math.PI * 2);
    ctx.arc(sx + 20, sy + 14, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (sp === 'GOLD') {
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 15, 2.6, 0, Math.PI * 2);
    ctx.arc(sx + 20, sy + 13, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (sp === 'COPPER') {
    ctx.fillStyle = '#D97C4E';
    ctx.beginPath();
    ctx.arc(sx + 15, sy + 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sp === 'OBSIDIAN') {
    ctx.fillStyle = '#9D6CE0';
    ctx.beginPath();
    ctx.arc(sx + 17, sy + 15, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIllustratedPlant(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  resNode: ResourceNode | undefined,
  seed: number
) {
  const sp = resNode?.plantSpecies ?? 'BERRY_BUSH';
  const depleted = resNode && resNode.remaining <= 0;

  if (depleted) {
    ctx.fillStyle = 'rgba(42, 65, 45, 0.65)';
    ctx.beginPath();
    ctx.ellipse(sx + 16, sy + 21, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const ox = seed > 0.5 ? 1 : -1;
  switch (sp) {
    case 'FROST_BLOOM':
      ctx.fillStyle = '#4888A8';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 18, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#B8F2FF';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 13, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'DESERT_HERB':
      ctx.fillStyle = '#5B8042';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 19, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E5B85A';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ASH_FERN':
      ctx.fillStyle = '#52403C';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 19, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF7B3B';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 15, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'WILD_GRASS':
      ctx.strokeStyle = '#38854F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 11 + ox, sy + 24);
      ctx.quadraticCurveTo(sx + 9 + ox, sy + 17, sx + 8 + ox, sy + 14);
      ctx.moveTo(sx + 16, sy + 24);
      ctx.quadraticCurveTo(sx + 15, sy + 16, sx + 17, sy + 10);
      ctx.moveTo(sx + 21 - ox, sy + 24);
      ctx.quadraticCurveTo(sx + 23 - ox, sy + 17, sx + 24 - ox, sy + 13);
      ctx.stroke();
      break;
    case 'MEDICINAL_HERB':
      ctx.fillStyle = '#25693E';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 18, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C8F7D6';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 12, 2.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'WILD_VEGETABLE':
      ctx.fillStyle = '#2E6E3E';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 13, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E08832';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 19, 4.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'MUSHROOM':
      ctx.fillStyle = '#DCD6C8';
      ctx.beginPath();
      ctx.roundRect(sx + 14, sy + 17, 4, 7, 1.5);
      ctx.fill();
      ctx.fillStyle = '#B84232';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 15, 6.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF3D6';
      ctx.beginPath();
      ctx.arc(sx + 13, sy + 14.5, 1.1, 0, Math.PI * 2);
      ctx.arc(sx + 19, sy + 15.2, 1.0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'SPECIAL_PLANT':
      ctx.fillStyle = '#1E4F5E';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 18, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7EC4E0';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 13, 4.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.fillStyle = '#244A32';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 17, 9, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C83B3D';
      ctx.beginPath();
      ctx.arc(sx + 11, sy + 16, 2, 0, Math.PI * 2);
      ctx.arc(sx + 20, sy + 14, 2, 0, Math.PI * 2);
      ctx.arc(sx + 16, sy + 20, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: PlayerState,
  world: WorldState,
  region: RegionData,
  visibilityRadiusPx: number
) {
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#070809';
  ctx.fillRect(0, 0, width, height);

  const cellX = width / REGION_WIDTH;
  const cellY = height / REGION_HEIGHT;

  for (let ty = 0; ty < REGION_HEIGHT; ty++) {
    for (let tx = 0; tx < REGION_WIDTH; tx++) {
      const wx = tx * TILE_SIZE + TILE_SIZE / 2;
      const wy = ty * TILE_SIZE + TILE_SIZE / 2;
      const visible = isWorldPointVisible(player.x, player.y, wx, wy, visibilityRadiusPx);
      const explored = visible || isTileExplored(world, region.key, tx, ty);
      if (!explored) continue;

      const tile = region.tiles[ty][tx];
      if (tile === 'CLIFF') ctx.fillStyle = '#2E343A';
      else if (tile === 'TRAIL' || tile === 'ROAD') ctx.fillStyle = '#857054';
      else if (tile === 'WOOD_FLOOR') ctx.fillStyle = '#6B4C35';
      else if (tile === 'WATER') ctx.fillStyle = '#367594';
      else if (tile === 'ICE') ctx.fillStyle = '#7FB7D9';
      else if (tile === 'LAVA') ctx.fillStyle = '#D9531E';
      else if (tile === 'SAND') ctx.fillStyle = '#B89254';
      else if (tile === 'SNOW') ctx.fillStyle = '#BDCAD6';
      else if (tile === 'ASH') ctx.fillStyle = '#38302E';
      else if (tile === 'SAVANNA_GRASS') ctx.fillStyle = '#7D7E38';
      else if (tile === 'TREE') ctx.fillStyle = '#1E452E';
      else if (tile === 'ROCK' || tile === 'RUIN_STONE') ctx.fillStyle = '#75808A';
      else if (tile === 'PLANT') ctx.fillStyle = '#4B7D44';
      else if (tile === 'CLEARING') ctx.fillStyle = '#3C3429';
      else ctx.fillStyle = '#182E20';

      ctx.fillRect(
        Math.floor(tx * cellX),
        Math.floor(ty * cellY),
        Math.ceil(cellX),
        Math.ceil(cellY)
      );

      if (!visible) {
        ctx.fillStyle = 'rgba(7, 9, 11, 0.55)';
        ctx.fillRect(
          Math.floor(tx * cellX),
          Math.floor(ty * cellY),
          Math.ceil(cellX),
          Math.ceil(cellY)
        );
      }
    }
  }

  // Discovered Landmarks (clean circular markers)
  const landmarks = world.discoveredLandmarksByRegion?.[region.key] ?? [];
  for (const lm of landmarks) {
    const mx = lm.tileX * cellX;
    const my = lm.tileY * cellY;
    if (lm.kind === 'EXIT') {
      ctx.fillStyle = '#E5B85A';
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (
      lm.kind === 'MERCHANT' ||
      lm.kind === 'BLACKSMITH' ||
      lm.kind === 'ALCHEMIST' ||
      lm.kind === 'RARE_TRADER' ||
      lm.kind === 'TOWN'
    ) {
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (lm.kind === 'DUNGEON' || lm.kind === 'CAVE' || lm.kind === 'BOSS') {
      ctx.fillStyle = '#D94A38';
      ctx.beginPath();
      ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (lm.kind === 'GOLD_VEIN') {
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (lm.kind === 'RUINS') {
      ctx.fillStyle = '#B0B8C2';
      ctx.beginPath();
      ctx.arc(mx, my, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const w of region.wildlife) {
    if (w.defeated || w.tamed) continue;
    if (!isWorldPointVisible(player.x, player.y, w.x, w.y, visibilityRadiusPx)) continue;
    const mx = (w.x / TILE_SIZE) * cellX;
    const my = (w.y / TILE_SIZE) * cellY;
    ctx.fillStyle = w.tameEligible ? '#FFD166' : w.temperament === 'AGGRESSIVE' ? '#FF7B54' : '#9FD6B0';
    ctx.beginPath();
    ctx.arc(mx, my, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const m of region.monsters) {
    if (m.defeated) continue;
    if (!isWorldPointVisible(player.x, player.y, m.x, m.y, visibilityRadiusPx)) continue;
    const mx = (m.x / TILE_SIZE) * cellX;
    const my = (m.y / TILE_SIZE) * cellY;
    ctx.fillStyle = m.type === 'DARK_CREATURE' ? '#9D6CE0' : '#D94A38';
    ctx.beginPath();
    ctx.arc(mx, my, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const px = (player.x / TILE_SIZE) * cellX;
  const py = (player.y / TILE_SIZE) * cellY;
  const vr = Math.round((visibilityRadiusPx / TILE_SIZE) * cellX);
  ctx.strokeStyle = 'rgba(245, 230, 196, 0.24)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, vr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#F5E6C4';
  ctx.beginPath();
  ctx.arc(px, py, 2.5, 0, Math.PI * 2);
  ctx.fill();
}
