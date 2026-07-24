"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  getArtisanDashboardSummary,
  getArtisanActiveJobs,
  getArtisanJobHistory,
  listMyWithdrawals,
  getArtisanWalletTransactions,
  normalizePaginatedResponse,
  type ArtisanWalletTransaction,
} from "@/lib/api"

import { Header } from "@/components/header"
import { WithdrawalCard } from "@/components/withdrawal-card"

type WalletService = {
  id: string
  title: string
  customerName: string
  status: string
  date: string
  time: string
  amount: number
  rawDate: string | null
}

type DateFilter = "all" | "7d" | "30d" | "3m" | "6m"

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
]

const PAGE_SIZE = 10

type WithdrawalRecord = {
  id: string
  amount: number | string
  method: string
  reference: string
  status: "pending" | "completed" | "rejected" | "failed"
  bank_name?: string
  bank_code?: string
  account_number?: string
  account_name?: string
  created_at?: string
  createdAt?: string
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0)
  return `₦${amount.toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return "20 July, 2024"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "20 July, 2024"

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "10:00 AM"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "10:00 AM"

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getServiceStatusLabel(status?: string) {
  const normalized = String(status || "").toUpperCase()

  if (["RELEASED", "PARTIAL_RELEASED", "PAID"].includes(normalized)) return "Listed"
  if (["ACTIVE", "FUNDED", "SUBMITTED", "APPROVAL_PENDING", "APPROVED"].includes(normalized)) return "In progress"
  if (["REFUNDED", "CANCELLED"].includes(normalized)) return "Cancelled"

  return "In progress"
}

function mapService(raw: any): WalletService {
  const contract = raw?.contract || {}
  const job = contract?.job || raw?.job || {}
  const employer = contract?.employer || raw?.employer || {}
  const rawDateValue =
    raw?.submitted_at ||
    raw?.approved_at ||
    raw?.review_deadline_at ||
    raw?.updatedAt ||
    raw?.updated_at ||
    null

  return {
    id: String(raw?.id || ""),
    title: raw?.title || job?.title || "Custom Furniture Design",
    customerName: employer?.name || "James",
    status: String(raw?.status || ""),
    date: formatDate(rawDateValue),
    time: formatTime(rawDateValue),
    amount: Number(raw?.amount || job?.budget_max || job?.budget_min || 0),
    rawDate: rawDateValue,
  }
}

function EmptyWalletState() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl bg-white px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm">
        <Wallet className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="text-base font-semibold text-slate-950">
        No transaction found
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Your transactions will appear here
      </p>
    </div>
  )
}


function ServiceTransactionCard({ item }: { item: WalletService }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-[10px] text-yellow-700">
              {getInitials(item.customerName)}
            </div>
            <span>Talent: {item.customerName}</span>
          </div>
        </div>

        <Badge className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-600 hover:bg-orange-50">
          • {getServiceStatusLabel(item.status)}
        </Badge>
      </div>

      <div className="grid gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
        <span>
          Date initiated:{" "}
          <span className="text-slate-600">{item.date}</span>
        </span>

        <span>
          Time:{" "}
          <span className="text-slate-600">{item.time}</span>
        </span>

        <span className="font-medium text-slate-700 sm:text-right">
          {formatMoney(item.amount)}
        </span>
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full border-primary/30 text-primary hover:bg-primary/5"
      >
        View Details
      </Button>
    </div>
  )
}

function WithdrawalHistoryCard({ item }: { item: WithdrawalRecord }) {
  const status = String(item.status || "").toLowerCase()

  const badgeClass =
    status === "completed"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "pending"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-red-200 bg-red-50 text-red-700"

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Withdrawal request
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {item.bank_name || "Bank account"}{" "}
            {item.account_number ? `• ${item.account_number}` : ""}
          </p>
        </div>

        <Badge className={`rounded-md border px-2 py-1 text-[11px] capitalize ${badgeClass}`}>
          {item.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {formatDate(item.created_at || item.createdAt)}
        </span>
        <span className="font-semibold text-slate-950">
          {formatMoney(item.amount)}
        </span>
      </div>
    </div>
  )
}

function MilestonePaymentCard({ item }: { item: ArtisanWalletTransaction }) {
  const isWithdrawal = item.type === "withdrawal"

  const badgeClass = isWithdrawal
    ? "border-orange-200 bg-orange-50 text-orange-600"
    : "border-emerald-200 bg-emerald-50 text-emerald-600"

  const amountClass = isWithdrawal ? "text-red-600" : "text-emerald-600"
  const amountPrefix = isWithdrawal ? "−" : "+"

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
          </p>
        </div>
        <Badge className={`rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-inherit ${badgeClass}`}>
          {isWithdrawal ? "Withdrawal" : "Received"}
        </Badge>
      </div>
      <p className={`mt-3 text-sm font-semibold ${amountClass}`}>
        {amountPrefix}{formatMoney(item.amount)}
      </p>
    </div>
  )
}

function Paginator({
  page,
  total,
  pageSize,
  onPageChange,
  label = "items",
}: {
  page: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
  label?: string
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages =
    totalPages <= 7
      ? pages
      : page <= 4
      ? [...pages.slice(0, 5), -1, totalPages]
      : page >= totalPages - 3
      ? [1, -1, ...pages.slice(totalPages - 5)]
      : [1, -1, page - 1, page, page + 1, -2, totalPages]

  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total} {label}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 min-w-[32px] items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>

        {visiblePages.map((p, i) =>
          p < 0 ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                p === page
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 min-w-[32px] items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default function ArtisanWalletPage() {
  const [activeTab, setActiveTab] = useState("history")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [historyPage, setHistoryPage] = useState(1)
  const [withdrawPage, setWithdrawPage] = useState(1)
  const [summary, setSummary] = useState<any>(null)
  const [activeJobs, setActiveJobs] = useState<WalletService[]>([])
  const [historyJobs, setHistoryJobs] = useState<WalletService[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [paymentTxs, setPaymentTxs] = useState<ArtisanWalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  async function loadWalletData() {
    try {
      const [summaryRes, activeRes, historyRes, withdrawalsRes, txRes] =
        await Promise.all([
          getArtisanDashboardSummary(),
          getArtisanActiveJobs(),
          getArtisanJobHistory(),
          listMyWithdrawals(),
          getArtisanWalletTransactions(1, 100),
        ])

      setSummary(summaryRes || null)
      setActiveJobs(Array.isArray(activeRes) ? activeRes.map(mapService) : [])
      setHistoryJobs(Array.isArray(historyRes) ? historyRes.map(mapService) : [])
      setWithdrawals(Array.isArray(withdrawalsRes) ? withdrawalsRes : [])
      const txData = normalizePaginatedResponse<ArtisanWalletTransaction>(txRes)
      setPaymentTxs(txData.data)
    } catch (error) {
      console.error("[Wallet] Failed to load wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  }, [])

  const walletBalance = Number(summary?.walletBalance || 0)

  type UnifiedItem =
    | { kind: "service"; date: Date; data: WalletService }
    | { kind: "withdrawal"; date: Date; data: WithdrawalRecord }
    | { kind: "payment"; date: Date; data: ArtisanWalletTransaction }

  const filteredTransactions = useMemo((): UnifiedItem[] => {
    const serviceItems: UnifiedItem[] = [...activeJobs, ...historyJobs].map((s) => ({
      kind: "service",
      date: s.rawDate ? new Date(s.rawDate) : new Date(0),
      data: s,
    }))

    const withdrawalItems: UnifiedItem[] = withdrawals.map((w) => ({
      kind: "withdrawal",
      date: new Date(w.created_at || w.createdAt || 0),
      data: w,
    }))

    const paymentItems: UnifiedItem[] = paymentTxs
      .filter((tx) => tx.type !== "withdrawal")
      .map((tx) => ({
        kind: "payment",
        date: new Date(tx.createdAt || 0),
        data: tx,
      }))

    const combined = [...paymentItems, ...serviceItems, ...withdrawalItems].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )

    if (dateFilter === "all") return combined

    const now = new Date()
    const cutoff = new Date(now)
    if (dateFilter === "7d") cutoff.setDate(now.getDate() - 7)
    else if (dateFilter === "30d") cutoff.setDate(now.getDate() - 30)
    else if (dateFilter === "3m") cutoff.setMonth(now.getMonth() - 3)
    else if (dateFilter === "6m") cutoff.setMonth(now.getMonth() - 6)

    return combined.filter((item) => item.date >= cutoff)
  }, [activeJobs, historyJobs, withdrawals, paymentTxs, dateFilter])

  useEffect(() => {
    setHistoryPage(1)
  }, [dateFilter])

  const pagedTransactions = filteredTransactions.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE
  )

  const pagedWithdrawals = withdrawals.slice(
    (withdrawPage - 1) * PAGE_SIZE,
    withdrawPage * PAGE_SIZE
  )

  return (
    <>
    
    <Header />

    <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)]">
        {/* Left Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2">
            <Link
              href="/dashboard/artisan"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse Gigs
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              My Bookings
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Post Service
            </Link>

            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Wallet
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Settings
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Support
            </Link>
          </nav>
        </aside>

        {/* Main Wallet Content */}
        <section>
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Wallet Balance:{" "}
              <span className="text-primary">{formatMoney(walletBalance)}</span>
            </h1>

            <div className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("withdraw")}
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                Withdraw
              </Button>
            </div>
          </div>

          {/* Mobile action buttons */}
          <div className="mb-4 flex sm:hidden">
            <Button
              variant="ghost"
              className="text-primary hover:bg-primary/5"
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5 grid h-10 w-full grid-cols-2 rounded-md border bg-white p-1">
              <TabsTrigger value="history" className="text-xs">
                Transaction history
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="text-xs">
                Withdrawal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-0">
              <div className="mb-5">
                <Select
                  value={dateFilter}
                  onValueChange={(v) => setDateFilter(v as DateFilter)}
                >
                  <SelectTrigger className="h-10 max-w-xs">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-28 animate-pulse rounded-xl border bg-slate-50"
                    />
                  ))}
                </div>
              ) : filteredTransactions.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {pagedTransactions.map((item) =>
                      item.kind === "payment" ? (
                        <MilestonePaymentCard key={`tx-${item.data.id}`} item={item.data} />
                      ) : item.kind === "service" ? (
                        <ServiceTransactionCard key={`s-${item.data.id}`} item={item.data} />
                      ) : (
                        <WithdrawalHistoryCard key={`w-${item.data.id}`} item={item.data} />
                      )
                    )}
                  </div>
                  <Paginator
                    page={historyPage}
                    total={filteredTransactions.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setHistoryPage}
                    label="transactions"
                  />
                </>
              ) : (
                <EmptyWalletState />
              )}
            </TabsContent>

            <TabsContent value="withdraw" className="mt-0">
              <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-6">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-sm font-semibold text-slate-950">
                    Withdrawal method
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Update your withdrawal details and withdraw from your available wallet balance.
                  </p>
                </div>

                {/* Paystack withdrawal form first */}
                <div className="mb-8">
                  <WithdrawalCard
                    balance={walletBalance}
                    title="Withdraw funds"
                    onSuccess={async () => {
                      await loadWalletData()
                      setActiveTab("history")
                    }}
                  />
                </div>

                {/* Figma email/bank detail section */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        Contact email
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Where should invoices be sent?
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-slate-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wallet-email"
                          defaultChecked
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span>Send to my account email</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wallet-email"
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span>Send to an alternative email</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        Bank details
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Select default withdrawal method
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 text-xs font-medium text-slate-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add new withdrawal method
                    </button>
                  </div>
                </div>
              </div>

              {withdrawals.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-sm font-semibold text-slate-950">
                    Withdrawal history
                  </h3>

                  <div className="space-y-4">
                    {pagedWithdrawals.map((item) => (
                      <WithdrawalHistoryCard key={item.id} item={item} />
                    ))}
                  </div>

                  <Paginator
                    page={withdrawPage}
                    total={withdrawals.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setWithdrawPage}
                    label="withdrawals"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
    </>
  )
}