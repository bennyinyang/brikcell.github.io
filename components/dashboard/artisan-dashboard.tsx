"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  MapPin,
  Eye,
  FileText,
} from "lucide-react"
import Link from "next/link"
import {
  getArtisanDashboardSummary,
  getArtisanJobRequests,
  getArtisanActiveJobs,
  getArtisanJobHistory,
  getAuth,
} from "@/lib/api"
import { WithdrawalCard } from "@/components/withdrawal-card"

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
  return d.toLocaleDateString()
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
  const contract = raw?.contract || {}
  const job = contract?.job || raw?.job || {}
  const employer = contract?.employer || raw?.employer || {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title: raw?.title || job?.title || "Untitled Job",
    location: job?.location || "No location",
    budget: formatCurrencyFromMilestone(raw),
    status: String(raw?.status || ""),
    deadline: formatDate(
      raw?.review_deadline_at ||
        raw?.approved_at ||
        raw?.submitted_at ||
        raw?.updatedAt ||
        raw?.updated_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "Employer",
      email: employer?.email || "",
    },
  }
}

function mapHistoryJob(raw: any): DashboardHistoryCard {
  const contract = raw?.contract || {}
  const job = contract?.job || raw?.job || {}
  const employer = contract?.employer || raw?.employer || {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title: raw?.title || job?.title || "Untitled Job",
    location: job?.location || "No location",
    budget: formatCurrencyFromMilestone(raw),
    completedDate: formatDate(
      raw?.updatedAt ||
        raw?.updated_at ||
        raw?.approved_at ||
        raw?.submitted_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "Employer",
      email: employer?.email || "",
    },
  }
}

