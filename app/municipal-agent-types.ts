export type MunicipalAgentActionType =
  | "none"
  | "create_ticket"
  | "create_task"
  | "create_event"
  | "send_internal_message"
  | "update_ticket_status"
  | "create_project"
  | "create_goal"
  | "create_place"
  | "navigate";

export type MunicipalAgentPayload = {
  title: string;
  description: string;
  department: string;
  priority: string;
  dueDate: string;
  dueAt: string;
  neighborhood: string;
  address: string;
  assignee: string;
  slaHours: number;
  kind: string;
  startsAt: string;
  endsAt: string;
  location: string;
  targetDepartments: string[];
  ticketProtocol: string;
  status: string;
  owner: string;
  target: number;
  current: number;
  unit: string;
  placeType: string;
  tags: string[];
  navTarget: string;
};

export type MunicipalAgentTurnResult = {
  reply: string;
  actionType: MunicipalAgentActionType;
  readyToExecute: boolean;
  requiresConfirmation: boolean;
  missingFields: string[];
  questions: string[];
  actionSummary: string;
  payload: MunicipalAgentPayload;
  source: "groq" | "regras";
};

export type MunicipalAgentAction = {
  type: Exclude<MunicipalAgentActionType, "none">;
  payload: MunicipalAgentPayload;
  summary: string;
};

export type MunicipalAgentExecutionResult = {
  ok: boolean;
  message: string;
  entityId?: string;
  protocol?: string;
};
