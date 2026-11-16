import { describe, expect, it } from "vitest";
import {
  parseTranscript,
  searchTranscript,
  transcriptExtension,
  validateRitualImport,
} from "./transcripts";

const VTT = `WEBVTT

NOTE this is a comment
still a comment

1
00:00:01.000 --> 00:00:04.000
<v Helena Duarte>Bom dia, pessoal.</v>

2
00:01:05.200 --> 00:01:08.000
<v Camila Tavares>Terminei o <b>login</b>.
Falta só o teste.

3
01:02:03.000 --> 01:02:05.000
Sem identificação de voz.
`;

describe("parseTranscript", () => {
  it("reads .vtt into timestamped lines with speakers", () => {
    expect(parseTranscript("daily.vtt", VTT)).toBe(
      [
        "[00:01] Helena Duarte: Bom dia, pessoal.",
        "[01:05] Camila Tavares: Terminei o login.",
        "[01:05] Falta só o teste.",
        "[1:02:03] Sem identificação de voz.",
      ].join("\n"),
    );
  });

  it("accepts CRLF and a BOM in .vtt", () => {
    const text = parseTranscript("a.VTT", "﻿WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nOi\r\n");
    expect(text).toBe("[00:01] Oi");
  });

  it("keeps .txt text, trimming trailing spaces and extra blank lines", () => {
    expect(parseTranscript("a.txt", "﻿Helena: oi  \r\n\r\n\r\n\r\nCamila: olá\n")).toBe(
      "Helena: oi\n\nCamila: olá",
    );
  });

  it("rejects other formats and empty content", () => {
    expect(() => parseTranscript("a.docx", "x")).toThrow("Formato não suportado");
    expect(() => parseTranscript("a.txt", "  \n ")).toThrow("não tem texto");
    expect(() => parseTranscript("a.vtt", "WEBVTT\n\n")).toThrow("não tem texto");
  });
});

describe("transcriptExtension", () => {
  it("is case-insensitive", () => {
    expect(transcriptExtension("Reuniao.TXT")).toBe(".txt");
    expect(transcriptExtension("x.vtt")).toBe(".vtt");
    expect(transcriptExtension("x.pdf")).toBeNull();
  });
});

describe("searchTranscript", () => {
  const transcript = "Helena: Vamos revisar o Orçamento\nCamila: ok\nBruno: orcamento aprovado!";
  it("marks matching lines ignoring case and accents", () => {
    expect(searchTranscript(transcript, "ORÇAMENTO").map((line) => line.match)).toEqual([true, false, true]);
  });
  it("marks nothing for an empty query and keeps all lines", () => {
    const lines = searchTranscript(transcript, "  ");
    expect(lines).toHaveLength(3);
    expect(lines.some((line) => line.match)).toBe(false);
    expect(lines[1].number).toBe(2);
  });
});

describe("validateRitualImport", () => {
  const ok = {
    title: "Daily 12",
    kind: "daily",
    heldOn: "2026-11-10",
    participantCount: 2,
    fileName: "daily.vtt",
    fileSize: 1000,
  };
  it("accepts a valid import", () => {
    expect(validateRitualImport(ok)).toBeNull();
  });
  it("explains each problem", () => {
    expect(validateRitualImport({ ...ok, title: " " })).toContain("título");
    expect(validateRitualImport({ ...ok, kind: "x" })).toContain("tipo");
    expect(validateRitualImport({ ...ok, heldOn: "10/11" })).toContain("data");
    expect(validateRitualImport({ ...ok, participantCount: 0 })).toContain("participante");
    expect(validateRitualImport({ ...ok, fileName: "a.docx" })).toContain("Formato");
    expect(validateRitualImport({ ...ok, fileSize: 0 })).toContain("vazio");
    expect(validateRitualImport({ ...ok, fileSize: 2_000_000 })).toContain("1 MB");
  });
});
