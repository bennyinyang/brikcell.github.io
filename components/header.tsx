"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Menu, X, MessageSquare, Search, User, Wrench,
  Briefcase, LogOut, LayoutDashboard, HelpCircle,
} from "lucide-react"
import { getAuth, logoutEverywhere } from "@/lib/api"

export function Header() {
  const router = useRouter()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isArtisanMode, setIsArtisanMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const sync = () => {
      const auth = getAuth()
      setIsLoggedIn(!!auth?.token)
      if (auth?.user?.role === "artisan") setIsArtisanMode(true)
      if (auth?.user?.role === "employer") setIsArtisanMode(false)
    }

    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const handleLogout = async () => {
    await logoutEverywhere()
    setIsLoggedIn(false)
    setIsArtisanMode(false)
    setIsMenuOpen(false)
    router.push("/auth/login")
  }

  const closeMobileMenu = () => setIsMenuOpen(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0" onClick={closeMobileMenu}>
            <img src="/logomark.svg" alt="Brikcell Logo" className="h-8 w-7" />
            <span className="text-2xl text-[rgba(167,59,218,1)] font-semibold">Brikcell</span>
          </Link>

          {/* ── Mode Toggle (desktop) ── */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <span className={`text-sm font-medium transition-colors ${!isArtisanMode ? "text-primary" : "text-gray-500"}`}>
                User
              </span>
              <Switch
                checked={isArtisanMode}
                onCheckedChange={setIsArtisanMode}
                className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-primary"
                aria-label="Toggle between User and Artisan mode"
              />
              <span className={`text-sm font-medium transition-colors ${isArtisanMode ? "text-secondary" : "text-gray-500"}`}>
                Artisan
              </span>
            </div>
          )}

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                {!isArtisanMode ? (
                  <>
                    <Link href="/search" className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1">
                      <Search className="h-4 w-4" />
                      <span>Find Services</span>
                    </Link>
                    <Link href="/become-artisan" className="text-gray-700 hover:text-primary transition-colors">
                      Become an Artisan
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard/jobs" className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-1">
                      <Briefcase className="h-4 w-4" />
                      <span>Search Jobs</span>
                    </Link>
                    <Link href="/profile/setup" className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-1">
                      <Wrench className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </>
                )}
                <Link href="/messages" className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/search" className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1">
                  <Search className="h-4 w-4" />
                  <span>Find Services</span>
                </Link>
                <Link href="/become-artisan" className="text-gray-700 hover:text-primary transition-colors">
                  Become an Artisan
                </Link>
              </>
            )}
            <Link href="/how-it-works" className="text-gray-700 hover:text-primary transition-colors">
              How It Works
            </Link>
          </nav>

          {/* ── Desktop Auth Buttons ── */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  href={isArtisanMode ? "/dashboard/artisan" : "/dashboard/customer"}
                  className={`transition-colors flex items-center space-x-1 ${
                    isArtisanMode ? "text-gray-700 hover:text-secondary" : "text-gray-700 hover:text-primary"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-1">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
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
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
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

            {/* Mode toggle — mobile */}
            {isLoggedIn && (
              <div className="flex items-center justify-between px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Switch Mode</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${!isArtisanMode ? "text-primary" : "text-gray-400"}`}>
                    User
                  </span>
                  <Switch
                    checked={isArtisanMode}
                    onCheckedChange={setIsArtisanMode}
                    className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-primary"
                    aria-label="Toggle between User and Artisan mode"
                  />
                  <span className={`text-xs font-medium ${isArtisanMode ? "text-secondary" : "text-gray-400"}`}>
                    Artisan
                  </span>
                </div>
              </div>
            )}

            {/* Role-specific nav links */}
            {isLoggedIn ? (
              <>
                {/* Dashboard link */}
                <Link
                  href={isArtisanMode ? "/dashboard/artisan" : "/dashboard/customer"}
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>

                {!isArtisanMode ? (
                  <>
                    <Link
                      href="/search"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      <Search className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Find Services</span>
                    </Link>
                    <Link
                      href="/become-artisan"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      <Wrench className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Become an Artisan</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/jobs"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors"
                    >
                      <Briefcase className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Search Jobs</span>
                    </Link>
                    <Link
                      href="/profile/setup"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors"
                    >
                      <Wrench className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">My Profile</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/messages"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Messages</span>
                </Link>

                <Link
                  href="/how-it-works"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">How It Works</span>
                </Link>

                {/* Divider */}
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
              <>
                {/* Logged-out nav links */}
                <Link
                  href="/search"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Search className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Find Services</span>
                </Link>
                <Link
                  href="/become-artisan"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Wrench className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Become an Artisan</span>
                </Link>
                <Link
                  href="/how-it-works"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">How It Works</span>
                </Link>

                {/* Auth buttons */}
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Sign In</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center space-x-2 mx-3 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <span className="text-sm font-medium">Get Started</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header