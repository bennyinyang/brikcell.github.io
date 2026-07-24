import { API_BASE } from "./api";

async function postJson(path: string, payload: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export function sendContract(roomId: string, payload: any) {
  return postJson(`/chat/${roomId}/contract`, payload);
}

export function sendPhaseUpdate(roomId: string, payload: any) {
  return postJson(`/chat/${roomId}/phase-update`, payload);
}

export function sendPaymentPrompt(roomId: string, payload: any) {
  return postJson(`/chat/${roomId}/payment-prompt`, payload);
}
