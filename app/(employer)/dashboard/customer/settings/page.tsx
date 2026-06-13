"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Star, Upload, X } from "lucide-react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  changeMyPassword,
  getMyProfile,
  getMyReviewsGiven,
  updateMyEmployerProfessionalProfile,
  updateMyProfile,
  updateMySettings,
  uploadProfileImage,
  uploadDocument,
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

const preferredCategories = [
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

const industries = [
  "Real Estate",
  "Hospitality",
  "Retail",
  "Construction",
  "Event Management",
  "Facility Management",
  "Individual/Homeowner",
  "Other",
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

function toNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "Browse Gigs", href: "/find-artisan" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Post a Gig", href: "/post-job" },
    { label: "Wallet", href: "/dashboard/customer/wallet" },
    { label: "Settings", href: "/dashboard/customer/settings", active: true },
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

export default function EmployerSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("details")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])

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
    avatar_url: "",
    document_url: "",
    avatar_public_id: "",
    document_public_id: "",
  })

  const [professional, setProfessional] = useState({
    company_name: "",
    industry: "",
    company_size: "",
    hiring_frequency: "",
    preferred_categories: [] as string[],
    average_budget: "",
    company_description: "",
    website: "",
    state: "",
    city: "",
    address: "",
    verification_document: "",
    verification_document_public_id: "",
    portfolio_reference: "",
    portfolio_reference_public_id: "",
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
    const load = async () => {
      try {
        setIsLoading(true)

        const [profile, givenReviews] = await Promise.all([
          getMyProfile(),
          getMyReviewsGiven().catch(() => []),
        ])

        const names = splitName(profile?.name)
        const employerProfile = profile?.employerProfile || {}

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
          avatar_url: profile?.avatar_url || "",
          document_url: profile?.document_url || "",
          avatar_public_id: profile?.avatar_public_id || "",
          document_public_id: profile?.document_public_id || "",
        })

        setProfessional({
          company_name:
            employerProfile?.company_name || profile?.company_name || "",
          industry: employerProfile?.industry || "",
          company_size: employerProfile?.company_size || "",
          hiring_frequency: employerProfile?.hiring_frequency || "",
          preferred_categories: Array.isArray(
            employerProfile?.preferred_categories
          )
            ? employerProfile.preferred_categories
            : [],
          average_budget:
            employerProfile?.average_budget != null
              ? String(employerProfile.average_budget)
              : "",
          company_description: employerProfile?.company_description || "",
          website: employerProfile?.website || "",
          state: employerProfile?.state || profile?.state || "",
          city: employerProfile?.city || profile?.city || "",
          address: employerProfile?.address || profile?.address || "",
          verification_document:
            employerProfile?.verification_document || "",
          portfolio_reference: employerProfile?.portfolio_reference || "",
          verification_document_public_id:
            employerProfile?.verification_document_public_id || "",
          portfolio_reference_public_id:
            employerProfile?.portfolio_reference_public_id || "",
        })

        if (profile?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...profile.settings,
          }))
        }

        setReviews(Array.isArray(givenReviews) ? givenReviews : [])
      } catch (error) {
        console.error("Failed to load employer settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const activeTabLabel = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label || "My details"
  }, [activeTab])

  
  const handleEmployerAvatarUpload = async (files: FileList | null) => {
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

  const handleEmployerDocumentUpload = async (files: FileList | null) => {
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

  const handleVerificationDocumentUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    const toastId = toast.loading("Uploading verification document...")

    try {
      const uploaded = await uploadDocument(file)

      setProfessional((prev) => ({
        ...prev,
        verification_document: uploaded.url,
        verification_document_public_id: uploaded.public_id,
      }))

      toast.success("Verification document uploaded", { id: toastId })
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload verification document", {
        id: toastId,
      })
    }
  }


  const saveDetails = async () => {
    try {
      setIsSaving(true)

      await updateMyProfile({
        name: joinName(details.firstName, details.lastName),
        email: details.email,
        username: details.username,
        phone: details.phone,
        location: details.location || details.city || details.state,
        state: details.state,
        city: details.city,
        address: details.address,
        company_name: details.company_name,
        avatar_url: details.avatar_url,
        avatar_public_id: details.avatar_public_id,
        document_url: details.document_url,
        document_public_id: details.document_public_id,
      })

      toast.success("Details updated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save details")
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfessional = async () => {
    try {
      setIsSaving(true)

      await updateMyEmployerProfessionalProfile({
        company_name: professional.company_name,
        industry: professional.industry,
        company_size: professional.company_size,
        hiring_frequency: professional.hiring_frequency,
        preferred_categories: professional.preferred_categories,
        average_budget: professional.average_budget || null,
        company_description: professional.company_description,
        website: professional.website,
        state: professional.state,
        city: professional.city,
        address: professional.address,
        verification_document: professional.verification_document,
        verification_document_public_id:
          professional.verification_document_public_id,
        portfolio_reference: professional.portfolio_reference,
        portfolio_reference_public_id:
          professional.portfolio_reference_public_id,
      })

      toast.success("Professional profile updated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save professional profile")
    } finally {
      setIsSaving(false)
    }
  }

  const saveNotifications = async () => {
    try {
      setIsSaving(true)
      await updateMySettings(settings)
      toast.success("Notification settings updated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const savePassword = async () => {
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

  const toggleCategory = (category: string) => {
    setProfessional((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter((item) => item !== category)
        : [...prev.preferred_categories, category],
    }))
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="p-8 text-center text-sm text-slate-500">
          Loading settings...
        </div>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-64px)] bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <EmployerSidebar />

          <section className="min-w-0 flex-1">
            <div className="border-b border-slate-100 pb-5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Settings
              </h1>
            </div>

            <div className="mt-5 block sm:hidden">
              <Select
                value={activeTab}
                onValueChange={(value: TabKey) => setActiveTab(value)}
              >
                <SelectTrigger className="h-10 rounded-md border-slate-200 text-xs">
                  <SelectValue placeholder={activeTabLabel} />
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

            <div className="mt-5 hidden grid-cols-5 rounded-lg border border-slate-100 bg-white p-1 sm:grid">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`h-9 rounded-md text-[11px] transition ${
                    activeTab === tab.key
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "details" && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Personal info
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Update your profile and personal details here.
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>First name *</Label>
                      <Input
                        value={details.firstName}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="Input first name"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Last name *</Label>
                      <Input
                        value={details.lastName}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Input last name"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Location *</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={details.state}
                          onChange={(e) =>
                            setDetails((p) => ({
                              ...p,
                              state: e.target.value,
                            }))
                          }
                          placeholder="Please input address"
                        />

                        <Input
                          value={details.city}
                          onChange={(e) =>
                            setDetails((p) => ({
                              ...p,
                              city: e.target.value,
                            }))
                          }
                          placeholder="Please input address"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Address *</Label>
                      <Input
                        value={details.address}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Please input address"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={details.email}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Input email address"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Username</Label>
                      <Input
                        value={details.username}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Input username"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Phone number</Label>
                      <div>
                        <Input
                          value={details.phone}
                          onChange={(e) =>
                            setDetails((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Input phone number"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          This is not visible to public.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Company name</Label>
                      <Input
                        value={details.company_name}
                        onChange={(e) =>
                          setDetails((p) => ({
                            ...p,
                            company_name: e.target.value,
                          }))
                        }
                        placeholder="Input company name"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Document upload</Label>

                      <div>
                        <input
                          id="employer-document-upload"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleEmployerDocumentUpload(e.target.files)}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("employer-document-upload")?.click()
                          }
                          className="w-full rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Upload className="mx-auto mb-2 h-4 w-4" />
                          <span className="font-medium text-primary">Click to upload</span>{" "}
                          or drag and drop
                          <br />
                          SVG, PNG, JPG, PDF or DOC
                        </button>

                        {details.document_url && (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                            <span className="truncate text-slate-600">
                              Document uploaded successfully
                            </span>

                            <a
                              href={details.document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={saveDetails}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "professional" && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Professional profile
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Update your employer profile here.
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Company name *</Label>
                      <Input
                        value={professional.company_name}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            company_name: e.target.value,
                          }))
                        }
                        placeholder="Input company name"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Industry *</Label>
                      <Select
                        value={professional.industry}
                        onValueChange={(value) =>
                          setProfessional((p) => ({
                            ...p,
                            industry: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Preferred job categories</Label>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {preferredCategories.map((category) => (
                            <button
                              type="button"
                              key={category}
                              onClick={() => toggleCategory(category)}
                              className={`rounded-md border px-3 py-1 text-xs ${
                                professional.preferred_categories.includes(
                                  category
                                )
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-slate-200 text-slate-600"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Hiring frequency</Label>
                      <Select
                        value={professional.hiring_frequency}
                        onValueChange={(value) =>
                          setProfessional((p) => ({
                            ...p,
                            hiring_frequency: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How often do you hire?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">One-time projects</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="ongoing">Ongoing hiring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Company size</Label>
                      <Select
                        value={professional.company_size}
                        onValueChange={(value) =>
                          setProfessional((p) => ({
                            ...p,
                            company_size: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="200+">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Average budget</Label>
                      <Input
                        type="number"
                        value={professional.average_budget}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            average_budget: e.target.value,
                          }))
                        }
                        placeholder="Input average project budget"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Company description</Label>
                      <Textarea
                        value={professional.company_description}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            company_description: e.target.value,
                          }))
                        }
                        placeholder="Tell artisans about your company or hiring needs"
                        rows={4}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Website</Label>
                      <Input
                        value={professional.website}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Service Area *</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={professional.state}
                          onChange={(e) =>
                            setProfessional((p) => ({
                              ...p,
                              state: e.target.value,
                            }))
                          }
                          placeholder="Please input address"
                        />

                        <Input
                          value={professional.city}
                          onChange={(e) =>
                            setProfessional((p) => ({
                              ...p,
                              city: e.target.value,
                            }))
                          }
                          placeholder="Please input address"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Address</Label>
                      <Input
                        value={professional.address}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Please input address"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                      <Label>Verification Document</Label>

                      <div>
                        <input
                          id="employer-document-upload"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleVerificationDocumentUpload(e.target.files)}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("employer-document-upload")?.click()
                          }
                          className="w-full rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Upload className="mx-auto mb-2 h-4 w-4" />
                          <span className="font-medium text-primary">Click to upload</span>{" "}
                          or drag and drop
                          <br />
                          SVG, PNG, JPG, PDF or DOC
                        </button>

                        {details.document_url && (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                            <span className="truncate text-slate-600">
                              Document uploaded successfully
                            </span>

                            <a
                              href={details.document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={saveProfessional}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Notifications
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose where to get notification.
                  </p>

                  <div className="mt-6 space-y-4">
                    {[
                      ["push_notification", "Push notification"],
                      ["email_notification", "Email notification"],
                      ["sms_notification", "SMS notification"],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Switch
                          checked={(settings as any)[key]}
                          onCheckedChange={(checked) =>
                            setSettings((p) => ({
                              ...p,
                              [key]: checked,
                            }))
                          }
                        />
                        <span className="text-sm text-slate-700">
                          {label}
                        </span>
                      </div>
                    ))}

                    <div className="pt-4">
                      <p className="mb-3 text-xs font-medium text-slate-700">
                        Choose notifications to get
                      </p>

                      {[
                        ["notify_job_status", "Job status"],
                        ["notify_feedback", "Feedback"],
                        ["notify_deposit_withdrawal", "Deposit and Withdrawal"],
                        ["notify_promotions", "Promotions"],
                        ["notify_newsletters", "Newsletters"],
                      ].map(([key, label]) => (
                        <div key={key} className="mb-3 flex items-center gap-3">
                          <Switch
                            checked={(settings as any)[key]}
                            onCheckedChange={(checked) =>
                              setSettings((p) => ({
                                ...p,
                                [key]: checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={saveNotifications}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Password
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Please enter your current password to change your password.
                  </p>

                  <div className="mt-6 max-w-2xl space-y-5">
                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Current password *</Label>
                      <Input
                        type="password"
                        value={password.currentPassword}
                        onChange={(e) =>
                          setPassword((p) => ({
                            ...p,
                            currentPassword: e.target.value,
                          }))
                        }
                        placeholder="Current password"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>New password *</Label>
                      <Input
                        type="password"
                        value={password.newPassword}
                        onChange={(e) =>
                          setPassword((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="New password"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                      <Label>Confirm Password *</Label>
                      <Input
                        type="password"
                        value={password.confirmPassword}
                        onChange={(e) =>
                          setPassword((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="Confirm password"
                      />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={savePassword}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "feedback" && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Ratings and Feedback
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Details of ratings and feedback you have left for artisans.
                  </p>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-xs">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="px-3 py-2">Invoice</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Rating</th>
                          <th className="px-3 py-2">Feedback</th>
                          <th className="px-3 py-2">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reviews.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-8 text-center text-slate-500"
                            >
                              No feedback found.
                            </td>
                          </tr>
                        ) : (
                          reviews.map((review, index) => (
                            <tr
                              key={review.id || index}
                              className="rounded-lg border border-slate-100 bg-white shadow-sm"
                            >
                              <td className="px-3 py-3">
                                #{String(index + 1).padStart(4, "0")}
                              </td>

                              <td className="px-3 py-3">
                                {formatDate(review.created_at)}
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex gap-0.5 text-amber-400">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${
                                        i < toNumber(review.rating)
                                          ? "fill-amber-400"
                                          : ""
                                      }`}
                                    />
                                  ))}
                                </div>
                              </td>

                              <td className="max-w-[260px] truncate px-3 py-3">
                                {review.comment || review.feedback || "-"}
                              </td>

                              <td className="px-3 py-3">
                                <button className="text-primary">Edit</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="mb-3 text-xs font-medium text-slate-700">
                        Provide Feedback on Completed Jobs
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={settings.prompt_feedback}
                            onCheckedChange={(checked) =>
                              setSettings((p) => ({
                                ...p,
                                prompt_feedback: checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">
                            Prompt me to leave feedback
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={settings.auto_send_feedback_request}
                            onCheckedChange={(checked) =>
                              setSettings((p) => ({
                                ...p,
                                auto_send_feedback_request: checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">
                            Automatically send feedback request
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-medium text-slate-700">
                        Review Visibility
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={settings.make_reviews_public}
                            onCheckedChange={(checked) =>
                              setSettings((p) => ({
                                ...p,
                                make_reviews_public: checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">
                            Make my reviews public
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={settings.keep_reviews_anonymous}
                            onCheckedChange={(checked) =>
                              setSettings((p) => ({
                                ...p,
                                keep_reviews_anonymous: checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">
                            Keep my reviews anonymous
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={saveNotifications}
                    className="mt-6 bg-primary text-white hover:bg-primary/90"
                  >
                    Save feedback settings
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}