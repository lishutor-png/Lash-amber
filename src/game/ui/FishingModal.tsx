import React, { useEffect, useRef, useState } from 'react';
import { Anchor, Fish, Sparkles, X } from 'lucide-react';
import { LOOT_RARITY_COLORS, LOOT_RARITY_LABELS } from '../combat/lootSystem';
import { soundEngine } from '../core/audio';
import { PlayerState } from '../core/types';
import {
  FishCatchResult,
  WaterSpotType,
  rollFishingCatch,
} from '../fishing/fishingSystem';
import { ItemPixelIcon } from './PixelPortrait';

interface FishingModalProps {
  player: PlayerState;
  waterSpot: WaterSpotType;
  timePhase: string;
  onCatchFish: (result: FishCatchResult, usedBait: boolean) => void;
  onClose: () => void;
}

type FishingPhase =
  | 'READY'
  | 'CASTING'
  | 'WAITING'
  | 'BITING'
  | 'REELING'
  | 'RESULT'
  | 'ESCAPED';

export const FishingModal: React.FC<FishingModalProps> = ({
  player,
  waterSpot,
  timePhase,
  onCatchFish,
  onClose,
}) => {
  const baitOwned = player.inventory.umpan_pancing ?? 0;
  const [useBait, setUseBait] = useState(baitOwned > 0);
  const [phase, setPhase] = useState<FishingPhase>('READY');
  const [progress, setProgress] = useState(20);
  const [markerPos, setMarkerPos] = useState(50);
  const [zoneStart, setZoneStart] = useState(34);
  const [caughtResult, setCaughtResult] = useState<FishCatchResult | null>(null);
  const [hintText, setHintText] = useState('Lempar kail ke air jernih untuk mulai memancing.');

  const waterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const markerPosRef = useRef(50);
  const dirRef = useRef(1);
  const zoneStartRef = useRef(34);
  const zoneWidth = 28;
  const phaseRef = useRef<FishingPhase>(phase);
  phaseRef.current = phase;

  const hasLuckCompanion =
    player.companion?.active && player.companion.role === 'LUCK_SUPPORT';

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Pixel water scene animation loop
  useEffect(() => {
    let rafId = 0;
    const renderWaterPreview = (now: number) => {
      const canvas = waterCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#0D1C24';
          ctx.fillRect(0, 0, w, h);

          // Layered water depth stripes
          ctx.fillStyle = waterSpot === 'RIVER' ? '#173A4A' : '#14333C';
          ctx.fillRect(0, 14, w, h - 14);
          ctx.fillStyle = waterSpot === 'RIVER' ? '#1E4C61' : '#19424E';
          ctx.fillRect(0, 32, w, h - 42);

          // Animated pixel ripples
          const t = now * 0.0025;
          for (let i = 0; i < 8; i++) {
            const rx = Math.round(((i * 38 + t * (waterSpot === 'RIVER' ? 28 : 10)) % (w + 30)) - 20);
            const ry = 22 + ((i * 19) % Math.max(24, h - 34));
            ctx.fillStyle = '#4D8FAC';
            ctx.fillRect(rx, ry, 16, 2);
          }

          // Shoreline reeds on left edge
          ctx.fillStyle = '#2B5338';
          ctx.fillRect(0, 0, 26, h);
          ctx.fillStyle = '#447A54';
          ctx.fillRect(14, 10, 4, 24);
          ctx.fillRect(20, 20, 4, 26);

          // Fishing line & bobber
          if (phaseRef.current !== 'READY') {
            const bobOffset =
              phaseRef.current === 'BITING'
                ? Math.sin(now * 0.03) * 4
                : Math.sin(now * 0.005) * 1.5;
            const bx = Math.round(w * 0.62);
            const by = Math.round(h * 0.56 + bobOffset);

            ctx.strokeStyle = '#C7C2B6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(22, 8);
            ctx.lineTo(bx, by - 4);
            ctx.stroke();

            // Bobber pixel sprite
            ctx.fillStyle = '#E5E5E5';
            ctx.fillRect(bx - 4, by - 4, 8, 4);
            ctx.fillStyle = '#D64541';
            ctx.fillRect(bx - 4, by, 8, 5);

            // Ripple rings around bobber
            const ringR =
              phaseRef.current === 'BITING'
                ? 8 + Math.round(((now * 0.04) % 14))
                : 6 + Math.round(((now * 0.015) % 10));
            ctx.strokeStyle =
              phaseRef.current === 'BITING' ? '#FFD166' : 'rgba(126, 196, 224, 0.55)';
            ctx.strokeRect(bx - ringR, by - 2, ringR * 2, 7);
          }
        }
      }
      rafId = window.requestAnimationFrame(renderWaterPreview);
    };
    rafId = window.requestAnimationFrame(renderWaterPreview);
    return () => window.cancelAnimationFrame(rafId);
  }, [waterSpot]);

  // Reeling tension slider animation
  useEffect(() => {
    if (phase !== 'REELING') return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const speed = 112 + Math.min(35, (player.fishingSkillLevel ?? 1) * 4);
      let nextPos = markerPosRef.current + dirRef.current * speed * dt;
      if (nextPos >= 96) {
        nextPos = 96;
        dirRef.current = -1;
      } else if (nextPos <= 4) {
        nextPos = 4;
        dirRef.current = 1;
      }
      markerPosRef.current = nextPos;
      setMarkerPos(nextPos);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [phase, player.fishingSkillLevel]);

  const handleCast = () => {
    clearTimers();
    soundEngine.playGather('WATER');
    setCaughtResult(null);
    setProgress(24);
    setPhase('CASTING');
    setHintText('Kail dilempar ke perairan...');

    timerRef.current = window.setTimeout(() => {
      setPhase('WAITING');
      setHintText('Menunggu ikan mendekati umpan...');

      const waitMs = 1200 + Math.round(Math.random() * 1400);
      timerRef.current = window.setTimeout(() => {
        soundEngine.playEncounter();
        setPhase('BITING');
        setHintText('Ada tarikan kuat! Segera tarik kail!');

        timerRef.current = window.setTimeout(() => {
          if (phaseRef.current === 'BITING') {
            soundEngine.playClick();
            setPhase('ESCAPED');
            setHintText('Terlambat menarik! Ikan lepas dari kail.');
          }
        }, 2300);
      }, waitMs);
    }, 450);
  };

  const handleBiteStrike = () => {
    if (phase !== 'BITING') return;
    clearTimers();
    soundEngine.playClick();
    const initialZone = 22 + Math.floor(Math.random() * 44);
    zoneStartRef.current = initialZone;
    setZoneStart(initialZone);
    markerPosRef.current = 10;
    dirRef.current = 1;
    setProgress(26);
    setPhase('REELING');
    setHintText('Tekan Sentak Kail saat jarum berada di zona hijau!');
  };

  const handleReelStrike = () => {
    if (phase !== 'REELING') return;
    const pos = markerPosRef.current;
    const zStart = zoneStartRef.current;
    const inZone = pos >= zStart && pos <= zStart + zoneWidth;

    if (inZone) {
      soundEngine.playGather('WATER');
      const nextProg = Math.min(100, progress + 36);
      setProgress(nextProg);

      // Shift sweet spot slightly for the next tug
      const nextZone = 14 + Math.floor(Math.random() * 56);
      zoneStartRef.current = nextZone;
      setZoneStart(nextZone);

      if (nextProg >= 100) {
        const usedActualBait = useBait && baitOwned > 0;
        const result = rollFishingCatch(waterSpot, usedActualBait, timePhase, player);
        soundEngine.playVictory();
        setCaughtResult(result);
        setPhase('RESULT');
        setHintText(`Berhasil menangkap ${result.name}!`);
        onCatchFish(result, usedActualBait);
      } else {
        setHintText('Tepat sasaran! Terus tarik!');
      }
    } else {
      soundEngine.playClick();
      const nextProg = progress - 16;
      if (nextProg <= 0) {
        setProgress(0);
        setPhase('ESCAPED');
        setHintText('Tali terlalu tegang — ikan berhasil lolos.');
      } else {
        setProgress(nextProg);
        setHintText('Meleset dari zona hijau! Fokus pada irama!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0D0F10]/88 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-[#14171A] border border-[#3A4046] rounded shadow-2xl overflow-hidden flex flex-col">
        <header className="px-4 py-2.5 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Fish className="w-4 h-4 text-[#7EC4E0]" />
            <h2 className="font-display text-sm sm:text-base font-bold text-[#F5E6C4]">
              Memancing — {waterSpot === 'RIVER' ? 'Aliran Sungai Hutan' : 'Kolam Hutan'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Memancing"
            className="min-h-[38px] min-w-[38px] rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          {/* Top Stats Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
            <div className="flex items-center gap-3 text-[#C7C2B6]">
              <span>Skill Pancing Lv.{player.fishingSkillLevel}</span>
              <span>·</span>
              <span>Total Tangkapan: {player.fishCaught}</span>
              <span>·</span>
              <span className="text-[#7EC4E0]">{timePhase}</span>
            </div>
            {hasLuckCompanion && (
              <span className="inline-flex items-center gap-1 text-[#FFD166] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tuah {player.companion?.name} aktif</span>
              </span>
            )}
          </div>

          {/* Pixel Water Stage */}
          <div className="relative rounded border border-[#2A3036] overflow-hidden bg-[#0D1C24]">
            <canvas
              ref={waterCanvasRef}
              width={480}
              height={130}
              className="w-full h-[126px] block pixelated"
            />
            {phase === 'BITING' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-1.5 rounded bg-[#C89B3C] text-[#0D0F10] font-display font-bold text-sm shadow-lg animate-bounce">
                  ! IKAN MENGGIGIT !
                </div>
              </div>
            )}
          </div>

          {/* Reeling Timing Bar */}
          {phase === 'REELING' && (
            <div className="p-3 rounded bg-[#0D0F10] border border-[#2A3036] space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono-num text-[#9BA3AB]">
                  <span>Zona Tarikan Kail</span>
                  <span>Kemajuan: {progress}%</span>
                </div>
                <div className="relative h-5 rounded bg-[#1A1F24] border border-[#3A4046] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 bg-[#264D34] border-x border-[#8FC79A]"
                    style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-[#FFD166] shadow"
                    style={{ left: `calc(${markerPos}% - 3px)` }}
                  />
                </div>
              </div>

              <div className="h-2 rounded bg-[#1A1F24] overflow-hidden">
                <div
                  className="h-full bg-[#7EC4E0] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Card */}
          {phase === 'RESULT' && caughtResult && (
            <div className="p-3 rounded bg-[#112419]/75 border border-[#8FC79A]/60 flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center">
                <ItemPixelIcon itemId={caughtResult.itemId} size={34} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-bold truncate"
                  style={{ color: LOOT_RARITY_COLORS[caughtResult.rarity] }}
                >
                  {caughtResult.name} ({LOOT_RARITY_LABELS[caughtResult.rarity]})
                </div>
                <div className="text-xs font-mono-num text-[#C7C2B6] mt-0.5">
                  Ukuran: {caughtResult.sizeCm} cm · +{caughtResult.exp} EXP
                </div>
                {caughtResult.isPoisonous && (
                  <div className="text-[11px] text-[#E5989B] mt-0.5">
                    Awas beracun jika dimakan mentah — olah menjadi Ramuan Racun!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Message & Bait Option */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#F5E6C4]">{hintText}</div>

            {(phase === 'READY' || phase === 'RESULT' || phase === 'ESCAPED') && (
              <label className="inline-flex items-center gap-2 text-xs text-[#C7C2B6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBait && baitOwned > 0}
                  disabled={baitOwned <= 0}
                  onChange={(e) => setUseBait(e.target.checked)}
                  className="accent-[#C89B3C]"
                />
                <span>
                  Pakai Umpan ({baitOwned})
                </span>
              </label>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {(phase === 'READY' || phase === 'RESULT' || phase === 'ESCAPED') && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E6E2D8] cursor-pointer whitespace-nowrap"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCast}
                  className="min-h-[44px] px-5 py-2 rounded bg-[#264E63] hover:bg-[#31647E] border border-[#7EC4E0]/70 text-xs font-bold text-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Anchor className="w-4 h-4 shrink-0" />
                  <span>{phase === 'READY' ? 'Lempar Kail' : 'Pancing Lagi'}</span>
                </button>
              </>
            )}

            {(phase === 'CASTING' || phase === 'WAITING') && (
              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  setPhase('READY');
                  setHintText('Kail ditarik kembali.');
                }}
                className="min-h-[44px] px-4 py-2 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E6E2D8] cursor-pointer whitespace-nowrap"
              >
                Tarik Kail
              </button>
            )}

            {phase === 'BITING' && (
              <button
                type="button"
                onClick={handleBiteStrike}
                className="w-full min-h-[48px] px-5 py-2 rounded bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-sm font-bold cursor-pointer animate-pulse"
              >
                Tarik Sekarang!
              </button>
            )}

            {phase === 'REELING' && (
              <button
                type="button"
                onClick={handleReelStrike}
                className="w-full min-h-[48px] px-5 py-2 rounded bg-[#264D34] hover:bg-[#326343] border border-[#8FC79A] text-white text-sm font-bold cursor-pointer"
              >
                Sentak Kail!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
