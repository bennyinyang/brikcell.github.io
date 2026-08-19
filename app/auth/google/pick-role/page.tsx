"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuth, type UserDTO } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function PickRoleContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tempToken = params.get("t") || "";

  const [role, setRole] = useState<"employer" | "artisan">("employer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!tempToken) {
      setError("Session expired. Please try signing in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/google/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to complete sign-up");
      }

      const { user } = (await res.json()) as { user: UserDTO };
      saveAuth("cookie", user);

      if (user.role === "artisan") {
        router.replace("/dashboard/artisan");
      } else {
        router.replace("/dashboard/customer");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
            <GoogleIcon />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            One last step
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            How will you use Brikcell?
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("employer")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-left transition-all ${
              role === "employer"
                ? "border-primary bg-orange-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">🏢</span>
            <span className="font-semibold text-slate-800">Employer</span>
            <span className="text-center text-xs text-slate-500">
              I want to hire skilled artisans
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("artisan")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-left transition-all ${
              role === "artisan"
                ? "border-primary bg-orange-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">🔧</span>
            <span className="font-semibold text-slate-800">Artisan</span>
            <span className="text-center text-xs text-slate-500">
              I want to offer my services
            </span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !tempToken}
          className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isLoading ? "Setting up your account…" : "Continue"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          You can change this later in your account settings.
        </p>
      </div>
    </main>
  );
}

export default function GooglePickRolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <PickRoleContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.05l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .94 4.95l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
