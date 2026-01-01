"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Star, MapPin, Clock, DollarSign, MessageSquare, Heart, Share2, CheckCircle, Calendar, Award } from "lucide-react"
import { getArtisanProfile, listReviewsForArtisan, type GetArtisanProfileResponse } from "@/lib/api"

interface ArtisanProfileProps {
  artisanId: string
}

export function ArtisanProfile({ artisanId }: ArtisanProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isFavorited, setIsFavorited] = useState(false)
  const [data, setData] = useState<GetArtisanProfileResponse | null>(null)
  const [reviews, setReviews] = useState<GetArtisanProfileResponse['reviews']>([])

  useEffect(() => {
    let abort = new AbortController()
    getArtisanProfile(artisanId)
      .then((d) => { setData(d); setReviews(d.reviews || []) })
      .catch(()=>{})
    return () => abort.abort()
  }, [artisanId])

  const initials = useMemo(() => {
    if (!data?.user?.name) return ""
    return data.user.name.split(" ").map(n => n[0]).join("")
  }, [data?.user?.name])

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">Loading profile…</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section (replaces mock with real data) */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          <Avatar className="h-32 w-32">
            <AvatarImage src={data.profile.profileImage || "/placeholder.svg"} alt={data.user.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{data.user.name}</h1>
              {data.badges.length > 0 && (
                <Badge className="bg-primary/10 text-primary flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Verified</span>
                </Badge>
              )}
            </div>

            {/* Primary service: if you want, pull from portfolio[0]?.type/title */}
            <p className="text-xl text-primary font-medium mb-3">
              {data.profile.skills?.[0] || "Artisan"}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{Number(data.profile.rating).toFixed(1)}</span>
                <span className="text-gray-600">({data.meta.reviewsCount} reviews)</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{data.profile.location || "—"}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Responds quickly</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>From ${data.profile.hourlyRate ?? 0}/hour</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(data.profile.skills || []).map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>

            <p className="text-gray-600 mb-6">{data.profile.bio}</p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="px-8"
                asChild
              >
                <Link
                  href={{
                    pathname: "/messages",
                    query: {
                      artisanId: data.user.id,
                      artisanName: data.user.name,
                      artisanEmail: data.user.email,
                    },
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact {data.user.name.split(" ")[0] ?? "Artisan"}
                </Link>
              </Button>
              <Button size="lg" variant="outline">Request Quote</Button>
              <Button size="lg" variant="outline" onClick={() => setIsFavorited(!isFavorited)} className={isFavorited ? "text-red-500 border-red-200" : ""}>
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
          <TabsTrigger value="reviews">Reviews ({data.meta.reviewsCount})</TabsTrigger>
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
                <div className="flex justify-between"><span className="text-gray-600">Jobs Completed</span><span className="font-semibold">{data.meta.completedJobs}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Success Rate</span><span className="font-semibold">—</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Response Time</span><span className="font-semibold">—</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Member Since</span><span className="font-semibold">—</span></div>
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
                  {(data.profile.certifications || []).map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                  {(!data.profile.certifications || data.profile.certifications.length === 0) && (
                    <span className="text-sm text-gray-500">No certifications listed.</span>
                  )}
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
                    <p className="font-medium">{data.profile.location || "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Service Radius</span>
                    <p className="font-medium">{data.profile.serviceRadius ? `${data.profile.serviceRadius} miles` : "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Remote Services</span>
                    <p className="font-medium">{data.profile.isRemoteAvailable ? "Available" : "Not available"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reviews</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("reviews")}>View All Reviews</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reviews || []).slice(0, 2).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{review.customerName || "Customer"}</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(Math.round(review.rating))].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{review.service || "Service"}</p>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
                {(!reviews || reviews.length === 0) && <p className="text-sm text-gray-500">No reviews yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Work Portfolio</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.portfolio || []).map((svc: any, index: number) => (
                  <div key={svc.id ?? index} className="aspect-square rounded-lg overflow-hidden">
                    <img src={(svc.images?.[0]) || "/placeholder.svg"} alt={svc.title || `Portfolio ${index+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                  </div>
                ))}
                {(!data.portfolio || data.portfolio.length === 0) && <p className="text-sm text-gray-500">No portfolio yet.</p>}
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
                  <span className="font-semibold">{Number(data.profile.rating).toFixed(1)}</span>
                  <span className="text-gray-600">({data.meta.reviewsCount} reviews)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(reviews || []).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10"><AvatarFallback>{(review.customerName || "C")[0]}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{review.customerName || "Customer"}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[...Array(Math.round(review.rating))].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{review.service || "Service"}</Badge>
                    </div>
                    <p className="text-gray-700 ml-13">{review.comment}</p>
                  </div>
                ))}
                {(!reviews || reviews.length === 0) && <p className="text-sm text-gray-500">No reviews yet.</p>}
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
              {/* Until you store structured weekly availability in DB, show a helpful note */}
              <div className="mt-2 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-primary">
                  Availability varies based on bookings. Contact {data.user.name.split(" ")[0] ?? "artisan"} for specific scheduling requests.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}