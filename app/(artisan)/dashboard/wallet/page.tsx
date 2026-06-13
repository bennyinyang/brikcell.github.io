"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldQuestion,
  User,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
}

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

  return {
    id: String(raw?.id || ""),
    title: raw?.title || job?.title || "Custom Furniture Design",
    customerName: employer?.name || "James",
    status: String(raw?.status || ""),
    date: formatDate(
      raw?.submitted_at ||
        raw?.approved_at ||
        raw?.review_deadline_at ||
        raw?.updatedAt ||
        raw?.updated_at
    ),
    time: formatTime(
      raw?.submitted_at ||
        raw?.approved_at ||
        raw?.review_deadline_at ||
        raw?.updatedAt ||
        raw?.updated_at
    ),
    amount: Number(raw?.amount || job?.budget_max || job?.budget_min || 0),
  }
}

function EmptyWalletState() {
  return (
    <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-4 text-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[380px] w-[380px] rounded-full border border-slate-100" />
        <div className="absolute h-[320px] w-[320px] rounded-full border border-slate-100" />
        <div className="absolute h-[260px] w-[260px] rounded-full border border-slate-100" />
        <div className="absolute h-[200px] w-[200px] rounded-full border border-slate-100" />
        <div className="absolute h-[140px] w-[140px] rounded-full border border-slate-100" />
      </div>

      <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm">
        <Wallet className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="relative z-10 text-base font-semibold text-slate-950">
        No transaction found
      </h3>

      <p className="relative z-10 mt-1 text-sm text-slate-500">
        Fund wallet to begin transaction
      </p>

      <Button className="relative z-10 mt-5 bg-primary hover:bg-primary/90">
        <Plus className="mr-2 h-4 w-4" />
        Fund wallet
      </Button>
    </div>
  )
}

function NoBookingsState() {
  return (
    <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-4 text-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[360px] w-[360px] rounded-full border border-slate-100" />
        <div className="absolute h-[300px] w-[300px] rounded-full border border-slate-100" />
        <div className="absolute h-[240px] w-[240px] rounded-full border border-slate-100" />
        <div className="absolute h-[180px] w-[180px] rounded-full border border-slate-100" />
        <div className="absolute h-[120px] w-[120px] rounded-full border border-slate-100" />
      </div>

      <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm">
        <CircleUserRound className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="relative z-10 text-base font-semibold text-slate-950">
        No bookings found
      </h3>

      <p className="relative z-10 mt-1 text-sm text-slate-500">
        You haven&apos;t started any service yet.
      </p>

      <div className="relative z-10 mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="min-w-[140px]">
          <Link href="/dashboard/jobs">Search for Jobs</Link>
        </Button>

        <Button asChild className="min-w-[140px] bg-primary hover:bg-primary/90">
          <Link href="/dashboard/services/post">Post a service</Link>
        </Button>
      </div>
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

export default function ArtisanWalletPage() {
  const [activeTab, setActiveTab] = useState("history")
  const [activeBookingFilter, setActiveBookingFilter] = useState("current")
  const [summary, setSummary] = useState<any>(null)
  const [activeJobs, setActiveJobs] = useState<WalletService[]>([])
  const [historyJobs, setHistoryJobs] = useState<WalletService[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function loadWalletData() {
    try {
      const [summaryRes, activeRes, historyRes, withdrawalsRes] =
        await Promise.all([
          getArtisanDashboardSummary(),
          getArtisanActiveJobs(),
          getArtisanJobHistory(),
          listMyWithdrawals(),
        ])

      setSummary(summaryRes || null)
      setActiveJobs(Array.isArray(activeRes) ? activeRes.map(mapService) : [])
      setHistoryJobs(Array.isArray(historyRes) ? historyRes.map(mapService) : [])
      setWithdrawals(Array.isArray(withdrawalsRes) ? withdrawalsRes : [])
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

  const displayedTransactions = useMemo(() => {
    if (activeBookingFilter === "current") return activeJobs
    if (activeBookingFilter === "history") return historyJobs
    return []
  }, [activeBookingFilter, activeJobs, historyJobs])

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
          <div className="mb-4 flex gap-3 sm:hidden">
            <Button className="flex-1 bg-primary hover:bg-primary/90">
              Fund wallet
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-primary hover:bg-primary/5"
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
              <div className="mb-5 sm:hidden">
                <Select
                  value={activeBookingFilter}
                  onValueChange={setActiveBookingFilter}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Current bookings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current bookings</SelectItem>
                    <SelectItem value="history">Booking history</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:mb-5 sm:block">
                <Select
                  value={activeBookingFilter}
                  onValueChange={setActiveBookingFilter}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Transaction history" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current bookings</SelectItem>
                    <SelectItem value="history">Service history</SelectItem>
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
              ) : displayedTransactions.length > 0 ? (
                <div className="space-y-4">
                  {displayedTransactions.map((item) => (
                    <ServiceTransactionCard key={item.id} item={item} />
                  ))}
                </div>
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
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Recent withdrawals
                  </h3>

                  {withdrawals.slice(0, 5).map((item) => (
                    <WithdrawalHistoryCard key={item.id} item={item} />
                  ))}
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