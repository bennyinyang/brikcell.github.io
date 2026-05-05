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
  Plus, Clock, CheckCircle, AlertCircle, Star, MapPin,
  Calendar, DollarSign, Wallet, Shield, User, MessageSquare,
  Package, XCircle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react"
import Link from "next/link"
import {
  CustomerDashboardAPI,
  searchArtisans,
  getAuth,
  getContractState,
  releaseMilestone,
  partialReleaseMilestone,
  refundMilestone,
  listContractTransactions,
  API_BASE,
  initDeposit,
} from "@/lib/api"
import { WithdrawalCard } from "@/components/withdrawal-card"

// ── Types ─────────────────────────────────────────────────────────────────────

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
  id: string          // contract id
  jobId: string       // underlying job id (for routing)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Add 2% Paystack fee so the wallet receives exactly what the user typed */
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
    ACTIVE: "Active", FUNDED: "Funded", SUBMITTED: "Submitted",
    APPROVAL_PENDING: "Awaiting Approval", APPROVED: "Approved",
    RELEASED: "Released", PARTIAL_RELEASED: "Partially Released",
    PAID: "Paid", REFUNDED: "Refunded", CANCELLED: "Cancelled",
    DRAFT: "Draft", PENDING: "Pending",
  }
  return map[s] || status || "Unknown"
}

