"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  Calendar,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Search,
  Settings,
  ShieldQuestion,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  getArtisanDashboardSummary,
  getArtisanJobRequests,
  getArtisanActiveJobs,
  getArtisanJobHistory,
  normalizePaginatedResponse,
  type PaginationMeta,
} from "@/lib/api"
import { PaginationControl } from "@/components/pagination-control"

type DashboardRequestCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  requestDate: string
  urgency: string
  customer: {
    id: string
    name: string
    email: string
  }
}

type DashboardActiveJobCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  status: string
  deadline: string
  customer: {
    id: string
    name: string
    email: string
  }
}

type DashboardHistoryCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  completedDate: string
  customer: {
    id: string
    name: string
    email: string
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "10:00 AM"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "10:00 AM"

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatMoney(value?: string | number | null) {
  const num = Number(value || 0)
  return `₦${num.toLocaleString()}`
}

function formatCurrencyRange(minValue?: any, maxValue?: any) {
  const min = Number(minValue || 0)
  const max = Number(maxValue || 0)

  if (min && max) return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`
  if (max) return `₦${max.toLocaleString()}`
  if (min) return `₦${min.toLocaleString()}`
  return "Budget not set"
}

function formatCurrencyFromMilestone(raw: any) {
  const amount = Number(raw?.amount || 0)
  if (amount > 0) return `₦${amount.toLocaleString()}`

  return formatCurrencyRange(
    raw?.contract?.job?.budget_min ?? raw?.job?.budget_min,
    raw?.contract?.job?.budget_max ?? raw?.job?.budget_max
  )
}

function normalizeMilestoneStatus(status: any) {
  return String(status || "").toUpperCase()
}

function getStatusLabel(status: string) {
  const normalized = normalizeMilestoneStatus(status)

  switch (normalized) {
    case "ACTIVE":
    case "FUNDED":
      return "Scheduled"
    case "SUBMITTED":
      return "Submitted"
    case "APPROVAL_PENDING":
      return "Review"
    case "APPROVED":
      return "Approved"
    case "RELEASED":
    case "PARTIAL_RELEASED":
    case "PAID":
      return "Completed"
    case "REFUNDED":
      return "Refunded"
    case "CANCELLED":
      return "Cancelled"
    default:
      return "In progress"
  }
}

function getStatusClass(status: string) {
  const normalized = normalizeMilestoneStatus(status)

  switch (normalized) {
    case "ACTIVE":
    case "FUNDED":
    case "SUBMITTED":
    case "APPROVAL_PENDING":
    case "APPROVED":
      return "bg-slate-100 text-slate-600 border-slate-200"
    case "RELEASED":
    case "PARTIAL_RELEASED":
    case "PAID":
      return "bg-green-50 text-green-700 border-green-200"
    case "REFUNDED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-orange-50 text-orange-700 border-orange-200"
  }
}

function mapRequest(raw: any): DashboardRequestCard {
  const job = raw?.Job || raw?.job || {}
  const employer = job?.employer || raw?.employer || {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || raw?.job_id || ""),
    title: job?.title || "Untitled Job",
    location: job?.location || "No location",
    budget: formatCurrencyRange(job?.budget_min, job?.budget_max),
    requestDate: formatDate(raw?.createdAt || raw?.created_at),
    urgency: "pending",
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "Employer",
      email: employer?.email || "",
    },
  }
}

function mapActiveJob(raw: any): DashboardActiveJobCard {
  const contract = raw?.contract || raw?.Contract || {}
  const job = contract?.job || contract?.Job || raw?.job || raw?.Job || {}
  const employer =
    contract?.employer ||
    contract?.Employer ||
    job?.employer ||
    job?.Employer ||
    raw?.employer ||
    raw?.Employer ||
    {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title:
      raw?.title ||
      raw?.name ||
      job?.title ||
      contract?.title ||
      "Untitled Service",
    location:
      job?.location ||
      contract?.location ||
      raw?.location ||
      "No location",
    budget: formatCurrencyFromMilestone(raw),
    status: String(raw?.status || contract?.status || ""),
    deadline: formatDate(
      raw?.review_deadline_at ||
        raw?.approved_at ||
        raw?.submitted_at ||
        raw?.updatedAt ||
        raw?.updated_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "User",
      email: employer?.email || "",
    },
  }
}

function mapHistoryJob(raw: any): DashboardHistoryCard {
  const contract = raw?.contract || raw?.Contract || {}
  const job = contract?.job || contract?.Job || raw?.job || raw?.Job || {}
  const employer =
    contract?.employer ||
    contract?.Employer ||
    job?.employer ||
    job?.Employer ||
    raw?.employer ||
    raw?.Employer ||
    {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title:
      raw?.title ||
      raw?.name ||
      job?.title ||
      contract?.title ||
      "Untitled Service",
    location:
      job?.location ||
      contract?.location ||
      raw?.location ||
      "No location",
    budget: formatCurrencyFromMilestone(raw),
    completedDate: formatDate(
      raw?.updatedAt ||
        raw?.updated_at ||
        raw?.approved_at ||
        raw?.submitted_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "User",
      email: employer?.email || "",
    },
  }
}

function getInitials(name?: string) {
  if (!name) return "A"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function EmptyServices() {
  return (
    <div className="relative flex min-h-[310px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-4 text-center">
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
        No services found
      </h3>
      <p className="relative z-10 mt-1 text-sm text-slate-500">
        You haven&apos;t started any services yet.
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

function ServiceCard({
  item,
  type,
  onViewDetails,
}: {
  item: DashboardActiveJobCard | DashboardHistoryCard
  type: "active" | "history"
  onViewDetails: (item: DashboardActiveJobCard | DashboardHistoryCard) => void
}) {
  const isHistory = type === "history"
  const status = isHistory ? "RELEASED" : (item as DashboardActiveJobCard).status
  
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-yellow-100 text-[10px] text-yellow-700">
                {getInitials(item.customer.name)}
              </AvatarFallback>
            </Avatar>
            <span>User: {item.customer.name}</span>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
            status
          )}`}
        >
          {isHistory ? "Completed" : getStatusLabel(status)}
        </Badge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:flex sm:items-center sm:justify-end sm:gap-8">
        <span>
          Date initiated:{" "}
          <span className="text-slate-600">
            {isHistory ? (item as DashboardHistoryCard).completedDate : (item as DashboardActiveJobCard).deadline}
          </span>
        </span>
        <span>
          Time:{" "}
          <span className="text-slate-600">
            {formatTime(new Date().toISOString())}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => onViewDetails(item)}
          className="border-primary/30 text-primary hover:bg-primary/5 sm:min-w-[110px]"
        >
          View Details
        </Button>

        {!isHistory && (
          <Button className="bg-red-600 text-white hover:bg-red-700 sm:min-w-[110px]">
            Cancel service
          </Button>
        )}
      </div>
    </div>
  )
}

