import { Plus } from "lucide-react";
import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { Branch, BranchBody, BranchToggle } from "@/components/branch";
import { TaskCheckbox } from "@/components/group-selection";
import { TaskStatusSelect } from "@/components/task-status-select";
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import {
  GROUP_LABELS,
  ITEM_STATUS_LABELS,
  canCreateItemInArea,
  canUpdateTaskStatus,
  type ItemStatus,
} from "@/lib/item-rules";
import { countDescendants, type ItemNode } from "@/lib/item-tree";
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
      <span>Tarefa</span>
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

function TaskRow({
  projectId,
  node,
  areaNames,
  assigneeNames,
  canManage,
  profile,
  mode = "active",
  inGroup,
}: RowProps & { inGroup: boolean }) {
  const areaName = areaNames[node.areaId] ?? "Área desconhecida";
  const assigneeName = assigneeNames[node.assigneeId] ?? "Sem responsável";
  const canEditStatus =
    mode === "active" &&
    canUpdateTaskStatus(profile, {
      areaName: areaNames[node.areaId] ?? "",
      assigneeName: assigneeNames[node.assigneeId] ?? "",
    });
  const canChange = canManage && canCreateItemInArea(profile, areaNames[node.areaId] ?? "");

  return (
    <div
      id={`item-${node.id}`}
      className={`scroll-mt-20 px-5 py-3 hover:bg-muted/40 ${SCOPE_GRID}`}
    >
      <div className="flex min-w-0 items-start gap-2" style={{ paddingLeft: inGroup ? 24 : 0 }}>
        {mode === "active" && canChange ? (
          <TaskCheckbox id={node.id} title={node.title} />
        ) : (
          <span className="size-6 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{node.title}</p>
          {node.isCritical && (
            <p className="mt-0.5 text-xs">
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-medium text-red-800">Crítico</span>
            </p>
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
      <span className="hidden md:inline" aria-hidden="true" />
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
        {mode === "active" && canChange && (
          <ArchiveButton projectId={projectId} itemId={node.id} itemTitle={node.title} mode="archive" descendants={0} />
        )}
        {mode === "archived" && !inGroup && canChange && (
          <ArchiveButton projectId={projectId} itemId={node.id} itemTitle={node.title} mode="restore" descendants={0} />
        )}
      </div>
    </div>
  );
}

function GroupBlock(props: RowProps) {
  const { projectId, node, canManage, progress, mode = "active" } = props;
  const taskCount = node.children.length;
  return (
    <Branch>
      <div id={`item-${node.id}`} className={`scroll-mt-20 px-5 py-3 ${SCOPE_GRID}`}>
        <div className="flex min-w-0 items-center gap-2">
          <BranchToggle label={node.title} />
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold">{node.title}</p>
            <p className="text-xs text-muted-foreground">
              {node.groupLabel ? GROUP_LABELS[node.groupLabel] : "Grupo"} · {taskCount}{" "}
              {taskCount === 1 ? "tarefa" : "tarefas"}
            </p>
          </div>
        </div>
        <span className="hidden md:inline" aria-hidden="true" />
        <span className="hidden md:inline" aria-hidden="true" />
        <span className="hidden md:inline" aria-hidden="true" />
        <div className="mt-2 md:mt-0">
          {mode === "active" && progress?.[node.id] ? <MiniProgress progress={progress[node.id]} /> : null}
        </div>
        <span className="hidden md:inline" aria-hidden="true" />
        <div className="mt-2 flex items-center justify-end gap-1 md:mt-0">
          {mode === "active" && canManage && (
            <Link
              href={`/projects/${projectId}/items/new?group=${node.id}`}
              aria-label={`Adicionar tarefa em ${node.title}`}
              title="Adicionar tarefa"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-4" aria-hidden="true" />
            </Link>
          )}
          {mode === "active" && canManage && (
            <ArchiveButton
              projectId={projectId}
              itemId={node.id}
              itemTitle={node.title}
              mode="archive"
              descendants={countDescendants(node)}
            />
          )}
          {mode === "archived" && canManage && (
            <ArchiveButton projectId={projectId} itemId={node.id} itemTitle={node.title} mode="restore" descendants={0} />
          )}
        </div>
      </div>
      {taskCount > 0 && (
        <BranchBody>
          <ul className="divide-y divide-border/60 border-t border-border/60">
            {node.children.map((child) => (
              <li key={child.id}>
                <TaskRow {...props} node={child} inGroup />
              </li>
            ))}
          </ul>
        </BranchBody>
      )}
    </Branch>
  );
}

// The scope as a list in the style of task managers: one white block per group, with its
// tasks as rows that can be folded, and one block for the tasks that have no group.
export function ScopeTree({ nodes, ...rest }: ScopeTreeProps) {
  if (nodes.length === 0) return null;
  const groups = nodes.filter((node) => node.type === "group");
  const loose = nodes.filter((node) => node.type === "task");
  return (
    <div className="flex flex-col gap-3">
      <ScopeHeader />
      <ul className="flex flex-col gap-4">
        {groups.map((node) => (
          <li key={node.id} className="overflow-hidden rounded-2xl bg-card">
            <GroupBlock {...rest} node={node} depth={0} />
          </li>
        ))}
        {loose.length > 0 && (
          <li className="overflow-hidden rounded-2xl bg-card">
            {groups.length > 0 && (
              <p className="px-5 pt-3 pb-1 font-heading text-base font-semibold">Sem grupo</p>
            )}
            <ul className="divide-y divide-border/60">
              {loose.map((node) => (
                <li key={node.id}>
                  <TaskRow {...rest} node={node} depth={0} inGroup={false} />
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
}
