import { API_URL } from "./workflows";

export interface LiveEvent {
  ts: number;
  kind: "tick" | "decision" | "error" | "info";
  nodeId?: string;
  message: string;
  data?: Record<string, unknown> | null;
}

export function subscribeEvents(
  workflowId: string,
  onEvent: (e: LiveEvent) => void,
  onError?: (err: Event) => void
): () => void {
  const source = new EventSource(`${API_URL}/workflows/${workflowId}/events`);
  source.onmessage = (ev) => {
    try {
      const parsed = JSON.parse(ev.data) as LiveEvent;
      onEvent(parsed);
    } catch {
      /* swallow non-JSON (e.g. ping comments already filtered) */
    }
  };
  if (onError) source.onerror = onError;
  return () => source.close();
}

export interface RunSummary {
  id: string;
  startedAt: number;
  stoppedAt: number | null;
  status: "running" | "stopped" | "error";
  errorMessage: string | null;
  eventCount: number;
}

export async function listRuns(workflowId: string): Promise<RunSummary[]> {
  const res = await fetch(`${API_URL}/workflows/${workflowId}/runs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as RunSummary[];
}

export interface StoredEvent {
  id: number;
  runId: string;
  ts: number;
  kind: "tick" | "decision" | "error" | "info";
  nodeId: string | null;
  message: string;
  data: Record<string, unknown> | null;
}

export async function getRunEvents(
  runId: string,
  limit = 200
): Promise<StoredEvent[]> {
  const res = await fetch(`${API_URL}/runs/${runId}/events?limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as StoredEvent[];
}
