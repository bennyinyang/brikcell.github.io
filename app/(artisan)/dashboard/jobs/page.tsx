"use client"

import Header from "@/components/header"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  Clock,
  Wallet,
  RefreshCcw,
  Eye,
  User,
  Star,
  ArrowLeft,
  ChevronDown,
  SlidersHorizontal,
  X,
  Building2,
  Globe,
  Users,
  Repeat2,
  CalendarDays,
  DollarSign,
  ExternalLink,
  Send,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useRouter } from "next/navigation"
import {
  getAuth,
  getJobById,
  listJobs,
  listChatRooms,
  searchJobs,
  sendMessageRequest,
  getReviewsForUser,
  normalizePaginatedResponse,
  saveJob,
  unsaveJob,
  getSavedJobs,
  type JobRecord,
  type PaginationMeta,
} from "@/lib/api"
import { PaginationControl } from "@/components/pagination-control"
import { SentRequestsModal } from "@/components/artisan/sent-requests-modal"

const serviceCategories = [
  // Physical / Local
  "plumbing",
  "carpentry",
  "electrical",
  "painting",
  "cleaning",
  "hairstyling",
  "autorepair",
  "techsupport",
  "landscaping",
  "moving",
  "hvac",
  "roofing",
  "flooring",
  "pestcontrol",
  "interiordesign",
  "masonry",
  "poolmaintenance",
  "appliancerepair",
  "welding",
  "securitycctv",
  "photography",
  "catering",
  "personaltraining",
  "childcare",
  "elderlycare",
  "tailoring",
  "laundry",
  "windowcleaning",
  "furnitureassembly",
  "homeinspection",
  "tiling",
  // Digital / Remote
  "webdevelopment",
  "mobiledev",
  "graphicdesign",
  "logodesign",
  "videoediting",
  "socialmedia",
  "contentwriting",
  "seomarketing",
  "virtualassistant",
  "bookkeeping",
  "translation",
  "tutoring",
  "musicproduction",
  "animation",
  "uiuxdesign",
  "cybersecurity",
  "qatesting",
  "voiceover",
]

const SERVICE_LABEL: Record<string, string> = {
  general: "Home Service",
  plumbing: "Plumbing",
  carpentry: "Carpentry",
  electrical: "Electrical",
  painting: "Painting",
  cleaning: "House Cleaning",
  hairstyling: "Hair Styling",
  autorepair: "Auto Repair",
  techsupport: "Tech Support",
  landscaping: "Landscaping",
  moving: "Moving Services",
  hvac: "HVAC (Heating & Cooling)",
  roofing: "Roofing",
  flooring: "Flooring",
  pestcontrol: "Pest Control",
  interiordesign: "Interior Design",
  masonry: "Masonry & Concrete",
  poolmaintenance: "Pool Maintenance",
  appliancerepair: "Appliance Repair",
  welding: "Welding & Fabrication",
  securitycctv: "Security & CCTV",
  photography: "Photography",
  catering: "Catering & Cooking",
  personaltraining: "Personal Training",
  childcare: "Childcare & Babysitting",
  elderlycare: "Elderly Care",
  tailoring: "Tailoring & Alterations",
  laundry: "Laundry & Dry Cleaning",
  windowcleaning: "Window Cleaning",
  furnitureassembly: "Furniture Assembly",
  homeinspection: "Home Inspection",
  tiling: "Tiling",
  webdevelopment: "Web Development",
  mobiledev: "Mobile App Development",
  graphicdesign: "Graphic Design",
  logodesign: "Logo & Brand Design",
  videoediting: "Video Editing",
  socialmedia: "Social Media Management",
  contentwriting: "Content Writing & Copywriting",
  seomarketing: "SEO & Digital Marketing",
  virtualassistant: "Virtual Assistant",
  bookkeeping: "Bookkeeping & Accounting",
  translation: "Translation & Interpretation",
  tutoring: "Tutoring & Academic Help",
  musicproduction: "Music Production",
  animation: "Animation & Motion Graphics",
  uiuxdesign: "UI/UX Design",
  cybersecurity: "Cybersecurity",
  qatesting: "Software QA & Testing",
  voiceover: "Voice Over",
}

