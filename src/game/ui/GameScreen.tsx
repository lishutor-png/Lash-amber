import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sword,
  Hand,
  Backpack,
  User,
  Pause,
  Volume2,
  VolumeX,
  Droplets,
  RotateCw,
  Fish,
  Map as MapIcon,
  Coins,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import {
  createAnimalCombatMonster,
  performClassSkill,
  performCompanionAction,
  performEnemyTurn,
  performHeavyAttack,
  performPlayerDefend,
  performPlayerDodge,
  performPlayerEscape,
  performPlayerUseItem,
  performQuickAttack,
  performTameAttempt,
  startCombat,
} from '../combat/combatSystem';
import { LOOT_RARITY_COLORS, rollAnimalHuntLoot } from '../combat/lootSystem';
import {
  activateCompanion,
  deactivateCompanion,
  releaseCompanion,
  renameCompanion,
} from '../companion/companionSystem';
import { soundEngine } from '../core/audio';
import {
  CombatState,
  FloatingText,
  GameSettings,
  GroundLootItem,
  ItemId,
  MerchantEntity,
  PlayerState,
  ResourceNode,
  SaveSlotRecord,
  WildlifeEntity,
  WorldState,
} from '../core/types';
import { FishCatchResult, WaterSpotType } from '../fishing/fishingSystem';
import { ITEMS } from '../inventory/items';
import {
  CAMERA_ZOOM_SCALES,
  renderMinimap,
  renderWorld,
} from '../renderer/worldRenderer';
import {
  clearNewlyAcquiredItem,
  craftItem,
  drinkFromContainer,
  drinkFromWater,
  dropInventoryItem,
  equipInventoryItem,
  fillWaterContainer,
  gatherFromNode,
  getHazardWarningInfo,
  getTimeOfDayInfo,
  grantInventoryItem,
  normalizePlayerState,
  normalizeWorldState,
  recalculatePlayerStats,
  tickSurvival,
  unequipSlot,
  useItemInExploration,
} from '../survival/survivalSystem';
import {
  REGION_HEIGHT,
  REGION_SPAWN_X,
  REGION_SPAWN_Y,
  REGION_WIDTH,
  TILE_SIZE,
  WorldRegionManager,
  applyNightEscalationToRegion,
  getMineralLabel,
  getPlantLabel,
  getTreeLabel,
  getVisibilityRadiusPx,
  revealFogAroundPlayer,
} from '../world/worldGenerator';
import { CombatOverlay } from './CombatOverlay';
import { DeathModal } from './DeathModal';
import { FishingModal } from './FishingModal';
import { InventoryModal } from './InventoryModal';
import { MerchantModal } from './MerchantModal';
import { PauseSaveModal } from './PauseSaveModal';
import { CharacterPortrait } from './PixelPortrait';
import { StatusModal } from './StatusModal';
import { VirtualJoystick } from './VirtualJoystick';
import { WorldMapModal } from './WorldMapModal';

interface GameScreenProps {
  initialPlayer: PlayerState;
  initialWorld: WorldState;
  activeSlotIndex: 1 | 2 | 3;
  saveSlots: SaveSlotRecord[];
  settings: GameSettings;
  onToggleSfx: () => void;
  onSaveToSlot: (
    slotIndex: 1 | 2 | 3,
    player: PlayerState,
    world: WorldState
  ) => Promise<void>;
  onLoadLastSave: () => void;
  onNewGame: () => void;
  onQuitToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  initialPlayer,
  initialWorld,
  activeSlotIndex,
  saveSlots,
  settings,
  onToggleSfx,
  onSaveToSlot,
  onLoadLastSave,
  onNewGame,
  onQuitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  const playerRef = useRef<PlayerState>(
    normalizePlayerState(JSON.parse(JSON.stringify(initialPlayer)) as PlayerState)
  );
  const worldRef = useRef<WorldState>(
    normalizeWorldState(JSON.parse(JSON.stringify(initialWorld)) as WorldState)
  );
  const regionManagerRef = useRef<WorldRegionManager>(new WorldRegionManager());
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextFloatingIdRef = useRef(1);
  const nearestResourceRef = useRef<ResourceNode | null>(null);
  const nearWaterRef = useRef<{ tileX: number; tileY: number } | null>(null);
  const nearestWildlifeRef = useRef<WildlifeEntity | null>(null);
  const nearestMerchantRef = useRef<MerchantEntity | null>(null);
  const nearestGroundLootRef = useRef<GroundLootItem | null>(null);
  const escapeCooldownRef = useRef<number>(0);
  const regionCooldownRef = useRef<number>(0);
  const stepSoundTimerRef = useRef<number>(0);

  const keysHeldRef = useRef<Set<string>>(new Set());
  const joystickVecRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const cameraPosRef = useRef<{
    x: number;
    y: number;
    initialized: boolean;
    regionKey: string;
  }>({
    x: initialPlayer.x,
    y: initialPlayer.y,
    initialized: false,
    regionKey: '',
  });
  const lastFogTileRef = useRef<{ regionKey: string; tx: number; ty: number; hasTorch: boolean }>({
    regionKey: '',
    tx: -1,
    ty: -1,
    hasTorch: false,
  });

  const [hudTick, setHudTick] = useState(0);
  const [contextHint, setContextHint] = useState<string | null>(null);
  const [regionBanner, setRegionBanner] = useState<string | null>(null);
  const [hazardAlert, setHazardAlert] = useState<{
    label: string;
    mitigated: boolean;
    advice: string;
  } | null>(null);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'INVENTORY' | 'STATUS' | 'PAUSE' | 'FISHING' | 'WORLD_MAP'
  >('NONE');
  const [activeMerchant, setActiveMerchant] = useState<MerchantEntity | null>(null);
  const [inventoryMsg, setInventoryMsg] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [deathCause, setDeathCause] = useState<
    'COMBAT' | 'STARVATION' | 'DEHYDRATION' | 'ENVIRONMENT' | null
  >(null);

  const isPausedRef = useRef(false);
  isPausedRef.current =
    activeModal !== 'NONE' ||
    activeMerchant !== null ||
    combatState !== null ||
    deathCause !== null ||
    isMobilePortrait;

