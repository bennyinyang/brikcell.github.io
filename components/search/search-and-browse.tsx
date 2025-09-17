"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Star, MapPin, Clock, DollarSign, Grid3X3, List, SlidersHorizontal } from "lucide-react"
import Link from "next/link"

// Mock data for search results
const searchResults = [
  {
    id: 1,
    name: "Sarah Johnson",
    service: "Hair Styling",
    rating: 4.9,
    reviews: 127,
    location: "Downtown",
    distance: "2.3 miles",
    hourlyRate: 22500, // ₦22,500 instead of $45
    responseTime: "Within 2 hours",
    image: "/professional-hairstylist-woman.png",
    specialties: ["Color", "Cuts", "Styling"],
    isVerified: true,
    availability: "Available today",
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    service: "Plumbing",
    rating: 4.8,
    reviews: 89,
    location: "Westside",
    distance: "4.1 miles",
    hourlyRate: 40000, // ₦40,000 instead of $80
    responseTime: "Within 1 hour",
    image: "/professional-plumber.png",
    specialties: ["Repairs", "Installation", "Emergency"],
    isVerified: true,
    availability: "Available tomorrow",
  },
  {
    id: 3,
    name: "David Chen",
    service: "Carpentry",
    rating: 5.0,
    reviews: 156,
    location: "Eastside",
    distance: "6.8 miles",
    hourlyRate: 30000, // ₦30,000 instead of $60
    responseTime: "Within 3 hours",
    image: "/professional-carpenter.png",
    specialties: ["Custom", "Furniture", "Repairs"],
    isVerified: true,
    availability: "Available this week",
  },
  {
    id: 4,
    name: "Lisa Park",
    service: "Electrical",
    rating: 4.7,
    reviews: 92,
    location: "Northside",
    distance: "3.5 miles",
    hourlyRate: 37500, // ₦37,500 instead of $75
    responseTime: "Within 2 hours",
    image: "/professional-electrician.png",
    specialties: ["Wiring", "Lighting", "Repairs"],
    isVerified: true,
    availability: "Available today",
  },
  {
    id: 5,
    name: "Tom Wilson",
    service: "Painting",
    rating: 4.6,
    reviews: 134,
    location: "Southside",
    distance: "5.2 miles",
    hourlyRate: 20000, // ₦20,000 instead of $40
    responseTime: "Within 4 hours",
    image: "/professional-painter.png",
    specialties: ["Interior", "Exterior", "Commercial"],
    isVerified: false,
    availability: "Available next week",
  },
  {
    id: 6,
    name: "Maria Garcia",
    service: "House Cleaning",
    rating: 4.8,
    reviews: 203,
    location: "Central",
    distance: "1.9 miles",
    hourlyRate: 12500, // ₦12,500 instead of $25
    responseTime: "Within 1 hour",
    image: "/professional-cleaner.png",
    specialties: ["Deep Clean", "Regular", "Move-out"],
    isVerified: true,
    availability: "Available today",
  },
]

const serviceCategories = [
  "All Services",
  "Hair Styling",
  "Plumbing",
  "Carpentry",
  "Electrical",
  "Painting",
  "House Cleaning",
  "Auto Repair",
  "Tech Support",
]

export function SearchAndBrowse() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Services")
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [selectedRating, setSelectedRating] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [availableToday, setAvailableToday] = useState(false)

  // Filter results based on current filters
  const filteredResults = searchResults.filter((artisan) => {
    const matchesSearch =
      searchQuery === "" ||
      artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "All Services" || artisan.service === selectedCategory
    const matchesPrice = artisan.hourlyRate >= priceRange[0] && artisan.hourlyRate <= priceRange[1]
    const matchesRating = selectedRating === "all" || artisan.rating >= Number.parseFloat(selectedRating)
    const matchesVerified = !verifiedOnly || artisan.isVerified
    const matchesAvailability = !availableToday || artisan.availability.includes("today")

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesVerified && matchesAvailability
  })

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "price-low":
        return a.hourlyRate - b.hourlyRate
      case "price-high":
        return b.hourlyRate - a.hourlyRate
      case "distance":
        return Number.parseFloat(a.distance) - Number.parseFloat(b.distance)
      case "reviews":
        return b.reviews - a.reviews
      default:
        return 0
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Artisan</h1>
        <p className="text-gray-600">Browse thousands of skilled professionals in your area</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 py-2 shadow-none">
        <CardContent className="p-6 py-1.5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for services, artisans, or specialties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border-gray-300 text-gray-900 hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:bg-primary/20"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Advanced Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label>Price Range (₦/hour)</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={50000}
                  min={0}
                  step={2500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₦{priceRange[0].toLocaleString()}</span>
                  <span>₦{priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <Label>Minimum Rating</Label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label>Additional Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                    <Label htmlFor="verified" className="text-sm">
                      Verified Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="available" checked={availableToday} onCheckedChange={setAvailableToday} />
                    <Label htmlFor="available" className="text-sm">
                      Available Today
                    </Label>
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="distance">Nearest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{sortedResults.length} artisans found</h2>
          {searchQuery && <p className="text-gray-600">Results for "{searchQuery}"</p>}
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "bg-primary hover:bg-primary/90 active:bg-primary/80"
                : "border-primary/20 text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/20"
            }
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "bg-primary hover:bg-primary/90 active:bg-primary/80"
                : "border-primary/20 text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/20"
            }
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {sortedResults.map((artisan) => (
          <Card
            key={artisan.id}
            className={`hover:shadow-lg transition-shadow py-0 ${viewMode === "list" ? "flex" : ""}`}
          >
            <div className={viewMode === "list" ? "flex w-full" : ""}>
              <div className={`${viewMode === "list" ? "w-32 h-32" : "aspect-square"} relative`}>
                <img
                  src={artisan.image || "/placeholder.svg"}
                  alt={artisan.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
                {artisan.isVerified && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-primary text-xs bg-white">
                    Verified
                  </Badge>
                )}
              </div>
              <CardContent className={`${viewMode === "list" ? "flex-1" : ""} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{artisan.name}</h3>
                    <p className="text-primary font-medium">{artisan.service}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{artisan.rating}</span>
                    <span className="text-sm text-gray-500">({artisan.reviews})</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {artisan.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {artisan.specialties.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{artisan.specialties.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {artisan.location} • {artisan.distance}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{artisan.responseTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>From ₦{artisan.hourlyRate.toLocaleString()}/hour</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">{artisan.availability}</span>
                  <Button asChild size="sm">
                    <Link href={`/artisan/${artisan.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {sortedResults.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No artisans found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse our categories</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All Services")
                setPriceRange([0, 50000])
                setSelectedRating("all")
                setVerifiedOnly(false)
                setAvailableToday(false)
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
