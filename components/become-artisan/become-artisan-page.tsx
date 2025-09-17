"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  DollarSign,
  Clock,
  Users,
  Star,
  Shield,
  Smartphone,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react"
import Link from "next/link"

export default function BecomeArtisanPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn More",
      description: "Set your own rates and keep 85% of what you earn. No hidden fees.",
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Work when you want, where you want. You're in complete control.",
    },
    {
      icon: Users,
      title: "Growing Customer Base",
      description: "Access thousands of customers actively looking for your services.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Get paid safely with our escrow system. Payment guaranteed on completion.",
    },
    {
      icon: Smartphone,
      title: "Easy to Use",
      description: "Manage your business with our intuitive mobile-friendly platform.",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Build your reputation and expand your client base with reviews and ratings.",
    },
  ]

  const steps = [
    {
      step: "1",
      title: "Sign Up",
      description: "Create your account in under 2 minutes. It's completely free to join.",
    },
    {
      step: "2",
      title: "Complete Your Profile",
      description: "Add your skills, experience, portfolio, and set your rates.",
    },
    {
      step: "3",
      title: "Get Verified",
      description: "Upload certifications and get verified to build trust with customers.",
    },
    {
      step: "4",
      title: "Start Earning",
      description: "Receive job requests, send quotes, and start building your business.",
    },
  ]

  const testimonials = [
    {
      name: "Marcus Johnson",
      service: "Plumber",
      image: "/professional-plumber.png",
      rating: 4.9,
      jobs: 127,
      quote: "I've doubled my income since joining Brikcell. The customers are great and payments are always on time.",
      earnings: "$4,200/month",
    },
    {
      name: "Sarah Chen",
      service: "Hair Stylist",
      image: "/professional-stylist.png",
      rating: 5.0,
      jobs: 89,
      quote: "The flexibility is amazing. I can work around my family schedule and still earn great money.",
      earnings: "$3,800/month",
    },
    {
      name: "David Rodriguez",
      service: "Carpenter",
      image: "/professional-carpenter.png",
      rating: 4.8,
      jobs: 156,
      quote: "Brikcell helped me grow from a weekend warrior to running my own carpentry business full-time.",
      earnings: "$5,600/month",
    },
  ]

  const services = [
    "Plumbing",
    "Carpentry",
    "Electrical",
    "Hair Styling",
    "Cleaning",
    "Painting",
    "Landscaping",
    "Auto Repair",
    "HVAC",
    "Roofing",
    "Flooring",
    "Photography",
  ]

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                  ✨ Join 1,000+ Successful Artisans
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Turn Your Skills Into a
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {" "}
                    Thriving Business
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Join Brikcell and connect with customers who need your expertise. Set your own rates, work on your
                  schedule, and grow your business with our trusted platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-8 py-4 text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-none"
                >
                  <Link href="/signup">Get Started - It's Free</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-300 hover:border-primary/30 hover:bg-primary/5 hover:text-primary px-8 py-4 text-lg font-medium bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-none"
                >
                  Learn More
                </Button>
              </div>

              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-xs">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Free to join</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">No monthly fees</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Keep 85% earnings</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl transform rotate-3"></div>
                <img
                  src="/professional-artisan-hero.png"
                  alt="Professional artisan at work"
                  className="relative rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm"
                />

                {/* Floating earnings card */}

                {/* Floating rating card */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Brikcell?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built the perfect platform for skilled professionals to grow their business and earn more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="group relative border-0 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:bg-white/80 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <CardContent className="relative p-8 space-y-4">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-none">
                      <benefit.icon className="h-7 w-7 text-primary group-hover:text-primary/90 transition-colors duration-300" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Getting started is simple. You can be earning within 24 hours.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">
              See how artisans like you are building successful businesses on Brikcell.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 py-0">
                <CardContent className="p-8 border shadow-none">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600">{testimonial.service}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(testimonial.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({testimonial.jobs} jobs)</span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">"{testimonial.quote}"</blockquote>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-800 font-semibold">Earning: {testimonial.earnings}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-primary/5 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">We Welcome All Skills</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whatever your expertise, there are customers actively looking for your services on our platform.
            </p>
          </div>

          <div className="backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 shadow-none bg-slate-50">
            <div className="flex flex-wrap justify-center gap-4">
              {services.map((service, index) => (
                <Badge
                  key={index}
                  className="px-6 py-3 text-sm font-medium bg-white/80 text-gray-700 border border-gray-200/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-md backdrop-blur-sm rounded-full"
                >
                  {service}
                </Badge>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-base text-[rgba(169,64,218,1)]">And many more specialized services...</p>
              <div className="mt-4 flex justify-center">
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 leading-relaxed">
            Join thousands of successful artisans who are building their business on Brikcell. Sign up today and start
            earning within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-3">
              <Link href="/signup">Start Your Free Account</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 bg-transparent"
            >
              <Link href="/search">Browse Existing Artisans</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>Trusted by 10,000+ artisans</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Start earning in 24 hours</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
