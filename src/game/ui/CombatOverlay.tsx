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
  const [subPanel, setSubPanel] = useState<'MAIN' | 'SKILLS' | 'ITEMS' | 'FEED'>('MAIN');
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
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
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

  const renderIntentIcon = () => {
    if (combat.enemy.isStaggered) {
      return <Zap className="w-4 h-4 text-[#FFE066]" />;
    }
    switch (combat.enemy.intent) {
      case 'HEAVY_ATTACK':
        return <AlertTriangle className="w-4 h-4 text-[#E5534B]" />;
      case 'DEFENSIVE_STANCE':
        return <Shield className="w-4 h-4 text-[#7EC4E0]" />;
      case 'PREPARE_ATTACK':
        return <Flame className="w-4 h-4 text-[#FF8A50]" />;
      default:
        return <Sword className="w-4 h-4 text-[#E5B85A]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/90 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[96dvh] bg-[#14171A] border border-[#3A4046] rounded shadow-2xl overflow-hidden flex flex-col">
        {/* Top Battle Header */}
        <div className="shrink-0 px-3.5 py-2 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-2">
          <div className="text-xs font-semibold tracking-wide text-[#E5B85A]">
            Pertarungan Giliran · Putaran {combat.turnCount}
          </div>
          <div className="text-xs font-mono-num text-[#F5E6C4]">
            {combat.turn === 'PLAYER' && 'Giliranmu — Pilih Taktik'}
            {combat.turn === 'COMPANION' && 'Giliran Pendamping — Pilih Aksi'}
            {combat.turn === 'ENEMY' && 'Musuh Bertindak...'}
            {combat.turn === 'VICTORY' && 'Kemenangan!'}
            {combat.turn === 'TAMED' && 'Pendamping Baru Bergabung!'}
            {combat.turn === 'ESCAPED' && 'Berhasil Kabur'}
            {combat.turn === 'DEFEAT' && 'Gugur'}
          </div>
        </div>

        {/* Status Strip: Player Bars (Left) vs Enemy Bars + Intent (Right) */}
        <div className="shrink-0 grid grid-cols-2 gap-2.5 p-2.5 sm:px-4 bg-[#101315] border-b border-[#252A2E]">
          {/* Player Portrait & HP/Stamina/Mana */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded bg-[#0D0F10] border border-[#C89B3C]/60 flex items-center justify-center">
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
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <span className="font-bold text-[#F5E6C4] truncate">
                  {playerClass.name}
                  {player.companion?.active ? ` + ${player.companion.name}` : ''}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  {(combat.companionShieldActive || combat.companionGuardActive || combat.playerWardTurns > 0) && (
                    <span className="font-semibold text-[#7EC4E0]">
                      Perisai
                    </span>
                  )}
                  {combat.playerAtkBuffTurns > 0 && (
                    <span className="font-semibold text-[#FF8A50]">
                      +ATK
                    </span>
                  )}
                  {combat.playerCritBuffTurns > 0 && (
                    <span className="font-semibold text-[#FFD166]">
                      +Kritis
                    </span>
                  )}
                  {combat.playerRegenTurns > 0 && (
                    <span className="font-semibold text-[#8FC79A]">
                      Regen
                    </span>
                  )}
                  <span className="text-xs font-mono-num text-[#E5B85A]">
                    Lv.{player.level}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono-num">
                <div>
                  <div className="flex justify-between text-[#E5989B]">
                    <span>HP</span>
                    <span>{Math.ceil(player.hp)}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D0F10] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#B84A39]" style={{ width: `${hpPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#7EC4E0]">
                    <span>STM</span>
                    <span>{Math.round(player.stamina)}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D0F10] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#4D8FAC]" style={{ width: `${stamPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#B388FF]">
                    <span>MP</span>
                    <span>{Math.round(player.mana)}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D0F10] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#7E57C2]" style={{ width: `${manaPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enemy Portrait, HP & Visible Intent Indicator */}
          <div className="flex items-center gap-2.5 min-w-0 justify-end">
            <div className="min-w-0 flex-1 space-y-1 text-right">
              <div className="flex items-center justify-end gap-2 text-xs">
                {combat.enemy.statusEffects.length > 0 && (
                  <span className="text-[10px] font-mono-num text-[#FF8A50] truncate">
                    {combat.enemy.statusEffects
                      .map((s) =>
                        s.type === 'BURN'
                          ? `Api(${s.turns})`
                          : s.type === 'FROST'
                          ? `Es(${s.turns})`
                          : `Racun(${s.turns})`
                      )
                      .join(' ')}
                  </span>
                )}
                <span className="font-bold text-[#E6E2D8] truncate">
                  {combat.enemy.name}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono-num text-[#E5B85A]">
                  <span>
                    {combat.enemy.tameEligible
                      ? canTameNow
                        ? 'Siap Dijinakkan!'
                        : 'Jinakkan <=45% HP'
                      : 'HP Musuh'}
                  </span>
                  <span>
                    {combat.enemy.hp}/{combat.enemy.maxHp}
                  </span>
                </div>
                <div className="relative h-2 bg-[#0D0F10] rounded-sm overflow-hidden border border-[#252A2E]">
                  <div
                    className={`h-full transition-all duration-150 ${
                      canTameNow ? 'bg-[#8FC79A]' : 'bg-[#C85A32]'
                    }`}
                    style={{ width: `${enemyPct}%` }}
                  />
                  {combat.enemy.tameEligible && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#FFD166]"
                      style={{ left: `${TAME_HP_THRESHOLD * 100}%` }}
                      title="Batas HP Jinak (45%)"
                    />
                  )}
                </div>
              </div>

              {/* Enemy Intent Tactical Indicator */}
              <div
                className="flex items-center justify-end gap-1.5 text-[11px]"
                title={intentInfo.detail}
              >
                {renderIntentIcon()}
                <span className="font-semibold text-[#F5E6C4] truncate">
                  Niat: {intentInfo.label}
                </span>
              </div>
            </div>

            <div className="w-12 h-12 shrink-0 rounded bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center">
              <SkeletonPortrait
                size={44}
                enemyType={combat.enemy.type}
                isGuarding={combat.enemy.isGuarding}
                isPrepared={combat.enemy.isPrepared}
              />
            </div>
          </div>
        </div>

        {/* Center 60fps Animated HD Pixel-Art Combat Stage */}
        <div className="relative flex-1 min-h-[145px] sm:min-h-[190px] bg-[#0D1311]">
          <canvas
            ref={stageCanvasRef}
            className="w-full h-full block pixelated"
          />
          <div className="pointer-events-none absolute top-2 right-2.5 bg-[#0D0F10]/80 border border-[#3A4046]/70 rounded px-2 py-1 text-[10px] text-[#C7C2B6]">
            {intentInfo.detail}
          </div>
        </div>

        {/* Compact Combat Log */}
        <div className="shrink-0 px-3.5 py-1.5 bg-[#0D0F10] border-t border-b border-[#252A2E] h-16 overflow-y-auto ember-scroll space-y-0.5 text-xs">
          {combat.log.map((entry, idx) => (
            <div
              key={idx}
              className={
                idx === combat.log.length - 1
                  ? 'text-[#F5E6C4] font-medium'
                  : 'text-[#8F969E]'
              }
            >
              • {entry}
            </div>
          ))}
        </div>

        {/* Tactical Action Deck */}
        <div className="shrink-0 p-2.5 sm:p-3 bg-[#121517]">
          {combat.turn === 'TAMED' && combat.tamedCompanion ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 shrink-0 rounded bg-[#0D0F10] border border-[#C89B3C] flex items-center justify-center">
                  <AnimalPortrait species={combat.tamedCompanion.species} size={42} />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold text-[#FFD166] truncate">
                    {combat.tamedCompanion.name} ({COMPANION_RARITY_LABELS[combat.tamedCompanion.rarity]}) Dijinakkan!
                  </div>
                  <div className="text-[#C7C2B6] mt-0.5">
                    Peran:{' '}
                    <strong style={{ color: ROLE_META[combat.tamedCompanion.role].color }}>
                      {ROLE_META[combat.tamedCompanion.role].label}
                    </strong>{' '}
                    · {combat.tamedCompanion.abilityName} —{' '}
                    {combat.tamedCompanion.status === 'ACTIVE'
                      ? 'Langsung aktif mendampingimu!'
                      : 'Tersimpan di Koleksi Pendamping (Status > Pendamping).'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseVictoryOrEscape}
                className="min-h-[44px] px-5 py-2 rounded bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                Lanjutkan Eksplorasi
              </button>
            </div>
          ) : combat.turn === 'VICTORY' || combat.turn === 'ESCAPED' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="text-xs text-[#C7C2B6]">
                {combat.rewardSummary ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      Hadiah:{' '}
                      <strong className="text-[#E5B85A]">
                        +{combat.rewardSummary.expGained} EXP
                      </strong>
                      {Boolean(combat.rewardSummary.goldGained) && (
                        <strong className="text-[#FFD166]">
                          {' '}· +{combat.rewardSummary.goldGained} Emas
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
                className="min-h-[44px] px-5 py-2 rounded bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                Lanjutkan Eksplorasi
              </button>
            </div>
          ) : combat.turn === 'DEFEAT' ? (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onDefeatContinue}
                className="min-h-[44px] px-5 py-2 rounded bg-[#9E2A2B] hover:bg-[#B83335] text-white text-xs font-bold cursor-pointer"
              >
                Lihat Catatan Kematian
              </button>
            </div>
          ) : combat.turn === 'COMPANION' && player.companion?.active ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded bg-[#0D0F10] border border-[#C89B3C]/70 flex items-center justify-center">
                    <AnimalPortrait species={player.companion.species} size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F5E6C4] truncate">
                      Giliran {player.companion.name} ·{' '}
                      <span style={{ color: ROLE_META[player.companion.role].color }}>
                        {ROLE_META[player.companion.role].label}
                      </span>
                    </div>
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
                      className="min-h-[54px] p-2.5 rounded bg-[#1C2024] hover:bg-[#262B31] disabled:opacity-45 border border-[#3A4046] hover:border-[#C89B3C] text-left flex flex-col justify-between gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F5E6C4] truncate">
                          {act.name}
                        </span>
                        <span className="text-[10px] font-mono-num shrink-0">
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
          ) : subPanel === 'FEED' && combat.enemy.animalSpecies ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#FFD166]">
                  Beri Makan {combat.enemy.name} ({DIET_LABELS[COMPANION_SPECIES_CONFIG[combat.enemy.animalSpecies].diet]})
                </div>
                <button
                  type="button"
                  onClick={() => setSubPanel('MAIN')}
                  className="text-xs text-[#C89B3C] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Kembali ke Aksi
                </button>
              </div>
              {ownedPetFoods.length === 0 ? (
                <div className="text-xs text-[#E5989B] py-2">
                  Tidak ada makanan di tas. Cari beri, sayur, jamur, daging, atau ikan untuk menjinakkan satwa!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto ember-scroll">
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
                        className="min-h-[48px] p-2 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] hover:border-[#C89B3C] flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemPixelIcon itemId={foodId} size={26} />
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
                  className="text-xs text-[#C89B3C] hover:underline cursor-pointer"
                >
                  Kembali ke Aksi
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="min-h-[54px] p-2.5 rounded bg-[#1C2024] hover:bg-[#262B31] disabled:opacity-45 border border-[#3A4046] hover:border-[#C89B3C] text-left flex flex-col justify-between gap-1 cursor-pointer disabled:cursor-not-allowed"
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
                  className="text-xs text-[#C89B3C] hover:underline cursor-pointer"
                >
                  Kembali ke Aksi
                </button>
              </div>
              {combatItems.length === 0 ? (
                <div className="text-xs text-[#8F969E] py-2">
                  Tidak ada barang yang bisa dipakai saat bertarung.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {combatItems.map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={!isPlayerTurn}
                      onClick={() => {
                        setSubPanel('MAIN');
                        onUseItem(id);
                      }}
                      className="min-h-[46px] p-2 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center gap-2.5 text-left cursor-pointer disabled:opacity-50"
                    >
                      <ItemPixelIcon itemId={id} size={28} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#F5E6C4] truncate">
                          {ITEMS[id].name}
                        </div>
                        <div className="text-[11px] font-mono-num text-[#9BA3AB]">
                          Stok: {player.inventory[id]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onQuickAttack}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#8C2627] hover:bg-[#A83132] disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sword className="w-4 h-4 shrink-0" />
                  <span>Serang Cepat</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-85">0 MP</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn || player.stamina < (player.classId === 'rogue' ? 12 : 16)}
                onClick={onHeavyAttack}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#B84A39] hover:bg-[#CF5744] disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Serang Berat</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-85">
                  {player.classId === 'rogue' ? '12' : '16'} STM
                </span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={() => setSubPanel('SKILLS')}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#3A2859] hover:bg-[#4D3675] border border-[#9D6CE0]/50 disabled:opacity-45 text-[#F5E6C4] text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#E5B85A]" />
                  <span>Keahlian</span>
                </span>
                <span className="text-[10px] font-mono-num text-[#E5B85A]">2</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onDefend}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#264E63] hover:bg-[#31647E] disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Bertahan</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-85">+STM</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={onDodge}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#264D34] hover:bg-[#326343] disabled:opacity-45 text-white text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 shrink-0" />
                  <span>Menghindar</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-85">12 STM</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={() => setSubPanel('ITEMS')}
                className="min-h-[46px] px-3 py-1.5 rounded bg-[#3C3429] hover:bg-[#4E4335] border border-[#C89B3C]/40 disabled:opacity-45 text-[#F5E6C4] text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Backpack className="w-4 h-4 shrink-0 text-[#C89B3C]" />
                  <span>Barang</span>
                </span>
                <span className="text-[10px] font-mono-num opacity-85">
                  {combatItems.length}
                </span>
              </button>

              {combat.enemy.tameEligible ? (
                <>
                  <button
                    type="button"
                    disabled={!isPlayerTurn || !canTameNow}
                    onClick={() => setSubPanel('FEED')}
                    title={
                      canTameNow
                        ? 'Beri makan untuk menjinakkan satwa ini'
                        : 'Lemahkan HP musuh hingga <= 45% untuk menjinakkan'
                    }
                    className={`min-h-[46px] px-3 py-1.5 rounded border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      canTameNow
                        ? 'bg-[#264D34] hover:bg-[#326343] border-[#8FC79A] text-white'
                        : 'bg-[#1C2024] border-[#3A4046] text-[#9BA3AB]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 shrink-0 text-[#FFD166]" />
                      <span>Beri Makan</span>
                    </span>
                    <span className="text-[10px] font-mono-num">
                      {canTameNow ? `${ownedPetFoods.length}` : '<=45%'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!isPlayerTurn}
                    onClick={onEscape}
                    className="min-h-[46px] px-3 py-1.5 rounded bg-[#22272B] hover:bg-[#2F353B] border border-[#3A4046] disabled:opacity-45 text-[#E6E2D8] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Footprints className="w-4 h-4 shrink-0" />
                    <span>Kabur</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={!isPlayerTurn}
                  onClick={onEscape}
                  className="sm:col-span-2 min-h-[46px] px-3 py-1.5 rounded bg-[#22272B] hover:bg-[#2F353B] border border-[#3A4046] disabled:opacity-45 text-[#E6E2D8] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Footprints className="w-4 h-4 shrink-0" />
                  <span>Kabur dari Pertarungan</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

