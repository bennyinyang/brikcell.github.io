"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import {
  Award,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Heart,
  HelpCircle,
  Home,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Share2,
  ShieldCheck,
  Star,
  Wallet,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getArtisanProfile,
  getAuth,
  updateMyArtisanProfile,
  uploadSingleFile,
  addFavouriteArtisan,
  removeFavouriteArtisan,
  type GetArtisanProfileResponse,
} from "@/lib/api"

const EMPLOYER_NAV = [
  { label: "Dashboard", href: "/dashboard/customer" },
  { label: "Browse Talent", href: "/search" },
  { label: "Post a Job", href: "/post-job" },
  { label: "My Bookings", href: "/dashboard/customer/bookings" },
  { label: "Wallet", href: "/dashboard/customer/wallet" },
  { label: "Settings", href: "/dashboard/customer/settings" },
  { label: "Support", href: "/support" },
]

const ARTISAN_NAV = [
  { label: "Dashboard", href: "/dashboard/artisan" },
  { label: "Browse Jobs", href: "/dashboard/jobs" },
  { label: "My Bookings", href: "/dashboard/bookings" },
  { label: "My Services", href: "/dashboard/services/post" },
  { label: "Wallet", href: "/dashboard/wallet" },
  { label: "Settings", href: "/dashboard/settings" },
  { label: "Support", href: "/support" },
]

function ProfileNavSidebar() {
  const [navItems, setNavItems] = useState(EMPLOYER_NAV)

  useEffect(() => {
    const auth = getAuth()
    if (auth?.user?.role === "artisan") setNavItems(ARTISAN_NAV)
  }, [])

  return (
    <aside className="hidden w-[190px] shrink-0 lg:block">
      <nav className="sticky top-24 space-y-4">
        {navItems.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

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

const STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "text-emerald-600" },
  { value: "busy", label: "Busy", color: "text-amber-600" },
  { value: "on_leave", label: "On Leave", color: "text-slate-500" },
  { value: "unavailable", label: "Unavailable", color: "text-red-500" },
]

const RESPONSE_OPTIONS = [
  { value: "within_1_hour", label: "Within 1 hour" },
  { value: "within_few_hours", label: "Within a few hours" },
  { value: "within_1_day", label: "Within a day" },
  { value: "within_few_days", label: "Within a few days" },
]

function statusLabel(value: string | null | undefined) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Available"
}
function statusColor(value: string | null | undefined) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.color ?? "text-emerald-600"
}
function responseLabel(value: string | null | undefined) {
  return RESPONSE_OPTIONS.find((o) => o.value === value)?.label ?? "Within a few hours"
}

