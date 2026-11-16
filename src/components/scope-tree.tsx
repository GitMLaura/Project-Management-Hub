import { Plus } from "lucide-react";
import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { Branch, BranchBody, BranchToggle } from "@/components/branch";
import { TaskStatusSelect } from "@/components/task-status-select";
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import {
  ITEM_STATUS_LABELS,
  ITEM_TYPE_LABELS,
  canCreateItemInArea,
  canUpdateTaskStatus,
  childTypeOf,
  type ItemStatus,
} from "@/lib/item-rules";
import { countDescendants, isScopeIncomplete, type ItemNode } from "@/lib/item-tree";
import type { Progress } from "@/lib/scope-view";

// One grid for the header and every row, so the columns line up on wide screens.
export const SCOPE_GRID =
  "md:grid md:grid-cols-[minmax(0,1fr)_8rem_9rem_4rem_7rem_8.5rem_4.5rem] md:items-center md:gap-4";

const STATUS_PILL: Record<ItemStatus, string> = {
  a_fazer: "bg-muted text-foreground",
  em_andamento: "bg-sky-100 text-sky-900",
  bloqueado: "bg-yellow-100 text-yellow-900",
  concluido: "bg-green-100 text-green-800",
};

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
};

type RowProps = Omit<ScopeTreeProps, "nodes"> & { node: ItemNode; depth: number };

export function ScopeHeader() {
  return (
    <div
      className={`hidden px-5 text-xs font-medium text-muted-foreground ${SCOPE_GRID}`}
      aria-hidden="true"
    >
      <span>Item</span>
      <span>Área</span>
      <span>Responsável</span>
      <span>Prazo</span>
      <span>Progresso</span>
      <span>Status</span>
      <span className="text-right">Ações</span>
    </div>
  );
}

function MiniProgress({ progress }: { progress: Progress }) {
  if (progress.total === 0) return <span className="text-xs text-muted-foreground">Sem tarefas</span>;
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso: ${progress.done} de ${progress.total} tarefas concluídas`}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
      </div>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {progress.done}/{progress.total}
      </span>
    </div>
  );
}

function ItemRow({
  projectId,
  node,
  depth,
  areaNames,
  assigneeNames,
  canManage,
  profile,
  progress,
  mode = "active",
}: RowProps) {
  const childType = childTypeOf(node.type);
  const hasChildren = node.children.length > 0;
  const areaName = areaNames[node.areaId] ?? "Área desconhecida";
  const assigneeName = assigneeNames[node.assigneeId] ?? "Sem responsável";
  const canEditStatus =
    mode === "active" &&
    node.type === "task" &&
    canUpdateTaskStatus(profile, { areaName: areaNames[node.areaId] ?? "", assigneeName: assigneeNames[node.assigneeId] ?? "" });
  const canChange = canManage && canCreateItemInArea(profile, areaNames[node.areaId] ?? "");
  const isEpic = node.type === "epic";

  return (
    <div
      id={`item-${node.id}`}
      className={`scroll-mt-20 px-5 py-3 ${SCOPE_GRID} ${isEpic ? "" : "hover:bg-muted/40"}`}
    >
      {/* Item: toggle, title and a line with type and flags */}
      <div className="flex min-w-0 items-start gap-1" style={{ paddingLeft: depth * 24 }}>
        {hasChildren ? <BranchToggle label={node.title} /> : <span className="size-6 shrink-0" aria-hidden="true" />}
        <div className="min-w-0">
          <p className={isEpic ? "font-heading text-base font-semibold" : "text-sm font-medium"}>{node.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{ITEM_TYPE_LABELS[node.type]}</span>
            {node.isCritical && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-medium text-red-800">Crítico</span>
            )}
            {mode === "active" && isScopeIncomplete(node) && (
              <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 font-medium text-yellow-900">
                Falta detalhar
              </span>
            )}
          </p>
          {node.type === "story" && (
            <details className="mt-1 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver história e critérios
              </summary>
              <p className="mt-1 text-sm">
                Como {node.storyPersona}, quero {node.storyAction} para {node.storyBenefit}.
              </p>
              {node.acceptanceCriteria.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {node.acceptanceCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              )}
            </details>
          )}
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground md:mt-0 md:text-sm md:text-foreground">
        <span className="md:hidden">Área: </span>
        {areaName}
      </p>
      <p className="text-xs text-muted-foreground md:text-sm md:text-foreground">
        <span className="md:hidden">Responsável: </span>
        {assigneeName}
      </p>
      <p className="text-xs tabular-nums text-muted-foreground md:text-sm md:text-foreground">
        <span className="md:hidden">Prazo: </span>
        {formatDate(node.deadline).slice(0, 5)}
      </p>
      <div className="mt-2 md:mt-0">
        {mode === "active" && node.type !== "task" && progress?.[node.id] ? (
          <MiniProgress progress={progress[node.id]} />
        ) : (
          <span className="hidden md:inline" aria-hidden="true" />
        )}
      </div>
      <div className="mt-2 md:mt-0">
        {canEditStatus ? (
          <TaskStatusSelect projectId={projectId} itemId={node.id} itemTitle={node.title} status={node.status} />
        ) : (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_PILL[node.status]}`}>
            {ITEM_STATUS_LABELS[node.status]}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 md:mt-0">
        {mode === "active" && canManage && childType && (
          <Link
            href={`/projects/${projectId}/items/new?parent=${node.id}`}
            aria-label={`Adicionar ${ITEM_TYPE_LABELS[childType].toLowerCase()} em ${node.title}`}
            title={`Adicionar ${ITEM_TYPE_LABELS[childType].toLowerCase()}`}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Link>
        )}
        {mode === "active" && canChange && (
          <ArchiveButton
            projectId={projectId}
            itemId={node.id}
            itemTitle={node.title}
            mode="archive"
            descendants={countDescendants(node)}
          />
        )}
        {mode === "archived" && depth === 0 && canChange && (
          <ArchiveButton projectId={projectId} itemId={node.id} itemTitle={node.title} mode="restore" descendants={0} />
        )}
      </div>
    </div>
  );
}

function Branches(props: RowProps) {
  const { node, depth } = props;
  const rest: Omit<RowProps, "node" | "depth"> = {
    projectId: props.projectId,
    areaNames: props.areaNames,
    assigneeNames: props.assigneeNames,
    canManage: props.canManage,
    profile: props.profile,
    progress: props.progress,
    mode: props.mode,
  };
  return (
    <Branch>
      <ItemRow {...props} />
      {node.children.length > 0 && (
        <BranchBody>
          <ul className="divide-y divide-border/60 border-t border-border/60">
            {node.children.map((child) => (
              <li key={child.id}>
                <Branches {...rest} node={child} depth={depth + 1} />
              </li>
            ))}
          </ul>
        </BranchBody>
      )}
    </Branch>
  );
}

// The scope as a list in the style of task managers: one white block per epic, with the
// items inside it as rows that can be folded.
export function ScopeTree({ nodes, ...rest }: ScopeTreeProps) {
  if (nodes.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <ScopeHeader />
      <ul className="flex flex-col gap-4">
        {nodes.map((node) => (
          <li key={node.id} className="overflow-hidden rounded-2xl bg-card">
            <Branches {...rest} node={node} depth={0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
