"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readStoredLogs, clearStoredLogs, type LogEntry, type LogLevel } from "@/lib/logger";
import { clientLogger } from "@/lib/logger";
import { redirect } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// redirect in production — guard at module level
if (process.env.NODE_ENV === "production") {
  redirect("/");
}

interface BackendEntry {
  level: string;
  message: string;
  timestamp: string;
  source?: string;
  stack?: string;
  [key: string]: unknown;
}

type Tab = "frontend" | "backend";
type LevelFilter = "all" | LogLevel;

const LEVEL_COLORS: Record<string, string> = {
  fatal: "bg-red-100 text-red-700 border-red-200",
  error: "bg-red-50 text-red-600 border-red-100",
  warn:  "bg-yellow-50 text-yellow-700 border-yellow-100",
  info:  "bg-blue-50 text-blue-600 border-blue-100",
  http:  "bg-slate-100 text-slate-500 border-slate-200",
  debug: "bg-purple-50 text-purple-600 border-purple-100",
};

const LEVEL_DOT: Record<string, string> = {
  fatal: "bg-red-600",
  error: "bg-red-500",
  warn:  "bg-yellow-500",
  info:  "bg-blue-500",
  http:  "bg-slate-400",
  debug: "bg-purple-500",
};

function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_COLORS[level] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${LEVEL_DOT[level] ?? "bg-slate-400"}`} />
      {level}
    </span>
  );
}

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-GB", { hour12: false, timeZoneName: "short" });
  } catch {
    return ts;
  }
}

export default function LogViewerPage() {
  const [tab, setTab] = useState<Tab>("frontend");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Frontend logs
  const [frontendLogs, setFrontendLogs] = useState<LogEntry[]>([]);

  // Backend logs
  const [backendLogs, setBackendLogs] = useState<BackendEntry[]>([]);
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFrontend = useCallback(() => {
    setFrontendLogs(readStoredLogs());
  }, []);

  const loadBackend = useCallback(async () => {
    setBackendLoading(true);
    setBackendError(null);
    try {
      const params = new URLSearchParams({ limit: "300" });
      if (levelFilter !== "all") params.set("level", levelFilter);
      const res = await fetch(`${API}/logs/entries?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setBackendLogs(data.entries ?? []);
      setBackendTotal(data.total ?? 0);
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to fetch backend logs");
    } finally {
      setBackendLoading(false);
    }
  }, [levelFilter]);

  // Initial load
  useEffect(() => { loadFrontend(); }, [loadFrontend]);
  useEffect(() => { if (tab === "backend") loadBackend(); }, [tab, loadBackend]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) { if (refreshTimer.current) clearInterval(refreshTimer.current); return; }
    refreshTimer.current = setInterval(() => {
      if (tab === "frontend") loadFrontend();
      else loadBackend();
    }, 3000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [autoRefresh, tab, loadFrontend, loadBackend]);

  // Clear backend log files
  const clearBackend = async () => {
    if (!confirm("Clear all backend log files?")) return;
    await fetch(`${API}/logs/entries`, { method: "DELETE", credentials: "include" });
    loadBackend();
  };

  // Export as JSON
  const exportJson = () => {
    const data = tab === "frontend" ? frontendLogs : backendLogs;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brikcell-${tab}-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter frontend logs
  const filteredFrontend = frontendLogs.filter((e) => {
    if (levelFilter !== "all" && e.level !== levelFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Filter backend logs
  const filteredBackend = backendLogs.filter((e) => {
    if (levelFilter !== "all" && e.level !== levelFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = tab === "frontend" ? filteredFrontend.length : filteredBackend.length;
  const totalCount  = tab === "frontend" ? frontendLogs.length   : backendTotal;

  // Log a test error so the page is never empty on first load
  const fireTestError = () => {
    clientLogger.error("Test error fired from /debug/logs", { source: "manual-test", page: "/debug/logs" });
    loadFrontend();
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🐛</span>
          <div>
            <h1 className="text-white font-semibold text-base leading-none">Brikcell Log Viewer</h1>
            <p className="text-slate-500 text-xs mt-0.5">Development only — not visible in production</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fireTestError}
            className="px-3 py-1.5 rounded-md bg-purple-900/50 border border-purple-700 text-purple-300 text-xs hover:bg-purple-900 transition-colors"
          >
            + fire test error
          </button>
          <button
            onClick={exportJson}
            className="px-3 py-1.5 rounded-md bg-slate-700 border border-slate-600 text-slate-300 text-xs hover:bg-slate-600 transition-colors"
          >
            export JSON
          </button>
          <button
            onClick={() => { if (tab === "frontend") { clearStoredLogs(); loadFrontend(); } else clearBackend(); }}
            className="px-3 py-1.5 rounded-md bg-red-900/40 border border-red-800 text-red-300 text-xs hover:bg-red-900/60 transition-colors"
          >
            clear logs
          </button>
          <button
            onClick={() => { if (tab === "frontend") loadFrontend(); else loadBackend(); }}
            className="px-3 py-1.5 rounded-md bg-slate-700 border border-slate-600 text-slate-300 text-xs hover:bg-slate-600 transition-colors"
          >
            ↺ refresh
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <span
              onClick={() => setAutoRefresh((v) => !v)}
              className={`relative inline-block w-8 h-4 rounded-full transition-colors ${autoRefresh ? "bg-orange-500" : "bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-4" : ""}`} />
            </span>
            auto (3s)
          </label>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center gap-6 flex-wrap">
        {/* Source tabs */}
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
          {(["frontend", "backend"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setLevelFilter("all"); setSearch(""); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                tab === t ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
              {t === "frontend" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-600 text-slate-300 text-[10px]">
                  {frontendLogs.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "fatal", "error", "warn", "info", "http", "debug"] as (LevelFilter | "http")[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l === "http" ? "info" : l as LevelFilter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors uppercase ${
                (l === "http" ? levelFilter === "info" : levelFilter === l)
                  ? "bg-orange-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter by message…"
          className="ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-52"
        />
      </div>

      {/* Stats bar */}
      <div className="px-6 py-2 flex items-center gap-4 text-[11px] text-slate-500 border-b border-slate-800/60">
        <span>Showing <span className="text-slate-300 font-semibold">{activeCount}</span> of <span className="text-slate-300 font-semibold">{totalCount}</span> entries</span>
        {tab === "backend" && backendLoading && <span className="text-orange-400 animate-pulse">loading…</span>}
        {tab === "backend" && backendError && <span className="text-red-400">{backendError}</span>}
        {tab === "backend" && !backendLoading && !backendError && (
          <span className="text-slate-600">source: {API}/logs/entries</span>
        )}
      </div>

      {/* Log list */}
      <div className="divide-y divide-slate-800/70">
        {tab === "frontend" && filteredFrontend.length === 0 && (
          <div className="px-6 py-16 text-center text-slate-600">
            No frontend logs{search || levelFilter !== "all" ? " matching filters" : " yet — errors captured in this browser will appear here"}
          </div>
        )}

        {tab === "backend" && !backendLoading && filteredBackend.length === 0 && (
          <div className="px-6 py-16 text-center text-slate-600">
            {backendError ? backendError : "No backend logs" + (search || levelFilter !== "all" ? " matching filters" : " yet")}
          </div>
        )}

        {tab === "frontend" && filteredFrontend.map((entry) => (
          <LogRow
            key={entry.id}
            id={entry.id}
            level={entry.level}
            message={entry.message}
            timestamp={entry.timestamp}
            source="frontend"
            extra={entry.extra}
            expanded={expanded === entry.id}
            onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
          />
        ))}

        {tab === "backend" && filteredBackend.map((entry, i) => (
          <LogRow
            key={i}
            id={String(i)}
            level={entry.level}
            message={entry.message}
            timestamp={entry.timestamp}
            source={entry.source ?? "backend"}
            extra={Object.fromEntries(
              Object.entries(entry).filter(([k]) => !["level","message","timestamp","source"].includes(k))
            )}
            expanded={expanded === String(i)}
            onToggle={() => setExpanded(expanded === String(i) ? null : String(i))}
          />
        ))}
      </div>
    </div>
  );
}

interface LogRowProps {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  extra?: Record<string, unknown>;
  expanded: boolean;
  onToggle: () => void;
}

function LogRow({ id, level, message, timestamp, source, extra, expanded, onToggle }: LogRowProps) {
  const hasExtra = extra && Object.keys(extra).length > 0;
  const stack = extra?.stack ? String(extra.stack) : null;

  return (
    <div className={`px-6 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer ${expanded ? "bg-slate-800/40" : ""}`} onClick={onToggle}>
      <div className="flex items-start gap-3">
        {/* level badge */}
        <div className="flex-shrink-0 mt-0.5">
          <LevelBadge level={level} />
        </div>

        {/* message + timestamp */}
        <div className="flex-1 min-w-0">
          <div className="text-slate-200 break-all leading-snug">{message}</div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
            <span>{formatTs(timestamp)}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">{source}</span>
            {hasExtra && (
              <span className="text-orange-400/70">{expanded ? "▲ hide details" : "▼ show details"}</span>
            )}
          </div>
        </div>
      </div>

      {expanded && hasExtra && (
        <div className="mt-3 ml-0 pl-3 border-l-2 border-slate-700">
          {stack && (
            <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all leading-relaxed mb-2">
              {stack}
            </pre>
          )}
          {Object.entries(extra!).filter(([k]) => k !== "stack").map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[11px] mb-1">
              <span className="text-slate-500 flex-shrink-0">{k}:</span>
              <span className="text-slate-300 break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
