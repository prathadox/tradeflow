const BASE = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export interface WaitlistPayload {
  email: string;
  source?: string;
  referrer?: string;
}

export async function postWaitlist(payload: WaitlistPayload): Promise<void> {
  const res = await fetch(`${BASE}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}