export function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [summary, setSummary] = useState<any>(null)
  const [jobRequests, setJobRequests] = useState<DashboardRequestCard[]>([])
  const [activeJobs, setActiveJobs] = useState<DashboardActiveJobCard[]>([])
  const [completedJobs, setCompletedJobs] = useState<DashboardHistoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const walletBalance = Number(summary?.walletBalance || 0)

  const auth = getAuth()
  const token = auth?.token

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        const [s, req, act, hist] = await Promise.all([
          getArtisanDashboardSummary(token),
          getArtisanJobRequests(token),
          getArtisanActiveJobs(token),
          getArtisanJobHistory(token),
        ])

        if (cancelled) return

        setSummary(s || null)
        setJobRequests(Array.isArray(req) ? req.map(mapRequest) : [])
        setActiveJobs(Array.isArray(act) ? act.map(mapActiveJob) : [])
        setCompletedJobs(Array.isArray(hist) ? hist.map(mapHistoryJob) : [])
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
  }, [token])

  const artisan = summary?.artisan || {}

  const publicProfileId =
    artisan.slug ||
    artisan.artisanId ||
    artisan.userId ||
    auth?.user?.id

  const monthlyEarnings = Number(summary?.monthlyEarnings || 0)
  const pendingRequests = Number(summary?.pendingRequests || 0)
  const profileViews = Number(summary?.profileViews || 0)
  const successRate = Number(summary?.successRate || 0)

  const activeJobsCount = Number(summary?.activeJobs || 0)
  const completedJobsCount = Number(summary?.completedJobs || 0)

  const overviewActiveJobs = activeJobs.slice(0, 3)
  const overviewRequests = jobRequests.slice(0, 3)

  const getStatusColor = (status: string) => {
    const normalized = normalizeMilestoneStatus(status)

    switch (normalized) {
      case "ACTIVE":
      case "FUNDED":
      case "SUBMITTED":
      case "APPROVAL_PENDING":
      case "APPROVED":
        return "bg-primary/10 text-primary"
      case "RELEASED":
      case "PARTIAL_RELEASED":
      case "PAID":
        return "bg-green-100 text-green-800"
      case "REFUNDED":
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    const normalized = normalizeMilestoneStatus(status)

    switch (normalized) {
      case "ACTIVE":
        return "Active"
      case "FUNDED":
        return "Funded"
      case "SUBMITTED":
        return "Submitted"
      case "APPROVAL_PENDING":
        return "Awaiting Approval"
      case "APPROVED":
        return "Approved"
      case "RELEASED":
        return "Released"
      case "PARTIAL_RELEASED":
        return "Partially Released"
      case "PAID":
        return "Paid"
      case "REFUNDED":
        return "Refunded"
      case "CANCELLED":
        return "Cancelled"
      default:
        return status || "Unknown"
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard…</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <Card className="mb-6 sm:mb-8 bg-background">
        <CardContent className="p-0">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between space-y-6 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={artisan.profileImage || undefined} />
                  <AvatarFallback>
                    {String(artisan.name || "A")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">{artisan.name || "Artisan"}</h1>
                  <p className="text-primary text-lg">{artisan.service || "Service Provider"}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{Number(artisan.rating || 0).toFixed(1)}</span>
                    </div>
                    <div>{Number(artisan.reviews || 0)} reviews</div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{artisan.location || "No location"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/profile/setup">Edit Profile</Link>
                </Button>

                {publicProfileId && (
                  <Button asChild>
                    <Link href={`/artisan/${publicProfileId}`}>View Public Profile</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold">{activeJobsCount}</p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingRequests}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Jobs</p>
              <p className="text-2xl font-bold">{completedJobsCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
            <Eye className="h-8 w-8 text-accent" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Wallet Balance</p>
            <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </CardContent>
      </Card>

      <WithdrawalCard
        balance={walletBalance}
        title="Withdraw Earnings"
        onSuccess={async () => {
          const refreshed = await getArtisanDashboardSummary(token)
          setSummary(refreshed || null)
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Earnings</span>
                  <span className="font-semibold">₦{monthlyEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profile Views</span>
                  <span className="font-semibold">{profileViews}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Requests</span>
                  <span className="font-semibold">{pendingRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs</span>
                  <span className="font-semibold">{activeJobsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Jobs</span>
                  <span className="font-semibold">{completedJobsCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {overviewRequests.length === 0 ? (
                  <div className="text-sm text-gray-500">No pending requests right now.</div>
                ) : (
                  overviewRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-3">
                      <h3 className="font-medium">{req.title}</h3>
                      <p className="text-sm text-gray-600">{req.customer.name}</p>
                      <div className="flex justify-between mt-2 text-sm">
                        <span>{req.location}</span>
                        <span className="font-medium">{req.budget}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Active Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overviewActiveJobs.length === 0 ? (
                <div className="text-sm text-gray-500">No active jobs yet.</div>
              ) : (
                overviewActiveJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.customer.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                    </div>
                    <Badge className={getStatusColor(job.status)}>{getStatusText(job.status)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {jobRequests.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-gray-500">
                No pending job requests.
              </CardContent>
            </Card>
          ) : (
            jobRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{req.title}</h3>
                      <p className="text-gray-600">From {req.customer.name}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {req.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Requested {req.requestDate}
                        </span>
                      </div>
                    </div>

                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{req.budget}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                      <Link href="/messages">Message</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/jobs/${req.jobId}`}>View Job</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-gray-500">
                No active jobs yet.
              </CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                        <p>Customer: {job.customer.name}</p>
                        <p>Location: {job.location}</p>
                        <p>Updated: {job.deadline}</p>
                      </div>
                    </div>

                    <Badge className={getStatusColor(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xl font-bold">{job.budget}</span>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" asChild>
                      <Link href="/messages">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/jobs/${job.jobId}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-gray-500">
                No job history yet.
              </CardContent>
            </Card>
          ) : (
            completedJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 text-sm text-gray-600 gap-2 mt-2">
                        <p>Customer: {job.customer.name}</p>
                        <p>Location: {job.location}</p>
                        <p>Updated: {job.completedDate}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">History</Badge>
                  </div>

                  <div className="flex">
                    <Button variant="outline" asChild>
                      <Link href={`/jobs/${job.jobId}`}>
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
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