// src/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"; // your server

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string; // optional Bearer token
};

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = "POST", body, headers = {}, token } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // ignore JSON parse errors (e.g. empty body)
  }

  if (!res.ok) {
    const msg = payload?.message || payload?.error?.message || `Request failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload as T;
}

// ---------- Auth endpoints ----------

export type UserDTO = {
  id: string;
  email: string;
  role: "artisan" | "employer" | "admin" | "support";
  name: string;
};

export type AuthResponse = {
  token: string;
  user: UserDTO;
};

export const AuthAPI = {
  signup(data: {
    email: string;
    password: string;
    role: "artisan" | "employer";
    name: string;
    phone?: string;
    location?: string;
    businessName?: string;
    skills?: string;      // comma-separated
    experience?: string;  // e.g. "5 years"
  }) {
    return request<AuthResponse>("/auth/signup", { body: data });
  },

  login(data: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", { body: data });
  },

  sendOtp(data: { email: string }) {
    return request<{ message: string }>("/auth/send-otp", { body: data });
  },

  verifyOtp(data: { email: string; otp: string }) {
    // returns { message, token, user }
    return request<{ message: string; token: string; user: UserDTO }>("/auth/verify-otp", { body: data });
  },

  forgotPassword(data: { email: string }) {
    return request<{ message: string }>("/auth/forgot-password", { body: data });
  },

  resetPassword(data: { email: string; otp: string; newPassword: string }) {
    return request<{ message: string }>("/auth/reset-password", { body: data });
  },
};

export function saveAuth(token: string, user: UserDTO) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function getAuth() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token");
  const user = localStorage.getItem("auth_user");
  if (!token || !user) return null;
  try {
    return { token, user: JSON.parse(user) as UserDTO };
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}
