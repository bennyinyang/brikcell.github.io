"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Clock, CheckCircle, AlertCircle, Star, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { CustomerDashboardAPI } from "@/lib/api"

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [recommendedArtisans, setRecommended] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load all 3 datasets
  useEffect(() => {
    async function load() {
      try {
        const [a, h, r] = await Promise.all([
          CustomerDashboardAPI.getActiveJobs(),
          CustomerDashboardAPI.getJobHistory(),
          CustomerDashboardAPI.getRecommendedArtisans(),
        ])

        setActiveJobs(a || [])
        setCompletedJobs(h || [])
        setRecommended(r || [])
      } catch (err) {
        console.error("Customer dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatStatusText = (status: string) => {
    return status
      ?.split("-")
      ?.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      ?.join(" ")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Clock className="h-4 w-4 text-accent" />
      case "scheduled":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-accent/10 text-accent"
      case "scheduled":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">
        Loading dashboard…
      </div>
    )

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            Welcome back!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Manage your jobs and find trusted artisans
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto min-h-[48px] text-base font-medium px-6 py-3"
        >
          <Link href="/post-job">
            <Plus className="h-5 w-5 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="group relative bg-white/60 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeJobs.length}
                </p>
              </div>
              <Clock className="h-7 w-7 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative bg-white/60 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {completedJobs.length}
                </p>
              </div>
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative bg-white/60 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{completedJobs
                    .reduce((sum, j) => {
                      const n = Number(j.budget?.replace(/[^\d]/g, "")) || 0
                      return sum + n
                    }, 0)
                    .toLocaleString()}
                </p>
              </div>
              <Star className="h-7 w-7 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative bg-white/60 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {completedJobs.length
                    ? (
                        completedJobs.reduce(
                          (sum, j) => sum + (j.rating || 0),
                          0
                        ) / completedJobs.length
                      ).toFixed(1)
                    : "0"}
                </p>
              </div>
              <Star className="h-7 w-7 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* Active Jobs Preview */}
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("active")}
              >
                View All
              </Button>
            </CardHeader>

            <CardContent>
              {activeJobs.slice(0, 2).map((job) => (
                <div
                  key={job.id}
                  className="border rounded-xl p-4 space-y-3 hover:shadow-md transition"
                >
                  <div className="flex space-x-4">
                    {getStatusIcon(job.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-600">
                        with {job.artisan?.name}
                      </p>
                      <div className="text-sm text-gray-500 flex space-x-4">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {job.deadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(job.status)}>
                      {formatStatusText(job.status)}
                    </Badge>
                    <p className="font-semibold">{job.budget}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommended Artisans */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedArtisans.map((a) => (
                <div
                  key={a.id}
                  className="border rounded-xl p-4 hover:shadow transition"
                >
                  <div className="flex space-x-4">
                    <img
                      src={a.image || "/placeholder.svg"}
                      className="w-14 h-14 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{a.name}</h3>
                      <p className="text-primary text-sm">{a.service}</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{a.rating}</span>
                      <span className="text-gray-500 text-sm">
                        ({a.reviews})
                      </span>
                    </div>
                    <span className="font-medium">{a.price}</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Profile
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVE JOBS TAB */}
        <TabsContent value="active" className="space-y-4">
          {activeJobs.map((job) => (
            <Card key={job.id} className="group relative">
              <CardContent className="p-5">
                <div className="flex justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-3">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{job.description}</p>

                    <div className="text-sm text-gray-500 flex space-x-6">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {job.deadline}
                      </span>
                    </div>
                  </div>

                  <Badge className={getStatusColor(job.status)}>
                    {formatStatusText(job.status)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{job.budget}</span>
                  <span className="text-gray-600 text-sm">
                    Artisan: <b>{job.artisan?.name}</b>
                  </span>
                </div>

                <div className="flex space-x-3 mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/messages">Message</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/jobs/${job.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-4">
          {completedJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-xl">{job.title}</h3>
                    <div className="text-gray-500 flex space-x-4 text-sm">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Completed: {job.completedDate}
                      </span>
                    </div>
                  </div>

                  <Badge className={getStatusColor(job.status)}>
                    Completed
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">{job.budget}</span>
                  <span className="text-gray-600 text-sm">
                    Artisan: {job.artisan?.name}
                  </span>
                </div>

                <div className="mt-4 flex space-x-3">
                  {job.hasReview ? (
                    <Button variant="outline">View Review</Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href={`/review/${job.id}`}>Leave Review</Link>
                    </Button>
                  )}

                  <Button variant="outline">Hire Again</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
