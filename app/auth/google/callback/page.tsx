"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuth, type UserDTO } from "@/lib/api";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const userParam  = params.get("user");
    const tokenParam = params.get("token");
    const loginError = params.get("error");

    if (loginError) {
      setError(decodeURIComponent(loginError));
      return;
    }

    if (!userParam) {
      setError("No user data received from Google.");
      return;
    }

    try {
      const user  = JSON.parse(decodeURIComponent(userParam)) as UserDTO;
      const token = tokenParam ? decodeURIComponent(tokenParam) : "cookie";
      saveAuth(token, user);

      if (user.role === "artisan") {
        router.replace("/dashboard/artisan");
      } else if (user.role === "employer") {
        router.replace("/dashboard/customer");
      } else {
        router.replace("/");
      }
    } catch {
      setError("Failed to process Google login. Please try again.");
    }
  }, [params, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Google login failed</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-slate-500">Signing you in…</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