export function ArtisanProfile({ artisanId }: ArtisanProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isFavorited, setIsFavorited] = useState(false)
  const [data, setData] = useState<GetArtisanProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [viewerIsArtisan, setViewerIsArtisan] = useState(false)
  const [editingField, setEditingField] = useState<"currentStatus" | "responseTime" | "remoteServices" | null>(null)
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any | null>(null)
  const [availabilityState, setAvailabilityState] = useState({
    currentStatus: "available",
    responseTime: "within_few_hours",
    isRemoteAvailable: false,
  })
  const [savingField, setSavingField] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    setViewerIsArtisan(auth?.user?.role === "artisan")
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        setLoading(true)
        const auth = getAuth()
        const response = await getArtisanProfile(artisanId)

        if (!cancelled) {
          setData(response)
          setIsOwnProfile(auth?.user?.id === response.user?.id)
          setAvailabilityState({
            currentStatus: response.profile?.currentStatus || "available",
            responseTime: response.profile?.responseTime || "within_few_hours",
            isRemoteAvailable: Boolean(response.profile?.isRemoteAvailable),
          })
          setCoverImage(
            (response.profile as any)?.cover_image ||
            response.profile?.coverImage ||
            null
          )

          // Load favourite status for employers
          if (auth?.user?.role === "employer") {
            try {
              const { getFavouriteArtisans } = await import("@/lib/api")
              const favs: any[] = await getFavouriteArtisans()
              if (!cancelled) {
                setIsFavorited(favs.some((f: any) => f.artisan_id === response.user?.id || f.artisan?.id === response.user?.id))
              }
            } catch {}
          }
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

  async function handleCoverImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const res = await uploadSingleFile(file)
      const url = (res as any)?.secure_url || (res as any)?.url
      if (!url) throw new Error("Upload failed")
      await updateMyArtisanProfile({ cover_image: url })
      setCoverImage(url)
      toast.success("Cover image updated")
    } catch {
      toast.error("Failed to upload cover image")
    } finally {
      setCoverUploading(false)
      e.target.value = ""
    }
  }

  async function saveAvailabilityField(field: string, value: string | boolean) {
    setSavingField(true)
    try {
      await updateMyArtisanProfile({ [field]: value })
      setAvailabilityState((prev) => ({ ...prev, [field]: value }))
    } catch (e) {
      console.error("Failed to update availability", e)
    } finally {
      setSavingField(false)
      setEditingField(null)
    }
  }

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

  type PortfolioItem = {
    key: string
    title: string
    description?: string
    service_type?: string
    budget_min?: number | null
    budget_max?: number | null
    deadline?: string | null
    location?: string | null
    images: string[]
    isService: boolean
  }

  const portfolioItems = useMemo((): PortfolioItem[] => {
    const rawPortfolio = (data as any)?.portfolio || []
    const rawGallery =
      (profile as any)?.portfolioGallery ||
      (profile as any)?.portfolio_gallery ||
      []

    const galleryUrls = normalizePortfolioImages(rawGallery)

    const serviceItems: PortfolioItem[] = Array.isArray(rawPortfolio)
      ? rawPortfolio
          .map((item: any) => {
            const attachments = item?.attachments || []
            const attachmentUrls = Array.isArray(attachments)
              ? attachments.map((a: any) => a?.url || a?.filename || "").filter(Boolean)
              : []
            const images = [item?.image, item?.url, item?.filename, ...attachmentUrls].filter(Boolean)
            return {
              key: item?.id || item?.title || Math.random().toString(),
              title: item?.title || "",
              description: item?.description ?? undefined,
              service_type: item?.service_type ?? undefined,
              budget_min: item?.budget_min ?? null,
              budget_max: item?.budget_max ?? null,
              deadline: item?.deadline ?? null,
              location: item?.location ?? undefined,
              images,
              isService: true,
            } as PortfolioItem
          })
          .filter((item: PortfolioItem) => item.images.length > 0 || item.title)
      : []

    const galleryItems: PortfolioItem[] = galleryUrls.map((url, i) => ({
      key: `gallery-${i}`,
      title: "",
      images: [url],
      isService: false,
    }))

    return [...serviceItems, ...galleryItems]
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
      toast.success("Copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  async function handleToggleFavourite() {
    if (!user?.id) return
    const next = !isFavorited
    setIsFavorited(next)
    try {
      if (next) {
        await addFavouriteArtisan(user.id)
        toast.success("Artisan added to favourites")
      } else {
        await removeFavouriteArtisan(user.id)
        toast.success("Removed from favourites")
      }
    } catch (err: any) {
      setIsFavorited(!next)
      toast.error(err?.message || "Could not update favourites")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 lg:px-8">
        <ProfileNavSidebar />
        <div className="min-w-0 flex-1">
          <div className="h-[280px] animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[140px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || !user || !profile) {
    return (
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 lg:px-8">
        <ProfileNavSidebar />
        <div className="min-w-0 flex-1">
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="Profile not found"
            text="This artisan profile could not be loaded. Please try again later."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50/40">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <ProfileNavSidebar />
        <div className="min-w-0 flex-1">
        <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <div
            className="relative h-40"
            style={
              coverImage
                ? { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {/* Fallback tint when no cover image */}
            {!coverImage && <div className="absolute inset-0 bg-primary/10" />}

            {/* Dim overlay so any content stays readable over a photo */}
            {coverImage && <div className="absolute inset-0 bg-black/20" />}

            {/* Own-profile upload button */}
            {isOwnProfile && (
              <label className="absolute bottom-3 right-3 z-10 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleCoverImageUpload}
                  disabled={coverUploading}
                />
                <span className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur transition hover:bg-white">
                  {coverUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                  {coverUploading ? "Uploading…" : coverImage ? "Change cover" : "Add cover photo"}
                </span>
              </label>
            )}

            {/* Visitor badge */}
            {!isOwnProfile && (
              <div className="absolute bottom-4 right-5 z-10 hidden rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-slate-600 backdrop-blur sm:block">
                Available for new work
              </div>
            )}
          </div>

          <div className="px-5 pb-6 pt-2 sm:px-8">
            <div className="-mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

              <div className="flex flex-nowrap gap-2 lg:pb-2">
                {!viewerIsArtisan && (
                  <Button className="bg-primary text-white hover:bg-primary/90 whitespace-nowrap" asChild>
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
                )}

                {!viewerIsArtisan && (
                  <Button
                    variant="outline"
                    onClick={handleToggleFavourite}
                    className={`whitespace-nowrap ${isFavorited ? "border-red-200 text-red-500" : ""}`}
                  >
                    <Heart
                      className={`mr-2 h-4 w-4 ${isFavorited ? "fill-red-500" : ""}`}
                    />
                    {isFavorited ? "Saved" : "Save"}
                  </Button>
                )}

                <Button variant="outline" onClick={handleShare} className="whitespace-nowrap">
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

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setEditingField(null) }} className="mt-8">
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
                              {review.reviewer?.name || "Customer"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(review.created_at || review.createdAt)}
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
            {portfolioItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioItems.map((item) => (
                  <div
                    key={item.key}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                    onClick={() => setSelectedPortfolioItem(item)}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title || "Portfolio image"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-slate-950 line-clamp-1">
                        {item.title || "Work sample"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.service_type || `Work sample from ${firstName}`}
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

            {/* Service detail popup */}
            {selectedPortfolioItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={() => setSelectedPortfolioItem(null)}>
                <div
                  className="w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                  style={{ maxHeight: "92vh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Images */}
                  {selectedPortfolioItem.images.length > 0 && (
                    <div className={`grid ${selectedPortfolioItem.images.length === 1 ? "" : "grid-cols-2"} gap-1`}>
                      {selectedPortfolioItem.images.map((img: string, i: number) => (
                        <div key={i} className={`overflow-hidden bg-slate-100 ${i === 0 && selectedPortfolioItem.images.length % 2 !== 0 ? "col-span-2" : ""} ${i === 0 ? "rounded-t-2xl" : ""}`}>
                          <img src={img} alt="" className="h-64 w-full object-cover sm:h-80" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                          {selectedPortfolioItem.title || "Service"}
                        </h2>
                        {selectedPortfolioItem.service_type && (
                          <p className="mt-1 text-sm text-slate-500">{selectedPortfolioItem.service_type}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPortfolioItem(null)}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {selectedPortfolioItem.description && (
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">{selectedPortfolioItem.description}</p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-500 sm:grid-cols-3">
                      {(selectedPortfolioItem.budget_min || selectedPortfolioItem.budget_max) && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</p>
                          <p className="font-medium text-slate-700">
                            {selectedPortfolioItem.budget_min && selectedPortfolioItem.budget_max
                              ? `₦${Number(selectedPortfolioItem.budget_min).toLocaleString()} – ₦${Number(selectedPortfolioItem.budget_max).toLocaleString()}`
                              : selectedPortfolioItem.budget_min
                              ? `From ₦${Number(selectedPortfolioItem.budget_min).toLocaleString()}`
                              : `Up to ₦${Number(selectedPortfolioItem.budget_max).toLocaleString()}`}
                          </p>
                        </div>
                      )}
                      {selectedPortfolioItem.location && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
                          <p className="font-medium text-slate-700">{selectedPortfolioItem.location}</p>
                        </div>
                      )}
                      {selectedPortfolioItem.deadline && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
                          <p className="font-medium text-slate-700">{formatDate(selectedPortfolioItem.deadline)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                            {review.reviewer?.name || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(review.created_at || review.createdAt)}
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
                    {/* Current status */}
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Current status</span>
                      {isOwnProfile && editingField === "currentStatus" ? (
                        <Select
                          value={availabilityState.currentStatus}
                          onValueChange={(v) => saveAvailabilityField("currentStatus", v)}
                          disabled={savingField}
                        >
                          <SelectTrigger className="h-7 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className={`font-medium ${statusColor(availabilityState.currentStatus)}`}>
                            {statusLabel(availabilityState.currentStatus)}
                          </span>
                          {isOwnProfile && (
                            <button
                              type="button"
                              onClick={() => setEditingField("currentStatus")}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Response time */}
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Response time</span>
                      {isOwnProfile && editingField === "responseTime" ? (
                        <Select
                          value={availabilityState.responseTime}
                          onValueChange={(v) => saveAvailabilityField("responseTime", v)}
                          disabled={savingField}
                        >
                          <SelectTrigger className="h-7 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-slate-950">
                            {responseLabel(availabilityState.responseTime)}
                          </span>
                          {isOwnProfile && (
                            <button
                              type="button"
                              onClick={() => setEditingField("responseTime")}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Remote services */}
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-500">Remote services</span>
                      {isOwnProfile && editingField === "remoteServices" ? (
                        <Select
                          value={availabilityState.isRemoteAvailable ? "yes" : "no"}
                          onValueChange={(v) => saveAvailabilityField("isRemoteAvailable", v === "yes")}
                          disabled={savingField}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes" className="text-xs">Available</SelectItem>
                            <SelectItem value="no" className="text-xs">Not available</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-slate-950">
                            {availabilityState.isRemoteAvailable ? "Available" : "Not available"}
                          </span>
                          {isOwnProfile && (
                            <button
                              type="button"
                              onClick={() => setEditingField("remoteServices")}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}
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

                    {!viewerIsArtisan && (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}