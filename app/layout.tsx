
import type React from "react"
import type { Metadata } from "next"
import { Manrope, Urbanist } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { ConditionalFooter } from "@/components/conditional-footer"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorReporter } from "@/components/error-reporter"
import { DebugPanel } from "@/components/debug-panel"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
})

export const metadata: Metadata = {
  title: "Brikcell - Connecting You with Trusted Local Artisans",
  description:
    "Find skilled artisans for plumbing, carpentry, hair styling, electrical work and more. Your perfect artisan awaits!",
  generator: "Brikcell Marketplace",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${urbanist.variable} antialiased`}>
      <Toaster position="top-right" richColors />
      <body className="font-sans flex flex-col min-h-screen bg-gray-50">
        <ErrorReporter />
        <ErrorBoundary>
          <div className="flex-1 bg-white">{children}</div>
          <ConditionalFooter />
        </ErrorBoundary>
        <DebugPanel />
      </body>
    </html>
  )
}
