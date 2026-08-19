import type { MunicipalAiAnalysis } from "./municipal-ai.server";
import { DATA_BUCKET, downloadJsonObject, ensureDataBucket, supabaseAdminConfig, supabaseAdminHeaders } from "./supabase-admin";

export type FeedbackKind = "Reclamação" | "Elogio" | "Sugestão";
export type FeedbackStatus = "Novo" | "Em análise" | "Encaminhado" | "Respondido" | "Concluído";
export type CitizenFeedbackAttachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  storagePath: string;
  createdAt: string;
};

export type CitizenFeedback = {
  id: string;
  protocol: string;
  accessCode: string;
  kind: FeedbackKind;
  rating: number;
  subject: string;
  message: string;
  name: string;
  contact: string;
  neighborhood: string;
  anonymous: boolean;
  destination: "Gabinete do Prefeito";
  status: FeedbackStatus;
  mayorNote: string;
  citizenResponse: string;
  forwardedDepartment: string;
  ai?: MunicipalAiAnalysis;
  similarProtocols?: string[];
  similarCount?: number;
  attachments?: CitizenFeedbackAttachment[];
  resolutionRating?: number | null;
  resolutionNps?: number | null;
  resolutionComment?: string;
  resolutionEvaluatedAt?: string | null;
  history: Array<{ at: string; action: string; detail: string }>;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
};

export function feedbackPath(id: string) { return `citizen-feedback/${id}.json`; }

export async function listCitizenFeedback(): Promise<CitizenFeedback[]> {
  await ensureDataBucket();
  const { url } = supabaseAdminConfig();
  const response = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(DATA_BUCKET)}`, {
    method: "POST",
    headers: supabaseAdminHeaders("application/json"),
    body: JSON.stringify({ prefix: "citizen-feedback", limit: 500, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  const objects = await response.json() as Array<{ name?: string }>;
  const values = await Promise.all(objects
    .filter((item) => item.name?.endsWith(".json"))
    .map(async (item) => downloadJsonObject<CitizenFeedback>(`citizen-feedback/${item.name!}`)));
  return values.filter((item): item is CitizenFeedback => Boolean(item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
