import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  ITEM_STATUS_LABELS,
  ITEM_TYPE_LABELS,
  childTypeOf,
} from "@/lib/item-rules";
import type { ItemNode } from "@/lib/item-tree";

type ScopeTreeProps = {
  projectId: string;
  nodes: ItemNode[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
  canManage: boolean;
};

export function ScopeTree({ projectId, nodes, areaNames, assigneeNames, canManage }: ScopeTreeProps) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3 border-l pl-4">
      {nodes.map((node) => {
        const childType = childTypeOf(node.type);
        return (
          <li key={node.id} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 rounded-2xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{ITEM_TYPE_LABELS[node.type]}</Badge>
                <span className="font-medium">{node.title}</span>
                <Badge variant="secondary">{ITEM_STATUS_LABELS[node.status]}</Badge>
                {node.isCritical && <Badge variant="destructive">Crítico</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {areaNames[node.areaId] ?? "Área desconhecida"} ·{" "}
                {assigneeNames[node.assigneeId] ?? "Sem responsável"} ·{" "}
                {node.startDate ? `${formatDate(node.startDate)} a ` : "Prazo "}
                {formatDate(node.deadline)}
              </p>
              {node.type === "story" && (
                <p className="text-sm">
                  Como {node.storyPersona}, quero {node.storyAction} para {node.storyBenefit}.
                </p>
              )}
              {node.type === "story" && node.acceptanceCriteria.length > 0 && (
                <ul className="list-disc pl-5 text-sm">
                  {node.acceptanceCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              )}
              {canManage && childType && (
                <div>
                  <Link
                    href={`/projects/${projectId}/items/new?parent=${node.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Adicionar {ITEM_TYPE_LABELS[childType].toLowerCase()}
                  </Link>
                </div>
              )}
            </div>
            <ScopeTree
              projectId={projectId}
              nodes={node.children}
              areaNames={areaNames}
              assigneeNames={assigneeNames}
              canManage={canManage}
            />
          </li>
        );
      })}
    </ul>
  );
}
