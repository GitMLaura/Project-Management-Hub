// Pure logic for ritual transcripts (story H4.1.1): reading .txt and .vtt files and searching the text.
import { normalizeLabel } from "@/lib/flows";

export const MAX_TRANSCRIPT_BYTES = 1_000_000; // 1 MB of text is far more than a meeting needs
export const TRANSCRIPT_EXTENSIONS = [".txt", ".vtt"] as const;

export type RitualKind = "daily" | "weekly" | "planning" | "review" | "retro";

export const RITUAL_KINDS: readonly { value: RitualKind; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "planning", label: "Planning" },
  { value: "review", label: "Review" },
  { value: "retro", label: "Retro" },
];

export function isRitualKind(value: unknown): value is RitualKind {
  return RITUAL_KINDS.some((kind) => kind.value === value);
}

export function ritualKindLabel(kind: RitualKind): string {
  return RITUAL_KINDS.find((item) => item.value === kind)?.label ?? kind;
}

export function transcriptExtension(fileName: string): ".txt" | ".vtt" | null {
  const lower = fileName.toLowerCase();
  return TRANSCRIPT_EXTENSIONS.find((extension) => lower.endsWith(extension)) ?? null;
}

const TIMING_LINE = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,]\d{1,3}\s*-->\s*\S+/;

// "00:01:05.200 --> ..." becomes "01:05" (or "1:01:05" past one hour).
function formatStart(hours: string | undefined, minutes: string, seconds: string): string {
  const h = Number(hours ?? 0);
  return h > 0 ? `${h}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

// Turns WebVTT into plain lines: "[01:05] Speaker: text". Removes header, notes, cue ids and tags.
function parseVtt(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let start: string | null = null;
  let skippingNote = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") {
      skippingNote = false;
      start = null;
      continue;
    }
    if (skippingNote) continue;
    if (/^WEBVTT/.test(line) && out.length === 0 && start === null) continue;
    if (/^(NOTE|STYLE|REGION)(\s|$)/.test(line)) {
      skippingNote = true;
      continue;
    }
    const timing = TIMING_LINE.exec(line);
    if (timing) {
      start = formatStart(timing[1], timing[2], timing[3]);
      continue;
    }
    if (start === null) continue; // cue identifier line (before the timing line)

    // <v Name>text</v>  ->  "Name: text"; other tags are dropped.
    const voice = /^<v(?:\.[^\s>]*)?\s+([^>]+)>/.exec(line);
    const text = line.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    out.push(voice ? `[${start}] ${voice[1].trim()}: ${text}` : `[${start}] ${text}`);
  }
  return out.join("\n");
}

function parseTxt(content: string): string {
  return content
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Reads the text of a .txt or .vtt transcript into the plain text the Hub stores.
export function parseTranscript(fileName: string, content: string): string {
  const extension = transcriptExtension(fileName);
  if (!extension) throw new Error("Formato não suportado. Envie um arquivo .txt ou .vtt.");
  const text = content.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const result = extension === ".vtt" ? parseVtt(text) : parseTxt(text);
  if (!result) throw new Error("O arquivo não tem texto de transcrição.");
  return result;
}

export type TranscriptLine = { number: number; text: string; match: boolean };

// All lines of the transcript, marking the ones that contain the query
// (ignores case, accents and punctuation, like the flow search).
export function searchTranscript(transcript: string, query: string): TranscriptLine[] {
  const needle = normalizeLabel(query);
  return transcript.split("\n").map((text, index) => ({
    number: index + 1,
    text,
    match: needle !== "" && normalizeLabel(text).includes(needle),
  }));
}

export type RitualImportInput = {
  title: string;
  kind: string;
  heldOn: string;
  participantCount: number;
  fileName: string;
  fileSize: number;
};

// Returns the first problem in Portuguese, or null when the import can go ahead.
export function validateRitualImport(input: RitualImportInput): string | null {
  if (!input.title.trim()) return "Dê um título para o rito.";
  if (input.title.trim().length > 120) return "O título pode ter até 120 caracteres.";
  if (!isRitualKind(input.kind)) return "Escolha o tipo do rito.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.heldOn) || Number.isNaN(Date.parse(input.heldOn))) {
    return "Informe a data do rito.";
  }
  if (input.participantCount === 0) return "Escolha pelo menos um participante.";
  if (!transcriptExtension(input.fileName)) return "Formato não suportado. Envie um arquivo .txt ou .vtt.";
  if (input.fileSize === 0) return "O arquivo está vazio.";
  if (input.fileSize > MAX_TRANSCRIPT_BYTES) return "O arquivo passa de 1 MB. Envie uma transcrição menor.";
  return null;
}
