// src/lib/api.ts
export const API_BASE =

// Backend API URL
//process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://brickcell-production.up.railway.app";
process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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
  body?: BodyInit;
  //token?: string | null;
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

  // Attach JWT as Authorization header (works in all browsers; cookie is backup for Chrome)
  const _jwt = typeof window !== "undefined" ? localStorage.getItem("auth_jwt") : null;
  if (_jwt) {
    headers["Authorization"] = `Bearer ${_jwt}`;
  }

  // Content type
  if (opts.json && !opts.formData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    
    credentials: "include",

    body: opts.formData
      ? opts.formData
      : opts.body
      ? opts.body
      : opts.json
      ? JSON.stringify(opts.json)
      : undefined,
    
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
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_jwt");
        localStorage.removeItem("auth_user");
        // Redirect to login — avoid redirect loop if already there
        if (!window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/auth/login?session=expired";
        }
      }
      const err: any = new Error("Your session has expired. Please log in again to continue.");
      err.status = 401;
      throw err;
    }
    const message =
      data?.message ||
      (typeof data?.error === "string" ? data.error : data?.error?.message) ||
      `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data as T;
}

/* ============================================================
   Pagination Helpers
   ============================================================ */

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: PaginationMeta
}

export function normalizePaginatedResponse<T>(res: any): PaginatedResponse<T> {
  if (Array.isArray(res)) {
    return {
      data: res,
      pagination: {
        page: 1,
        limit: res.length || 10,
        total: res.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  }

  if (Array.isArray(res?.data) && res?.pagination) {
    const page = Number(res.pagination.page || 1)
    const limit = Number(res.pagination.limit || res.data.length || 10)
    const total = Number(res.pagination.total || res.data.length)
    const totalPages = Number(
      res.pagination.totalPages || Math.max(Math.ceil(total / limit), 1)
    )

    return {
      data: res.data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage:
          typeof res.pagination.hasNextPage === "boolean"
            ? res.pagination.hasNextPage
            : page < totalPages,
        hasPrevPage:
          typeof res.pagination.hasPrevPage === "boolean"
            ? res.pagination.hasPrevPage
            : page > 1,
      },
    }
  }

  if (Array.isArray(res?.results) && res?.pagination) {
    const page = Number(res.pagination.page || 1)
    const limit = Number(res.pagination.limit || res.results.length || 12)
    const total = Number(res.pagination.total || res.results.length)
    const totalPages = Math.max(Math.ceil(total / limit), 1)

    return {
      data: res.results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }
  }

  return {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
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
    portfolioGallery(portfolioGallery: any): unknown;
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
    cover_image: string | null;
    coverImage: string | null;
    cover_image_public_id: string | null;
    certifications: string[];
    serviceRadius: number | null;
    isRemoteAvailable: boolean;
    preferredContactMethod: string;
    instantBooking: boolean;
    minimumJobValue: number | null;
    currentStatus: string | null;
    responseTime: string | null;
  };
  user: {
    phone: string; id: string; name: string; email: string 
};
  portfolio: any[];
  reviews: any[];
  badges: { key: string; label: string }[];
  meta: { completedJobs: number; reviewsCount: number };
};

export function getArtisanProfile(id: string) {
  return request<GetArtisanProfileResponse>(`/artisans/${id}`);
}

export function updateMyArtisanProfile(
  payload: any,
  //token?: string | null
) {
  return request(`/artisans/me`, {
    method: "PATCH",
    json: payload,
    //token,
  });
}


/* ============================================================
   ARTISAN SEARCH 
   ============================================================ */

export function searchArtisans(params: {
  type?: string;
  types?: string[]
  location?: string;
  rating?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  if (params.type) qs.append("type", params.type)

  if (params.types?.length) {
    qs.append("types", params.types.join(","))
  }

  if (params.location) qs.append("location", params.location)
  if (params.rating) qs.append("rating", params.rating)

  if (params.available !== undefined) {
    qs.append("available", params.available ? "true" : "false")
  }

  qs.append("page", String(params.page ?? 1))
  qs.append("limit", String(params.limit ?? 24))

  return request<any>(`/artisans/search?${qs.toString()}`)
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
  getOverview(page = 1, limit = 6) {
    return request<EmployerDashboardOverviewResponse>(`/customer/dashboard?page=${page}&limit=${limit}`, {
      //token: getAuth()?.token,
    })
  },

  getProfile() {
    return request("/customer/dashboard/profile", {
      //token: getAuth()?.token,
    })
  },

  getStats() {
    return request<EmployerDashboardStats>("/customer/dashboard/stats", {
      //token: getAuth()?.token,
    })
  },

  getRecentJobs() {
    return request<EmployerDashboardJob[]>("/customer/dashboard/recent-jobs", {
      //token: getAuth()?.token,
    })
  },

  getActiveJobs(page = 1, limit = 6) {
    return request<EmployerDashboardJob[]>(`/customer/dashboard/active?page=${page}&limit=${limit}`, {
      //token: getAuth()?.token,
    })
  },

  getJobHistory(page = 1, limit = 6) {
    return request<EmployerDashboardJob[]>(`/customer/dashboard/history?page=${page}&limit=${limit}`, {
      //token: getAuth()?.token,
    })
  },

  getSuggestedArtisans(page = 1, limit = 6) {
    return request<EmployerDashboardSuggestedArtisan[]>(`/customer/dashboard/recommended?page=${page}&limit=${limit}`, {
      //token: getAuth()?.token,
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

export function getArtisanDashboardSummary() {
  
  return request<ArtisanDashboardSummary>("/artisan/dashboard/summary", {
    //token,
  })
}

export function getArtisanJobRequests(page = 1, limit = 6) {
  return request<any>(`/artisan/dashboard/requests?page=${page}&limit=${limit}`)
}

export function getArtisanActiveJobs(page = 1, limit = 6) {
  return request<any>(`/artisan/dashboard/active?page=${page}&limit=${limit}`)
}

export function getArtisanJobHistory(page = 1, limit = 6) {
  return request<any>(`/artisan/dashboard/history?page=${page}&limit=${limit}`)
}


/* ============================================================
   ARTISAN PORTFOLIO UPLOAD
   ============================================================ */

export function uploadPortfolioImages(
  files: File[],
  //token?: string | null
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  return request(`/artisans/me/portfolio`, {
    method: "POST",
    formData,
    //token,
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
  created_at?: string;

  type?: "text" | "contract" | "phase-update" | "payment-prompt" | "file" | "system";

  file_url?: string | null;
  file_public_id?: string | null;
  file_original_name?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  file_resource_type?: string | null;
};

export function sendContactForm(payload: { name: string; email: string; subject: string; message: string }) {
  return request<{ ok: boolean }>("/contact", { method: "POST", json: payload });
}

export function submitFeedback(payload: { rating: number; category: string; title: string; message: string }) {
  return request<any>("/feedback", { method: "POST", json: payload });
}

export function getMyFeedback() {
  return request<any[]>("/feedback/mine");
}

export function listChatRooms() {
  return request<any>("/chat").then((res) => {
    console.log("RAW /chat response:", res);
    return res;
  });
}

export function markChatRoomRead(roomId: string) {
  return request(`/chat/${roomId}/read`, { method: "POST" });
}

export function editChatMessage(roomId: string, messageId: string, message: string) {
  return request<{ id: string; message: string; is_edited: boolean }>(
    `/chat/${roomId}/messages/${messageId}`,
    { method: "PATCH", json: { message } }
  );
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

export function sendChatMessageWithFile(
  roomId: string,
  payload: {
    message?: string;
    file: File;
  }
) {
  const formData = new FormData();

  if (payload.message?.trim()) {
    formData.append("message", payload.message.trim());
  }

  formData.append("file", payload.file);

  return request<ChatMessageDTO>(`/chat/${roomId}/messages`, {
    method: "POST",
    formData,
  });
}

export function initiateSupportChat() {
  return request<{ roomId: string }>('/chat/initiate', { method: 'POST' });
}

/* ============================================================
   CONTRACT MANAGEMENT
   ============================================================ 
*/

export type BookingContractOption = {
  id: string
  status: string
  title?: string
  description?: string
  employer_id?: string
  artisan_id?: string
  job_id?: string
  proposal_id?: string | null

  employerId?: string
  artisanId?: string
  jobId?: string
  proposalId?: string | null

  employer?: {
    id: string
    name?: string
    email?: string
  } | null

  artisan?: {
    id: string
    name?: string
    email?: string
  } | null

  job?: {
    id: string
    title?: string
  } | null

  Job?: {
    id: string
    title?: string
  } | null
}

export async function acceptContract(contractId: string) {
  // const auth = getAuth()
  // if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/accept`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      //Authorization: `Bearer ${auth.token}`,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || "Failed to accept contract")
  return data
}