  // Attempt landscape orientation lock & track mobile portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobilePortrait(w < h && w < 700);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    try {
      const orient = window.screen?.orientation as ScreenOrientation & {
        lock?: (mode: string) => Promise<void>;
      };
      if (orient && typeof orient.lock === 'function') {
        orient.lock('landscape').catch(() => {});
      }
    } catch {
      // Orientation lock not permitted outside fullscreen on desktop browsers
    }

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const pushFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: nextFloatingIdRef.current++,
      x,
      y,
      text,
      color,
      life: 1.25,
      maxLife: 1.25,
    });
  }, []);

  const showRegionNotice = useCallback((name: string) => {
    setRegionBanner(name);
    window.setTimeout(() => {
      setRegionBanner((curr) => (curr === name ? null : curr));
    }, 2600);
  }, []);

  useEffect(() => {
    regionManagerRef.current.clear();
    const { region } = regionManagerRef.current.loadRegion(
      worldRef.current,
      worldRef.current.currentRegionX,
      worldRef.current.currentRegionY
    );
    const player = playerRef.current;
    const visPx = getVisibilityRadiusPx(player.torchSecondsRemaining);
    revealFogAroundPlayer(worldRef.current, region, player.x, player.y, visPx);
    cameraPosRef.current = {
      x: player.x,
      y: player.y,
      initialized: true,
      regionKey: region.key,
    };
    worldRef.current.biomeName = region.name;
    showRegionNotice(region.name);
    setHudTick((t) => t + 1);
  }, [showRegionNotice]);

  const handleDrinkOrFillWater = useCallback(
    (mode: 'DRINK' | 'FILL') => {
      if (isPausedRef.current) return;
      const waterTile = nearWaterRef.current;
      if (!waterTile) {
        if (mode === 'DRINK') {
          const res = drinkFromContainer(playerRef.current);
          soundEngine.playGather('WATER');
          pushFloatingText(
            playerRef.current.x,
            playerRef.current.y - 24,
            res.message,
            res.success ? '#7EC4E0' : '#E5989B'
          );
          setHudTick((t) => t + 1);
        }
        return;
      }

      const res =
        mode === 'FILL'
          ? fillWaterContainer(playerRef.current)
          : drinkFromWater(playerRef.current);

      soundEngine.playGather('WATER');
      pushFloatingText(
        waterTile.tileX * TILE_SIZE + TILE_SIZE / 2,
        waterTile.tileY * TILE_SIZE,
        res.message,
        res.success ? '#7EC4E0' : '#E5989B'
      );
      setHudTick((t) => t + 1);
    },
    [pushFloatingText]
  );

  const handleOpenFishing = useCallback(() => {
    if (isPausedRef.current) return;
    if (!nearWaterRef.current) return;
    const player = playerRef.current;
    if (!player.hasFishingRod) {
      soundEngine.playClick();
      pushFloatingText(
        player.x,
        player.y - 24,
        'Buat Pancingan Dasar di Meja Racik > Alat!',
        '#E5989B'
      );
      return;
    }
    soundEngine.playClick();
    setActiveModal('FISHING');
  }, [pushFloatingText]);

  const handleGatherOrInteract = useCallback(() => {
    if (isPausedRef.current) return;
    const player = playerRef.current;
    const world = worldRef.current;
    const region = regionManagerRef.current.getCurrentRegion(world);

    // Priority 1: Pick up dropped Ground Loot item
    const nearbyLoot = nearestGroundLootRef.current;
    if (nearbyLoot) {
      grantInventoryItem(player, nearbyLoot.itemId, nearbyLoot.quantity);
      regionManagerRef.current.removeGroundLoot(world, region, nearbyLoot.id);
      nearestGroundLootRef.current = null;
      soundEngine.playVictory();
      pushFloatingText(
        nearbyLoot.x,
        nearbyLoot.y - 18,
        `+${nearbyLoot.quantity} ${ITEMS[nearbyLoot.itemId].name}`,
        LOOT_RARITY_COLORS[nearbyLoot.rarity]
      );
      setHudTick((t) => t + 1);
      return;
    }

    // Priority 2: Talk / Trade with nearby Merchant NPC
    const nearbyMerchant = nearestMerchantRef.current;
    if (nearbyMerchant) {
      soundEngine.playClick();
      keysHeldRef.current.clear();
      joystickVecRef.current = { vx: 0, vy: 0 };
      setActiveMerchant(nearbyMerchant);
      return;
    }

    // Priority 2: Resource Node (Tree, Mineral, Plant)
    const node = nearestResourceRef.current;
    if (node) {
      const res = gatherFromNode(player, world, node);
      if (res.success) {
        soundEngine.playGather(node.kind);
        pushFloatingText(
          node.tileX * TILE_SIZE + TILE_SIZE / 2,
          node.tileY * TILE_SIZE,
          res.message,
          '#E5B85A'
        );
      } else {
        soundEngine.playClick();
        pushFloatingText(player.x, player.y - 24, res.message, '#E5989B');
      }
      setHudTick((t) => t + 1);
      return;
    }

    // Priority 3: Water shoreline (drink + auto top up waterskin if needed)
    if (nearWaterRef.current) {
      const res =
        player.thirst < 85
          ? drinkFromWater(player)
          : fillWaterContainer(player);
      soundEngine.playGather('WATER');
      pushFloatingText(
        nearWaterRef.current.tileX * TILE_SIZE + TILE_SIZE / 2,
        nearWaterRef.current.tileY * TILE_SIZE,
        res.message,
        '#7EC4E0'
      );
      setHudTick((t) => t + 1);
      return;
    }

    // Priority 4: Tameable wildlife -> enter turn-based combat so player can weaken <= 45% HP and feed
    const nearbyAnimal = nearestWildlifeRef.current;
    if (nearbyAnimal && nearbyAnimal.tameEligible) {
      soundEngine.playEncounter();
      keysHeldRef.current.clear();
      joystickVecRef.current = { vx: 0, vy: 0 };
      setCombatState(startCombat(player, createAnimalCombatMonster(nearbyAnimal)));
      return;
    }

    pushFloatingText(
      player.x,
      player.y - 24,
      'Dekati pohon, batu, tanaman, air, atau satwa liar',
      '#B8B2A6'
    );
  }, [pushFloatingText]);

  const handleAttackAction = useCallback(() => {
    if (isPausedRef.current) return;
    const player = playerRef.current;
    const world = worldRef.current;
    const region = regionManagerRef.current.getCurrentRegion(world);

    const swingNow = performance.now();
    player.worldAttackStartedAt = swingNow;
    player.worldAttackUntil = swingNow + 260;

    // 1. Check nearby Monster (Skeleton, Slime, Goblin, Wolf, Dark Creature)
    const nearbyMonster = regionManagerRef.current.findNearestMonster(
      region,
      player.x,
      player.y,
      58
    );
    if (nearbyMonster) {
      soundEngine.playEncounter();
      setCombatState(startCombat(player, nearbyMonster));
      return;
    }

    // 2. Check nearby Wildlife (tameable/aggressive species enter turn-based combat; small prey hunted directly)
    const nearbyAnimal = regionManagerRef.current.findNearestWildlife(
      region,
      player.x,
      player.y,
      68
    );
    if (nearbyAnimal) {
      if (nearbyAnimal.temperament === 'AGGRESSIVE' || nearbyAnimal.tameEligible) {
        soundEngine.playEncounter();
        setCombatState(startCombat(player, createAnimalCombatMonster(nearbyAnimal)));
        return;
      }

      // Direct hunting blow for small flee prey (Rabbit / Bird)
      soundEngine.playAttack();
      const huntDmg = Math.max(
        6,
        Math.round(player.attack * 0.8 + (player.weaponDamage ?? 4))
      );
      nearbyAnimal.hp = Math.max(0, nearbyAnimal.hp - huntDmg);
      nearbyAnimal.hitFlashUntil = Date.now() + 180;
      nearbyAnimal.isEating = false;

      // Push flee impulse away from player
      const dx = nearbyAnimal.x - player.x;
      const dy = nearbyAnimal.y - player.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      nearbyAnimal.vx = (dx / d) * nearbyAnimal.speed * 1.65;
      nearbyAnimal.vy = (dy / d) * nearbyAnimal.speed * 1.65;
      nearbyAnimal.aiTimer = 1.6;

      if (nearbyAnimal.hp <= 0) {
        nearbyAnimal.defeated = true;
        world.defeatedAnimals[nearbyAnimal.id] = true;
        player.animalsHunted = (player.animalsHunted ?? 0) + 1;

        const drops = rollAnimalHuntLoot(nearbyAnimal.species, player);
        drops.forEach((dr, idx) => {
          regionManagerRef.current.addGroundLoot(world, region, {
            id: `loot_${Date.now()}_${idx}_${Math.floor(Math.random() * 999)}`,
            itemId: dr.itemId,
            quantity: dr.quantity,
            rarity: dr.rarity,
            x: nearbyAnimal.x + (idx === 0 ? -8 : 10),
            y: nearbyAnimal.y + (idx === 1 ? 6 : -4),
            spawnedAt: Date.now(),
          });
        });

        soundEngine.playVictory();
        pushFloatingText(
          nearbyAnimal.x,
          nearbyAnimal.y - 16,
          `${nearbyAnimal.name} tumbang — pungut rampasan!`,
          '#E5B85A'
        );
      } else {
        pushFloatingText(
          nearbyAnimal.x,
          nearbyAnimal.y - 16,
          `-${huntDmg} HP`,
          '#F5E6C4'
        );
      }
      setHudTick((t) => t + 1);
      return;
    }

    // 3. Fallback to gathering/pickup if standing right next to loot or resource node
    if (nearestGroundLootRef.current || nearestResourceRef.current) {
      handleGatherOrInteract();
      return;
    }

    soundEngine.playAttack();
    pushFloatingText(
      player.x,
      player.y - 22,
      'Tidak ada target di jangkauan',
      '#9BA3AB'
    );
  }, [handleGatherOrInteract, pushFloatingText]);

  const handleSkillExploreAction = useCallback(() => {
    if (isPausedRef.current) return;
    const player = playerRef.current;
    const world = worldRef.current;
    const region = regionManagerRef.current.getCurrentRegion(world);
    const clsInfo = CHARACTER_CLASSES[player.classId];
    const leadSkill = clsInfo.skills[0];

    const swingNow = performance.now();
    player.worldAttackStartedAt = swingNow;
    player.worldAttackUntil = swingNow + 320;
    soundEngine.playSkill(leadSkill?.element ?? 'PHYSICAL');

    const nearbyMonster = regionManagerRef.current.findNearestMonster(
      region,
      player.x,
      player.y,
      78
    );
    if (nearbyMonster) {
      setCombatState(startCombat(player, nearbyMonster));
      return;
    }

    const nearbyAnimal = regionManagerRef.current.findNearestWildlife(
      region,
      player.x,
      player.y,
      86
    );
    if (nearbyAnimal) {
      if (nearbyAnimal.temperament === 'AGGRESSIVE' || nearbyAnimal.tameEligible) {
        setCombatState(startCombat(player, createAnimalCombatMonster(nearbyAnimal)));
        return;
      }

      const spentMana = player.mana >= 4;
      if (spentMana) {
        player.mana = Math.max(0, player.mana - 4);
      }
      const skillDmg = Math.max(
        8,
        Math.round((player.attack + (player.weaponDamage ?? 4)) * (spentMana ? 1.25 : 0.9))
      );
      nearbyAnimal.hp = Math.max(0, nearbyAnimal.hp - skillDmg);
      nearbyAnimal.hitFlashUntil = Date.now() + 200;
      nearbyAnimal.isEating = false;
      if (nearbyAnimal.hp <= 0) {
        nearbyAnimal.defeated = true;
        world.defeatedAnimals[nearbyAnimal.id] = true;
        player.animalsHunted = (player.animalsHunted ?? 0) + 1;
        const drops = rollAnimalHuntLoot(nearbyAnimal.species, player);
        drops.forEach((dr, idx) => {
          regionManagerRef.current.addGroundLoot(world, region, {
            id: `loot_${Date.now()}_${idx}_${Math.floor(Math.random() * 999)}`,
            itemId: dr.itemId,
            quantity: dr.quantity,
            rarity: dr.rarity,
            x: nearbyAnimal.x + (idx === 0 ? -8 : 10),
            y: nearbyAnimal.y + (idx === 1 ? 6 : -4),
            spawnedAt: Date.now(),
          });
        });
        soundEngine.playVictory();
        pushFloatingText(
          nearbyAnimal.x,
          nearbyAnimal.y - 18,
          `${leadSkill?.name ?? 'Jurus'}: ${nearbyAnimal.name} tumbang!`,
          '#FFD166'
        );
      } else {
        pushFloatingText(
          nearbyAnimal.x,
          nearbyAnimal.y - 18,
          `-${skillDmg} (${leadSkill?.name ?? 'Jurus'})`,
          '#B388FF'
        );
      }
      setHudTick((t) => t + 1);
      return;
    }

    pushFloatingText(
      player.x,
      player.y - 24,
      leadSkill ? `Jurus ${leadSkill.name}` : 'Ayunan Jurus',
      '#B388FF'
    );
  }, [pushFloatingText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      keysHeldRef.current.add(code);
      if (e.repeat) return;

      if (code === 'Escape') {
        if (combatState) return;
        setActiveModal((prev) => (prev === 'NONE' ? 'PAUSE' : 'NONE'));
        soundEngine.playClick();
      } else if (code === 'KeyI' && !combatState && !deathCause) {
        setInventoryMsg(null);
        setActiveModal((prev) => (prev === 'INVENTORY' ? 'NONE' : 'INVENTORY'));
        soundEngine.playClick();
      } else if (code === 'KeyC' && !combatState && !deathCause) {
        setActiveModal((prev) => (prev === 'STATUS' ? 'NONE' : 'STATUS'));
        soundEngine.playClick();
      } else if (code === 'KeyM' && !combatState && !deathCause) {
        setActiveModal((prev) => (prev === 'WORLD_MAP' ? 'NONE' : 'WORLD_MAP'));
        soundEngine.playClick();
      } else if ((code === 'KeyF' || code === 'KeyE') && !isPausedRef.current) {
        handleGatherOrInteract();
      } else if (code === 'Space' && !isPausedRef.current) {
        handleAttackAction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => keysHeldRef.current.delete(e.code);
    const onBlur = () => {
      keysHeldRef.current.clear();
      joystickVecRef.current = { vx: 0, vy: 0 };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [combatState, deathCause, handleAttackAction, handleGatherOrInteract]);

  useEffect(() => {
    if (!combatState || combatState.turn !== 'ENEMY') return;
    const timer = window.setTimeout(() => {
      soundEngine.playEnemyHit();
      setCombatState((prev) => {
        if (!prev || prev.turn !== 'ENEMY') return prev;
        const next = performEnemyTurn(prev, playerRef.current, worldRef.current);
        if (next.turn === 'VICTORY') {
          soundEngine.playVictory();
          regionManagerRef.current.markMonsterDefeated(next.enemy.id);
          onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
        } else if (next.turn === 'DEFEAT') {
          soundEngine.playDefeat();
        }
        return next;
      });
      setHudTick((t) => t + 1);
    }, 680);
    return () => window.clearTimeout(timer);
  }, [activeSlotIndex, combatState, onSaveToSlot]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!deathCause && playerRef.current.hp > 0) {
        onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
      }
    }, 35000);
    return () => window.clearInterval(interval);
  }, [activeSlotIndex, deathCause, onSaveToSlot]);

  // Main 60fps simulation & Canvas loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudAccumulator = 0;

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const canvas = canvasRef.current;
      const player = playerRef.current;
      const world = worldRef.current;
      let region = regionManagerRef.current.getCurrentRegion(world);

      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          const targetW = parent.clientWidth;
          const targetH = parent.clientHeight;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
        }

        if (!isPausedRef.current) {
          if (escapeCooldownRef.current > 0) {
            escapeCooldownRef.current = Math.max(0, escapeCooldownRef.current - dt);
          }
          if (regionCooldownRef.current > 0) {
            regionCooldownRef.current = Math.max(0, regionCooldownRef.current - dt);
          }

          let moveX = joystickVecRef.current.vx;
          let moveY = joystickVecRef.current.vy;
          const held = keysHeldRef.current;
          if (held.has('KeyW') || held.has('ArrowUp')) moveY -= 1;
          if (held.has('KeyS') || held.has('ArrowDown')) moveY += 1;
          if (held.has('KeyA') || held.has('ArrowLeft')) moveX -= 1;
          if (held.has('KeyD') || held.has('ArrowRight')) moveX += 1;

          const mag = Math.hypot(moveX, moveY);
          if (mag > 0.08) {
            const nx = moveX / Math.max(1, mag);
            const ny = moveY / Math.max(1, mag);
            const speedPenalty = player.hunger <= 15 || player.thirst <= 15 ? 0.78 : 1;
            const moveSpeed = (112 + player.speed * 2.4) * speedPenalty;

            const stepX = nx * moveSpeed * dt;
            const stepY = ny * moveSpeed * dt;

            let moved = false;
            if (regionManagerRef.current.isPositionWalkable(region, player.x + stepX, player.y)) {
              player.x += stepX;
              moved = true;
            }
            if (regionManagerRef.current.isPositionWalkable(region, player.x, player.y + stepY)) {
              player.y += stepY;
              moved = true;
            }

            player.isMoving = moved;
            if (Math.abs(nx) > Math.abs(ny)) {
              player.facing = nx > 0 ? 'right' : 'left';
            } else {
              player.facing = ny > 0 ? 'down' : 'up';
            }

            if (moved) {
              player.animTime += dt;
              stepSoundTimerRef.current += dt;
              if (stepSoundTimerRef.current >= 0.32) {
                stepSoundTimerRef.current = 0;
                soundEngine.playStep();
              }

              // Check Region Exits
              if (regionCooldownRef.current <= 0) {
                const exit = regionManagerRef.current.checkRegionExit(
                  region,
                  player.x,
                  player.y
                );
                if (exit) {
                  world.currentRegionX = exit.targetRX;
                  world.currentRegionY = exit.targetRY;
                  const loaded = regionManagerRef.current.loadRegion(
                    world,
                    exit.targetRX,
                    exit.targetRY
                  );
                  region = loaded.region;
                  world.biomeName = region.name;

                  if (exit.direction === 'NORTH') {
                    player.x = 20 * TILE_SIZE;
                    player.y = (REGION_HEIGHT - 2.5) * TILE_SIZE;
                  } else if (exit.direction === 'SOUTH') {
                    player.x = 20 * TILE_SIZE;
                    player.y = 2.5 * TILE_SIZE;
                  } else if (exit.direction === 'WEST') {
                    player.x = (REGION_WIDTH - 2.5) * TILE_SIZE;
                    player.y = 15 * TILE_SIZE;
                  } else if (exit.direction === 'EAST') {
                    player.x = 2.5 * TILE_SIZE;
                    player.y = 15 * TILE_SIZE;
                  }

                  if (player.companion) {
                    player.companion.x = player.x - 20;
                    player.companion.y = player.y + 8;
                  }
                  const visRadius = getVisibilityRadiusPx(player.torchSecondsRemaining);
                  revealFogAroundPlayer(world, region, player.x, player.y, visRadius);
                  cameraPosRef.current = {
                    x: player.x,
                    y: player.y,
                    initialized: true,
                    regionKey: region.key,
                  };
                  regionCooldownRef.current = 1.0;
                  showRegionNotice(region.name);
                  onSaveToSlot(activeSlotIndex, player, world).catch(() => {});
                }
              }
            }
          } else {
            player.isMoving = false;
          }

          // Companion follow behavior
          if (player.companion && player.companion.active) {
            const comp = player.companion;
            const dx = player.x - comp.x;
            const dy = player.y - comp.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 34) {
              const spd = Math.min(125, dist * 2.5);
              comp.x += (dx / dist) * spd * dt;
              comp.y += (dy / dist) * spd * dt;
              comp.facing = dx >= 0 ? 'right' : 'left';
            }
          }

          const frameTimeInfo = getTimeOfDayInfo(world.gameTimeSeconds);
          const inSafePlaza = Boolean(
            region.isSafeZone &&
              region.settlementKind !== 'NONE' &&
              Math.hypot(player.x - REGION_SPAWN_X, player.y - REGION_SPAWN_Y) < 165
          );

          // Wildlife AI (natural routines: ROAM, GRAZE, DRINK, REST, FLEE, HUNT)
          for (const w of region.wildlife) {
            if (w.defeated || w.tamed) continue;
            const distToPlayer = Math.hypot(player.x - w.x, player.y - w.y);
            const outsideActiveTime =
              (w.activeTime === 'DAY' && frameTimeInfo.isNight) ||
              (w.activeTime === 'NIGHT' && !frameTimeInfo.isNight);

            if (w.temperament === 'FLEE' && distToPlayer < 95) {
              w.isEating = false;
              w.behaviorState = 'FLEE';
              const dx = (w.x - player.x) / Math.max(1, distToPlayer);
              const dy = (w.y - player.y) / Math.max(1, distToPlayer);
              w.vx = dx * w.speed;
              w.vy = dy * w.speed;
            } else if (
              w.temperament === 'AGGRESSIVE' &&
              !inSafePlaza &&
              distToPlayer < 105 &&
              escapeCooldownRef.current <= 0
            ) {
              w.isEating = false;
              w.behaviorState = 'HUNT';
              const dx = (player.x - w.x) / Math.max(1, distToPlayer);
              const dy = (player.y - w.y) / Math.max(1, distToPlayer);
              w.vx = dx * w.speed * 0.85;
              w.vy = dy * w.speed * 0.85;
              if (distToPlayer <= 26) {
                soundEngine.playEncounter();
                keysHeldRef.current.clear();
                joystickVecRef.current = { vx: 0, vy: 0 };
                setCombatState(startCombat(player, createAnimalCombatMonster(w)));
                break;
              }
            } else if (outsideActiveTime) {
              w.behaviorState = 'REST';
              w.vx = 0;
              w.vy = 0;
              w.isEating = false;
            } else {
              w.aiTimer -= dt;
              if (w.aiTimer <= 0) {
                w.aiTimer = 1.6 + Math.random() * 2.4;
                const nearWaterForAnimal = regionManagerRef.current.isNearWater(region, w.x, w.y);
                if (nearWaterForAnimal && Math.random() < 0.55) {
                  w.vx = 0;
                  w.vy = 0;
                  w.isEating = true;
                  w.behaviorState = 'DRINK';
                } else if (Math.random() < 0.48) {
                  w.vx = 0;
                  w.vy = 0;
                  w.isEating = Math.random() < 0.7;
                  w.behaviorState = w.isEating ? 'GRAZE' : 'REST';
                } else {
                  w.isEating = false;
                  w.behaviorState = 'ROAM';
                  const angle = Math.random() * Math.PI * 2;
                  const spd = w.speed * 0.38;
                  w.vx = Math.cos(angle) * spd;
                  w.vy = Math.sin(angle) * spd;
                }
              }
            }

            const nx = w.x + w.vx * dt;
            const ny = w.y + w.vy * dt;
            if (
              nx > 2 * TILE_SIZE &&
              nx < (REGION_WIDTH - 2) * TILE_SIZE &&
              ny > 2 * TILE_SIZE &&
              ny < (REGION_HEIGHT - 2) * TILE_SIZE &&
              regionManagerRef.current.isPositionWalkable(region, nx, ny, 7)
            ) {
              w.x = nx;
              w.y = ny;
              if (Math.abs(w.vx) > 2) {
                w.facing = w.vx > 0 ? 'right' : 'left';
              }
            } else {
              w.vx = -w.vx * 0.5;
              w.vy = -w.vy * 0.5;
            }
          }

          // Monster Patrol + Chase + Combat Trigger (respects safe zones)
          for (const m of region.monsters) {
            if (m.defeated) continue;
            const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);

            if (!inSafePlaza && !m.isSafeZone && distToPlayer < 130 && escapeCooldownRef.current <= 0) {
              const dx = (player.x - m.x) / Math.max(1, distToPlayer);
              const dy = (player.y - m.y) / Math.max(1, distToPlayer);
              const chaseX = m.x + dx * 44 * dt;
              const chaseY = m.y + dy * 44 * dt;
              if (regionManagerRef.current.isPositionWalkable(region, chaseX, chaseY, 7)) {
                m.x = chaseX;
                m.y = chaseY;
              }
            } else {
              m.patrolPhase += dt * 0.9;
              const targetX = m.originX + Math.cos(m.patrolPhase) * 26;
              const targetY = m.originY + Math.sin(m.patrolPhase * 0.8) * 18;
              const dx = targetX - m.x;
              const dy = targetY - m.y;
              if (Math.hypot(dx, dy) > 2) {
                const nx = m.x + dx * dt * 1.4;
                const ny = m.y + dy * dt * 1.4;
                if (regionManagerRef.current.isPositionWalkable(region, nx, ny, 7)) {
                  m.x = nx;
                  m.y = ny;
                }
              }
            }

            if (!inSafePlaza && !m.isSafeZone && distToPlayer <= 28 && escapeCooldownRef.current <= 0) {
              soundEngine.playEncounter();
              keysHeldRef.current.clear();
              joystickVecRef.current = { vx: 0, vy: 0 };
              setCombatState(startCombat(player, m));
              break;
            }
          }

          const surv = tickSurvival(player, world, dt, region);
          if (surv.nightEscalated) {
            applyNightEscalationToRegion(region, world);
            const pct = Math.round(
              surv.newCompletedNights * (world.nightEscalationRate ?? 0.05) * 100
            );
            showRegionNotice(
              `Malam ke-${surv.newCompletedNights} berlalu — satwa & monster liar makin kuat (+${pct}%)`
            );
          }
          if (surv.diedOfStarvation) {
            soundEngine.playDefeat();
            setDeathCause(surv.cause ?? 'STARVATION');
          }

          // Update Fog of War whenever player crosses into a new tile or torch radius toggles
          const curTx = Math.floor(player.x / TILE_SIZE);
          const curTy = Math.floor(player.y / TILE_SIZE);
          const hasTorch = player.torchSecondsRemaining > 0;
          const lastFog = lastFogTileRef.current;
          if (
            lastFog.regionKey !== region.key ||
            lastFog.tx !== curTx ||
            lastFog.ty !== curTy ||
            lastFog.hasTorch !== hasTorch
          ) {
            revealFogAroundPlayer(
              world,
              region,
              player.x,
              player.y,
              getVisibilityRadiusPx(player.torchSecondsRemaining)
            );
            lastFogTileRef.current = {
              regionKey: region.key,
              tx: curTx,
              ty: curTy,
              hasTorch,
            };
          }

          nearestGroundLootRef.current = regionManagerRef.current.findNearestGroundLoot(
            region,
            player.x,
            player.y,
            46
          );
          nearestMerchantRef.current = regionManagerRef.current.findNearestMerchant(
            region,
            player.x,
            player.y,
            58
          );
          nearestResourceRef.current = regionManagerRef.current.findNearestResource(
            region,
            player.x,
            player.y,
            54
          );
          nearWaterRef.current = regionManagerRef.current.isNearWater(
            region,
            player.x,
            player.y
          );
          nearestWildlifeRef.current = regionManagerRef.current.findNearestWildlife(
            region,
            player.x,
            player.y,
            66
          );

          floatingTextsRef.current = floatingTextsRef.current
            .map((ft) => ({ ...ft, life: ft.life - dt }))
            .filter((ft) => ft.life > 0);
        }

        // Smooth camera follow (snaps on init or region change, damped lerp during movement)
        const cam = cameraPosRef.current;
        if (!cam.initialized || cam.regionKey !== region.key) {
          cam.x = player.x;
          cam.y = player.y;
          cam.initialized = true;
          cam.regionKey = region.key;
        } else {
          const alpha = 1 - Math.exp(-9 * dt);
          cam.x += (player.x - cam.x) * alpha;
          cam.y += (player.y - cam.y) * alpha;
        }

        const cameraZoom = CAMERA_ZOOM_SCALES[settings.cameraZoom ?? 'VERY_CLOSE'];
        const visibilityRadiusPx = getVisibilityRadiusPx(player.torchSecondsRemaining);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderWorld({
            ctx,
            width: canvas.width,
            height: canvas.height,
            cameraZoom,
            camX: cam.x,
            camY: cam.y,
            visibilityRadiusPx,
            player,
            world,
            region,
            nearestResource: nearestResourceRef.current,
            nearWaterTile: nearWaterRef.current,
            nearestWildlife: nearestWildlifeRef.current,
            nearestMerchant: nearestMerchantRef.current,
            nearestGroundLoot: nearestGroundLootRef.current,
            floatingTexts: floatingTextsRef.current,
            nowMs: now,
          });
        }

        if (settings.showMinimap && minimapRef.current) {
          const mCtx = minimapRef.current.getContext('2d');
          if (mCtx) {
            renderMinimap(
              mCtx,
              minimapRef.current.width,
              minimapRef.current.height,
              player,
              world,
              region,
              visibilityRadiusPx
            );
          }
        }
      }

      hudAccumulator += dt;
      if (hudAccumulator >= 0.14) {
        hudAccumulator = 0;
        setHudTick((t) => (t + 1) % 100000);

        setHazardAlert(
          region.isSafeZone
            ? null
            : getHazardWarningInfo(region.hazard, playerRef.current, worldRef.current)
        );

        const nl = nearestGroundLootRef.current;
        const nm = nearestMerchantRef.current;
        const nw = nearestWildlifeRef.current;
        const nr = nearestResourceRef.current;
        const water = nearWaterRef.current;

        if (nl) {
          setContextHint(`Ambil ${nl.quantity}x ${ITEMS[nl.itemId].name}`);
        } else if (nm) {
          setContextHint(`Berdagang: ${nm.name} (${nm.title})`);
        } else if (nr) {
          if (nr.kind === 'TREE') {
            setContextHint(`Tebang ${getTreeLabel(nr.treeSpecies)} (${nr.remaining})`);
          } else if (nr.kind === 'MINERAL') {
            const lockNote =
              nr.requiresTool === 'PICKAXE' && !playerRef.current.hasPickaxe
                ? ' [Butuh Beliung]'
                : '';
            setContextHint(
              `Tambang ${getMineralLabel(nr.mineralSpecies)} (${nr.remaining})${lockNote}`
            );
          } else {
            setContextHint(`Kumpulkan ${getPlantLabel(nr.plantSpecies)} (${nr.remaining})`);
          }
        } else if (water) {
          setContextHint(
            playerRef.current.hasFishingRod
              ? 'Air Jernih — Minum, Isi Air, atau Mancing'
              : 'Air Jernih — Minum atau Isi Kantung Air'
          );
        } else if (nw) {
          if (nw.tameEligible) {
            setContextHint(`${nw.name} — Serang/Interaksi & lemahkan <=45% HP untuk jinakkan`);
          } else {
            setContextHint(`Buru ${nw.name} (${nw.hp}/${nw.maxHp} HP)`);
          }
        } else {
          setContextHint(null);
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeSlotIndex, onSaveToSlot, settings.cameraZoom, settings.showMinimap, showRegionNotice]);

  void hudTick;
  const player = playerRef.current;
  const world = worldRef.current;
  const cls = CHARACTER_CLASSES[player.classId];
  const timeInfo = getTimeOfDayInfo(world.gameTimeSeconds);

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const hungerPct = Math.max(0, Math.min(100, (player.hunger / player.maxHunger) * 100));
  const thirstPct = Math.max(0, Math.min(100, (player.thirst / player.maxThirst) * 100));
  const staminaPct = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
  const manaPct = Math.max(0, Math.min(100, (player.mana / Math.max(1, player.maxMana)) * 100));

  const hungerCritical = player.hunger <= 20;
  const thirstCritical = player.thirst <= 20;
  const nearWater = nearWaterRef.current !== null;
  const joyOnRight = settings.touchJoystickSide === 'right';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0D0F10] select-none">
      <canvas ref={canvasRef} className="w-full h-full block illustrated-canvas touch-none" />

      {/* Landscape-First Non-Blocking HUD Overlay with Safe Inset Margins */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between pl-[max(0.85rem,env(safe-area-inset-left))] pr-[max(0.85rem,env(safe-area-inset-right))] pt-[max(0.6rem,env(safe-area-inset-top))] pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {/* TOP ROW: Compact Landscape Player Bars (Left) + Region & Minimap (Right) */}
        <div className="flex items-start justify-between gap-2">
          {/* TOP LEFT: Character Portrait + Survival Bars */}
          <div className="pointer-events-auto bg-[#0D0F10]/88 border border-[#3A4046]/90 rounded-lg p-2 flex items-center gap-2.5 max-w-[320px] shadow-lg">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('STATUS');
              }}
              aria-label="Buka Status Karakter"
              className="w-14 h-14 shrink-0 rounded-lg bg-[#14171A] border border-[#C89B3C]/70 hover:border-[#E5B85A] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <CharacterPortrait
                classId={player.classId}
                size={48}
                weaponVisual={player.equippedWeaponVisual}
                armorVisual={player.equippedArmorVisual}
                offhandVisual={player.equippedOffhandVisual}
                helmetVisual={player.equippedHelmetVisual}
              />
            </button>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[#F5E6C4] truncate">
                  {cls.name}
                  {player.companion?.active ? ` + ${player.companion.name}` : ''}
                </span>
                <span className="font-mono-num text-[#E5B85A] shrink-0">
                  Lv.{player.level}
                </span>
              </div>

              {/* HP & MP Row */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-num">
                <div>
                  <div className="flex justify-between text-[#E5989B]">
                    <span>HP</span>
                    <span>{Math.ceil(player.hp)}/{player.maxHp}</span>
                  </div>
                  <div className="h-1.5 bg-[#1C2024] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#B84A39]" style={{ width: `${hpPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#B388FF]">
                    <span>MP</span>
                    <span>{Math.round(player.mana)}/{player.maxMana}</span>
                  </div>
                  <div className="h-1.5 bg-[#1C2024] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#7E57C2]" style={{ width: `${manaPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Hunger, Thirst, Stamina Compact Tri-Bar */}
              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono-num">
                <div>
                  <div className={`flex justify-between ${hungerCritical ? 'text-[#E5534B] font-bold' : 'text-[#E5B85A]'}`}>
                    <span>LPR</span>
                    <span>{Math.round(player.hunger)}%</span>
                  </div>
                  <div className="h-1 bg-[#1C2024] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#C89B3C]" style={{ width: `${hungerPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className={`flex justify-between ${thirstCritical ? 'text-[#E5534B] font-bold' : 'text-[#7EC4E0]'}`}>
                    <span>HAUS</span>
                    <span>{Math.round(player.thirst)}%</span>
                  </div>
                  <div className="h-1 bg-[#1C2024] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#3B9ED8]" style={{ width: `${thirstPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#8FC79A]">
                    <span>STM</span>
                    <span>{Math.round(player.stamina)}</span>
                  </div>
                  <div className="h-1 bg-[#1C2024] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#4CAF50]" style={{ width: `${staminaPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center-Top Region Transition Banner & Hazard Warning */}
          <div className="hidden md:flex flex-col items-center gap-1">
            {regionBanner && (
              <div className="flex items-center px-4 py-1.5 rounded bg-[#0D0F10]/90 border border-[#C89B3C]/70 text-xs font-display font-bold text-[#F5E6C4] tracking-wide shadow-lg">
                {regionBanner}
              </div>
            )}
            {hazardAlert && !hazardAlert.mitigated && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2C1618]/92 border border-[#E5534B]/70 text-[11px] font-semibold text-[#F5B4B6] shadow">
                <AlertTriangle className="w-3.5 h-3.5 text-[#E5534B] shrink-0" />
                <span>{hazardAlert.label} — {hazardAlert.advice}</span>
              </div>
            )}
          </div>

          {/* TOP RIGHT: Region Name, Time, Gold, Water Container, Minimap, Pause/SFX */}
          <div className="flex items-start gap-2">
            <div className="pointer-events-auto bg-[#0D0F10]/85 border border-[#3A4046]/85 rounded p-2 flex items-center gap-2.5">
              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold text-[#F5E6C4] font-mono-num">
                  Hari {timeInfo.day} · {timeInfo.clockLabel}
                </div>
                <div className="text-[10px] font-semibold text-[#C89B3C] truncate max-w-[165px]">
                  {world.biomeName}
                </div>
                <div className="text-[10px] font-mono-num text-[#7EC4E0] flex items-center justify-end gap-2">
                  <span className="flex items-center gap-1 text-[#FFD166]">
                    <Coins className="w-3 h-3" />
                    <span>{player.gold ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    <span>{player.waterCharges}/{player.maxWaterCharges}</span>
                  </span>
                  {player.torchSecondsRemaining > 0 && (
                    <span className="text-[#E5B85A]">
                      · Obor {Math.ceil(player.torchSecondsRemaining)}d
                    </span>
                  )}
                </div>
              </div>

              {settings.showMinimap && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveModal('WORLD_MAP');
                  }}
                  title="Buka Peta Dunia (M)"
                  className="relative group cursor-pointer shrink-0 rounded overflow-hidden border border-[#3A4046] hover:border-[#C89B3C]"
                >
                  <canvas
                    ref={minimapRef}
                    width={92}
                    height={68}
                    className="illustrated-canvas block"
                    aria-label="Peta Wilayah"
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 rounded bg-[#0D0F10]/85 text-[10px] font-bold text-[#E5B85A]">
                    Peta
                  </span>
                </button>
              )}
            </div>

            <div className="pointer-events-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveModal('PAUSE');
                }}
                aria-label="Jeda dan Simpan"
                className="min-h-[48px] min-w-[48px] rounded-lg bg-[#0D0F10]/90 hover:bg-[#1C2024] active:scale-95 border border-[#3A4046] flex items-center justify-center text-[#F5E6C4] cursor-pointer shadow"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveModal('WORLD_MAP');
                }}
                aria-label="Buka Peta Dunia"
                title="Peta Dunia (M)"
                className="min-h-[48px] min-w-[48px] rounded-lg bg-[#0D0F10]/90 hover:bg-[#1C2024] active:scale-95 border border-[#3A4046] flex items-center justify-center text-[#E5B85A] cursor-pointer shadow"
              >
                <MapIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onToggleSfx}
                aria-label={settings.sfxEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
                className="min-h-[48px] min-w-[48px] rounded-lg bg-[#0D0F10]/90 hover:bg-[#1C2024] active:scale-95 border border-[#3A4046] flex items-center justify-center text-[#B8B2A6] cursor-pointer shadow"
              >
                {settings.sfxEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#C89B3C]" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Virtual Joystick & Enlarged Touch Action Cluster */}
        <div
          className={`flex items-end justify-between gap-3 pb-1 ${
            joyOnRight ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <div
            className={`pointer-events-auto flex flex-col gap-1.5 ${
              joyOnRight ? 'items-end' : 'items-start'
            }`}
          >
            {settings.showControlHints && (
              <span className="hidden sm:inline-block text-[10px] font-mono-num text-[#9BA3AB] bg-[#0D0F10]/75 px-2.5 py-0.5 rounded border border-[#252A2E]">
                WASD / Panah · Spasi Serang · E/F Interaksi
              </span>
            )}
            <VirtualJoystick
              onVectorChange={(vx, vy) => {
                joystickVecRef.current = { vx, vy };
              }}
            />
          </div>

          <div
            className={`pointer-events-auto flex flex-col gap-2 ${
              joyOnRight ? 'items-start' : 'items-end'
            }`}
          >
            {contextHint && (
              <div className="px-3 py-1.5 rounded-lg bg-[#17281E]/94 border border-[#C89B3C]/80 text-xs font-semibold text-[#F5E6C4] shadow-lg">
                {contextHint}
              </div>
            )}

            <div className="flex items-end gap-2.5">
              {nearWater && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOpenFishing}
                    className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#17281E]/95 hover:bg-[#264D34] active:scale-95 border border-[#8FC79A]/75 text-[#F5E6C4] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg whitespace-nowrap"
                  >
                    <Fish className="w-4 h-4 shrink-0 text-[#FFD166]" />
                    <span>Mancing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDrinkOrFillWater('FILL')}
                    className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#264E63]/95 hover:bg-[#31647E] active:scale-95 border border-[#7EC4E0]/75 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg whitespace-nowrap"
                  >
                    <Droplets className="w-4 h-4 shrink-0" />
                    <span>Isi Air</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col items-end gap-2">
                {/* Row 1: Primary Combat / Action Touch Controls (54-60px) */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleSkillExploreAction}
                    className="min-h-[54px] min-w-[92px] sm:min-w-[100px] px-3 py-2 rounded-xl bg-[#291C3C]/92 hover:bg-[#3A2754] active:scale-95 border border-[#B388FF]/55 text-[#F5E6C4] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-[#B388FF]" />
                    <span>Jurus</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGatherOrInteract}
                    className={`min-h-[58px] min-w-[110px] sm:min-w-[120px] px-3.5 py-2 rounded-xl active:scale-95 border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      contextHint
                        ? 'bg-[#C89B3C] hover:bg-[#E5B85A] border-[#F5E6C4] text-[#0D0F10]'
                        : 'bg-[#17281E]/94 hover:bg-[#264D34] border-[#3B734D] text-[#F5E6C4]'
                    }`}
                  >
                    <Hand className="w-5 h-5 shrink-0" />
                    <span>Interaksi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAttackAction}
                    className="min-h-[60px] min-w-[114px] sm:min-w-[124px] px-4 py-2 rounded-xl bg-[#9E2A2B]/95 hover:bg-[#B83335] active:scale-95 border border-[#E5989B]/55 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                  >
                    <Sword className="w-5 h-5 shrink-0" />
                    <span>Serang</span>
                  </button>
                </div>

                {/* Row 2: Utility Panel Buttons (48px) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setInventoryMsg(null);
                      setActiveModal('INVENTORY');
                    }}
                    className="min-h-[48px] min-w-[104px] sm:min-w-[112px] px-3.5 py-2 rounded-xl bg-[#14171A]/92 hover:bg-[#22272B] active:scale-95 border border-[#5A626A] text-[#E6E2D8] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Backpack className="w-4 h-4 shrink-0 text-[#C89B3C]" />
                    <span>Tas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveModal('STATUS');
                    }}
                    className="min-h-[48px] min-w-[104px] sm:min-w-[112px] px-3.5 py-2 rounded-xl bg-[#14171A]/92 hover:bg-[#22272B] active:scale-95 border border-[#5A626A] text-[#E6E2D8] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <User className="w-4 h-4 shrink-0 text-[#7EC4E0]" />
                    <span>Status</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Portrait Orientation Guard Overlay */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-[#0D0F10]/96 flex flex-col items-center justify-center p-6 text-center gap-4">
          <RotateCw className="w-12 h-12 text-[#E5B85A] animate-spin" style={{ animationDuration: '4s' }} />
          <div className="space-y-1 max-w-xs">
            <h2 className="font-display text-lg font-bold text-[#F5E6C4]">
              Putar ke Mode Lanskap
            </h2>
            <p className="text-xs text-[#9BA3AB]">
              THE LAST EMBER dirancang khusus untuk orientasi horizontal agar kontrol joystick, aksi, dan hutan tetap nyaman terlihat.
            </p>
          </div>
        </div>
      )}

      {/* Turn-Based Combat Overlay */}
      {combatState && (
        <CombatOverlay
          combat={combatState}
          player={playerRef.current}
          onQuickAttack={() => {
            soundEngine.playAttack();
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performQuickAttack(prev, playerRef.current, worldRef.current);
              if (next.turn === 'VICTORY') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onHeavyAttack={() => {
            soundEngine.playHeavyAttack();
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performHeavyAttack(prev, playerRef.current, worldRef.current);
              if (next.turn === 'VICTORY') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onUseSkill={(skillId) => {
            const skill = cls.skills.find((s) => s.id === skillId);
            soundEngine.playSkill(skill?.element ?? 'PHYSICAL');
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performClassSkill(
                prev,
                playerRef.current,
                worldRef.current,
                skillId
              );
              if (next.turn === 'VICTORY') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onDefend={() => {
            soundEngine.playDefend();
            setCombatState((prev) =>
              prev ? performPlayerDefend(prev, playerRef.current) : null
            );
            setHudTick((t) => t + 1);
          }}
          onDodge={() => {
            soundEngine.playDodge();
            setCombatState((prev) =>
              prev ? performPlayerDodge(prev, playerRef.current) : null
            );
            setHudTick((t) => t + 1);
          }}
          onUseItem={(itemId: ItemId) => {
            soundEngine.playHeal();
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performPlayerUseItem(
                prev,
                playerRef.current,
                worldRef.current,
                itemId
              );
              if (next.turn === 'VICTORY') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onTameAttempt={(foodItemId: ItemId) => {
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performTameAttempt(
                prev,
                playerRef.current,
                worldRef.current,
                foodItemId
              );
              if (next.turn === 'TAMED') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id, true);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              } else {
                soundEngine.playClick();
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onCompanionAction={(actionId: string) => {
            setCombatState((prev) => {
              if (!prev) return null;
              const next = performCompanionAction(
                prev,
                playerRef.current,
                worldRef.current,
                actionId
              );
              if (next.turn === 'VICTORY') {
                soundEngine.playVictory();
                regionManagerRef.current.markMonsterDefeated(next.enemy.id);
                onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              } else if (next.lastVfx?.kind === 'HEAL') {
                soundEngine.playHeal();
              } else if (next.lastVfx?.kind === 'SHIELD') {
                soundEngine.playDefend();
              } else {
                soundEngine.playAttack();
              }
              return next;
            });
            setHudTick((t) => t + 1);
          }}
          onEscape={() => {
            soundEngine.playClick();
            setCombatState((prev) =>
              prev ? performPlayerEscape(prev, playerRef.current) : null
            );
          }}
          onCloseVictoryOrEscape={() => {
            soundEngine.playClick();
            escapeCooldownRef.current = 2.0;
            setCombatState(null);
            setHudTick((t) => t + 1);
          }}
          onDefeatContinue={() => {
            setCombatState(null);
            setDeathCause('COMBAT');
          }}
        />
      )}

      {/* Interactive Fishing Mini-Game Modal */}
      {activeModal === 'FISHING' && (
        <FishingModal
          player={playerRef.current}
          waterSpot={
            (regionManagerRef.current.getCurrentRegion(worldRef.current).biomeTheme === 'RIVER'
              ? 'RIVER'
              : 'POND') as WaterSpotType
          }
          timePhase={timeInfo.phaseLabel}
          onCatchFish={(res: FishCatchResult, usedBait: boolean) => {
            const p = playerRef.current;
            if (usedBait && (p.inventory.umpan_pancing ?? 0) > 0) {
              p.inventory.umpan_pancing -= 1;
            }
            grantInventoryItem(p, res.itemId, 1);
            p.fishCaught = (p.fishCaught ?? 0) + 1;
            p.exp += res.exp;
            p.fishingSkillLevel = Math.min(10, 1 + Math.floor(p.fishCaught / 5));
            let leveled = false;
            while (p.exp >= p.expToNext) {
              p.exp -= p.expToNext;
              p.level += 1;
              p.expToNext = Math.round(p.expToNext * 1.45);
              p.maxHp += 10;
              p.hp = Math.min(p.maxHp, p.hp + 15);
              p.maxMana += 5;
              leveled = true;
            }
            if (leveled) {
              recalculatePlayerStats(p);
            }
            pushFloatingText(
              p.x,
              p.y - 26,
              `+${res.name} (${res.sizeCm} cm)`,
              LOOT_RARITY_COLORS[res.rarity]
            );
            onSaveToSlot(activeSlotIndex, p, worldRef.current).catch(() => {});
            setHudTick((t) => t + 1);
          }}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('NONE');
          }}
        />
      )}

      {/* Inventory & 7-Category Crafting Modal */}
      {activeModal === 'INVENTORY' && (
        <InventoryModal
          player={playerRef.current}
          feedbackMessage={inventoryMsg}
          onUseItem={(itemId) => {
            const res = useItemInExploration(
              playerRef.current,
              itemId,
              worldRef.current.gameTimeSeconds
            );
            if (res.success) {
              soundEngine.playHeal();
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            } else {
              soundEngine.playClick();
            }
            setInventoryMsg(res.message);
            setHudTick((t) => t + 1);
          }}
          onUnequipSlot={(slot) => {
            const res = unequipSlot(playerRef.current, slot);
            soundEngine.playClick();
            if (res.success) {
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            }
            setInventoryMsg(res.message);
            setHudTick((t) => t + 1);
          }}
          onDropItem={(itemId, qty) => {
            const res = dropInventoryItem(playerRef.current, itemId, qty);
            soundEngine.playClick();
            if (res.success) {
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            }
            setInventoryMsg(res.message);
            setHudTick((t) => t + 1);
          }}
          onInspectItem={(itemId) => {
            clearNewlyAcquiredItem(playerRef.current, itemId);
            setHudTick((t) => t + 1);
          }}
          onDrinkContainer={() => {
            const res = drinkFromContainer(playerRef.current);
            if (res.success) soundEngine.playGather('WATER');
            else soundEngine.playClick();
            setInventoryMsg(res.message);
            setHudTick((t) => t + 1);
          }}
          onCraft={(recipeId) => {
            const res = craftItem(playerRef.current, recipeId);
            if (res.success) {
              soundEngine.playVictory();
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            } else {
              soundEngine.playClick();
            }
            setInventoryMsg(res.message);
            setHudTick((t) => t + 1);
          }}
          onOpenEquipment={() => {
            soundEngine.playClick();
            setActiveModal('STATUS');
          }}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('NONE');
          }}
        />
      )}

      {/* Character Status, 7-Slot Equipment & Companion Collection Modal */}
      {activeModal === 'STATUS' && (
        <StatusModal
          player={playerRef.current}
          world={worldRef.current}
          onSelectCompanion={(companionId) => {
            const p = playerRef.current;
            if (companionId === null) {
              if (p.companion) {
                deactivateCompanion(p, p.companion.id);
              }
            } else {
              activateCompanion(p, companionId);
            }
            soundEngine.playClick();
            onSaveToSlot(activeSlotIndex, p, worldRef.current).catch(() => {});
            setHudTick((t) => t + 1);
          }}
          onEquipItem={(itemId) => {
            const res = equipInventoryItem(playerRef.current, itemId);
            if (res.success) {
              soundEngine.playVictory();
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            } else {
              soundEngine.playClick();
            }
            setHudTick((t) => t + 1);
            return res;
          }}
          onUnequipSlot={(slot) => {
            const res = unequipSlot(playerRef.current, slot);
            soundEngine.playClick();
            if (res.success) {
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            }
            setHudTick((t) => t + 1);
            return res;
          }}
          onRenameCompanion={(companionId, newName) => {
            const ok = renameCompanion(playerRef.current, companionId, newName);
            soundEngine.playClick();
            if (ok) {
              onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
              setHudTick((t) => t + 1);
            }
            return ok;
          }}
          onReleaseCompanion={(companionId) => {
            releaseCompanion(playerRef.current, companionId);
            soundEngine.playClick();
            onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            setHudTick((t) => t + 1);
          }}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('NONE');
          }}
        />
      )}

      {/* Full-Screen Explored World Map Modal */}
      {activeModal === 'WORLD_MAP' && (
        <WorldMapModal
          world={worldRef.current}
          player={playerRef.current}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('NONE');
          }}
        />
      )}

      {/* Merchant Buy & Sell Modal */}
      {activeMerchant && (
        <MerchantModal
          player={playerRef.current}
          world={worldRef.current}
          merchant={activeMerchant}
          onUpdate={() => {
            onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current).catch(() => {});
            setHudTick((t) => t + 1);
          }}
          onClose={() => {
            soundEngine.playClick();
            setActiveMerchant(null);
          }}
        />
      )}

      {/* Pause & 3-Slot Save Modal */}
      {activeModal === 'PAUSE' && (
        <PauseSaveModal
          activeSlotIndex={activeSlotIndex}
          saveSlots={saveSlots}
          onResume={() => {
            soundEngine.playClick();
            setActiveModal('NONE');
          }}
          onSaveToSlot={async (slotIndex) => {
            soundEngine.playHeal();
            await onSaveToSlot(slotIndex, playerRef.current, worldRef.current);
          }}
          onQuitToMenu={async () => {
            soundEngine.playClick();
            await onSaveToSlot(activeSlotIndex, playerRef.current, worldRef.current);
            onQuitToMenu();
          }}
        />
      )}

      {/* Death Screen */}
      {deathCause && (
        <DeathModal
          cause={deathCause}
          player={playerRef.current}
          world={worldRef.current}
          hasSavedSlot={saveSlots.some((s) => s.exists)}
          onLoadLastSave={() => {
            soundEngine.playClick();
            setDeathCause(null);
            onLoadLastSave();
          }}
          onNewGame={() => {
            soundEngine.playClick();
            setDeathCause(null);
            onNewGame();
          }}
          onMainMenu={() => {
            soundEngine.playClick();
            setDeathCause(null);
            onQuitToMenu();
          }}
        />
      )}
    </div>
  );
};
