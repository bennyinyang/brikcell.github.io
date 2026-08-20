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
import {
  getArtisanProfile, 
  updateMyArtisanProfile, 
  getAuth, 
  uploadProfileImage,
  uploadMultipleFiles, 
} from "@/lib/api"

const serviceCategories = [
  // Trades & Construction
  "AC & HVAC Services",
  "Aluminium & Burglary Proof Works",
  "Carpentry & Furniture Making",
  "Electrical Installation & Repair",
  "Flooring & Tiling",
  "Generator Installation & Repair",
  "Glass & Glazing",
  "Interior Design & Decor",
  "Masonry & Bricklaying",
  "Painting & Decoration",
  "POP Ceiling & Plastering",
  "Plumbing & Pipe Fitting",
  "Roofing & Waterproofing",
  "Solar Panel Installation",
  "Wallpaper & Wall Art",
  "Welding & Metal Fabrication",
  "Window & Door Installation",
  // Home Services
  "Deep Cleaning & Sanitation",
  "Fumigation & Pest Control",
  "House Cleaning",
  "Laundry & Dry Cleaning",
  "Landscaping & Gardening",
  "Moving & Relocation",
  "Pool Cleaning & Maintenance",
  "Smart Home & CCTV Installation",
  // Automotive
  "Auto Body & Panel Beating",
  "Auto Detailing & Car Wash",
  "Auto Electrician",
  "Mechanic & Engine Repair",
  "Tyre & Wheel Services",
  // Beauty & Personal Care
  "Barbing & Men's Grooming",
  "Gele Tying & Event Styling",
  "Hair Braiding & Styling",
  "Lash & Brow Artistry",
  "Makeup & Bridal Beauty",
  "Massage & Spa Therapy",
  "Nail Technician & Manicure",
  // Technology & IT
  "Computer & Laptop Repair",
  "CCTV & Security Systems",
  "Graphic Design",
  "Network & Internet Setup",
  "Phone & Gadget Repair",
  "Web Design & Development",
  // Professional & Creative
  "Catering & Food Services",
  "Event Planning & Decoration",
  "Fashion Design & Tailoring",
  "Fitness Training & Coaching",
  "Music & DJ Services",
  "Photography & Videography",
  "Printing & Branding",
]

