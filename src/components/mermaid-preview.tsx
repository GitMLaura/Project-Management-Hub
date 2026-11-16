"use client";

import { useEffect, useRef, useState } from "react";
import { explainMermaidError } from "@/lib/flows";

type MermaidPreviewProps = {
  source: string;
  // Tells the editor whether the diagram is drawable (null while it is still checking).
  onValidity?: (valid: boolean | null) => void;
};

// Draws a Mermaid flowchart. Only the browser can do this, so it runs after the page loads.
export function MermaidPreview({ source, onValidity }: MermaidPreviewProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const counter = useRef(0);
  const onValidityRef = useRef(onValidity);

  useEffect(() => {
    onValidityRef.current = onValidity;
  });

  useEffect(() => {
    let cancelled = false;
    onValidityRef.current?.(null);
    const timer = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true });
        await mermaid.parse(source);
        counter.current += 1;
        const { svg: drawn } = await mermaid.render(`flow-preview-${counter.current}`, source);
        if (cancelled) return;
        setSvg(drawn);
        setError(null);
        onValidityRef.current?.(true);
      } catch (caught) {
        if (cancelled) return;
        setError(explainMermaidError(caught instanceof Error ? caught.message : String(caught)));
        onValidityRef.current?.(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!svg) {
    return <p className="text-sm text-muted-foreground">Desenhando o fluxo...</p>;
  }
  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
