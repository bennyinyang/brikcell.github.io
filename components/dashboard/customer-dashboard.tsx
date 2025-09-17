"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Clock, CheckCircle, AlertCircle, Star, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const activeJobs = [
  {
    id: 1,
    title: "Kitchen Plumbing Repair",
    artisan: "Mike Rodriguez",
    status: "in-progress",
    budget: "₦75,000",
    deadline: "2024-01-20",
    location: "Downtown",
    description: "Fix leaking kitchen sink and replace faucet",
  },
  {
    id: 2,
    title: "Hair Cut & Color",
    artisan: "Sarah Johnson",
    status: "scheduled",
    budget: "₦42,500",
    deadline: "2024-01-18",
    location: "Westside",
    description: "Haircut with highlights",
  },
]

const completedJobs = [
  {
    id: 3,
    title: "Custom Bookshelf",
    artisan: "David Chen",
    status: "completed",
    budget: "₦150,000",
    completedDate: "2024-01-10",
    rating: 5,
    location: "Eastside",
    hasReview: true,
  },
  {
    id: 4,
    title: "Electrical Outlet Installation",
    artisan: "Lisa Park",
    status: "completed",
    budget: "₦60,000",
    completedDate: "2024-01-05",
    rating: 4,
    location: "Downtown",
    hasReview: false,
  },
]

const recommendedArtisans = [
  {
    id: 1,
    name: "Tom Wilson",
    service: "Painting",
    rating: 4.9,
    reviews: 156,
    price: "From ₦20,000/hr",
    image: "/professional-painter.png",
  },
  {
    id: 2,
    name: "Maria Garcia",
    service: "House Cleaning",
    rating: 4.8,
    reviews: 203,
    price: "From ₦12,500/hr",
    image: "/professional-cleaner.png",
  },
  {
    id: 3,
    name: "James Kim",
    service: "Auto Repair",
    rating: 4.7,
    reviews: 89,
    price: "From ₦30,000/hr",
    image: "/auto-mechanic.png",
  },
]

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const formatStatusText = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">Welcome back, John!</h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Manage your jobs and find trusted artisans
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto min-h-[48px] text-base font-medium px-6 py-3">
          <Link href="/post-job">
            <Plus className="h-5 w-5 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 py-0 border-0"></div>
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 mb-2 leading-relaxed">Active Jobs</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                  {activeJobs.length}
                </p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 mb-2 leading-relaxed">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                  {completedJobs.length}
                </p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 mb-2 leading-relaxed">Total Spent</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">
                  ₦327,500
                </p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 mb-2 leading-relaxed">Avg Rating</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">
                  4.8
                </p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 sm:h-auto p-1 sm:p-1.5">
          <TabsTrigger value="overview" className="text-sm sm:text-base font-medium min-h-[40px] sm:min-h-[44px]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="active" className="text-sm sm:text-base font-medium min-h-[40px] sm:min-h-[44px]">
            Active Jobs
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm sm:text-base font-medium min-h-[40px] sm:min-h-[44px]">
            Job History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Active Jobs Preview */}
          <Card className="shadow-none">
            <CardHeader className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">Recent Jobs</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("active")}
                className="w-full sm:w-auto min-h-[44px] hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-sm font-medium"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                {activeJobs.slice(0, 2).map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border rounded-xl space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(job.status)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-2 leading-relaxed">with {job.artisan}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            {job.location}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            {job.deadline}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right space-x-3 sm:space-x-0 sm:space-y-2">
                      <Badge
                        className={`${getStatusColor(job.status)} px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full`}
                      >
                        {formatStatusText(job.status)}
                      </Badge>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{job.budget}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Artisans */}
          <Card className="shadow-none">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">Recommended for You</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recommendedArtisans.map((artisan) => (
                  <div key={artisan.id} className="border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <img
                        src={artisan.image || "/placeholder.svg"}
                        alt={artisan.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight truncate">
                          {artisan.name}
                        </h3>
                        <p className="text-sm sm:text-base text-primary leading-relaxed">{artisan.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium">{artisan.rating}</span>
                        <span className="text-sm text-gray-500">({artisan.reviews})</span>
                      </div>
                      <span className="text-sm sm:text-base font-medium text-gray-900">{artisan.price}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full min-h-[44px] bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-sm font-medium"
                    >
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.map((job) => (
            <Card
              className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 rounded-2xl overflow-hidden"
              key={job.id}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="relative p-5 sm:p-6 lg:p-8">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300 leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">{job.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                      <span className="flex items-center px-3 py-2 rounded-full bg-transparent">
                        <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                        {job.location}
                      </span>
                      <span className="flex items-center px-3 py-2 rounded-full bg-transparent">
                        <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                        Due: {job.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="sm:ml-6">
                    <Badge className={`${getStatusColor(job.status)} px-4 py-2 text-sm font-medium rounded-full`}>
                      {formatStatusText(job.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                      {job.budget}
                    </span>
                    <span className="text-gray-600 flex items-center text-sm sm:text-base">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                      Artisan: <span className="font-medium ml-1">{job.artisan}</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full sm:w-auto min-h-[44px] hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors bg-transparent px-6 text-sm font-medium"
                    >
                      <Link href="/messages">Message</Link>
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-medium">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {completedJobs.map((job) => (
            <Card key={job.id} className="shadow-none">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 leading-tight">{job.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        Completed: {job.completedDate}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(job.status)} px-3 py-1.5 text-sm font-medium rounded-full`}>
                    Completed
                  </Badge>
                </div>
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-lg sm:text-xl font-semibold text-gray-900">{job.budget}</span>
                    <span className="text-gray-600 text-sm sm:text-base">• Artisan: {job.artisan}</span>
                    {job.hasReview && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{job.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {job.hasReview ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto min-h-[44px] text-sm font-medium bg-transparent"
                      >
                        View Review
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto min-h-[44px] text-sm font-medium bg-transparent"
                      >
                        <Link href={`/review/${job.id}`}>Leave Review</Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] text-sm font-medium bg-transparent"
                    >
                      Hire Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
