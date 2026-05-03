// src/lib/api.ts
export const API_BASE =

// Backend API URL
process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://brickcell-production.up.railway.app";

import { closeSocket } from "./socket-client";

export async function logoutEverywhere() {
  try {
    await AuthAPI.logout();
  } catch {
    
  } finally {
    closeSocket();
    clearAuth();
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: any;
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
};

/* ============================================================
   🔧 FIXED request(): ALWAYS loads token automatically
   ============================================================ */
async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {};

  if (API_BASE.includes("ngrok-free.app")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  // Content type
  if (opts.json && !opts.formData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.formData
      ? opts.formData
      : opts.json
      ? JSON.stringify(opts.json)
      : undefined,
    credentials: "include",
    signal: opts.signal,
  });

  // Handle both JSON & text responses safely
  const contentType = res.headers.get("content-type") || "";
  let data: any;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

/* ============================================================
   AUTH
   ============================================================ */

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
    skills?: string;
    experience?: string;
  }) {
    return request<AuthResponse>("/auth/signup", {
      method: "POST",
      json: data,
    });
  },

  login(data: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      json: data,
    });
  },

  verifyOtp(data: { email: string; otp: string }) {
    return request<{ message: string; token: string; user: UserDTO }>(
      "/auth/verify-otp",
      { method: "POST", json: data }
    );
  },

  forgotPassword(data: { email: string }) {
    return request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      json: data,
    });
  },

  resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      json: data,
    });
  },

  sendOtp(data: { email: string }) {
    return request<{ message: string }>("/auth/send-otp", {
      method: "POST",
      json: data,
    });
  },

  logout() {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

};

/* ============================================================
   ARTISAN PROFILE
   ============================================================ */

export type GetArtisanProfileResponse = {
  profile: {
    primaryService: any;
    service_type: any;
    id: string;
    bio: string | null;
    rating: number;
    location: string | null;
    hourlyRate: number | null;
    businessName: string | null;
    skills: string[];
    experience: string | null;
    profileImage: string | null;
    certifications: string[];
    serviceRadius: number | null;
    isRemoteAvailable: boolean;
    preferredContactMethod: string;
    instantBooking: boolean;
    minimumJobValue: number | null;
  };
  user: {
    phone: string; id: string; name: string; email: string 
};
  portfolio: any[];
  reviews: any[];
  badges: { key: string; label: string }[];
  meta: { completedJobs: number; reviewsCount: number };
};

export function getArtisanProfile(id: string, token?: string | null) {
  return request<GetArtisanProfileResponse>(`/artisans/${id}`, { token });
}

export function updateMyArtisanProfile(
  payload: any,
  token?: string | null
) {
  return request(`/artisans/me`, {
    method: "PATCH",
    json: payload,
    token,
  });
}


/* ============================================================
   ARTISAN SEARCH 
   ============================================================ */

