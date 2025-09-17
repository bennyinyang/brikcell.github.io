"use client"

import { useState } from "react"
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

// Mock data for demonstration
const artisanData = {
  name: "Sarah Johnson",
  service: "Hair Styling",
  rating: 4.9,
  reviews: 127,
  profileViews: 1234,
  responseRate: 95,
  completionRate: 98,
  totalEarnings: 6225000, // ₦6,225,000 instead of $12,450
  monthlyEarnings: 1170000, // ₦1,170,000 instead of $2,340
  profileImage: "/professional-hairstylist-woman.png",
  isVerified: true,
  joinDate: "2023-06-15",
}

const jobRequests = [
  {
    id: 1,
    title: "Hair Cut & Color",
    customer: "Emily Davis",
    budget: "₦42,500",
    location: "Downtown",
    requestDate: "2024-01-15",
    deadline: "2024-01-20",
    status: "pending",
    description: "Looking for a professional haircut with highlights",
    urgency: "medium",
  },
  {
    id: 2,
    title: "Wedding Hair Styling",
    customer: "Jessica Wilson",
    budget: "₦75,000",
    location: "Westside",
    requestDate: "2024-01-14",
    deadline: "2024-01-25",
    status: "pending",
    description: "Bridal hair styling for wedding day",
    urgency: "high",
  },
]

const activeJobs = [
  {
    id: 3,
    title: "Hair Treatment & Style",
    customer: "Maria Garcia",
    budget: "₦60,000",
    location: "Eastside",
    startDate: "2024-01-12",
    deadline: "2024-01-18",
    status: "in-progress",
    progress: 75,
  },
]

const completedJobs = [
  {
    id: 4,
    title: "Hair Cut & Blow Dry",
    customer: "Lisa Park",
    budget: "₦32,500",
    location: "Downtown",
    completedDate: "2024-01-10",
    rating: 5,
    review: "Amazing work! Sarah is very professional and talented.",
  },
  {
    id: 5,
    title: "Color Correction",
    customer: "Anna Smith",
    budget: "₦90,000",
    location: "Westside",
    completedDate: "2024-01-08",
    rating: 5,
    review: "Perfect color correction. Highly recommend!",
  },
]

