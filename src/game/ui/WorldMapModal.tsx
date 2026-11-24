import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Crosshair,
  Info,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PlayerState, RegionData, RegionLandmark, TileType, WorldState } from '../core/types';
import { getHazardWarningInfo } from '../survival/survivalSystem';
import { BIOME_CONFIGS } from '../world/biomes';
import {
  REGION_HEIGHT,
  REGION_WIDTH,
  TILE_SIZE,
  generateRegion,
  getRegionExploredCount,
  getRegionInfo,
  getRegionKey,
  isTileExplored,
} from '../world/worldGenerator';

interface WorldMapModalProps {
  world: WorldState;
  player: PlayerState;
  onClose: () => void;
}

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 3.4;

function getMapTileColor(tile: TileType): string {
  switch (tile) {
    case 'CLIFF':
      return '#2F353B';
    case 'TRAIL':
      return '#745E41';
    case 'ROAD':
      return '#9D8766';
    case 'WOOD_FLOOR':
      return '#8B6842';
    case 'WATER':
      return '#387A9B';
    case 'ICE':
      return '#8CC6E3';
    case 'LAVA':
      return '#D9531E';
    case 'SAND':
      return '#C29A5B';
    case 'SNOW':
      return '#C9D7E3';
    case 'ASH':
      return '#3C3230';
    case 'SAVANNA_GRASS':
      return '#7F8137';
    case 'TREE':
      return '#1E462F';
    case 'ROCK':
    case 'RUIN_STONE':
      return '#7C8791';
    case 'PLANT':
      return '#4B7D44';
    case 'CLEARING':
      return '#433A2E';
    case 'FOREST_FLOOR':
      return '#1E3826';
    default:
      return '#284A32';
  }
}

