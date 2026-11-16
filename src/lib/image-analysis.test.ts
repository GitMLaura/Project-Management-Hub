import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import {
  analyzeImage,
  detectImageType,
  validateScreenUpload,
  MAX_SCREEN_BYTES,
} from "@/lib/image-analysis";
import { hammingDistance } from "@/lib/screens";

type Pixel = [number, number, number];

function makePng(width: number, height: number, paint: (x: number, y: number) => Pixel): Uint8Array {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      const offset = (y * width + x) * 4;
      png.data[offset] = r;
      png.data[offset + 1] = g;
      png.data[offset + 2] = b;
      png.data[offset + 3] = 255;
    }
  }
  return new Uint8Array(PNG.sync.write(png));
}

// A "screen": dark header bar, a card on the left and a button at the bottom right.
function screen(width: number, height: number, tweak = 0): (x: number, y: number) => Pixel {
  return (x, y) => {
    const u = x / width;
    const v = y / height;
    if (v < 0.12) return [30 + tweak, 30, 40];
    if (u < 0.45 && v > 0.25 && v < 0.6) return [240, 200 + tweak, 120];
    if (u > 0.6 && v > 0.8 && v < 0.92) return [20, 140 + tweak, 70];
    return [250, 250, 250];
  };
}

// A completely different layout: nine vertical stripes, alternating dark and light.
const stripes = (width: number) => (x: number): Pixel =>
  Math.floor((x / width) * 9) % 2 === 0 ? [20, 20, 30] : [240, 240, 240];

describe("detectImageType", () => {
  it("recognizes PNG and JPEG by their first bytes", () => {
    expect(detectImageType(makePng(4, 4, () => [0, 0, 0]))).toBe("png");
    const jpg = jpeg.encode({ width: 4, height: 4, data: Buffer.alloc(64, 128) }, 80).data;
    expect(detectImageType(new Uint8Array(jpg))).toBe("jpeg");
  });

  it("rejects anything else", () => {
    expect(detectImageType(new TextEncoder().encode("GIF89a...."))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});

describe("validateScreenUpload", () => {
  it("needs a name and a file within the size limit", () => {
    expect(validateScreenUpload({ name: " ", size: 10 })).toContain("nome");
    expect(validateScreenUpload({ name: "Login", size: 0 })).toContain("arquivo");
    expect(validateScreenUpload({ name: "Login", size: MAX_SCREEN_BYTES + 1 })).toContain("4 MB");
    expect(validateScreenUpload({ name: "Login", size: MAX_SCREEN_BYTES })).toBeNull();
  });
});

describe("analyzeImage", () => {
  it("returns size, SHA-256 and a 16-character perceptual hash", () => {
    const result = analyzeImage(makePng(120, 80, screen(120, 80)));
    expect(result.type).toBe("png");
    expect([result.width, result.height]).toEqual([120, 80]);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.phash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("gives identical hashes for identical files", () => {
    const bytes = makePng(120, 80, screen(120, 80));
    const a = analyzeImage(bytes);
    const b = analyzeImage(new Uint8Array(bytes));
    expect(a.sha256).toBe(b.sha256);
    expect(a.phash).toBe(b.phash);
  });

  it("keeps the perceptual hash almost the same for the same screen at another size", () => {
    const small = analyzeImage(makePng(120, 80, screen(120, 80)));
    const big = analyzeImage(makePng(360, 240, screen(360, 240)));
    expect(small.sha256).not.toBe(big.sha256);
    expect(hammingDistance(small.phash, big.phash)).toBeLessThanOrEqual(4);
  });

  it("keeps it close for a slightly different screen (a color shift)", () => {
    const a = analyzeImage(makePng(200, 120, screen(200, 120)));
    const b = analyzeImage(makePng(200, 120, screen(200, 120, 12)));
    expect(a.sha256).not.toBe(b.sha256);
    expect(hammingDistance(a.phash, b.phash)).toBeLessThanOrEqual(6);
  });

  it("makes the hash far for a very different screen", () => {
    const a = analyzeImage(makePng(200, 120, screen(200, 120)));
    const b = analyzeImage(makePng(200, 120, stripes(200)));
    expect(hammingDistance(a.phash, b.phash)).toBeGreaterThan(20);
  });

  it("reads JPEG files too", () => {
    const rgba = Buffer.alloc(40 * 30 * 4, 255);
    const jpg = new Uint8Array(jpeg.encode({ width: 40, height: 30, data: rgba }, 85).data);
    const result = analyzeImage(jpg);
    expect(result.type).toBe("jpeg");
    expect([result.width, result.height]).toEqual([40, 30]);
  });

  it("explains unsupported or broken files", () => {
    expect(() => analyzeImage(new TextEncoder().encode("not an image at all"))).toThrow(/PNG ou JPG/);
    const broken = makePng(20, 20, () => [1, 2, 3]).slice(0, 40);
    expect(() => analyzeImage(broken)).toThrow(/ler a imagem/);
  });
});

describe("hammingDistance", () => {
  it("counts different bits", () => {
    expect(hammingDistance("0000000000000000", "0000000000000000")).toBe(0);
    expect(hammingDistance("0000000000000000", "ffffffffffffffff")).toBe(64);
    expect(hammingDistance("0000000000000001", "0000000000000003")).toBe(1);
  });
});
