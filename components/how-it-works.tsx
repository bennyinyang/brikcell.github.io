import { Card, CardContent } from "@/components/ui/card"
import { Search, UserCheck, CreditCard, Star } from "lucide-react"

const steps = [
  {
    step: 1,
    title: "Search & Browse",
    description: "Find artisans by service type, location, and ratings",
    icon: Search,
  },
  {
    step: 2,
    title: "Review & Hire",
    description: "Check profiles, portfolios, and reviews before hiring",
    icon: UserCheck,
  },
  {
    step: 3,
    title: "Secure Payment",
    description: "Pay safely through our escrow system",
    icon: CreditCard,
  },
  {
    step: 4,
    title: "Rate & Review",
    description: "Share your experience to help others",
    icon: Star,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Brikcell Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Getting quality work done has never been easier. Follow these simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => {
            const IconComponent = step.icon
            return (
              <Card key={step.step} className="text-center shadow-none border">
                <CardContent className="p-8">
                  <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