function getMilestoneStatusColor(status: string): string {
  const s = normalizeMilestoneStatus(status)
  if (["RELEASED", "PAID"].includes(s)) return "bg-green-100 text-green-800"
  if (["PARTIAL_RELEASED"].includes(s)) return "bg-amber-100 text-amber-800"
  if (["SUBMITTED", "APPROVAL_PENDING", "APPROVED"].includes(s)) return "bg-blue-100 text-blue-800"
  if (["ACTIVE", "FUNDED"].includes(s)) return "bg-primary/10 text-primary"
  if (["REFUNDED", "CANCELLED"].includes(s)) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

/** Can the employer act on this milestone? */
function canEmployerActOnMilestone(status: string): boolean {
  const s = normalizeMilestoneStatus(status)
  return ["SUBMITTED", "APPROVAL_PENDING", "APPROVED"].includes(s)
}

function mapSuggestedArtisan(raw: any): SuggestedArtisan {
  const user = raw?.User || raw?.user || {}
  let parsedSkills: string[] = []
  if (Array.isArray(raw?.skills)) parsedSkills = raw.skills
  else if (typeof raw?.skills === "string") {
    try { parsedSkills = JSON.parse(raw.skills) } catch { parsedSkills = [] }
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
    title: job?.title || "Contract Job",
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
    milestones: [],   // hydrated separately via getContractState
    totalAmount: toNumber(raw?.totalAmount || 0),
    escrowFunded: 0,
  }
}

// ── Wallet Funding Card ───────────────────────────────────────────────────────

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
      // Uses request() internally → credentials: "include" → cookie sent → no 401
      // No contractId = pure wallet top-up
      const data = await initDeposit(chargeAmount)

      toast.dismiss(toastId)

      const authUrl = data?.authorization_url
      if (!authUrl) throw new Error("No payment URL returned from server.")

      window.open(authUrl, "_blank")

      setLoading(false)
      setAmount("")

      toast.success(
        "Payment page opened in a new tab. Complete your payment there — your balance will update automatically.",
        { duration: 6000 }
      )

    } catch (err: any) {
      toast.error(err?.message || "Payment failed. Please try again.", { id: toastId })
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-green-600" />
          Fund Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-600">Current wallet balance</span>
          <span className="font-semibold text-gray-900">₦{walletBalance.toLocaleString()}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount to add to wallet (₦)</label>
          <Input
            type="number"
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            disabled={loading}
          />
          {desiredAmount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>You want credited to wallet</span>
                <span className="font-medium">₦{desiredAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Paystack processing fee (~2%)</span>
                <span>₦{feeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-amber-200">
                <span>You will be charged</span>
                <span>₦{chargeAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleFund}
          disabled={ desiredAmount <= 0 || loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
          ) : (
            <><DollarSign className="h-4 w-4 mr-2" /> Fund Wallet</>
          )}
        </Button>

        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
          <span>Payments are secured by Paystack. Your wallet is credited with the exact amount you enter above.</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Contract Action Panel (milestones) ────────────────────────────────────────

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

  // Load live milestone state + transaction total
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
      } catch { /* silent */ }
    }
    hydrate()
    return () => { cancelled = true }
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
      toast.error("Enter a valid amount between 1 and ₦" + totalAmount.toLocaleString())
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
    <div className="mt-4 border-t pt-4 space-y-4">
      {/* Payment summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total", value: totalContract },
          { label: "Paid", value: totalPaid, color: "text-green-600" },
          { label: "Remaining", value: remaining, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-lg py-2 px-1">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-sm font-bold ${color || "text-gray-900"}`}>
              ₦{value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Milestone list */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestones</p>
        {milestones.length === 0 && (
          <p className="text-sm text-gray-400">No milestones found for this contract.</p>
        )}
        {milestones.map((ms, idx) => {
          const isLoading = loadingMilestone === String(ms.id)
          const canAct = canEmployerActOnMilestone(ms.status)
          const isPartialOpen = partialOpenFor === String(ms.id)

          return (
            <div key={ms.id} className="border rounded-lg p-3 space-y-2 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Phase {idx + 1}</p>
                  <p className="text-sm font-medium truncate">{ms.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">₦{ms.amount.toLocaleString()}</p>
                  <Badge className={`${getMilestoneStatusColor(ms.status)} text-xs mt-1`}>
                    {getMilestoneStatusLabel(ms.status)}
                  </Badge>
                </div>
              </div>

              {/* Action buttons — only shown when milestone is submitted/approved */}
              {canAct && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isLoading}
                      onClick={() => handleRelease(String(ms.id))}
                    >
                      {isLoading && loadingMilestone === String(ms.id) ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
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
                      <DollarSign className="h-3 w-3 mr-1" />
                      Partial
                    </Button>
                  </div>

                  {isPartialOpen && (
                    <div className="bg-gray-50 border rounded-lg p-2 space-y-2">
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
                          className="flex-1 h-8"
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
                            setPartialAmounts((prev) => ({ ...prev, [String(ms.id)]: "" }))
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
                    className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    disabled={isLoading}
                    onClick={() => handleRefund(String(ms.id))}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Refund
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Go to chat */}
      {contract.chatRoomId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/messages?roomId=${contract.chatRoomId}`}>
            <MessageSquare className="h-3 w-3 mr-2" />
            Open in Messages
          </Link>
        </Button>
      )}
    </div>
  )
}

// ── Active Contract Card ──────────────────────────────────────────────────────

function ActiveContractCard({
  job,
  onMilestoneUpdated,
}: {
  job: ContractJobCard
  onMilestoneUpdated: (contractId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const isActionable =
    ["active", "accepted", "ACTIVE", "ACCEPTED"].includes(job.status)

  return (
    <Card className="group">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{job.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {job.location || "No location"} · Updated {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <Badge className={getStatusColor(job.status)}>{formatStatusText(job.status)}</Badge>
        </div>

        {/* Artisan info row */}
        <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={job.artisanImage || undefined} />
              <AvatarFallback className="text-xs">
                {String(job.artisanName || "A")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{job.artisanName || "Artisan"}</p>
              <p className="text-xs text-gray-500 truncate">{job.artisanEmail || ""}</p>
            </div>
          </div>
          {job.artisanId && (
            <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs" asChild>
              <Link href={`/artisan/${job.artisanId}`}>
                <User className="h-3 w-3 mr-1" />
                Profile
              </Link>
            </Button>
          )}
        </div>

        {/* Budget */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(job.budget_min, job.budget_max)}
          </span>
          <span className="text-sm text-gray-500">{job.category || ""}</span>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${job.jobId}`}>View Job</Link>
          </Button>

          {isActionable && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1"
            >
              <Package className="h-3 w-3" />
              Manage Milestones
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>

        {/* Expandable milestone panel */}
        {isActionable && expanded && (
          <ContractActionPanel contract={job} onMilestoneUpdated={onMilestoneUpdated} />
        )}
      </CardContent>
    </Card>
  )
}

// ── Shared formatters (keep consistent with old code) ─────────────────────────

function formatStatusText(status: string) {
  const n = String(status || "").toLowerCase()
  if (n === "active") return "Active"
  if (n === "completed") return "Completed"
  if (n === "cancelled") return "Cancelled"
  if (n === "in_review") return "In Review"
  if (n === "in_dispute") return "In Dispute"
  if (n === "accepted") return "Accepted"
  return String(status || "").split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ")
}

function getStatusColor(status: string) {
  const n = String(status || "").toLowerCase()
  if (["in_progress", "active", "accepted"].includes(n)) return "bg-primary/10 text-primary"
  if (["open", "in_review"].includes(n)) return "bg-blue-100 text-blue-800"
  if (n === "completed") return "bg-green-100 text-green-800"
  if (["cancelled", "in_dispute"].includes(n)) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

function getStatusIcon(status: string) {
  const n = String(status || "").toLowerCase()
  if (["in_progress", "active"].includes(n)) return <Clock className="h-4 w-4 text-accent" />
  if (["open", "in_review"].includes(n)) return <AlertCircle className="h-4 w-4 text-primary" />
  if (n === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />
  if (["cancelled", "in_dispute"].includes(n)) return <AlertCircle className="h-4 w-4 text-red-500" />
  return <AlertCircle className="h-4 w-4 text-gray-500" />
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
  return d.toLocaleDateString()
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0, activeJobs: 0, completedJobs: 0,
    totalSpent: 0, walletBalance: 0, escrowBalance: 0,
  })
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([])
  const [activeJobs, setActiveJobs] = useState<ContractJobCard[]>([])
  const [completedJobs, setCompletedJobs] = useState<ContractJobCard[]>([])
  const [suggestedArtisans, setSuggestedArtisans] = useState<SuggestedArtisan[]>([])
  const [loading, setLoading] = useState(true)
  const [showFunding, setShowFunding] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)

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
    } catch { /* silent */ }
  }, [])

  // Re-hydrate a single contract's milestone state after an action
  const handleMilestoneUpdated = useCallback((contractId: string) => {
    // Stats refresh (wallet/escrow balances may change)
    refreshStats()
  }, [refreshStats])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [overview, active, history] = await Promise.all([
          CustomerDashboardAPI.getOverview(),
          CustomerDashboardAPI.getActiveJobs(),
          CustomerDashboardAPI.getJobHistory(),
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

        setRecentJobs((Array.isArray(overview?.recentJobs) ? overview.recentJobs : []).map(mapRawJob))

        let suggested = Array.isArray(overview?.suggested)
          ? overview.suggested
          : Array.isArray(overview?.suggestedArtisans)
          ? overview.suggestedArtisans
          : []

        if (!suggested.length) {
          try {
            const res = await searchArtisans({ page: 1, limit: 6 })
            suggested =
              res && typeof res === "object" && "results" in res && Array.isArray((res as any).results)
                ? (res as any).results
                : []
          } catch { /* fallback failed silently */ }
        }

        setSuggestedArtisans(suggested.map(mapSuggestedArtisan))
        setActiveJobs((Array.isArray(active) ? active : []).map(mapContractToDashboardJob))
        setCompletedJobs((Array.isArray(history) ? history : []).map(mapContractToDashboardJob))
      } catch (err) {
        console.error("Customer dashboard load error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard…</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* ── Header ── */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome back!</h1>
          <p className="text-base text-gray-600">Manage your jobs and find trusted artisans</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={showFunding ? "default" : "outline"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setShowFunding((prev) => !prev)}
          >
            <Wallet className="h-5 w-5 mr-2" />
            {showFunding ? "Hide Fund" : "Fund"}
          </Button>

          <Button
            type="button"
            variant={showWithdrawal ? "default" : "outline"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setShowWithdrawal((prev) => !prev)}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            {showWithdrawal ? "Hide Withdraw" : "Withdraw"}
          </Button>

          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/post-job">
              <Plus className="h-5 w-5 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Active Jobs", value: stats.activeJobs, icon: <Clock className="h-6 w-6 text-primary" /> },
          { label: "Completed", value: stats.completedJobs, icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
          { label: "Total Spent", value: `₦${stats.totalSpent.toLocaleString()}`, icon: <Star className="h-6 w-6 text-yellow-500" /> },
          { label: "Wallet", value: `₦${stats.walletBalance.toLocaleString()}`, icon: <Wallet className="h-6 w-6 text-green-600" /> },
          { label: "Escrow", value: `₦${stats.escrowBalance.toLocaleString()}`, icon: <Clock className="h-6 w-6 text-orange-500" /> },
          { label: "Total Jobs", value: stats.totalJobs, icon: <Calendar className="h-6 w-6 text-primary" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label} className="bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
                {icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showFunding ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0 mb-0"
        }`}
      >
        <div className="overflow-hidden">
          <WalletFundingCard walletBalance={stats.walletBalance} onSuccess={refreshStats} />
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showWithdrawal ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0 mb-0"
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

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("active")}>
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No recent jobs yet.</p>
              ) : (
                recentJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="border rounded-xl p-4 space-y-3 hover:shadow-md transition">
                    <div className="flex space-x-4">
                      {getStatusIcon(job.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.category || "General job"}</p>
                        <div className="text-sm text-gray-500 flex flex-wrap gap-4 mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />{job.location || "No location"}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />{formatDate(job.created_at || job.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className={getStatusColor(job.status)}>{formatStatusText(job.status)}</Badge>
                      <p className="font-semibold">{formatCurrency(job.budget_min, job.budget_max)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested for You</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedArtisans.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-full">No artisan suggestions yet.</p>
              ) : (
                suggestedArtisans.map((a) => (
                  <div key={a.id} className="border rounded-xl p-4 hover:shadow transition">
                    <div className="flex space-x-3">
                      <img
                        src={a.profileImage || "/placeholder.svg?height=56&width=56"}
                        alt={a.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{a.name}</h3>
                        <p className="text-primary text-sm truncate">{a.serviceType}</p>
                        <p className="text-xs text-gray-500 truncate">{a.location || "No location"}</p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{Number(a.rating || 0).toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">({a.reviewsCount})</span>
                      </div>
                      <span className="font-medium">₦{Number(a.hourlyRate || 0).toLocaleString()}/hr</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <Link href={`/artisan/${a.id}`}>View Profile</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Jobs */}
        <TabsContent value="active" className="space-y-4 mt-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-gray-500">No active jobs yet.</CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <ActiveContractCard
                key={job.id}
                job={job}
                onMilestoneUpdated={handleMilestoneUpdated}
              />
            ))
          )}
        </TabsContent>

        {/* Job History */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-gray-500">No job history yet.</CardContent>
            </Card>
          ) : (
            completedJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between mb-4 gap-4">
                    <div>
                      <h3 className="font-bold text-xl">{job.title}</h3>
                      {/* Artisan row */}
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={job.artisanImage || undefined} />
                          <AvatarFallback className="text-xs">
                            {String(job.artisanName || "A").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{job.artisanName || "Artisan"}</span>
                      </div>
                      <div className="text-gray-500 flex flex-wrap gap-4 text-sm mt-2">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />{job.location || "No location"}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />Updated: {formatDate(job.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>{formatStatusText(job.status)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">{formatCurrency(job.budget_min, job.budget_max)}</span>
                    <span className="text-gray-600 text-sm">{job.category || ""}</span>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/jobs/${job.jobId}`}>View Job</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}