export function searchArtisans(params: {
  type?: string;
  location?: string;
  rating?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  if (params.type) qs.append("type", params.type);
  if (params.location) qs.append("location", params.location);
  if (params.rating) qs.append("rating", params.rating);
  if (params.available !== undefined)
    qs.append("available", params.available ? "true" : "false");

  qs.append("page", String(params.page ?? 1));
  qs.append("limit", String(params.limit ?? 12));

  return request(`/artisans/search?${qs.toString()}`);
}

/* ============================================================
   ARTISAN DASHBOARD
   ============================================================ */

// export function getArtisanDashboardSummary(token?: string | null) {
//   return request(`/artisan/dashboard/summary`, { token });
// }

// export function getArtisanJobRequests(token?: string | null) {
//   return request(`/artisan/dashboard/requests`, { token });
// }

// export function getArtisanActiveJobs(token?: string | null) {
//   return request(`/artisan/dashboard/active`, { token });
// }

// export function getArtisanJobHistory(token?: string | null) {
//   return request(`/artisan/dashboard/history`, { token });
// }

// export function acceptJobRequest(jobId: string, token?: string | null) {
//   return request(`/artisan/dashboard/requests/${jobId}/accept`, {
//     method: "PATCH",
//     token,
//   });
// }

// export function declineJobRequest(
//   jobId: string,
//   reason: string,
//   token?: string | null
// ) {
//   return request(`/artisan/dashboard/requests/${jobId}/decline`, {
//     method: "PATCH",
//     token,
//     json: { reason },
//   });
// }

// export function updateJobProgress(
//   jobId: string,
//   data: { progress: number; note?: string },
//   token?: string | null
// ) {
//   return request(`/artisan/dashboard/active/${jobId}/progress`, {
//     method: "PATCH",
//     token,
//     json: data,
//   });
// }

/* ============================================================
   CUSTOMER DASHBOARD
   ============================================================ */

export type EmployerDashboardStats = {
  walletBalance(walletBalance: any): number;
  escrowBalance(escrowBalance: any): number;
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalSpent: number
}

export type EmployerDashboardJob = {
  id: string
  title: string
  description: string | null
  category: string | null
  location: string | null
  budget_min: string | number | null
  budget_max: string | number | null
  status: "open" | "in_progress" | "completed" | "cancelled"
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export type EmployerDashboardSuggestedArtisan = {
  id: string
  name: string
  email: string
  profileImage: string | null
  serviceType: string
  skills: string[]
  location: string
  rating: number
  reviewsCount: number
  hourlyRate: number
  bio: string
}

export type EmployerDashboardOverviewResponse = {
  suggested: any;
  profile: {
    id: string
    name: string
    email: string
    phone?: string | null
    created_at?: string
  } | null
  stats: EmployerDashboardStats
  recentJobs: EmployerDashboardJob[]
  suggestedArtisans: EmployerDashboardSuggestedArtisan[]
}

export const CustomerDashboardAPI = {
  getOverview() {
    return request<EmployerDashboardOverviewResponse>("/customer/dashboard", {
      token: getAuth()?.token,
    })
  },

  getProfile() {
    return request("/customer/dashboard/profile", {
      token: getAuth()?.token,
    })
  },

  getStats() {
    return request<EmployerDashboardStats>("/customer/dashboard/stats", {
      token: getAuth()?.token,
    })
  },

  getRecentJobs() {
    return request<EmployerDashboardJob[]>("/customer/dashboard/recent-jobs", {
      token: getAuth()?.token,
    })
  },

  getActiveJobs() {
    return request<EmployerDashboardJob[]>("/customer/dashboard/active", {
      token: getAuth()?.token,
    })
  },

  getJobHistory() {
    return request<EmployerDashboardJob[]>("/customer/dashboard/history", {
      token: getAuth()?.token,
    })
  },

  getSuggestedArtisans() {
    return request<EmployerDashboardSuggestedArtisan[]>("/customer/dashboard/recommended", {
      token: getAuth()?.token,
    })
  },
}


/* ============================================================
   ARTISAN DASHBOARD
   ============================================================ */

export type ArtisanDashboardSummary = {
  artisan: {
    artisanId: string
    userId: string
    name: string
    email: string
    service: string
    profileImage: string | null
    location: string
    rating: number
    reviews: number
    slug?: string | null
  }
  completedJobs: number
  activeJobs: number
  pendingRequests: number
  successRate: number
  profileViews: number
  monthlyEarnings: number
}

export function getArtisanDashboardSummary(token?: string | null) {
  return request<ArtisanDashboardSummary>("/artisan/dashboard/summary", {
    token,
  })
}

export function getArtisanJobRequests(token?: string | null) {
  return request<any[]>("/artisan/dashboard/requests", {
    token,
  })
}

export function getArtisanActiveJobs(token?: string | null) {
  return request<any[]>("/artisan/dashboard/active", {
    token,
  })
}

export function getArtisanJobHistory(token?: string | null) {
  return request<any[]>("/artisan/dashboard/history", {
    token,
  })
}


/* ============================================================
   ARTISAN PORTFOLIO UPLOAD
   ============================================================ */

export function uploadPortfolioImages(
  files: File[],
  token?: string | null
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  return request(`/artisans/me/portfolio`, {
    method: "POST",
    formData,
    token,
  });
}

/* ============================================================
   CHAT FEATURES
   ============================================================ */

export type ChatRoomSummary = {
  id: string;
  isSupport: boolean;
  participants: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  lastMessage: {
    id: string;
    message: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
};

export type ChatMessageDTO = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  createdAt: string;
};

export function listChatRooms() {
  return request<any>("/chat").then((res) => {
    console.log("RAW /chat response:", res);
    return res;
  });
}

export function listChatMessages(roomId: string) {
  return request<ChatMessageDTO[]>(`/chat/${roomId}/messages`);
}

export function sendChatMessage(roomId: string, message: string) {
  return request<ChatMessageDTO>(`/chat/${roomId}/messages`, {
    method: 'POST',
    json: { message },
  });
}

export function initiateSupportChat() {
  return request<{ roomId: string }>('/chat/initiate', { method: 'POST' });
}

/* ============================================================
   CONTRACT MANAGEMENT
   ============================================================ 
*/

export async function acceptContract(contractId: string) {
  const auth = getAuth()
  if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || "Failed to accept contract")
  return data
}

export async function declineContract(contractId: string) {
  const auth = getAuth()
  if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || "Failed to decline contract")
  return data
}

export async function requestContractChanges(contractId: string, payload?: { message?: string }) {
  const auth = getAuth()
  if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/request-changes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(payload || {}),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || "Failed to request changes")
  return data
}

export type ContractTransaction = {
  id: string | number
  contractId: string | number
  amount: number
  status: string // "success" | "failed" | ...
  type?: string  // optional: "deposit" | "milestone" | "full"
  createdAt?: string
}

