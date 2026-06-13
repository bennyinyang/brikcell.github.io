"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Wallet,
  Shield,
  User,
  MessageSquare,
  Package,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Briefcase,
  Settings,
  Headphones,
  Search,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import {
  CustomerDashboardAPI,
  searchArtisans,
  getContractState,
  releaseMilestone,
  partialReleaseMilestone,
  refundMilestone,
  listContractTransactions,
  initDeposit,
  normalizePaginatedResponse,
  type PaginationMeta,
} from "@/lib/api"
import { WithdrawalCard } from "@/components/withdrawal-card"
import { PaginationControl } from "@/components/pagination-control"

type DashboardStats = {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalSpent: number
  walletBalance: number
  escrowBalance: number
}

type DashboardJob = {
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

type SuggestedArtisan = {
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

type MilestonePhase = {
  id: string
  name: string
  amount: number
  status: string
  description?: string
  dueDate?: string
}

type ContractJobCard = {
  id: string
  jobId: string
  title: string
  description: string | null
  category: string | null
  location: string | null
  budget_min: string | number | null
  budget_max: string | number | null
  status: string
  createdAt?: string
  updatedAt?: string
  artisanId?: string
  artisanName?: string
  artisanEmail?: string
  artisanImage?: string | null
  chatRoomId?: string
  milestones: MilestonePhase[]
  totalAmount: number
  escrowFunded: number
}

function toNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const PAYSTACK_FEE_RATE = 0.02

function withPaystackFee(desiredAmount: number): number {
  return Math.ceil(desiredAmount / (1 - PAYSTACK_FEE_RATE))
}

function normalizeMilestoneStatus(raw: any): string {
  return String(raw || "").toUpperCase()
}

function getMilestoneStatusLabel(status: string): string {
  const s = normalizeMilestoneStatus(status)
  const map: Record<string, string> = {
    ACTIVE: "Active",
    FUNDED: "Funded",
    SUBMITTED: "Submitted",
    APPROVAL_PENDING: "Awaiting Approval",
    APPROVED: "Approved",
    RELEASED: "Released",
    PARTIAL_RELEASED: "Partially Released",
    PAID: "Paid",
    REFUNDED: "Refunded",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
    PENDING: "Pending",
  }

  return map[s] || status || "Unknown"
}

function getMilestoneStatusColor(status: string): string {
  const s = normalizeMilestoneStatus(status)

  if (["RELEASED", "PAID"].includes(s)) return "bg-green-50 text-green-700 border-green-100"
  if (["PARTIAL_RELEASED"].includes(s)) return "bg-amber-50 text-amber-700 border-amber-100"
  if (["SUBMITTED", "APPROVAL_PENDING", "APPROVED"].includes(s)) return "bg-blue-50 text-blue-700 border-blue-100"
  if (["ACTIVE", "FUNDED"].includes(s)) return "bg-orange-50 text-orange-700 border-orange-100"
  if (["REFUNDED", "CANCELLED"].includes(s)) return "bg-red-50 text-red-700 border-red-100"

  return "bg-gray-50 text-gray-700 border-gray-100"
}

function canEmployerActOnMilestone(status: string): boolean {
  const s = normalizeMilestoneStatus(status)
  return ["SUBMITTED", "APPROVAL_PENDING", "APPROVED"].includes(s)
}

function mapSuggestedArtisan(raw: any): SuggestedArtisan {
  const user = raw?.User || raw?.user || {}

  let parsedSkills: string[] = []

  if (Array.isArray(raw?.skills)) parsedSkills = raw.skills
  else if (typeof raw?.skills === "string") {
    try {
      parsedSkills = JSON.parse(raw.skills)
    } catch {
      parsedSkills = []
    }
  }

  return {
    id: String(raw?.artisanId || raw?.user_id || user?.id || raw?.id || ""),
    name: user?.name || raw?.name || "Artisan",
    email: user?.email || raw?.email || "",
    profileImage: raw?.profile_image || raw?.profileImage || null,
    serviceType: raw?.service_type || raw?.serviceType || parsedSkills?.[0] || "Artisan",
    skills: parsedSkills,
    location: raw?.location || "",
    rating: toNumber(raw?.rating),
    reviewsCount: toNumber(raw?.reviewsCount || raw?.reviews_count || 0),
    hourlyRate: toNumber(raw?.hourly_rate || raw?.hourlyRate),
    bio: raw?.bio || "",
  }
}

function mapRawJob(raw: any): DashboardJob {
  return {
    id: String(raw?.id || ""),
    title: raw?.title || "Untitled Job",
    description: raw?.description || null,
    category: raw?.category || null,
    location: raw?.location || null,
    budget_min: raw?.budget_min ?? null,
    budget_max: raw?.budget_max ?? null,
    status: raw?.status || "open",
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  }
}

function mapContractToDashboardJob(raw: any): ContractJobCard {
  const job = raw?.job || {}
  const artisan = raw?.artisan || {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || raw?.job_id || raw?.id || ""),
    title: job?.title || "Custom Furniture Design",
    description: job?.description || null,
    category: job?.category || null,
    location: job?.location || null,
    budget_min: job?.budget_min ?? null,
    budget_max: job?.budget_max ?? null,
    status: String(raw?.status || ""),
    createdAt: raw?.createdAt || raw?.created_at || job?.createdAt || job?.created_at,
    updatedAt: raw?.updatedAt || raw?.updated_at || job?.updatedAt || job?.updated_at,
    artisanId: String(artisan?.id || ""),
    artisanName: artisan?.name || "Assigned Artisan",
    artisanEmail: artisan?.email || "",
    artisanImage: artisan?.profileImage || artisan?.profile_image || null,
    chatRoomId: raw?.chat_room_id || undefined,
    milestones: [],
    totalAmount: toNumber(raw?.totalAmount || 0),
    escrowFunded: 0,
  }
}

function formatStatusText(status: string) {
  const n = String(status || "").toLowerCase()

  if (n === "active") return "In progress"
  if (n === "completed") return "Completed"
  if (n === "cancelled") return "Cancelled"
  if (n === "in_review") return "In review"
  if (n === "in_dispute") return "In dispute"
  if (n === "accepted") return "Accepted"

  return String(status || "")
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ")
}

function getStatusColor(status: string) {
  const n = String(status || "").toLowerCase()

  if (["in_progress", "active", "accepted"].includes(n)) return "bg-orange-50 text-orange-700 border border-orange-100"
  if (["open", "in_review"].includes(n)) return "bg-blue-50 text-blue-700 border border-blue-100"
  if (n === "completed") return "bg-green-50 text-green-700 border border-green-100"
  if (["cancelled", "in_dispute"].includes(n)) return "bg-red-50 text-red-700 border border-red-100"

  return "bg-gray-50 text-gray-700 border border-gray-100"
}

function formatCurrency(min?: string | number | null, max?: string | number | null) {
  const minVal = Number(min || 0)
  const maxVal = Number(max || 0)

  if (minVal && maxVal) return `₦${minVal.toLocaleString()} - ₦${maxVal.toLocaleString()}`
  if (maxVal) return `₦${maxVal.toLocaleString()}`
  if (minVal) return `₦${minVal.toLocaleString()}`

  return "Budget not set"
}

function formatDate(value?: string) {
  if (!value) return "—"

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string) {
  if (!value) return "10:00 AM"

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "10:00 AM"

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function WalletFundingCard({
  walletBalance,
  onSuccess,
}: {
  walletBalance: number
  onSuccess: () => Promise<void>
}) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const desiredAmount = toNumber(amount)
  const chargeAmount = desiredAmount > 0 ? withPaystackFee(desiredAmount) : 0
  const feeAmount = chargeAmount - desiredAmount

  async function handleFund() {
    if (desiredAmount <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }

    const toastId = toast.loading("Initialising payment…")
    setLoading(true)

    try {
      const data = await initDeposit(chargeAmount)

      toast.dismiss(toastId)

      const authUrl = data?.authorization_url
      if (!authUrl) throw new Error("No payment URL returned from server.")

      window.open(authUrl, "_blank")

      setAmount("")
      toast.success("Payment page opened. Complete your payment there.", {
        duration: 6000,
      })

      await onSuccess()
    } catch (err: any) {
      toast.error(err?.message || "Payment failed. Please try again.", {
        id: toastId,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 rounded-2xl border border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          Fund Your Wallet
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Current wallet balance</span>
          <span className="font-semibold text-slate-950">₦{walletBalance.toLocaleString()}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount to add to wallet</label>
          <Input
            type="number"
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            disabled={loading}
          />

          {desiredAmount > 0 && (
            <div className="space-y-1 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Wallet credit</span>
                <span>₦{desiredAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Processing fee</span>
                <span>₦{feeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-1 font-semibold text-slate-950">
                <span>Total charge</span>
                <span>₦{chargeAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleFund}
          disabled={desiredAmount <= 0 || loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Fund Wallet
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function ContractActionPanel({
  contract,
  onMilestoneUpdated,
}: {
  contract: ContractJobCard
  onMilestoneUpdated: (contractId: string) => void
}) {
  const [milestones, setMilestones] = useState<MilestonePhase[]>(contract.milestones)
  const [loadingMilestone, setLoadingMilestone] = useState<string | null>(null)
  const [partialOpenFor, setPartialOpenFor] = useState<string | null>(null)
  const [partialAmounts, setPartialAmounts] = useState<Record<string, string>>({})
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const [stateRes, txs] = await Promise.all([
          getContractState(contract.id),
          listContractTransactions(contract.id),
        ])

        if (cancelled) return

        if (stateRes?.contract?.phases) {
          setMilestones(
            stateRes.contract.phases.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              amount: toNumber(p.amount),
              status: p.status,
              description: p.description,
              dueDate: p.dueDate,
            }))
          )
        }

        const paid = (Array.isArray(txs) ? txs : [])
          .filter((t: any) => String(t?.status || "").toLowerCase() === "success")
          .reduce((s: number, t: any) => s + toNumber(t?.amount), 0)

        setTotalPaid(paid)
      } catch {}
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [contract.id])

  const updateMilestoneStatus = (id: string, status: string) => {
    setMilestones((prev) =>
      prev.map((m) => (String(m.id) === String(id) ? { ...m, status } : m))
    )
  }

  async function handleRelease(milestoneId: string) {
    const toastId = toast.loading("Releasing funds…")
    setLoadingMilestone(milestoneId)

    try {
      const res = await releaseMilestone(milestoneId)
      updateMilestoneStatus(milestoneId, res?.milestone?.status || "RELEASED")
      toast.success("Milestone released successfully!", { id: toastId })
      onMilestoneUpdated(contract.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to release milestone", { id: toastId })
    } finally {
      setLoadingMilestone(null)
    }
  }

  async function handlePartialRelease(milestoneId: string, totalAmount: number) {
    const raw = partialAmounts[milestoneId]
    const amt = toNumber(raw)

    if (!amt || amt <= 0 || amt > totalAmount) {
      toast.error("Enter a valid amount")
      return
    }

    const toastId = toast.loading("Processing partial release…")
    setLoadingMilestone(milestoneId)

    try {
      const res = await partialReleaseMilestone(milestoneId, amt)
      updateMilestoneStatus(milestoneId, res?.milestone?.status || "PARTIAL_RELEASED")
      setPartialOpenFor(null)
      setPartialAmounts((prev) => ({ ...prev, [milestoneId]: "" }))
      toast.success("Partial release completed!", { id: toastId })
      onMilestoneUpdated(contract.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to partially release", { id: toastId })
    } finally {
      setLoadingMilestone(null)
    }
  }

  async function handleRefund(milestoneId: string) {
    const toastId = toast.loading("Processing refund…")
    setLoadingMilestone(milestoneId)

    try {
      const res = await refundMilestone(milestoneId)
      updateMilestoneStatus(milestoneId, res?.milestone?.status || "REFUNDED")
      toast.success("Milestone refunded successfully!", { id: toastId })
      onMilestoneUpdated(contract.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to refund milestone", { id: toastId })
    } finally {
      setLoadingMilestone(null)
    }
  }

  const totalContract = milestones.reduce((s, m) => s + m.amount, 0)
  const remaining = Math.max(0, totalContract - totalPaid)

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total", value: totalContract },
          { label: "Paid", value: totalPaid, color: "text-green-600" },
          { label: "Remaining", value: remaining, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-slate-50 px-1 py-2">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-sm font-bold ${color || "text-slate-950"}`}>
              ₦{value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Milestones
        </p>

        {milestones.length === 0 && (
          <p className="text-sm text-slate-400">No milestones found for this contract.</p>
        )}

        {milestones.map((ms, idx) => {
          const isLoading = loadingMilestone === String(ms.id)
          const canAct = canEmployerActOnMilestone(ms.status)
          const isPartialOpen = partialOpenFor === String(ms.id)

          return (
            <div key={ms.id} className="space-y-2 rounded-lg border border-slate-100 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">Phase {idx + 1}</p>
                  <p className="truncate text-sm font-medium">{ms.name}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-primary">
                    ₦{ms.amount.toLocaleString()}
                  </p>
                  <Badge className={`${getMilestoneStatusColor(ms.status)} mt-1 text-xs`}>
                    {getMilestoneStatusLabel(ms.status)}
                  </Badge>
                </div>
              </div>

              {canAct && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled={isLoading}
                      onClick={() => handleRelease(String(ms.id))}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      Release
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() =>
                        setPartialOpenFor((prev) =>
                          prev === String(ms.id) ? null : String(ms.id)
                        )
                      }
                    >
                      <DollarSign className="mr-1 h-3 w-3" />
                      Partial
                    </Button>
                  </div>

                  {isPartialOpen && (
                    <div className="space-y-2 rounded-lg border bg-slate-50 p-2">
                      <Input
                        type="number"
                        min="1"
                        max={ms.amount}
                        step="0.01"
                        placeholder={`Max ₦${ms.amount.toLocaleString()}`}
                        value={partialAmounts[String(ms.id)] || ""}
                        onChange={(e) =>
                          setPartialAmounts((prev) => ({
                            ...prev,
                            [String(ms.id)]: e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        className="h-8 text-sm"
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 flex-1"
                          disabled={isLoading}
                          onClick={() => handlePartialRelease(String(ms.id), ms.amount)}
                        >
                          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            setPartialOpenFor(null)
                            setPartialAmounts((prev) => ({
                              ...prev,
                              [String(ms.id)]: "",
                            }))
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    disabled={isLoading}
                    onClick={() => handleRefund(String(ms.id))}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Refund
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {contract.chatRoomId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/messages?roomId=${contract.chatRoomId}`}>
            <MessageSquare className="mr-2 h-3 w-3" />
            Open in Messages
          </Link>
        </Button>
      )}
    </div>
  )
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Browse Talent", href: "/search" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Post a Gig", href: "/post-job" },
    { label: "Wallet", href: "/dashboard/customer/wallet" },
    { label: "Settings", href: "/dashboard/customer/settings" },
    { label: "Support", href: "/support" },
  ]

  return (
    <aside className="hidden w-[190px] shrink-0 lg:block">
      <nav className="space-y-4 text-sm">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 transition ${
              item.active
                ? "bg-slate-50 font-medium text-slate-950"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {item.active && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {!item.active && <span className="mr-3" />}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function EmptyServicesState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 text-center">
      <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-slate-50">
        <div className="absolute h-44 w-44 rounded-full border border-slate-50" />
        <div className="absolute h-36 w-36 rounded-full border border-slate-100" />
        <div className="absolute h-28 w-28 rounded-full border border-slate-100" />
        <div className="absolute h-20 w-20 rounded-full border border-slate-200" />
        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Briefcase className="h-5 w-5 text-slate-500" />
        </div>
      </div>

      <h3 className="-mt-8 text-sm font-semibold text-slate-950">No services found</h3>
      <p className="mt-1 text-xs text-slate-500">You haven’t started any services yet.</p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/find-artisan">Search for Talent</Link>
        </Button>

        <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
          <Link href="/post-job">
            <Plus className="mr-1 h-4 w-4" />
            Post a gig
          </Link>
        </Button>
      </div>
    </div>
  )
}

function MiniWalletCard({
  stats,
  onShowFunding,
  onShowWithdrawal,
}: {
  stats: DashboardStats
  onShowFunding: () => void
  onShowWithdrawal: () => void
}) {
  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">My wallet</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2 border-b border-slate-100 pb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Wallet balance</span>
            <span className="font-medium text-slate-950">₦{stats.walletBalance.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Total spendings</span>
            <span className="font-medium text-slate-950">₦{stats.totalSpent.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Funds in escrow</span>
            <span className="font-medium text-slate-950">₦{stats.escrowBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1 border-b border-slate-100 pb-3">
          <p className="text-slate-500">Payment method</p>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-700">**** **** **** 1234</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-slate-500">Withdrawal Account</p>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-700">**** **** 1234</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onShowFunding}>
            Fund
          </Button>
          <Button size="sm" variant="outline" onClick={onShowWithdrawal}>
            Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmployerServiceCard({
  job,
  onMilestoneUpdated,
  history,
}: {
  job: ContractJobCard
  onMilestoneUpdated: (contractId: string) => void
  history?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isActionable = ["active", "accepted", "ACTIVE", "ACCEPTED"].includes(job.status)

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 sm:hidden">
              <h3 className="text-sm font-semibold text-slate-950">{job.title}</h3>
              <Badge className={`${getStatusColor(job.status)} shrink-0 text-xs`}>
                {formatStatusText(job.status)}
              </Badge>
            </div>

            <h3 className="hidden text-sm font-semibold text-slate-950 sm:block">{job.title}</h3>

            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={job.artisanImage || undefined} />
                <AvatarFallback className="text-[10px]">
                  {String(job.artisanName || "A").charAt(0)}
                </AvatarFallback>
              </Avatar>

              <p className="text-xs text-slate-600">
                Talent: <span className="font-medium">{job.artisanName || "Assigned Artisan"}</span>
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <Badge className={`${getStatusColor(job.status)} text-xs`}>
              {formatStatusText(job.status)}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>Date initiated: {formatDate(job.createdAt)}</span>
          <span>Time: {formatTime(job.createdAt)}</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => setExpanded((prev) => !prev)}
          >
            View Details
            {expanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>

          {!history && (
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Cancel service
            </Button>
          )}

          {history && (
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Request revision
            </Button>
          )}
        </div>

        {expanded && (
          <ContractActionPanel contract={job} onMilestoneUpdated={onMilestoneUpdated} />
        )}
      </CardContent>
    </Card>
  )
}

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    walletBalance: 0,
    escrowBalance: 0,
  })

  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([])
  const [activeJobs, setActiveJobs] = useState<ContractJobCard[]>([])
  const [completedJobs, setCompletedJobs] = useState<ContractJobCard[]>([])
  const [suggestedArtisans, setSuggestedArtisans] = useState<SuggestedArtisan[]>([])
  const [loading, setLoading] = useState(true)
  const [showFunding, setShowFunding] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [overviewPage, setOverviewPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

const [overviewPagination, setOverviewPagination] =
  useState<PaginationMeta | null>(null)
const [activePagination, setActivePagination] =
  useState<PaginationMeta | null>(null)
const [historyPagination, setHistoryPagination] =
  useState<PaginationMeta | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      const overview = await CustomerDashboardAPI.getOverview()
      const s = overview?.stats || {}

      setStats((prev) => ({
        ...prev,
        walletBalance: toNumber(s?.walletBalance),
        escrowBalance: toNumber(s?.escrowBalance),
        totalSpent: toNumber(s?.totalSpent),
        totalJobs: toNumber(s?.totalJobs),
        activeJobs: toNumber(s?.activeJobs),
        completedJobs: toNumber(s?.completedJobs),
      }))
    } catch {}
  }, [])

  const handleMilestoneUpdated = useCallback(
    (contractId: string) => {
      refreshStats()
    },
    [refreshStats]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)

        const [overview, active, history] = await Promise.all([
          CustomerDashboardAPI.getOverview(overviewPage, 6),
          CustomerDashboardAPI.getActiveJobs(activePage, 6),
          CustomerDashboardAPI.getJobHistory(historyPage, 6),
        ])

        if (cancelled) return

        const s = overview?.stats || {}

        setStats({
          totalJobs: toNumber(s?.totalJobs),
          activeJobs: toNumber(s?.activeJobs),
          completedJobs: toNumber(s?.completedJobs),
          totalSpent: toNumber(s?.totalSpent),
          walletBalance: toNumber(s?.walletBalance),
          escrowBalance: toNumber(s?.escrowBalance),
        })

        const recentJobsPaginated = normalizePaginatedResponse<any>(
          overview?.recentJobs
        )

        const activePaginated = normalizePaginatedResponse<any>(active)
        const historyPaginated = normalizePaginatedResponse<any>(history)

        setRecentJobs(recentJobsPaginated.data.map(mapRawJob))
        setOverviewPagination(recentJobsPaginated.pagination)

        setActiveJobs(activePaginated.data.map(mapContractToDashboardJob))
        setCompletedJobs(historyPaginated.data.map(mapContractToDashboardJob))

        setActivePagination(activePaginated.pagination)
        setHistoryPagination(historyPaginated.pagination)

        const suggestedPaginated = normalizePaginatedResponse<any>(
          overview?.suggested
        )

        setSuggestedArtisans(suggestedPaginated.data.map(mapSuggestedArtisan))
      } catch (err) {
        console.error("Customer dashboard load error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [overviewPage, activePage, historyPage])

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading dashboard…</div>
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
      <EmployerSidebar />

      <main className="min-w-0 flex-1">
        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          <section>
            <div className="border-b border-slate-100 pb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Welcome Back, James!
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Here is a quick overview of your activities
              </p>

              <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm text-primary">
                <Link href="/post-job">Post a job</Link>
                <Link href="/search">Book a service</Link>
                <Link href="/search">View services</Link>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                showFunding ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <WalletFundingCard walletBalance={stats.walletBalance} onSuccess={refreshStats} />
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                showWithdrawal ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <WithdrawalCard
                  balance={stats.walletBalance}
                  title="Withdraw from Wallet"
                  onSuccess={refreshStats}
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid w-full grid-cols-3 rounded-lg border border-slate-100 bg-white p-1">
                <TabsTrigger value="active" className="rounded-md text-xs">
                  Active services
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-md text-xs">
                  Upcoming services
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-md text-xs">
                  Service history
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-5 space-y-4">
                {activeJobs.length === 0 ? (
                  <EmptyServicesState />
                ) : (
                  <>
                    {activeJobs.map((job) => (
                      <EmployerServiceCard
                        key={job.id}
                        job={job}
                        onMilestoneUpdated={handleMilestoneUpdated}
                      />
                    ))}

                    {activePagination && (
                      <PaginationControl
                        pagination={activePagination}
                        onPageChange={setActivePage}
                      />
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-5">
                <EmptyServicesState />
              </TabsContent>

              <TabsContent value="history" className="mt-5 space-y-4">
                {completedJobs.length === 0 ? (
                  <EmptyServicesState />
                ) : (
                  <>
                    {completedJobs.map((job) => (
                      <EmployerServiceCard
                        key={job.id}
                        job={job}
                        history
                        onMilestoneUpdated={handleMilestoneUpdated}
                      />
                    ))}

                    {historyPagination && (
                      <PaginationControl
                        pagination={historyPagination}
                        onPageChange={setHistoryPage}
                      />
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </section>

          <aside className="space-y-4">
            <MiniWalletCard
              stats={stats}
              onShowFunding={() => setShowFunding((prev) => !prev)}
              onShowWithdrawal={() => setShowWithdrawal((prev) => !prev)}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}