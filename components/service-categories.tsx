import { Card, CardContent } from "@/components/ui/card"
import {
  Wrench, Hammer, Scissors, Zap, Paintbrush, Car, Home, Laptop,
  Trees, Truck, Wind, Layers, Bug, Sofa, Waves, CookingPot,
  Dumbbell, Baby, Shirt, Camera, Shield,
  Code2, Smartphone, Palette, Film, Share2, PenLine, BarChart2,
  Headphones, BookOpen, Music, MonitorSmartphone, Lock,
} from "lucide-react"

const categories = [
  // ── Physical / Local ───────────────────────────────────────────
  { name: "Plumbing", icon: Wrench, description: "Pipes, fixtures, and water systems", count: "1,234 artisans" },
  { name: "Carpentry", icon: Hammer, description: "Custom furniture and woodwork", count: "856 artisans" },
  { name: "Hair Styling", icon: Scissors, description: "Cuts, colors, and treatments", count: "2,145 artisans" },
  { name: "Electrical", icon: Zap, description: "Wiring, lighting, and repairs", count: "967 artisans" },
  { name: "Painting", icon: Paintbrush, description: "Interior and exterior painting", count: "743 artisans" },
  { name: "Auto Repair", icon: Car, description: "Vehicle maintenance and fixes", count: "612 artisans" },
  { name: "House Cleaning", icon: Home, description: "Deep cleaning and maintenance", count: "1,876 artisans" },
  { name: "Tech Support", icon: Laptop, description: "Computer and device repairs", count: "534 artisans" },
  { name: "Landscaping", icon: Trees, description: "Gardens, lawns, and outdoor spaces", count: "428 artisans" },
  { name: "Moving Services", icon: Truck, description: "Packing, loading, and relocation", count: "312 artisans" },
  { name: "HVAC", icon: Wind, description: "Heating, cooling, and ventilation", count: "287 artisans" },
  { name: "Roofing", icon: Layers, description: "Roof installation and repairs", count: "198 artisans" },
  { name: "Pest Control", icon: Bug, description: "Eliminate pests and rodents", count: "245 artisans" },
  { name: "Interior Design", icon: Sofa, description: "Transform your living spaces", count: "391 artisans" },
  { name: "Pool Maintenance", icon: Waves, description: "Cleaning and pool upkeep", count: "143 artisans" },
  { name: "Catering & Cooking", icon: CookingPot, description: "Events, meal prep, and catering", count: "567 artisans" },
  { name: "Personal Training", icon: Dumbbell, description: "Fitness coaching and workout plans", count: "432 artisans" },
  { name: "Childcare", icon: Baby, description: "Babysitting and childcare services", count: "678 artisans" },
  { name: "Tailoring", icon: Shirt, description: "Alterations and custom clothing", count: "321 artisans" },
  { name: "Photography", icon: Camera, description: "Portraits, events, and product shots", count: "512 artisans" },
  { name: "Security & CCTV", icon: Shield, description: "Installation and monitoring", count: "189 artisans" },
  // ── Digital / Remote ───────────────────────────────────────────
  { name: "Web Development", icon: Code2, description: "Websites, apps, and web tools", count: "1,102 artisans" },
  { name: "Mobile App Dev", icon: Smartphone, description: "iOS and Android applications", count: "743 artisans" },
  { name: "Graphic Design", icon: Palette, description: "Visuals, layouts, and branding", count: "892 artisans" },
  { name: "Video Editing", icon: Film, description: "Cuts, effects, and post-production", count: "534 artisans" },
  { name: "Social Media Mgmt", icon: Share2, description: "Grow your online presence", count: "621 artisans" },
  { name: "Content Writing", icon: PenLine, description: "Articles, copy, and blog posts", count: "478 artisans" },
  { name: "SEO & Marketing", icon: BarChart2, description: "Rankings, ads, and growth", count: "356 artisans" },
  { name: "Virtual Assistant", icon: Headphones, description: "Admin, scheduling, and support", count: "412 artisans" },
  { name: "Tutoring", icon: BookOpen, description: "Academic help and coaching", count: "687 artisans" },
  { name: "Music Production", icon: Music, description: "Beats, mixing, and mastering", count: "234 artisans" },
  { name: "UI/UX Design", icon: MonitorSmartphone, description: "User interfaces and experiences", count: "398 artisans" },
  { name: "Cybersecurity", icon: Lock, description: "Security audits and protection", count: "167 artisans" },
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