function getLandmarkBadgeStyle(kind: RegionLandmark['kind']): {
  color: string;
  symbol: string;
  label: string;
} {
  switch (kind) {
    case 'TOWN':
      return { color: '#F5E6C4', symbol: 'K', label: 'Kota / Alun-Alun' };
    case 'MERCHANT':
      return { color: '#FFD166', symbol: 'P', label: 'Pedagang' };
    case 'BLACKSMITH':
      return { color: '#FF9F43', symbol: 'B', label: 'Pandai Besi' };
    case 'ALCHEMIST':
      return { color: '#81C784', symbol: 'A', label: 'Alkemis' };
    case 'RARE_TRADER':
      return { color: '#E07BE0', symbol: 'L', label: 'Pedagang Langka' };
    case 'DUNGEON':
      return { color: '#B388FF', symbol: 'D', label: 'Dungeon' };
    case 'CAVE':
      return { color: '#A3B1BD', symbol: 'G', label: 'Gua' };
    case 'BOSS':
      return { color: '#E5534B', symbol: '!', label: 'Sarang Bos' };
    case 'FISHING':
      return { color: '#58D1EB', symbol: '~', label: 'Titik Pancing' };
    case 'WATER':
      return { color: '#7EC4E0', symbol: 'O', label: 'Sumber Air' };
    case 'GOLD_VEIN':
      return { color: '#FFD166', symbol: '*', label: 'Mineral Langka' };
    case 'RUINS':
      return { color: '#C4CDD6', symbol: '#', label: 'Reruntuhan' };
    case 'EXIT':
    default:
      return { color: '#E5B85A', symbol: '>', label: 'Jalur Keluar' };
  }
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  world,
  player,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.35);

  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
    moved: false,
  });

  const BASE_CELL = 3.4;
  const playerWorldTileX = world.currentRegionX * REGION_WIDTH + player.x / TILE_SIZE;
  const playerWorldTileY = world.currentRegionY * REGION_HEIGHT + player.y / TILE_SIZE;

  const [zoom, setZoom] = useState(1.35);
  const [pan, setPan] = useState<{ x: number; y: number }>(() => ({
    x: -playerWorldTileX * BASE_CELL * 1.35,
    y: -playerWorldTileY * BASE_CELL * 1.35,
  }));
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const [selectedRegionKey, setSelectedRegionKey] = useState<string>(
    getRegionKey(world.currentRegionX, world.currentRegionY)
  );

  // Only build RegionData for explored regions (strictly preserves Fog of War)
  const exploredRegionsMap = useMemo(() => {
    const map = new Map<string, RegionData>();
    const keys = new Set<string>(world.exploredRegions);
    keys.add(getRegionKey(world.currentRegionX, world.currentRegionY));

    for (const key of keys) {
      const [rxStr, ryStr] = key.split(',');
      const rx = Number(rxStr);
      const ry = Number(ryStr);
      if (Number.isFinite(rx) && Number.isFinite(ry)) {
        map.set(key, generateRegion(world, rx, ry));
      }
    }
    return map;
  }, [world]);

  const centerOnPlayer = useCallback(
    (targetZoom = zoom) => {
      setPan({
        x: -playerWorldTileX * BASE_CELL * targetZoom,
        y: -playerWorldTileY * BASE_CELL * targetZoom,
      });
    },
    [playerWorldTileX, playerWorldTileY, zoom]
  );

  const applyZoom = useCallback((nextZoomRaw: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));
    setZoom((prevZoom) => {
      const ratio = nextZoom / prevZoom;
      setPan((prevPan) => ({
        x: prevPan.x * ratio,
        y: prevPan.y * ratio,
      }));
      return nextZoom;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#070809';
      ctx.fillRect(0, 0, w, h);

      const cell = BASE_CELL * zoom;
      const originX = w / 2 + pan.x;
      const originY = h / 2 + pan.y;

      const regionW = REGION_WIDTH * cell;
      const regionH = REGION_HEIGHT * cell;

      for (const [key, region] of exploredRegionsMap.entries()) {
        const regLeft = originX + region.rx * regionW;
        const regTop = originY + region.ry * regionH;

        if (regLeft + regionW < 0 || regLeft > w || regTop + regionH < 0 || regTop > h) {
          continue;
        }

        const hasFogMask = Boolean(world.exploredTilesByRegion?.[key]);

        for (let ty = 0; ty < REGION_HEIGHT; ty++) {
          for (let tx = 0; tx < REGION_WIDTH; tx++) {
            const explored = hasFogMask ? isTileExplored(world, key, tx, ty) : false;
            if (!explored) continue;

            ctx.fillStyle = getMapTileColor(region.tiles[ty][tx]);
            ctx.fillRect(
              Math.floor(regLeft + tx * cell),
              Math.floor(regTop + ty * cell),
              Math.ceil(cell),
              Math.ceil(cell)
            );
          }
        }

        // Discovered landmarks in this region
        const landmarks = world.discoveredLandmarksByRegion?.[key] ?? [];
        for (const lm of landmarks) {
          const lx = regLeft + (lm.tileX + 0.5) * cell;
          const ly = regTop + (lm.tileY + 0.5) * cell;
          const badge = getLandmarkBadgeStyle(lm.kind);
          const r = Math.max(4, Math.min(8.5, cell * 1.15));

          if (
            lm.kind === 'TOWN' ||
            lm.kind === 'MERCHANT' ||
            lm.kind === 'BLACKSMITH' ||
            lm.kind === 'ALCHEMIST' ||
            lm.kind === 'RARE_TRADER' ||
            lm.kind === 'DUNGEON' ||
            lm.kind === 'CAVE' ||
            lm.kind === 'BOSS'
          ) {
            ctx.fillStyle = '#0D0F10';
            ctx.beginPath();
            ctx.arc(lx, ly, r + 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = badge.color;
            ctx.beginPath();
            ctx.arc(lx, ly, r, 0, Math.PI * 2);
            ctx.fill();

            if (zoom >= 1.0) {
              ctx.fillStyle = '#0D0F10';
              ctx.font = 'bold 9px ui-monospace, SFMono-Regular, monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(badge.symbol, lx, ly + 0.5);
            }
          } else if (lm.kind === 'EXIT') {
            ctx.fillStyle = badge.color;
            ctx.fillRect(lx - r * 0.65, ly - r * 0.65, r * 1.3, r * 1.3);
          } else if (lm.kind === 'GOLD_VEIN' || lm.kind === 'WATER' || lm.kind === 'FISHING') {
            ctx.fillStyle = badge.color;
            ctx.beginPath();
            ctx.arc(lx, ly, r * 0.65, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = badge.color;
            ctx.fillRect(lx - r * 0.55, ly - r * 0.55, r * 1.1, r * 1.1);
          }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Region outline & label
        const isCurrent =
          region.rx === world.currentRegionX && region.ry === world.currentRegionY;
        const isSelected = key === selectedRegionKey;

        ctx.strokeStyle = isCurrent
          ? 'rgba(229, 184, 90, 0.85)'
          : isSelected
          ? 'rgba(126, 196, 224, 0.78)'
          : 'rgba(155, 163, 171, 0.2)';
        ctx.lineWidth = isCurrent || isSelected ? 1.8 : 1;
        ctx.strokeRect(regLeft, regTop, regionW, regionH);

        if (zoom >= 0.85) {
          const biomeCfg = BIOME_CONFIGS[region.biomeId];
          ctx.fillStyle = isCurrent ? '#E5B85A' : '#A9B1B8';
          ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(biomeCfg.displayName, regLeft + 6, regTop + 13);
          if (zoom >= 1.25) {
            ctx.fillStyle = '#D5CEC0';
            ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(region.subAreaName, regLeft + 6, regTop + 25);
          }
        }
      }

      // Current player marker & beacon ring
      const px = originX + playerWorldTileX * cell;
      const py = originY + playerWorldTileY * cell;

      ctx.strokeStyle = 'rgba(245, 230, 196, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(8, 7.5 * cell * 0.45), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0D0F10';
      ctx.beginPath();
      ctx.arc(px, py, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5E6C4';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#C89B3C';
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [
    exploredRegionsMap,
    pan,
    playerWorldTileX,
    playerWorldTileY,
    selectedRegionKey,
    world,
    zoom,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartZoomRef.current = zoom;
      dragRef.current.dragging = false;
      return;
    }

    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Pinch-to-zoom gesture on touchscreens
    if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const scaleFactor = dist / Math.max(12, pinchStartDistRef.current);
      applyZoom(pinchStartZoomRef.current * scaleFactor);
      return;
    }

    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }
    setPan({
      x: dragRef.current.origPanX + dx,
      y: dragRef.current.origPanY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }

    if (dragRef.current.dragging && !dragRef.current.moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const cell = BASE_CELL * zoom;
      const originX = canvasRef.current.width / 2 + pan.x;
      const originY = canvasRef.current.height / 2 + pan.y;
      const tileX = (clickX - originX) / cell;
      const tileY = (clickY - originY) / cell;
      const rx = Math.floor(tileX / REGION_WIDTH);
      const ry = Math.floor(tileY / REGION_HEIGHT);
      const clickedKey = getRegionKey(rx, ry);
      if (exploredRegionsMap.has(clickedKey)) {
        setSelectedRegionKey(clickedKey);
      }
    }
    dragRef.current.dragging = false;
  };

  const selectedRegion = exploredRegionsMap.get(selectedRegionKey);
  const selectedExploredCount = getRegionExploredCount(world, selectedRegionKey);
  const selectedTotalTiles = REGION_WIDTH * REGION_HEIGHT;
  const selectedPct = Math.round((selectedExploredCount / selectedTotalTiles) * 100);
  const selectedLandmarks = world.discoveredLandmarksByRegion?.[selectedRegionKey] ?? [];
  const currentInfo = getRegionInfo(
    world.seed,
    world.currentRegionX,
    world.currentRegionY
  );
  const selectedBiomeCfg = selectedRegion ? BIOME_CONFIGS[selectedRegion.biomeId] : null;
  const selectedHazardInfo = selectedRegion
    ? getHazardWarningInfo(selectedRegion.hazard, player, world)
    : null;

  return (
    <div className="fixed inset-0 z-40 bg-[#070809] flex flex-col overflow-hidden select-none">
      {/* Full-Screen Top Header */}
      <header className="px-4 py-2 bg-[#121517] border-b border-[#252A2E] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Compass className="w-4 h-4 text-[#E5B85A] shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display text-sm sm:text-base font-bold text-[#F5E6C4] truncate">
              Peta Dunia Terjelajah — {currentInfo.name}
            </h2>
            <div className="text-[11px] font-mono-num text-[#9BA3AB] truncate">
              Wilayah terbuka: {exploredRegionsMap.size} · Hari {world.dayCount} · Malam Terlewati {world.completedNights ?? 0} · Geser atau cubit untuk zoom
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInfoPanel((v) => !v)}
            className="min-h-[40px] px-3 py-1 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold text-[#E5B85A] flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showInfoPanel ? 'Sembunyikan Info' : 'Info Wilayah'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Peta Dunia"
            className="min-h-[40px] min-w-[40px] rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Split: Interactive Map Canvas + Region Info Sidebar */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        <div className="relative flex-1 min-w-0 h-full bg-[#070809]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={(e) => {
              e.preventDefault();
              applyZoom(zoom + (e.deltaY < 0 ? 0.22 : -0.22));
            }}
            className="w-full h-full block cursor-grab active:cursor-grabbing touch-none pixelated"
          />

          {/* Zoom & Recenter Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => applyZoom(zoom + 0.35)}
              aria-label="Perbesar Peta"
              className="min-h-[40px] min-w-[40px] rounded bg-[#14171A]/92 hover:bg-[#22272B] border border-[#3A4046] flex items-center justify-center text-[#F5E6C4] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyZoom(zoom - 0.35)}
              aria-label="Perkecil Peta"
              className="min-h-[40px] min-w-[40px] rounded bg-[#14171A]/92 hover:bg-[#22272B] border border-[#3A4046] flex items-center justify-center text-[#F5E6C4] cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => centerOnPlayer()}
              aria-label="Pusatkan ke Posisi Penyintas"
              title="Pusatkan ke Posisi Saat Ini"
              className="min-h-[40px] min-w-[40px] rounded bg-[#17281E]/92 hover:bg-[#264D34] border border-[#C89B3C]/70 flex items-center justify-center text-[#E5B85A] cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Map Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] bg-[#0D0F10]/90 border border-[#3A4046] rounded px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#C7C2B6]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5E6C4] border border-[#C89B3C]" />
              <span>Posisimu</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD166]" />
              <span>Pedagang</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F43]" />
              <span>Pandai Besi</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#81C784]" />
              <span>Alkemis</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B388FF]" />
              <span>Dungeon/Gua</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5534B]" />
              <span>Bos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58D1EB]" />
              <span>Pancing/Air</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#E5B85A]" />
              <span>Jalur Keluar</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#070809] border border-[#3A4046]" />
              <span>Kabut</span>
            </span>
          </div>
        </div>

        {/* Region & Sub-Area Detail Panel */}
        {showInfoPanel && (
          <aside className="w-64 sm:w-76 bg-[#101315] border-l border-[#252A2E] p-3 flex flex-col gap-3 overflow-y-auto ember-scroll shrink-0">
            {selectedRegion && selectedBiomeCfg ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-num text-[#E5B85A] uppercase tracking-wider">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>
                      Bioma: {selectedBiomeCfg.displayName} ({selectedRegion.rx},{selectedRegion.ry})
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#F5E6C4]">
                    {selectedRegion.subAreaName}
                  </h3>
                  <div className="text-[11px] font-mono-num text-[#7EC4E0]">
                    Terjelajah: {selectedPct}% {selectedRegion.isSafeZone ? '· Zona Aman' : ''}
                  </div>
                </div>

                <p className="text-xs text-[#C7C2B6] leading-relaxed">
                  {selectedRegion.description}
                </p>

                {/* Environmental Hazard Banner */}
                {selectedHazardInfo ? (
                  <div
                    className={`p-2.5 rounded border text-xs space-y-1 ${
                      selectedHazardInfo.mitigated
                        ? 'bg-[#17281E]/75 border-[#8FC79A]/60 text-[#C7E6CB]'
                        : 'bg-[#2C1618]/85 border-[#E5534B]/70 text-[#F5B4B6]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {selectedHazardInfo.mitigated ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8FC79A]" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#E5534B]" />
                      )}
                      <span>
                        Bahaya: {selectedHazardInfo.label}{' '}
                        {selectedHazardInfo.mitigated ? '(Terlindungi)' : '(Aktif)'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-90">{selectedHazardInfo.advice}</div>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-[#14171A] border border-[#252A2E] text-[11px] text-[#8FC79A]">
                    Iklim Stabil — Tidak ada bahaya lingkungan ekstrem.
                  </div>
                )}

                {/* Discovered Landmarks List */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#E5B85A] uppercase tracking-wide">
                    Lokasi Ditemukan ({selectedLandmarks.length})
                  </div>
                  {selectedLandmarks.length === 0 ? (
                    <div className="text-[11px] text-[#8F969E]">
                      Jelajahi wilayah ini untuk membuka penanda desa, pedagang, dungeon, dan sumber daya.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {selectedLandmarks.map((lm) => {
                        const style = getLandmarkBadgeStyle(lm.kind);
                        return (
                          <div
                            key={lm.id}
                            className="px-2 py-1.5 rounded bg-[#14171A] border border-[#252A2E] flex items-center gap-2 text-[11px]"
                          >
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0D0F10] shrink-0"
                              style={{ backgroundColor: style.color }}
                            >
                              {style.symbol}
                            </span>
                            <span className="text-[#E6E2D8] truncate">{lm.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Connected Exits */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#9BA3AB] uppercase tracking-wide">
                    Jalur Terhubung
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {selectedRegion.exits.map((ex) => (
                      <div
                        key={ex.direction}
                        className="px-2 py-1 rounded bg-[#0D0F10] border border-[#252A2E] flex items-center justify-between gap-2"
                      >
                        <span className="font-mono-num text-[#E5B85A]">
                          {ex.direction === 'NORTH'
                            ? 'Utara'
                            : ex.direction === 'SOUTH'
                            ? 'Selatan'
                            : ex.direction === 'WEST'
                            ? 'Barat'
                            : 'Timur'}
                        </span>
                        <span className="text-[#C7C2B6] truncate">{ex.targetName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-[#8F969E]">
                Ketuk salah satu wilayah yang sudah terjelajah untuk melihat detail bioma dan penandanya.
              </div>
            )}

            <div className="mt-auto pt-2 border-t border-[#252A2E] flex items-center justify-between text-[11px] font-mono-num text-[#8F969E]">
              <span>Zoom Peta</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
