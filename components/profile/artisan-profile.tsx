"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  MessageSquare,
  Heart,
  Share2,
  CheckCircle,
  Calendar,
  Award,
} from "lucide-react"

interface ArtisanProfileProps {
  artisanId: string
}

// Mock data - in real app this would come from API
const artisanData = {
  id: "sarah-johnson",
  name: "Sarah Johnson",
  primaryService: "Hair Styling",
  services: ["Hair Styling", "Hair Coloring", "Hair Treatment"],
  bio: "Professional hair stylist with over 8 years of experience. Specializing in modern cuts, color correction, and special occasion styling. I'm passionate about helping clients look and feel their best.",
  rating: 4.9,
  reviews: 127,
  completedJobs: 156,
  responseTime: "Within 2 hours",
  location: "Downtown Area",
  serviceRadius: "25 miles",
  hourlyRate: 45,
  profileImage: "/professional-hairstylist-woman.png",
  isVerified: true,
  joinDate: "2023-06-15",
  certifications: ["Licensed Professional", "Insured", "Background Checked"],
  portfolioImages: ["/portfolio-hair-1.jpg", "/portfolio-hair-2.jpg", "/portfolio-hair-3.jpg", "/portfolio-hair-4.jpg"],
  availability: {
    monday: { available: true, hours: "9:00 AM - 6:00 PM" },
    tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
    wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
    thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
    friday: { available: true, hours: "9:00 AM - 6:00 PM" },
    saturday: { available: true, hours: "10:00 AM - 4:00 PM" },
    sunday: { available: false, hours: "Closed" },
  },
}

const reviews = [
  {
    id: 1,
    customer: "Emily Davis",
    rating: 5,
    date: "2024-01-10",
    comment:
      "Sarah did an amazing job with my hair! The cut and color turned out exactly how I wanted. Very professional and friendly.",
    service: "Hair Cut & Color",
  },
  {
    id: 2,
    customer: "Jessica Wilson",
    rating: 5,
    date: "2024-01-08",
    comment: "Perfect bridal styling! Sarah made me feel so beautiful on my wedding day. Highly recommend!",
    service: "Wedding Hair Styling",
  },
  {
    id: 3,
    customer: "Maria Garcia",
    rating: 4,
    date: "2024-01-05",
    comment: "Great experience overall. Sarah is skilled and listens to what you want. Will definitely book again.",
    service: "Hair Treatment",
  },
]

export function ArtisanProfile({ artisanId }: ArtisanProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          <Avatar className="h-32 w-32">
            <AvatarImage src={artisanData.profileImage || "/placeholder.svg"} alt={artisanData.name} />
            <AvatarFallback className="text-2xl">
              {artisanData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{artisanData.name}</h1>
              {artisanData.isVerified && (
                <Badge className="bg-primary/10 text-primary flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Verified</span>
                </Badge>
              )}
            </div>

            <p className="text-xl text-primary font-medium mb-3">{artisanData.primaryService}</p>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{artisanData.rating}</span>
                <span className="text-gray-600">({artisanData.reviews} reviews)</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{artisanData.location}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Responds {artisanData.responseTime}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>From ${artisanData.hourlyRate}/hour</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {artisanData.services.map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>

            <p className="text-gray-600 mb-6">{artisanData.bio}</p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="px-8" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Sarah
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Request Quote
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsFavorited(!isFavorited)}
                className={isFavorited ? "text-red-500 border-red-200" : ""}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-red-500" : ""}`} />
                {isFavorited ? "Favorited" : "Save"}
              </Button>
              <Button size="lg" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({artisanData.reviews})</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Professional Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jobs Completed</span>
                  <span className="font-semibold">{artisanData.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold">{artisanData.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">June 2023</span>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Certifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {artisanData.certifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Service Area</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Primary Location</span>
                    <p className="font-medium">{artisanData.location}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Service Radius</span>
                    <p className="font-medium">{artisanData.serviceRadius}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Remote Services</span>
                    <p className="font-medium">Available for consultations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reviews</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("reviews")}>
                View All Reviews
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{review.customer}</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{review.service}</p>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artisanData.portfolioImages.map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Customer Reviews</span>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{artisanData.rating}</span>
                  <span className="text-gray-600">({artisanData.reviews} reviews)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{review.customer[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.customer}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{review.service}</Badge>
                    </div>
                    <p className="text-gray-700 ml-13">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Weekly Availability</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(artisanData.availability).map(([day, schedule]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium capitalize">{day}</span>
                    <span className={`${schedule.available ? "text-green-600" : "text-gray-500"}`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-primary">
                  <strong>Note:</strong> Availability may vary based on current bookings. Contact Sarah directly for
                  specific scheduling requests.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
