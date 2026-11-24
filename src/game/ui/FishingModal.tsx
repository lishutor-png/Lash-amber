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

  // HD 2D Illustrated water scene animation loop
  useEffect(() => {
    let rafId = 0;
    const renderWaterPreview = (now: number) => {
      const canvas = waterCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          const w = canvas.width;
          const h = canvas.height;

          // Deep twilight water gradient
          const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
          if (waterSpot === 'RIVER') {
            skyGrad.addColorStop(0, '#0B1821');
            skyGrad.addColorStop(0.22, '#133546');
            skyGrad.addColorStop(0.68, '#1A4B60');
            skyGrad.addColorStop(1, '#0E2936');
          } else {
            skyGrad.addColorStop(0, '#09161D');
            skyGrad.addColorStop(0.25, '#112E37');
            skyGrad.addColorStop(0.7, '#18424D');
            skyGrad.addColorStop(1, '#0C242B');
          }
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, w, h);

          // Soft misty moonlight reflection on water surface
          const shimmerGrad = ctx.createRadialGradient(w * 0.62, h * 0.25, 8, w * 0.62, h * 0.35, w * 0.42);
          shimmerGrad.addColorStop(0, 'rgba(216, 232, 240, 0.18)');
          shimmerGrad.addColorStop(0.5, 'rgba(110, 178, 206, 0.08)');
          shimmerGrad.addColorStop(1, 'rgba(13, 28, 36, 0)');
          ctx.fillStyle = shimmerGrad;
          ctx.fillRect(0, 0, w, h);

          // Smooth flowing wave ribbons
          const t = now * 0.0022;
          for (let i = 0; i < 7; i++) {
            const flowSpeed = waterSpot === 'RIVER' ? 32 : 10;
            const rx = ((i * 76 + t * flowSpeed) % (w + 90)) - 60;
            const ry = 26 + ((i * 15) % Math.max(28, h - 38));
            const waveLen = 36 + (i % 3) * 14;
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(136, 204, 230, 0.32)' : 'rgba(94, 162, 192, 0.22)';
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.quadraticCurveTo(
              rx + waveLen * 0.5,
              ry + Math.sin(t + i) * 2.2,
              rx + waveLen,
              ry
            );
            ctx.stroke();
          }

          // Organic mossy riverbank & swaying cattail reeds on the left
          const bankGrad = ctx.createLinearGradient(0, 0, 44, 0);
          bankGrad.addColorStop(0, '#1A3322');
          bankGrad.addColorStop(0.7, '#284C34');
          bankGrad.addColorStop(1, 'rgba(28, 56, 38, 0)');
          ctx.fillStyle = bankGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(36, 0);
          ctx.quadraticCurveTo(44, h * 0.45, 28, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();

          const sway = Math.sin(now * 0.0025) * 3;
          const reedSpecs = [
            { bx: 10, topX: 16 + sway, topY: 16, hasCattail: true },
            { bx: 18, topX: 25 + sway * 1.1, topY: 22, hasCattail: false },
            { bx: 24, topX: 30 + sway * 0.9, topY: 32, hasCattail: true },
          ];
          reedSpecs.forEach((r) => {
            ctx.strokeStyle = '#4C865A';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(r.bx, h);
            ctx.quadraticCurveTo(r.bx + 2, h * 0.55, r.topX, r.topY);
            ctx.stroke();
            if (r.hasCattail) {
              ctx.fillStyle = '#5B3A24';
              ctx.beginPath();
              ctx.ellipse(r.topX, r.topY + 6, 2.6, 6, 0.12, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          // Curved fishing line & shaded round bobber
          if (phaseRef.current !== 'READY') {
            const bobOffset =
              phaseRef.current === 'BITING'
                ? Math.sin(now * 0.032) * 4.5
                : Math.sin(now * 0.0045) * 1.8;
            const bx = w * 0.62;
            const by = h * 0.58 + bobOffset;

            ctx.strokeStyle = 'rgba(225, 222, 212, 0.78)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(24, 6);
            ctx.quadraticCurveTo(bx * 0.56, by * 0.78, bx, by - 5);
            ctx.stroke();

            // Concentric smooth water ripple ellipses around bobber
            const maxRing = phaseRef.current === 'BITING' ? 28 : 18;
            for (let ring = 0; ring < 2; ring++) {
              const phaseShift = ((now * (phaseRef.current === 'BITING' ? 0.045 : 0.016) + ring * 10) % maxRing);
              const alpha = Math.max(0, 1 - phaseShift / maxRing) * (phaseRef.current === 'BITING' ? 0.85 : 0.45);
              ctx.strokeStyle =
                phaseRef.current === 'BITING'
                  ? `rgba(255, 209, 102, ${alpha})`
                  : `rgba(126, 196, 224, ${alpha})`;
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.ellipse(bx, by + 2, 7 + phaseShift, 3 + phaseShift * 0.34, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Shaded oval bobber
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(bx, by, 5.5, 6.5, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = '#F2EFE9';
            ctx.fillRect(bx - 7, by - 7, 14, 7);
            ctx.fillStyle = '#D64541';
            ctx.fillRect(bx - 7, by, 14, 8);
            ctx.restore();

            ctx.strokeStyle = '#1E1612';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.ellipse(bx, by, 5.5, 6.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Specular dot
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.beginPath();
            ctx.arc(bx - 1.8, by - 2.4, 1.4, 0, Math.PI * 2);
            ctx.fill();
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
            className="min-h-[44px] min-w-[44px] rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
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

          {/* HD 2D Illustrated Water Stage */}
          <div className="relative rounded-lg border border-[#2A3036] overflow-hidden bg-[#0D1C24]">
            <canvas
              ref={waterCanvasRef}
              width={480}
              height={130}
              className="w-full h-[126px] block illustrated-canvas"
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
            <div className="p-3 rounded-lg bg-[#112419]/80 border border-[#8FC79A]/65 flex items-center gap-3.5">
              <div className="w-16 h-16 shrink-0 rounded-lg bg-[#0D0F10] border border-[#3A4046] flex items-center justify-center">
                <ItemPixelIcon itemId={caughtResult.itemId} size={48} />
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
          <div className="flex items-center justify-end gap-2.5 pt-1">
            {(phase === 'READY' || phase === 'RESULT' || phase === 'ESCAPED') && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] px-5 py-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-bold text-[#E6E2D8] cursor-pointer whitespace-nowrap"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCast}
                  className="min-h-[48px] px-5 py-2 rounded-lg bg-[#264E63] hover:bg-[#31647E] border border-[#7EC4E0]/75 text-sm font-bold text-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
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
                className="min-h-[48px] px-5 py-2 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-bold text-[#E6E2D8] cursor-pointer whitespace-nowrap"
              >
                Tarik Kail
              </button>
            )}

            {phase === 'BITING' && (
              <button
                type="button"
                onClick={handleBiteStrike}
                className="w-full min-h-[54px] px-5 py-2.5 rounded-xl bg-[#C89B3C] hover:bg-[#E5B85A] text-[#0D0F10] text-base font-bold cursor-pointer animate-pulse"
              >
                Tarik Sekarang!
              </button>
            )}

            {phase === 'REELING' && (
              <button
                type="button"
                onClick={handleReelStrike}
                className="w-full min-h-[54px] px-5 py-2.5 rounded-xl bg-[#264D34] hover:bg-[#326343] border border-[#8FC79A] text-white text-base font-bold cursor-pointer"
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