const experienceLevels = [
  { value: "beginner", label: "Beginner (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "experienced", label: "Experienced (5-10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
]

const POPULAR_CERTS: { category: string; items: string[] }[] = [
  {
    category: "Trade & Regulatory",
    items: [
      "COREN Registered Engineer",
      "CORBON Registered Builder",
      "NABTEB Trade Certificate",
      "City & Guilds Certificate",
      "Vocational Training Certificate (VTC)",
      "NEMSA Electrical License",
      "SON Certified",
    ],
  },
  {
    category: "Business & Legal",
    items: [
      "CAC Business Registration",
      "Licensed Professional",
      "Insured & Liability Covered",
      "Bonded",
      "Background Checked",
      "NAFDAC Certified",
      "FIRS Tax Clearance",
    ],
  },
  {
    category: "Safety & Health",
    items: [
      "First Aid Certified",
      "Safety Training Certificate",
      "Fire Safety Certificate",
      "Occupational Health & Safety (OHSAS)",
      "OSHA Certification",
      "Environmental Safety Certified",
    ],
  },
  {
    category: "Beauty & Wellness",
    items: [
      "CIBTAC Beauty Therapy Diploma",
      "Cosmetology & Skin Care Certificate",
      "Nail Technology Certification",
      "Massage Therapy Diploma",
    ],
  },
  {
    category: "Technology",
    items: [
      "CompTIA A+ Certified",
      "Cisco CCNA",
      "Google IT Support Certificate",
      "Microsoft Certified Professional",
      "AWS Cloud Practitioner",
      "Cybersecurity Certificate",
    ],
  },
  {
    category: "Automotive",
    items: [
      "NATA Automotive Technician",
      "Vehicle Inspection Officer License",
      "Automotive Electrician Certificate",
    ],
  },
]

type ContactMethod = "platform" | "direct"

export function ArtisanProfileSetup() {
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileImagePublicId, setProfileImagePublicId] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverImagePublicId, setCoverImagePublicId] = useState("")
  const [portfolioGallery, setPortfolioGallery] = useState<any[]>([])
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
  const [certInput, setCertInput] = useState("")
  const [servicePickerValue, setServicePickerValue] = useState("")
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
    currentStatus: "available",
    responseTime: "within_few_hours",
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
        const data = await getArtisanProfile(userId)
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
          currentStatus: data.profile?.currentStatus || "available",
          responseTime: data.profile?.responseTime || "within_few_hours",
          profileImage: null,
          workExperience: "",
        }))

        setProfileImageUrl(data.profile?.profileImage || "")
        setCoverImageUrl(data.profile?.cover_image || data.profile?.coverImage || "")
        setCoverImagePublicId(data.profile?.cover_image_public_id || "")
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

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "portfolio"
  ) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""

    if (type === "profile" && files[0]) {
      const toastId = toast.loading("Uploading profile image...")

      try {
        const uploaded = await uploadProfileImage(files[0])

        setFormData((prev) => ({
          ...prev,
          profileImage: files[0],
        }))

        setProfileImageUrl(uploaded.url)
        setProfileImagePublicId(uploaded.public_id)

        toast.success("Profile image uploaded", { id: toastId })
      } catch (error: any) {
        toast.error(error?.message || "Failed to upload profile image", {
          id: toastId,
        })
      }

      return
    }

    if (type === "portfolio" && files.length) {
      const toastId = toast.loading("Uploading portfolio images...")

      try {
        const uploaded = await uploadMultipleFiles(files)

        setFormData((prev) => ({
          ...prev,
          portfolioImages: [...prev.portfolioImages, ...files].slice(0, 10),
        }))

        setPortfolioGallery((prev) => [
          ...prev,
          ...uploaded.map((file) => ({
            url: file.url,
            public_id: file.public_id,
            original_name: file.original_name,
            resource_type: file.resource_type,
            mime_type: file.mime_type,
          })),
        ])

        toast.success("Portfolio uploaded", { id: toastId })
      } catch (error: any) {
        toast.error(error?.message || "Failed to upload portfolio", {
          id: toastId,
        })
      }
    }
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const toastId = toast.loading("Uploading cover image...")
    try {
      const uploaded = await uploadProfileImage(file)
      setCoverImageUrl(uploaded.url)
      setCoverImagePublicId(uploaded.public_id)
      // Persist immediately so navigating away doesn't lose the image
      await updateMyArtisanProfile({
        cover_image: uploaded.url,
        cover_image_public_id: uploaded.public_id,
      })
      toast.success("Cover image saved", { id: toastId })
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload cover image", { id: toastId })
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

  const handleSubmit = async () => {
    if (!token) {
      toast.error("You must be logged in to save your profile")
      return
    }
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
          profile_image: profileImageUrl || undefined,
          profileImage: profileImageUrl || undefined,
          profile_image_public_id: profileImagePublicId || undefined,
          profileImagePublicId: profileImagePublicId || undefined,
          cover_image: coverImageUrl || undefined,
          cover_image_public_id: coverImagePublicId || undefined,
          portfolio_gallery: portfolioGallery,
          portfolioGallery: portfolioGallery,
          certifications: formData.certifications,
          serviceRadius: formData.serviceRadius ? Number(formData.serviceRadius) : undefined,
          isRemoteAvailable: formData.isRemoteAvailable,
          preferredContactMethod: formData.preferredContactMethod,
          minimumJobValue: formData.minimumJobValue ? Number(formData.minimumJobValue) : undefined,
         currentStatus: formData.currentStatus,
          responseTime: formData.responseTime,
          skills: formData.services,
        },
        
      )
      
      console.log("Saving artisan profile image:", {
        profileImageUrl,
        profileImagePublicId,
      });

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
      <div className="max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto h-8 w-72 animate-pulse rounded bg-slate-100" />
          <div className="mx-auto mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mb-8">
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
            </div>
          ))}
          <div className="flex justify-end">
            <div className="h-11 w-32 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
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

      <div>
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
                {/* Cover image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Cover Image</Label>
                  <div
                    className="relative h-32 w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => document.getElementById("cover-image")?.click()}
                  >
                    {coverImageUrl ? (
                      <>
                        <img src={coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium flex items-center gap-1">
                            <Upload className="h-3.5 w-3.5" /> Change cover
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-400">
                        <Upload className="h-5 w-5" />
                        <span className="text-xs">Click to upload a cover image</span>
                        <span className="text-[10px]">Shown as the card banner when employers browse artisans</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                    id="cover-image"
                  />
                </div>

                {/* Profile photo */}
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
                  <p className="text-xs text-gray-500">Add other services you offer alongside your primary service</p>

                  <Select
                    value={servicePickerValue}
                    onValueChange={(value) => {
                      addService(value)
                      setServicePickerValue("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service to add…" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories
                        .filter((cat) => cat !== formData.primaryService && !formData.services.includes(cat))
                        .map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {formData.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.services.map((service) => (
                        <Badge key={service} variant="secondary" className="flex items-center gap-1 py-1 pl-2 pr-1">
                          <span>{service}</span>
                          <button
                            type="button"
                            onClick={() => removeService(service)}
                            className="rounded-full p-0.5 hover:bg-red-100 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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

                <div className="space-y-4">
                  <div>
                    <Label>Certifications & Credentials</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add licences, trade certificates, safety training, or any credential that builds trust with clients. These appear on your public profile.
                    </p>
                  </div>

                  {/* Custom input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a certification or credential name…"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const trimmed = certInput.trim()
                          if (trimmed) { addCertification(trimmed); setCertInput("") }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const trimmed = certInput.trim()
                        if (trimmed) { addCertification(trimmed); setCertInput("") }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Added certifications */}
                  {formData.certifications.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-600 mb-2">Added ({formData.certifications.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert) => (
                          <Badge key={cert} className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 py-1 pl-2.5 pr-1">
                            <Check className="h-3 w-3 shrink-0" />
                            <span>{cert}</span>
                            <button
                              type="button"
                              onClick={() => removeCertification(cert)}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-red-100 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular suggestions by category */}
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-slate-700">Popular Certifications: Click To Add</p>
                    {POPULAR_CERTS.map((group) => {
                      const available = group.items.filter((c) => !formData.certifications.includes(c))
                      if (available.length === 0) return null
                      return (
                        <div key={group.category}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                            {group.category}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {available.map((cert) => (
                              <button
                                key={cert}
                                type="button"
                                onClick={() => addCertification(cert)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                                {cert}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workExperience">Work Experience (*)</Label>
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
                  <Label htmlFor="currentStatus">Current Status</Label>
                  <Select
                    value={formData.currentStatus}
                    onValueChange={(value) => setFormData((p) => ({ ...p, currentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseTime">Response Time</Label>
                  <Select
                    value={formData.responseTime}
                    onValueChange={(value) => setFormData((p) => ({ ...p, responseTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="within_1_hour">Within 1 hour</SelectItem>
                      <SelectItem value="within_few_hours">Within a few hours</SelectItem>
                      <SelectItem value="within_1_day">Within a day</SelectItem>
                      <SelectItem value="within_few_days">Within a few days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  type="button"
                  onClick={handleSubmit}
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
      </div>
    </div>
  )
}