"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  MapPin,
  TrendingUp,
  Eye,
  X,
  Check,
  CreditCard,
  FileText,
} from "lucide-react"

import Link from "next/link"

// ==== REQUEST HELPERS FROM /src/lib/api.ts ==== //
import {
  getArtisanDashboardSummary,
  getArtisanJobRequests,
  getArtisanActiveJobs,
  getArtisanJobHistory,
  acceptJobRequest,
  declineJobRequest,
  updateJobProgress,
  getAuth, 
} from "@/lib/api"

export function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // === Dashboard Data ===
  const [summary, setSummary] = useState<any>(null)
  const [jobRequests, setJobRequests] = useState<any[]>([])
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // === Modals ===
  const [declineModal, setDeclineModal] = useState({ isOpen: false, job: null })
  const [acceptModal, setAcceptModal] = useState({ isOpen: false, job: null })
  const [progressModal, setProgressModal] = useState({ isOpen: false, job: null })
  const [jobDetailsModal, setJobDetailsModal] = useState({ isOpen: false, job: null })
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", message: "" })
  const [withdrawModal, setWithdrawModal] = useState(false)

  // === Form State ===
  const [declineReason, setDeclineReason] = useState("")
  const [newProgress, setNewProgress] = useState("")
  const [progressNote, setProgressNote] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")

  // =====================================================
  // Load Artisan Dashboard
  // =====================================================
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [s, req, act, hist] = await Promise.all([
          getArtisanDashboardSummary(),
          getArtisanJobRequests(),
          getArtisanActiveJobs(),
          getArtisanJobHistory(),
        ])

        setSummary(s)
        setJobRequests(req || [])
        setActiveJobs(act || [])
        setCompletedJobs(hist || [])
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // =====================================================
  // Status Helpers
  // =====================================================
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-primary" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-primary/10 text-primary"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // =====================================================
  // Actions
  // =====================================================
  const handleDecline = (job) => setDeclineModal({ isOpen: true, job })
  const handleAccept = (job) => setAcceptModal({ isOpen: true, job })
  const handleProgress = (job) => {
    setProgressModal({ isOpen: true, job })
    setNewProgress(job.progress?.toString() || "0")
  }
  const handleJobDetails = (job) => setJobDetailsModal({ isOpen: true, job })

  const confirmDecline = async () => {
    try {
      await declineJobRequest(declineModal.job?.jobId, declineReason)
      setSuccessModal({
        isOpen: true,
        title: "Job Declined",
        message: "You have declined this job request.",
      })

      // Refresh list
      const req = await getArtisanJobRequests()
      setJobRequests(req || [])
    } catch (err) {
      console.error("Decline error:", err)
    } finally {
      setDeclineModal({ isOpen: false, job: null })
      setDeclineReason("")
    }
  }

  const confirmAccept = async () => {
    try {
      await acceptJobRequest(acceptModal.job?.jobId)

      setSuccessModal({
        isOpen: true,
        title: "Job Accepted",
        message: "You have accepted this job request.",
      })

      const [req, act] = await Promise.all([
        getArtisanJobRequests(),
        getArtisanActiveJobs(),
      ])

      setJobRequests(req || [])
      setActiveJobs(act || [])
    } catch (err) {
      console.error("Accept error:", err)
    } finally {
      setAcceptModal({ isOpen: false, job: null })
    }
  }

  const confirmUpdateProgress = async () => {
    try {
      await updateJobProgress(progressModal.job?.jobId, {
        progress: Number(newProgress),
        note: progressNote,
      })

      setSuccessModal({
        isOpen: true,
        title: "Progress Updated",
        message: "Your job progress has been updated.",
      })

      const act = await getArtisanActiveJobs()
      setActiveJobs(act || [])
    } catch (err) {
      console.error("Progress update error:", err)
    } finally {
      setProgressModal({ isOpen: false, job: null })
      setNewProgress("")
      setProgressNote("")
    }
  }

  // =====================================================
  // UI LOADING
  // =====================================================
  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard…</div>
  }

  const artisan = summary?.artisan || {}

  // Try slug first, then fall back to other likely id fields
  const auth = getAuth()
  const publicProfileId =
    artisan.slug ||
    artisan.artisanId ||
    artisan.userId ||
    auth?.user.id 

  // =====================================================
  // UI STARTS HERE (NO CHANGES TO YOUR ORIGINAL DESIGN)
  // =====================================================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* HEADER */}
      <Card className="mb-6 sm:mb-8 bg-background">
        <CardContent className="p-0">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between space-y-6 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-x-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={artisan.profileImage} />
                  <AvatarFallback>
                    {artisan.name?.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">{artisan.name}</h1>
                  <p className="text-primary text-lg">{artisan.service}</p>

                  <div className="flex flex-wrap space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{summary?.rating ?? 0}</span>
                    </div>
                    <div>{summary?.reviews} reviews</div>
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

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <p>Monthly Earnings</p>
            <p className="text-xl font-bold">
              ₦ {(summary?.monthlyEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p>Job Requests</p>
            <p className="text-xl font-bold">{jobRequests?.length ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p>Profile Views</p>
            <p className="text-xl font-bold">{summary?.profileViews ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p>Success Rate</p>
            <p className="text-xl font-bold">{summary?.successRate ?? 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* REQUESTS */}
        <TabsContent value="requests" className="space-y-4">
          {jobRequests.map((req) => (
            <Card key={req.jobId}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{req.title}</h3>
                    <p className="text-gray-600">From {req.customer.name}</p>

                    <div className="flex space-x-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{req.location}</span>
                      <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />Due {req.deadline}</span>
                    </div>
                  </div>

                  <Badge className={getUrgencyColor(req.urgency)}>
                    {req.urgency}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{req.budget}</span>
                  <span className="text-gray-500 text-sm">{req.requestDate}</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleDecline(req)}>Decline</Button>
                  <Button onClick={() => handleAccept(req)}>Accept</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ACTIVE JOBS */}
        <TabsContent value="active" className="space-y-4">
          {activeJobs.map((job) => (
            <Card key={job.jobId}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{job.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                      <p>Customer: {job.customer.name}</p>
                      <p>Location: {job.location}</p>
                      <p>Deadline: {job.deadline}</p>
                    </div>
                  </div>

                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </div>

                <div>
                  <p className="text-sm mb-1">Progress: {job.progress}%</p>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${job.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-xl font-bold">{job.budget}</span>
                </div>

                <div className="flex space-x-2 mt-3">
                  <Button variant="outline" asChild>
                    <Link href="/messages"><MessageSquare className="h-4 w-4 mr-1" />Message</Link>
                  </Button>
                  <Button onClick={() => handleProgress(job)}>Update Progress</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-4">
          {completedJobs.map((job) => (
            <Card key={job.jobId}>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{job.title}</h3>
                    <div className="grid grid-cols-2 text-sm text-gray-600">
                      <p>Customer: {job.customer.name}</p>
                      <p>Location: {job.location}</p>
                      <p>Completed: {job.completedDate}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor("completed")}>Completed</Badge>
                </div>

                {job.review && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="italic">"{job.review.text}"</p>
                  </div>
                )}

                <div className="flex">
                  <Button variant="outline" onClick={() => handleJobDetails(job)}>View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* MODALS (kept identical to your UI) */}

      {/* Decline Modal */}
      <Dialog open={declineModal.isOpen} onOpenChange={(open) => setDeclineModal({ isOpen: open, job: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><X className="h-5 w-5 text-red-500 mr-2" />Decline Job Request</DialogTitle>
            <DialogDescription>Select a reason</DialogDescription>
          </DialogHeader>

          <Select value={declineReason} onValueChange={setDeclineReason}>
            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule-conflict">Schedule conflict</SelectItem>
              <SelectItem value="budget-too-low">Budget too low</SelectItem>
              <SelectItem value="outside-expertise">Outside my expertise</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineModal({ isOpen: false, job: null })}>
              Cancel
            </Button>
            <Button className="bg-red-600" onClick={confirmDecline} disabled={!declineReason}>
              Decline Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Modal */}
      <Dialog open={acceptModal.isOpen} onOpenChange={(open) => setAcceptModal({ isOpen: open, job: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Accept Job Request</DialogTitle>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptModal({ isOpen: false, job: null })}>
              Cancel
            </Button>
            <Button className="bg-green-600" onClick={confirmAccept}>
              Accept Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={progressModal.isOpen} onOpenChange={(open) => setProgressModal({ isOpen: open, job: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Job Progress</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Progress %</Label>
              <Input type="number" max="100" min="0" value={newProgress} onChange={(e) => setNewProgress(e.target.value)} />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressModal({ isOpen: false, job: null })}>
              Cancel
            </Button>
            <Button onClick={confirmUpdateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <Dialog open={jobDetailsModal.isOpen} onOpenChange={(open) => setJobDetailsModal({ isOpen: open, job: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle><FileText className="h-5 w-5 text-primary mr-2" />Job Details</DialogTitle>
          </DialogHeader>

          {jobDetailsModal.job && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">{jobDetailsModal.job.title}</h3>
              <p>Customer: {jobDetailsModal.job.customer.name}</p>
              <p>Budget: {jobDetailsModal.job.budget}</p>
              <p>Location: {jobDetailsModal.job.location}</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setJobDetailsModal({ isOpen: false, job: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModal.isOpen} onOpenChange={(open) => setSuccessModal({ isOpen: open, title: "", message: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{successModal.title}</DialogTitle>
          </DialogHeader>
          <p>{successModal.message}</p>
          <DialogFooter>
            <Button onClick={() => setSuccessModal({ isOpen: false, title: "", message: "" })}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
