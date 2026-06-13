"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, Mail, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AuthAPI } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResetModal, setShowResetModal] = useState(false)

  const router = useRouter()

  const normalizedEmail = email.trim().toLowerCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!normalizedEmail) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      await AuthAPI.forgotPassword({ email: normalizedEmail })
      setShowResetModal(true)
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const goToResetPin = () => {
    router.push(
      `/auth/verify-otp?email=${encodeURIComponent(normalizedEmail)}&mode=reset`
    )
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <AuthImagePanel />

        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <KeyRound className="h-4 w-4 text-slate-700" />
            </div>

            <div className="mb-7">
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
                Forgot password?
              </h1>
              <p className="mt-3 text-[13px] text-slate-500">
                No worries, we&apos;ll send your reset code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] text-slate-800">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-md border-slate-200 text-[15px]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90"
              >
                {isLoading ? "Sending..." : "Reset password"}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-[13px] text-slate-600 hover:text-slate-950"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to log in
                </Link>
              </div>
            </form>
          </div>

          <SupportEmail />
        </section>
      </div>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="w-[calc(100%-32px)] max-w-[430px] rounded-xl border-0 p-0 shadow-2xl">
          <button
            type="button"
            onClick={() => setShowResetModal(false)}
            className="absolute right-7 top-7 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-10 py-12 text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Mail className="h-6 w-6 text-slate-700" />
            </div>

            <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
              Reset Link Sent!
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              We sent a 6 digit pin to {normalizedEmail || "your email"}
            </p>

            <Button
              type="button"
              onClick={goToResetPin}
              className="mt-8 h-11 w-full rounded-md bg-primary text-sm font-medium text-white hover:bg-primary/90"
            >
              Enter code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function AuthImagePanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden lg:block">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/auth/forgot-hero.png')",
        }}
      />
    </section>
  )
}

function SupportEmail() {
  return (
    <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[12px] text-slate-500 lg:flex">
      <Mail className="h-4 w-4" />
      support@brikcell.com
    </div>
  )
}