// Draws the demo screens as small PNG images, so no binary files live in the repository.
import { PNG } from "pngjs";
import type { SeedScreen } from "./aurora";

const WIDTH = 180;
const HEIGHT = 320;

// Tiny deterministic random numbers (same seed = same picture, every time).
function random(seed: number): () => number {
  let state = seed * 2654435761 >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function fillRect(png: PNG, x: number, y: number, w: number, h: number, gray: number, tint: number) {
  for (let row = y; row < Math.min(HEIGHT, y + h); row += 1) {
    for (let col = x; col < Math.min(WIDTH, x + w); col += 1) {
      const offset = (row * WIDTH + col) * 4;
      png.data[offset] = Math.min(255, gray + tint);
      png.data[offset + 1] = gray;
      png.data[offset + 2] = Math.max(0, gray - tint);
      png.data[offset + 3] = 255;
    }
  }
}

export function renderScreen(spec: Pick<SeedScreen, "layout" | "variation">): Uint8Array {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const next = random(spec.layout);
  fillRect(png, 0, 0, WIDTH, HEIGHT, 238, 6); // page background
  fillRect(png, 0, 0, WIDTH, 36, 60, 30); // header bar

  // A few big blocks in different places and brightness: this is what tells screens apart.
  for (let block = 0; block < 7; block += 1) {
    const w = 40 + Math.floor(next() * 110);
    const h = 30 + Math.floor(next() * 80);
    const x = Math.floor(next() * (WIDTH - w));
    const y = 44 + Math.floor(next() * (HEIGHT - 44 - h));
    fillRect(png, x, y, w, h, 20 + Math.floor(next() * 200), 14);
  }

  // The "new button" variation: one small dark patch in the bottom corner.
  if (spec.variation) fillRect(png, 150, 296, 20, 14, 30, 10);

  return new Uint8Array(PNG.sync.write(png));
}
