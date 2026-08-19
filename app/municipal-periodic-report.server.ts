import { listCitizenFeedback } from "./citizen-feedback-store.server";
import { generateMunicipalWeeklyReport } from "./municipal-ai.server";
import { downloadJsonObject, uploadJsonObject } from "./supabase-admin";

type Period = "daily" | "weekly" | "monthly";
type StoredTask = { status?: string; priority?: string; department?: string; dueAt?: string; updatedAt?: string };
type StoredProject = { status?: string; department?: string; progress?: number; dueDate?: string };
type StoredGoal = { department?: string; current?: number; target?: number; unit?: string; dueDate?: string };

function statePath(key: string) { return `state/${Buffer.from(key, "utf8").toString("base64url")}.json`; }
function daysFor(period: Period) { return period === "daily" ? 1 : period === "weekly" ? 7 : 31; }

export async function generatePeriodicMunicipalReport(period: Period) {
  const [feedback, tasks, projects, goals] = await Promise.all([
    listCitizenFeedback(),
    downloadJsonObject<StoredTask[]>(statePath("integrated:tasks:v2")).catch(() => null),
    downloadJsonObject<StoredProject[]>(statePath("integrated:projects:v2")).catch(() => null),
    downloadJsonObject<StoredGoal[]>(statePath("integrated:goals:v2")).catch(() => null),
  ]);
  const since = Date.now() - daysFor(period) * 86400000;
  const recent = feedback.filter((item) => new Date(item.createdAt).getTime() >= since);
  const statusCounts = Object.fromEntries(["Novo", "Em análise", "Encaminhado", "Respondido", "Concluído"].map((status) => [status, recent.filter((item) => item.status === status).length]));
  const kindCounts = Object.fromEntries(["Reclamação", "Elogio", "Sugestão"].map((kind) => [kind, recent.filter((item) => item.kind === kind).length]));
  const urgencyCounts = Object.fromEntries(["Baixa", "Normal", "Alta", "Crítica"].map((urgency) => [urgency, recent.filter((item) => item.ai?.urgency === urgency).length]));
  const categories = recent.reduce<Record<string, number>>((acc, item) => { const key = item.ai?.category || "Sem classificação"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const departments = recent.reduce<Record<string, number>>((acc, item) => { const key = item.forwardedDepartment || item.ai?.suggestedDepartment || "Gabinete do Prefeito"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const satisfaction = recent.length ? Number((recent.reduce((sum, item) => sum + item.rating, 0) / recent.length).toFixed(2)) : null;
  const postRatings = recent.filter((item) => typeof item.resolutionRating === "number");
  const resolutionSatisfaction = postRatings.length ? Number((postRatings.reduce((sum, item) => sum + Number(item.resolutionRating), 0) / postRatings.length).toFixed(2)) : null;
  const now = Date.now();
  const taskList = tasks ?? [];
  const activeTasks = taskList.filter((item) => item.status !== "Concluído");
  const overdueTasks = activeTasks.filter((item) => item.dueAt && new Date(item.dueAt).getTime() < now).length;
  const taskByDepartment = activeTasks.reduce<Record<string, number>>((acc, item) => { const key = item.department || "Sem setor"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const data = {
    period,
    days: daysFor(period),
    generatedAt: new Date().toISOString(),
    citizenService: { total: recent.length, statusCounts, kindCounts, urgencyCounts, categories, departments, satisfaction, resolutionSatisfaction, similarClustersDetected: recent.filter((item) => (item.similarCount || 0) > 0).length },
    operations: { tasksOpen: activeTasks.length, tasksOverdue: overdueTasks, urgentTasks: activeTasks.filter((item) => item.priority === "Urgente").length, taskByDepartment, projects: (projects ?? []).map((item) => ({ department: item.department, status: item.status, progress: item.progress, dueDate: item.dueDate })), goals: goals ?? [] },
  };
  const report = await generateMunicipalWeeklyReport(data);
  const date = new Date().toISOString().slice(0, 10);
  await uploadJsonObject(`reports/${period}/${date}.json`, { ...data, report: report.text, source: report.source });
  return { data, report: report.text, source: report.source };
}
