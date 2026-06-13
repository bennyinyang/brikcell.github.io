"use client"

import Header from "@/components/header"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Search,
  MapPin,
  Briefcase,
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

import {
  getAuth,
  getJobById,
  listJobs,
  searchJobs,
  normalizePaginatedResponse,
  type JobRecord,
  type PaginationMeta,
} from "@/lib/api"
import { PaginationControl } from "@/components/pagination-control"

const serviceCategories = [
  "Plumbing",
  "Carpentry",
  "Hair Styling",
  "Electrical",
  "Painting",
  "Auto Repair",
  "House Cleaning",
  "Tech Support",
  "Landscaping",
  "Moving Services",
]

const ratingOptions = [
  { value: "all", label: "No rating preference" },
  { value: "5", label: "5 stars and up" },
  { value: "4", label: "4 stars and up" },
  { value: "3", label: "3 stars and up" },
]

const radiusOptions = ["5 km", "10 km", "20 km", "50 km"]

const JOB_IMAGE =
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
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getEmployerRating(job: JobRecord) {
  const reviews = job.employer?.receivedReviews || []
  if (!reviews.length) return null

  const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0)
  return total / reviews.length
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
    },
  }
}

export default function ArtisanJobsPage() {
  const [token, setToken] = useState<string | null>(null)

  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null)

  const [searchText, setSearchText] = useState("")
  const [category, setCategory] = useState("Plumbing")
  const [city, setCity] = useState("")
  const [stateValue, setStateValue] = useState("")
  const [rating, setRating] = useState("all")
  const [openOnly, setOpenOnly] = useState(true)
  const [sortBy, setSortBy] = useState("latest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    setToken(auth?.token || null)
  }, [])

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

    try {
      setDetailLoading(true)
      const fresh = await getJobById(job.id)
      setSelectedJob({
        ...job,
        ...fresh,
        employer: fresh.employer || job.employer,
      })
    } catch (err) {
      console.error("[ArtisanJobs] Failed to fetch job details:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchText("")
    setCategory("Plumbing")
    setCity("")
    setStateValue("")
    setRating("all")
    setOpenOnly(true)
    setSortBy("latest")
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
          <Badge variant="outline" className="rounded-sm font-normal">
            {category || "Home cleaning"}
            <button type="button" onClick={() => setCategory("")} className="ml-1">
              ×
            </button>
          </Badge>

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

        <div className="space-y-3">
          {serviceCategories.slice(0, 4).map((item) => (
            <label key={item} className="flex items-center gap-2 text-xs text-slate-700">
              <Checkbox
                checked={category === item}
                onCheckedChange={(checked) => setCategory(checked ? item : "")}
                className="h-5 w-5 rounded-[3px]"
              />
              {item}
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
                  <Card key={item} className="overflow-hidden rounded-xl border-slate-100 shadow-sm">
                    <div className="h-[110px] animate-pulse bg-slate-100" />
                    <CardContent className="p-3">
                      <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                      <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
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
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => {
                  const categoryLabel = normalizeCategory(job.category)
                  const budget = jobBudgetLabel(job)

                  return (
                    <Card
                      key={job.id}
                      className="overflow-hidden rounded-xl border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="h-[105px] overflow-hidden sm:h-[110px]">
                        <img
                          src={JOB_IMAGE}
                          alt={job.title || "Job image"}
                          className="h-full w-full object-cover grayscale"
                        />
                      </div>

                      <CardContent className="p-3">
                        <h3 className="line-clamp-1 text-[15px] font-semibold text-slate-950">
                          {shortText(job.title, "Job request")}
                        </h3>

                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-slate-700">
                            {job.employer?.name || "Employer"}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {job.location || "Location not specified"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className="mt-3 rounded-md border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-normal text-slate-700"
                        >
                          {categoryLabel}
                        </Badge>

                        <div className="mt-5 flex items-center justify-between">
                          <p className="text-base font-semibold tracking-tight text-slate-900">
                            {budget}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleViewJob(job)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Job details
                          </button>
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

      <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {detailLoading ? "Loading job..." : selectedJob?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-5">
              <div className="h-44 overflow-hidden rounded-xl">
                <img
                  src={JOB_IMAGE}
                  alt={selectedJob.title || "Job image"}
                  className="h-full w-full object-cover grayscale"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusBadge(selectedJob.status)}>
                  {String(selectedJob.status || "open").replace("_", " ")}
                </Badge>
                <Badge variant="secondary">{normalizeCategory(selectedJob.category)}</Badge>
                <Badge variant="outline">
                  {formatDate(selectedJob.created_at || selectedJob.createdAt)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <p className="mb-1 text-xs text-slate-500">Budget</p>
                  <p className="font-semibold text-slate-950">{jobBudgetLabel(selectedJob)}</p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="mb-1 text-xs text-slate-500">Location</p>
                  <p className="truncate font-semibold text-slate-950">
                    {selectedJob.location || "Not specified"}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="mb-1 text-xs text-slate-500">Employer</p>
                  <p className="truncate font-semibold text-slate-950">
                    {selectedJob.employer?.name || "Employer"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-950">Job Description</h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selectedJob.description || "No description was provided for this job."}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700">
                  {getEmployerRating(selectedJob)
                    ? `${getEmployerRating(selectedJob)?.toFixed(1)} employer rating`
                    : "No employer rating yet"}
                </span>
              </div>

              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={`/messages?employerId=${selectedJob.employer_id}`}>
                    Message Employer
                  </Link>
                </Button>

                <Button variant="outline" className="flex-1" onClick={() => setSelectedJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}