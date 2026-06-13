"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, X, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createServiceListing, getAuth, type ServiceType } from "@/lib/api"

import { Header } from "@/components/header"

const serviceTypes: { label: string; value: ServiceType }[] = [
  { label: "Home service", value: "general" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Carpentry", value: "carpentry" },
  { label: "Electrical", value: "electrical" },
  { label: "Painting", value: "painting" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Hair Styling", value: "hairstyling" },
  { label: "Auto Repair", value: "autorepair" },
  { label: "Tech Support", value: "techsupport" },
]

const suggestedTags = ["Home service", "Wood work", "Home service", "Painting"]

function labelFromServiceType(value: string) {
  return serviceTypes.find((item) => item.value === value)?.label || value
}

export default function PostServicePage() {
  const router = useRouter()
  const auth = getAuth()

  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    serviceTypeOne: "" as ServiceType | "",
    serviceTypeTwo: "" as ServiceType | "",
    description: "",
    budget: "",
    isNegotiable: false,
    includesMaterialAmount: false,
    deadline: "",
    location: "",
    tags: ["Home service", "Wood work", "Home service", "Painting"] as string[],
    files: [] as File[],
  })

  const previewUrls = useMemo(() => {
    return formData.files.map((file) => URL.createObjectURL(file))
  }, [formData.files])

  const addTag = (tag: string) => {
    if (!tag) return
    if (formData.tags.includes(tag)) return

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }))
  }

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...files].slice(0, 5),
    }))
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }))
  }

  const buildPayload = (status: "draft" | "published") => {
    const selectedService = formData.serviceTypeOne || formData.serviceTypeTwo || "general"

    return {
      title: formData.title.trim(),
      service_type: selectedService,
      location: formData.location.trim() || undefined,
      description: formData.description.trim(),
      requirements: formData.tags.join(", "),
      budget_min: formData.budget ? Number(formData.budget) : undefined,
      budget_max: formData.budget ? Number(formData.budget) : undefined,
      status,
      budget_type: "fixed" as const,
      deadline: formData.deadline || undefined,
      is_negotiable: formData.isNegotiable,
      includes_material_amount: formData.includesMaterialAmount,
      tags: formData.tags,
      files: formData.files,
    }
  }

  const handleSubmit = async (status: "draft" | "published") => {
    if (!auth?.token) {
      toast.error("You must be logged in to post a service")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Service title is required")
      return
    }

    if (!formData.serviceTypeOne && !formData.serviceTypeTwo) {
      toast.error("Please select a service type")
      return
    }

    if (status === "published" && !formData.description.trim()) {
      toast.error("Description is required before publishing")
      return
    }

    try {
      setIsSaving(true)

      await createServiceListing(buildPayload(status), auth.token)

      toast.success(status === "draft" ? "Service saved as draft" : "Service published successfully")

      router.push("/dashboard/artisan")
    } catch (error: any) {
      console.error("Failed to create service:", error)
      toast.error(error?.message || "Failed to save service")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-64px)] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block">
            <nav className="space-y-2 text-sm text-slate-700">
              <a href="/dashboard/artisan" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Dashboard
              </a>
              <a href="/dashboard/jobs" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Browse Gigs
              </a>
              <a href="/dashboard/bookings" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                My Bookings
              </a>
              <a
                href="/dashboard/services/post"
                className="block rounded-md bg-slate-50 px-3 py-2 font-medium text-slate-950"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                Post Service
              </a>
              <a href="/dashboard/wallet" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Wallet
              </a>
              <a href="/dashboard/settings" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Settings
              </a>
              <a href="/support" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Support
              </a>
            </nav>
          </aside>

          {/* Body */}
          <section className="w-full max-w-4xl">
            <div className="mb-7 border-b border-slate-100 pb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Post Service</h1>
            </div>

            <div className="space-y-5">
              {/* Job title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-slate-600">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Insert title here..."
                  className="h-10 rounded-md border-slate-200 text-sm"
                />
              </div>

              {/* Service type one */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">
                  Service type 1 <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={formData.serviceTypeOne}
                  onValueChange={(value: ServiceType) =>
                    setFormData((prev) => ({ ...prev, serviceTypeOne: value }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Insert the skills required..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={`${tag}-${index}`}
                      variant="secondary"
                      className="h-6 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-normal text-slate-600"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Service type two */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">
                  Service type 2 <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={formData.serviceTypeTwo}
                  onValueChange={(value: ServiceType) => {
                    setFormData((prev) => ({ ...prev, serviceTypeTwo: value }))
                    addTag(labelFromServiceType(value))
                  }}
                >
                  <SelectTrigger className="h-10 rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Insert the skills required..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <button
                      key={`${tag}-${index}`}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 hover:border-primary/40 hover:text-primary"
                    >
                      {tag}
                      <span className="ml-1 text-slate-400">×</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-medium text-slate-600">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Insert service location..."
                  className="h-10 rounded-md border-slate-200 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium text-slate-600">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Please specify the expectations in as much details as possible..."
                  className="min-h-[150px] resize-none rounded-md border-slate-200 text-sm"
                  maxLength={3000}
                />
                <p className="text-[11px] text-slate-400">
                  from 40-3000 characters
                </p>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Upload files</Label>

                <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center">
                  <input
                    id="service-files"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => document.getElementById("service-files")?.click()}
                    className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500"
                  >
                    <Upload className="h-4 w-4" />
                  </button>

                  <p className="mt-2 text-xs">
                    <span className="cursor-pointer font-medium text-primary">Click to upload</span>{" "}
                    <span className="text-slate-500">or drag and drop</span>
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    SVG, PNG, JPG or GIF max 800x400px
                  </p>
                </div>

                {formData.files.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {formData.files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={previewUrls[index]}
                            alt={file.name}
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-24 items-center justify-center px-2 text-center text-xs text-slate-500">
                            {file.name}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute right-2 top-2 rounded-full bg-white p-1 text-slate-500 shadow-sm hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-xs font-medium text-slate-600">
                  Budget <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                  placeholder="₦0.00"
                  className="h-10 max-w-sm rounded-md border-slate-200 text-sm"
                />

                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <Checkbox
                      checked={formData.isNegotiable}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          isNegotiable: Boolean(checked),
                        }))
                      }
                    />
                    Negotiable
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <Checkbox
                      checked={formData.includesMaterialAmount}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          includesMaterialAmount: Boolean(checked),
                        }))
                      }
                    />
                    Including material amount
                  </label>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-medium text-slate-600">
                  Deadline: Select if applicable
                </Label>

                <div className="relative max-w-sm">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="h-10 rounded-md border-slate-200 pl-9 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mx-auto flex w-full max-w-xs flex-col gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => handleSubmit("draft")}
                  className="h-10 border-primary/30 text-primary hover:bg-primary/5"
                >
                  Save as draft
                </Button>

                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSubmit("published")}
                  className="h-10 bg-primary text-white hover:bg-primary/90"
                >
                  {isSaving ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}