"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getArtisanProfile,
  type GetArtisanProfileResponse,
} from "@/lib/api"

interface ArtisanProfileProps {
  artisanId: string
}

function toNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function getInitials(name?: string) {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)

  if (!parts.length) return "A"

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function formatCurrency(value: any) {
  return `₦${toNumber(value).toLocaleString()}`
}

function formatDate(value?: string) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function normalizeList(value: any): string[] {
  if (Array.isArray(value)) return value

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return value ? [value] : []
    }
  }

  return []
}

function normalizePortfolioImages(value: any): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item
        return item?.url || item?.secure_url || item?.image || item?.filename || ""
      })
      .filter(Boolean)
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return normalizePortfolioImages(parsed)
    } catch {
      return value ? [value] : []
    }
  }

  return []
}

function StatItem({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{text}</p>
    </div>
  )
}

export function ArtisanProfile({ artisanId }: ArtisanProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isFavorited, setIsFavorited] = useState(false)
  const [data, setData] = useState<GetArtisanProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        setLoading(true)
        const response = await getArtisanProfile(artisanId)

        if (!cancelled) {
          setData(response)
        }
      } catch (error) {
        console.error("Failed to load artisan profile:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [artisanId])

  const user = data?.user
  const profile = data?.profile
  const reviews = data?.reviews || []
  const badges = data?.badges || []
  const meta = (data?.meta || {}) as Record<string, any>

  const skills = useMemo(() => normalizeList(profile?.skills), [profile?.skills])
  const certifications = useMemo(
    () => normalizeList(profile?.certifications),
    [profile?.certifications]
  )

  const portfolioImages = useMemo(() => {
    const rawPortfolio = (data as any)?.portfolio || []
    const rawGallery =
      (profile as any)?.portfolioGallery ||
      (profile as any)?.portfolio_gallery ||
      []

    const gallery = normalizePortfolioImages(rawGallery)

    const fromPortfolio = Array.isArray(rawPortfolio)
      ? rawPortfolio
          .flatMap((item: any) => {
            const attachments = item?.attachments || []
            const attachmentUrls = Array.isArray(attachments)
              ? attachments
                  .map((a: any) => a?.url || a?.filename || "")
                  .filter(Boolean)
              : []

            return [
              item?.image,
              item?.url,
              item?.filename,
              ...attachmentUrls,
            ].filter(Boolean)
          })
      : []

    return [...gallery, ...fromPortfolio]
  }, [data, profile])

  const firstName = user?.name?.split(" ")?.[0] || "Artisan"
  const rating = toNumber(profile?.rating)
  const hourlyRate = toNumber(profile?.hourlyRate || (profile as any)?.hourly_rate)
  const reviewsCount = toNumber(meta?.reviewsCount || reviews.length)
  const completedJobs = toNumber(meta?.completedJobs)
  const profileImage =
    profile?.profileImage ||
    (profile as any)?.profile_image ||
    (user as any)?.avatar_url ||
    "/placeholder.svg";

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {}
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="h-[280px] animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[140px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!data || !user || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="Profile not found"
          text="This artisan profile could not be loaded. Please try again later."
        />
      </div>
    )
  }

  return (
    <div className="bg-slate-50/40">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <div className="relative h-28 bg-primary/10">
            <div className="absolute bottom-4 right-5 hidden rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-slate-600 backdrop-blur sm:block">
              Available for new work
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <Avatar className="h-28 w-28 border-4 border-white bg-slate-100 shadow-sm sm:h-32 sm:w-32">
                  <AvatarImage src={profileImage} alt={user.name} />
                  <AvatarFallback className="text-2xl font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      {user.name}
                    </h1>

                    {badges.length > 0 && (
                      <Badge className="rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-medium text-primary">
                    {skills[0] || profile?.service_type || "Professional Artisan"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-slate-900">
                        {rating.toFixed(1)}
                      </span>
                      <span>({reviewsCount} reviews)</span>
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      {profile.location || "Location not added"}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-primary" />
                      From {formatCurrency(hourlyRate)}/hr
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      Responds quickly
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 lg:pb-2">
                <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                  <Link
                    href={{
                      pathname: "/messages",
                      query: {
                        artisanId: user.id,
                        artisanName: user.name,
                        artisanEmail: user.email,
                      },
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact {firstName}
                  </Link>
                </Button>

                <Button variant="outline">Request Quote</Button>

                <Button
                  variant="outline"
                  onClick={() => setIsFavorited((prev) => !prev)}
                  className={isFavorited ? "border-red-200 text-red-500" : ""}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${
                      isFavorited ? "fill-red-500" : ""
                    }`}
                  />
                  Save
                </Button>

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-600">
                {profile.bio}
              </p>
            )}

            {skills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="rounded-full bg-primary/10 px-3 py-1 text-primary"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatItem label="Jobs Completed" value={completedJobs} />
          <StatItem
            label="Rating"
            value={`${rating.toFixed(1)} / 5`}
          />
          <StatItem
            label="Hourly Rate"
            value={`${formatCurrency(hourlyRate)}/hr`}
          />
          <StatItem
            label="Remote Service"
            value={profile.isRemoteAvailable ? "Available" : "Not available"}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-slate-100 bg-white p-1 sm:grid-cols-4">
            <TabsTrigger value="overview" className="rounded-xl py-2 text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-xl py-2 text-xs">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl py-2 text-xs">
              Reviews ({reviewsCount})
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-xl py-2 text-xs">
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
              <Card className="rounded-3xl border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Professional Summary
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Main service</p>
                      <p className="mt-1 font-medium text-slate-950">
                        {skills[0] || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Experience</p>
                      <p className="mt-1 font-medium capitalize text-slate-950">
                        {(profile as any)?.experience || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Primary location</p>
                      <p className="mt-1 font-medium text-slate-950">
                        {profile.location || "Not added"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Service radius</p>
                      <p className="mt-1 font-medium text-slate-950">
                        {profile.serviceRadius
                          ? `${profile.serviceRadius} miles`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      About this artisan
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {profile.bio || "This artisan has not added a bio yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Certifications
                    </h2>
                  </div>

                  {certifications.length > 0 ? (
                    <div className="space-y-3">
                      {certifications.map((cert) => (
                        <div
                          key={cert}
                          className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium text-slate-700">
                            {cert}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<ShieldCheck className="h-5 w-5" />}
                      title="No certifications yet"
                      text="Certifications added by this artisan will appear here."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5 rounded-3xl border-slate-100 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Recent Reviews
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      What customers are saying about {firstName}.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("reviews")}
                  >
                    View all reviews
                  </Button>
                </div>

                {reviews.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {reviews.slice(0, 2).map((review: any) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-slate-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {review.customerName || "Customer"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {review.service || "Service"}
                            </p>
                          </div>

                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`h-3.5 w-3.5 ${
                                  index < Math.round(toNumber(review.rating))
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {review.comment || "No comment added."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No reviews yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {portfolioImages.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-slate-950">
                        Project {index + 1}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Work sample from {firstName}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ImageIcon className="h-5 w-5" />}
                title="No portfolio yet"
                text="This artisan has not uploaded work samples yet."
              />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card
                    key={review.id}
                    className="rounded-3xl border-slate-100 shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {review.customerName || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {review.service || "Service"} •{" "}
                            {formatDate(review.createdAt || review.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < Math.round(toNumber(review.rating))
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {review.comment || "No comment added."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Star className="h-5 w-5" />}
                title="No reviews yet"
                text="Customer reviews for this artisan will show here."
              />
            )}
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-3xl border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Availability
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Current status</span>
                      <span className="font-medium text-emerald-600">
                        Available
                      </span>
                    </div>

                    <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Response time</span>
                      <span className="font-medium text-slate-950">
                        Responds quickly
                      </span>
                    </div>

                    <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Remote services</span>
                      <span className="font-medium text-slate-950">
                        {profile.isRemoteAvailable ? "Available" : "Not available"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Service Area
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Primary location</p>
                      <p className="mt-1 font-medium text-slate-950">
                        {profile.location || "Not added"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Service radius</p>
                      <p className="mt-1 font-medium text-slate-950">
                        {profile.serviceRadius
                          ? `${profile.serviceRadius} miles`
                          : "Not specified"}
                      </p>
                    </div>

                    <Button className="mt-2 w-full bg-primary text-white hover:bg-primary/90" asChild>
                      <Link
                        href={{
                          pathname: "/messages",
                          query: {
                            artisanId: user.id,
                            artisanName: user.name,
                            artisanEmail: user.email,
                          },
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Ask about availability
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}