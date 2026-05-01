import type { Workflow } from "@shared/types";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export { API_URL };

export interface CreateWorkflowBody {
  name: string;
  nodes: Workflow["nodes"];
  edges: Workflow["edges"];
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        message =
          typeof body.error === "string"
            ? body.error
            : JSON.stringify(body.error);
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function listWorkflows(): Promise<Workflow[]> {
  return fetch(`${API_URL}/workflows`).then((r) => handle<Workflow[]>(r));
}

export function getWorkflow(id: string): Promise<Workflow> {
  return fetch(`${API_URL}/workflows/${id}`).then((r) => handle<Workflow>(r));
}

export function createWorkflow(
  body: CreateWorkflowBody
): Promise<{ id: string }> {
  return fetch(`${API_URL}/workflows`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle<{ id: string }>(r));
}

export function updateWorkflow(
  id: string,
  body: CreateWorkflowBody
): Promise<{ id: string }> {
  return fetch(`${API_URL}/workflows/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle<{ id: string }>(r));
}

export interface StatusResponse {
  running: boolean;
  startedAt?: number;
}

export interface StartResponse {
  running: true;
  alreadyRunning?: boolean;
  startedAt: number;
}

export function startWorkflow(
  id: string,
  opts: { sessionSignerId?: string | null } = {}
): Promise<StartResponse> {
  return fetch(`${API_URL}/workflows/${id}/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionSignerId: opts.sessionSignerId ?? null }),
  }).then((r) => handle<StartResponse>(r));
}

export function stopWorkflow(id: string): Promise<{ running: false }> {
  return fetch(`${API_URL}/workflows/${id}/stop`, {
    method: "POST",
  }).then((r) => handle<{ running: false }>(r));
}

export function getStatus(id: string): Promise<StatusResponse> {
  return fetch(`${API_URL}/workflows/${id}/status`).then((r) =>
    handle<StatusResponse>(r)
  );
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/workflows/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        message =
          typeof body.error === "string"
            ? body.error
            : JSON.stringify(body.error);
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export interface SessionPolicy {
  pair: string;
  maxNotional: number;
}

export interface CreateSessionBody {
  ownerAccount: string;
  secretKey: string;
  policy: SessionPolicy;
  ttlMinutes?: number;
}

export interface SessionSummary {
  id: string;
  publicKey: string;
  expiresAt: number;
}

export function createSession(
  workflowId: string,
  body: CreateSessionBody
): Promise<SessionSummary> {
  return fetch(`${API_URL}/workflows/${workflowId}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle<SessionSummary>(r));
}

export interface SessionRecord {
  id: string;
  ownerAccount: string;
  publicKey: string;
  policy: SessionPolicy;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

export function listSessions(workflowId: string): Promise<SessionRecord[]> {
  return fetch(`${API_URL}/workflows/${workflowId}/sessions`).then((r) =>
    handle<SessionRecord[]>(r)
  );
}

export async function revokeSession(
  workflowId: string,
  sessionId: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/workflows/${workflowId}/sessions/${sessionId}`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`HTTP ${res.status}`);
  }
}
