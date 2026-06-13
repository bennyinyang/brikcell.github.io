"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthAPI, saveAuth, type UserDTO } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const normalizedEmail = (email || "").trim().toLowerCase()
      const { token, user } = await AuthAPI.login({
        email: normalizedEmail,
        password,
      })

      saveAuth(token, user as UserDTO)

      if (user.role === "artisan") {
        router.push("/dashboard/artisan")
      } else if (user.role === "employer") {
        router.push("/dashboard/customer")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        {/* LEFT IMAGE PANEL */}
        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/auth/login-hero.png')",
            }}
          />
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 flex justify-center">

            </div>

            <div className="mb-7">
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
                Login
              </h1>
              <p className="mt-3 text-[13px] text-slate-500">
                Welcome back! Please enter your details.
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
                  required
                  className="h-11 rounded-md border-slate-200 text-[15px]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[13px] text-slate-800"
                >
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-md border-slate-200 pr-10 text-[15px]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <span className="text-[12px] text-slate-600">
                    Remember Me
                  </span>
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] font-medium text-primary hover:underline"
                >
                  Forgot password
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <GoogleIcon />
                Login with Google
              </button>

              <p className="pt-3 text-center text-[12px] text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="font-medium text-primary">
                  Sign up
                </Link>
              </p>
            </form>
          </div>

          <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[12px] text-slate-500 lg:flex">
            <Mail className="h-4 w-4" />
            support@brikcell.com
          </div>
        </section>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.94v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.05l3.02-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .94 4.95l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}