"use client"

import type React from "react"
import { useEffect, useState,  useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Plus, MapPin, DollarSign, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { getArtisanProfile, updateMyArtisanProfile, getAuth } from "@/lib/api"

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

const experienceLevels = [
  { value: "beginner", label: "Beginner (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "experienced", label: "Experienced (5-10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
]

const certificationTypes = [
  "Licensed Professional",
  "Insured",
  "Background Checked",
  "Trade Certification",
  "Safety Training",
  "First Aid Certified",
  "Business License",
  "Bonded",
]

type ContactMethod = "platform" | "direct"

export function ArtisanProfileSetup() {
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()
    if (auth) {
      setToken(auth.token)
      setUserId(auth.user?.id ?? null)  
    }
  }, [])

  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(() => {
  const auth = getAuth()
    return !!auth?.user?.id  
  })
  const [profileImageUrl, setProfileImageUrl] = useState("")

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: null as File | null,

    primaryService: "",
    services: [] as string[],
    bio: "",
    experience: "",
    hourlyRate: "",

    location: "",
    serviceRadius: "10",
    isRemoteAvailable: false,
    availability: {
      monday: { available: true, start: "09:00", end: "17:00" },
      tuesday: { available: true, start: "09:00", end: "17:00" },
      wednesday: { available: true, start: "09:00", end: "17:00" },
      thursday: { available: true, start: "09:00", end: "17:00" },
      friday: { available: true, start: "09:00", end: "17:00" },
      saturday: { available: false, start: "09:00", end: "17:00" },
      sunday: { available: false, start: "09:00", end: "17:00" },
    },

    portfolioImages: [] as File[],
    certifications: [] as string[],
    workExperience: "",

    minimumJobValue: "",
    preferredContactMethod: "platform" as ContactMethod,
    instantBooking: false,
  })

  useEffect(() => {

    if (!userId || !token) return

    let cancelled = false

    const loadProfile = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getArtisanProfile(userId, token ?? undefined)
        if (cancelled) return

        const [firstName, ...rest] = String(data.user?.name || "").split(" ")
        const lastName = rest.join(" ")

        setFormData((prev) => ({
          ...prev,
          firstName: firstName || "",
          lastName: lastName || "",
          email: data.user?.email || "",
          phone: "",
          primaryService: data.profile?.service_type || data.profile?.primaryService || "",
          services: Array.isArray(data.profile?.skills) ? data.profile.skills : [],
          bio: data.profile?.bio || "",
          experience: data.profile?.experience || "",
          hourlyRate: data.profile?.hourlyRate != null ? String(data.profile.hourlyRate) : "",
          location: data.profile?.location || "",
          serviceRadius: data.profile?.serviceRadius != null ? String(data.profile.serviceRadius) : "10",
          isRemoteAvailable: Boolean(data.profile?.isRemoteAvailable),
          certifications: Array.isArray(data.profile?.certifications) ? data.profile.certifications : [],
          minimumJobValue: data.profile?.minimumJobValue != null ? String(data.profile.minimumJobValue) : "",
          preferredContactMethod: (data.profile?.preferredContactMethod as ContactMethod) || "platform",
          instantBooking: Boolean(data.profile?.instantBooking),
          profileImage: null,
          workExperience: "",
        }))

        setProfileImageUrl(data.profile?.profileImage || "")
      } catch (error) {
        console.error("Failed to load artisan profile:", error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId, token])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "portfolio") => {
    const files = Array.from(e.target.files || [])

    if (type === "profile" && files[0]) {
      setFormData((prev) => ({ ...prev, profileImage: files[0] }))
      setProfileImageUrl(URL.createObjectURL(files[0]))
      return
    }

    if (type === "portfolio") {
      setFormData((prev) => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...files].slice(0, 10),
      }))
    }
  }

  const removePortfolioImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }))
  }

  const addService = (service: string) => {
    if (!service || formData.services.includes(service)) return
    setFormData((prev) => ({ ...prev, services: [...prev.services, service] }))
  }

  const removeService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== service),
    }))
  }

  const addCertification = (cert: string) => {
    if (!cert || formData.certifications.includes(cert)) return
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, cert],
    }))
  }

  const removeCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }))
  }

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, totalSteps))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("You must be logged in to save your profile") // ← surface the error
      return
    }
    console.log("Form submitted")
    setIsSaving(true)

    try {
      console.log('Form data:', formData)
      await updateMyArtisanProfile(
        {
          bio: formData.bio,
          service_type: formData.primaryService || undefined,
          location: formData.location,
          hourly_rate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
          experience: formData.experience,
          profileImage: profileImageUrl || undefined,
          certifications: formData.certifications,
          serviceRadius: formData.serviceRadius ? Number(formData.serviceRadius) : undefined,
          isRemoteAvailable: formData.isRemoteAvailable,
          preferredContactMethod: formData.preferredContactMethod,
          instantBooking: formData.instantBooking,
          minimumJobValue: formData.minimumJobValue ? Number(formData.minimumJobValue) : undefined,
          skills: formData.services,
        },
        token
      )

      console.log("Profile updated successfully")
      toast.success("Profile updated successfully")
      router.push("/dashboard/artisan")
    } catch (error) {
      console.error("Failed to update artisan profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Artisan Profile</h1>
        <p className="text-gray-600">Help customers find and hire you by showcasing your skills and experience</p>
      </div>

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
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Professional Details"}
              {currentStep === 3 && "Portfolio & Certifications"}
              {currentStep === 4 && "Availability & Preferences"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImageUrl || undefined} />
                    <AvatarFallback>
                      {formData.firstName[0] ?? ""}
                      {formData.lastName[0] ?? ""}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "profile")}
                      className="hidden"
                      id="profile-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("profile-image")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Profile Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Service Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="location"
                      placeholder="Enter your city or area"
                      value={formData.location}
                      onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Service *</Label>
                  <Select
                    value={formData.primaryService}
                    onValueChange={(value) => setFormData((p) => ({ ...p, primaryService: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your main service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Additional Services (Optional)</Label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.services.map((service) => (
                      <Badge key={service} variant="secondary" className="flex items-center space-x-1">
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {serviceCategories
                      .filter(
                        (cat) => cat !== formData.primaryService && !formData.services.includes(cat)
                      )
                      .map((service) => (
                        <Button
                          key={service}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addService(service)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {service}
                        </Button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell customers about your experience..."
                    value={formData.bio}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Experience Level *</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData((p) => ({ ...p, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="25"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData((p) => ({ ...p, hourlyRate: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    This will be your starting rate. You can adjust it for specific jobs.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Portfolio Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload photos of your work to showcase your skills
                    </p>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "portfolio")}
                      className="hidden"
                      id="portfolio-upload"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("portfolio-upload")?.click()}
                    >
                      Choose Images
                    </Button>

                    <p className="text-xs text-gray-500 mt-2">Max 10 images</p>
                  </div>

                  {formData.portfolioImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      {formData.portfolioImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePortfolioImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Certifications & Credentials</Label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary" className="flex items-center space-x-1">
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {certificationTypes
                      .filter((c) => !formData.certifications.includes(c))
                      .map((cert) => (
                        <Button
                          key={cert}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCertification(cert)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {cert}
                        </Button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workExperience">Work Experience (Optional)</Label>
                  <Textarea
                    id="workExperience"
                    placeholder="Describe your relevant work experience..."
                    value={formData.workExperience}
                    onChange={(e) => setFormData((p) => ({ ...p, workExperience: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceRadius">Service Radius</Label>
                  <Select
                    value={formData.serviceRadius}
                    onValueChange={(value) => setFormData((p) => ({ ...p, serviceRadius: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="100">100+ miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={formData.isRemoteAvailable}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, isRemoteAvailable: checked as boolean }))
                    }
                  />
                  <Label htmlFor="remote">I can work remotely for some services</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumJobValue">Minimum Job Value (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="minimumJobValue"
                      type="number"
                      placeholder="50"
                      value={formData.minimumJobValue}
                      onChange={(e) => setFormData((p) => ({ ...p, minimumJobValue: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Set a minimum job value to filter out small projects
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instantBooking"
                    checked={formData.instantBooking}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, instantBooking: checked as boolean }))
                    }
                  />
                  <Label htmlFor="instantBooking">Allow instant booking for simple jobs</Label>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Contact Method</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="platform-contact"
                        name="contact"
                        value="platform"
                        checked={formData.preferredContactMethod === "platform"}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            preferredContactMethod: e.target.value as ContactMethod,
                          }))
                        }
                      />
                      <Label htmlFor="platform-contact">Through Brikcell platform (Recommended)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="direct-contact"
                        name="contact"
                        value="direct"
                        checked={formData.preferredContactMethod === "direct"}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            preferredContactMethod: e.target.value as ContactMethod,
                          }))
                        }
                      />
                      <Label htmlFor="direct-contact">Direct contact allowed</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <Button
                  type="submit"
                  disabled={isSaving || !formData.firstName || !formData.lastName || !formData.email || !formData.location}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      Complete Profile
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}