function JobDetailsDialog({
  open,
  onOpenChange,
  title,
  job,
  type,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  job: DashboardActiveJobCard | DashboardHistoryCard | null
  type: "active" | "history"
}) {
  if (!job) return null

  const isHistory = type === "history"
  const historyJob = job as DashboardHistoryCard
  const activeJob = job as DashboardActiveJobCard

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Job title</p>
            <p className="mt-1 font-semibold text-slate-950">
              {job.title || "Untitled job"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Budget</p>
              <p className="mt-1 font-semibold text-slate-950">
                {job.budget || "Budget not set"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-500">
                {isHistory ? "Completed" : "Deadline"}
              </p>
              <p className="mt-1 font-semibold text-slate-950">
                {isHistory
                  ? formatDate(historyJob.completedDate)
                  : formatDate(activeJob.deadline)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-100 p-4 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Job ID</span>
              <span className="max-w-[190px] truncate text-right font-medium text-slate-900">
                {job.jobId || job.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Location</span>
              <span className="max-w-[190px] text-right font-medium text-slate-900">
                {job.location || "—"}
              </span>
            </div>

            {!isHistory && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-900 capitalize">
                  {activeJob.status || "Active"}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Customer</span>
              <span className="max-w-[190px] text-right font-medium text-slate-900">
                {job.customer?.name || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Customer email</span>
              <span className="max-w-[190px] truncate text-right font-medium text-slate-900">
                {job.customer?.email || "—"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [summary, setSummary] = useState<any>(null)
  const [jobRequests, setJobRequests] = useState<DashboardRequestCard[]>([])
  const [activeJobs, setActiveJobs] = useState<DashboardActiveJobCard[]>([])
  const [completedJobs, setCompletedJobs] = useState<DashboardHistoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false)
  const [selectedActiveJob, setSelectedActiveJob] =
  useState<DashboardActiveJobCard | null>(null)

  const [selectedHistoryJob, setSelectedHistoryJob] =
    useState<DashboardHistoryCard | null>(null)

  const [requestPage, setRequestPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  const [requestPagination, setRequestPagination] = useState<PaginationMeta | null>(null)
  const [activePagination, setActivePagination] = useState<PaginationMeta | null>(null)
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta | null>(null)  

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)

        const [s, req, act, hist] = await Promise.all([
          getArtisanDashboardSummary(),
          getArtisanJobRequests(requestPage, 6),
          getArtisanActiveJobs(activePage, 6),
          getArtisanJobHistory(historyPage, 6),
        ])

        if (cancelled) return

        const reqPaginated = normalizePaginatedResponse<any>(req)
        const activePaginated = normalizePaginatedResponse<any>(act)
        const historyPaginated = normalizePaginatedResponse<any>(hist)

        setSummary(s || null)

        setJobRequests(reqPaginated.data.map(mapRequest))
        setActiveJobs(activePaginated.data.map(mapActiveJob))
        setCompletedJobs(historyPaginated.data.map(mapHistoryJob))

        setRequestPagination(reqPaginated.pagination)
        setActivePagination(activePaginated.pagination)
        setHistoryPagination(historyPaginated.pagination)
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [requestPage, activePage, historyPage])

  const artisan = summary?.artisan || {}

  const artisanName =
    artisan.name ||
    artisan.fullName ||
    artisan.businessName ||
    summary?.name ||
    "Artisan"

  const profileImage =
    artisan.profileImage ||
    artisan.profile_image ||
    summary?.profileImage ||
    ""

  const monthlyEarnings = Number(summary?.monthlyEarnings || 0)
  const completedJobsCount = Number(summary?.completedJobs || completedJobs.length || 0)
  const activeJobsCount = Number(summary?.activeJobs || activeJobs.length || 0)
  const pendingRequests = Number(summary?.pendingRequests || jobRequests.length || 0)
  const walletBalance = Number(summary?.walletBalance || 0)

  const totalJobs = activeJobsCount + completedJobsCount + pendingRequests

  const calculatedProfileFields = useMemo(() => {
    const profile = artisan || {}

    return [
      profileImage,
      profile.bio,
      profile.location,
      profile.experience,
      profile.hourlyRate || profile.hourly_rate,
      profile.service || profile.service_type,
      Array.isArray(profile.skills) && profile.skills.length > 0,
    ]
  }, [artisan, profileImage])

  const fallbackProfileProgress = Math.min(
    100,
    Math.round(
      (calculatedProfileFields.filter(Boolean).length /
        calculatedProfileFields.length) *
        100
    )
  )

  const backendProfileProgress = Number(
    summary?.profileCompletion ?? artisan?.profileCompletion
  )

  const profileProgress = Number.isFinite(backendProfileProgress)
    ? Math.min(100, Math.max(0, backendProfileProgress))
    : fallbackProfileProgress

  const missingProfileItems = [
    !profileImage && "Avatar",
    !artisan?.bio && "Bio",
    !artisan?.location && "Location",
    !artisan?.experience && "Experience",
    !(artisan?.service || artisan?.service_type) && "Service type",
    !(Array.isArray(artisan?.skills) && artisan.skills.length > 0) && "Skills",
  ].filter(Boolean) as string[]

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)_280px]">
        {/* Left Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2">
            <Link
              href="/dashboard/artisan"
              className="flex items-center gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dashboard
            </Link>

            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4" />
              Browse Jobs
            </Link>

            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Calendar className="h-4 w-4" />
              My bookings
            </Link>

            <Link
              href="/dashboard/services/post"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4" />
              Post Service
            </Link>

            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ShieldQuestion className="h-4 w-4" />
              Support
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <section>
          <div className="mb-7">
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-950 sm:text-[30px]">
              Welcome Back, {artisanName}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here is a quick overview of your activities
            </p>
          </div>

          <div className="mb-7 flex flex-wrap gap-x-10 gap-y-4 border-b border-slate-100 pb-6 text-sm font-medium text-primary">
            <button 
           
            type="button" onClick={() => setShowProfileModal(true)}>
              Manage profile
            </button>

            <button type="button" onClick={() => setShowPublicProfileModal(true)}>
              View public profile
            </button>

            <Link href="/dashboard/services/post">View my services</Link>
            <Link href="/dashboard/jobs">Top clients</Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5 grid h-10 w-full grid-cols-3 rounded-lg border bg-white p-1">
              <TabsTrigger value="active" className="text-xs">
                Active services
                <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                  {activePagination?.total ?? activeJobs.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="upcoming" className="text-xs">
                Upcoming services
                <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                  0
                </span>
              </TabsTrigger>

              <TabsTrigger value="history" className="text-xs">
                Service history
                <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
                  {historyPagination?.total ?? completedJobs.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-xl border bg-slate-50"
                    />
                  ))}
                </div>
              ) : activeJobs.length ? (
                <>
                <div className="space-y-4">
                  {activeJobs.map((item) => (
                    <ServiceCard
                      key={item.id}
                      item={item}
                      type="active"
                      onViewDetails={(job) =>
                        setSelectedActiveJob(job as DashboardActiveJobCard)
                      }
                    />
                  ))}
                </div>

                {activePagination && (
                  <PaginationControl
                    pagination={activePagination}
                    onPageChange={setActivePage}
                  />
                )}
                </>
              ) : (
                <EmptyServices />
              )}
            
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              <EmptyServices />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-xl border bg-slate-50"
                    />
                  ))}
                </div>
              ) : completedJobs.length ? (
                <>
                <div className="space-y-4">
                  {completedJobs.map((item) => (
                      <ServiceCard
                        key={item.id}
                        item={item}
                        type="history"
                        onViewDetails={(job) =>
                          setSelectedHistoryJob(job as DashboardHistoryCard)
                        }
                      />
                  ))}
                </div>
                          {historyPagination && (
                <PaginationControl
                  pagination={historyPagination}
                  onPageChange={setHistoryPage}
                />
              )}
              </>
              ) : (
                <EmptyServices />
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Right Panel */}
        <aside className="space-y-4">
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-700">Complete your profile</span>
                <span className="text-xs text-slate-700">{profileProgress}%</span>
              </div>

              <Progress value={profileProgress} className="mb-4 h-1.5" />

              <p className="mb-3 text-xs text-slate-500">
                Improve your profile by completing:
              </p>

              <div className="space-y-2">
                {(missingProfileItems.length ? missingProfileItems.slice(0, 3) : ["Profile completed"]).map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between text-xs text-slate-600"
                    >
                      <span>— {item}</span>
                      <span className="font-medium text-primary">+10%</span>
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="mt-4 flex items-center gap-2 text-xs font-medium text-primary"
              >
                View all
                <ChevronDown className="h-3 w-3" />
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <h2 className="mb-4 text-xl font-semibold text-slate-950">Earnings</h2>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Estimated earnings</span>
                  <span className="font-medium text-slate-700">
                    {formatMoney(monthlyEarnings)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
                  <span className="text-slate-500">Completed jobs</span>
                  <span className="font-medium text-slate-700">
                    {completedJobsCount}
                  </span>
                </div>

                <div>
                  <p className="mb-3 text-sm text-slate-500">Payment method</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>**** **** **** 1234</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Wallet balance</span>
                  <span className="font-medium text-slate-700">
                    {formatMoney(walletBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Jobs</span>
                  <span className="font-medium text-slate-700">
                    {totalJobs} jobs
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

        <JobDetailsDialog
        open={!!selectedActiveJob}
        onOpenChange={(open) => {
          if (!open) setSelectedActiveJob(null)
        }}
        title="Active Service Details"
        job={selectedActiveJob}
        type="active"
      />

      <JobDetailsDialog
        open={!!selectedHistoryJob}
        onOpenChange={(open) => {
          if (!open) setSelectedHistoryJob(null)
        }}
        title="Service History Details"
        job={selectedHistoryJob}
        type="history"
      />

      {/* Manage Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Manage profile</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfileModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border p-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback>{getInitials(artisanName)}</AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-semibold text-slate-950">{artisanName}</h3>
                <p className="text-sm text-slate-500">
                  {artisan?.location || "No location added"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="mb-2 text-sm font-medium text-slate-950">
                Profile completion
              </p>
              <Progress value={profileProgress} className="h-2" />
              <p className="mt-2 text-xs text-slate-500">
                Your profile is {profileProgress}% complete.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/profile/setup">Edit profile details</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public Profile Modal */}
      <Dialog open={showPublicProfileModal} onOpenChange={setShowPublicProfileModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Public profile preview</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPublicProfileModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border p-5 text-center">
              <Avatar className="mx-auto h-20 w-20">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback>{getInitials(artisanName)}</AvatarFallback>
              </Avatar>

              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {artisanName}
              </h3>
              <p className="text-sm text-primary">
                {artisan?.service_type || artisan?.primaryService || "Artisan"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {artisan?.location || "Location not added"}
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{Number(artisan?.rating || 0).toFixed(1)} rating</span>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="mb-2 text-sm font-medium text-slate-950">Bio</p>
              <p className="text-sm leading-relaxed text-slate-600">
                {artisan?.bio || "No bio has been added yet."}
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/profile/setup">Update public profile</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}