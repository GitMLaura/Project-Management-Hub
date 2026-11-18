import { AlertTriangle, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FlowBoard } from "@/lib/flow-board";
import { screenImageUrl } from "@/lib/screens";

// One flow as a board: the sequence of its steps, with the screen of each step.
// The whole board opens the flow.
export function FlowBoardCard({
  projectId,
  board,
  groupTitle,
}: {
  projectId: string;
  board: FlowBoard;
  groupTitle: string;
}) {
  const { flow, steps, warnings } = board;
  return (
    <li id={`flow-${flow.id}`} className="scroll-mt-20">
      <Link
        href={`/projects/${projectId}/spec/${flow.featureId}/flows/${flow.id}`}
        className="flex flex-col gap-4 rounded-3xl bg-card p-5 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">{flow.title}</h2>
          <span className="text-xs text-muted-foreground">{groupTitle}</span>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível ler os passos deste fluxo. Abra para corrigir o texto.
          </p>
        ) : (
          <ol className="flex items-start gap-2 overflow-x-auto pb-2" aria-label={`Passos de ${flow.title}`}>
            {steps.map((step, index) => (
              <li key={step.id} className="flex shrink-0 items-start gap-2">
                <div className="flex w-28 flex-col gap-1.5">
                  {step.screen ? (
                    <Image
                      src={screenImageUrl(step.screen.storagePath)}
                      alt={`Tela ${step.screen.name}`}
                      width={step.screen.width}
                      height={step.screen.height}
                      unoptimized
                      className="h-36 w-full rounded-xl bg-muted object-contain"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed bg-muted/40 p-2 text-center text-xs text-muted-foreground">
                      Sem tela
                    </div>
                  )}
                  <span className="line-clamp-2 text-xs font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="mt-16 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        )}

        {warnings.map((warning) => (
          <p
            key={warning.names.join("|")}
            className="flex items-start gap-2 rounded-2xl bg-yellow-100 px-3 py-2 text-sm text-yellow-950"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>{warning.kind === "exact" ? "Telas repetidas." : "Telas muito parecidas."}</strong>{" "}
              {warning.names.map((name) => `“${name}”`).join(", ")}
              {warning.kind === "exact" ? " são idênticas" : " quase não mudam"}: dá para reaproveitar.
            </span>
          </p>
        ))}
      </Link>
    </li>
  );
}
