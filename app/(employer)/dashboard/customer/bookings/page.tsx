// empolyer bookings
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  Loader2,
  Search,
  UserRound,
  XCircle,
} from "lucide-react"
import { BookingModal } from "@/components/modals/booking-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookingDTO,
  BookingStatus,
  getAuth,
  listEmployerBookings,
  listEmployerBookingHistory,
  updateBookingStatusEmployer,
} from "@/lib/api"
import { Header } from "@/components/header"

type TabKey = "current" | "history"

function formatDate(value?: string) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name?: string) {
  const parts = String(name || "A")
    .trim()
    .split(" ")
    .filter(Boolean)

  if (!parts.length) return "A"

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getStatusLabel(status?: string) {
  const value = String(status || "").toLowerCase()

  if (value === "in_progress") return "In Progress"
  if (value === "scheduled") return "Scheduled"
  if (value === "completed") return "Completed"
  if (value === "cancelled") return "Cancelled"

  return value || "Unknown"
}

function getStatusClass(status?: string) {
  const value = String(status || "").toLowerCase()

  if (value === "in_progress") {
    return "border-orange-100 bg-orange-50 text-orange-700"
  }

  if (value === "scheduled") {
    return "border-blue-100 bg-blue-50 text-blue-700"
  }

  if (value === "completed") {
    return "border-green-100 bg-green-50 text-green-700"
  }

  if (value === "cancelled") {
    return "border-red-100 bg-red-50 text-red-700"
  }

  return "border-slate-100 bg-slate-50 text-slate-600"
}

function getJobTitle(booking: BookingDTO) {
  return booking.job?.title || booking.details?.title || "Custom Furniture Design"
}

function getTalentName(booking: BookingDTO) {
  return booking.artisan?.name || booking.details?.artisanName || "Assigned Talent"
}

function isCurrentBooking(booking: BookingDTO) {
  const status = String(booking.status || "").toLowerCase()
  return status === "in_progress" || status === "scheduled"
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "Browse Gigs", href: "/search" },
    { label: "My Bookings", href: "/dashboard/customer/bookings", active: true },
    { label: "Post a Gig", href: "/post-job" },
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

function EmptyBookingsState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <CalendarDays className="h-5 w-5 text-slate-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-950">
        No services found
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        You haven’t started any services yet.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/search">Search for Talent</Link>
        </Button>

        <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
          <Link href="/post-job">Post a gig</Link>
        </Button>
      </div>
    </div>
  )
}

function BookingDetailsPanel({ booking }: { booking: BookingDTO }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-slate-400">Job title</p>
          <p className="font-medium text-slate-900">{getJobTitle(booking)}</p>
        </div>

        <div>
          <p className="text-slate-400">Talent</p>
          <p className="font-medium text-slate-900">{getTalentName(booking)}</p>
        </div>

        <div>
          <p className="text-slate-400">Date</p>
          <p className="font-medium text-slate-900">
            {formatDate(booking.scheduled_at)}
          </p>
        </div>

        <div>
          <p className="text-slate-400">Time</p>
          <p className="font-medium text-slate-900">
            {formatTime(booking.scheduled_at)}
          </p>
        </div>

        {booking.job?.location && (
          <div>
            <p className="text-slate-400">Location</p>
            <p className="font-medium text-slate-900">{booking.job.location}</p>
          </div>
        )}

        {booking.job?.category && (
          <div>
            <p className="text-slate-400">Category</p>
            <p className="font-medium text-slate-900">{booking.job.category}</p>
          </div>
        )}
      </div>

      {booking.job?.description && (
        <div className="mt-4">
          <p className="text-slate-400">Description</p>
          <p className="mt-1 leading-relaxed text-slate-700">
            {booking.job.description}
          </p>
        </div>
      )}
    </div>
  )
}

