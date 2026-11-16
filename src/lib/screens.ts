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

export const DEFAULT_SIMILARITY_THRESHOLD = 10;
export const MAX_SIMILARITY_THRESHOLD = 32;

export type ScreenGroup = {
  screens: ScreenRecord[];
  // "exact" = at least two files are identical (same SHA-256) and nothing else differs;
  // "similar" = the group also has pictures that only look alike (perceptual hash).
  kind: "exact" | "similar";
};

// Groups screens that are copies (same SHA-256) or look alike (hamming distance <= threshold).
// A chain A~B~C ends up in one group. Screens with no match are left out.
export function groupScreens(
  screens: ScreenRecord[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): ScreenGroup[] {
  const parent = screens.map((_, index) => index);
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };

  for (let a = 0; a < screens.length; a += 1) {
    for (let b = a + 1; b < screens.length; b += 1) {
      const same =
        screens[a].sha256 === screens[b].sha256 ||
        hammingDistance(screens[a].phash, screens[b].phash) <= threshold;
      if (same) parent[find(b)] = find(a);
    }
  }

  const buckets = new Map<number, ScreenRecord[]>();
  screens.forEach((screen, index) => {
    const root = find(index);
    buckets.set(root, [...(buckets.get(root) ?? []), screen]);
  });

  return [...buckets.values()]
    .filter((members) => members.length > 1)
    .map((members) => ({
      screens: members,
      kind: new Set(members.map((screen) => screen.sha256)).size === 1 ? "exact" : "similar",
    }));
}

// Reads the "?limite=" value; falls back to the default when missing or out of range.
export function parseThreshold(raw: string | undefined): number {
  const value = Number(raw);
  if (raw === undefined || raw.trim() === "" || !Number.isInteger(value)) {
    return DEFAULT_SIMILARITY_THRESHOLD;
  }
  return value >= 0 && value <= MAX_SIMILARITY_THRESHOLD ? value : DEFAULT_SIMILARITY_THRESHOLD;
}

export type ScreenMatch = {
  screen: ScreenRecord;
  kind: "exact" | "similar";
  distance: number; // perceptual hash bits that differ
};

// Screens identical (same SHA-256) or similar (distance <= threshold) to one screen.
// Direct matches only, closest first.
export function findMatchesForScreen(
  target: ScreenRecord,
  all: ScreenRecord[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): ScreenMatch[] {
  const matches: ScreenMatch[] = [];
  for (const screen of all) {
    if (screen.id === target.id) continue;
    const distance = hammingDistance(target.phash, screen.phash);
    if (screen.sha256 === target.sha256) matches.push({ screen, kind: "exact", distance });
    else if (distance <= threshold) matches.push({ screen, kind: "similar", distance });
  }
  return matches.sort((a, b) => a.distance - b.distance);
}