const ratingOptions = [
  { value: "all", label: "No rating preference" },
  { value: "5", label: "5 stars and up" },
  { value: "4", label: "4 stars and up" },
  { value: "3", label: "3 stars and up" },
]

const radiusOptions = ["5 km", "10 km", "20 km", "50 km"]

const DEFAULT_JOB_IMAGE =
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80"

function money(value: string | number | null | undefined) {
  const num = Number(value || 0)
  return `₦${num.toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return "Recently posted"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently posted"

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function normalizeCategory(category?: string | null) {
  if (!category) return "General"
  return SERVICE_LABEL[category] ?? category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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

function jobBudgetLabel(job: JobRecord) {
  const min = Number(job.budget_min || 0)
  const max = Number(job.budget_max || 0)

  if (min > 0 && max > 0 && min !== max) return `${money(min)} - ${money(max)}`
  if (max > 0) return money(max)
  if (min > 0) return money(min)

  return "Budget not specified"
}

function shortText(value?: string | null, fallback = "Untitled job") {
  const text = String(value || fallback)
  return text.length > 34 ? `${text.slice(0, 34)}...` : text
}

function mapJobForCard(raw: any) {
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

function ArtisanJobsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null)

  const [searchText, setSearchText] = useState(() => searchParams.get("q") ?? "")
  const [category, setCategory] = useState("")
  const [city, setCity] = useState("")
  const [stateValue, setStateValue] = useState("")
  const [rating, setRating] = useState("all")
  const [openOnly, setOpenOnly] = useState(true)
  const [sortBy, setSortBy] = useState("latest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)
  const [requestedEmployers, setRequestedEmployers] = useState<Set<string>>(new Set())
  const [employerRating, setEmployerRating] = useState<number | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [showSentRequests, setShowSentRequests] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    setToken(auth?.token || null)
  }, [])

  useEffect(() => {
    getSavedJobs()
      .then((rows: any[]) => {
        const ids = new Set<string>(rows.map((r: any) => r.job_id ?? r.job?.id).filter(Boolean))
        setSavedJobIds(ids)
      })
      .catch(() => {})
  }, [])

  async function handleToggleSaveJob(jobId: string) {
    const isSaved = savedJobIds.has(jobId)
    setSavingJobId(jobId)
    setSavedJobIds((prev) => {
      const next = new Set(prev)
      isSaved ? next.delete(jobId) : next.add(jobId)
      return next
    })
    try {
      if (isSaved) {
        await unsaveJob(jobId)
        toast.success("Job removed from saved")
      } else {
        await saveJob(jobId)
        toast.success("Job Saved")
      }
    } catch {
      setSavedJobIds((prev) => {
        const next = new Set(prev)
        isSaved ? next.add(jobId) : next.delete(jobId)
        return next
      })
      toast.error("Could not save job")
    } finally {
      setSavingJobId(null)
    }
  }

  const activeLocation = useMemo(() => {
    const combined = [city.trim(), stateValue.trim()].filter(Boolean).join(", ")
    return combined || undefined
  }, [city, stateValue])

  const loadJobs = async () => {
    setLoading(true)

    try {
      const data = await searchJobs({
        page,
        limit: 12,
        type: category || undefined,
        location: activeLocation,
        rating: rating !== "all" ? rating : undefined,
        available: openOnly ? true : undefined,
      })

      const paginated = normalizePaginatedResponse<any>(data)

      setJobs(paginated.data.map(mapJobForCard) as JobRecord[])
      setPagination(paginated.pagination)
    } catch (err) {
      console.error("[ArtisanJobs] Failed to load jobs:", err)

      try {
        const fallback = await listJobs(page, 12)
        const paginatedFallback = normalizePaginatedResponse<any>(fallback)

        setJobs(paginatedFallback.data.map(mapJobForCard) as JobRecord[])
        setPagination(paginatedFallback.pagination)
      } catch {
        toast.error("Could not load jobs right now")
        setJobs([])
        setPagination(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, activeLocation, rating, openOnly])

  useEffect(() => {
    setPage(1)
  }, [category, activeLocation, rating, openOnly])

  const filteredJobs = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    let result = !q
      ? jobs
      : jobs.filter((job) => {
          const title = String(job.title || "").toLowerCase()
          const description = String(job.description || "").toLowerCase()
          const categoryText = String(job.category || "").toLowerCase()
          const employer = String(job.employer?.name || "").toLowerCase()

          return (
            title.includes(q) ||
            description.includes(q) ||
            categoryText.includes(q) ||
            employer.includes(q)
          )
        })

    result = [...result].sort((a, b) => {
      if (sortBy === "budget-high") {
        return Number(b.budget_max || b.budget_min || 0) - Number(a.budget_max || a.budget_min || 0)
      }

      if (sortBy === "budget-low") {
        return Number(a.budget_max || a.budget_min || 0) - Number(b.budget_max || b.budget_min || 0)
      }

      const aDate = new Date(a.created_at || a.createdAt || "").getTime()
      const bDate = new Date(b.created_at || b.createdAt || "").getTime()
      return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate)
    })

    return result
  }, [jobs, searchText, sortBy])

  const handleViewJob = async (job: JobRecord) => {
    setSelectedJob(job)
    setEmployerRating(null)

    try {
      setDetailLoading(true)
      const fresh = await getJobById(job.id)
      const freshMapped = mapJobForCard(fresh)
      setSelectedJob({
        ...job,
        ...freshMapped,
        employer: {
          ...(job.employer as any),
          ...(freshMapped.employer as any),
        },
      })

      const employerId = String((fresh as any).employer_id || fresh.employer?.id || job.employer?.id || "")
      if (employerId) {
        getReviewsForUser(employerId)
          .then((reviews) => {
            const list = Array.isArray(reviews) ? reviews : []
            if (!list.length) { setEmployerRating(null); return }
            const avg = list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / list.length
            setEmployerRating(avg)
          })
          .catch(() => {})
      }
    } catch (err) {
      console.error("[ArtisanJobs] Failed to fetch job details:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchText("")
    setCategory("")
    setCity("")
    setStateValue("")
    setRating("all")
    setOpenOnly(true)
    setSortBy("latest")
  }

  const handleMessageEmployer = async (job: JobRecord) => {
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

  const FilterPanel = () => (
    <aside className="space-y-7">
      <div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset filter
        </button>

        <div className="mt-3 flex flex-wrap gap-2">
          {category && (
            <Badge variant="outline" className="rounded-sm font-normal">
              {SERVICE_LABEL[category] ?? category}
              <button type="button" onClick={() => setCategory("")} className="ml-1">
                ×
              </button>
            </Badge>
          )}

          {activeLocation && (
            <Badge variant="outline" className="rounded-sm font-normal">
              {activeLocation}
              <button
                type="button"
                onClick={() => {
                  setCity("")
                  setStateValue("")
                }}
                className="ml-1"
              >
                ×
              </button>
            </Badge>
          )}

          {openOnly && (
            <Badge variant="outline" className="rounded-sm font-normal">
              Open jobs
              <button type="button" onClick={() => setOpenOnly(false)} className="ml-1">
                ×
              </button>
            </Badge>
          )}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-medium text-slate-500">Service type</p>

        <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
          {serviceCategories.map((item) => (
            <label key={item} className="flex items-center gap-2 text-xs text-slate-700">
              <Checkbox
                checked={category === item}
                onCheckedChange={(checked) => setCategory(checked ? item : "")}
                className="h-5 w-5 rounded-[3px]"
              />
              {SERVICE_LABEL[item] ?? item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-medium text-slate-500">Location</p>

        <label className="mb-4 flex items-start gap-2 text-xs text-slate-700">
          <Checkbox className="mt-0.5 h-4 w-4 rounded-[3px]" />
          <span>
            Auto detection
            <span className="block text-[10px] text-slate-500">Requires live location</span>
          </span>
        </label>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1.5 text-xs text-slate-500">City</p>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Insert city"
              className="h-9 rounded-md text-xs"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-slate-500">State</p>
            <Input
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
              placeholder="Input state"
              className="h-9 rounded-md text-xs"
            />
          </div>
        </div>

        <p className="mb-3 text-xs text-slate-500">Within</p>
        <div className="grid grid-cols-3 gap-2">
          {radiusOptions.map((item) => (
            <label key={item} className="flex items-center gap-1.5 text-xs text-slate-700">
              <Checkbox className="h-4 w-4 rounded-[3px]" />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-medium text-slate-500">Rating</p>

        <div className="space-y-3">
          {ratingOptions.map((item) => (
            <label key={item.value} className="flex items-center gap-2 text-xs text-slate-700">
              <Checkbox
                checked={rating === item.value}
                onCheckedChange={(checked) => setRating(checked ? item.value : "all")}
                className="h-5 w-5 rounded-[3px]"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link
            href="/dashboard/artisan"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-950 sm:text-[30px]">
            Browse Jobs
          </h1>
        </div>

        <Separator className="mb-4" />

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <FilterPanel />
          </div>

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:max-w-[330px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search Jobs"
                  className="h-10 rounded-md pl-10 text-sm"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="hidden h-10 w-[140px] rounded-md sm:flex">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Sort by latest</SelectItem>
                  <SelectItem value="budget-high">Budget high</SelectItem>
                  <SelectItem value="budget-low">Budget low</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Button variant="ghost" size="sm" className="gap-2" type="button">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort by
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Card key={item} className="overflow-hidden rounded-xl border-slate-100 bg-white shadow-sm">
                    <div className="h-[110px] animate-pulse bg-slate-100" />
                    <CardContent className="p-3">
                      <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="mt-3 space-y-1.5">
                        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="mt-3 h-5 w-20 animate-pulse rounded-md bg-slate-100" />
                      <div className="mt-5 flex items-center justify-between">
                        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="rounded-xl border-slate-100 py-12 text-center shadow-sm">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-950">No jobs found</h3>
                  <p className="mb-4 mt-1 text-sm text-slate-600">
                    Try changing your filters or searching another service area.
                  </p>
                  <Button onClick={resetFilters}>Reset Search</Button>
                </CardContent>
              </Card>
            ) : (
              <>
              <p className="mb-3 text-xs text-slate-500">
                {pagination && pagination.total > 0 ? `${pagination.total} job${pagination.total !== 1 ? "s" : ""} found` : ""}
                {pagination && pagination.totalPages > 1 ? ` · page ${pagination.page} of ${pagination.totalPages}` : ""}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => {
                  const categoryLabel = normalizeCategory(job.category)
                  const budget = jobBudgetLabel(job)

                  return (
                    <Card
                      key={job.id}
                      className="overflow-hidden rounded-xl border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="h-[92px] overflow-hidden sm:h-[96px]">
                        <img
                          src={(job.employer as any)?.cover_image || DEFAULT_JOB_IMAGE}
                          alt={job.title || "Job image"}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <CardContent className="p-3">
                        <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">
                          {shortText(job.title, "Job request")}
                        </h3>

                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs font-medium text-slate-700">
                            {job.employer?.name || "Employer"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {job.location || "Location not specified"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className="mt-2 rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-normal text-slate-700"
                        >
                          {categoryLabel}
                        </Badge>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-semibold tracking-tight text-slate-900">
                            {budget}
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={savingJobId === job.id}
                              onClick={() => handleToggleSaveJob(job.id)}
                              className={`transition ${savedJobIds.has(job.id) ? "text-primary" : "text-slate-400 hover:text-primary"}`}
                              title={savedJobIds.has(job.id) ? "Unsave job" : "Save job"}
                            >
                              <Bookmark
                                className="h-4 w-4"
                                fill={savedJobIds.has(job.id) ? "currentColor" : "none"}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleViewJob(job)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Job details
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {pagination && filteredJobs.length > 0 && (
                <PaginationControl
                  pagination={pagination}
                  onPageChange={setPage}
                />
              )}
              </>
            )}
          </section>
        </div>
      </main>

      <Dialog open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Filter Jobs</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <FilterPanel />

          <Button className="w-full" onClick={() => setShowMobileFilters(false)}>
            Apply Filters
          </Button>
        </DialogContent>
      </Dialog>

      {/* Backdrop */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => { setSelectedJob(null); setEmployerRating(null) }}
        />
      )}

      {/* Slide-in job detail panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
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
                      Posted {formatDate(selectedJob.created_at || (selectedJob as any).createdAt)}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedJob(null); setEmployerRating(null) }}
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
                      src={(selectedJob.employer as any)?.cover_image || DEFAULT_JOB_IMAGE}
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
                        {formatDate(selectedJob.created_at || (selectedJob as any).createdAt)}
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

                  {/* Divider */}
                  <div className="my-6 border-t border-slate-100" />

                  {/* Employer info section */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-950">About the Employer</h3>

                    <div className="space-y-4">
                      {/* Employer name + rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {String(selectedJob.employer?.name || "E").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {(selectedJob.employer as any)?.company_name || selectedJob.employer?.name || "Employer"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {employerRating !== null ? employerRating.toFixed(1) : "—"}
                              <span>rating</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company detail rows */}
                      {[
                        {
                          icon: <Building2 className="h-4 w-4 text-slate-400" />,
                          label: "Industry",
                          value: (selectedJob.employer as any)?.industry,
                        },
                        {
                          icon: <Users className="h-4 w-4 text-slate-400" />,
                          label: "Company Size",
                          value: (selectedJob.employer as any)?.company_size,
                        },
                        {
                          icon: <Repeat2 className="h-4 w-4 text-slate-400" />,
                          label: "Hiring Frequency",
                          value: (selectedJob.employer as any)?.hiring_frequency,
                        },
                        {
                          icon: <MapPin className="h-4 w-4 text-slate-400" />,
                          label: "Service Area",
                          value: [
                            (selectedJob.employer as any)?.city,
                            (selectedJob.employer as any)?.state,
                          ].filter(Boolean).join(", ") || null,
                        },
                        {
                          icon: <MapPin className="h-4 w-4 text-slate-400" />,
                          label: "Address",
                          value: (selectedJob.employer as any)?.address,
                        },
                        {
                          icon: <Globe className="h-4 w-4 text-slate-400" />,
                          label: "Website",
                          value: (selectedJob.employer as any)?.website,
                          isLink: true,
                        },
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
                                  href={
                                    String(row.value).startsWith("http")
                                      ? String(row.value)
                                      : `https://${row.value}`
                                  }
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

                      {/* Company description */}
                      {(selectedJob.employer as any)?.company_description && (
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            About the Company
                          </p>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {(selectedJob.employer as any).company_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer actions */}
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
                      <Button
                        variant="outline"
                        className="px-5"
                        onClick={() => { setSelectedJob(null); setEmployerRating(null) }}
                      >
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

export default function ArtisanJobsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <div className="mb-5 h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mb-5 h-8 w-40 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl border border-slate-100 bg-white" />
          ))}
        </div>
      </div>
    }>
      <ArtisanJobsInner />
    </Suspense>
  )
}