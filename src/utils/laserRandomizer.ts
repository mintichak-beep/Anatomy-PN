export interface LaserSpot {
  x: number;
  y: number;
}

function clampPct(v: number, min = 8, max = 92): number {
  return Number(Math.max(min, Math.min(max, v)).toFixed(2));
}

function distSq(a: LaserSpot, b: LaserSpot): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Synchronous fallback coordinate picker inside the central 4:3 stage region,
 * spaced away from any existing spots.
 */
export function pickFallbackLaserSpot(
  existingSpots: LaserSpot[] = [],
  bounds: { minX: number; maxX: number; minY: number; maxY: number } = {
    minX: 25,
    maxX: 75,
    minY: 22,
    maxY: 78,
  }
): LaserSpot {
  let best: LaserSpot = {
    x: clampPct(bounds.minX + Math.random() * (bounds.maxX - bounds.minX)),
    y: clampPct(bounds.minY + Math.random() * (bounds.maxY - bounds.minY)),
  };

  if (existingSpots.length === 0) return best;

  let bestMinDist = -1;
  for (let i = 0; i < 18; i++) {
    const candidate: LaserSpot = {
      x: clampPct(bounds.minX + Math.random() * (bounds.maxX - bounds.minX)),
      y: clampPct(bounds.minY + Math.random() * (bounds.maxY - bounds.minY)),
    };
    const minD = Math.min(...existingSpots.map((s) => distSq(candidate, s)));
    if (minD > bestMinDist) {
      bestMinDist = minD;
      best = candidate;
    }
  }
  return best;
}

function computeObjectContainBox(imgW: number, imgH: number): {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
} {
  const stageRatio = 4 / 3;
  const imgRatio = imgW > 0 && imgH > 0 ? imgW / imgH : stageRatio;
  if (imgRatio > stageRatio) {
    const height = (stageRatio / imgRatio) * 100;
    return {
      offsetX: 0,
      offsetY: (100 - height) / 2,
      width: 100,
      height,
    };
  }
  const width = (imgRatio / stageRatio) * 100;
  return {
    offsetX: (100 - width) / 2,
    offsetY: 0,
    width,
    height: 100,
  };
}

/**
 * Inspects an uploaded image via an offscreen canvas to locate non-background
 * anatomical specimen pixels and returns well-spaced % coordinates aligned to
 * the 4:3 object-contain stage.
 */
export async function analyzeImageSpots(
  imageUrl: string,
  count: number
): Promise<LaserSpot[]> {
  if (count <= 0) return [];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const fallbackAll = (
      box = { offsetX: 0, offsetY: 0, width: 100, height: 100 }
    ) => {
      const results: LaserSpot[] = [];
      const bounds = {
        minX: box.offsetX + box.width * 0.22,
        maxX: box.offsetX + box.width * 0.78,
        minY: box.offsetY + box.height * 0.2,
        maxY: box.offsetY + box.height * 0.8,
      };
      for (let i = 0; i < count; i++) {
        results.push(pickFallbackLaserSpot(results, bounds));
      }
      resolve(results);
    };

    img.onload = () => {
      const box = computeObjectContainBox(img.naturalWidth, img.naturalHeight);
      try {
        const w = 72;
        const h = 54;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallbackAll(box);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        // Estimate background color from the 4 corners
        const cornerIdx = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + (w - 1)) * 4,
        ];
        let bgR = 0;
        let bgG = 0;
        let bgB = 0;
        for (const idx of cornerIdx) {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR /= 4;
        bgG /= 4;
        bgB /= 4;

        const candidates: LaserSpot[] = [];
        const minRow = Math.floor(h * 0.14);
        const maxRow = Math.ceil(h * 0.86);
        const minCol = Math.floor(w * 0.14);
        const maxCol = Math.ceil(w * 0.86);

        for (let y = minRow; y < maxRow; y++) {
          for (let x = minCol; x < maxCol; x++) {
            const idx = (y * w + x) * 4;
            const a = data[idx + 3];
            if (a < 80) continue;

            const dr = data[idx] - bgR;
            const dg = data[idx + 1] - bgG;
            const db = data[idx + 2] - bgB;
            const colorDiff = Math.sqrt(dr * dr + dg * dg + db * db);
            if (colorDiff > 28) {
              candidates.push({
                x: clampPct(box.offsetX + ((x + 0.5) / w) * box.width),
                y: clampPct(box.offsetY + ((y + 0.5) / h) * box.height),
              });
            }
          }
        }

        if (candidates.length < Math.max(25, count * 2)) {
          fallbackAll(box);
          return;
        }

        // Farthest-point sampling from shuffled foreground candidates
        const chosen: LaserSpot[] = [];
        const firstIdx = Math.floor(Math.random() * candidates.length);
        chosen.push(candidates[firstIdx]);

        const samplePoolSize = Math.min(candidates.length, 160);
        for (let k = 1; k < count; k++) {
          let bestCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          let bestMinDist = -1;

          for (let s = 0; s < samplePoolSize; s++) {
            const cand = candidates[Math.floor(Math.random() * candidates.length)];
            const minD = Math.min(...chosen.map((c) => distSq(cand, c)));
            if (minD > bestMinDist) {
              bestMinDist = minD;
              bestCandidate = cand;
            }
          }
          chosen.push(bestCandidate);
        }

        resolve(chosen);
      } catch {
        fallbackAll(box);
      }
    };

    img.onerror = () => fallbackAll();
    img.src = imageUrl;
  });
}

/**
 * Picks a single smart random laser spot on an image, staying well away from avoidSpot.
 */
export async function pickSmartRandomLaserSpot(
  imageUrl?: string,
  avoidSpot?: LaserSpot
): Promise<LaserSpot> {
  if (!imageUrl) {
    return pickFallbackLaserSpot(avoidSpot ? [avoidSpot] : []);
  }
  const pool = await analyzeImageSpots(imageUrl, 8);
  if (pool.length === 0) {
    return pickFallbackLaserSpot(avoidSpot ? [avoidSpot] : []);
  }
  if (!avoidSpot) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Pick a random spot among those farthest from avoidSpot
  const sorted = [...pool].sort((a, b) => distSq(b, avoidSpot) - distSq(a, avoidSpot));
  const topSlice = sorted.slice(0, Math.min(4, sorted.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)];
}
