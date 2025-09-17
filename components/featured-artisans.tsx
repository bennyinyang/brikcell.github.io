import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Clock } from "lucide-react"

const featuredArtisans = [
  {
    id: 1,
    name: "Sarah Johnson",
    service: "Hair Styling",
    rating: 4.9,
    reviews: 127,
    location: "Downtown",
    experience: "8 years",
    price: "From $45",
    image: "/professional-hairstylist-woman.png",
    specialties: ["Color", "Cuts", "Styling"],
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    service: "Plumbing",
    rating: 4.8,
    reviews: 89,
    location: "Westside",
    experience: "12 years",
    price: "From $80",
    image: "/professional-plumber.png",
    specialties: ["Repairs", "Installation", "Emergency"],
  },
  {
    id: 3,
    name: "David Chen",
    service: "Carpentry",
    rating: 5.0,
    reviews: 156,
    location: "Eastside",
    experience: "15 years",
    price: "From $60",
    image: "/professional-carpenter.png",
    specialties: ["Custom", "Furniture", "Repairs"],
  },
]

export function FeaturedArtisans() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Artisans</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet some of our top-rated professionals ready to help with your projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredArtisans.map((artisan) => (
            <Card key={artisan.id} className="overflow-hidden hover:shadow-lg transition-shadow py-0">
              <div className="aspect-square relative">
                <img
                  src={artisan.image || "/placeholder.svg"}
                  alt={artisan.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{artisan.name}</h3>
                    <p className="text-primary font-medium">{artisan.service}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{artisan.rating}</span>
                    <span className="text-sm text-gray-500">({artisan.reviews})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{artisan.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{artisan.experience}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {artisan.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">{artisan.price}</span>
                  <Button>View Profile</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Artisans
          </Button>
        </div>
      </div>
    </section>
  )
}
