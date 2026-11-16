// Reads an uploaded screen image: type, size, SHA-256 (exact copies) and a perceptual hash
// (similar images). Pure: bytes in, numbers out. Used by the upload action (story H3.3.1).
import { createHash } from "node:crypto";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

export const MAX_SCREEN_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_SCREEN_PIXELS = 25_000_000;

export type ImageType = "png" | "jpeg";

export type ImageAnalysis = {
  type: ImageType;
  width: number;
  height: number;
  sha256: string; // 64 hex characters
  phash: string; // 16 hex characters (64-bit difference hash)
};

// Looks at the first bytes of the file, never at the name or the declared type.
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const isPng =
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (isPng) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  return null;
}

// Message in plain language, or null when the upload can go on.
export function validateScreenUpload(input: { name: string; size: number }): string | null {
  if (!input.name.trim()) return "Dê um nome para a tela.";
  if (input.size <= 0) return "Escolha um arquivo de imagem.";
  if (input.size > MAX_SCREEN_BYTES) return "A imagem passa de 4 MB. Exporte uma versão menor.";
  return null;
}

type Decoded = { width: number; height: number; data: Uint8Array }; // RGBA

function decode(bytes: Uint8Array, type: ImageType): Decoded {
  if (type === "png") {
    const buffer = Buffer.from(bytes);
    // The size sits in the first bytes: check it before spending memory on decoding.
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width * height > MAX_SCREEN_PIXELS) throw new Error("Imagem grande demais.");
    const png = PNG.sync.read(buffer);
    return { width: png.width, height: png.height, data: png.data };
  }
  const image = jpeg.decode(Buffer.from(bytes), {
    useTArray: true,
    maxResolutionInMP: MAX_SCREEN_PIXELS / 1_000_000,
    maxMemoryUsageInMB: 256,
  });
  return { width: image.width, height: image.height, data: image.data };
}

// Difference hash: shrink to 9x8 gray cells, then 1 bit per cell = "is this cell brighter than
// the one to its right?". Similar pictures give hashes that differ in only a few bits.
export function differenceHash(image: Decoded): string {
  const COLS = 9;
  const ROWS = 8;
  const { width, height, data } = image;
  const gray: number[][] = [];
  for (let row = 0; row < ROWS; row += 1) {
    const y0 = Math.floor((row * height) / ROWS);
    const y1 = Math.min(height, Math.max(y0 + 1, Math.floor(((row + 1) * height) / ROWS)));
    const cells: number[] = [];
    for (let col = 0; col < COLS; col += 1) {
      const x0 = Math.floor((col * width) / COLS);
      const x1 = Math.min(width, Math.max(x0 + 1, Math.floor(((col + 1) * width) / COLS)));
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const offset = (y * width + x) * 4;
          const alpha = data[offset + 3] / 255;
          // Transparent pixels count as white, like they look on a page.
          const r = data[offset] * alpha + 255 * (1 - alpha);
          const g = data[offset + 1] * alpha + 255 * (1 - alpha);
          const b = data[offset + 2] * alpha + 255 * (1 - alpha);
          sum += 0.299 * r + 0.587 * g + 0.114 * b;
          count += 1;
        }
      }
      cells.push(sum / count);
    }
    gray.push(cells);
  }

  let hex = "";
  for (let row = 0; row < ROWS; row += 1) {
    let nibble = 0;
    for (let col = 0; col < 8; col += 1) {
      nibble = (nibble << 1) | (gray[row][col] > gray[row][col + 1] ? 1 : 0);
      if (col % 4 === 3) {
        hex += nibble.toString(16);
        nibble = 0;
      }
    }
  }
  return hex;
}

// Throws an Error when the bytes are not a readable PNG or JPG.
export function analyzeImage(bytes: Uint8Array): ImageAnalysis {
  const type = detectImageType(bytes);
  if (!type) throw new Error("Formato não suportado. Envie PNG ou JPG.");
  let decoded: Decoded;
  try {
    decoded = decode(bytes, type);
  } catch {
    throw new Error("Não consegui ler a imagem. O arquivo pode estar corrompido ou ser grande demais.");
  }
  return {
    type,
    width: decoded.width,
    height: decoded.height,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    phash: differenceHash(decoded),
  };
}
