"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Menu, X, MessageSquare, Search, User,
  Bell, LogOut, Briefcase, Calendar, Plus,
  CheckCheck, Wallet, Milestone, FileText, ShieldAlert,
} from "lucide-react"
import { getAuth, logoutEverywhere, getArtisanProfile, getMyProfile, type NotificationDTO } from "@/lib/api"
import { useUnreadMessages } from "@/lib/useUnreadMessages"
import { useNotifications } from "@/lib/useNotifications"

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "Just now"
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return "Just now"
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

function notifIcon(type: string) {
  if (type.startsWith("withdrawal")) return <Wallet className="h-4 w-4" />
  if (type.startsWith("milestone")) return <Milestone className="h-4 w-4" />
  if (type.startsWith("welcome")) return <Bell className="h-4 w-4" />
  if (type.startsWith("support")) return <ShieldAlert className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function NotificationPanel({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: NotificationDTO[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}) {
  return (
    <div className="w-80 max-h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">We&apos;ll notify you when something happens</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && onMarkRead(n.id)}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 flex gap-3 items-start ${
                n.is_read ? "opacity-60" : ""
              }`}
            >
              {/* Type icon */}
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                n.is_read ? "bg-gray-100 text-gray-400" : "bg-primary/10 text-primary"
              }`}>
                {notifIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug ${n.is_read ? "text-gray-500" : "text-gray-900"}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500 leading-snug line-clamp-2">
                  {n.body}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.created_at ?? n.createdAt)}</p>
              </div>

              {!n.is_read && (
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isArtisan, setIsArtisan] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const unreadMessages = useUnreadMessages()
  const { notifications, unreadCount: unreadNotifs, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    const sync = async () => {
      const auth = getAuth()
      const loggedIn = !!auth?.token
      setIsLoggedIn(loggedIn)
      setUserName(auth?.user?.name || "")
      const artisan = auth?.user?.role === "artisan"
      setIsArtisan(artisan)

      if (loggedIn && auth?.user?.id) {
        try {
          if (artisan) {
            const data = await getArtisanProfile(auth.user.id)
            setProfileImageUrl(data?.profile?.profileImage || "")
          } else {
            const data = await getMyProfile() as any
            setProfileImageUrl(data?.avatar_url || "")
          }
        } catch {
          // silently ignore — fallback to initials
        }
      }
    }

    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const handleLogout = async () => {
    await logoutEverywhere()
    setIsLoggedIn(false)
    setIsArtisan(false)
    setProfileImageUrl("")
    setIsMenuOpen(false)
    router.push("/auth/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (isArtisan) {
      router.push(q ? `/dashboard/jobs?q=${encodeURIComponent(q)}` : "/dashboard/jobs")
    } else {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
    }
  }

  const closeMobileMenu = () => setIsMenuOpen(false)

  const userInitials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U"

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0" onClick={closeMobileMenu}>
            <img src="/logomark.svg" alt="Brikcell Logo" className="h-8 w-7" />
            {/* <span className="text-2xl text-[rgba(167,59,218,1)] font-semibold">Brikcell</span> */}
          </Link>

          {/* ── Desktop Navigation (logged in) ── */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center space-x-6 flex-1 ml-4">
              <Link
                href={isArtisan ? "/dashboard/artisan" : "/dashboard/customer"}
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>

              {isArtisan ? (
                <>
                  <Link href="/dashboard/jobs" className="text-sm font-medium text-gray-700 hover:text-secondary transition-colors whitespace-nowrap">
                    Find a job
                  </Link>
                  <Link href="/dashboard/services/post" className="text-sm font-medium text-gray-700 hover:text-secondary transition-colors whitespace-nowrap">
                    Post a service
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
                    Find artisan
                  </Link>
                  <Link href="/post-job" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
                    Post a job
                  </Link>
                </>
              )}

              <Link
                href={isArtisan ? "/dashboard/bookings" : "/dashboard/customer/bookings"}
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                My bookings
              </Link>
            </nav>
          )}

          {/* ── Spacer for logged-out ── */}
          {!isLoggedIn && <div className="flex-1" />}

          {/* ── Right Section ── */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isLoggedIn ? (
              <>
                {/* Search box */}
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArtisan ? "Search jobs..." : "Search artisans, talents..."}
                    className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full w-52 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </form>

                {/* Messages icon */}
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-primary rounded-full border-2 border-white" />
                  )}
                </Link>

                {/* Notification bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadNotifs > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary border-2 border-white px-0.5 text-[9px] font-bold text-white leading-none">
                          {unreadNotifs > 9 ? "9+" : unreadNotifs}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-0 overflow-hidden rounded-xl shadow-lg border border-gray-100 mt-1">
                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadNotifs}
                      onMarkRead={markRead}
                      onMarkAllRead={markAllRead}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="focus:outline-none rounded-full ring-offset-2 focus:ring-2 focus:ring-primary/40">
                      <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage src={profileImageUrl || undefined} alt={userName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 mt-1">
                    <DropdownMenuItem asChild>
                      <Link href="/profile/setup" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hover:text-primary hover:bg-primary/10">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ml-auto"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            {isLoggedIn ? (
              <>
                {/* Mobile search */}
                <form onSubmit={(e) => { handleSearch(e); closeMobileMenu() }} className="relative px-1 mb-3">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArtisan ? "Search jobs..." : "Search artisans..."}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </form>

                <Link
                  href={isArtisan ? "/dashboard/artisan" : "/dashboard/customer"}
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>

                {isArtisan ? (
                  <>
                    <Link href="/dashboard/jobs" onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors">
                      <Briefcase className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Find a job</span>
                    </Link>
                    <Link href="/dashboard/services/post" onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors">
                      <Plus className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Post a service</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/search" onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <Search className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Find artisan</span>
                    </Link>
                    <Link href="/post-job" onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <Plus className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Post a job</span>
                    </Link>
                  </>
                )}

                <Link
                  href={isArtisan ? "/dashboard/bookings" : "/dashboard/customer/bookings"}
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Calendar className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">My bookings</span>
                </Link>

                <Link href="/messages" onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                  <div className="relative flex-shrink-0">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">Messages</span>
                  {unreadMessages > 0 && (
                    <span className="ml-auto h-5 min-w-[20px] px-1.5 bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                <Link href="/profile/setup" onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">My Profile</span>
                </Link>

                <div className="pt-2 border-t border-gray-100 mt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 space-y-2">
                <Link href="/auth/login" onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Sign In</span>
                </Link>
                <Link href="/auth/signup" onClick={closeMobileMenu}
                  className="flex items-center justify-center mx-3 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">
                  <span className="text-sm font-medium">Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
