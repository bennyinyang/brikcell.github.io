"use client";

import { useEffect } from "react";
import { clientLogger } from "@/lib/logger";

export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      clientLogger.captureException(event.error ?? event.message, {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      clientLogger.captureException(event.reason, {
        source: "unhandledrejection",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
