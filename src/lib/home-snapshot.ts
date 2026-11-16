// Numbers shown in the "Visão rápida" cards of the home page. Pure: no database here.
import type { HealthColor } from "@/lib/health";

export type ProjectStats = {
  health: HealthColor;
  doneTasks: number;
  totalTasks: number;
  lateTasks: number;
};

export type HomeSnapshot = {
  projects: number;
  healthy: number; // projects in green
  attention: number; // projects in yellow or red
  doneTasks: number;
  totalTasks: number;
  progressPercent: number;
  lateTasks: number;
};

export function buildHomeSnapshot(stats: readonly ProjectStats[]): HomeSnapshot {
  const doneTasks = stats.reduce((sum, item) => sum + item.doneTasks, 0);
  const totalTasks = stats.reduce((sum, item) => sum + item.totalTasks, 0);
  const healthy = stats.filter((item) => item.health === "green").length;
  return {
    projects: stats.length,
    healthy,
    attention: stats.length - healthy,
    doneTasks,
    totalTasks,
    progressPercent: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    lateTasks: stats.reduce((sum, item) => sum + item.lateTasks, 0),
  };
}
