"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronDown,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Search,
  Star,
  User,
  Send,
  X,
  Pencil,
  Trash2,
  MapPin,
  Briefcase,
  Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  getArtisanDashboardSummary,
  getArtisanJobRequests,
  getArtisanActiveJobs,
  getArtisanJobHistory,
  listMyServices,
  updateServiceListing,
  deleteServiceListing,
  normalizePaginatedResponse,
  type PaginationMeta,
  type ServiceRecord,
} from "@/lib/api"
import { SentRequestsModal } from "@/components/artisan/sent-requests-modal"
import { PaginationControl } from "@/components/pagination-control"
import { ReviewDialog } from "@/components/review/review-dialog"

type DashboardRequestCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  requestDate: string
  urgency: string
  customer: {
    id: string
    name: string
    email: string
  }
}

type DashboardActiveJobCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  status: string
  deadline: string
  customer: {
    id: string
    name: string
    email: string
  }
}

type DashboardHistoryCard = {
  id: string
  jobId: string
  title: string
  location: string
  budget: string
  completedDate: string
  customer: {
    id: string
    name: string
    email: string
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "10:00 AM"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "10:00 AM"

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatMoney(value?: string | number | null) {
  const num = Number(value || 0)
  return `₦${num.toLocaleString()}`
}

function formatCurrencyRange(minValue?: any, maxValue?: any) {
  const min = Number(minValue || 0)
  const max = Number(maxValue || 0)

  if (min && max) return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`
  if (max) return `₦${max.toLocaleString()}`
  if (min) return `₦${min.toLocaleString()}`
  return "Budget not set"
}

function formatCurrencyFromMilestone(raw: any) {
  const amount = Number(raw?.amount || 0)
  if (amount > 0) return `₦${amount.toLocaleString()}`

  return formatCurrencyRange(
    raw?.contract?.job?.budget_min ?? raw?.job?.budget_min,
    raw?.contract?.job?.budget_max ?? raw?.job?.budget_max
  )
}

function normalizeMilestoneStatus(status: any) {
  return String(status || "").toUpperCase()
}

function getStatusLabel(status: string) {
  const normalized = normalizeMilestoneStatus(status)

  switch (normalized) {
    case "ACTIVE":
    case "FUNDED":
      return "Scheduled"
    case "SUBMITTED":
      return "Submitted"
    case "APPROVAL_PENDING":
      return "Review"
    case "APPROVED":
      return "Approved"
    case "RELEASED":
    case "PARTIAL_RELEASED":
    case "PAID":
      return "Completed"
    case "REFUNDED":
      return "Refunded"
    case "CANCELLED":
      return "Cancelled"
    default:
      return "In progress"
  }
}

function getStatusClass(status: string) {
  const normalized = normalizeMilestoneStatus(status)

  switch (normalized) {
    case "ACTIVE":
    case "FUNDED":
    case "SUBMITTED":
    case "APPROVAL_PENDING":
    case "APPROVED":
      return "bg-slate-100 text-slate-600 border-slate-200"
    case "RELEASED":
    case "PARTIAL_RELEASED":
    case "PAID":
      return "bg-green-50 text-green-700 border-green-200"
    case "REFUNDED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-orange-50 text-orange-700 border-orange-200"
  }
}

function mapRequest(raw: any): DashboardRequestCard {
  const job = raw?.Job || raw?.job || {}
  const employer = job?.employer || raw?.employer || {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || raw?.job_id || ""),
    title: job?.title || "Untitled Job",
    location: job?.location || "No location",
    budget: formatCurrencyRange(job?.budget_min, job?.budget_max),
    requestDate: formatDate(raw?.createdAt || raw?.created_at),
    urgency: "pending",
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "Employer",
      email: employer?.email || "",
    },
  }
}

function mapActiveJob(raw: any): DashboardActiveJobCard {
  const contract = raw?.contract || raw?.Contract || {}
  const job = contract?.job || contract?.Job || raw?.job || raw?.Job || {}
  const employer =
    contract?.employer ||
    contract?.Employer ||
    job?.employer ||
    job?.Employer ||
    raw?.employer ||
    raw?.Employer ||
    {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title:
      raw?.title ||
      raw?.name ||
      job?.title ||
      contract?.title ||
      "Untitled Service",
    location:
      job?.location ||
      contract?.location ||
      raw?.location ||
      "No location",
    budget: formatCurrencyFromMilestone(raw),
    status: String(raw?.status || contract?.status || ""),
    deadline: formatDate(
      raw?.review_deadline_at ||
        raw?.approved_at ||
        raw?.submitted_at ||
        raw?.updatedAt ||
        raw?.updated_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "User",
      email: employer?.email || "",
    },
  }
}

function mapHistoryJob(raw: any): DashboardHistoryCard {
  const contract = raw?.contract || raw?.Contract || {}
  const job = contract?.job || contract?.Job || raw?.job || raw?.Job || {}
  const employer =
    contract?.employer ||
    contract?.Employer ||
    job?.employer ||
    job?.Employer ||
    raw?.employer ||
    raw?.Employer ||
    {}

  return {
    id: String(raw?.id || ""),
    jobId: String(job?.id || contract?.job_id || raw?.job_id || ""),
    title:
      raw?.title ||
      raw?.name ||
      job?.title ||
      contract?.title ||
      "Untitled Service",
    location:
      job?.location ||
      contract?.location ||
      raw?.location ||
      "No location",
    budget: formatCurrencyFromMilestone(raw),
    completedDate: formatDate(
      raw?.updatedAt ||
        raw?.updated_at ||
        raw?.approved_at ||
        raw?.submitted_at
    ),
    customer: {
      id: String(employer?.id || ""),
      name: employer?.name || "User",
      email: employer?.email || "",
    },
  }
}

function getInitials(name?: string) {
  if (!name) return "A"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function PostedServiceCard({
  service,
  onEdit,
  onDelete,
  deleting,
}: {
  service: ServiceRecord
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const budgetLabel =
    service.budget_min && service.budget_max
      ? `₦${Number(service.budget_min).toLocaleString()} – ₦${Number(service.budget_max).toLocaleString()}`
      : service.budget_min
      ? `From ₦${Number(service.budget_min).toLocaleString()}`
      : service.budget_max
      ? `Up to ₦${Number(service.budget_max).toLocaleString()}`
      : "Budget not set"

  const statusColor =
    service.status === "published"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-600 border-slate-200"

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{service.title}</h3>
          {service.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" />
              {service.location}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor}`}>
          {service.status ?? "draft"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {String(service.service_type).replace(/_/g, " ")}
        </span>
        <span className="font-medium text-slate-700">{budgetLabel}</span>
        {service.deadline && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(service.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={onEdit}
        >
          <Pencil className="mr-1.5 h-3 w-3" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 className="mr-1.5 h-3 w-3" />
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  )
}

function PostedServiceModal({
  service,
  onClose,
  onUpdated,
}: {
  service: ServiceRecord
  onClose: () => void
  onUpdated: (updated: ServiceRecord) => void
}) {
  const [title, setTitle] = useState(service.title)
  const [description, setDescription] = useState(service.description ?? "")
  const [location, setLocation] = useState(service.location ?? "")
  const [budgetMin, setBudgetMin] = useState(service.budget_min != null ? String(service.budget_min) : "")
  const [budgetMax, setBudgetMax] = useState(service.budget_max != null ? String(service.budget_max) : "")
  const [status, setStatus] = useState<string>(service.status ?? "draft")
  const [deadline, setDeadline] = useState(service.deadline ?? "")
  const [saving, setSaving] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])

  const existingAttachments: any[] = Array.isArray(service.attachments) ? service.attachments : []
  const visibleAttachments = existingAttachments.filter((a) => !removedIds.includes(String(a.id)))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    setNewFiles((prev) => [...prev, ...picked])
    setNewPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))])
    e.target.value = ""
  }

  function removeNewFile(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  function removeExisting(id: string) {
    setRemovedIds((prev) => [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: any = { title, description, location, status, newFiles, removeAttachmentIds: removedIds }
      if (budgetMin) payload.budget_min = Number(budgetMin)
      if (budgetMax) payload.budget_max = Number(budgetMax)
      if (deadline) payload.deadline = deadline
      const updated = await updateServiceListing(service.id, payload)
      onUpdated(updated)
      toast.success("Service updated")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update service")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Edit Service</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Title</label>
            <input
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Location</label>
            <input
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Budget min (₦)</label>
              <input
                type="number"
                min={0}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Budget max (₦)</label>
              <input
                type="number"
                min={0}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Deadline</label>
            <input
              type="date"
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm [direction:rtl] text-left focus:border-primary focus:outline-none"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
            <select
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">Images</label>
            {(visibleAttachments.length > 0 || newPreviews.length > 0) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {visibleAttachments.map((a) => (
                  <div key={a.id} className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200">
                    <img src={a.url || a.filename} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExisting(String(a.id))}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-slate-400 hover:bg-slate-50">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              + Add images
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyServices() {
  return (
    <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl bg-white px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm">
        <CircleUserRound className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="text-base font-semibold text-slate-950">
        No services found
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        You haven&apos;t started any services yet.
      </p>

      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="h-12 w-full text-sm font-semibold sm:min-w-[160px] sm:w-auto">
          <Link href="/dashboard/jobs">Search for Jobs</Link>
        </Button>

        <Button asChild className="h-12 w-full bg-primary text-sm font-semibold hover:bg-primary/90 sm:min-w-[160px] sm:w-auto">
          <Link href="/dashboard/services/post">Post a service</Link>
        </Button>
      </div>
    </div>
  )
}

function ServiceCard({
  item,
  type,
  onViewDetails,
}: {
  item: DashboardActiveJobCard | DashboardHistoryCard
  type: "active" | "history"
  onViewDetails: (item: DashboardActiveJobCard | DashboardHistoryCard) => void
}) {
  const isHistory = type === "history"
  const status = isHistory ? "RELEASED" : (item as DashboardActiveJobCard).status
  const [reviewOpen, setReviewOpen] = useState(false)
  const canReview =
    isHistory ||
    ["RELEASED", "PARTIAL_RELEASED"].includes(String(status).toUpperCase())
  
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-yellow-100 text-[10px] text-yellow-700">
                {getInitials(item.customer.name)}
              </AvatarFallback>
            </Avatar>
            <span>Employer: {item.customer.name}</span>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
            status
          )}`}
        >
          {isHistory ? "Completed" : getStatusLabel(status)}
        </Badge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:flex sm:items-center sm:justify-end sm:gap-8">
        <span>
          Date initiated:{" "}
          <span className="text-slate-600">
            {isHistory ? (item as DashboardHistoryCard).completedDate : (item as DashboardActiveJobCard).deadline}
          </span>
        </span>
        <span>
          Time:{" "}
          <span className="text-slate-600">
            {formatTime(new Date().toISOString())}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => onViewDetails(item)}
          className="border-primary/30 text-primary hover:bg-primary/5 sm:min-w-[110px]"
        >
          View Details
        </Button>

        {!isHistory && (
          <Button className="bg-red-600 text-white hover:bg-red-700 sm:min-w-[110px]">
            Cancel service
          </Button>
        )}

        {canReview && item.customer.id && (
          <Button
            variant="outline"
            className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 sm:min-w-[110px]"
            onClick={() => setReviewOpen(true)}
          >
            ⭐ Review Client
          </Button>
        )}
      </div>

      {item.customer.id && (
        <ReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          revieweeId={item.customer.id}
          revieweeName={item.customer.name}
          jobId={item.jobId || undefined}
          jobTitle={item.title}
        />
      )}
    </div>
  )
}

function JobDetailsDialog({
  open,
  onOpenChange,
  title,
  job,
  type,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  job: DashboardActiveJobCard | DashboardHistoryCard | null
  type: "active" | "history"
}) {
  const [showSentRequests, setShowSentRequests] = useState(false)

  if (!job) return null

  const isHistory = type === "history"
  const historyJob = job as DashboardHistoryCard
  const activeJob = job as DashboardActiveJobCard

  return (
    <>
    <SentRequestsModal open={showSentRequests} onClose={() => setShowSentRequests(false)} />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Job title</p>
            <p className="mt-1 font-semibold text-slate-950">
              {job.title || "Untitled job"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Budget</p>
              <p className="mt-1 font-semibold text-slate-950">
                {job.budget || "Budget not set"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-500">
                {isHistory ? "Completed" : "Deadline"}
              </p>
              <p className="mt-1 font-semibold text-slate-950">
                {isHistory
                  ? formatDate(historyJob.completedDate)
                  : formatDate(activeJob.deadline)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-100 p-4 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Job ID</span>
              <span className="max-w-[190px] truncate text-right font-medium text-slate-900">
                {job.jobId || job.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Location</span>
              <span className="max-w-[190px] text-right font-medium text-slate-900">
                {job.location || "—"}
              </span>
            </div>

            {!isHistory && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-900 capitalize">
                  {activeJob.status || "Active"}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Customer</span>
              <span className="max-w-[190px] text-right font-medium text-slate-900">
                {job.customer?.name || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Customer email</span>
              <span className="max-w-[190px] truncate text-right font-medium text-slate-900">
                {job.customer?.email || "—"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowSentRequests(true)}
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary/5"
          >
            <Send className="mr-2 h-4 w-4" />
            Message Requests Sent
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [summary, setSummary] = useState<any>(null)
  const [jobRequests, setJobRequests] = useState<DashboardRequestCard[]>([])
  const [activeJobs, setActiveJobs] = useState<DashboardActiveJobCard[]>([])
  const [completedJobs, setCompletedJobs] = useState<DashboardHistoryCard[]>([])
  const [loading, setLoading] = useState(true)
const [selectedActiveJob, setSelectedActiveJob] =
  useState<DashboardActiveJobCard | null>(null)

  const [selectedHistoryJob, setSelectedHistoryJob] =
    useState<DashboardHistoryCard | null>(null)

  const [requestPage, setRequestPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  const [requestPagination, setRequestPagination] = useState<PaginationMeta | null>(null)
  const [activePagination, setActivePagination] = useState<PaginationMeta | null>(null)
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta | null>(null)

  const [postedServices, setPostedServices] = useState<ServiceRecord[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)  

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)

        const [s, req, act, hist, svcs] = await Promise.all([
          getArtisanDashboardSummary(),
          getArtisanJobRequests(requestPage, 6),
          getArtisanActiveJobs(activePage, 6),
          getArtisanJobHistory(historyPage, 6),
          listMyServices(),
        ])

        if (cancelled) return

        const reqPaginated = normalizePaginatedResponse<any>(req)
        const activePaginated = normalizePaginatedResponse<any>(act)
        const historyPaginated = normalizePaginatedResponse<any>(hist)

        setSummary(s || null)

        setJobRequests(reqPaginated.data.map(mapRequest))
        setActiveJobs(activePaginated.data.map(mapActiveJob))
        setCompletedJobs(historyPaginated.data.map(mapHistoryJob))

        setRequestPagination(reqPaginated.pagination)
        setActivePagination(activePaginated.pagination)
        setHistoryPagination(historyPaginated.pagination)

        setPostedServices(Array.isArray(svcs) ? svcs : [])
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [requestPage, activePage, historyPage])

  useEffect(() => {
    if (activeTab !== "upcoming") return
    let cancelled = false
    listMyServices()
      .then((data) => { if (!cancelled) setPostedServices(Array.isArray(data) ? data : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [activeTab])

  const artisan = summary?.artisan || {}

  const artisanName =
    artisan.name ||
    artisan.fullName ||
    artisan.businessName ||
    summary?.name ||
    "Artisan"

  const profileImage =
    artisan.profileImage ||
    artisan.profile_image ||
    summary?.profileImage ||
    ""

  const monthlyEarnings = Number(summary?.monthlyEarnings || 0)
  const completedJobsCount = Number(summary?.completedJobs || completedJobs.length || 0)
  const activeJobsCount = Number(summary?.activeJobs || activeJobs.length || 0)
  const pendingRequests = Number(summary?.pendingRequests || jobRequests.length || 0)
  const walletBalance = Number(summary?.walletBalance || 0)

  const totalJobs = activeJobsCount + completedJobsCount + pendingRequests

  const calculatedProfileFields = useMemo(() => {
    const profile = artisan || {}

    return [
      profileImage,
      profile.bio,
      profile.location,
      profile.experience,
      profile.hourlyRate || profile.hourly_rate,
      profile.service || profile.service_type,
      Array.isArray(profile.skills) && profile.skills.length > 0,
    ]
  }, [artisan, profileImage])

  const fallbackProfileProgress = Math.min(
    100,
    Math.round(
      (calculatedProfileFields.filter(Boolean).length /
        calculatedProfileFields.length) *
        100
    )
  )

  const backendProfileProgress = Number(
    summary?.profileCompletion ?? artisan?.profileCompletion
  )

  const profileProgress = Number.isFinite(backendProfileProgress)
    ? Math.min(100, Math.max(0, backendProfileProgress))
    : fallbackProfileProgress

  const missingProfileItems = [
    !profileImage && "Avatar",
    !artisan?.bio && "Bio",
    !artisan?.location && "Location",
    !artisan?.experience && "Experience",
    !(artisan?.service || artisan?.service_type) && "Service type",
    !(Array.isArray(artisan?.skills) && artisan.skills.length > 0) && "Skills",
  ].filter(Boolean) as string[]

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)_280px]">
        {/* Left Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2">
            <Link
              href="/dashboard/artisan"
              className="flex items-center gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dashboard
            </Link>

            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse Jobs
            </Link>

            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              My bookings
            </Link>

            <Link
              href="/dashboard/services/post"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Post Service
            </Link>

            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wallet
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Settings
            </Link>

            <Link
              href="/support"
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Support
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <section>
          <div className="mb-7">
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-950 sm:text-[30px]">
              Welcome Back, {artisanName}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here is a quick overview of your activities
            </p>
          </div>

          <div className="mb-7 flex flex-wrap gap-x-10 gap-y-4 border-b border-slate-100 pb-6 text-sm font-medium text-primary">
            <Link href="/profile/setup">
              Manage profile
            </Link>

            <Link href={`/artisan/${artisan.artisanId}`}>
              View public profile
            </Link>

            <Link href="/dashboard/services/post">Post A Service</Link>
            <Link href="/dashboard/jobs">Top clients</Link>
            <Link href="/dashboard/saved-jobs">Saved jobs</Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5 grid h-auto w-full grid-cols-3 rounded-lg border bg-white p-1">
              <TabsTrigger value="active" className="flex-col gap-0.5 py-2 text-[10px] sm:flex-row sm:text-xs">
                <span className="sm:hidden">Active</span>
                <span className="hidden sm:inline">Active services</span>
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500 sm:ml-2">
                  {activePagination?.total ?? activeJobs.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="upcoming" className="flex-col gap-0.5 py-2 text-[10px] sm:flex-row sm:text-xs">
                <span className="sm:hidden">Posted</span>
                <span className="hidden sm:inline">Posted services</span>
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500 sm:ml-2">
                  {postedServices.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="history" className="flex-col gap-0.5 py-2 text-[10px] sm:flex-row sm:text-xs">
                <span className="sm:hidden">History</span>
                <span className="hidden sm:inline">Service history</span>
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500 sm:ml-2">
                  {historyPagination?.total ?? completedJobs.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeJobs.length ? (
                <>
                <div className="space-y-4">
                  {activeJobs.map((item) => (
                    <ServiceCard
                      key={item.id}
                      item={item}
                      type="active"
                      onViewDetails={(job) =>
                        setSelectedActiveJob(job as DashboardActiveJobCard)
                      }
                    />
                  ))}
                </div>

                {activePagination && (
                  <PaginationControl
                    pagination={activePagination}
                    onPageChange={setActivePage}
                  />
                )}
                </>
              ) : (
                <EmptyServices />
              )}
            
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              {servicesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : postedServices.length === 0 ? (
                <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl bg-white px-4 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm">
                    <Briefcase className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">No services posted yet</h3>
                  <p className="mt-1 text-sm text-slate-500">Services you post will appear here.</p>
                  <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button asChild className="h-12 w-full bg-primary text-sm font-semibold hover:bg-primary/90 sm:min-w-[160px] sm:w-auto">
                      <Link href="/dashboard/services/post">Post a service</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {postedServices.map((svc) => (
                    <PostedServiceCard
                      key={svc.id}
                      service={svc}
                      onEdit={() => setEditingService(svc)}
                      onDelete={async () => {
                        if (!confirm("Delete this service listing? This cannot be undone.")) return
                        setDeletingServiceId(svc.id)
                        try {
                          await deleteServiceListing(svc.id)
                          setPostedServices((prev) => prev.filter((s) => s.id !== svc.id))
                          toast.success("Service deleted")
                        } catch (err: any) {
                          toast.error(err?.message ?? "Failed to delete service")
                        } finally {
                          setDeletingServiceId(null)
                        }
                      }}
                      deleting={deletingServiceId === svc.id}
                    />
                  ))}
                </div>
              )}

              {editingService && (
                <PostedServiceModal
                  service={editingService}
                  onClose={() => setEditingService(null)}
                  onUpdated={(updated) => {
                    setPostedServices((prev) => prev.map((s) => s.id === updated.id ? updated : s))
                    setEditingService(null)
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : completedJobs.length ? (
                <>
                <div className="space-y-4">
                  {completedJobs.map((item) => (
                      <ServiceCard
                        key={item.id}
                        item={item}
                        type="history"
                        onViewDetails={(job) =>
                          setSelectedHistoryJob(job as DashboardHistoryCard)
                        }
                      />
                  ))}
                </div>
                          {historyPagination && (
                <PaginationControl
                  pagination={historyPagination}
                  onPageChange={setHistoryPage}
                />
              )}
              </>
              ) : (
                <EmptyServices />
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Right Panel */}
        <aside className="space-y-4">
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-700">Complete your profile</span>
                <span className="text-xs text-slate-700">{profileProgress}%</span>
              </div>

              <Progress value={profileProgress} className="mb-4 h-1.5" />

              <p className="mb-3 text-xs text-slate-500">
                Improve your profile by completing:
              </p>

              <div className="space-y-2">
                {(missingProfileItems.length ? missingProfileItems.slice(0, 3) : ["Profile completed"]).map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between text-xs text-slate-600"
                    >
                      <span>— {item}</span>
                      <span className="font-medium text-primary">+10%</span>
                    </div>
                  )
                )}
              </div>

              <Link
                href="/profile/setup"
                className="mt-4 flex items-center gap-2 text-xs font-medium text-primary"
              >
                Complete profile
                <ChevronDown className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <h2 className="mb-4 text-xl font-semibold text-slate-950">Earnings</h2>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Estimated earnings</span>
                  <span className="font-medium text-slate-700">
                    {formatMoney(monthlyEarnings)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
                  <span className="text-slate-500">Completed jobs</span>
                  <span className="font-medium text-slate-700">
                    {completedJobsCount}
                  </span>
                </div>

                <div>
                  <p className="mb-3 text-sm text-slate-500">Payment method</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>**** **** **** 1234</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Wallet balance</span>
                  <span className="font-medium text-slate-700">
                    {formatMoney(walletBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Jobs</span>
                  <span className="font-medium text-slate-700">
                    {totalJobs} jobs
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

        <JobDetailsDialog
        open={!!selectedActiveJob}
        onOpenChange={(open) => {
          if (!open) setSelectedActiveJob(null)
        }}
        title="Active Service Details"
        job={selectedActiveJob}
        type="active"
      />

      <JobDetailsDialog
        open={!!selectedHistoryJob}
        onOpenChange={(open) => {
          if (!open) setSelectedHistoryJob(null)
        }}
        title="Service History Details"
        job={selectedHistoryJob}
        type="history"
      />

      {/* Manage Profile Modal */}

    </main>
  )
}