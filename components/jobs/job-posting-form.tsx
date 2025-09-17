"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Upload, X, MapPin, CalendarIcon, DollarSign, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { format } from "date-fns"

const serviceCategories = [
  "Plumbing",
  "Carpentry",
  "Hair Styling",
  "Electrical",
  "Painting",
  "Auto Repair",
  "House Cleaning",
  "Tech Support",
  "Landscaping",
  "Moving Services",
]

const urgencyLevels = [
  { value: "low", label: "Within a week", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Within 3 days", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Within 24 hours", color: "bg-orange-100 text-orange-800" },
  { value: "emergency", label: "Emergency (ASAP)", color: "bg-red-100 text-red-800" },
]

export function JobPostingForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    budget: "",
    budgetType: "fixed", // fixed or hourly
    deadline: undefined as Date | undefined,
    urgency: "",
    requirements: [] as string[],
    images: [] as File[],
    isRemote: false,
    contactPreference: "platform", // platform or direct
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5), // Max 5 images
    }))
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const addRequirement = (requirement: string) => {
    if (requirement && !formData.requirements.includes(requirement)) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirement],
      }))
    }
  }

  const removeRequirement = (requirement: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((req) => req !== requirement),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission - redirect to checkout
    console.log("Job posting data:", formData)
    // In a real app, this would create the job and redirect to payment
    window.location.href = "/checkout"
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-600">Tell us about your project and find the perfect artisan</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Job Details"}
              {currentStep === 2 && "Location & Timeline"}
              {currentStep === 3 && "Budget & Requirements"}
              {currentStep === 4 && "Review & Submit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Job Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fix leaking kitchen faucet"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail. Include what needs to be done, any specific requirements, and what materials might be needed."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Images (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload photos to help artisans understand your project</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      Choose Images
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Max 5 images, up to 10MB each</p>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image) || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location & Timeline */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="location"
                      placeholder="Enter your address or area"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={formData.isRemote}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isRemote: checked as boolean }))}
                  />
                  <Label htmlFor="remote">This job can be done remotely</Label>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, deadline: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Urgency Level *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {urgencyLevels.map((level) => (
                      <div
                        key={level.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          formData.urgency === level.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, urgency: level.value }))}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{level.label}</span>
                          <Badge className={level.color}>{level.value}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget & Requirements */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Budget Type *</Label>
                  <div className="flex space-x-4">
                    <div
                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.budgetType === "fixed"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, budgetType: "fixed" }))}
                    >
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">Fixed Price</h3>
                          <p className="text-sm text-gray-600">One-time payment for the entire project</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.budgetType === "hourly"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, budgetType: "hourly" }))}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">Hourly Rate</h3>
                          <p className="text-sm text-gray-600">Pay by the hour worked</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">
                    {formData.budgetType === "fixed" ? "Project Budget *" : "Hourly Budget *"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder={formData.budgetType === "fixed" ? "500" : "25"}
                      value={formData.budget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.budgetType === "fixed"
                      ? "Total amount you're willing to pay for this project"
                      : "Maximum hourly rate you're willing to pay"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Special Requirements (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.requirements.map((req) => (
                      <Badge key={req} variant="secondary" className="flex items-center space-x-1">
                        <span>{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(req)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Licensed & Insured",
                      "Background Check",
                      "Own Tools",
                      "Experience Certificate",
                      "References Available",
                    ].map((req) => (
                      <Button
                        key={req}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addRequirement(req)}
                        disabled={formData.requirements.includes(req)}
                      >
                        {req}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contact Preference</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="platform"
                        name="contact"
                        value="platform"
                        checked={formData.contactPreference === "platform"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactPreference: e.target.value }))}
                      />
                      <Label htmlFor="platform">Through Brikcell platform (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="direct"
                        name="contact"
                        value="direct"
                        checked={formData.contactPreference === "direct"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactPreference: e.target.value }))}
                      />
                      <Label htmlFor="direct">Direct contact allowed</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Job Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Title</p>
                      <p className="font-medium">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">{formData.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{formData.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Budget</p>
                      <p className="font-medium">
                        ${formData.budget} {formData.budgetType === "hourly" ? "/hour" : "total"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deadline</p>
                      <p className="font-medium">
                        {formData.deadline ? format(formData.deadline, "PPP") : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Urgency</p>
                      <p className="font-medium">{formData.urgency}</p>
                    </div>
                  </div>

                  {formData.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                  )}

                  {formData.requirements.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.requirements.map((req) => (
                          <Badge key={req} variant="secondary">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary">What happens next?</h4>
                      <ul className="text-sm text-primary/80 mt-2 space-y-1">
                        <li>• You'll be redirected to secure payment</li>
                        <li>• Your payment will be held in escrow</li>
                        <li>• Your job will be posted and visible to qualified artisans</li>
                        <li>• You'll receive proposals from interested artisans</li>
                        <li>• Choose your preferred artisan and start the project</li>
                        <li>• Payment is released when you're satisfied with the work</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit">
                  Continue to Payment
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
