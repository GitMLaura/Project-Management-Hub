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
