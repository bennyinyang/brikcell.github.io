"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, KeyRound, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthAPI } from "@/lib/api"

const OTP_LENGTH = 6

export default function VerifyOTPPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = (searchParams.get("email") || "").trim().toLowerCase()
  const mode = (searchParams.get("mode") || "").toLowerCase()
  const isResetMode = mode === "reset"

  const initialOtpStr = (searchParams.get("otp") || "")
    .replace(/\D/g, "")
    .slice(0, OTP_LENGTH)

  const initialOtpArray = Array.from(
    { length: OTP_LENGTH },
    (_, index) => initialOtpStr[index] ?? ""
  )

  const [otp, setOtp] = useState<string[]>(initialOtpArray)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1)

    const nextOtp = [...otp]
    nextOtp[index] = digit

    setOtp(nextOtp)
    setError("")

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)

    if (!pasted) return

    const nextOtp = Array.from(
      { length: OTP_LENGTH },
      (_, index) => pasted[index] ?? ""
    )

    setOtp(nextOtp)
    setError("")

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpString = otp.join("")

    if (otpString.length !== OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (isResetMode) {
        setIsSuccess(true)
        setIsLoading(false)

        setTimeout(() => {
          router.push(
            `/auth/reset-password?email=${encodeURIComponent(
              normalizedEmail
            )}&otp=${encodeURIComponent(otpString)}`
          )
        }, 700)

        return
      }

      await AuthAPI.verifyOtp({
        email: normalizedEmail,
        otp: otpString,
      })

      setIsSuccess(true)
      setIsLoading(false)

      setTimeout(() => {
        router.push("/auth/login")
      }, 800)
    } catch (err: any) {
      setError(err?.message || "Invalid verification code. Please try again.")
      setIsLoading(false)
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""))
      inputRefs.current[0]?.focus()
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError("Missing email address.")
      return
    }

    setResendCooldown(60)
    setError("")

    try {
      if (isResetMode) {
        await AuthAPI.forgotPassword({ email: email.trim().toLowerCase() })
      } else {
        await AuthAPI.sendOtp({ email: email.trim().toLowerCase() })
      }
    } catch (err: any) {
      setResendCooldown(0)
      setError(err?.message || "Failed to resend code. Please try again.")
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen w-full bg-white">
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
              Code Verified!
            </h2>

            <p className="mt-3 text-[15px] text-slate-500">
              Your verification code has been confirmed successfully.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: isResetMode
                ? "url('/auth/forgot-hero.png')"
                : "url('/auth/signup-hero.png')",
            }}
          />
          {!isResetMode && (
            <>
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            </>
          )}
        </section>

        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[460px]">
            {isResetMode && (
              <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <KeyRound className="h-4 w-4 text-slate-700" />
              </div>
            )}

            <h2 className="text-[34px] font-semibold tracking-[-0.045em] text-slate-950">
              {isResetMode ? "Reset pin" : "Verify email"}
            </h2>

            <p className="mt-3 text-[15px] text-slate-500">
              {isResetMode ? "We sent a " : "We sent a "}
              {OTP_LENGTH} digit code to{" "}
              <span className="text-slate-600">{email || "your email"}</span>
              {isResetMode ? " to reset your password" : ""}
            </p>

            <form onSubmit={handleSubmit} className="mt-9">
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onPaste={handlePaste}
                    onChange={(e) =>
                      handleInputChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-[66px] rounded-xl border-slate-200 bg-white text-center text-[34px] font-semibold text-slate-400 shadow-sm focus:border-primary focus:ring-primary/20 sm:h-[72px]"
                  />
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || otp.join("").length !== OTP_LENGTH}
                className="mt-8 h-12 w-full rounded-md bg-primary text-[15px] font-medium text-white hover:bg-primary/90"
              >
                {isLoading
                  ? "Checking..."
                  : isResetMode
                  ? "Set password"
                  : "Get started"}
              </Button>
            </form>

            <div className="mt-8 text-center text-[14px] text-slate-500">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Click to resend"}
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-[15px] text-slate-600 hover:text-slate-950"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to log in
              </Link>
            </div>
          </div>

          <SupportEmail />
        </section>
      </div>
    </main>
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