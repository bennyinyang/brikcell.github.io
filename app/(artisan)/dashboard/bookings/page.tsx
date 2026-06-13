"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ImageIcon,
  Menu,
  MessageSquare,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getAuth,
  listArtisanBookings,
  listArtisanBookingHistory,
  type BookingRecord,
  updateBookingStatusArtisan,
} from "@/lib/api"


import { Header } from "@/components/header"

type BookingTab = "current" | "history"

function formatDate(value?: string | null) {
  if (!value) return "Not set"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "Not set"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getJob(booking: BookingRecord) {
  return booking.Job || booking.job || null
}

function getClientName(booking: BookingRecord) {
  return booking.customer?.name || "Client"
}

function getBookingTitle(booking: BookingRecord) {
  const job = getJob(booking)
  return job?.title || booking.details?.title || "Custom Furniture Design"
}

function getBookingLocation(booking: BookingRecord) {
  const job = getJob(booking)
  return job?.location || booking.details?.location || ""
}

function getStatusLabel(status: string) {
  const s = String(status || "").toLowerCase()

  if (s === "scheduled") return "In progress"
  if (s === "completed") return "Completed"
  if (s === "cancelled") return "Cancelled"

  return s || "Pending"
}

function getStatusClass(status: string) {
  const s = String(status || "").toLowerCase()

  if (s === "completed") return "border-green-200 bg-green-50 text-green-700"
  if (s === "cancelled") return "border-red-200 bg-red-50 text-red-700"

  return "border-orange-200 bg-orange-50 text-orange-700"
}

function EmptyBookingsState() {
  return (
    <div className="flex min-h-[430px] items-center justify-center">
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="absolute h-72 w-72 rounded-full border border-slate-100" />
        <div className="absolute mt-6 h-60 w-60 rounded-full border border-slate-100" />
        <div className="absolute mt-12 h-48 w-48 rounded-full border border-slate-100" />
        <div className="absolute mt-20 h-36 w-36 rounded-full border border-slate-100" />

        <div className="relative mt-24 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <ImageIcon className="h-5 w-5 text-slate-500" />
        </div>

        <h3 className="relative mt-5 text-sm font-semibold text-slate-950">No booking found</h3>
        <p className="relative mt-1 text-xs text-slate-500">
          You haven’t started any services yet.
        </p>

        <div className="relative mt-5 flex items-center gap-3">
          <Link href="/dashboard/jobs">
            <Button variant="outline" className="h-9 rounded-md px-5 text-xs">
              Search for Jobs
            </Button>
          </Link>

          <Link href="/dashboard/services/post">
            <Button className="h-9 rounded-md bg-primary px-5 text-xs text-white hover:bg-primary/90">
              + Post a service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  onView,
  onCancel,
  isCancelling,
}: {
  booking: BookingRecord
  onView: (booking: BookingRecord) => void
  onCancel: (booking: BookingRecord) => void
  isCancelling: boolean
}) {
  const status = String(booking.status || "scheduled")
  const title = getBookingTitle(booking)
  const client = getClientName(booking)

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-[10px]">
                  👷
                </div>
                <span>User: {client}</span>
              </div>
            </div>

            <Badge
              className={`rounded-md border px-2 py-1 text-[11px] font-normal lg:hidden ${getStatusClass(status)}`}
            >
              {getStatusLabel(status)}
            </Badge>
          </div>

          {getBookingLocation(booking) && (
            <p className="mt-2 text-xs text-slate-500">{getBookingLocation(booking)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 lg:min-w-[300px]">
          <div>
            <span className="text-slate-500">Date initiated: </span>
            <span>{formatDate(booking.scheduled_at)}</span>
          </div>

          <div>
            <span className="text-slate-500">Time: </span>
            <span>{formatTime(booking.scheduled_at)}</span>
          </div>
        </div>

        <div className="hidden lg:block">
          <Badge className={`rounded-md border px-2 py-1 text-[11px] font-normal ${getStatusClass(status)}`}>
            • {getStatusLabel(status)}
          </Badge>
        </div>

        <div className="flex items-center gap-3 lg:min-w-[215px] lg:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onView(booking)}
            className="h-9 flex-1 rounded-md border-primary/30 text-xs text-primary hover:bg-primary/5 lg:flex-none lg:px-7"
          >
            View Details
          </Button>

          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <Button
              type="button"
              onClick={() => onCancel(booking)}
              disabled={isCancelling}
              className="h-9 flex-1 rounded-md bg-red-600 text-xs text-white hover:bg-red-700 lg:flex-none lg:px-7"
            >
              {isCancelling ? "Cancelling..." : "Cancel service"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingDetailsModal({
  booking,
  onClose,
}: {
  booking: BookingRecord | null
  onClose: () => void
}) {
  if (!booking) return null

  const job = getJob(booking)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{getBookingTitle(booking)}</h2>
            <p className="mt-1 text-sm text-slate-500">Booking details</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="mt-1 font-medium text-slate-950">{getClientName(booking)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge className={`mt-1 rounded-md border px-2 py-1 text-[11px] ${getStatusClass(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>

            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="mt-1 font-medium text-slate-950">{formatDate(booking.scheduled_at)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Time</p>
              <p className="mt-1 font-medium text-slate-950">{formatTime(booking.scheduled_at)}</p>
            </div>
          </div>

          {job?.location && (
            <div>
              <p className="text-xs text-slate-500">Location</p>
              <p className="mt-1 text-slate-800">{job.location}</p>
            </div>
          )}

          {job?.description && (
            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="mt-1 leading-6 text-slate-800">{job.description}</p>
            </div>
          )}

          {booking.details && Object.keys(booking.details || {}).length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Extra details</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                {JSON.stringify(booking.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose} className="bg-primary text-white hover:bg-primary/90">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ArtisanBookingsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<BookingTab>("current")
  const [currentBookings, setCurrentBookings] = useState<BookingRecord[]>([])
  const [historyBookings, setHistoryBookings] = useState<BookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    setToken(auth?.token ?? null)
  }, [])

  const fetchBookings = async (authToken: string) => {
    try {
      setIsLoading(true)

      const [current, history] = await Promise.all([
        listArtisanBookings(authToken),
        listArtisanBookingHistory(authToken),
      ])

      setCurrentBookings(Array.isArray(current) ? current : [])
      setHistoryBookings(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error("Failed to load bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchBookings(token)
  }, [token])

  const visibleBookings = activeTab === "current" ? currentBookings : historyBookings

  const handleCancel = async (booking: BookingRecord) => {
    if (!token) {
      toast.error("You must be logged in")
      return
    }

    try {
      setCancellingId(booking.id)

      await updateBookingStatusArtisan(booking.id, "", token, "cancelled")

      toast.success("Booking cancelled")

      await fetchBookings(token)
    } catch (error: any) {
      console.error("Failed to cancel booking:", error)
      toast.error(error?.message || "Failed to cancel booking")
    } finally {
      setCancellingId(null)
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
              <Link href="/dashboard/artisan" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Dashboard
              </Link>

              <Link href="/dashboard/jobs" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Browse Gigs
              </Link>

              <Link
                href="/dashboard/bookings"
                className="block rounded-md bg-slate-50 px-3 py-2 font-medium text-slate-950"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                My Bookings
              </Link>

              <Link href="/dashboard/services/post" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Post Service
              </Link>

              <Link href="/dashboard/wallet" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Wallet
              </Link>

              <Link href="/dashboard/settings" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Settings
              </Link>

              <Link href="/support" className="block rounded-md px-3 py-2 hover:bg-slate-50">
                Support
              </Link>
            </nav>
          </aside>

          {/* Content */}
          <section className="w-full">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Booking history
              </h1>
            </div>

            {/* Mobile tab */}
            <div className="mb-5 block lg:hidden">
              <Select value={activeTab} onValueChange={(value: BookingTab) => setActiveTab(value)}>
                <SelectTrigger className="h-10 rounded-md border-slate-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current bookings</SelectItem>
                  <SelectItem value="history">Booking history</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop tabs */}
            <div className="mb-6 hidden rounded-lg border border-slate-100 bg-white p-1 lg:grid lg:grid-cols-2">
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

            {isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
                Loading bookings...
              </div>
            ) : visibleBookings.length === 0 ? (
              <EmptyBookingsState />
            ) : (
              <div className="space-y-5">
                {visibleBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onView={setSelectedBooking}
                    onCancel={handleCancel}
                    isCancelling={cancellingId === booking.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  )
}