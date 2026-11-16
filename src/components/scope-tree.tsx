import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { TaskStatusSelect } from "@/components/task-status-select";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import {
  ITEM_STATUS_LABELS,
  ITEM_TYPE_LABELS,
  canCreateItemInArea,
  canUpdateTaskStatus,
  childTypeOf,
} from "@/lib/item-rules";
import { countDescendants, isScopeIncomplete, type ItemNode } from "@/lib/item-tree";
import type { Progress } from "@/lib/scope-view";

type ScopeTreeProps = {
  projectId: string;
  nodes: ItemNode[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
  canManage: boolean;
  profile: DemoProfile;
  // Progress of every item, calculated on the full tree (not the filtered one).
  progress?: Record<string, Progress>;
  // "archived" shows the restore button instead of add/archive.
  mode?: "active" | "archived";
  // Only the top of an archived branch can be restored (its children come back with it).
  topLevel?: boolean;
};

function ProgressBar({ progress }: { progress: Progress }) {
  if (progress.total === 0) {
    return <p className="text-sm text-muted-foreground">Progresso: sem tarefas ainda</p>;
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso"
        className="h-2 w-32 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
      </div>
      <span>
        {progress.done} de {progress.total} tarefas concluídas ({progress.percent}%)
      </span>
    </div>
  );
}

export function ScopeTree({
  projectId,
  nodes,
  areaNames,
  assigneeNames,
  canManage,
  profile,
  progress,
  mode = "active",
  topLevel = true,
}: ScopeTreeProps) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3 border-l pl-4">
      {nodes.map((node) => {
        const childType = childTypeOf(node.type);
        const canEditStatus =
          mode === "active" &&
          node.type === "task" &&
          canUpdateTaskStatus(profile, {
            areaName: areaNames[node.areaId] ?? "",
            assigneeName: assigneeNames[node.assigneeId] ?? "",
          });
        const canChange =
          canManage && canCreateItemInArea(profile, areaNames[node.areaId] ?? "");
        return (
          <li key={node.id} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 rounded-2xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{ITEM_TYPE_LABELS[node.type]}</Badge>
                <span className="font-medium">{node.title}</span>
                {canEditStatus ? (
                  <TaskStatusSelect
                    projectId={projectId}
                    itemId={node.id}
                    itemTitle={node.title}
                    status={node.status}
                  />
                ) : (
                  <Badge variant="secondary">{ITEM_STATUS_LABELS[node.status]}</Badge>
                )}
                {node.isCritical && <Badge variant="destructive">Crítico</Badge>}
                {mode === "active" && isScopeIncomplete(node) && (
                  <Badge variant="outline">Escopo incompleto: falta detalhar</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {areaNames[node.areaId] ?? "Área desconhecida"} ·{" "}
                {assigneeNames[node.assigneeId] ?? "Sem responsável"} ·{" "}
                {node.startDate ? `${formatDate(node.startDate)} a ` : "Prazo "}
                {formatDate(node.deadline)}
              </p>
              {mode === "active" && progress?.[node.id] && (
                <ProgressBar progress={progress[node.id]} />
              )}
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
              {mode === "active" && (canManage || canChange) && (
                <div className="flex flex-wrap items-start gap-2">
                  {canManage && childType && (
                    <Link
                      href={`/projects/${projectId}/items/new?parent=${node.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Adicionar {ITEM_TYPE_LABELS[childType].toLowerCase()}
                    </Link>
                  )}
                  {canChange && (
                    <ArchiveButton
                      projectId={projectId}
                      itemId={node.id}
                      itemTitle={node.title}
                      mode="archive"
                      descendants={countDescendants(node)}
                    />
                  )}
                </div>
              )}
              {mode === "archived" && topLevel && canChange && (
                <ArchiveButton
                  projectId={projectId}
                  itemId={node.id}
                  itemTitle={node.title}
                  mode="restore"
                  descendants={0}
                />
              )}
            </div>
            <ScopeTree
              projectId={projectId}
              nodes={node.children}
              areaNames={areaNames}
              assigneeNames={assigneeNames}
              canManage={canManage}
              profile={profile}
              progress={progress}
              mode={mode}
              topLevel={false}
            />
          </li>
        );
      })}
    </ul>
  );
}