function BookingCard({
  booking,
  onEdit,
  onStatusChange,
  isUpdatingStatus,
  history,
}: {
  booking: BookingDTO
  onEdit: (booking: BookingDTO) => void
  onStatusChange: (bookingId: string, status: BookingStatus) => void
  isUpdatingStatus: boolean
  history?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isActive = booking.status === "in_progress" || booking.status === "scheduled"

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 sm:hidden">
              <h3 className="text-sm font-semibold text-slate-950">
                {getJobTitle(booking)}
              </h3>

              <Badge className={`${getStatusClass(booking.status)} shrink-0 text-xs`}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>

            <h3 className="hidden text-sm font-semibold text-slate-950 sm:block">
              {getJobTitle(booking)}
            </h3>

            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-amber-100 text-[10px] text-amber-700">
                  {getInitials(getTalentName(booking))}
                </AvatarFallback>
              </Avatar>

              <p className="text-xs text-slate-600">
                Talent:{" "}
                <span className="font-medium">{getTalentName(booking)}</span>
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <Badge className={`${getStatusClass(booking.status)} text-xs`}>
              {getStatusLabel(booking.status)}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>Date ended: {formatDate(booking.scheduled_at)}</span>
          <span>Time: {formatTime(booking.scheduled_at)}</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Status updater — employer only, active bookings */}
          {!history && isActive && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Update status:</span>
              <Select
                value={booking.status}
                disabled={isUpdatingStatus}
                onValueChange={(val) =>
                  onStatusChange(booking.id, val as BookingStatus)
                }
              >
                <SelectTrigger className="h-8 w-[150px] rounded-md border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/5"
              onClick={() => setExpanded((prev) => !prev)}
            >
              View Details
              <ChevronDown
                className={`ml-1 h-3 w-3 transition ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </Button>

            {!history && isActive && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => onEdit(booking)}
              >
                Edit booking
              </Button>
            )}
          </div>
        </div>

        {expanded && <BookingDetailsPanel booking={booking} />}
      </CardContent>
    </Card>
  )
}

export default function EmployerBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("current")
  const [currentBookings, setCurrentBookings] = useState<BookingDTO[]>([])
  const [bookingHistory, setBookingHistory] = useState<BookingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] =
    useState<BookingDTO | null>(null)

  const auth = getAuth()

  async function loadBookings() {
    try {
      setLoading(true)

      const [currentRes, historyRes] = await Promise.all([
        listEmployerBookings(),
        listEmployerBookingHistory(),
      ])

      const safeCurrent = Array.isArray(currentRes) ? currentRes : []
      const safeHistory = Array.isArray(historyRes) ? historyRes : []

      setCurrentBookings(safeCurrent.filter(isCurrentBooking))
      setBookingHistory(safeHistory)
    } catch (error) {
      console.error("Failed to load employer bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  async function handleStatusChange(bookingId: string, status: BookingStatus) {
    try {
      setUpdatingStatusId(bookingId)
      await updateBookingStatusEmployer(bookingId, status)
      const label = getStatusLabel(status).toLowerCase()
      toast.success(
        status === "cancelled"
          ? "Booking cancelled"
          : `Booking marked as ${label}`
      )
      await loadBookings()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update booking status")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const visibleBookings = useMemo(() => {
    return activeTab === "current" ? currentBookings : bookingHistory
  }, [activeTab, currentBookings, bookingHistory])

  return (
    <>

    <Header />

    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
      <EmployerSidebar />

      <main className="min-w-0 flex-1">
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            My Bookings
          </h1>
        </div>

        <div className="mt-5 block sm:hidden">
          <Select value={activeTab} onValueChange={(value: TabKey) => setActiveTab(value)}>
            <SelectTrigger className="h-10 rounded-md border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <SelectValue />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="current">Current bookings</SelectItem>
              <SelectItem value="history">Booking history</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 hidden grid-cols-2 rounded-lg border border-slate-100 bg-white p-1 sm:grid">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`h-9 rounded-md text-xs transition ${
              activeTab === "current"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Current bookings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`h-9 rounded-md text-xs transition ${
              activeTab === "history"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Booking history
          </button>
        </div>

        <section className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[118px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : visibleBookings.length === 0 ? (
            <EmptyBookingsState />
          ) : (
            <div className="space-y-4">
              {visibleBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  history={activeTab === "history"}
                  isUpdatingStatus={updatingStatusId === booking.id}
                  onEdit={setEditingBooking}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    <BookingModal
        open={Boolean(editingBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBooking(null)
          }
        }}
        currentUser={auth?.user}
        participant={
          editingBooking?.artisan
            ? {
                id: editingBooking.artisan.id,
                name: editingBooking.artisan.name,
                email: editingBooking.artisan.email,
              }
            : null
        }
        initialBooking={editingBooking}
        onSaved={async () => {
          setEditingBooking(null)
          await loadBookings()
        }}
      />
    </>
  )
}