"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, Eye, Star, Upload, X } from "lucide-react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  changeMyPassword,
  getAuth,
  getMyProfile,
  getMyReviews,
  getArtisanProfile,
  updateMyProfessionalProfile,
  updateMyProfile,
  updateMySettings,
  uploadProfileImage,
  uploadDocument,
  uploadMultipleFiles,
} from "@/lib/api"

type TabKey =
  | "details"
  | "professional"
  | "notifications"
  | "security"
  | "feedback"

const tabs: { key: TabKey; label: string }[] = [
  { key: "details", label: "My details" },
  { key: "professional", label: "Professional Profile" },
  { key: "notifications", label: "Notification" },
  { key: "security", label: "Password and Security" },
  { key: "feedback", label: "Rating and Feedback" },
]

const serviceCategories = [
  "plumbing",
  "carpentry",
  "hairstyling",
  "electrical",
  "painting",
  "cleaning",
  "autorepair",
  "techsupport",
  "general",
]

function splitName(name?: string) {
  const parts = String(name || "").trim().split(" ").filter(Boolean)
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  }
}

function joinName(firstName: string, lastName: string) {
  return `${firstName || ""} ${lastName || ""}`.trim()
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("details")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    location: "",
    company_name: "",
    work_address: "",
    avatar_url: "",
    avatar_public_id: "",
    document_public_id: "",
    document_url: "",
  })

  const [professional, setProfessional] = useState({
    service_type: "",
    skills: [] as string[],
    experience: "",
    bio: "",
    location: "",
    state: "",
    city: "",
    address: "",
    profile_image:"",
    portfolioGallery: [] as any[],
    profile_image_public_id: "",
  })

  const [settings, setSettings] = useState({
    push_notification: true,
    email_notification: true,
    sms_notification: false,
    notify_job_status: true,
    notify_feedback: false,
    notify_deposit_withdrawal: false,
    notify_promotions: false,
    notify_newsletters: false,
    prompt_feedback: true,
    auto_send_feedback_request: false,
    make_reviews_public: false,
    keep_reviews_anonymous: true,
  })

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const auth = getAuth()
    setToken(auth?.token ?? null)
    setUserId(auth?.user?.id ?? null)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)

        const [profile, reviewList, artisanData] = await Promise.all([
          getMyProfile(),
          getMyReviews().catch(() => []),
          userId
            ? getArtisanProfile(userId).catch(() => null)
            : Promise.resolve(null),
        ])

        const names = splitName(profile?.name)

        setDetails({
          firstName: names.firstName,
          lastName: names.lastName,
          email: profile?.email || "",
          username: profile?.username || "",
          phone: profile?.phone || "",
          state: profile?.state || "",
          city: profile?.city || "",
          address: profile?.address || "",
          location: profile?.location || "",
          company_name: profile?.company_name || "",
          work_address: profile?.work_address || "",
          avatar_url: profile?.avatar_url || "",
          document_url: profile?.document_url || "",
          avatar_public_id: profile?.avatar_public_id || "",
          document_public_id: profile?.document_public_id || "",
        })

        if (profile?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...profile.settings,
          }))
        }

        if (artisanData?.profile) {
          const artisanProfile = artisanData.profile as Record<string, any>

          setProfessional((prev) => ({
            ...prev,
            service_type:
              artisanProfile.service_type ||
              artisanProfile.primaryService ||
              "",
            skills: Array.isArray(artisanProfile.skills)
              ? artisanProfile.skills
              : [],
            experience: artisanProfile.experience || "",
            bio: artisanProfile.bio || "",
            location: artisanProfile.location || "",
            profile_image_public_id:
              artisanProfile.profile_image_public_id ||
              artisanProfile.profileImagePublicId ||
              "",
            portfolioGallery: Array.isArray(artisanProfile.portfolioGallery)
              ? artisanProfile.portfolioGallery
              : Array.isArray(artisanProfile.portfolio_gallery)
              ? artisanProfile.portfolio_gallery
              : [],
          }))
        }

        setReviews(Array.isArray(reviewList) ? reviewList : [])
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token, userId])

  const activeTabLabel = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label || "My details"
  }, [activeTab])


  const handleAvatarUpload = async (files: FileList | null) => {
  const file = files?.[0]
  if (!file) return

  const toastId = toast.loading("Uploading avatar...")

  try {
    const uploaded = await uploadProfileImage(file)

    setDetails((prev) => ({
      ...prev,
      avatar_url: uploaded.url,
      avatar_public_id: uploaded.public_id,
    }))

    toast.success("Avatar uploaded", { id: toastId })
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload avatar", { id: toastId })
  }
}

