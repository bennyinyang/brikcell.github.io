"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthAPI } from "@/lib/api"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = (searchParams.get("email") || "").trim().toLowerCase()
  const otp = (searchParams.get("otp") || "").replace(/\D/g, "").slice(0, 6)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")

  const hasEightCharacters = password.length >= 8
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email || !otp || otp.length !== 6) {
      newErrors.form = "Missing reset code. Please restart the reset process."
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (!hasEightCharacters) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!hasSpecialCharacter) {
      newErrors.password = "Password must contain one special character"
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})
    setServerError("")

    try {
      await AuthAPI.resetPassword({
        email,
        otp,
        newPassword: password,
      })

      router.push("/auth/password-changed")
    } catch (err: any) {
      setServerError(err?.message || "Failed to update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <AuthImagePanel />

        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <LockKeyhole className="h-4 w-4 text-slate-700" />
            </div>

            <div className="mb-7">
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
                Set new password
              </h1>
              <p className="mt-3 text-[13px] leading-5 text-slate-500">
                Your new password must be different to previously used passwords.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {(errors.form || serverError) && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errors.form || serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] text-slate-800">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((prev) => ({ ...prev, password: "" }))
                    }}
                    className="h-11 rounded-md border-slate-200 pr-10 text-[15px]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[13px] text-slate-800"
                >
                  Confirm password
                </Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                    }}
                    className="h-11 rounded-md border-slate-200 pr-10 text-[15px]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <PasswordRule active={hasEightCharacters}>
                  Must be at least 8 characters
                </PasswordRule>
                <PasswordRule active={hasSpecialCharacter}>
                  Must contain one special character
                </PasswordRule>

                {errors.password && (
                  <p className="pt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90"
              >
                {isLoading ? "Resetting..." : "Reset password"}
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
    </main>
  )
}

function PasswordRule({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-slate-500">
      <CheckCircle2
        className={`h-4 w-4 ${
          active ? "text-green-500" : "text-slate-300"
        }`}
      />
      <span>{children}</span>
    </div>
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