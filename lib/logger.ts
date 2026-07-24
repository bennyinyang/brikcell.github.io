const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/logs/client`;
const MAX_QUEUE = 20;
const FLUSH_INTERVAL = 5000;
const LS_KEY = "brikcell_debug_logs";
const LS_MAX = 150;

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  sdk: string;
  source: "frontend";
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  user?: { id?: string; email?: string } | null;
}

const queue: LogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function persistToStorage(entry: LogEntry) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const existing: LogEntry[] = raw ? JSON.parse(raw) : [];
    existing.unshift(entry);
    if (existing.length > LS_MAX) existing.length = LS_MAX;
    localStorage.setItem(LS_KEY, JSON.stringify(existing));
  } catch {
    // storage full or unavailable — silently skip
  }
}

export function readStoredLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearStoredLogs() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY);
}

function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  batch.forEach((entry) => {
    const sent = navigator.sendBeacon?.(
      ENDPOINT,
      new Blob([JSON.stringify(entry)], { type: "application/json" })
    )
    if (!sent) {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        credentials: "include",
        keepalive: true,
      }).catch(() => {})
    }
  });
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL);
}

function enqueue(entry: LogEntry) {
  if (typeof window === "undefined") return;
  persistToStorage(entry);
  queue.push(entry);
  if (queue.length >= MAX_QUEUE) flush();
  else schedule();
}

export const clientLogger = {
  capture(
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>,
    tags?: Record<string, string>
  ) {
    enqueue({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level,
      message,
      timestamp: new Date().toISOString(),
      sdk: "brikcell-client/1.0",
      source: "frontend",
      extra,
      tags,
    });
  },
  error: (msg: string, extra?: Record<string, unknown>) => clientLogger.capture("error", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => clientLogger.capture("warn", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => clientLogger.capture("info", msg, extra),
  captureException(err: unknown, extra?: Record<string, unknown>) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    clientLogger.capture("error", message, { stack, ...extra });
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flush);
}
