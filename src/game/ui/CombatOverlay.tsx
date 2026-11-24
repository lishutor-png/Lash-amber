import React, { useEffect, useRef, useState } from 'react';
import {
  Sword,
  Shield,
  Backpack,
  Footprints,
  Sparkles,
  Wind,
  Zap,
  AlertTriangle,
  Flame,
  Heart,
  ScrollText,
  X,
  PawPrint,
} from 'lucide-react';
import { CHARACTER_CLASSES } from '../character/classes';
import {
  TAME_HP_THRESHOLD,
  getEnemyIntentDescription,
} from '../combat/combatSystem';
import { LOOT_RARITY_COLORS } from '../combat/lootSystem';
import {
  COMPANION_RARITY_LABELS,
  COMPANION_SPECIES_CONFIG,
  DIET_LABELS,
  ROLE_META,
  calculateTameProbability,
  getCompanionActions,
  getPetFoodItemsOwned,
} from '../companion/companionSystem';
import { CombatState, ElementType, ItemId, PlayerState } from '../core/types';
import { ITEM_ORDER, ITEMS } from '../inventory/items';
import {
  createCombatVfxRunner,
  renderCombatStage,
} from '../renderer/combatRenderer';
import {
  AnimalPortrait,
  CharacterPortrait,
  ItemPixelIcon,
  SkeletonPortrait,
} from './PixelPortrait';

interface CombatOverlayProps {
  combat: CombatState;
  player: PlayerState;
  onQuickAttack: () => void;
  onHeavyAttack: () => void;
  onUseSkill: (skillId: string) => void;
  onDefend: () => void;
  onDodge: () => void;
  onUseItem: (itemId: ItemId) => void;
  onTameAttempt: (foodItemId: ItemId) => void;
  onCompanionAction: (actionId: string) => void;
  onEscape: () => void;
  onCloseVictoryOrEscape: () => void;
  onDefeatContinue: () => void;
}

const ELEMENT_BADGE_LABELS: Record<ElementType, { label: string; color: string }> = {
  PHYSICAL: { label: 'Fisik', color: 'text-[#C4CDD6]' },
  FIRE: { label: 'Api', color: 'text-[#FF8A50]' },
  ICE: { label: 'Es', color: 'text-[#7EC4E0]' },
  LIGHTNING: { label: 'Petir', color: 'text-[#FFE066]' },
  NATURE: { label: 'Alam', color: 'text-[#8FC79A]' },
  HOLY: { label: 'Suci', color: 'text-[#E5B85A]' },
  DARK: { label: 'Gelap', color: 'text-[#B388FF]' },
  POISON: { label: 'Racun', color: 'text-[#81C784]' },
};

