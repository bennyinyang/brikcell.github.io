import { API_BASE, getAuth } from "./api";

export async function sendContract(roomId: string, payload: any) {
  const auth = getAuth();
  if (!auth) {
    throw new Error("Authentication required");
  }
  return fetch(`${API_BASE}/chat/${roomId}/contract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

export async function sendPhaseUpdate(roomId: string, payload: any) {
  const auth = getAuth();
  if (!auth) {
    throw new Error("Authentication required");
  }
  return fetch(`${API_BASE}/chat/${roomId}/phase-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

export async function sendPaymentPrompt(roomId: string, payload: any) {
  const auth = getAuth();
  if (!auth) {
    throw new Error("Authentication required");
  }
  return fetch(`${API_BASE}/chat/${roomId}/payment-prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify(payload)
  }).then(res => res.json());
}
