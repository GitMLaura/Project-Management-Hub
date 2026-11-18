import { Plus } from "lucide-react";
import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { TaskCheckbox } from "@/components/group-selection";
import { TaskStatusSelect } from "@/components/task-status-select";
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import {
  GROUP_LABELS,
  ITEM_STATUSES,
  ITEM_STATUS_LABELS,
  canCreateItemInArea,
  canUpdateTaskStatus,
  type ItemStatus,
} from "@/lib/item-rules";
import type { ItemNode } from "@/lib/item-tree";
import type { Progress } from "@/lib/scope-view";

type BoardProps = {
  projectId: string;
  nodes: ItemNode[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
  canManage: boolean;
  profile: DemoProfile;
  progress: Record<string, Progress>;
};

const COLUMN_DOT: Record<ItemStatus, string> = {
  a_fazer: "bg-muted-foreground",
  em_andamento: "bg-sky-500",
  bloqueado: "bg-yellow-500",
  concluido: "bg-green-600",
};

function TaskCard({
  node,
  projectId,
  areaNames,
  assigneeNames,
  canManage,
  profile,
  inGroup,
}: Omit<BoardProps, "nodes" | "progress"> & { node: ItemNode; inGroup: boolean }) {
  const areaName = areaNames[node.areaId] ?? "";
  const canEditStatus = canUpdateTaskStatus(profile, {
    areaName,
    assigneeName: assigneeNames[node.assigneeId] ?? "",
  });
  const canChange = canManage && canCreateItemInArea(profile, areaName);
  return (
    <div
      id={`item-${node.id}`}
      className={`flex scroll-mt-20 flex-col gap-2 rounded-2xl p-3 ${inGroup ? "bg-background" : "bg-card"}`}
    >
      <div className="flex items-start gap-2">
        {canChange ? <TaskCheckbox id={node.id} title={node.title} /> : null}
        <p className="min-w-0 flex-1 text-sm font-medium">{node.title}</p>
        {canChange && (
          <ArchiveButton projectId={projectId} itemId={node.id} itemTitle={node.title} mode="archive" descendants={0} />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {areaName} · {assigneeNames[node.assigneeId] ?? "Sem responsável"} · {formatDate(node.deadline).slice(0, 5)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {node.isCritical && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">Crítico</span>
        )}
        {canEditStatus && (
          <TaskStatusSelect projectId={projectId} itemId={node.id} itemTitle={node.title} status={node.status} />
        )}
      </div>
    </div>
  );
}

// The scope as a board: one column per status. A task is a card; a group is a bigger card
// holding its tasks as small cards, repeated in each column where it has tasks.
export function ScopeBoard({ nodes, progress, ...rest }: BoardProps) {
  const groups = nodes.filter((node) => node.type === "group");
  const loose = nodes.filter((node) => node.type === "task");

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ITEM_STATUSES.map((status) => {
        const looseHere = loose.filter((task) => task.status === status);
        const groupsHere = groups
          .map((group) => ({ group, tasks: group.children.filter((task) => task.status === status) }))
          .filter((entry) => entry.tasks.length > 0);
        const count = looseHere.length + groupsHere.reduce((sum, entry) => sum + entry.tasks.length, 0);
        return (
          <section key={status} aria-label={ITEM_STATUS_LABELS[status]} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden="true" className={`size-2 rounded-full ${COLUMN_DOT[status]}`} />
              {ITEM_STATUS_LABELS[status]}
              <span className="text-muted-foreground">{count}</span>
            </h2>
            {count === 0 && <p className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">Nada aqui.</p>}
            {groupsHere.map(({ group, tasks }) => (
              <div key={group.id} className="flex flex-col gap-3 rounded-3xl bg-card p-3">
                <div className="flex items-start justify-between gap-2 px-1 pt-1">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-semibold">{group.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.groupLabel ? GROUP_LABELS[group.groupLabel] : "Grupo"} ·{" "}
                      {progress[group.id]?.done ?? 0}/{progress[group.id]?.total ?? 0} concluídas
                    </p>
                  </div>
                  {rest.canManage && (
                    <Link
                      href={`/projects/${rest.projectId}/items/new?group=${group.id}`}
                      aria-label={`Adicionar tarefa em ${group.title}`}
                      title="Adicionar tarefa"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                {tasks.map((task) => (
                  <TaskCard key={task.id} node={task} inGroup {...rest} />
                ))}
              </div>
            ))}
            {looseHere.map((task) => (
              <TaskCard key={task.id} node={task} inGroup={false} {...rest} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
