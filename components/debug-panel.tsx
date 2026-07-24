"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clientLogger, type LogEntry } from "@/lib/logger";

const captured: LogEntry[] = [];

// Monkey-patch capture to also fill the in-memory buffer for the panel
const originalCapture = clientLogger.capture.bind(clientLogger);
clientLogger.capture = (level, message, extra, tags) => {
  originalCapture(level, message, extra, tags);
  // entry is already persisted inside originalCapture; grab latest from the front
  const entry = { id: `${Date.now()}`, level, message, timestamp: new Date().toISOString(), sdk: "brikcell-client/1.0", source: "frontend" as const, extra, tags };
  captured.unshift(entry);
  if (captured.length > 50) captured.pop();
};

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setErrors([...captured]);
    const id = setInterval(() => setErrors([...captured]), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-[9999] h-9 w-9 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
        title="Debug panel"
      >
        🐛
      </button>

      {open && (
        <div className="fixed bottom-16 right-4 z-[9999] w-[420px] max-h-[60vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white text-xs font-mono">
            <span>Error Log ({captured.length})</span>
            <div className="flex items-center gap-3">
              <Link
                href="/debug/logs"
                className="hover:text-orange-300 underline transition-colors"
                onClick={() => setOpen(false)}
              >
                full view →
              </Link>
              <button onClick={() => { captured.length = 0; setErrors([]); }} className="hover:text-red-300 transition-colors">
                clear
              </button>
              <button onClick={() => setOpen(false)} className="hover:text-slate-300 transition-colors">
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 text-xs font-mono divide-y divide-slate-100">
            {errors.length === 0 ? (
              <div className="p-4 text-slate-400 text-center">No errors captured</div>
            ) : (
              errors.map((e) => (
                <div key={e.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`uppercase font-bold text-[10px] ${
                      e.level === "error" || e.level === "fatal" ? "text-red-500"
                      : e.level === "warn" ? "text-yellow-500"
                      : "text-blue-500"
                    }`}>{e.level}</span>
                    <span className="text-slate-400 text-[10px]">{e.timestamp}</span>
                  </div>
                  <div className="text-slate-700 break-all">{e.message}</div>
                  {Boolean(e.extra?.stack) && (
                    <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap break-all">
                      {String(e.extra!.stack).split("\n").slice(1, 4).join("\n")}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
