import { Plus } from "lucide-react";
import Link from "next/link";
import { BoardColumn, DragCard } from "@/components/board-dnd";
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import { isLateTask } from "@/lib/health";
import {
  GROUP_LABELS,
  ITEM_STATUSES,
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TaskCard({
  node,
  projectId,
  areaNames,
  assigneeNames,
  profile,
  inGroup,
  today,
}: Omit<BoardProps, "nodes" | "progress" | "canManage"> & {
  node: ItemNode;
  inGroup: boolean;
  today: string;
}) {
  const assignee = assigneeNames[node.assigneeId] ?? "";
  const canMove = canUpdateTaskStatus(profile, {
    areaName: areaNames[node.areaId] ?? "",
    assigneeName: assignee,
  });
  const late = isLateTask(node, today);
  return (
    <DragCard
      projectId={projectId}
      id={node.id}
      title={node.title}
      status={node.status}
      canMove={canMove}
      className={`flex scroll-mt-20 flex-col gap-3 rounded-2xl p-3 ${inGroup ? "bg-background" : "bg-card"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="min-w-0 flex-1 truncate text-sm font-medium"
          title={node.title}
        >
          {node.title}
        </p>
        {node.isCritical && (
          <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
            Crítico
          </span>
        )}
        {!node.isCritical && late && (
          <span className="shrink-0 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-900">
            Atrasada
          </span>
        )}
      </div>
      <dl className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <dt>Prazo</dt>
          <dd className="tabular-nums text-foreground">
            {formatDate(node.deadline)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>Responsável</dt>
          <dd>
            {assignee ? (
              <span
                title={assignee}
                aria-label={assignee}
                className="flex size-6 items-center justify-center rounded-full border bg-white text-[10px] font-semibold text-primary"
              >
                {initials(assignee)}
              </span>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </DragCard>
  );
}

// The scope as a board: one framed column per status; drag a card to change its status.
// A task is a card; a group is a bigger card holding its tasks as small cards, repeated in
// each column where it has tasks (and counting only the tasks shown in that column).
export function ScopeBoard({ nodes, canManage, ...rest }: BoardProps) {
  const groups = nodes.filter((node) => node.type === "group");
  const loose = nodes.filter((node) => node.type === "task");
  const { progress: _progress, ...cardProps } = rest;
  void _progress;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ITEM_STATUSES.map((status) => {
        const looseHere = loose.filter((task) => task.status === status);
        const groupsHere = groups
          .map((group) => ({
            group,
            tasks: group.children.filter((task) => task.status === status),
          }))
          .filter((entry) => entry.tasks.length > 0);
        const count =
          looseHere.length +
          groupsHere.reduce((sum, entry) => sum + entry.tasks.length, 0);
        return (
          <BoardColumn
            key={status}
            projectId={rest.projectId}
            status={status}
            count={count}
            dotClass={COLUMN_DOT[status]}
          >
            {count === 0 && (
              <p className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
                Nada aqui.
              </p>
            )}
            {groupsHere.map(({ group, tasks }) => (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-3xl bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2 px-1 pt-1">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-heading text-base font-semibold"
                      title={group.title}
                    >
                      {group.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.groupLabel
                        ? GROUP_LABELS[group.groupLabel]
                        : "Grupo"}{" "}
                      · {tasks.length}{" "}
                      {tasks.length === 1 ? "tarefa" : "tarefas"}
                    </p>
                  </div>
                  {canManage && (
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
                  <TaskCard
                    key={task.id}
                    node={task}
                    inGroup
                    today={today}
                    {...cardProps}
                  />
                ))}
              </div>
            ))}
            {looseHere.map((task) => (
              <TaskCard
                key={task.id}
                node={task}
                inGroup={false}
                today={today}
                {...cardProps}
              />
            ))}
          </BoardColumn>
        );
      })}
    </div>
  );
}
