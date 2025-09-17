"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Star, CheckCircle, Send } from "lucide-react"

interface ReviewInterfaceProps {
  jobId: string
}

// Mock job data
const jobData = {
  id: "job-123",
  title: "Kitchen Plumbing Repair",
  description: "Fix leaking kitchen sink and replace faucet",
  artisan: {
    name: "Mike Rodriguez",
    avatar: "/professional-plumber.png",
    service: "Plumbing",
  },
  completedDate: "2024-01-15",
  totalCost: 150,
  status: "completed",
}

const reviewCategories = [
  { key: "quality", label: "Quality of Work" },
  { key: "communication", label: "Communication" },
  { key: "timeliness", label: "Timeliness" },
  { key: "professionalism", label: "Professionalism" },
  { key: "value", label: "Value for Money" },
]

export function ReviewInterface({ jobId }: ReviewInterfaceProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [overallRating, setOverallRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingChange = (category: string, rating: number) => {
    const newRatings = { ...ratings, [category]: rating }
    setRatings(newRatings)

    // Calculate overall rating
    const totalRatings = Object.values(newRatings)
    const average =
      totalRatings.length > 0 ? totalRatings.reduce((sum, rating) => sum + rating, 0) / totalRatings.length : 0
    setOverallRating(Math.round(average * 10) / 10)
  }

  const handleSubmitReview = async () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      console.log("Review submitted:", {
        jobId,
        ratings,
        overallRating,
        reviewText,
        isPublic,
        wouldRecommend,
      })
    }, 2000)
  }

  const StarRating = ({
    rating,
    onRatingChange,
    size = "md",
  }: {
    rating: number
    onRatingChange: (rating: number) => void
    size?: "sm" | "md" | "lg"
  }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${sizeClasses[size]} transition-colors ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave a Review</h1>
        <p className="text-gray-600">Share your experience to help other customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Job Completed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{jobData.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{jobData.description}</p>
                <div className="text-sm text-gray-500">
                  <p>Completed: {jobData.completedDate}</p>
                  <p>Total Cost: ${jobData.totalCost}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={jobData.artisan.avatar || "/placeholder.svg"} alt={jobData.artisan.name} />
                  <AvatarFallback>
                    {jobData.artisan.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{jobData.artisan.name}</h4>
                  <p className="text-sm text-primary">{jobData.artisan.service}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rate Your Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Rating */}
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Overall Rating</h3>
                <div className="flex justify-center mb-2">
                  <StarRating rating={overallRating} onRatingChange={setOverallRating} size="lg" />
                </div>
                <p className="text-2xl font-bold text-primary">{overallRating}/5</p>
              </div>

              {/* Category Ratings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Rate Each Aspect</h3>
                {reviewCategories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between">
                    <span className="font-medium">{category.label}</span>
                    <StarRating
                      rating={ratings[category.key] || 0}
                      onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                    />
                  </div>
                ))}
              </div>

              {/* Written Review */}
              <div className="space-y-2">
                <label className="font-semibold">Write Your Review</label>
                <Textarea
                  placeholder="Share details about your experience. What went well? What could be improved?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                />
                <p className="text-sm text-gray-500">{reviewText.length}/500 characters</p>
              </div>

              {/* Recommendation */}
              <div className="space-y-3">
                <label className="font-semibold">Would you recommend {jobData.artisan.name}?</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setWouldRecommend(true)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      wouldRecommend === true
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    Yes, I recommend
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldRecommend(false)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      wouldRecommend === false
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300 hover:border-red-300"
                    }`}
                  >
                    No, I don't recommend
                  </button>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="public" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                <label htmlFor="public" className="text-sm">
                  Make this review public (helps other customers)
                </label>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitReview}
                disabled={overallRating === 0 || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Send className="h-4 w-4 mr-2 animate-pulse" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Review Guidelines</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be honest and constructive in your feedback</li>
                  <li>• Focus on the work quality and professionalism</li>
                  <li>• Avoid personal attacks or inappropriate language</li>
                  <li>• Your review helps other customers make informed decisions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