export function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const [declineModal, setDeclineModal] = useState({ isOpen: false, jobId: null })
  const [acceptModal, setAcceptModal] = useState({ isOpen: false, jobId: null })
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [progressModal, setProgressModal] = useState({ isOpen: false, jobId: null, currentProgress: 0 })
  const [jobDetailsModal, setJobDetailsModal] = useState({ isOpen: false, job: null })
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: "", title: "" })

  const [declineReason, setDeclineReason] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [newProgress, setNewProgress] = useState("")
  const [progressNote, setProgressNote] = useState("")

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  const handleDeclineJob = (jobId) => {
    setDeclineModal({ isOpen: true, jobId })
  }

  const confirmDeclineJob = () => {
    console.log(`[v0] Declining job ${declineModal.jobId} with reason: ${declineReason}`)
    setDeclineModal({ isOpen: false, jobId: null })
    setDeclineReason("")
    setSuccessModal({
      isOpen: true,
      title: "Job Declined",
      message: "The job request has been declined and the customer has been notified.",
    })
  }

  const handleAcceptJob = (jobId) => {
    setAcceptModal({ isOpen: true, jobId })
  }

  const confirmAcceptJob = () => {
    console.log(`[v0] Accepting job ${acceptModal.jobId}`)
    setAcceptModal({ isOpen: false, jobId: null })
    setSuccessModal({
      isOpen: true,
      title: "Job Accepted!",
      message: "You've successfully accepted this job. The customer has been notified and you can now start working.",
    })
  }

  const handleWithdrawFunds = () => {
    setWithdrawModal(true)
  }

  const confirmWithdraw = () => {
    console.log(`[v0] Withdrawing ₦${withdrawAmount}`)
    setWithdrawModal(false)
    setWithdrawAmount("")
    setSuccessModal({
      isOpen: true,
      title: "Withdrawal Initiated",
      message: `Your withdrawal of ₦${withdrawAmount} has been processed and will arrive in 1-3 business days.`,
    })
  }

  const handleUpdateProgress = (jobId, currentProgress) => {
    setProgressModal({ isOpen: true, jobId, currentProgress })
    setNewProgress(currentProgress.toString())
  }

  const confirmUpdateProgress = () => {
    console.log(`[v0] Updating progress for job ${progressModal.jobId} to ${newProgress}%`)
    setProgressModal({ isOpen: false, jobId: null, currentProgress: 0 })
    setNewProgress("")
    setProgressNote("")
    setSuccessModal({
      isOpen: true,
      title: "Progress Updated",
      message: "Job progress has been updated and the customer has been notified.",
    })
  }

  const handleViewDetails = (job) => {
    setJobDetailsModal({ isOpen: true, job })
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <Card className="mb-6 sm:mb-8 overflow-hidden bg-gradient-to-br from-white to-gray-50/50 shadow-none bg-background border">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>

            <div className="relative p-6 sm:p-8 bg-background">
              <div className="flex flex-col lg:flex-row lg:justify-between space-y-6 lg:space-y-0 lg:items-end">
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-xl">
                      <AvatarImage src={artisanData.profileImage || "/placeholder.svg"} alt={artisanData.name} />
                      <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                        {artisanData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {artisanData.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 ring-4 ring-white">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="text-center sm:text-left space-y-2">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                        {artisanData.name}
                      </h1>
                      <p className="text-primary font-semibold text-lg">{artisanData.service}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-gray-900">{artisanData.rating}</span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{artisanData.reviews} reviews</span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{artisanData.profileViews.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{artisanData.completionRate}% success</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto lg:w-auto">
                  <Button
                    variant="outline"
                    asChild
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 h-11 px-6 shadow-none"
                  >
                    <Link href="/profile/setup" className="flex items-center justify-center space-x-2">
                      <span className="font-medium text-[rgba(167,59,218,1)]">Edit Profile</span>
                    </Link>
                  </Button>

                  <Button
                    className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-white hover:shadow-xl transition-all duration-300 h-11 px-6 shadow-none"
                    asChild
                  >
                    <Link
                      href={`/artisan/${artisanData.name.toLowerCase().replace(" ", "-")}`}
                      className="flex items-center justify-center space-x-2"
                    >
                      <span className="font-medium">View Public Profile</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  ₦{artisanData.monthlyEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
              <span className="text-xs sm:text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Job Requests</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{jobRequests.length}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">Pending your response</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {artisanData.profileViews.toLocaleString()}
                </p>
              </div>
              <Eye className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">This month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{artisanData.completionRate}%</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">Job completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 min-w-[400px] sm:min-w-0 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
              Overview
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
              Requests ({jobRequests.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
              Active Jobs
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Recent Job Requests */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Recent Job Requests</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("requests")}
                className="w-full sm:w-auto text-xs sm:text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors bg-transparent"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {jobRequests.slice(0, 2).map((request) => (
                  <div
                    key={request.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 hover:shadow-md transition-all duration-200 hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">{getStatusIcon(request.status)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">from {request.customer}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{request.location}</span>
                            </span>
                            <span className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="whitespace-nowrap">Due: {request.deadline}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getUrgencyColor(request.urgency)} text-xs flex-shrink-0 ml-2`}>
                        {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex flex-col space-y-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-gray-900">{request.budget}</p>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          Requested: {request.requestDate}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineJob(request.id)}
                          className="flex-1 text-xs h-9 bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors border-gray-300"
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptJob(request.id)}
                          className="flex-1 text-xs h-9 bg-primary hover:bg-primary/90 text-white shadow-sm"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-medium text-sm sm:text-base">{artisanData.responseRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium text-sm sm:text-base">{artisanData.completionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-sm sm:text-base">{artisanData.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <span className="font-medium text-sm sm:text-base">{artisanData.reviews}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Earnings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-medium text-sm sm:text-base">
                    ₦{artisanData.monthlyEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-medium text-sm sm:text-base">
                    ₦{artisanData.totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="font-medium text-green-600 text-sm sm:text-base">₦620,000</span>
                </div>
                <Button
                  onClick={handleWithdrawFunds}
                  className="w-full bg-transparent text-sm sm:text-base h-9 sm:h-10"
                  variant="outline"
                >
                  Withdraw Funds
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-3 sm:space-y-4">
          {jobRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                    <p className="text-gray-600 mb-3 text-sm sm:text-base">{request.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p>{request.customer}</p>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p>{request.location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due:</span>
                        <p>{request.deadline}</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getUrgencyColor(request.urgency)} text-xs lg:mt-0`}>
                    {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">{request.budget}</span>
                    <span className="text-gray-600 text-xs sm:text-sm">• Requested: {request.requestDate}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineJob(request.id)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 bg-transparent"
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptJob(request.id)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                    >
                      Accept Job
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-3 sm:space-y-4">
          {activeJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p>{job.customer}</p>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p>{job.location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due:</span>
                        <p>{job.deadline}</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(job.status)} text-xs lg:mt-0`}>In Progress</Badge>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">{job.budget}</span>
                    <span className="text-gray-600 text-xs sm:text-sm">• Started: {job.startDate}</span>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 bg-transparent"
                    >
                      <Link href="/messages">
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateProgress(job.id, job.progress)}
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                    >
                      Update Progress
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 sm:space-y-4">
          {completedJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p>{job.customer}</p>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p>{job.location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span>
                        <p>{job.completedDate}</p>
                      </div>
                    </div>
                    {job.review && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(job.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{job.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{job.review}"</p>
                      </div>
                    )}
                  </div>
                  <Badge className={`${getStatusColor("completed")} text-xs lg:mt-0`}>Completed</Badge>
                </div>
                <div className="flex items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">{job.budget}</span>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 bg-transparent"
                      onClick={() => handleViewDetails(job)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Decline Job Modal */}
      <Dialog open={declineModal.isOpen} onOpenChange={(open) => setDeclineModal({ isOpen: open, jobId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <span>Decline Job Request</span>
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this job request. This will help the customer understand your
              decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="decline-reason">Reason for declining</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule-conflict">Schedule conflict</SelectItem>
                  <SelectItem value="outside-expertise">Outside my expertise</SelectItem>
                  <SelectItem value="budget-too-low">Budget too low</SelectItem>
                  <SelectItem value="location-too-far">Location too far</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineModal({ isOpen: false, jobId: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeclineJob}
              disabled={!declineReason}
              className="bg-red-500 hover:bg-red-600"
            >
              Decline Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Job Modal */}
      <Dialog open={acceptModal.isOpen} onOpenChange={(open) => setAcceptModal({ isOpen: open, jobId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Accept Job Request</span>
            </DialogTitle>
            <DialogDescription>
              By accepting this job, you commit to completing it by the specified deadline. The customer will be
              notified immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Customer will be notified of acceptance</li>
              <li>• You can message the customer to discuss details</li>
              <li>• Job will appear in your "Active Jobs" tab</li>
              <li>• Payment will be processed upon completion</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptModal({ isOpen: false, jobId: null })}>
              Cancel
            </Button>
            <Button onClick={confirmAcceptJob} className="bg-green-500 hover:bg-green-600">
              Accept Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Modal */}
      <Dialog open={withdrawModal} onOpenChange={setWithdrawModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Withdraw Funds</span>
            </DialogTitle>
            <DialogDescription>Available balance: ₦620,000</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdraw-amount">Amount to withdraw</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Funds will be transferred to your registered bank account within 1-3 business days.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmWithdraw} disabled={!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0}>
              Withdraw ₦{withdrawAmount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Modal */}
      <Dialog
        open={progressModal.isOpen}
        onOpenChange={(open) => setProgressModal({ isOpen: open, jobId: null, currentProgress: 0 })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Update Job Progress</span>
            </DialogTitle>
            <DialogDescription>Current progress: {progressModal.currentProgress}%</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-progress">New progress percentage</Label>
              <Input
                id="new-progress"
                type="number"
                min="0"
                max="100"
                placeholder="Enter progress %"
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="progress-note">Progress note (optional)</Label>
              <Textarea
                id="progress-note"
                placeholder="Add a note about the progress..."
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProgressModal({ isOpen: false, jobId: null, currentProgress: 0 })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpdateProgress}
              disabled={!newProgress || Number.parseFloat(newProgress) < 0 || Number.parseFloat(newProgress) > 100}
            >
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <Dialog open={jobDetailsModal.isOpen} onOpenChange={(open) => setJobDetailsModal({ isOpen: open, job: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Job Details</span>
            </DialogTitle>
          </DialogHeader>
          {jobDetailsModal.job && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{jobDetailsModal.job.title}</h3>
                <p className="text-gray-600">Customer: {jobDetailsModal.job.customer}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Budget:</span>
                  <p>{jobDetailsModal.job.budget}</p>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <p>{jobDetailsModal.job.location}</p>
                </div>
                <div>
                  <span className="font-medium">Completed:</span>
                  <p>{jobDetailsModal.job.completedDate}</p>
                </div>
                <div>
                  <span className="font-medium">Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(jobDetailsModal.job.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span>{jobDetailsModal.job.rating}/5</span>
                  </div>
                </div>
              </div>
              {jobDetailsModal.job.review && (
                <div>
                  <span className="font-medium">Customer Review:</span>
                  <p className="text-gray-600 italic mt-1">"{jobDetailsModal.job.review}"</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setJobDetailsModal({ isOpen: false, job: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog
        open={successModal.isOpen}
        onOpenChange={(open) => setSuccessModal({ isOpen: open, message: "", title: "" })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>{successModal.title}</span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">{successModal.message}</p>
          <DialogFooter>
            <Button onClick={() => setSuccessModal({ isOpen: false, message: "", title: "" })}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
