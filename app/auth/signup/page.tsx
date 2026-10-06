"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthAPI } from "@/lib/api"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

// Validates a single field and returns an error string or undefined
function validateField(field: string, value: string, formData: Record<string, string>, isArtisan: boolean): string | undefined {
  switch (field) {
    case "name":
      if (!value.trim()) return "Name is required"
      break
    case "email":
      if (!value.trim()) return "Email is required"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Please enter a valid email address"
      break
    case "password":
      if (!value) return "Password is required"
      if (value.length < 8) return "Password must be at least 8 characters"
      break
    case "confirmPassword":
      if (!value) return "Please confirm your password"
      if (value !== formData.password) return "Passwords do not match"
      break
    case "skills":
      if (isArtisan && !value.trim()) return "Skill and services are required"
      break
    case "location":
      if (isArtisan && !value.trim()) return "Location is required"
      break
    case "phone":
      if (isArtisan && !value.trim()) return "Phone number is required"
      break
  }
  return undefined
}

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
  // Tracks which fields the user has interacted with (to show errors only after blur)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  // Server / submit errors
  const [submitError, setSubmitError] = useState("")
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const isArtisan = formData.userType === "artisan"

  // Live validation — runs on every render but is fast
  const liveErrors = useMemo(() => {
    const e: Record<string, string> = {}
    const fields = isArtisan
      ? ["name", "email", "password", "confirmPassword", "skills", "location", "phone"]
      : ["name", "email", "password", "confirmPassword"]

    for (const f of fields) {
      const err = validateField(f, formData[f as keyof typeof formData], formData, isArtisan)
      if (err) e[f] = err
    }
    return e
  }, [formData, isArtisan])

  const isFormValid = Object.keys(liveErrors).length === 0

  // Returns the error to display for a field — only after the user has touched it
  const fieldError = (field: string) => (touched[field] ? liveErrors[field] : undefined)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields touched so all errors become visible
    const allFields = isArtisan
      ? ["name", "email", "password", "confirmPassword", "skills", "location", "phone"]
      : ["name", "email", "password", "confirmPassword"]
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])))

    if (!isFormValid) return
    if (!agreeToTerms) return

    setIsLoading(true)
    setSubmitError("")

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
      setSubmitError(err?.message || "Signup failed")
    } finally {
      setIsLoading(false)
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
            style={{ backgroundImage: "url('/auth/signup-hero.png')" }}
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
              talented artisans. Here, you'll find skilled professionals who are
              dedicated to their craft and ready to cater to your needs.
            </p>
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

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {submitError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              {/* User type */}
              <div className="space-y-3">
                <Label className="text-[13px] font-medium text-slate-800">
                  I want to join as:
                </Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => {
                    handleInputChange("userType", value)
                    setTouched({})
                    setAgreeToTerms(false)
                  }}
                  className="flex items-center gap-9"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="employer" id="employer" />
                    <Label htmlFor="employer" className="cursor-pointer text-[14px] font-normal text-slate-800">
                      Employer
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="artisan" id="artisan" />
                    <Label htmlFor="artisan" className="cursor-pointer text-[14px] font-normal text-slate-800">
                      Artisan
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Name */}
              <FieldError error={fieldError("name")}>
                <Label htmlFor="name" className="text-[13px] text-slate-800">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Enter your name"
                  className={inputCls(!!fieldError("name"))}
                />
              </FieldError>

              {/* Email */}
              <FieldError error={fieldError("email")}>
                <Label htmlFor="email" className="text-[13px] text-slate-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="Enter your email"
                  className={inputCls(!!fieldError("email"))}
                />
              </FieldError>

              {/* Artisan-only fields */}
              {isArtisan && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-[13px] text-slate-800">
                      Business name <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      placeholder="Enter your business name"
                      className="h-11 rounded-md border-slate-200 text-[15px]"
                    />
                  </div>

                  <FieldError error={fieldError("skills")}>
                    <Label htmlFor="skills" className="text-[13px] text-slate-800">
                      Skill and services
                    </Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => handleInputChange("skills", e.target.value)}
                      onBlur={() => handleBlur("skills")}
                      placeholder="e.g. Plumbing, Carpentry, Electrical"
                      className={inputCls(!!fieldError("skills"))}
                    />
                  </FieldError>

                  <div className="grid grid-cols-[1fr_130px] gap-3">
                    <FieldError error={fieldError("location")}>
                      <Label htmlFor="location" className="text-[13px] text-slate-800">
                        Location
                      </Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => {
                          handleInputChange("location", value)
                          handleBlur("location")
                        }}
                      >
                        <SelectTrigger
                          id="location"
                          className={inputCls(!!fieldError("location"))}
                        >
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {NIGERIA_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldError>

                    <FieldError error={fieldError("phone")}>
                      <Label htmlFor="phone" className="text-[13px] text-slate-800">
                        Phone number
                      </Label>
                      <div className={`flex h-11 overflow-hidden rounded-md border ${fieldError("phone") ? "border-red-400" : "border-slate-200"} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0`}>
                        <span className="flex items-center bg-slate-50 px-2.5 text-[13px] text-slate-500 border-r border-slate-200 shrink-0">
                          +234
                        </span>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          onBlur={() => handleBlur("phone")}
                          placeholder="8012345678"
                          className="h-full rounded-none border-0 text-[15px] shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </FieldError>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-[13px] text-slate-800">
                      Years of experience <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleInputChange("experience", e.target.value)}
                      placeholder="e.g. 5 years"
                      className="h-11 rounded-md border-slate-200 text-[15px]"
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <FieldError error={fieldError("password")}>
                <Label htmlFor="password" className="text-[13px] text-slate-800">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Create a password"
                    className={`${inputCls(!!fieldError("password"))} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!fieldError("password") && (
                  <p className="text-[12px] text-slate-500">Must be at least 8 characters.</p>
                )}
              </FieldError>

              {/* Confirm Password */}
              <FieldError error={fieldError("confirmPassword")}>
                <Label htmlFor="confirmPassword" className="text-[13px] text-slate-800">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder="Confirm your password"
                    className={`${inputCls(!!fieldError("confirmPassword"))} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldError>

              {/* Terms — disabled until all fields valid */}
              <div>
                <label className={`flex items-start gap-2 ${!isFormValid ? "cursor-not-allowed opacity-50" : ""}`}>
                  <Checkbox
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => {
                      if (!isFormValid) return
                      setAgreeToTerms(Boolean(checked))
                    }}
                    disabled={!isFormValid}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-[12px] leading-5 text-slate-500">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-primary">Terms of Service</Link>
                    {" "}&{" "}
                    <Link href="/privacy" className="font-medium text-primary">Policy</Link>
                  </span>
                </label>
                {!isFormValid && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Complete all required fields above to enable this option.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !agreeToTerms || !isFormValid}
                className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Get started"}
              </Button>

              <button
                type="button"
                disabled={!agreeToTerms || !isFormValid}
                onClick={() => { window.location.href = `${API}/auth/google?role=${formData.userType}` }}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                Sign up with Google
              </button>

              <p className="pt-2 text-center text-[12px] text-slate-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-primary">Log in</Link>
              </p>
            </form>
          </div>

          <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[12px] text-slate-500 lg:flex">
            <Mail className="h-4 w-4" />
            support@brikcell.com
          </div>
        </section>
      </div>

      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
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

function inputCls(hasError: boolean) {
  return `h-11 rounded-md text-[15px] border ${hasError ? "border-red-400 focus-visible:ring-red-300" : "border-slate-200"}`
}

function FieldError({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[12px] text-red-500">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm-.5 2.5h1v3h-1v-3zm0 4h1v1h-1v-1z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.05l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