export const CombatOverlay: React.FC<CombatOverlayProps> = ({
  combat,
  player,
  onQuickAttack,
  onHeavyAttack,
  onUseSkill,
  onDefend,
  onDodge,
  onUseItem,
  onTameAttempt,
  onCompanionAction,
  onEscape,
  onCloseVictoryOrEscape,
  onDefeatContinue,
}) => {
  const [subPanel, setSubPanel] = useState<
    'MAIN' | 'SKILLS' | 'ITEMS' | 'FEED' | 'COMPANION_INFO'
  >('MAIN');
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vfxRunnerRef = useRef(createCombatVfxRunner());
  const combatRef = useRef(combat);
  const playerRef = useRef(player);
  combatRef.current = combat;
  playerRef.current = player;

  // 60fps Combat Stage Canvas loop
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const canvas = stageCanvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
            canvas.width = w;
            canvas.height = h;
          }
        }
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          renderCombatStage(
            ctx,
            canvas.width,
            canvas.height,
            combatRef.current,
            playerRef.current,
            vfxRunnerRef.current,
            dt,
            Date.now()
          );
        }
      }
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const playerClass = CHARACTER_CLASSES[player.classId];
  const isPlayerTurn = combat.turn === 'PLAYER';
  const intentInfo = getEnemyIntentDescription(combat.enemy);

  const combatItems = ITEM_ORDER.filter(
    (id) => ITEMS[id].usableInCombat && (player.inventory[id] ?? 0) > 0
  );
  const ownedPetFoods = getPetFoodItemsOwned(player);

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
  const manaPct = Math.max(
    0,
    Math.min(100, (player.mana / Math.max(1, player.maxMana)) * 100)
  );
  const enemyHpRatio = combat.enemy.hp / Math.max(1, combat.enemy.maxHp);
  const enemyPct = Math.max(0, Math.min(100, enemyHpRatio * 100));
  const canTameNow =
    Boolean(combat.enemy.tameEligible && combat.enemy.animalSpecies) &&
    enemyHpRatio <= TAME_HP_THRESHOLD;
  const latestLog =
    combat.log[combat.log.length - 1] ?? 'Bersiap menghadapi musuh di depanmu.';

  const renderIntentIcon = () => {
    if (combat.enemy.isStaggered) {
      return <Zap className="w-4 h-4 text-[#FFE066] shrink-0" />;
    }
    switch (combat.enemy.intent) {
      case 'HEAVY_ATTACK':
        return <AlertTriangle className="w-4 h-4 text-[#E5534B] shrink-0" />;
      case 'DEFENSIVE_STANCE':
        return <Shield className="w-4 h-4 text-[#7EC4E0] shrink-0" />;
      case 'PREPARE_ATTACK':
        return <Flame className="w-4 h-4 text-[#FF8A50] shrink-0" />;
      default:
        return <Sword className="w-4 h-4 text-[#E5B85A] shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#080A0C]/92 flex items-center justify-center p-1.5 sm:p-3 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-5xl h-[96dvh] bg-[#121518] border border-[#3A4046] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* TOP HEADER: Turn Banner + Monster Header (Name, Status, HP, Intent, Portrait) */}
        <header className="shrink-0 px-3 py-2 bg-[#0F1215] border-b border-[#252A2E] grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-[#1B2024] border border-[#3A4046] text-[11px] font-bold text-[#E5B85A] shrink-0">
              Putaran {combat.turnCount}
            </span>
            <span className="text-xs font-semibold text-[#F5E6C4] truncate">
              {combat.turn === 'PLAYER' && 'Giliranmu — Pilih Taktik'}
              {combat.turn === 'COMPANION' && 'Giliran Pendamping'}
              {combat.turn === 'ENEMY' && 'Musuh Bertindak...'}
              {combat.turn === 'VICTORY' && 'Kemenangan!'}
              {combat.turn === 'TAMED' && 'Pendamping Dijinakkan!'}
              {combat.turn === 'ESCAPED' && 'Berhasil Kabur'}
              {combat.turn === 'DEFEAT' && 'Gugur'}
            </span>
          </div>

          <div className="col-span-7 flex items-center justify-end gap-3 min-w-0">
            <div className="min-w-0 flex-1 max-w-sm space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-[#F5E6C4] truncate">
                    {combat.enemy.name}
                  </span>
                  {combat.enemy.statusEffects.map((s, i) => (
                    <span
                      key={`${s.type}_${i}`}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        s.type === 'BURN'
                          ? 'bg-[#B84A39]/30 text-[#FF8A50]'
                          : s.type === 'FROST'
                          ? 'bg-[#264E63]/50 text-[#7EC4E0]'
                          : 'bg-[#264D34]/50 text-[#8FC79A]'
                      }`}
                    >
                      {s.type === 'BURN'
                        ? `Api ${s.turns}`
                        : s.type === 'FROST'
                        ? `Es ${s.turns}`
                        : `Racun ${s.turns}`}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-mono-num text-[#E5B85A] shrink-0">
                  {combat.enemy.hp}/{combat.enemy.maxHp}
                </span>
              </div>

              <div className="relative h-2.5 bg-[#090B0C] rounded-full overflow-hidden border border-[#2B3137]">
                <div
                  className={`h-full transition-all duration-200 ${
                    canTameNow
                      ? 'bg-gradient-to-r from-[#4BA86E] to-[#8FC79A]'
                      : 'bg-gradient-to-r from-[#9E2A2B] to-[#D95A3A]'
                  }`}
                  style={{ width: `${enemyPct}%` }}
                />
                {combat.enemy.tameEligible && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#FFD166]"
                    style={{ left: `${TAME_HP_THRESHOLD * 100}%` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1 min-w-0">
                  {renderIntentIcon()}
                  <span className="font-semibold text-[#F5E6C4] truncate">
                    Niat: {intentInfo.label}
                  </span>
                </div>
                <span className="text-[10px] text-[#9BA3AB] truncate hidden sm:inline">
                  {intentInfo.detail}
                </span>
              </div>
            </div>

            <div className="w-14 h-14 shrink-0 rounded-lg bg-[#0B0D0F] border border-[#C89B3C]/50 flex items-center justify-center shadow-inner">
              <SkeletonPortrait
                size={50}
                enemyType={combat.enemy.type}
                isGuarding={combat.enemy.isGuarding}
                isPrepared={combat.enemy.isPrepared}
              />
            </div>
          </div>
        </header>

        {/* CENTER BATTLE STAGE: Animated Canvas + Player Status Bar Overlay + 1-Line Action Banner */}
        <div className="relative flex-1 min-h-[120px] bg-[#0D1311] overflow-hidden">
          <canvas
            ref={stageCanvasRef}
            className="w-full h-full block illustrated-canvas"
          />

          {/* Player & Companion HUD Overlay (Top-Left of Stage) */}
          <div className="absolute top-2 left-2.5 z-10 bg-[#0D0F10]/82 backdrop-blur-sm border border-[#3A4046]/80 rounded-lg p-2 flex items-center gap-2.5 max-w-[300px] sm:max-w-[340px]">
            <div className="w-12 h-12 shrink-0 rounded-lg bg-[#14171A] border border-[#C89B3C]/70 flex items-center justify-center">
              <CharacterPortrait
                classId={player.classId}
                size={44}
                weaponVisual={player.equippedWeaponVisual}
                armorVisual={player.equippedArmorVisual}
                offhandVisual={player.equippedOffhandVisual}
                helmetVisual={player.equippedHelmetVisual}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#F5E6C4] truncate">
                  {playerClass.name}
                  {player.companion?.active ? ` + ${player.companion.name}` : ''}
                </span>
                <span className="text-[11px] font-mono-num text-[#E5B85A] shrink-0">
                  Lv.{player.level}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono-num">
                <div>
                  <div className="flex justify-between text-[#E5989B]">
                    <span>HP</span>
                    <span>{Math.ceil(player.hp)}</span>
                  </div>
                  <div className="h-1.5 bg-[#090B0C] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B84A39]" style={{ width: `${hpPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#7EC4E0]">
                    <span>STM</span>
                    <span>{Math.round(player.stamina)}</span>
                  </div>
                  <div className="h-1.5 bg-[#090B0C] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4D8FAC]" style={{ width: `${stamPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#B388FF]">
                    <span>MP</span>
                    <span>{Math.round(player.mana)}</span>
                  </div>
                  <div className="h-1.5 bg-[#090B0C] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7E57C2]" style={{ width: `${manaPct}%` }} />
                  </div>
                </div>
              </div>

              {(combat.companionShieldActive ||
                combat.companionGuardActive ||
                combat.playerWardTurns > 0 ||
                combat.playerAtkBuffTurns > 0 ||
                combat.playerCritBuffTurns > 0 ||
                combat.playerRegenTurns > 0) && (
                <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
                  {(combat.companionShieldActive ||
                    combat.companionGuardActive ||
                    combat.playerWardTurns > 0) && (
                    <span className="text-[#7EC4E0]">Perisai</span>
                  )}
                  {combat.playerAtkBuffTurns > 0 && (
                    <span className="text-[#FF8A50]">+ATK</span>
                  )}
                  {combat.playerCritBuffTurns > 0 && (
                    <span className="text-[#FFD166]">+Kritis</span>
                  )}
                  {combat.playerRegenTurns > 0 && (
                    <span className="text-[#8FC79A]">Regen</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Single-Line Latest Action Summary + Log Drawer Button */}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 bg-[#0D0F10]/85 backdrop-blur-sm border border-[#2B3137] rounded-lg px-3 py-1.5">
            <span className="text-xs text-[#F5E6C4] truncate font-medium">
              • {latestLog}
            </span>
            <button
              type="button"
              onClick={() => setShowLogDrawer(true)}
              className="min-h-[34px] px-2.5 py-1 rounded bg-[#1C2024] hover:bg-[#2A3036] border border-[#3A4046] text-[11px] font-semibold text-[#E5B85A] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Log ({combat.log.length})</span>
            </button>
          </div>
        </div>

        {/* BOTTOM FIXED ACTION DECK (Thumb-friendly >= 48px Android controls) */}
        <div className="shrink-0 p-2.5 bg-[#101316] border-t border-[#252A2E]">
          {combat.turn === 'TAMED' && combat.tamedCompanion ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 shrink-0 rounded-lg bg-[#0D0F10] border border-[#C89B3C] flex items-center justify-center">
                  <AnimalPortrait species={combat.tamedCompanion.species} size={46} />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold text-[#FFD166] truncate">
                    {combat.tamedCompanion.name} (
                    {COMPANION_RARITY_LABELS[combat.tamedCompanion.rarity]}) Dijinakkan!
                  </div>
                  <div className="text-[#C7C2B6] mt-0.5">
                    Peran:{' '}
                    <strong style={{ color: ROLE_META[combat.tamedCompanion.role].color }}>
                      {ROLE_META[combat.tamedCompanion.role].label}
                    </strong>{' '}
                    · {combat.tamedCompanion.abilityName} —{' '}
                    {combat.tamedCompanion.status === 'ACTIVE'
                      ? 'Langsung aktif mendampingimu!'
                      : 'Tersimpan di Koleksi Pendamping.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseVictoryOrEscape}
                className="min-h-[50px] px-6 py-2.5 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-sm font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                Lanjutkan Eksplorasi
              </button>
            </div>
          ) : combat.turn === 'VICTORY' || combat.turn === 'ESCAPED' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="text-xs text-[#C7C2B6]">
                {combat.rewardSummary ? (
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>
                      Hadiah:{' '}
                      <strong className="text-[#E5B85A]">
                        +{combat.rewardSummary.expGained} EXP
                      </strong>
                      {Boolean(combat.rewardSummary.goldGained) && (
                        <strong className="text-[#FFD166]">
                          {' '}
                          · +{combat.rewardSummary.goldGained} Emas
                        </strong>
                      )}
                      {combat.rewardSummary.leveledUp &&
                        ` · Naik Level ${combat.rewardSummary.newLevel}!`}
                    </span>
                    {combat.rewardSummary.drops.length > 0 && (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span>· Rampasan:</span>
                        {combat.rewardSummary.drops.map((d, idx) => (
                          <span
                            key={`${d.itemId}_${idx}`}
                            className="font-semibold"
                            style={{ color: LOOT_RARITY_COLORS[d.rarity] }}
                          >
                            {d.quantity}x {ITEMS[d.itemId].name}
                            {idx < combat.rewardSummary!.drops.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                ) : (
                  <span>Kamu berhasil menghindar dari pertempuran.</span>
                )}
              </div>
              <button
                type="button"
                onClick={onCloseVictoryOrEscape}
                className="min-h-[50px] px-6 py-2.5 rounded-lg bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-sm font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                Lanjutkan Eksplorasi
              </button>
            </div>
          ) : combat.turn === 'DEFEAT' ? (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onDefeatContinue}
                className="min-h-[50px] px-6 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#B83335] text-white text-sm font-bold cursor-pointer"
              >
                Lihat Catatan Kematian
              </button>
            </div>
          ) : combat.turn === 'COMPANION' && player.companion?.active ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[#0D0F10] border border-[#C89B3C]/70 flex items-center justify-center">
                    <AnimalPortrait species={player.companion.species} size={36} />
                  </div>
                  <div className="text-xs font-bold text-[#F5E6C4] truncate">
                    Giliran {player.companion.name} ·{' '}
                    <span style={{ color: ROLE_META[player.companion.role].color }}>
                      {ROLE_META[player.companion.role].label}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-[#9BA3AB] hidden sm:inline">
                  Pilih keahlian pendamping untuk giliran ini
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {getCompanionActions(player.companion).map((act) => {
                  const cd = combat.companionCooldowns?.[act.id] ?? 0;
                  const disabled = cd > 0;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onCompanionAction(act.id)}
                      className="min-h-[54px] p-2.5 rounded-lg bg-[#1C2024] hover:bg-[#262B31] disabled:opacity-45 border border-[#3A4046] hover:border-[#C89B3C] text-left flex flex-col justify-between gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F5E6C4] truncate">
                          {act.name}
                        </span>
                        <span className="text-[11px] font-mono-num shrink-0">
                          {cd > 0 ? (
                            <span className="text-[#E5989B]">Cooldown {cd}g</span>
                          ) : (
                            <span className="text-[#E5B85A]">{act.effectLabel}</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9BA3AB] leading-snug">
                        {act.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : subPanel === 'COMPANION_INFO' && player.companion ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#E5B85A]">
                  Status Pendamping Aktif
                </span>
                <button
                  type="button"
                  onClick={() => setSubPanel('MAIN')}
                  className="min-h-[42px] px-3.5 py-1.5 rounded bg-[#1C2024] border border-[#3A4046] text-xs font-semibold text-[#F5E6C4] cursor-pointer"
                >
                  Kembali ke Aksi
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181C20] border border-[#2A3036] flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#0D0F10] border border-[#C89B3C]/60 flex items-center justify-center shrink-0">
                  <AnimalPortrait species={player.companion.species} size={42} />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-bold text-[#F5E6C4]">
                    {player.companion.name} (Lv.{player.companion.level}) ·{' '}
                    <span style={{ color: ROLE_META[player.companion.role].color }}>
                      {ROLE_META[player.companion.role].label}
                    </span>
                  </div>
                  <div className="text-[#9BA3AB] mt-0.5">
                    {player.companion.abilityName}: {player.companion.abilityDescription}
                  </div>
                </div>
              </div>
            </div>
          ) : subPanel === 'FEED' && combat.enemy.animalSpecies ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#FFD166]">
                  Beri Makan {combat.enemy.name} (
                  {DIET_LABELS[COMPANION_SPECIES_CONFIG[combat.enemy.animalSpecies].diet]})
                </div>
                <button
                  type="button"
                  onClick={() => setSubPanel('MAIN')}
                  className="min-h-[42px] px-3.5 py-1.5 rounded bg-[#1C2024] border border-[#3A4046] text-xs font-semibold text-[#F5E6C4] cursor-pointer whitespace-nowrap"
                >
                  Kembali ke Aksi
                </button>
              </div>
              {ownedPetFoods.length === 0 ? (
                <div className="text-xs text-[#E5989B] py-2">
                  Tidak ada makanan di tas. Cari beri, sayur, jamur, daging, atau ikan untuk menjinakkan satwa!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[30vh] overflow-y-auto ember-scroll pr-1">
                  {ownedPetFoods.map((foodId) => {
                    const prob = calculateTameProbability(
                      combat.enemy.animalSpecies!,
                      enemyHpRatio,
                      foodId,
                      player
                    );
                    const matchLabel =
                      prob.dietMatch === 'PREFERRED'
                        ? 'Sangat Disukai'
                        : prob.dietMatch === 'MATCH'
                        ? 'Cocok'
                        : 'Kurang Suka';
                    const matchColor =
                      prob.dietMatch === 'PREFERRED'
                        ? 'text-[#FFD166]'
                        : prob.dietMatch === 'MATCH'
                        ? 'text-[#8FC79A]'
                        : 'text-[#E5989B]';

                    return (
                      <button
                        key={foodId}
                        type="button"
                        disabled={!isPlayerTurn}
                        onClick={() => {
                          setSubPanel('MAIN');
                          onTameAttempt(foodId);
                        }}
                        className="min-h-[54px] p-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] hover:border-[#C89B3C] flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded bg-[#0D0F10] border border-[#2A3036] flex items-center justify-center shrink-0">
                            <ItemPixelIcon itemId={foodId} size={34} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#F5E6C4] truncate">
                              {ITEMS[foodId].name} (x{player.inventory[foodId]})
                            </div>
                            <div className={`text-[10px] ${matchColor}`}>
                              {matchLabel}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono-num font-bold text-[#FFD166] shrink-0">
                          {prob.chance}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : subPanel === 'SKILLS' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#E5B85A]">
                  Keahlian Kelas — {playerClass.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSubPanel('MAIN')}
                  className="min-h-[42px] px-3.5 py-1.5 rounded bg-[#1C2024] border border-[#3A4046] text-xs font-semibold text-[#F5E6C4] cursor-pointer"
                >
                  Kembali ke Aksi
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto ember-scroll pr-1">
                {playerClass.skills.map((skill) => {
                  const cd = combat.skillCooldowns[skill.id] ?? 0;
                  const enoughResource = player.mana >= skill.cost;
                  const disabled = !isPlayerTurn || cd > 0 || !enoughResource;
                  const elemMeta = ELEMENT_BADGE_LABELS[skill.element];

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSubPanel('MAIN');
                        onUseSkill(skill.id);
                      }}
                      className="min-h-[58px] p-2.5 rounded-lg bg-[#1C2024] hover:bg-[#262B31] disabled:opacity-45 border border-[#3A4046] hover:border-[#C89B3C] text-left flex flex-col justify-between gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F5E6C4]">
                          {skill.name}
                        </span>
                        <span className="text-[11px] font-mono-num shrink-0">
                          {cd > 0 ? (
                            <span className="text-[#E5989B]">Cooldown {cd}g</span>
                          ) : (
                            <span className={elemMeta.color}>
                              {elemMeta.label} · {skill.cost} MP
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9BA3AB] leading-snug">
                        {skill.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : subPanel === 'ITEMS' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5E6C4]">
                  Pilih Barang Pertarungan
                </span>
                <button
                  type="button"
                  onClick={() => setSubPanel('MAIN')}
                  className="min-h-[42px] px-3.5 py-1.5 rounded bg-[#1C2024] border border-[#3A4046] text-xs font-semibold text-[#F5E6C4] cursor-pointer"
                >
                  Kembali ke Aksi
                </button>
              </div>
              {combatItems.length === 0 ? (
                <div className="text-xs text-[#8F969E] py-2">
                  Tidak ada barang yang bisa dipakai saat bertarung.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[30vh] overflow-y-auto ember-scroll pr-1">
                  {combatItems.map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={!isPlayerTurn}
                      onClick={() => {
                        setSubPanel('MAIN');
                        onUseItem(id);
                      }}
                      className="min-h-[54px] p-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] hover:border-[#C89B3C] flex items-center gap-2.5 text-left cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-11 h-11 rounded bg-[#0D0F10] border border-[#2A3036] flex items-center justify-center shrink-0">
                        <ItemPixelIcon itemId={id} size={38} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#F5E6C4] truncate">
                          {ITEMS[id].name}
                        </div>
                        <div className="text-[11px] font-mono-num text-[#E5B85A]">
                          Stok: {player.inventory[id]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onQuickAttack}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-gradient-to-b from-[#9E2E2F] to-[#7A1E1F] hover:brightness-110 disabled:opacity-45 border border-[#E5534B]/40 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Sword className="w-4 h-4 shrink-0" />
                  <span className="truncate">Serang Cepat</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-90 shrink-0">0 MP</span>
              </button>

              <button
                type="button"
                disabled={
                  !isPlayerTurn ||
                  player.stamina < (player.classId === 'rogue' ? 12 : 16)
                }
                onClick={onHeavyAttack}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-gradient-to-b from-[#C85640] to-[#943625] hover:brightness-110 disabled:opacity-45 border border-[#FF8A50]/40 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span className="truncate">Serang Berat</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-90 shrink-0">
                  {player.classId === 'rogue' ? '12' : '16'} STM
                </span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={() => setSubPanel('SKILLS')}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-[#3A2859] hover:bg-[#4D3675] border border-[#9D6CE0]/55 disabled:opacity-45 text-[#F5E6C4] text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#E5B85A]" />
                  <span className="truncate">Keahlian</span>
                </span>
                <span className="text-[10px] font-mono-num text-[#E5B85A] shrink-0">2</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onDefend}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-[#264E63] hover:bg-[#31647E] border border-[#7EC4E0]/35 disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="truncate">Bertahan</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-90 shrink-0">+STM</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onDodge}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-[#264D34] hover:bg-[#326343] border border-[#8FC79A]/35 disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Wind className="w-4 h-4 shrink-0" />
                  <span className="truncate">Menghindar</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-90 shrink-0">12 STM</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={() => setSubPanel('ITEMS')}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-[#3C3429] hover:bg-[#4E4335] border border-[#C89B3C]/45 disabled:opacity-45 text-[#F5E6C4] text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Backpack className="w-4 h-4 shrink-0 text-[#C89B3C]" />
                  <span className="truncate">Barang</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-90 shrink-0">
                  {combatItems.length}
                </span>
              </button>

              {combat.enemy.tameEligible ? (
                <button
                  type="button"
                  disabled={!isPlayerTurn || !canTameNow}
                  onClick={() => setSubPanel('FEED')}
                  title={
                    canTameNow
                      ? 'Beri makan untuk menjinakkan satwa ini'
                      : 'Lemahkan HP musuh hingga <= 45% untuk menjinakkan'
                  }
                  className={`min-h-[52px] px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    canTameNow
                      ? 'bg-[#264D34] hover:bg-[#326343] border-[#8FC79A] text-white'
                      : 'bg-[#1C2024] border-[#3A4046] text-[#9BA3AB]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Heart className="w-4 h-4 shrink-0 text-[#FFD166]" />
                    <span className="truncate">Jinakkan</span>
                  </span>
                  <span className="text-[10px] font-mono-num shrink-0">
                    {canTameNow ? `${ownedPetFoods.length}` : '<=45%'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!player.companion}
                  onClick={() => setSubPanel('COMPANION_INFO')}
                  className="min-h-[52px] px-3 py-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] disabled:opacity-45 text-[#E6E2D8] text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <PawPrint className="w-4 h-4 shrink-0 text-[#FFD166]" />
                    <span className="truncate">Pendamping</span>
                  </span>
                  <span className="text-[10px] font-mono-num text-[#8FC79A] shrink-0">
                    {player.companion ? 'Aktif' : '-'}
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onEscape}
                className="min-h-[52px] px-3 py-2 rounded-lg bg-[#22272B] hover:bg-[#2F353B] border border-[#3A4046] disabled:opacity-45 text-[#E6E2D8] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Footprints className="w-4 h-4 shrink-0" />
                <span>Kabur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Combat Log Drawer Modal (keeps main battle layout uncluttered) */}
      {showLogDrawer && (
        <div className="fixed inset-0 z-50 bg-[#080A0C]/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[75dvh] bg-[#14171A] border border-[#3A4046] rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0F1215] border-b border-[#252A2E] flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5E6C4]">
                Catatan Pertarungan
              </span>
              <button
                type="button"
                onClick={() => setShowLogDrawer(false)}
                className="min-h-[40px] min-w-[40px] rounded bg-[#1C2024] border border-[#3A4046] flex items-center justify-center cursor-pointer"
                aria-label="Tutup Catatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto ember-scroll p-4 space-y-1.5 text-xs">
              {combat.log.map((entry, idx) => (
                <div
                  key={idx}
                  className={
                    idx === combat.log.length - 1
                      ? 'text-[#F5E6C4] font-semibold'
                      : 'text-[#9BA3AB]'
                  }
                >
                  • {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
