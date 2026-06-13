"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  ArrowLeft,
  ChevronDown,
  X,
} from "lucide-react"
import Link from "next/link"
import { 
  searchArtisans, 
  normalizePaginatedResponse,
  type PaginationMeta, 
} from "@/lib/api"
import { PaginationControl } from "@/components/pagination-control"

const CATEGORY_MAP: Record<string, string | null> = {
  "All Services": null,
  "Hair Styling": "hairstyling",
  "Plumbing": "plumbing",
  Carpentry: "carpentry",
  Electrical: "electrical",
  Painting: "painting",
  "House Cleaning": "cleaning",
  "Auto Repair": "autorepair",
  "Tech Support": "techsupport",
}

const SERVICE_FILTERS = ["Home cleaning", "Wood work", "Home service", "Painting"]

const RATING_FILTERS = [
  { label: "No rating preference", value: "all" },
  { label: "5 stars and up", value: "5" },
  { label: "4 stars and up", value: "4" },
  { label: "3 stars and up", value: "3" },
]

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Low to High pricing", value: "low-price" },
  { label: "High to Low pricing", value: "high-price" },
  { label: "Highest rated", value: "highest-rated" },
]

function toNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeServiceLabel(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getInitials(name?: string) {
  const parts = String(name || "A")
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

function mapServiceFilterToBackend(service: string) {
  const normalized = service.toLowerCase()

  if (normalized.includes("cleaning")) return "cleaning"
  if (normalized.includes("wood")) return "carpentry"
  if (normalized.includes("painting")) return "painting"

  // Home service should not force only one category.
  // It represents broader home-related services.
  if (normalized.includes("home")) return "home-service"

  return undefined
}

function buildSelectedServiceTypes({
  selectedCategory,
  selectedServices,
}: {
  selectedCategory: string
  selectedServices: string[]
}) {
  const types = new Set<string>()

  const categoryType = CATEGORY_MAP[selectedCategory]

  if (categoryType) {
    types.add(categoryType)
  }

  selectedServices.forEach((service) => {
    const mapped = mapServiceFilterToBackend(service)

    if (!mapped) return

    if (mapped === "home-service") {
      types.add("cleaning")
      types.add("plumbing")
      types.add("carpentry")
      types.add("electrical")
      types.add("painting")
      return
    }

    types.add(mapped)
  })

  const allKnownTypes = [
    "hairstyling",
    "plumbing",
    "carpentry",
    "electrical",
    "painting",
    "cleaning",
    "autorepair",
    "techsupport",
  ]

  const hasAllServiceBoxes =
    selectedServices.length === SERVICE_FILTERS.length &&
    selectedCategory === "All Services"

  if (hasAllServiceBoxes) {
    return []
  }

  const result = Array.from(types)

  if (result.length === allKnownTypes.length) {
    return []
  }

  return result
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 transition hover:border-primary/40 hover:text-primary"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  )
}

function CheckRow({
  checked,
  onCheckedChange,
  label,
  subLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  subLabel?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5 h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="block">{label}</span>
        {subLabel && <span className="block text-[10px] text-slate-400">{subLabel}</span>}
      </span>
    </label>
  )
}

function FilterPanel({
  selectedCategory,
  setSelectedCategory,
  selectedServices,
  toggleService,
  city,
  setCity,
  stateLocation,
  setStateLocation,
  availableToday,
  setAvailableToday,
  selectedRating,
  setSelectedRating,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  resetFilters,
}: {
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  selectedServices: string[]
  toggleService: (value: string) => void
  city: string
  setCity: (value: string) => void
  stateLocation: string
  setStateLocation: (value: string) => void
  availableToday: boolean
  setAvailableToday: (value: boolean) => void
  selectedRating: string
  setSelectedRating: (value: string) => void
  minPrice: string
  setMinPrice: (value: string) => void
  maxPrice: string
  setMaxPrice: (value: string) => void
  resetFilters: () => void
}) {
  return (
    <aside className="space-y-6 text-xs">
      <div>
        <button
          type="button"
          onClick={resetFilters}
          className="mb-2 text-[11px] font-medium text-primary"
        >
          Reset filter
        </button>

        <div className="flex flex-wrap gap-2">
          {selectedCategory !== "All Services" && (
            <FilterChip
              label={selectedCategory}
              onRemove={() => setSelectedCategory("All Services")}
            />
          )}

          {selectedServices.map((service) => (
            <FilterChip
              key={service}
              label={service}
              onRemove={() => toggleService(service)}
            />
          ))}

          {selectedCategory === "All Services" && selectedServices.length === 0 && (
            <span className="text-[11px] text-slate-400">No filters selected</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-500">Service type</p>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 rounded-md border-slate-200 pl-8 text-xs">
              <SelectValue placeholder="Search service" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CATEGORY_MAP).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {SERVICE_FILTERS.map((service) => (
            <CheckRow
              key={service}
              label={service}
              checked={selectedServices.includes(service)}
              onCheckedChange={() => toggleService(service)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-500">Location</p>

        <CheckRow
          label="Auto detection"
          subLabel="Requires live location"
          checked={availableToday}
          onCheckedChange={setAvailableToday}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[11px] text-slate-500">City</p>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Insert city"
              className="h-8 rounded-md text-xs"
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] text-slate-500">State</p>
            <Input
              value={stateLocation}
              onChange={(e) => setStateLocation(e.target.value)}
              placeholder="Input state"
              className="h-8 rounded-md text-xs"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] text-slate-500">Within</p>
          <div className="grid grid-cols-2 gap-2">
            {["5 km", "10 km", "20 km", "50 km"].map((distance) => (
              <CheckRow
                key={distance}
                label={distance}
                checked={false}
                onCheckedChange={() => {}}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-500">Rating</p>

        <div className="space-y-2">
          {RATING_FILTERS.map((rating) => (
            <CheckRow
              key={rating.value}
              label={rating.label}
              checked={selectedRating === rating.value}
              onCheckedChange={() => setSelectedRating(rating.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-500">Price range</p>

        <div className="grid grid-cols-2 gap-2">
          <Input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            type="number"
            className="h-8 rounded-md text-xs"
          />

          <Input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            type="number"
            className="h-8 rounded-md text-xs"
          />
        </div>

        <div className="h-1 rounded-full bg-slate-100">
          <div className="h-1 w-2/3 rounded-full bg-primary" />
        </div>
      </div>
    </aside>
  )
}

function SortPanel({
  sortBy,
  setSortBy,
}: {
  sortBy: string
  setSortBy: (value: string) => void
}) {
  return (
    <div className="space-y-3 text-xs">
      <p className="font-medium text-slate-500">Sort by</p>

      {SORT_OPTIONS.map((option) => (
        <CheckRow
          key={option.value}
          label={option.label}
          checked={sortBy === option.value}
          onCheckedChange={() => setSortBy(option.value)}
        />
      ))}
    </div>
  )
}

function ArtisanCard({ artisan }: { artisan: any }) {
  const skill = Array.isArray(artisan.skills)
    ? artisan.skills[0]
    : artisan.serviceType || artisan.service_type || "Artisan"

  const serviceName = skill ? normalizeServiceLabel(skill) : "Artisan Service"

  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-[92px] overflow-hidden bg-slate-100 sm:h-[96px]">
        <img
          src={artisan.profileImage || artisan.profile_image || "/placeholder.svg"}
          alt={serviceName}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950">
            {serviceName}
          </h3>

          <Badge
            variant="outline"
            className="h-5 shrink-0 rounded-full border-slate-200 px-2 text-[10px] font-normal text-slate-500"
          >
            +{Math.max(1, Number(artisan.reviewsCount || artisan.reviews_count || 3))}
          </Badge>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-normal text-slate-500"
          >
            Home services
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
            {artisan.profileImage || artisan.profile_image ? (
              <img
                src={artisan.profileImage || artisan.profile_image}
                alt={artisan.name}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(artisan.name)
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-900">
              {artisan.name || "Artisan"}
            </p>
            <p className="truncate text-[10px] text-slate-500">
              {artisan.location || "Location not added"}
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mt-3 h-7 w-full text-[11px] font-medium text-primary hover:bg-primary/5 hover:text-primary"
        >
          <Link href={`/artisan/${artisan.artisanId || artisan.id || artisan.user_id}`}>
            See more
          </Link>
        </Button>
      </div>
    </article>
  )
}

export function SearchAndBrowse() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Services")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState("all")
  const [availableToday, setAvailableToday] = useState(false)
  const [city, setCity] = useState("")
  const [stateLocation, setStateLocation] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [showMobileSort, setShowMobileSort] = useState(false)

  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    )
  }

  const resetFilters = () => {
    setSelectedCategory("All Services")
    setSelectedServices([])
    setSelectedRating("all")
    setAvailableToday(false)
    setCity("")
    setStateLocation("")
    setMinPrice("")
    setMaxPrice("")
    setSearchQuery("")
  }

  const fetchArtisans = async () => {
  setLoading(true)

  const backendTypes = buildSelectedServiceTypes({
    selectedCategory,
    selectedServices,
  })

  const locationQuery = city || stateLocation || searchQuery || undefined

  try {
    const data: any = await searchArtisans({
      types: backendTypes.length ? backendTypes : undefined,
      location: locationQuery,
      rating: selectedRating !== "all" ? selectedRating : undefined,
      available: availableToday ? true : undefined,
      page,
      limit: 24,
    })

    const paginated = normalizePaginatedResponse<any>(data)

    setResults(paginated.data)
    setTotal(paginated.pagination.total)
    setPagination(paginated.pagination)
  } catch (e) {
    console.error("Search error:", e)
    setResults([])
    setTotal(0)
    setPagination(null)
  } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtisans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    searchQuery,
    selectedCategory,
    selectedServices,
    selectedRating,
    availableToday,
    city,
    stateLocation,
  ])

  useEffect(() => {
    setPage(1)
  }, [
    searchQuery,
    selectedCategory,
    selectedServices,
    selectedRating,
    availableToday,
    city,
    stateLocation,
  ])
  
  const filteredAndSortedResults = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null
    const max = maxPrice ? Number(maxPrice) : null

    const filtered = results.filter((artisan) => {
      const price = toNumber(artisan.hourlyRate || artisan.hourly_rate)

      if (min !== null && price < min) return false
      if (max !== null && price > max) return false

      return true
    })

    return [...filtered].sort((a, b) => {
      const aPrice = toNumber(a.hourlyRate || a.hourly_rate)
      const bPrice = toNumber(b.hourlyRate || b.hourly_rate)
      const aRating = toNumber(a.rating)
      const bRating = toNumber(b.rating)

      if (sortBy === "low-price") return aPrice - bPrice
      if (sortBy === "high-price") return bPrice - aPrice
      if (sortBy === "highest-rated") return bRating - aRating
      if (sortBy === "oldest") return String(a.artisanId || "").localeCompare(String(b.artisanId || ""))

      return String(b.artisanId || "").localeCompare(String(a.artisanId || ""))
    })
  }, [results, minPrice, maxPrice, sortBy])

  function mapArtisanForCard(raw: any) {
  const user = raw?.User || raw?.user || raw?.artisan || {}

  const skills = Array.isArray(raw?.skills)
    ? raw.skills
    : typeof raw?.skills === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(raw.skills)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return raw.skills
              .split(",")
              .map((item: string) => item.trim())
              .filter(Boolean)
          }
        })()
      : []

  return {
    ...raw,
    artisanId: String(
      raw?.artisanId ||
        raw?.artisan_id ||
        raw?.user_id ||
        user?.id ||
        raw?.id ||
        ""
    ),
    name: raw?.name || user?.name || "Artisan",
    email: raw?.email || user?.email || "",
    location: raw?.location || "No location",
    rating: Number(raw?.rating || 0),
    hourlyRate: Number(raw?.hourlyRate || raw?.hourly_rate || 0),
    skills,
    profileImage:
      raw?.profileImage ||
      raw?.profile_image ||
      user?.avatar_url ||
      null,
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link
          href="/dashboard/customer"
          className="mb-4 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          Browse Gigs
        </h1>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block">
            <FilterPanel
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedServices={selectedServices}
              toggleService={toggleService}
              city={city}
              setCity={setCity}
              stateLocation={stateLocation}
              setStateLocation={setStateLocation}
              availableToday={availableToday}
              setAvailableToday={setAvailableToday}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              resetFilters={resetFilters}
            />
          </div>

          <main>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[420px] lg:ml-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search artisan, Talents"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 pl-10 text-sm"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="hidden h-10 w-[140px] rounded-lg border-slate-200 text-xs sm:flex">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMobileSort((prev) => !prev)
                    setShowMobileFilter(false)
                  }}
                  className="h-9 text-xs text-slate-600"
                >
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                  Sort by
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMobileFilter((prev) => !prev)
                    setShowMobileSort(false)
                  }}
                  className="h-9 text-xs text-slate-600"
                >
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                  Filter
                </Button>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 sm:hidden ${
                showMobileSort ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="mb-4 rounded-lg border border-slate-100 bg-white p-4">
                  <SortPanel sortBy={sortBy} setSortBy={setSortBy} />
                </div>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 sm:hidden ${
                showMobileFilter ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="mb-4 rounded-lg border border-slate-100 bg-white p-4">
                  <FilterPanel
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedServices={selectedServices}
                    toggleService={toggleService}
                    city={city}
                    setCity={setCity}
                    stateLocation={stateLocation}
                    setStateLocation={setStateLocation}
                    availableToday={availableToday}
                    setAvailableToday={setAvailableToday}
                    selectedRating={selectedRating}
                    setSelectedRating={setSelectedRating}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    resetFilters={resetFilters}
                  />
                </div>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[210px] animate-pulse rounded-lg border border-slate-100 bg-slate-50"
                  />
                ))}
              </div>
            )}

            {!loading && filteredAndSortedResults.length > 0 && (
              <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedResults.map((artisan) => (
                  <ArtisanCard
                    key={artisan.artisanId || artisan.id || artisan.user_id}
                    artisan={artisan}
                  />
                ))}
              </div>
                {pagination && results.length > 0 && (
                  <PaginationControl
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}

            {!loading && filteredAndSortedResults.length === 0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-slate-100 bg-white px-4 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>

                <h3 className="text-sm font-semibold text-slate-950">
                  No talent found
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Try adjusting your filter or search terms.
                </p>

                <Button
                  onClick={resetFilters}
                  size="sm"
                  className="mt-4 bg-primary hover:bg-primary/90"
                >
                  Reset filter
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}