const handleDocumentUpload = async (files: FileList | null) => {
  const file = files?.[0]
  if (!file) return

  const toastId = toast.loading("Uploading document...")

  try {
    const uploaded = await uploadDocument(file)

    setDetails((prev) => ({
      ...prev,
      document_url: uploaded.url,
      document_public_id: uploaded.public_id,
    }))

    toast.success("Document uploaded", { id: toastId })
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload document", { id: toastId })
  }
}

const handleProfessionalImageUpload = async (files: FileList | null) => {
  const file = files?.[0]
  if (!file) return

  const toastId = toast.loading("Uploading profile image...")

  try {
    const uploaded = await uploadProfileImage(file)

    setProfessional((prev) => ({
      ...prev,
      profile_image: uploaded.url,
      profile_image_public_id: uploaded.public_id,
    }))

    toast.success("Profile image uploaded", { id: toastId })
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload profile image", {
      id: toastId,
    })
  }
}

const handlePortfolioUpload = async (files: FileList | null) => {
  const selected = Array.from(files || [])
  if (!selected.length) return

  const toastId = toast.loading("Uploading portfolio images...")

  try {
    const uploaded = await uploadMultipleFiles(selected)

    setProfessional((prev) => ({
      ...prev,
      portfolioGallery: [
        ...prev.portfolioGallery,
        ...uploaded.map((file) => ({
          url: file.url,
          public_id: file.public_id,
          original_name: file.original_name,
          resource_type: file.resource_type,
          mime_type: file.mime_type,
        })),
      ],
    }))

    toast.success("Portfolio uploaded", { id: toastId })
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload portfolio", {
      id: toastId,
    })
  }
}

  const saveDetails = async () => {
    if (!token) return toast.error("You must be logged in")

    try {
      setIsSaving(true)

      await updateMyProfile(
        {
          name: joinName(details.firstName, details.lastName),
          email: details.email,
          username: details.username,
          phone: details.phone,
          location: details.location || details.city || details.state,
          state: details.state,
          city: details.city,
          address: details.address,
          company_name: details.company_name,
          work_address: details.work_address,
          avatar_url: details.avatar_url,
          document_url: details.document_url,
          avatar_public_id: details.avatar_public_id,
          document_public_id: details.document_public_id,
        }
      )

      toast.success("Details saved")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save details")
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfessional = async () => {
    if (!token) return toast.error("You must be logged in")

    try {
      setIsSaving(true)

      await updateMyProfessionalProfile(
        {
          service_type: professional.service_type,
          skills: professional.skills,
          experience: professional.experience,
          bio: professional.bio,
          location:
            professional.location ||
            [professional.state, professional.city, professional.address]
              .filter(Boolean)
              .join(", "),
          profile_image: professional.profile_image,
          profile_image_public_id: professional.profile_image_public_id,
          portfolio_gallery: professional.portfolioGallery,
        },
      )
      
      toast.success("Professional profile saved")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save professional profile")
    } finally {
      setIsSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!token) return toast.error("You must be logged in")

    try {
      setIsSaving(true)
      await updateMySettings(settings)
      toast.success("Settings saved")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const savePassword = async () => {
    if (!token) return toast.error("You must be logged in")

    try {
      setIsSaving(true)
      await changeMyPassword(password)
      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast.success("Password changed successfully")
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSkill = (skill: string) => {
    setProfessional((prev) => {
      const exists = prev.skills.includes(skill)
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((item) => item !== skill)
          : [...prev.skills, skill],
      }
    })
  }

  const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = reject

      reader.readAsDataURL(file)
    })
  }

  // const handlePortfolioUpload = async (files: FileList | null) => {
  //   if (!files?.length) return

  //   try {
  //     const selectedFiles = Array.from(files).slice(0, 10)
  //     const dataUrls = await Promise.all(selectedFiles.map(fileToDataUrl))

  //     setProfessional((prev) => ({
  //       ...prev,
  //       portfolioGallery: [...prev.portfolioGallery, ...dataUrls].slice(0, 10),
  //       profile_image: prev.profile_image || dataUrls[0] || "",
        
        
  //     }))

  //     toast.success("Portfolio image added")
  //   } catch (error) {
  //     console.error("Portfolio upload failed:", error)
  //     toast.error("Failed to upload portfolio image")
  //   }
  // }

  const removePortfolioImage = (index: number) => {
    setProfessional((prev) => {
      const nextGallery = prev.portfolioGallery.filter((_, i) => i !== index)

      return {
        ...prev,
        portfolioGallery: nextGallery,
        profile_image:
          prev.profile_image === prev.portfolioGallery[index]
            ? nextGallery[0] || ""
            : prev.profile_image,
      }
    })
  }

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-64px)] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
          <aside className="hidden lg:block">
            <nav className="space-y-2 text-sm text-slate-700">
              <Link href="/dashboard/artisan" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Dashboard
              </Link>
              <Link href="/dashboard/jobs" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Browse Gigs
              </Link>
              <Link href="/dashboard/bookings" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                My Bookings
              </Link>
              <Link href="/dashboard/services/post" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Post Service
              </Link>
              <Link href="/dashboard/wallet" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Wallet
              </Link>
              <Link href="/dashboard/settings" className="block rounded-md bg-slate-50 px-3 py-2 font-medium text-slate-950">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                Settings
              </Link>
              <Link href="/support" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Support
              </Link>
            </nav>
          </aside>

          <section className="w-full">
            <div className="border-b border-slate-100 pb-5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Settings
              </h1>
            </div>

            <div className="mt-5 block lg:hidden">
              <Select value={activeTab} onValueChange={(value: TabKey) => setActiveTab(value)}>
                <SelectTrigger className="h-10 rounded-md border-slate-200">
                  <SelectValue>{activeTabLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((tab) => (
                    <SelectItem key={tab.key} value={tab.key}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-5 hidden grid-cols-5 rounded-lg border border-slate-100 bg-white p-1 lg:grid">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`h-9 rounded-md text-xs transition ${
                    activeTab === tab.key
                      ? "bg-slate-50 text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="py-10 text-sm text-slate-500">Loading settings...</div>
            ) : (
              <div className="mt-8 max-w-4xl">
                {activeTab === "details" && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">Personal info</h2>
                    <p className="mt-1 text-xs text-slate-500">Update your profile and personal details here.</p>

                    <div className="mt-6 space-y-5">
                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>First name *</Label>
                        <Input value={details.firstName} onChange={(e) => setDetails((p) => ({ ...p, firstName: e.target.value }))} placeholder="Input first name" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Last name *</Label>
                        <Input value={details.lastName} onChange={(e) => setDetails((p) => ({ ...p, lastName: e.target.value }))} placeholder="Input last name" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Label>Location *</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input value={details.state} onChange={(e) => setDetails((p) => ({ ...p, state: e.target.value }))} placeholder="Please input address" />
                          <Input value={details.city} onChange={(e) => setDetails((p) => ({ ...p, city: e.target.value }))} placeholder="Please input address" />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Address *</Label>
                        <Input value={details.address} onChange={(e) => setDetails((p) => ({ ...p, address: e.target.value }))} placeholder="Please input address" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Email *</Label>
                        <Input value={details.email} onChange={(e) => setDetails((p) => ({ ...p, email: e.target.value }))} placeholder="Input email address" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Username</Label>
                        <Input value={details.username} onChange={(e) => setDetails((p) => ({ ...p, username: e.target.value }))} placeholder="Input username" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Phone number</Label>
                        <Input value={details.phone} onChange={(e) => setDetails((p) => ({ ...p, phone: e.target.value }))} placeholder="Input phone number" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Experience level</Label>
                        <Select
                          value={professional.experience}
                          onValueChange={(value) =>
                            setProfessional((prev) => ({
                              ...prev,
                              experience: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Company name</Label>
                        <Input value={details.company_name} onChange={(e) => setDetails((p) => ({ ...p, company_name: e.target.value }))} placeholder="Input company name" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Work address</Label>
                        <Input value={details.work_address} onChange={(e) => setDetails((p) => ({ ...p, work_address: e.target.value }))} placeholder="Input work address" />
                      </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button variant="outline" type="button">Cancel</Button>
                        <Button onClick={saveDetails} disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "professional" && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">Professional profile</h2>
                    <p className="mt-1 text-xs text-slate-500">Update your professional profile here.</p>

                    <div className="mt-6 space-y-5">
                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Label>Job Categories/Skills *</Label>
                        <div>
                          <Select value={professional.service_type} onValueChange={(value) => setProfessional((p) => ({ ...p, service_type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Specify the type of jobs or skilled area" />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceCategories.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {serviceCategories.slice(0, 5).map((skill) => (
                              <button
                                type="button"
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                className={`rounded-md border px-3 py-1 text-xs ${
                                  professional.skills.includes(skill)
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-slate-200 text-slate-600"
                                }`}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Label>Portfolio Gallery</Label>

                        <div className="space-y-4">
                          <input
                            id="portfolio-gallery-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handlePortfolioUpload(e.target.files)}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("portfolio-gallery-upload")?.click()
                            }
                            className="w-full rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 transition hover:border-primary/40 hover:bg-primary/5"
                          >
                            <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                            <span className="font-medium text-primary">Click to upload</span>
                            <span> or drag and drop</span>
                            <br />
                            SVG, PNG, JPG or GIF
                          </button>

                          {professional.portfolioGallery.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                              {professional.portfolioGallery.map((image, index) => (
                                <div
                                  key={`${image}-${index}`}
                                  className="group relative overflow-hidden rounded-lg border border-slate-100"
                                >
                                  <img
                                    src={image}
                                    alt={`Portfolio ${index + 1}`}
                                    className="h-24 w-full object-cover"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => removePortfolioImage(index)}
                                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-90 hover:bg-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Label>Service Area *</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input value={professional.state} onChange={(e) => setProfessional((p) => ({ ...p, state: e.target.value }))} placeholder="Please input address" />
                          <Input value={professional.city} onChange={(e) => setProfessional((p) => ({ ...p, city: e.target.value }))} placeholder="Please input address" />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                        <Label>Address *</Label>
                        <Input value={professional.address} onChange={(e) => setProfessional((p) => ({ ...p, address: e.target.value }))} placeholder="Please input address" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Label>Bio</Label>
                        <Textarea value={professional.bio} onChange={(e) => setProfessional((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell clients about your work" />
                      </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button variant="outline" type="button">Cancel</Button>
                        <Button onClick={saveProfessional} disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">Notifications</h2>
                    <p className="mt-1 text-xs text-slate-500">Choose how to get notifications.</p>

                    <div className="mt-6 space-y-4">
                      {[
                        ["push_notification", "Push notification"],
                        ["email_notification", "Email notification"],
                        ["sms_notification", "SMS notification"],
                        ["notify_job_status", "Job status"],
                        ["notify_feedback", "Feedback"],
                        ["notify_deposit_withdrawal", "Deposit and Withdrawal"],
                        ["notify_promotions", "Promotions"],
                        ["notify_newsletters", "Newsletters"],
                      ].map(([key, label]) => (
                        <div key={key} className="flex items-center gap-3">
                          <Switch checked={(settings as any)[key]} onCheckedChange={(checked) => setSettings((p) => ({ ...p, [key]: checked }))} />
                          <span className="text-sm text-slate-700">{label}</span>
                        </div>
                      ))}

                      <div className="pt-5">
                        <Button onClick={saveSettings} disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">Password</h2>
                    <p className="mt-1 text-xs text-slate-500">Please enter your current password to change your password.</p>

                    <div className="mt-6 space-y-5 max-w-xl">
                      <div className="grid gap-2">
                        <Label>Current password *</Label>
                        <Input type="password" value={password.currentPassword} onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))} />
                      </div>

                      <div className="grid gap-2">
                        <Label>New password *</Label>
                        <Input type="password" value={password.newPassword} onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))} />
                      </div>

                      <div className="grid gap-2">
                        <Label>Confirm New Password *</Label>
                        <Input type="password" value={password.confirmPassword} onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))} />
                      </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button variant="outline" type="button">Cancel</Button>
                        <Button onClick={savePassword} disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "feedback" && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">Ratings and Feedback</h2>
                    <p className="mt-1 text-xs text-slate-500">Details of average ratings and reviews left by past clients.</p>

                    <div className="mt-6 overflow-hidden rounded-lg border border-slate-100">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Invoice</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                No feedback yet.
                              </td>
                            </tr>
                          ) : (
                            reviews.map((review, index) => (
                              <tr key={review.id || index} className="border-t border-slate-100">
                                <td className="px-4 py-3 text-xs">#{String(index + 1).padStart(4, "0")}</td>
                                <td className="px-4 py-3 text-xs">{formatDate(review.created_at || review.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <Badge className="bg-green-50 text-green-700 border border-green-100">
                                    Paid
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= Number(review.rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 space-y-5">
                      <div>
                        <h3 className="text-sm font-medium text-slate-950">Provide Feedback on Completed Jobs</h3>
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <Switch checked={settings.prompt_feedback} onCheckedChange={(checked) => setSettings((p) => ({ ...p, prompt_feedback: checked }))} />
                            <span className="text-sm text-slate-700">Prompt me to leave feedback</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={settings.auto_send_feedback_request} onCheckedChange={(checked) => setSettings((p) => ({ ...p, auto_send_feedback_request: checked }))} />
                            <span className="text-sm text-slate-700">Automatically send a feedback request</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-950">Review Visibility</h3>
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <Switch checked={settings.make_reviews_public} onCheckedChange={(checked) => setSettings((p) => ({ ...p, make_reviews_public: checked }))} />
                            <span className="text-sm text-slate-700">Make my reviews public</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={settings.keep_reviews_anonymous} onCheckedChange={(checked) => setSettings((p) => ({ ...p, keep_reviews_anonymous: checked }))} />
                            <span className="text-sm text-slate-700">Keep my reviews anonymous</span>
                          </div>
                        </div>
                      </div>

                      <Button onClick={saveSettings} disabled={isSaving} className="bg-primary text-white hover:bg-primary/90">
                        {isSaving ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}