"use client"

import { usePathname } from "next/navigation"
import { Footer } from "./footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname.startsWith("/auth/") || pathname.startsWith("/messages")) return null
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Footer />
    </div>
  )
}
