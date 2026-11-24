import { ItemId } from '../core/types';

function makeLinear(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: [number, string][]
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function makeRadial(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r1: number,
  stops: [number, string][]
) {
  const g = ctx.createRadialGradient(cx - r1 * 0.28, cy - r1 * 0.28, r1 * 0.08, cx, cy, r1);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

/**
 * Draws a rich HD 2D dark-fantasy illustrated icon inside box (x, y, size, size)
 * covering every single ItemId in ITEM_ORDER (all 80 items).
 */
export function drawIllustratedItem(
  ctx: CanvasRenderingContext2D,
  itemId: ItemId,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  const u = size / 64;
  ctx.scale(u, u);
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const ink = '#0D0F12';
  const strokePath = (w = 2.4) => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = w;
    ctx.stroke();
  };

  // Subtle ambient vignette drop shadow under every item
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(32, 54, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (itemId) {
    // ── WOOD & STONE & ORES (9) ─────────────────────────────────────────────
    case 'kayu': {
      ctx.save();
      ctx.translate(32, 34);
      ctx.rotate(-0.32);
      ctx.fillStyle = makeLinear(ctx, -20, -9, 20, 9, [
        [0, '#8A5E3B'],
        [0.5, '#684429'],
        [1, '#472D1A'],
      ]);
      ctx.beginPath();
      ctx.roundRect(-21, -9, 42, 18, 6);
      ctx.fill();
      strokePath(2.4);
      // Bark striations
      ctx.strokeStyle = 'rgba(30, 18, 9, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, -3);
      ctx.lineTo(8, -3);
      ctx.moveTo(-6, 4);
      ctx.lineTo(11, 4);
      ctx.stroke();
      // Cut wood end ring
      ctx.fillStyle = '#D9B684';
      ctx.beginPath();
      ctx.ellipse(17, 0, 5.5, 8.2, 0, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2);
      ctx.strokeStyle = '#9C7244';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(17, 0, 2.8, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'batu':
    case 'bijih_besi':
    case 'bijih_emas':
    case 'bijih_tembaga':
    case 'batu_bara': {
      const isCoal = itemId === 'batu_bara';
      const rockGrad = isCoal
        ? makeLinear(ctx, 14, 14, 50, 50, [
            [0, '#464C54'],
            [0.5, '#25292E'],
            [1, '#121417'],
          ])
        : makeLinear(ctx, 14, 14, 50, 50, [
            [0, '#89949F'],
            [0.55, '#58626B'],
            [1, '#363C42'],
          ]);
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(14, 42);
      ctx.lineTo(12, 26);
      ctx.lineTo(24, 14);
      ctx.lineTo(42, 16);
      ctx.lineTo(52, 29);
      ctx.lineTo(48, 46);
      ctx.lineTo(25, 49);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);

      // Facet highlight
      ctx.fillStyle = isCoal ? 'rgba(255,255,255,0.12)' : 'rgba(235, 245, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(17, 26);
      ctx.lineTo(25, 17);
      ctx.lineTo(39, 19);
      ctx.lineTo(31, 30);
      ctx.closePath();
      ctx.fill();

      if (itemId !== 'batu') {
        const veinColor =
          itemId === 'bijih_emas'
            ? '#FFD166'
            : itemId === 'bijih_besi'
            ? '#D67C4B'
            : itemId === 'bijih_tembaga'
            ? '#E58E5A'
            : '#687482';
        const veinGlint =
          itemId === 'bijih_emas' ? '#FFF5C2' : isCoal ? '#93A0AE' : '#FFE0C2';
        const nuggets = [
          [24, 30, 5.5],
          [38, 25, 4.8],
          [35, 39, 5.2],
        ];
        for (const [nx, ny, nr] of nuggets) {
          ctx.fillStyle = veinColor;
          ctx.beginPath();
          ctx.arc(nx, ny, nr, 0, Math.PI * 2);
          ctx.fill();
          strokePath(1.6);
          ctx.fillStyle = veinGlint;
          ctx.beginPath();
          ctx.arc(nx - 1.5, ny - 1.5, nr * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'obsidian':
    case 'kristal_es': {
      const isIce = itemId === 'kristal_es';
      const grad = isIce
        ? makeLinear(ctx, 16, 10, 48, 52, [
            [0, '#E3F8FF'],
            [0.45, '#72C6E8'],
            [1, '#26688A'],
          ])
        : makeLinear(ctx, 16, 10, 48, 52, [
            [0, '#A574EB'],
            [0.45, '#3E235C'],
            [1, '#140D1E'],
          ]);
      // Side shards
      ctx.fillStyle = isIce ? '#3D8CB0' : '#261538';
      ctx.beginPath();
      ctx.moveTo(15, 46);
      ctx.lineTo(13, 24);
      ctx.lineTo(23, 18);
      ctx.lineTo(27, 46);
      ctx.closePath();
      ctx.fill();
      strokePath(2);

      ctx.beginPath();
      ctx.moveTo(39, 46);
      ctx.lineTo(43, 22);
      ctx.lineTo(51, 29);
      ctx.lineTo(48, 46);
      ctx.closePath();
      ctx.fill();
      strokePath(2);

      // Center tall crystal
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(22, 48);
      ctx.lineTo(20, 22);
      ctx.lineTo(32, 8);
      ctx.lineTo(44, 22);
      ctx.lineTo(42, 48);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);

      ctx.strokeStyle = isIce ? 'rgba(255,255,255,0.75)' : 'rgba(218,175,255,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 11);
      ctx.lineTo(27, 28);
      ctx.lineTo(32, 45);
      ctx.stroke();
      break;
    }

    case 'abu_vulkanik': {
      // Glowing volcanic ember ash mound
      ctx.fillStyle = makeLinear(ctx, 14, 24, 50, 50, [
        [0, '#5A4C49'],
        [0.6, '#342B2A'],
        [1, '#1A1515'],
      ]);
      ctx.beginPath();
      ctx.moveTo(10, 48);
      ctx.quadraticCurveTo(22, 24, 32, 24);
      ctx.quadraticCurveTo(44, 24, 54, 48);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      for (const [ex, ey, r] of [
        [27, 35, 3],
        [36, 39, 2.5],
        [31, 42, 2.2],
        [24, 20, 1.8],
        [38, 17, 1.6],
      ]) {
        ctx.fillStyle = r > 2.3 ? '#FF6B35' : '#FFD166';
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ── FLORA & ANIMAL PARTS (12) ───────────────────────────────────────────
    case 'rumput_liar': {
      const blades = [
        [28, 49, 14, 16, '#2E7843'],
        [31, 49, 31, 10, '#49A35E'],
        [35, 49, 49, 17, '#35874C'],
        [24, 49, 22, 22, '#62BA75'],
      ] as const;
      for (const [bx, by, tx, ty, col] of blades) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(bx - 3, by);
        ctx.quadraticCurveTo((bx + tx) / 2 - 4, (by + ty) / 2, tx, ty);
        ctx.quadraticCurveTo((bx + tx) / 2 + 2, (by + ty) / 2, bx + 3, by);
        ctx.closePath();
        ctx.fill();
        strokePath(1.8);
      }
      break;
    }

    case 'herba_obat':
    case 'tanaman_langka': {
      const isRare = itemId === 'tanaman_langka';
      ctx.strokeStyle = isRare ? '#235E69' : '#26613A';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(32, 51);
      ctx.quadraticCurveTo(30, 34, 32, 18);
      ctx.stroke();

      const leafColor = isRare ? '#4BA8BF' : '#4BA865';
      for (const [ang, lx, ly] of [
        [-0.7, 22, 34],
        [0.7, 42, 34],
        [-0.5, 23, 23],
        [0.5, 41, 23],
      ]) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang);
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        strokePath(1.8);
        ctx.restore();
      }
      // Blossom top
      ctx.fillStyle = isRare ? '#7EE8FA' : '#A9F5C2';
      ctx.beginPath();
      ctx.arc(32, 15, 7, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2);
      ctx.fillStyle = '#FFF7D6';
      ctx.beginPath();
      ctx.arc(32, 15, 2.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'sayur_liar': {
      // Crisp wild root carrot/turnip with leafy crown
      ctx.fillStyle = '#3B8A4E';
      ctx.beginPath();
      ctx.ellipse(27, 16, 4.5, 9, -0.35, 0, Math.PI * 2);
      ctx.ellipse(35, 15, 4.5, 10, 0.25, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.8);

      ctx.fillStyle = makeLinear(ctx, 22, 22, 42, 52, [
        [0, '#F59B38'],
        [0.6, '#DB6C26'],
        [1, '#A14215'],
      ]);
      ctx.beginPath();
      ctx.moveTo(21, 24);
      ctx.quadraticCurveTo(32, 20, 43, 24);
      ctx.quadraticCurveTo(40, 44, 32, 52);
      ctx.quadraticCurveTo(24, 44, 21, 24);
      ctx.closePath();
      ctx.fill();
      strokePath(2.2);
      break;
    }

    case 'beri': {
      // Leaf behind berry cluster
      ctx.fillStyle = '#357D49';
      ctx.beginPath();
      ctx.ellipse(32, 19, 12, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.8);
      for (const [bx, by, br] of [
        [24, 33, 9],
        [40, 33, 9],
        [32, 41, 10],
      ]) {
        ctx.fillStyle = makeRadial(ctx, bx, by, br, [
          [0, '#FF8F8F'],
          [0.45, '#D13B3B'],
          [1, '#7D1720'],
        ]);
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        strokePath(2);
      }
      break;
    }

    case 'jamur': {
      // Stalk
      ctx.fillStyle = makeLinear(ctx, 26, 30, 38, 50, [
        [0, '#EFE6D5'],
        [1, '#BFB199'],
      ]);
      ctx.beginPath();
      ctx.roundRect(26, 30, 12, 20, 5);
      ctx.fill();
      strokePath(2.2);
      // Red spotted cap
      ctx.fillStyle = makeLinear(ctx, 14, 14, 50, 34, [
        [0, '#E35B49'],
        [0.6, '#B83227'],
        [1, '#751A16'],
      ]);
      ctx.beginPath();
      ctx.moveTo(13, 33);
      ctx.bezierCurveTo(13, 13, 51, 13, 51, 33);
      ctx.quadraticCurveTo(32, 37, 13, 33);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      for (const [sx, sy, sr] of [
        [23, 24, 3.2],
        [33, 20, 3.6],
        [42, 26, 2.7],
      ]) {
        ctx.fillStyle = '#FFF4DE';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'benih': {
      for (const [sx, sy, rot] of [
        [23, 36, -0.3],
        [34, 29, 0.2],
        [40, 41, -0.1],
      ]) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rot);
        ctx.fillStyle = makeLinear(ctx, -6, -8, 6, 8, [
          [0, '#D4B07A'],
          [1, '#7A542C'],
        ]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        strokePath(1.8);
        ctx.restore();
      }
      // Small green sprout
      ctx.fillStyle = '#62BA75';
      ctx.beginPath();
      ctx.ellipse(34, 18, 5, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.6);
      break;
    }

    case 'daging_mentah':
    case 'daging_masak': {
      const cooked = itemId === 'daging_masak';
      ctx.fillStyle = makeLinear(ctx, 14, 16, 48, 48, [
        [0, cooked ? '#B86232' : '#D9554C'],
        [0.5, cooked ? '#8C401D' : '#AD322C'],
        [1, cooked ? '#57220D' : '#6E1919'],
      ]);
      ctx.beginPath();
      ctx.moveTo(15, 36);
      ctx.bezierCurveTo(10, 20, 32, 12, 48, 22);
      ctx.bezierCurveTo(54, 34, 42, 49, 24, 47);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);

      // Marbling or sear marks + bone circle
      if (cooked) {
        ctx.strokeStyle = '#331407';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(22, 24);
        ctx.lineTo(31, 37);
        ctx.moveTo(31, 22);
        ctx.lineTo(40, 35);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FCEAE6';
        ctx.beginPath();
        ctx.ellipse(26, 28, 5, 3.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#EAE2D2';
      ctx.beginPath();
      ctx.arc(41, 35, 4.5, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.6);
      break;
    }

    case 'kulit':
    case 'kulit_serigala': {
      const isWolf = itemId === 'kulit_serigala';
      ctx.fillStyle = makeLinear(ctx, 14, 14, 50, 50, [
        [0, isWolf ? '#8D98A3' : '#B57B4C'],
        [0.6, isWolf ? '#5E6873' : '#85522E'],
        [1, isWolf ? '#383F47' : '#573218'],
      ]);
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.quadraticCurveTo(32, 20, 48, 16);
      ctx.lineTo(45, 32);
      ctx.lineTo(50, 48);
      ctx.quadraticCurveTo(32, 44, 14, 48);
      ctx.lineTo(19, 32);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.strokeStyle = isWolf ? '#CFD8E3' : '#D99F6E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 21);
      ctx.lineTo(32, 43);
      ctx.stroke();
      break;
    }

    case 'tulang':
    case 'taring':
    case 'taring_kalajengking': {
      if (itemId === 'tulang') {
        ctx.save();
        ctx.translate(32, 32);
        ctx.rotate(-0.55);
        ctx.fillStyle = makeLinear(ctx, -18, -8, 18, 8, [
          [0, '#F5EFE4'],
          [1, '#C2B7A3'],
        ]);
        ctx.beginPath();
        ctx.arc(-16, -4, 5.2, 0, Math.PI * 2);
        ctx.arc(-16, 4, 5.2, 0, Math.PI * 2);
        ctx.arc(16, -4, 5.2, 0, Math.PI * 2);
        ctx.arc(16, 4, 5.2, 0, Math.PI * 2);
        ctx.rect(-15, -4, 30, 8);
        ctx.fill();
        strokePath(2.2);
        ctx.restore();
      } else {
        const isScorp = itemId === 'taring_kalajengking';
        ctx.fillStyle = makeLinear(ctx, 18, 14, 46, 50, [
          [0, isScorp ? '#E8AE5A' : '#F7F1E3'],
          [0.6, isScorp ? '#A35A2A' : '#CFC5B2'],
          [1, isScorp ? '#592B14' : '#8C8170'],
        ]);
        ctx.beginPath();
        ctx.moveTo(22, 16);
        ctx.quadraticCurveTo(44, 18, 42, 48);
        ctx.quadraticCurveTo(28, 34, 19, 25);
        ctx.closePath();
        ctx.fill();
        strokePath(2.4);
        if (isScorp) {
          ctx.fillStyle = '#89E051';
          ctx.beginPath();
          ctx.arc(41, 46, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'bulu': {
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(-0.45);
      ctx.fillStyle = makeLinear(ctx, -14, -18, 14, 18, [
        [0, '#F5F0E6'],
        [0.65, '#C4C9CF'],
        [1, '#79828C'],
      ]);
      ctx.beginPath();
      ctx.ellipse(0, -3, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2);
      ctx.strokeStyle = '#EAE4D7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(0, -18);
      ctx.stroke();
      ctx.restore();
      break;
    }

    // ── FISH & COOKED FOOD (11) ─────────────────────────────────────────────
    case 'ikan_kecil':
    case 'ikan_sungai':
    case 'ikan_kolam':
    case 'ikan_emas':
    case 'ikan_mistis':
    case 'ikan_beracun':
    case 'ikan_panggang': {
      const fishCols: Record<string, [string, string]> = {
        ikan_kecil: ['#9EB8C7', '#547387'],
        ikan_sungai: ['#62B5C7', '#2E6B80'],
        ikan_kolam: ['#77B86E', '#3A6E38'],
        ikan_emas: ['#FFE17D', '#C98A1A'],
        ikan_mistis: ['#B685FF', '#473080'],
        ikan_beracun: ['#97E058', '#3F7021'],
        ikan_panggang: ['#C97B3A', '#7A3E15'],
      };
      const [c1, c2] = fishCols[itemId];
      ctx.save();
      ctx.translate(32, 33);
      ctx.rotate(-0.2);
      // Tail
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-23, -10);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-23, 10);
      ctx.closePath();
      ctx.fill();
      strokePath(2);
      // Body
      ctx.fillStyle = makeLinear(ctx, -14, -11, 18, 11, [
        [0, c1],
        [1, c2],
      ]);
      ctx.beginPath();
      ctx.ellipse(2, 0, 17, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2.2);
      // Eye
      ctx.fillStyle = itemId === 'ikan_panggang' ? '#331C0B' : '#FFF7D6';
      ctx.beginPath();
      ctx.arc(12, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (itemId !== 'ikan_panggang') {
        ctx.fillStyle = '#0D0F12';
        ctx.beginPath();
        ctx.arc(12.5, -2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'sup_sayur':
    case 'sup_ikan':
    case 'hidangan_beri': {
      // Wooden bowl
      ctx.fillStyle = makeLinear(ctx, 12, 28, 52, 50, [
        [0, '#8A5D3B'],
        [1, '#472B17'],
      ]);
      ctx.beginPath();
      ctx.moveTo(11, 30);
      ctx.quadraticCurveTo(14, 50, 32, 50);
      ctx.quadraticCurveTo(50, 50, 53, 30);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);

      const broth =
        itemId === 'sup_sayur'
          ? '#D18238'
          : itemId === 'sup_ikan'
          ? '#65A3AD'
          : '#AD384E';
      ctx.fillStyle = broth;
      ctx.beginPath();
      ctx.ellipse(32, 30, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2);
      // Garnish & steam
      ctx.fillStyle = itemId === 'hidangan_beri' ? '#FFD4DC' : '#96E072';
      ctx.beginPath();
      ctx.arc(26, 29, 2.5, 0, Math.PI * 2);
      ctx.arc(36, 31, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, 21);
      ctx.quadraticCurveTo(22, 15, 26, 11);
      ctx.moveTo(37, 20);
      ctx.quadraticCurveTo(40, 14, 36, 10);
      ctx.stroke();
      break;
    }

    // ── POTIONS (8) ─────────────────────────────────────────────────────────
    case 'ramuan_sembuh':
    case 'ramuan_pulih':
    case 'ramuan_bara':
    case 'ramuan_racun':
    case 'ramuan_hangat':
    case 'ramuan_pendingin':
    case 'ramuan_tahan_api':
    case 'penawar_racun': {
      const potionColors: Record<string, [string, string]> = {
        ramuan_sembuh: ['#FF7575', '#B02323'],
        ramuan_pulih: ['#7AC8FF', '#2864B0'],
        ramuan_bara: ['#FF9D47', '#C73818'],
        ramuan_racun: ['#99E65C', '#3B7D21'],
        ramuan_hangat: ['#FFD166', '#C95D1E'],
        ramuan_pendingin: ['#9BF2FF', '#2C8FB0'],
        ramuan_tahan_api: ['#FF7D6E', '#8F1E58'],
        penawar_racun: ['#A5F7C4', '#268C64'],
      };
      const [lightC, darkC] = potionColors[itemId];
      // Cork & neck
      ctx.fillStyle = '#A6784D';
      ctx.beginPath();
      ctx.roundRect(27, 10, 10, 7, 2);
      ctx.fill();
      strokePath(2);
      ctx.fillStyle = 'rgba(205, 230, 245, 0.35)';
      ctx.beginPath();
      ctx.roundRect(25, 16, 14, 10, 3);
      ctx.fill();
      strokePath(2);
      // Round flask body
      ctx.fillStyle = makeRadial(ctx, 32, 39, 17, [
        [0, lightC],
        [0.55, darkC],
        [1, '#1A1C21'],
      ]);
      ctx.beginPath();
      ctx.arc(32, 39, 15, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2.4);
      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.beginPath();
      ctx.ellipse(25, 32, 3.2, 5.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ── TOOLS & WEAPONS (10) ────────────────────────────────────────────────
    case 'kapak_batu':
    case 'beliung_batu': {
      ctx.save();
      ctx.translate(32, 33);
      ctx.rotate(-0.5);
      // Handle
      ctx.fillStyle = '#7A5434';
      ctx.beginPath();
      ctx.roundRect(-3, -18, 6, 38, 2);
      ctx.fill();
      strokePath(2.2);
      // Stone head
      ctx.fillStyle = makeLinear(ctx, -14, -18, 14, -6, [
        [0, '#A5B0BA'],
        [1, '#4F575F'],
      ]);
      ctx.beginPath();
      if (itemId === 'kapak_batu') {
        ctx.moveTo(-2, -16);
        ctx.lineTo(13, -19);
        ctx.quadraticCurveTo(16, -10, 12, -4);
        ctx.lineTo(-2, -8);
      } else {
        ctx.moveTo(-16, -10);
        ctx.quadraticCurveTo(0, -19, 16, -10);
        ctx.quadraticCurveTo(0, -13, -16, -10);
      }
      ctx.closePath();
      ctx.fill();
      strokePath(2.2);
      ctx.restore();
      break;
    }

    case 'pancing_dasar': {
      ctx.strokeStyle = '#7A5434';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 50);
      ctx.quadraticCurveTo(28, 24, 48, 12);
      ctx.stroke();
      ctx.strokeStyle = '#D9E8F5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 12);
      ctx.lineTo(48, 39);
      ctx.stroke();
      ctx.fillStyle = '#D94A38';
      ctx.beginPath();
      ctx.arc(48, 41, 4, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.8);
      break;
    }

    case 'umpan_pancing': {
      ctx.fillStyle = '#E08882';
      ctx.beginPath();
      ctx.moveTo(18, 38);
      ctx.bezierCurveTo(24, 18, 40, 44, 47, 24);
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#0D0F12';
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E08882';
      ctx.stroke();
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(32, 32, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'obor': {
      ctx.save();
      ctx.translate(32, 35);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#6E4C32';
      ctx.beginPath();
      ctx.roundRect(-3.5, -8, 7, 26, 2);
      ctx.fill();
      strokePath(2);
      ctx.fillStyle = '#FF6B2B';
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.quadraticCurveTo(-8, -22, 0, -28);
      ctx.quadraticCurveTo(8, -22, 7, -8);
      ctx.closePath();
      ctx.fill();
      strokePath(1.8);
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.ellipse(0, -14, 3.2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'pisau_batu':
    case 'pedang_karat':
    case 'senjata_tempa': {
      const isDagger = itemId === 'pisau_batu';
      const isForged = itemId === 'senjata_tempa';
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(-0.78);
      // Blade
      ctx.fillStyle = isDagger
        ? makeLinear(ctx, -4, -20, 4, 6, [
            [0, '#C7D0D9'],
            [1, '#68727A'],
          ])
        : isForged
        ? makeLinear(ctx, -5, -26, 5, 10, [
            [0, '#F5F9FC'],
            [0.5, '#A7B6C4'],
            [1, '#586775'],
          ])
        : makeLinear(ctx, -4, -24, 4, 10, [
            [0, '#B5A18D'],
            [1, '#6E5038'],
          ]);
      ctx.beginPath();
      ctx.moveTo(0, isDagger ? -21 : -26);
      ctx.lineTo(isForged ? 5.5 : 4.2, isDagger ? -6 : -8);
      ctx.lineTo(isForged ? 5.5 : 4, 9);
      ctx.lineTo(isForged ? -5.5 : -4, 9);
      ctx.lineTo(isForged ? -5.5 : -4.2, isDagger ? -6 : -8);
      ctx.closePath();
      ctx.fill();
      strokePath(2);
      // Crossguard & hilt
      ctx.fillStyle = isForged ? '#FFD166' : isDagger ? '#6E5038' : '#8A6822';
      ctx.beginPath();
      ctx.roundRect(-9, 8, 18, 4, 2);
      ctx.fill();
      strokePath(1.8);
      ctx.fillStyle = '#4A311E';
      ctx.beginPath();
      ctx.roundRect(-2.5, 12, 5, 10, 2);
      ctx.fill();
      strokePath(1.8);
      if (isForged) {
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(0, 23, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'tombak_kayu': {
      ctx.save();
      ctx.translate(32, 32);
      ctx.rotate(-0.78);
      ctx.fillStyle = '#7A5434';
      ctx.beginPath();
      ctx.roundRect(-2.2, -12, 4.4, 34, 2);
      ctx.fill();
      strokePath(1.8);
      ctx.fillStyle = '#D5DEE6';
      ctx.beginPath();
      ctx.moveTo(0, -27);
      ctx.lineTo(6, -12);
      ctx.lineTo(-6, -12);
      ctx.closePath();
      ctx.fill();
      strokePath(2);
      ctx.restore();
      break;
    }

    case 'busur_kayu': {
      ctx.strokeStyle = '#6E4C32';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(24, 32, 20, -1.25, 1.25);
      ctx.stroke();
      ctx.strokeStyle = '#E6DEC8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(30, 13);
      ctx.lineTo(30, 51);
      ctx.stroke();
      // Arrow
      ctx.strokeStyle = '#C4CDD6';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(20, 32);
      ctx.lineTo(50, 32);
      ctx.stroke();
      ctx.fillStyle = '#E6DEC8';
      ctx.beginPath();
      ctx.moveTo(52, 32);
      ctx.lineTo(44, 28);
      ctx.lineTo(44, 36);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // ── ARMOR & SHIELDS & HELMS & GLOVES & BOOTS & ACCESSORIES (19) ────────
    case 'zirah_kain':
    case 'zirah_kulit':
    case 'jubah_bulu':
    case 'pakaian_gurun':
    case 'zirah_tahan_api': {
      const armorPal: Record<string, [string, string, string]> = {
        zirah_kain: ['#6B7A66', '#465242', '#C89B3C'],
        zirah_kulit: ['#9C6B43', '#5E3D22', '#E5B85A'],
        jubah_bulu: ['#8596A6', '#4A5B6B', '#EAE6DC'],
        pakaian_gurun: ['#D6AE6E', '#966F39', '#F5E6C4'],
        zirah_tahan_api: ['#8A2E22', '#4A1813', '#FF9447'],
      };
      const [c1, c2, trim] = armorPal[itemId];
      ctx.fillStyle = makeLinear(ctx, 14, 14, 50, 50, [
        [0, c1],
        [1, c2],
      ]);
      ctx.beginPath();
      ctx.moveTo(22, 14);
      ctx.lineTo(42, 14);
      ctx.lineTo(52, 24);
      ctx.lineTo(45, 32);
      ctx.lineTo(43, 50);
      ctx.lineTo(21, 50);
      ctx.lineTo(19, 32);
      ctx.lineTo(12, 24);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = trim;
      ctx.fillRect(21, 35, 22, 4);
      ctx.fillRect(29, 15, 6, 18);
      break;
    }

    case 'perisai_kayu':
    case 'perisai_besi': {
      const isIron = itemId === 'perisai_besi';
      ctx.fillStyle = isIron
        ? makeLinear(ctx, 16, 12, 48, 52, [
            [0, '#B8C2CC'],
            [0.6, '#6E7882'],
            [1, '#3D444C'],
          ])
        : makeLinear(ctx, 16, 12, 48, 52, [
            [0, '#8A5C38'],
            [1, '#4D301A'],
          ]);
      ctx.beginPath();
      ctx.moveTo(16, 14);
      ctx.lineTo(48, 14);
      ctx.lineTo(48, 34);
      ctx.quadraticCurveTo(32, 52, 32, 52);
      ctx.quadraticCurveTo(32, 52, 16, 34);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = isIron ? '#E5B85A' : '#A67E36';
      ctx.beginPath();
      ctx.arc(32, 30, 6, 0, Math.PI * 2);
      ctx.fill();
      strokePath(1.8);
      break;
    }

    case 'helm_kulit':
    case 'helm_besi':
    case 'topeng_racun': {
      const isMask = itemId === 'topeng_racun';
      const isIron = itemId === 'helm_besi';
      ctx.fillStyle = isMask
        ? '#3E6E47'
        : isIron
        ? makeLinear(ctx, 18, 14, 46, 48, [
            [0, '#C4CDD6'],
            [1, '#58626B'],
          ])
        : makeLinear(ctx, 18, 14, 46, 48, [
            [0, '#9E6E47'],
            [1, '#573920'],
          ]);
      ctx.beginPath();
      ctx.arc(32, 31, 15, Math.PI, 0);
      ctx.lineTo(47, 46);
      ctx.lineTo(39, 46);
      ctx.lineTo(37, 36);
      ctx.lineTo(27, 36);
      ctx.lineTo(25, 46);
      ctx.lineTo(17, 46);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      if (isMask) {
        ctx.fillStyle = '#9EF29E';
        ctx.beginPath();
        ctx.arc(26, 29, 3, 0, Math.PI * 2);
        ctx.arc(38, 29, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (isIron) {
        ctx.fillStyle = '#E5B85A';
        ctx.fillRect(30, 15, 4, 15);
      }
      break;
    }

    case 'sarung_kulit':
    case 'sarung_besi': {
      const isIron = itemId === 'sarung_besi';
      ctx.fillStyle = isIron
        ? makeLinear(ctx, 18, 14, 46, 50, [
            [0, '#B5C0CC'],
            [1, '#525B63'],
          ])
        : makeLinear(ctx, 18, 14, 46, 50, [
            [0, '#9E6E47'],
            [1, '#52341D'],
          ]);
      ctx.beginPath();
      ctx.roundRect(19, 22, 26, 26, 7);
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = isIron ? '#E5B85A' : '#C49562';
      ctx.fillRect(19, 37, 26, 5);
      break;
    }

    case 'sepatu_kulit':
    case 'sepatu_besi':
    case 'sepatu_hangat':
    case 'sepatu_pasir':
    case 'sepatu_vulkanik': {
      const bootPal: Record<string, [string, string]> = {
        sepatu_kulit: ['#9A6A42', '#4D301A'],
        sepatu_besi: ['#A3AEB8', '#485058'],
        sepatu_hangat: ['#8A6E56', '#EAE4D7'],
        sepatu_pasir: ['#D6AF72', '#7D5B30'],
        sepatu_vulkanik: ['#4D2B28', '#FF6B35'],
      };
      const [b1, b2] = bootPal[itemId];
      ctx.fillStyle = makeLinear(ctx, 18, 16, 48, 50, [
        [0, b1],
        [1, b2],
      ]);
      ctx.beginPath();
      ctx.moveTo(20, 16);
      ctx.lineTo(35, 16);
      ctx.lineTo(35, 36);
      ctx.lineTo(49, 41);
      ctx.lineTo(49, 49);
      ctx.lineTo(19, 49);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = b2;
      ctx.fillRect(20, 16, 15, 5);
      break;
    }

    case 'jimat_pelindung': {
      ctx.strokeStyle = '#C89B3C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(32, 26, 12, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = makeRadial(ctx, 32, 38, 14, [
        [0, '#FFF1B8'],
        [0.5, '#C89B3C'],
        [1, '#5C3D14'],
      ]);
      ctx.beginPath();
      ctx.arc(32, 38, 13, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = '#7EC4E0';
      ctx.beginPath();
      ctx.arc(32, 38, 5.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'jubah_penangkal': {
      ctx.fillStyle = makeLinear(ctx, 16, 12, 48, 52, [
        [0, '#4E3978'],
        [0.6, '#2D2047'],
        [1, '#181126'],
      ]);
      ctx.beginPath();
      ctx.moveTo(24, 14);
      ctx.lineTo(40, 14);
      ctx.lineTo(50, 50);
      ctx.quadraticCurveTo(32, 46, 14, 50);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = '#E5B85A';
      ctx.beginPath();
      ctx.arc(32, 20, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ── BUILDING & MONSTER DROPS (11) ───────────────────────────────────────
    case 'papan_kayu': {
      ctx.fillStyle = '#9C6D44';
      ctx.beginPath();
      ctx.roundRect(12, 18, 40, 11, 3);
      ctx.roundRect(14, 34, 38, 11, 3);
      ctx.fill();
      strokePath(2.2);
      break;
    }

    case 'balok_batu': {
      ctx.fillStyle = makeLinear(ctx, 14, 18, 50, 46, [
        [0, '#98A2AC'],
        [1, '#4C545C'],
      ]);
      ctx.beginPath();
      ctx.roundRect(13, 20, 38, 24, 3);
      ctx.fill();
      strokePath(2.4);
      ctx.strokeStyle = '#363C42';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(14, 32);
      ctx.lineTo(50, 32);
      ctx.moveTo(32, 20);
      ctx.lineTo(32, 32);
      ctx.stroke();
      break;
    }

    case 'koin_kuno': {
      ctx.fillStyle = makeRadial(ctx, 32, 32, 16, [
        [0, '#FFF1A8'],
        [0.55, '#D9A434'],
        [1, '#7A5414'],
      ]);
      ctx.beginPath();
      ctx.arc(32, 32, 15, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2.4);
      ctx.strokeStyle = '#FFF5C2';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(32, 32, 10, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'pecahan_zirah': {
      ctx.fillStyle = makeLinear(ctx, 16, 16, 48, 48, [
        [0, '#B0B8C2'],
        [1, '#4B535C'],
      ]);
      ctx.beginPath();
      ctx.moveTo(16, 20);
      ctx.lineTo(38, 14);
      ctx.lineTo(48, 30);
      ctx.lineTo(34, 48);
      ctx.lineTo(18, 42);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      break;
    }

    case 'lendir_slime':
    case 'inti_slime': {
      const isCore = itemId === 'inti_slime';
      ctx.fillStyle = makeRadial(ctx, 32, 34, 17, [
        [0, '#B2FFD1'],
        [0.55, isCore ? '#3AD17A' : '#4BA86E'],
        [1, '#1A5233'],
      ]);
      ctx.beginPath();
      ctx.moveTo(15, 42);
      ctx.bezierCurveTo(13, 22, 51, 22, 49, 42);
      ctx.quadraticCurveTo(32, 48, 15, 42);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      if (isCore) {
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(32, 35, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'kain_goblin': {
      ctx.fillStyle = makeLinear(ctx, 16, 16, 48, 48, [
        [0, '#8C6E4E'],
        [1, '#473624'],
      ]);
      ctx.beginPath();
      ctx.moveTo(16, 18);
      ctx.lineTo(48, 22);
      ctx.lineTo(44, 46);
      ctx.lineTo(32, 40);
      ctx.lineTo(18, 47);
      ctx.closePath();
      ctx.fill();
      strokePath(2.2);
      break;
    }

    case 'esensi_gelap': {
      ctx.fillStyle = makeRadial(ctx, 32, 32, 18, [
        [0, '#F1D6FF'],
        [0.45, '#9D6CE0'],
        [1, '#1F1233'],
      ]);
      ctx.beginPath();
      ctx.arc(32, 32, 14, 0, Math.PI * 2);
      ctx.fill();
      strokePath(2.4);
      ctx.strokeStyle = '#E0B8FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(32, 32, 20, 8, -0.45, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'relik_terkutuk': {
      ctx.fillStyle = makeLinear(ctx, 20, 12, 44, 52, [
        [0, '#9C82B8'],
        [0.6, '#48345E'],
        [1, '#1B1326'],
      ]);
      ctx.beginPath();
      ctx.moveTo(32, 10);
      ctx.lineTo(46, 28);
      ctx.lineTo(32, 52);
      ctx.lineTo(18, 28);
      ctx.closePath();
      ctx.fill();
      strokePath(2.4);
      ctx.fillStyle = '#FF5757';
      ctx.beginPath();
      ctx.arc(32, 30, 5.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
