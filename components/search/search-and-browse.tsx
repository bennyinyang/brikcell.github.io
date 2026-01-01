"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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
  Clock,
  DollarSign,
  Grid3X3,
  List,
} from "lucide-react"
import Link from "next/link"
import { searchArtisans } from "@/lib/api"

const CATEGORY_MAP: Record<string, string | null> = {
  "All Services": null,
  "Hair Styling": "hairstyling",
  "Plumbing": "plumbing",
  "Carpentry": "carpentry",
  "Electrical": "electrical",
  "Painting": "painting",
  "House Cleaning": "cleaning",
  "Auto Repair": "autorepair",
  "Tech Support": "techsupport",
}

export function SearchAndBrowse() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Services")
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [selectedRating, setSelectedRating] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [availableToday, setAvailableToday] = useState(false)

  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // 🔍 Fetch real data
  const fetchArtisans = async () => {
    setLoading(true)

    const backendType = CATEGORY_MAP[selectedCategory] ?? undefined

    try {
      const data = await searchArtisans({
        type: backendType,
        location: searchQuery || undefined,
        rating: selectedRating !== "all" ? selectedRating : undefined,
        available: availableToday ? true : undefined,
        page: 1,
        limit: 12,
      })

      setResults(data.results || [])
      setTotal(data.pagination?.total ?? 0)
    } catch (e) {
      console.error("Search error:", e)
      setResults([])
      setTotal(0)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchArtisans()
  }, [searchQuery, selectedCategory, selectedRating, availableToday])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Your Perfect Artisan</h1>
        <p className="text-gray-600">Browse thousands of skilled professionals</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 py-2 shadow-none">
        <CardContent className="p-6 py-1.5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for services, artisans, or specialties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_MAP).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <h2 className="text-xl font-semibold mb-6">{total} artisans found</h2>

      {/* Loading Placeholder */}
      {loading && (
        <p className="text-gray-500 py-10 text-center">Loading artisans…</p>
      )}

      {/* Results List/Grid */}
      {!loading && results.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {results.map((artisan) => (
            <Card
              key={artisan.artisanId}
              className={`hover:shadow-lg transition-shadow py-0 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              <div className={viewMode === "list" ? "flex w-full" : ""}>
                <div className={`${viewMode === "list" ? "w-32 h-32" : "aspect-square"} relative`}>
                  <img
                    src="/placeholder.svg"
                    alt={artisan.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>

                <CardContent className={`${viewMode === "list" ? "flex-1" : ""} p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{artisan.name}</h3>
                      <p className="text-primary font-medium">
                        {(artisan.skills ?? [])[0] || "Artisan"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{artisan.rating}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{artisan.location || "—"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>₦{(artisan.hourlyRate ?? 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button asChild size="sm">
                    <Link href={`/artisan/${artisan.artisanId}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No artisans found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All Services")
                setSelectedRating("all")
                setAvailableToday(false)
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
