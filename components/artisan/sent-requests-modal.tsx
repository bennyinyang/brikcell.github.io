"use client"

import { useCallback, useEffect, useState } from "react"
import { Send, Clock, X, Loader2, User, CheckCircle2, XCircle } from "lucide-react"
import { getSentMessageRequests } from "@/lib/api"

const LIMIT = 8

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return (
      <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Accepted
      </span>
    )
  if (status === "declined")
    return (
      <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
        <XCircle className="h-3 w-3" />
        Declined
      </span>
    )
  return (
    <span className="mt-0.5 shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
      Pending
    </span>
  )
}

export function SentRequestsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await getSentMessageRequests(p, LIMIT)
      setRequests(res.data)
      setTotalPages(res.totalPages)
      setTotal(res.total)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setPage(1)
      load(1)
    }
  }, [open, load])

  useEffect(() => {
    if (open) load(page)
  }, [page, open, load])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-900">Application History</h2>
            {total > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
                {total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-[200px] px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Send className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No applications yet</p>
              <p className="mt-1 text-xs text-slate-400">
                When you send a message request to an employer it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {req.recipient?.name || "Employer"}
                    </p>
                    {req.recipient?.email && (
                      <p className="truncate text-[11px] text-slate-500">{req.recipient.email}</p>
                    )}
                    {req.message && (
                      <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(req.createdAt ?? req.created_at ?? "").toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-5 py-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Pending
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Accepted
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Declined
          </span>
        </div>
      </div>
    </div>
  )
}
