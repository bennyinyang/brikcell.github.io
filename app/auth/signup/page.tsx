"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AuthAPI } from "@/lib/api"

export default function SignUpPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    userType: "employer",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    skills: "",
    experience: "",
    location: "",
    phone: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const isArtisan = formData.userType === "artisan"

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (isArtisan) {
      if (!formData.skills.trim()) {
        newErrors.skills = "Skill and services are required"
      }

      if (!formData.location.trim()) {
        newErrors.location = "Location is required"
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required"
      }
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const role = isArtisan ? "artisan" : "employer"

      const payload: any = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role,
        name: formData.name,
      }

      if (role === "artisan") {
        payload.phone = formData.phone
        payload.location = formData.location
        payload.businessName = formData.businessName
        payload.skills = formData.skills
        payload.experience = formData.experience
      } else {
        if (formData.phone) payload.phone = formData.phone
        if (formData.location) payload.location = formData.location
      }

      await AuthAPI.signup(payload)

      setShowConfirmationModal(true)
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err?.message || "Signup failed",
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const goToVerifyCode = () => {
    router.push(
      `/auth/verify-otp?email=${encodeURIComponent(
        formData.email.trim().toLowerCase()
      )}&flow=signup`
    )
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        {/* LEFT IMAGE PANEL */}
        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/auth/signup-hero.png')",
            }}
          />

          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute bottom-[92px] left-[86px] max-w-[620px] text-white">
            <h1 className="text-[58px] font-semibold leading-[1.14] tracking-[-0.045em]">
              Join Brikcell to <br />
              connect with trusted <br />
              artisans
            </h1>

            <p className="mt-7 max-w-[570px] text-[17px] leading-8 text-white">
              Join Brikcell where you can connect with a diverse group of
              talented artisans. Here, you’ll find skilled professionals who are
              dedicated to their craft and ready to cater to your needs.
            </p>

            <div className="mt-9 flex items-center gap-5">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-11 w-11 rounded-full border-2 border-white bg-slate-200"
                  />
                ))}
              </div>

              <div>
                <div className="flex items-center gap-1 text-[15px]">
                  <span className="text-yellow-400">★★★★★</span>
                  <span className="ml-2 text-white">5.0</span>
                </div>
                <p className="mt-1 text-[13px] text-white">
                  from 200+ reviews
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM PANEL */}
        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-slate-950">
                Sign up
              </h2>
              <p className="mt-3 text-[14px] text-slate-500">
                Join Brikcell to connect with trusted artisans
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.form && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[13px] font-medium text-slate-800">
                  I want to join as:
                </Label>

                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => handleInputChange("userType", value)}
                  className="flex items-center gap-9"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="employer" id="employer" />
                    <Label
                      htmlFor="employer"
                      className="cursor-pointer text-[14px] font-normal text-slate-800"
                    >
                      Employer
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="artisan" id="artisan" />
                    <Label
                      htmlFor="artisan"
                      className="cursor-pointer text-[14px] font-normal text-slate-800"
                    >
                      Artisan
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <FieldError error={errors.name}>
                <Label htmlFor="name" className="text-[13px] text-slate-800">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                  className="h-11 rounded-md border-slate-200 text-[15px]"
                />
              </FieldError>

              <FieldError error={errors.email}>
                <Label htmlFor="email" className="text-[13px] text-slate-800">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className="h-11 rounded-md border-slate-200 text-[15px]"
                />
              </FieldError>

              {isArtisan && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="businessName"
                      className="text-[13px] text-slate-800"
                    >
                      Business name{" "}
                      <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) =>
                        handleInputChange("businessName", e.target.value)
                      }
                      placeholder="Enter your business name"
                      className="h-11 rounded-md border-slate-200 text-[15px]"
                    />
                  </div>

                  <FieldError error={errors.skills}>
                    <Label
                      htmlFor="skills"
                      className="text-[13px] text-slate-800"
                    >
                      Skill and services
                    </Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) =>
                        handleInputChange("skills", e.target.value)
                      }
                      placeholder="Enter your business name"
                      className="h-11 rounded-md border-slate-200 text-[15px]"
                    />
                  </FieldError>

                  <div className="grid grid-cols-[1fr_110px] gap-3">
                    <FieldError error={errors.location}>
                      <Label
                        htmlFor="location"
                        className="text-[13px] text-slate-800"
                      >
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        placeholder="City, State"
                        className="h-11 rounded-md border-slate-200 text-[15px]"
                      />
                    </FieldError>

                    <FieldError error={errors.phone}>
                      <Label
                        htmlFor="phone"
                        className="text-[13px] text-slate-800"
                      >
                        Phone number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="234"
                        className="h-11 rounded-md border-slate-200 text-[15px]"
                      />
                    </FieldError>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="experience"
                      className="text-[13px] text-slate-800"
                    >
                      Years of experience{" "}
                      <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) =>
                        handleInputChange("experience", e.target.value)
                      }
                      placeholder="e.g. 5 years"
                      className="h-11 rounded-md border-slate-200 text-[15px]"
                    />
                  </div>
                </>
              )}

              <FieldError error={errors.password}>
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
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Create a password"
                    className="h-11 rounded-md border-slate-200 pr-10 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[12px] text-slate-500">
                  Must be at least 8 characters.
                </p>
              </FieldError>

              <FieldError error={errors.confirmPassword}>
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
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm your password"
                    className="h-11 rounded-md border-slate-200 pr-10 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FieldError>

              <div>
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => {
                      setAgreeToTerms(Boolean(checked))
                      if (errors.terms) {
                        setErrors((prev) => ({ ...prev, terms: "" }))
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span className="text-[12px] leading-5 text-slate-500">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-primary">
                      Terms of Service
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="font-medium text-primary">
                      Policy
                    </Link>
                  </span>
                </label>

                {errors.terms && (
                  <p className="mt-1 text-xs text-red-500">{errors.terms}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90"
              >
                {isLoading ? "Creating account..." : "Get started"}
              </Button>

              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <GoogleIcon />
                Sign up with Google
              </button>

              <p className="pt-2 text-center text-[12px] text-slate-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-primary">
                  Log in
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

      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <DialogContent className="w-[calc(100%-32px)] max-w-[430px] rounded-xl border-0 p-0 shadow-2xl">
          <button
            type="button"
            onClick={() => setShowConfirmationModal(false)}
            className="absolute right-7 top-7 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-10 py-12 text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Mail className="h-6 w-6 text-slate-700" />
            </div>

            <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
              Confirmation Link Sent!
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              We sent a 4 digit pin to {formData.email || "your email"}
            </p>

            <Button
              type="button"
              onClick={goToVerifyCode}
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

function FieldError({
  children,
  error,
}: {
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="space-y-2">
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
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