export async function listContractTransactions(contractId: string) {
  const auth = getAuth()
  const res = await fetch(`${API_BASE}/transactions?contractId=${encodeURIComponent(contractId)}`, {
    headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    cache: "no-store",
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `Failed to load transactions (HTTP ${res.status})`
    throw new Error(msg)
  }

  if (!Array.isArray(data)) {
    throw new Error("Transactions response is not an array")
  }

  return data as ContractTransaction[]
}

// Job posting API Form
export async function createJobPosting(payload: any, token?: string | null) {
  return request('/jobs', {
    method: 'POST',
    json: payload,
    token,
  });
}

/* ============================================================
   PAYMENTS (PAYSTACK)
   ============================================================ */

export type InitDepositResponse = {
  reference: string;
  access_code: string;
  authorization_url: string;
};

export function initDeposit(amount: number, contractId?: string) {
  // amount is in NAIRA (backend converts to Kobo)
  return request<InitDepositResponse>("/payments/deposit/init", {
    method: "POST",
    json: { amount, contractId },
    
  });
}

export function verifyPaystack(reference: string) {
  return request<{ status: string; amount: number; metadata: any }>(
    `/payments/verify/${encodeURIComponent(reference)}`
  );
}

/* ============================================================
   Milestone Funds Releasing 
   ============================================================ */

export type MilestoneActionResponse = {
  milestone?: {
    id: string
    status: string
    submitted_at?: string
    approved_at?: string
    review_deadline_at?: string
  }
  artisanNet?: number
  fee?: number
  refund?: number
  refundAmount?: number
}

// export async function submitMilestone(milestoneId: string) {
//   return request<MilestoneActionResponse>(`/escrow/milestones/${milestoneId}/submit`, {
//     method: "POST",
//   })
// }
export async function submitMilestone(milestoneId: string) {
  const path = `/escrow/milestones/${milestoneId}/submit`
  console.log("[frontend] submitMilestone path =", path)
  return request<MilestoneActionResponse>(path, {
    method: "POST",
  })
}

export async function releaseMilestone(milestoneId: string) {
  return request<MilestoneActionResponse>(`/milestones/${milestoneId}/release`, {
    method: "POST",
  })
}

export async function partialReleaseMilestone(milestoneId: string, amount: number) {
  return request<MilestoneActionResponse>(`/milestones/${milestoneId}/partial-release`, {
    method: "POST",
    json: { amount },
  })
}

export async function refundMilestone(milestoneId: string) {
  return request<MilestoneActionResponse>(`/milestones/${milestoneId}/refund`, {
    method: "POST",
  })
}

export type ContractStateResponse = {
  contract: {
    id: string
    status: string
    title: string
    description: string
    totalAmount: number
    depositAmount: number
    depositPaid: boolean
    materials: any[]
    phases: Array<{
      id: string
      name: string
      description: string
      deliverables: string[]
      amount: number
      status: string
      dueDate?: string | null
      completedDate?: string | null
      submitted_at?: string | null
      approved_at?: string | null
      review_deadline_at?: string | null
    }>
    createdAt: string
    acceptedAt?: string
  }
}

export async function getContractState(contractId: string) {
  return request<ContractStateResponse>(`/contracts/${contractId}/state`, {
    method: "GET",
  })
}

// Withdrawal APIs

export type WithdrawalBank = {
  name: string
  code: string
}

export type ResolveAccountResponse = {
  status: boolean
  accountName: string | null
  accountNumber: string
}

export type CreateWithdrawalPayload = {
  amount: number
  bank: {
    name: string
    bank_code: string
    account_number: string
    account_name?: string
    currency?: string
  }
}

export type WithdrawalRecord = {
  id: string
  amount: number | string
  method: string
  reference: string
  status: "pending" | "completed" | "rejected" |"failed"
  bank_name?: string
  bank_code?: string
  account_number?: string
  account_name?: string
  created_at?: string
  createdAt?: string
}

function getApiErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  )
}

export async function getWithdrawalBanks(token?: string | null) {
  try {
    return await request<{ status: boolean; banks: WithdrawalBank[] }>("/withdrawals/banks", {
      token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to load banks"))
  }
}

export async function resolveWithdrawalAccount(
  accountNumber: string,
  bankCode: string,
  token?: string | null
) {
  const qs = new URLSearchParams({
    accountNumber,
    bankCode,
  }).toString()

  try {
    return await request<ResolveAccountResponse>(`/withdrawals/resolve?${qs}`, {
      token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to resolve account"))
  }
}

export async function createWithdrawal(
  payload: CreateWithdrawalPayload,
  token?: string | null
) {
  try {
    return await request("/withdrawals", {
      method: "POST",
      json: payload,
      token,
    })
  } catch (error: any) {
    throw new Error(
      getApiErrorMessage(error, "Cannot process payment now, try again later.")
    )
  }
}

export async function listMyWithdrawals(token?: string | null) {
  try {
    return await request<WithdrawalRecord[]>("/withdrawals", {
      token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to load withdrawals"))
  }
}

/* ============================================================
   AUTH HELPERS
   ============================================================ */

export function saveAuth(token: string, user: UserDTO) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function getAuth() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("auth_user");

  if (!user) return null;

  try {
    return { token: "cookie", user: JSON.parse(user) as UserDTO };
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_user");
}