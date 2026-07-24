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
} from "lucide-react"
import Link from "next/link"
import {
  CustomerDashboardAPI,
  searchArtisans,
  getContractState,
  fundMilestone,
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
import { ReviewDialog } from "@/components/review/review-dialog"

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
  labour_cost: number
  material_cost: number
  initial_release_done: boolean
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

// Official Paystack rate: 1.5% + ₦100 flat, capped at ₦2,000
function withPaystackFee(desiredAmount: number): number {
  if (desiredAmount <= 0) return 0
  const uncapped = Math.ceil((desiredAmount + 100) / (1 - 0.015))
  return uncapped - desiredAmount >= 2000 ? desiredAmount + 2000 : uncapped
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

// Priority order for the card status badge — only non-terminal, actionable states.
// Terminal states (RELEASED, PARTIAL_RELEASED, REFUNDED, CANCELLED) are intentionally
// excluded so an active contract with some settled milestones shows its in-progress state.
const MILESTONE_STATUS_PRIORITY: Record<string, number> = {
  SUBMITTED: 5,        // artisan submitted work, employer needs to act
  APPROVAL_PENDING: 4, // waiting on approval
  ACTIVE: 3,           // milestone in progress
  FUNDED: 2,           // escrow funded, work not started
  APPROVED: 1,         // approved, awaiting release
}

const TERMINAL_MILESTONE_STATUSES = new Set(["RELEASED", "PARTIAL_RELEASED", "REFUNDED", "CANCELLED"])

function derivedContractStatus(milestones: any[]): string | null {
  if (!Array.isArray(milestones) || milestones.length === 0) return null
  let best: { status: string; priority: number } | null = null
  for (const m of milestones) {
    const s = String(m?.status || "").toUpperCase()
    const p = MILESTONE_STATUS_PRIORITY[s] ?? 0
    if (p > 0 && (!best || p > best.priority)) {
      best = { status: s, priority: p }
    }
  }
  return best?.status ?? null
}

function mapContractToDashboardJob(raw: any): ContractJobCard {
  const job = raw?.job || {}
  const artisan = raw?.artisan || {}
  const milestones: any[] = Array.isArray(raw?.milestones) ? raw.milestones : []

  // The artisan fills in a "Project Title" on the milestone creation form in the chat.
  // That value is stored as milestone.title — match the artisan dashboard which reads raw.title
  // where raw is a milestone. Here raw is a contract, so we read from the first milestone.
  // Fall back to the contract's own title column, then the job posting title.
  const firstMilestoneTitle = milestones.length > 0
    ? (milestones[0].title || milestones[0].name || "")
    : ""
  const title = firstMilestoneTitle || raw?.title || job?.title || `Service with ${artisan?.name || "Artisan"}`

  // The history endpoint stamps _displayStatus server-side (authoritative).
  // For active contracts the server doesn't stamp it, so we derive locally.
  let displayStatus: string

  if (raw?._displayStatus) {
    // Server already computed the correct label — use it directly.
    displayStatus = String(raw._displayStatus)
  } else {
    const contractStatus = String(raw?.status || "").toUpperCase()

    if (["COMPLETED", "CANCELLED"].includes(contractStatus)) {
      displayStatus = contractStatus
    } else if (contractStatus === "ACTIVE") {
      // Surface the most actionable non-terminal milestone state for active contracts.
      displayStatus = derivedContractStatus(milestones) || "ACTIVE"
    } else {
      displayStatus = contractStatus
    }
  }

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || raw?.job_id || ""),
    title,
    description: job?.description || null,
    category: job?.category || null,
    location: job?.location || null,
    budget_min: job?.budget_min ?? null,
    budget_max: job?.budget_max ?? null,
    status: displayStatus,
    createdAt: raw?.createdAt || raw?.created_at || job?.createdAt || job?.created_at,
    updatedAt: raw?.updatedAt || raw?.updated_at || job?.updatedAt || job?.updated_at,
    artisanId: String(artisan?.id || ""),
    artisanName: artisan?.name || "Assigned Artisan",
    artisanEmail: artisan?.email || "",
    artisanImage: artisan?.profileImage || artisan?.profile_image || null,
    chatRoomId: raw?.chat_room_id || undefined,
    milestones: milestones.map((m: any) => ({
      id: String(m.id),
      name: m.title || m.name || "",
      amount: toNumber(m.amount),
      status: String(m.status || ""),
    })),
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
  if (n === "submitted") return "Pending Review"
  if (n === "approval_pending") return "Approval Pending"
  if (n === "funded") return "Funded"
  if (n === "partial_released") return "Partially Released"
  if (n === "released") return "Released"
  if (n === "refunded") return "Refunded"

  return String(status || "")
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ")
}

function getStatusColor(status: string) {
  const n = String(status || "").toLowerCase()

  if (["in_progress", "active", "accepted", "funded"].includes(n)) return "bg-orange-50 text-orange-700 border border-orange-100"
  if (["open", "in_review", "submitted", "approval_pending"].includes(n)) return "bg-blue-50 text-blue-700 border border-blue-100"
  if (["completed", "released"].includes(n)) return "bg-green-50 text-green-700 border border-green-100"
  if (["cancelled", "in_dispute", "refunded"].includes(n)) return "bg-red-50 text-red-700 border border-red-100"
  if (n === "partial_released") return "bg-purple-50 text-purple-700 border border-purple-100"

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
          setMilestones(stateRes.contract.phases.map(remapPhase))
        }

        const successful = (Array.isArray(txs) ? txs : [])
          .filter((t: any) => String(t?.status || "").toLowerCase() === "success")
        const releaseTotal = successful
          .filter((t: any) => !["deposit", "milestone_refund"].includes(String(t?.type || "").toLowerCase()))
          .reduce((s: number, t: any) => s + toNumber(t?.amount), 0)

        setTotalPaid(releaseTotal)
      } catch {}
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [contract.id])

  const remapPhase = (p: any): MilestonePhase => ({
    id: String(p.id),
    name: p.name,
    amount: toNumber(p.amount),
    labour_cost: toNumber(p.labour_cost),
    material_cost: toNumber(p.material_cost),
    initial_release_done: Boolean(p.initial_release_done),
    status: p.status,
    description: p.description,
    dueDate: p.dueDate,
  })

  const refreshMilestones = async () => {
    const stateRes = await getContractState(contract.id)
    if (stateRes?.contract?.phases) {
      setMilestones(stateRes.contract.phases.map(remapPhase))
    }
  }

  const updateMilestoneStatus = (id: string, status: string) => {
    setMilestones((prev) =>
      prev.map((m) => (String(m.id) === String(id) ? { ...m, status } : m))
    )
  }

  async function handleFund(milestoneId: string) {
    const toastId = toast.loading("Funding milestone…")
    setLoadingMilestone(milestoneId)
    try {
      await fundMilestone(milestoneId)
      await refreshMilestones()
      toast.success("Milestone funded — advance payment released to artisan!", { id: toastId })
      onMilestoneUpdated(contract.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund milestone", { id: toastId })
    } finally {
      setLoadingMilestone(null)
    }
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
  const allPhasesReleased =
    milestones.length > 0 &&
    milestones.every((m) =>
      ["released", "paid"].includes(normalizeMilestoneStatus(m.status).toLowerCase())
    )
  const effectivePaid = allPhasesReleased
    ? totalContract
    : Math.min(totalPaid, totalContract)
  const remaining = Math.max(0, totalContract - effectivePaid)

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total", value: totalContract },
          { label: "Paid", value: effectivePaid, color: "text-green-600" },
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
          const canFund = normalizeMilestoneStatus(ms.status) === "ACTIVE" && !ms.initial_release_done
          const canAct  = canEmployerActOnMilestone(ms.status)
          const isPartialOpen = partialOpenFor === String(ms.id)
          const msNormStatus = normalizeMilestoneStatus(ms.status)
          const isFullyPaid  = msNormStatus === "RELEASED" || msNormStatus === "PAID" || msNormStatus === "COMPLETED"

          // After Phase 1 only remaining 90% labour can be released/refunded
          const phase2Max = ms.initial_release_done
            ? ms.labour_cost * 0.9
            : ms.amount

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

              {/* Phase 1 advance breakdown — shown after initial release */}
              {ms.initial_release_done && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Advance Released
                    </span>
                    <span className="font-semibold text-emerald-700">
                      ₦{(ms.material_cost + ms.labour_cost * 0.1).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    {isFullyPaid ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Final Payment Released
                      </span>
                    ) : (
                      <span className="text-slate-500">Pending approval</span>
                    )}
                    <span className={`font-semibold ${isFullyPaid ? "text-emerald-700" : "text-slate-700"}`}>
                      ₦{(ms.labour_cost * 0.9).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Fund & Advance Pay — employer action before artisan starts */}
              {canFund && (
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading}
                  onClick={() => handleFund(String(ms.id))}
                >
                  {isLoading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <DollarSign className="mr-1 h-3 w-3" />
                  )}
                  {isLoading ? "Processing…" : "Fund & Advance Pay"}
                </Button>
              )}

              {/* Release / Partial / Refund — after artisan submits */}
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
                      {ms.initial_release_done && (
                        <p className="text-[10px] text-slate-400">
                          Advance already released. Max: ₦{Math.round(phase2Max).toLocaleString()}
                        </p>
                      )}
                      <Input
                        type="number"
                        min="1"
                        max={phase2Max}
                        step="0.01"
                        placeholder={`Max ₦${Math.round(phase2Max).toLocaleString()}`}
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
                          onClick={() => handlePartialRelease(String(ms.id), phase2Max)}
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
                    {ms.initial_release_done ? "Refund Remaining" : "Refund"}
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
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-[family-name:var(--font-manrope)]">My Wallet</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2 border-b border-slate-100 pb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Wallet Balance</span>
            <span className="font-medium text-slate-950">₦{stats.walletBalance.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Total Spendings</span>
            <span className="font-medium text-slate-950">₦{stats.totalSpent.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Funds in Escrow</span>
            <span className="font-medium text-slate-950">₦{stats.escrowBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* <div className="space-y-1 border-b border-slate-100 pb-3">
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
        </div> */}

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
  const [reviewOpen, setReviewOpen] = useState(false)
  const isActionable = ["active", "accepted", "ACTIVE", "ACCEPTED"].includes(job.status)
  const hasReleasedMilestone = job.milestones.some((m) =>
    ["RELEASED", "PARTIAL_RELEASED"].includes(String(m.status).toUpperCase())
  )
  const TERMINAL_STATUSES = ["released", "partial_released", "refunded", "completed", "cancelled"]
  const canCancel = !TERMINAL_STATUSES.includes(String(job.status).toLowerCase())

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

          {!history && canCancel && (
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Cancel service
            </Button>
          )}

          {history && (
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Request revision
            </Button>
          )}

          {hasReleasedMilestone && job.artisanId && (
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={() => setReviewOpen(true)}
            >
              ⭐ Leave Review
            </Button>
          )}
        </div>

        {expanded && (
          <ContractActionPanel contract={job} onMilestoneUpdated={onMilestoneUpdated} />
        )}

        {job.artisanId && (
          <ReviewDialog
            open={reviewOpen}
            onClose={() => setReviewOpen(false)}
            revieweeId={job.artisanId}
            revieweeName={job.artisanName || "Artisan"}
            jobId={job.jobId || undefined}
            jobTitle={job.title}
          />
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
    return (
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <EmployerSidebar />

        <main className="min-w-0 flex-1">
          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <section>
              {/* Header */}
              <div className="border-b border-slate-100 pb-6">
                <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              </div>

              {/* Tab bar */}
              <div className="mt-8 grid grid-cols-3 gap-1 rounded-lg border border-slate-100 bg-white p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-md bg-slate-100" />
                ))}
              </div>

              {/* Service cards */}
              <div className="mt-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="rounded-2xl border border-slate-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-5 w-2/5 animate-pulse rounded bg-slate-100" />
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-100" />
                            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-3 flex gap-6">
                        <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
                        <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Wallet aside */}
            <aside>
              <Card className="rounded-2xl border border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 border-b border-slate-100 pb-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                  <div className="h-9 w-full animate-pulse rounded-md bg-slate-100" />
                  <div className="h-9 w-full animate-pulse rounded-md bg-slate-100" />
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    )
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
                <Link href="/dashboard/customer/favourites">Favourite artisans</Link>
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
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                    {activePagination?.total ?? activeJobs.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-md text-xs">
                  Upcoming services
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                    0
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-md text-xs">
                  Service history
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                    {historyPagination?.total ?? completedJobs.length}
                  </span>
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