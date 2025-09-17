"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Menu, X, MessageSquare, Search, User, Wrench, Briefcase, LogOut } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isArtisanMode, setIsArtisanMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // This would typically come from auth context/provider

  const handleLogout = () => {
    setIsLoggedIn(false)
    // Add actual logout logic here
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shadow-none">
            <img src="/logomark.svg" alt="Brikcell Logo" className="h-8 w-7" />
            <span className="text-2xl text-[rgba(167,59,218,1)] shadow-none bg-transparent font-semibold">
              Brikcell
            </span>
          </Link>

          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <span
                className={`text-sm font-medium transition-colors ${!isArtisanMode ? "text-primary" : "text-gray-500"}`}
              >
                User
              </span>
              <Switch
                checked={isArtisanMode}
                onCheckedChange={setIsArtisanMode}
                className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-primary"
                aria-label="Toggle between User and Artisan mode"
              />
              <span
                className={`text-sm font-medium transition-colors ${isArtisanMode ? "text-secondary" : "text-gray-500"}`}
              >
                Artisan
              </span>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                {!isArtisanMode ? (
                  <>
                    <Link
                      href="/search"
                      className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1"
                    >
                      <Search className="h-4 w-4" />
                      <span>Find Services</span>
                    </Link>
                    <Link href="/become-artisan" className="text-gray-700 hover:text-primary transition-colors">
                      Become an Artisan
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/artisan"
                      className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-1"
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>My Jobs</span>
                    </Link>
                    <Link
                      href="/profile/setup"
                      className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-1"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </>
                )}
                <Link
                  href="/messages"
                  className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/search"
                  className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1"
                >
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

          {/* Desktop Auth Buttons */}
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
                <Button asChild className="hover:text-primary hover:bg-primary/10">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {isLoggedIn && (
              <div className="flex items-center justify-center space-x-3 bg-gray-50 rounded-full px-4 py-2 mb-4 mx-4">
                <span
                  className={`text-sm font-medium transition-colors ${!isArtisanMode ? "text-primary" : "text-gray-500"}`}
                >
                  User
                </span>
                <Switch
                  checked={isArtisanMode}
                  onCheckedChange={setIsArtisanMode}
                  className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-primary"
                  aria-label="Toggle between User and Artisan mode"
                />
                <span
                  className={`text-sm font-medium transition-colors ${isArtisanMode ? "text-secondary" : "text-gray-500"}`}
                >
                  Artisan
                </span>
              </div>
            )}

            <nav className="flex flex-col space-y-4">
              {isLoggedIn ? (
                <>
                  {!isArtisanMode ? (
                    <>
                      <Link
                        href="/search"
                        className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
                      >
                        <Search className="h-4 w-4" />
                        <span>Find Services</span>
                      </Link>
                      <Link href="/become-artisan" className="text-gray-700 hover:text-primary transition-colors">
                        Become an Artisan
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard/artisan"
                        className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-2"
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>My Jobs</span>
                      </Link>
                      <Link
                        href="/profile/setup"
                        className="text-gray-700 hover:text-secondary transition-colors flex items-center space-x-2"
                      >
                        <Wrench className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </>
                  )}
                  <Link
                    href="/messages"
                    className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                  <Link
                    href={isArtisanMode ? "/dashboard/artisan" : "/dashboard/customer"}
                    className={`transition-colors flex items-center space-x-2 ${
                      isArtisanMode ? "text-gray-700 hover:text-secondary" : "text-gray-700 hover:text-primary"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/search"
                    className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
                  >
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

              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {isLoggedIn ? (
                  <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2 justify-start">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="hover:text-primary hover:bg-primary/10">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                    <Button asChild className="hover:text-primary hover:bg-primary/10">
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
