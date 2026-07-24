"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getAuth, logoutEverywhere } from "@/lib/api"

export function LandingHeader() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!getAuth()?.token)
    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const handleSignOut = async () => {
    try { await logoutEverywhere() } catch { /* ignore */ }
    localStorage.removeItem("auth")
    window.dispatchEvent(new Event("storage"))
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src="/logomark.svg" alt="Brikcell" className="h-8 w-7" />
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button variant="ghost" className="hover:text-primary hover:bg-primary/10" onClick={handleSignOut}>
                Sign Out
              </Button>
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
        </div>
      </div>
    </header>
  )
}
