"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, ChevronLeft, ChevronRight, Check } from "lucide-react"
import {
  getMyProfile,
  updateMyProfile,
  updateMyEmployerProfessionalProfile,
  getAuth,
  uploadProfileImage,
  uploadDocument,
} from "@/lib/api"

const preferredCategories = [
  "Plumbing", "Carpentry", "Hair Styling", "Electrical",
  "Painting", "Auto Repair", "House Cleaning", "Tech Support",
  "Landscaping", "Moving Services",
]

const industries = [
  "Real Estate", "Hospitality", "Retail", "Construction",
  "Event Management", "Facility Management", "Individual/Homeowner", "Other",
]

const totalSteps = 3

function stepTitle(step: number) {
  if (step === 1) return "Personal Information"
  if (step === 2) return "Company Profile"
  return "Hiring Preferences"
}

export function EmployerProfileSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverImagePublicId, setCoverImagePublicId] = useState("")

  const [personal, setPersonal] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    state: "", city: "", address: "",
    avatar_url: "", avatar_public_id: "",
  })

  const [company, setCompany] = useState({
    company_name: "", industry: "", company_size: "",
    company_description: "", website: "",
    preferred_categories: [] as string[],
    state: "", city: "", address: "",
  })

  const [hiring, setHiring] = useState({
    hiring_frequency: "",
    average_budget: "",
    verification_document: "",
    verification_document_public_id: "",
  })

  useEffect(() => {
    getMyProfile()
      .then((p: any) => {
        const parts = String(p?.name || "").trim().split(" ").filter(Boolean)
        const ep = p?.employerProfile || {}
        setPersonal({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: p?.email || "",
          phone: p?.phone || "",
          state: p?.state || "",
          city: p?.city || "",
          address: p?.address || "",
          avatar_url: p?.avatar_url || "",
          avatar_public_id: p?.avatar_public_id || "",
        })
        setAvatarUrl(p?.avatar_url || "")
        setCoverImageUrl(ep?.cover_image || "")
        setCoverImagePublicId(ep?.cover_image_public_id || "")
        setCompany({
          company_name: ep?.company_name || p?.company_name || "",
          industry: ep?.industry || "",
          company_size: ep?.company_size || "",
          company_description: ep?.company_description || "",
          website: ep?.website || "",
          preferred_categories: Array.isArray(ep?.preferred_categories)
            ? ep.preferred_categories : [],
          state: ep?.state || p?.state || "",
          city: ep?.city || p?.city || "",
          address: ep?.address || p?.address || "",
        })
        setHiring({
          hiring_frequency: ep?.hiring_frequency || "",
          average_budget: ep?.average_budget != null ? String(ep.average_budget) : "",
          verification_document: ep?.verification_document || "",
          verification_document_public_id: ep?.verification_document_public_id || "",
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleAvatarUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const id = toast.loading("Uploading photo...")
    try {
      const res = await uploadProfileImage(file)
      setAvatarUrl(res.url)
      setPersonal((p) => ({ ...p, avatar_url: res.url, avatar_public_id: res.public_id }))
      toast.success("Photo uploaded", { id })
    } catch (e: any) {
      toast.error(e?.message || "Upload failed", { id })
    }
  }

  const handleCoverImageUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const id = toast.loading("Uploading cover image...")
    try {
      const res = await uploadProfileImage(file)
      setCoverImageUrl(res.url)
      setCoverImagePublicId(res.public_id)
      toast.success("Cover image uploaded", { id })
    } catch (e: any) {
      toast.error(e?.message || "Upload failed", { id })
    }
  }

  const handleDocUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const id = toast.loading("Uploading document...")
    try {
      const res = await uploadDocument(file)
      setHiring((p) => ({
        ...p,
        verification_document: res.url,
        verification_document_public_id: res.public_id,
      }))
      toast.success("Document uploaded", { id })
    } catch (e: any) {
      toast.error(e?.message || "Upload failed", { id })
    }
  }

  const toggleCategory = (cat: string) => {
    setCompany((p) => ({
      ...p,
      preferred_categories: p.preferred_categories.includes(cat)
        ? p.preferred_categories.filter((c) => c !== cat)
        : [...p.preferred_categories, cat],
    }))
  }

  const saveAndAdvance = async () => {
    setIsSaving(true)
    try {
      if (currentStep === 1) {
        await updateMyProfile({
          name: `${personal.firstName} ${personal.lastName}`.trim(),
          email: personal.email,
          phone: personal.phone,
          state: personal.state,
          city: personal.city,
          address: personal.address,
          avatar_url: personal.avatar_url,
          avatar_public_id: personal.avatar_public_id,
        })
      } else if (currentStep === 2) {
        await updateMyEmployerProfessionalProfile({
          company_name: company.company_name,
          industry: company.industry,
          company_size: company.company_size,
          company_description: company.company_description,
          website: company.website,
          preferred_categories: company.preferred_categories,
          state: company.state,
          city: company.city,
          address: company.address,
          cover_image: coverImageUrl || null,
          cover_image_public_id: coverImagePublicId || null,
        })
      } else {
        await updateMyEmployerProfessionalProfile({
          hiring_frequency: hiring.hiring_frequency,
          average_budget: hiring.average_budget || null,
          verification_document: hiring.verification_document,
          verification_document_public_id: hiring.verification_document_public_id,
        })
        toast.success("Profile complete!")
        router.push("/dashboard/customer")
        return
      }
      toast.success("Saved")
      setCurrentStep((s) => s + 1)
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  const progress = (currentStep / totalSteps) * 100

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 text-center">
          <div className="mx-auto h-7 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mx-auto mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mx-auto mb-6 h-2 w-full max-w-lg animate-pulse rounded-full bg-slate-100" />
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-10 w-full animate-pulse rounded-md bg-slate-100" />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <div className="h-10 w-24 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Help artisans understand your needs so they can serve you better
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            {stepTitle(currentStep)}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {currentStep === 1 && (
            <>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} alt="avatar" className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {(personal.firstName[0] ?? "") + (personal.lastName[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarUpload(e.target.files)}
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    Upload photo
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">First name *</Label>
                  <Input value={personal.firstName} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last name *</Label>
                  <Input value={personal.lastName} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={personal.email} onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Phone number</Label>
                <Input value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} placeholder="+234 800 000 0000" />
                <p className="text-[11px] text-slate-400">Not visible to the public.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input value={personal.state} onChange={(e) => setPersonal((p) => ({ ...p, state: e.target.value }))} placeholder="State" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={personal.city} onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input value={personal.address} onChange={(e) => setPersonal((p) => ({ ...p, address: e.target.value }))} placeholder="Street address" />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Cover image */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Cover Image</Label>
                <div
                  className="relative h-32 w-full overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => document.getElementById("employer-cover-image")?.click()}
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
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Click to upload a cover image</span>
                      <span className="text-[10px]">Shown as the banner on your job cards</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="employer-cover-image"
                  className="hidden"
                  onChange={(e) => handleCoverImageUpload(e.target.files)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Company / Organisation name</Label>
                <Input value={company.company_name} onChange={(e) => setCompany((p) => ({ ...p, company_name: e.target.value }))} placeholder="Acme Corp (leave blank if individual)" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Industry *</Label>
                <Select value={company.industry} onValueChange={(v) => setCompany((p) => ({ ...p, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Company size</Label>
                <Select value={company.company_size} onValueChange={(v) => setCompany((p) => ({ ...p, company_size: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="1-10">1–10 employees</SelectItem>
                    <SelectItem value="11-50">11–50 employees</SelectItem>
                    <SelectItem value="51-200">51–200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Company description</Label>
                <Textarea
                  value={company.company_description}
                  onChange={(e) => setCompany((p) => ({ ...p, company_description: e.target.value }))}
                  placeholder="Tell artisans about your company or what you typically need done"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Website</Label>
                <Input value={company.website} onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))} placeholder="https://example.com" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Services you typically hire for</Label>
                <div className="flex flex-wrap gap-2">
                  {preferredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        company.preferred_categories.includes(cat)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary/40"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input value={company.state} onChange={(e) => setCompany((p) => ({ ...p, state: e.target.value }))} placeholder="State" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={company.city} onChange={(e) => setCompany((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">How often do you hire? *</Label>
                <Select value={hiring.hiring_frequency} onValueChange={(v) => setHiring((p) => ({ ...p, hiring_frequency: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time projects</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="ongoing">Ongoing / Regular hiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Average project budget (₦)</Label>
                <Input
                  type="number"
                  min={0}
                  value={hiring.average_budget}
                  onChange={(e) => setHiring((p) => ({ ...p, average_budget: e.target.value }))}
                  placeholder="e.g. 50000"
                />
                <p className="text-[11px] text-slate-400">Helps artisans understand your budget range.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Verification document (optional)</Label>
                <p className="text-[11px] text-slate-400">
                  Upload a CAC certificate, business ID, or any document that verifies your business. This boosts trust with artisans.
                </p>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleDocUpload(e.target.files)}
                  />
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    <br />PDF, DOC, PNG, JPG
                  </div>
                </label>
                {hiring.verification_document && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Document uploaded —{" "}
                    <a href={hiring.verification_document} target="_blank" rel="noreferrer" className="font-medium underline">
                      View
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (currentStep > 1 ? setCurrentStep((s) => s - 1) : router.push("/dashboard/customer"))}
          disabled={isSaving}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 1 ? "Back to dashboard" : "Previous"}
        </Button>

        <Button onClick={saveAndAdvance} disabled={isSaving} className="gap-1.5 bg-primary hover:bg-primary/90">
          {currentStep < totalSteps ? (
            <>Save & Continue <ChevronRight className="h-4 w-4" /></>
          ) : (
            <>Complete Profile <Check className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  )
}
