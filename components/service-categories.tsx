import { Card, CardContent } from "@/components/ui/card"
import { Wrench, Hammer, Scissors, Zap, Paintbrush, Car, Home, Laptop } from "lucide-react"

const categories = [
  {
    name: "Plumbing",
    icon: Wrench,
    description: "Pipes, fixtures, and water systems",
    count: "1,234 artisans",
  },
  {
    name: "Carpentry",
    icon: Hammer,
    description: "Custom furniture and woodwork",
    count: "856 artisans",
  },
  {
    name: "Hair Styling",
    icon: Scissors,
    description: "Cuts, colors, and treatments",
    count: "2,145 artisans",
  },
  {
    name: "Electrical",
    icon: Zap,
    description: "Wiring, lighting, and repairs",
    count: "967 artisans",
  },
  {
    name: "Painting",
    icon: Paintbrush,
    description: "Interior and exterior painting",
    count: "743 artisans",
  },
  {
    name: "Auto Repair",
    icon: Car,
    description: "Vehicle maintenance and fixes",
    count: "612 artisans",
  },
  {
    name: "Home Cleaning",
    icon: Home,
    description: "Deep cleaning and maintenance",
    count: "1,876 artisans",
  },
  {
    name: "Tech Support",
    icon: Laptop,
    description: "Computer and device repairs",
    count: "534 artisans",
  },
]

export function ServiceCategories() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Find Experts in Every Field</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse our wide range of services and connect with skilled artisans in your area
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card
                key={category.name}
                className="relative overflow-hidden bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:bg-white/90"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 my-0 py-0" />

                <CardContent className="relative p-8 text-center">
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-primary/5">
                    <IconComponent className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed font-medium">{category.description}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {category.count}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
