const MAX_SPRITE_CACHE_ENTRIES = 320;
const spriteCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Retrieves or generates an offscreen canvas sprite for static portraits and items
 * so high-detail Bezier vector illustrations render at 60fps on mobile hardware.
 */
export function getCachedOffscreenSprite(
  key: string,
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): HTMLCanvasElement | null {
  if (typeof document === 'undefined' || width <= 0 || height <= 0) {
    return null;
  }

  const existing = spriteCanvasCache.get(key);
  if (existing) {
    // Refresh LRU order
    spriteCanvasCache.delete(key);
    spriteCanvasCache.set(key, existing);
    return existing;
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const octx = offscreen.getContext('2d');
  if (!octx) return null;

  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.lineJoin = 'round';
  octx.lineCap = 'round';
  drawFn(octx, width, height);

  if (spriteCanvasCache.size >= MAX_SPRITE_CACHE_ENTRIES) {
    const oldestKey = spriteCanvasCache.keys().next().value;
    if (oldestKey !== undefined) {
      spriteCanvasCache.delete(oldestKey);
    }
  }
  spriteCanvasCache.set(key, offscreen);
  return offscreen;
}

export function clearSpriteCache() {
  spriteCanvasCache.clear();
}
