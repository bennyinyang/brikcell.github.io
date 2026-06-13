"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Loader2,
  Upload,
  X,
} from "lucide-react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createJobPostingWithFiles, getAuth } from "@/lib/api"

const skillOptions = [
  "Home service",
  "Wood work",
  "Home service",
  "Painting",
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Carpentry",
]

const categoryOptions = [
  { label: "Home service", value: "home-service" },
  { label: "Wood work", value: "carpentry" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Electrical", value: "electrical" },
  { label: "Painting", value: "painting" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Tech support", value: "techsupport" },
]

type FormState = {
  title: string
  category: string
  description: string
  budget: string
  deadline: string
  isNegotiable: boolean
  includesMaterial: boolean
  files: File[]
  recommendedSkills: string[]
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "Browse Gigs", href: "/search" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Post a Gig", href: "/post-job", active: true },
    { label: "Wallet", href: "/dashboard/customer/wallet" },
    { label: "Settings", href: "/dashboard/customer/settings" },
    { label: "Support", href: "/support" },
  ]

  return (
    <aside className="hidden w-[190px] shrink-0 lg:block">
      <nav className="space-y-4 text-sm">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 transition ${
              item.active
                ? "bg-slate-50 font-medium text-slate-950"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {item.active && (
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {!item.active && <span className="mr-3" />}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export function JobPostingForm() {
  const router = useRouter()
  const auth = getAuth()
  const token = auth?.token ?? null

  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<FormState>({
    title: "",
    category: "",
    description: "",
    budget: "",
    deadline: "",
    isNegotiable: false,
    includesMaterial: false,
    files: [],
    recommendedSkills: ["Home service", "Wood work", "Home service", "Painting"],
  })

  const descriptionCount = formData.description.length

  const canSubmit = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.category.trim().length > 0 &&
      formData.description.trim().length > 0 &&
      Number(formData.budget) > 0
    )
  }, [formData])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const removeSkill = (skillIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      recommendedSkills: prev.recommendedSkills.filter((_, index) => index !== skillIndex),
    }))
  }

  const addSkill = (skill: string) => {
    if (!skill) return

    setFormData((prev) => ({
      ...prev,
      recommendedSkills: prev.recommendedSkills.includes(skill)
        ? prev.recommendedSkills
        : [...prev.recommendedSkills, skill],
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files?.length) return

    const selected = Array.from(files)
    const nextFiles = [...formData.files, ...selected].slice(0, 5)

    setFormData((prev) => ({
      ...prev,
      files: nextFiles,
    }))
  }

  const removeFile = (fileIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== fileIndex),
    }))
  }

  async function submitJob(status: "draft" | "open") {
    if (!token) {
      toast.error("You must be logged in to post a gig")
      return
    }

    if (status === "open" && !canSubmit) {
      toast.error("Please fill all required fields")
      return
    }

    const toastId = toast.loading(
      status === "draft" ? "Saving draft..." : "Publishing gig..."
    )

    setIsSaving(true)

    try {
      await createJobPostingWithFiles(
        {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          budget_min: Number(formData.budget),
          budget_max: Number(formData.budget),
          skills_required: formData.recommendedSkills,
          budget_type: "fixed",
          deadline_at: formData.deadline || undefined,
          is_remote: false,
          contact_preference: "platform",
          is_negotiable: formData.isNegotiable,
          includes_material: formData.includesMaterial,
          status,
          files: formData.files,
        },
        token
      )

      toast.success(
        status === "draft" ? "Gig saved as draft" : "Gig published successfully",
        { id: toastId }
      )

      router.push("/dashboard/customer")
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit gig", {
        id: toastId,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <EmployerSidebar />

          <section className="min-w-0 flex-1">
            <div className="border-b border-slate-100 pb-5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Post a Job
              </h1>
            </div>

            <div className="mt-6 max-w-4xl space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Job Title <span className="text-primary">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Insert title here..."
                  className="h-10 rounded-md border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Skills required <span className="text-primary">*</span>
                </Label>

                <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
                  <SelectTrigger className="h-10 rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Insert the skills required..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Recommended Skills
                </Label>

                <div className="flex flex-wrap gap-2">
                  {formData.recommendedSkills.map((skill, index) => (
                    <button
                      type="button"
                      key={`${skill}-${index}`}
                      onClick={() => removeSkill(index)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500"
                    >
                      {skill}
                      <X className="h-3 w-3" />
                    </button>
                  ))}

                  <Select onValueChange={addSkill}>
                    <SelectTrigger className="h-7 w-[130px] rounded-md border-slate-200 text-[11px]">
                      <SelectValue placeholder="+ Add skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillOptions.map((skill, index) => (
                        <SelectItem key={`${skill}-${index}`} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Description <span className="text-primary">*</span>
                </Label>

                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value.slice(0, 3000))}
                  placeholder="Please specify the expectations in as much details as possible..."
                  className="min-h-[150px] resize-none rounded-md border-slate-200 text-sm"
                />

                <p className="text-[11px] text-slate-400">
                  From {descriptionCount}-3000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Upload files
                </Label>

                <input
                  id="gig-files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />

                <button
                  type="button"
                  onClick={() => document.getElementById("gig-files")?.click()}
                  className="flex min-h-[126px] w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-center text-xs transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200">
                    <Upload className="h-4 w-4 text-slate-500" />
                  </span>

                  <span>
                    <span className="font-medium text-primary">Click to upload</span>{" "}
                    <span className="text-slate-500">or drag and drop</span>
                  </span>

                  <span className="mt-1 text-[11px] text-slate-400">
                    SVG, PNG, JPG or GIF max 800x400px
                  </span>
                </button>

                {formData.files.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-slate-600">{file.name}</span>

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-3 text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Budget <span className="text-primary">*</span>
                </Label>

                <div className="relative max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ₦
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    placeholder="0.00"
                    className="h-11 rounded-md border-slate-200 pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={formData.isNegotiable}
                    onCheckedChange={(value) => updateField("isNegotiable", Boolean(value))}
                    className="border-primary"
                  />
                  Negotiable
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={formData.includesMaterial}
                    onCheckedChange={(value) => updateField("includesMaterial", Boolean(value))}
                    className="border-primary"
                  />
                  Including material amount
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">
                  Deadline: Select if applicable
                </Label>

                <div className="relative max-w-md">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => updateField("deadline", e.target.value)}
                    className="h-11 rounded-md border-slate-200 pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex max-w-md flex-col gap-3 pt-6 sm:ml-[260px]">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => submitJob("draft")}
                  className="h-11 border-primary/40 text-primary hover:bg-primary/5"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save as draft
                </Button>

                <Button
                  type="button"
                  disabled={isSaving || !canSubmit}
                  onClick={() => submitJob("open")}
                  className="h-11 bg-primary text-white hover:bg-primary/90"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Publish
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}