export async function declineContract(contractId: string) {
  // const auth = getAuth()
  // if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/decline`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      //Authorization: `Bearer ${auth.token}`,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || "Failed to decline contract")
  return data
}

export async function requestContractChanges(contractId: string, payload?: { message?: string }) {
  // const auth = getAuth()
  // if (!auth?.token) throw new Error("Not authenticated")

  const res = await fetch(`${API_BASE}/contracts/${contractId}/request-changes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      //Authorization: `Bearer ${auth.token}`,
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
  const res = await fetch(
    `${API_BASE}/transactions?contractId=${encodeURIComponent(contractId)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error?.message ||
      `Failed to load transactions (HTTP ${res.status})`;
    throw new Error(msg);
  }

  if (!Array.isArray(data)) {
    throw new Error("Transactions response is not an array");
  }

  return data as ContractTransaction[];
}

// Job posting API Form
export async function createJobPosting(payload: any, token?: string | null) {
  return request('/jobs', {
    method: 'POST',
    json: payload,
    //token,
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
export async function fundMilestone(milestoneId: string) {
  return request<MilestoneActionResponse>(`/escrow/milestones/${milestoneId}/fund`, {
    method: "POST",
  })
}

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
    payment_mode?: 'FULL' | 'MILESTONE'
    title: string
    description: string
    totalAmount: number
    depositAmount: number
    depositPaid: boolean
    escrowBalance: number
    materials: any[]
    phases: Array<{
      id: string
      name: string
      description: string
      deliverables: string[]
      amount: number
      labour_cost?: number
      material_cost?: number
      initial_release_done?: boolean
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

export async function topupContractEscrow(contractId: string, amount: number) {
  return request<{ escrowBalance: number; walletBalance: number }>(
    `/contracts/${contractId}/topup-escrow`,
    { method: "POST", json: { amount } }
  )
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

export async function getWithdrawalBanks() {
  try {
    return await request<{ status: boolean; banks: WithdrawalBank[] }>("/withdrawals/banks", {
      //token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to load banks"))
  }
}

export async function resolveWithdrawalAccount(
  accountNumber: string,
  bankCode: string,
) {
  const qs = new URLSearchParams({
    accountNumber,
    bankCode,
  }).toString()

  try {
    return await request<ResolveAccountResponse>(`/withdrawals/resolve?${qs}`, {
      //token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to resolve account"))
  }
}

export async function createWithdrawal(
  payload: CreateWithdrawalPayload,
) {
  try {
    return await request("/withdrawals", {
      method: "POST",
      json: payload,
      //token,
    })
  } catch (error: any) {
    throw new Error(
      getApiErrorMessage(error, "Cannot process payment now, try again later.")
    )
  }
}

export async function listMyWithdrawals() {
  try {
    return await request<WithdrawalRecord[]>("/withdrawals", {
      //token,
    })
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, "Failed to load withdrawals"))
  }
}


/* ============================================================
   JOBS
   ============================================================ */

export type JobStatus = "open" | "in_progress" | "completed" | "cancelled"

export type JobEmployer = {
  id: string
  name: string
  email?: string
  receivedReviews?: { rating: number }[]
}

export type JobRecord = {
  id: string
  employer_id: string
  title: string
  description?: string | null
  category?: string | null
  location?: string | null
  budget_min?: number | string | null
  budget_max?: number | string | null
  status: JobStatus
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  employer?: JobEmployer
}

export type SearchJobsParams = {
  type?: string
  location?: string
  rating?: string
  available?: boolean
  page?: number
  limit?: number
}

export function listJobs(page = 1, limit = 12) {
  return request<any>(`/jobs?page=${page}&limit=${limit}`)
}

export function searchJobs(params: SearchJobsParams = {}) {
  const qs = new URLSearchParams()

  if (params.type) qs.append("type", params.type)
  if (params.location) qs.append("location", params.location)
  if (params.rating) qs.append("rating", params.rating)
  if (params.available !== undefined) {
    qs.append("available", params.available ? "true" : "false")
  }

  qs.append("page", String(params.page ?? 1))
  qs.append("limit", String(params.limit ?? 12))

  return request<any>(`/jobs/search?${qs.toString()}`)
}

export function getJobById(id: string) {
  return request<JobRecord>(`/jobs/${id}` )
}

export function listMyEmployerJobs() {
  return request<JobRecord[]>("/jobs/mine")
}

export function updateEmployerJob(id: string, payload: Partial<Pick<JobRecord, "title" | "description" | "location" | "status" | "budget_min" | "budget_max">>) {
  return request<JobRecord>(`/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}


/* ============================================================
   SERVICES
   ============================================================ */

export type ServiceType =
  // physical / local
  | "general"
  | "plumbing"
  | "carpentry"
  | "electrical"
  | "painting"
  | "cleaning"
  | "hairstyling"
  | "autorepair"
  | "techsupport"
  | "landscaping"
  | "moving"
  | "hvac"
  | "roofing"
  | "flooring"
  | "pestcontrol"
  | "interiordesign"
  | "masonry"
  | "poolmaintenance"
  | "appliancerepair"
  | "welding"
  | "securitycctv"
  | "photography"
  | "catering"
  | "personaltraining"
  | "childcare"
  | "elderlycare"
  | "tailoring"
  | "laundry"
  | "windowcleaning"
  | "furnitureassembly"
  | "homeinspection"
  | "tiling"
  // digital / remote
  | "webdevelopment"
  | "mobiledev"
  | "graphicdesign"
  | "logodesign"
  | "videoediting"
  | "socialmedia"
  | "contentwriting"
  | "seomarketing"
  | "virtualassistant"
  | "bookkeeping"
  | "translation"
  | "tutoring"
  | "musicproduction"
  | "animation"
  | "uiuxdesign"
  | "cybersecurity"
  | "qatesting"
  | "voiceover"

export type CreateServicePayload = {
  title: string
  service_type: ServiceType
  location?: string
  description?: string
  requirements?: string
  budget_min?: number
  budget_max?: number
  status?: "draft" | "published"
  budget_type?: "fixed" | "hourly"
  deadline?: string
  is_negotiable?: boolean
  includes_material_amount?: boolean
  tags?: string[]
  files?: File[]
}

export type ServiceRecord = {
  id: string
  artisan_id: string
  title: string
  service_type: ServiceType
  location?: string | null
  description?: string | null
  requirements?: string | null
  budget_min?: string | number | null
  budget_max?: string | number | null
  status?: "draft" | "published"
  budget_type?: "fixed" | "hourly"
  deadline?: string | null
  is_negotiable?: boolean
  includes_material_amount?: boolean
  tags?: string[]
  attachments?: any[]
  created_at?: string
  createdAt?: string
}

export async function createServiceListing(
  payload: CreateServicePayload,
  token?: string | null
) {
  const form = new FormData()

  form.append("title", payload.title)
  form.append("service_type", payload.service_type || "general")

  if (payload.location) form.append("location", payload.location)
  if (payload.description) form.append("description", payload.description)
  if (payload.requirements) form.append("requirements", payload.requirements)
  if (payload.budget_min !== undefined) form.append("budget_min", String(payload.budget_min))
  if (payload.budget_max !== undefined) form.append("budget_max", String(payload.budget_max))
  if (payload.status) form.append("status", payload.status)
  if (payload.budget_type) form.append("budget_type", payload.budget_type)
  if (payload.deadline) form.append("deadline", payload.deadline)

  form.append("is_negotiable", String(Boolean(payload.is_negotiable)))
  form.append("includes_material_amount", String(Boolean(payload.includes_material_amount)))
  form.append("tags", JSON.stringify(payload.tags || []))

  ;(payload.files || []).forEach((file) => {
    form.append("files", file)
  })

  const res = await fetch(`${API_BASE}/services`, {
    method: "POST",
    credentials: "include",
    body: form,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Failed to create service")
  }

  return data as ServiceRecord
}

export function listMyServices() {
  return request<ServiceRecord[]>("/services/mine", {
   
  })
}

export function listServices() {
  return request<ServiceRecord[]>("/services")
}

export function getServiceById(id: string) {
  return request<ServiceRecord>(`/services/${id}`)
}

export function searchServices(params: {
  type?: string
  location?: string
  rating?: string
  available?: boolean
}) {
  const qs = new URLSearchParams()

  if (params.type) qs.append("type", params.type)
  if (params.location) qs.append("location", params.location)
  if (params.rating) qs.append("rating", params.rating)
  if (params.available !== undefined) qs.append("available", String(params.available))

  return request<ServiceRecord[]>(`/services/search?${qs.toString()}`)
}

/* ============================================================
   POST GIG / JOB
   ============================================================ */

export type CreateJobPostingFormPayload = {
  title: string
  description?: string
  category?: string
  location?: string
  budget_min?: number
  budget_max?: number
  skills_required?: string[]
  budget_type?: "fixed" | "hourly"
  deadline_at?: string
  is_remote?: boolean
  contact_preference?: "platform" | "direct"
  is_negotiable?: boolean
  includes_material?: boolean
  status?: "draft" | "open"
  files?: File[]
}

export async function createJobPostingWithFiles(
  payload: CreateJobPostingFormPayload,
  token?: string | null
) {
  const formData = new FormData();

  formData.append("title", payload.title);

  if (payload.description) formData.append("description", payload.description);
  if (payload.category) formData.append("category", payload.category);
  if (payload.location) formData.append("location", payload.location);

  if (payload.budget_min !== undefined) {
    formData.append("budget_min", String(payload.budget_min));
  }

  if (payload.budget_max !== undefined) {
    formData.append("budget_max", String(payload.budget_max));
  }

  formData.append("skills_required", JSON.stringify(payload.skills_required || []));
  formData.append("budget_type", payload.budget_type || "fixed");
  formData.append("is_remote", String(Boolean(payload.is_remote)));
  formData.append("contact_preference", payload.contact_preference || "platform");
  formData.append("is_negotiable", String(Boolean(payload.is_negotiable)));
  formData.append("includes_material", String(Boolean(payload.includes_material)));
  formData.append("status", payload.status || "open");

  if (payload.deadline_at) {
    formData.append("deadline_at", payload.deadline_at);
  }

  if (payload.files?.length) {
    payload.files.forEach((file) => {
      formData.append("files", file);
    });
  }

  return request<any>("/jobs", {
    method: "POST",
    formData,
  });
}

/* ============================================================
   EMPLOYER WALLET
   ============================================================ */

export type EmployerWalletTransaction = {
  id: string
  title: string
  type: "deposit" | "job_payment" | "withdrawal" | string
  amount: number
  status: string
  method?: string
  reference?: string
  contractId?: string | null
  createdAt?: string
}

export function getEmployerWalletStats() {
  return CustomerDashboardAPI.getStats()
}

export function getEmployerWalletTransactions(page = 1, limit = 10) {
  return request<any>(
    `/customer/dashboard/wallet/transactions?page=${page}&limit=${limit}`
  )
}

/* ============================================================
   ARTISAN WALLET
   ============================================================ */

export type ArtisanWalletTransaction = {
  id: string
  title: string
  type: "milestone_payment" | "deposit" | "withdrawal" | string
  amount: number
  status: string
  method?: string
  reference?: string
  contractId?: string | null
  createdAt?: string
}

export function getArtisanWalletTransactions(page = 1, limit = 10) {
  return request<any>(
    `/artisan/dashboard/wallet/transactions?page=${page}&limit=${limit}`
  )
}

/* ============================================================
   BOOKINGS
   ============================================================ */

export type BookingStatus =
  | "in_progress"
  | "scheduled"
  | "completed"
  | "cancelled"

export type BookingDetails = {
  employerNote?: string | null
  artisanNote?: string | null
  artisanName?: string | null
  location?: string | null
  duration?: string | null
  title?: string | null
}

export type BookingUserDTO = {
  id: string
  name: string
  email: string
}

export type BookingJobDTO = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  location?: string | null
  budget_min?: string | number | null
  budget_max?: string | number | null
  status?: string
}

export type BookingDTO = {
  id: string
  customer_id: string
  artisan_id: string
  job_id: string
  proposal_id: string
  scheduled_at: string
  status: BookingStatus
  details?: BookingDetails | null
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string

  job?: BookingJobDTO | null
  Job?: BookingJobDTO | null

  proposal?: any
  Proposal?: any

  artisan?: BookingUserDTO | null
  customer?: BookingUserDTO | null
}

export type BookingRecord = BookingDTO

export type EligibleBookingProposal = {
  id: string
  job_id: string
  artisan_id: string
  status: string
  amount?: number | string | null
  cover_letter?: string | null
  job?: BookingJobDTO | null
  Job?: BookingJobDTO | null
  artisan?: BookingUserDTO | null
}

export type CreateBookingPayload = {
  contractId: string
  artisanId: string
  scheduledAt: string
  details?: {
    employerNote?: string
    location?: string
    duration?: string
  }
}

export type UpdateBookingPayload = {
  scheduledAt?: string
  employerNote?: string
  artisanNote?: string
  location?: string
  duration?: string
}

export function createBooking(
  payload: CreateBookingPayload
) {
  return request<BookingDTO>("/bookings", {
    method: "POST",
    json: payload,
  })
}

export function listEligibleBookingProposals(
  artisanId: string
) {
  return request<EligibleBookingProposal[]>(
    `/bookings/eligible/${artisanId}`
  )
}

export function listBookingsWithParticipant(
  participantId: string
) {
  return request<BookingDTO[]>(
    `/bookings/with/${participantId}`
  )
}

export function listEmployerBookings() {
  return request<BookingDTO[]>("/bookings")
}

export function listEmployerBookingHistory() {
  return request<BookingDTO[]>(
    "/bookings/history"
  )
}

export function listArtisanBookings(
  _authToken?: string
) {
  return request<BookingDTO[]>("/bookings/artisan")
}

export function listArtisanBookingHistory(
  _authToken?: string
) {
  return request<BookingDTO[]>(
    "/bookings/artisan/history"
  )
}

export function getBookingDetails(id: string) {
  return request<BookingDTO>(`/bookings/${id}`)
}

export function getBookingById(id: string) {
  return getBookingDetails(id)
}

export function modifyBooking(
  id: string,
  payload: UpdateBookingPayload
) {
  return request<BookingDTO>(`/bookings/${id}`, {
    method: "PATCH",
    json: payload,
  })
}

export function updateBookingStatus(
  id: string,
  status: BookingStatus
) {
  return request<BookingDTO>(
    `/bookings/${id}/status`,
    {
      method: "PATCH",
      json: { status },
    }
  )
}

export function updateBookingStatusEmployer(
  id: string,
  status: BookingStatus
) {
  return updateBookingStatus(id, status)
}

export function updateBookingStatusArtisan(
  id: string,
  status: BookingStatus
) {
  return updateBookingStatus(id, status)
}

/* ============================================================
   SETTINGS
   ============================================================ */

export type UserSettingsPayload = {
  push_notification?: boolean
  email_notification?: boolean
  sms_notification?: boolean
  notify_job_status?: boolean
  notify_feedback?: boolean
  notify_deposit_withdrawal?: boolean
  notify_promotions?: boolean
  notify_newsletters?: boolean
  prompt_feedback?: boolean
  auto_send_feedback_request?: boolean
  make_reviews_public?: boolean
  keep_reviews_anonymous?: boolean
}

export function getMyProfile() {
  return request<any>("/users/me", {
   
  })
}

export function updateMyProfile(payload: any) {
  return request<any>("/users/me", {
    method: "PATCH",
    json: payload,
   
  })
}

export function updateMyProfessionalProfile(payload: any) {
  return request<any>("/users/me/professional-profile", {
    method: "PATCH",
    json: payload,
    
  })
}

export function updateMySettings(payload: UserSettingsPayload) {
  return request<any>("/users/me/settings", {
    method: "PATCH",
    json: payload,

  })
}

export function changeMyPassword(
  payload: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  },

) {
  return request<{ message: string }>("/users/me/password", {
    method: "PATCH",
    json: payload,
  
  })
}

export function getMyReviews() {
  return request<any[]>("/users/me/reviews", {
   
  })
}

/* ============================================================
   EMPLOYER SETTINGS
   ============================================================ */

export type EmployerProfessionalProfilePayload = {
  company_name?: string
  industry?: string
  company_size?: string
  hiring_frequency?: string
  preferred_categories?: string[]
  average_budget?: number | string | null
  company_description?: string
  website?: string
  state?: string
  city?: string
  address?: string
  verification_document?: string
  portfolio_reference?: string
  verification_document_public_id?: string
  portfolio_reference_public_id?: string
}

export function updateMyEmployerProfessionalProfile(
  payload: EmployerProfessionalProfilePayload
) {
  return request("/users/me/employer-professional-profile", {
    method: "PATCH",
    json: payload,
  })
}

export function getMyReviewsGiven() {
  return request<any[]>("/users/me/reviews-given")
}

/* ============================================================
   CLOUDINARY UPLOADS
   ============================================================ */
   
export type CloudinaryUploadResponse = {
  url: string
  public_id: string
  resource_type: string
  format?: string
  bytes?: number
  original_name?: string
  mime_type?: string
}

export function uploadSingleFile(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<CloudinaryUploadResponse>("/uploads/single", {
    method: "POST",
    formData,
  })
}

export function uploadMultipleFiles(files: File[]) {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append("files", file)
  })

  return request<CloudinaryUploadResponse[]>("/uploads/multiple", {
    method: "POST",
    formData,
  })
}

export function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<CloudinaryUploadResponse>("/uploads/profile-image", {
    method: "POST",
    formData,
  })
}

export function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<CloudinaryUploadResponse>("/uploads/document", {
    method: "POST",
    formData,
  })
}

/* ============================================================
   SUPPORT TICKETS
   ============================================================ */

export type SupportCategoryValue =
  | "payment_issue"
  | "withdrawal_issue"
  | "booking_issue"
  | "contract_milestone_issue"
  | "account_profile_issue"
  | "job_service_issue"
  | "chat_message_issue"

export type SupportPriorityValue =
  | "low"
  | "medium"
  | "high"
  | "urgent"

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_for_user"
  | "resolved"
  | "closed"

export type SupportCategoryOption = {
  label: string
  value: SupportCategoryValue
  description: string
  issues: string[]
}

export type SupportPriorityOption = {
  label: string
  value: SupportPriorityValue
  description: string
}

export type SupportOptionsResponse = {
  categories: SupportCategoryOption[]
  priorities: SupportPriorityOption[]
}

export type SupportTicketAttachmentDTO = {
  id: string
  ticket_id: string
  url: string
  public_id: string
  resource_type?: string | null
  original_name?: string | null
  mime_type?: string | null
  size?: number | null
}

export type SupportTicketDTO = {
  id: string
  user_id: string
  ticket_number: string
  category: SupportCategoryValue
  issue: string
  subject: string
  description: string
  priority: SupportPriorityValue
  related_reference?: string | null
  status: SupportTicketStatus
  resolution_note?: string | null
  resolved_at?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  attachments?: SupportTicketAttachmentDTO[]
}

export function getSupportOptions() {
  return request<SupportOptionsResponse>("/support-tickets/options")
}

export function getMySupportTicketCount() {
  return request<{ count: number }>("/support-tickets/count")
}

export function listMySupportTickets(page = 1, limit = 10) {
  return request<PaginatedResponse<SupportTicketDTO>>(
    `/support-tickets?page=${page}&limit=${limit}`
  )
}

export function getMySupportTicket(ticketId: string) {
  return request<SupportTicketDTO>(`/support-tickets/${ticketId}`)
}

export function createSupportTicket(payload: {
  category: SupportCategoryValue
  issue: string
  subject: string
  description: string
  priority: SupportPriorityValue
  relatedReference?: string
  attachments?: File[]
}) {
  const formData = new FormData()

  formData.append("category", payload.category)
  formData.append("issue", payload.issue)
  formData.append("subject", payload.subject)
  formData.append("description", payload.description)
  formData.append("priority", payload.priority)

  if (payload.relatedReference?.trim()) {
    formData.append(
      "relatedReference",
      payload.relatedReference.trim()
    )
  }

  ;(payload.attachments || []).forEach((file) => {
    formData.append("attachments", file)
  })

  return request<SupportTicketDTO>("/support-tickets", {
    method: "POST",
    formData,
  })
}

export function updateMySupportTicket(
  ticketId: string,
  payload: {
    category?: SupportCategoryValue
    issue?: string
    subject?: string
    description?: string
    priority?: SupportPriorityValue
    relatedReference?: string
  }
) {
  return request<SupportTicketDTO>(
    `/support-tickets/${ticketId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export function deleteSupportTicket(ticketId: string) {
  return request<void>(`/support-tickets/${ticketId}`, {
    method: "DELETE",
  })
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

export type NotificationDTO = {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  meta: Record<string, any>
  created_at: string
  createdAt?: string
}

export type NotificationsResponse = {
  notifications: NotificationDTO[]
  total: number
  page: number
  limit: number
}

export function listNotifications(page = 1, limit = 20) {
  return request<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}`)
}

export function getUnreadNotificationCount() {
  return request<{ count: number }>("/notifications/unread-count")
}

export function markNotificationRead(id: string) {
  return request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" })
}

export function markAllNotificationsRead() {
  return request<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" })
}

/* ============================================================
   REVIEWS
   ============================================================ */

export type ReviewDTO = {
  id: string
  reviewer_id: string
  reviewee_id: string
  job_id?: string | null
  rating: number
  comment?: string | null
  created_at: string
  reviewer?: { id: string; name: string; role: string }
}

export function submitReview(data: {
  reviewee_id: string
  rating: number
  comment?: string
  job_id?: string
}) {
  return request<{ review: ReviewDTO; average: number }>("/reviews", {
    method: "POST",
    json: data,
  })
}

export function getReviewsForUser(userId: string) {
  return request<ReviewDTO[]>(`/reviews/user/${userId}`)
}

export function checkIfReviewed(revieweeId: string, jobId?: string) {
  const qs = jobId ? `?reviewee_id=${revieweeId}&job_id=${jobId}` : `?reviewee_id=${revieweeId}`
  return request<{ reviewed: boolean; review: ReviewDTO | null }>(`/reviews/check${qs}`)
}

/* ============================================================
   MESSAGE REQUESTS
   ============================================================ */

export type MessageRequestDTO = {
  id: string
  sender_id: string
  recipient_id: string
  job_id?: string | null
  message?: string | null
  status: "pending" | "accepted" | "declined"
  chat_room_id?: string | null
  created_at: string
  sender?: { id: string; name: string; role: string }
}

export function sendMessageRequest(data: {
  recipient_id: string
  job_id?: string
  message?: string
}) {
  return request<MessageRequestDTO>("/message-requests", { method: "POST", json: data })
}

export function getIncomingMessageRequests() {
  return request<MessageRequestDTO[]>("/message-requests/incoming")
}

export function acceptMessageRequest(id: string) {
  return request<{ request: MessageRequestDTO; room: { id: string } }>(
    `/message-requests/${id}/accept`,
    { method: "PATCH" }
  )
}

export function declineMessageRequest(id: string) {
  return request<MessageRequestDTO>(`/message-requests/${id}/decline`, { method: "PATCH" })
}

/* ============================================================
   AUTH HELPERS
   ============================================================ */

export function saveAuth(token: string, user: UserDTO) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_user", JSON.stringify(user));
  if (token && token !== "cookie") {
    localStorage.setItem("auth_jwt", token);
  }
}

export function getAuth() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  if (!user) return null;
  try {
    const token = localStorage.getItem("auth_jwt") || "cookie";
    return { token, user: JSON.parse(user) as UserDTO };
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_jwt");
}
// ── Favourite Artisans (employer) ──────────────────────────────
export function getFavouriteArtisans() {
  return request<any[]>("/customer/dashboard/favourites");
}
export function addFavouriteArtisan(artisanId: string) {
  return request<any>(`/customer/dashboard/favourites/${artisanId}`, { method: "POST" });
}
export function removeFavouriteArtisan(artisanId: string) {
  return request<any>(`/customer/dashboard/favourites/${artisanId}`, { method: "DELETE" });
}

// ── Saved Jobs (artisan) ───────────────────────────────────────
export function getSavedJobs() {
  return request<any[]>("/artisan/dashboard/saved-jobs");
}
export function saveJob(jobId: string) {
  return request<any>(`/artisan/dashboard/saved-jobs/${jobId}`, { method: "POST" });
}
export function unsaveJob(jobId: string) {
  return request<any>(`/artisan/dashboard/saved-jobs/${jobId}`, { method: "DELETE" });
}
