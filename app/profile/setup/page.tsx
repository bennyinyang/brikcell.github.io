"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { ArtisanProfileSetup } from "@/components/profile/artisan-profile-setup"
import { EmployerProfileSetup } from "@/components/profile/employer-profile-setup"
import { getAuth } from "@/lib/api"
function ArtisanSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/artisan" },
    { label: "Browse Jobs", href: "/dashboard/jobs" },
    { label: "My Bookings", href: "/dashboard/bookings" },
    { label: "Post Service", href: "/dashboard/services/post" },
    { label: "Wallet", href: "/dashboard/wallet" },
    { label: "My Profile", href: "/profile/setup", active: true },
    { label: "Settings", href: "/dashboard/settings" },
    { label: "Support", href: "/support" },
  ]
  return (
    <aside className="hidden w-[170px] shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1 text-sm">
        {items.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 transition ${
              active
                ? "bg-slate-50 font-semibold text-slate-950"
                : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "Find Artisan", href: "/search" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Post a Job", href: "/post-job" },
    { label: "Wallet", href: "/dashboard/customer/wallet" },
    { label: "My Profile", href: "/profile/setup", active: true },
    { label: "Settings", href: "/dashboard/customer/settings" },
    { label: "Support", href: "/support" },
  ]
  return (
    <aside className="hidden w-[170px] shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1 text-sm">
        {items.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 transition ${
              active
                ? "bg-slate-50 font-semibold text-slate-950"
                : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function ProfileSetupPage() {
  const [role, setRole] = useState<"artisan" | "employer" | null>(null)

  useEffect(() => {
    const auth = getAuth()
    setRole(auth?.user?.role === "artisan" ? "artisan" : "employer")
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {role === "artisan" && <ArtisanSidebar />}
          {role === "employer" && <EmployerSidebar />}

          <div className="min-w-0 flex-1">
            {role === "artisan" && <ArtisanProfileSetup />}
            {role === "employer" && <EmployerProfileSetup />}
            {role === null && (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
