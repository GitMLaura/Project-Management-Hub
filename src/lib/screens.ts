// Types and pure helpers for screens (stories H3.3.x).

export type ScreenRecord = {
  id: string;
  projectId: string;
  featureId: string;
  name: string;
  storagePath: string;
  sha256: string;
  phash: string;
  width: number;
  height: number;
  sizeBytes: number;
  isReference: boolean;
};

// Number of different bits between two perceptual hashes (0 = the same picture).
export function hammingDistance(a: string, b: string): number {
  let bits = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    let diff = parseInt(a[index], 16) ^ parseInt(b[index], 16);
    while (diff) {
      bits += diff & 1;
      diff >>= 1;
    }
  }
  return bits;
}

// Public address of the image in Storage (the bucket is public in the demo).
export function screenImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/screens/${storagePath}`;
}
