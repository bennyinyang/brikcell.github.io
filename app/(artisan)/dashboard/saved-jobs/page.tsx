"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Repeat2,
  Send,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getSavedJobs,
  unsaveJob,
  getJobById,
  listChatRooms,
  sendMessageRequest,
  getReviewsForUser,
} from "@/lib/api"
import Header from "@/components/header"
import { SentRequestsModal } from "@/components/artisan/sent-requests-modal"

const DEFAULT_JOB_IMAGE =
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80"

function money(value: any) {
  return `₦${Number(value || 0).toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function jobBudgetLabel(job: any) {
  const min = Number(job?.budget_min || 0)
  const max = Number(job?.budget_max || 0)
  if (min > 0 && max > 0 && min !== max) return `${money(min)} – ${money(max)}`
  if (max > 0) return money(max)
  if (min > 0) return money(min)
  const budget = job?.budget || job?.budget_max || job?.hourly_rate
  if (budget) return money(budget)
  return "Budget not specified"
}

function normalizeCategory(category?: string | null) {
  if (!category) return "General"
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function statusBadge(status?: string) {
  const s = String(status || "open").toLowerCase()
  if (s === "open") return "bg-green-100 text-green-800 border-green-200"
  if (s === "in_progress") return "bg-blue-100 text-blue-800 border-blue-200"
  if (s === "completed") return "bg-gray-100 text-gray-800 border-gray-200"
  if (s === "cancelled") return "bg-red-100 text-red-800 border-red-200"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

function mapJob(raw: any): any {
  const employer = raw?.employer || raw?.Employer || {}
  const ep = employer?.EmployerProfile || employer?.employerProfile || {}
  return {
    ...raw,
    id: String(raw?.id || ""),
    title: raw?.title || "Untitled Job",
    description: raw?.description || "",
    category: raw?.category || "general",
    location: raw?.location || "No location",
    budget_min: raw?.budget_min ?? raw?.budgetMin ?? null,
    budget_max: raw?.budget_max ?? raw?.budgetMax ?? null,
    status: raw?.status || "open",
    created_at: raw?.created_at || raw?.createdAt,
    employer: {
      id: String(employer?.id || ""),
      name: employer?.name || "Employer",
      avatar_url: employer?.avatar_url || null,
      cover_image: ep?.cover_image || null,
      company_name: ep?.company_name || null,
      industry: ep?.industry || null,
      company_size: ep?.company_size || null,
      company_description: ep?.company_description || null,
      website: ep?.website || null,
      state: ep?.state || null,
      city: ep?.city || null,
      address: ep?.address || null,
      hiring_frequency: ep?.hiring_frequency || null,
    },
  }
}

export default function SavedJobsPage() {
  const router = useRouter()

  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  // Slide-in state
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [employerRating, setEmployerRating] = useState<number | null>(null)
  const [msgLoading, setMsgLoading] = useState(false)
  const [requestedEmployers, setRequestedEmployers] = useState<Set<string>>(new Set())
  const [showSentRequests, setShowSentRequests] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getSavedJobs()
        const rows = Array.isArray(data) ? data : []
        setSavedJobs(rows.filter((r: any) => r.job != null))
      } catch {
        setSavedJobs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleUnsave(jobId: string) {
    setRemoving(jobId)
    try {
      await unsaveJob(jobId)
      setSavedJobs((prev) => prev.filter((r) => r.job_id !== jobId && r.job?.id !== jobId))
      if (selectedJob?.id === jobId) setSelectedJob(null)
    } catch {}
    setRemoving(null)
  }

  async function handleViewJob(rawJob: any) {
    const base = mapJob(rawJob)
    setSelectedJob(base)
    setEmployerRating(null)

    try {
      setDetailLoading(true)
      const fresh = await getJobById(base.id)
      const freshMapped = mapJob(fresh)
      setSelectedJob({
        ...base,
        ...freshMapped,
        employer: {
          ...(base.employer as any),
          ...(freshMapped.employer as any),
        },
      })

      const employerId = String((fresh as any).employer_id || fresh.employer?.id || base.employer?.id || "")
      if (employerId) {
        getReviewsForUser(employerId)
          .then((reviews) => {
            const list = Array.isArray(reviews) ? reviews : []
            if (!list.length) { setEmployerRating(null); return }
            const avg = list.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / list.length
            setEmployerRating(avg)
          })
          .catch(() => {})
      }
    } catch {
      // keep base data visible
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleMessageEmployer(job: any) {
    const employerId = String((job as any).employer_id || job.employer?.id || "")
    if (!employerId) {
      toast.error("Employer information not available")
      return
    }
    setMsgLoading(true)
    try {
      const rooms = await listChatRooms()
      const roomList: any[] = Array.isArray(rooms) ? rooms : (rooms as any)?.data || []
      const existing = roomList.find((room: any) => {
        const parts: any[] = room.participants || room.participantLinks || room.participant_links || room.ChatParticipants || []
        return parts.some((p: any) => {
          const uid = p?.id || p?.user_id || p?.userId || p?.participantUser?.id || p?.user?.id || p?.User?.id
          return String(uid) === employerId
        })
      })
      if (existing) {
        router.push("/messages")
      } else {
        await sendMessageRequest({ recipient_id: employerId, job_id: job.id })
        setRequestedEmployers((prev) => new Set(prev).add(employerId))
        toast.success("Message request sent to the employer")
      }
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("already") || msg.includes("pending")) {
        setRequestedEmployers((prev) => new Set(prev).add(employerId))
        toast.info("You already have a pending request with this employer")
      } else {
        toast.error(msg || "Failed to send message request")
      }
    } finally {
      setMsgLoading(false)
    }
  }

  function closePanel() {
    setSelectedJob(null)
    setEmployerRating(null)
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="space-y-2 text-sm text-slate-700">
              <Link href="/dashboard/artisan" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Dashboard
              </Link>
              <Link href="/dashboard/jobs" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Browse Gigs
              </Link>
              <Link
                href="/dashboard/saved-jobs"
                className="block rounded-md bg-slate-50 px-4 py-3 font-medium text-slate-950"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                Saved Jobs
              </Link>
              <Link href="/dashboard/bookings" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                My Bookings
              </Link>
              <Link href="/dashboard/services/post" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Post Service
              </Link>
              <Link href="/dashboard/wallet" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Wallet
              </Link>
              <Link href="/dashboard/settings" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Settings
              </Link>
              <Link href="/support" className="block rounded-md px-4 py-3 hover:bg-slate-50">
                Support
              </Link>
            </nav>
          </aside>

          {/* Content */}
          <section className="w-full">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Saved Jobs
              </h1>
              <p className="mt-1 text-sm text-slate-500">Jobs you've bookmarked for later</p>
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400">
                  <Bookmark className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-950">No saved jobs yet</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Browse available jobs and tap the bookmark icon to save them here.
                </p>
                <Button size="sm" className="mt-5 bg-primary hover:bg-primary/90" asChild>
                  <Link href="/dashboard/jobs">Browse jobs</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {savedJobs.map((row) => {
                  const job = row.job ?? {}
                  const jobId = job.id ?? row.job_id
                  const employer = job.employer ?? {}
                  const employerProfile = employer.EmployerProfile ?? {}
                  const deadline = job.deadline_at
                    ? new Date(job.deadline_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                    : null

                  return (
                    <div
                      key={row.id ?? jobId}
                      className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <button
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                        onClick={() => handleUnsave(jobId)}
                        disabled={removing === jobId}
                        title="Remove from saved"
                      >
                        {removing === jobId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>

                      <div className="pr-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                            <Briefcase className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-slate-950">
                              {job.title ?? "Untitled Job"}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {employerProfile.company_name ?? employer.name ?? "Employer"}
                            </p>
                          </div>
                        </div>

                        {job.description && (
                          <p className="mt-3 line-clamp-2 text-xs text-slate-500">
                            {job.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          {job.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          )}
                          {(job.budget || job.budget_max || job.hourly_rate) && (
                            <span className="inline-flex items-center gap-1">
                              <Wallet className="h-3.5 w-3.5" />
                              {money(job.budget || job.budget_max || job.hourly_rate)}
                            </span>
                          )}
                          {deadline && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Closes {deadline}
                            </span>
                          )}
                        </div>

                        {job.skills_required && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {(Array.isArray(job.skills_required)
                              ? job.skills_required
                              : String(job.skills_required).split(",")
                            )
                              .slice(0, 4)
                              .map((s: string) => s.trim())
                              .filter(Boolean)
                              .map((s: string) => (
                                <Badge
                                  key={s}
                                  variant="secondary"
                                  className="rounded-full px-2 py-0.5 text-[10px]"
                                >
                                  {s}
                                </Badge>
                              ))}
                          </div>
                        )}

                        <div className="mt-4">
                          <Button
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/90"
                            onClick={() => handleViewJob(job)}
                          >
                            View Job
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Backdrop */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={closePanel}
        />
      )}

      {/* Slide-in job detail panel */}
      <div
        className={`fixed right-0 top-0 z-[201] flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          selectedJob ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedJob && (
          <>
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0 flex-1 pr-4">
                {detailLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                ) : (
                  <>
                    <h2 className="line-clamp-2 text-base font-semibold text-slate-950">
                      {selectedJob.title || "Job details"}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Posted {formatDate(selectedJob.created_at || selectedJob.createdAt)}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="space-y-5 p-5">
                  <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${95 - i * 8}%` }} />
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  {/* Cover image */}
                  <div className="h-44 overflow-hidden rounded-xl">
                    <img
                      src={selectedJob.employer?.cover_image || DEFAULT_JOB_IMAGE}
                      alt={selectedJob.title || "Job"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Status badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className={statusBadge(selectedJob.status)}>
                      {String(selectedJob.status || "open").replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary">{normalizeCategory(selectedJob.category)}</Badge>
                  </div>

                  {/* Stat tiles */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        <DollarSign className="h-3 w-3" /> Budget
                      </div>
                      <p className="text-sm font-semibold text-slate-950">{jobBudgetLabel(selectedJob)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        <MapPin className="h-3 w-3" /> Location
                      </div>
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {selectedJob.location || "Not specified"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        <CalendarDays className="h-3 w-3" /> Posted
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatDate(selectedJob.created_at || selectedJob.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Job description */}
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold text-slate-950">Job Description</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {selectedJob.description || "No description was provided for this job."}
                    </p>
                  </div>

                  <div className="my-6 border-t border-slate-100" />

                  {/* Employer info */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-950">About the Employer</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {String(selectedJob.employer?.name || "E").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {selectedJob.employer?.company_name || selectedJob.employer?.name || "Employer"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {employerRating !== null ? employerRating.toFixed(1) : "—"}
                              <span>rating</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {[
                        { icon: <Building2 className="h-4 w-4 text-slate-400" />, label: "Industry", value: selectedJob.employer?.industry },
                        { icon: <Users className="h-4 w-4 text-slate-400" />, label: "Company Size", value: selectedJob.employer?.company_size },
                        { icon: <Repeat2 className="h-4 w-4 text-slate-400" />, label: "Hiring Frequency", value: selectedJob.employer?.hiring_frequency },
                        {
                          icon: <MapPin className="h-4 w-4 text-slate-400" />,
                          label: "Service Area",
                          value: [selectedJob.employer?.city, selectedJob.employer?.state].filter(Boolean).join(", ") || null,
                        },
                        { icon: <MapPin className="h-4 w-4 text-slate-400" />, label: "Address", value: selectedJob.employer?.address },
                        { icon: <Globe className="h-4 w-4 text-slate-400" />, label: "Website", value: selectedJob.employer?.website, isLink: true },
                      ]
                        .filter((row) => row.value)
                        .map((row) => (
                          <div key={row.label} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{row.icon}</div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                {row.label}
                              </p>
                              {row.isLink ? (
                                <a
                                  href={String(row.value).startsWith("http") ? String(row.value) : `https://${row.value}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 truncate text-sm text-primary hover:underline"
                                >
                                  {row.value}
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              ) : (
                                <p className="text-sm text-slate-700">{row.value}</p>
                              )}
                            </div>
                          </div>
                        ))}

                      {selectedJob.employer?.company_description && (
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            About the Company
                          </p>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {selectedJob.employer.company_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 border-t border-slate-100 bg-white p-4">
              <SentRequestsModal open={showSentRequests} onClose={() => setShowSentRequests(false)} />
              {(() => {
                const empId = String((selectedJob as any).employer_id || selectedJob.employer?.id || "")
                const requested = requestedEmployers.has(empId)
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        disabled={msgLoading || requested || detailLoading}
                        onClick={() => handleMessageEmployer(selectedJob)}
                      >
                        {msgLoading ? "Please wait…" : requested ? "Request Sent" : "Message Employer"}
                      </Button>
                      <Button variant="outline" className="px-5" onClick={closePanel}>
                        Close
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setShowSentRequests(true)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Message Requests Sent
                    </Button>
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </>
  )
}
