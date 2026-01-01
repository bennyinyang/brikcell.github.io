"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft, Lock, Check } from "lucide-react"
import { AuthAPI } from "@/lib/api"

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = (searchParams.get("email") || "").trim().toLowerCase()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!otp || otp.trim().length !== 6) {
      newErrors.otp = "Enter the 6-digit code sent to your email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
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
      if (!email) {
        throw new Error("Missing email. Please restart the reset process.")
      }
      await AuthAPI.resetPassword({
        email,
        otp: otp.trim(),
        newPassword: password
      })
      setTimeout(() => {
        router.push("/auth/password-changed")
      }, 2000)
    } catch (err: any) {
      setServerError(err?.message || "Failed to update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "password") {
      setPassword(value)
    } else if (field === "confirmPassword") {
      setConfirmPassword(value)
    } else if (field === "otp") {
      setOtp(value.replace(/\D/g, "").slice(0, 6)) // digits only, max 6
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-0 shadow-lg bg-card">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Password Reset!</h2>
                <p className="text-muted-foreground mt-2">Your password has been successfully updated.</p>
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to confirmation page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary/90 via-secondary to-secondary/80 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/professional-painter.png')",
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-secondary/60 to-secondary/90" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6 leading-tight">Create New Password</h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Choose a strong, secure password to protect your Brikcell account. Make it unique and memorable for you.
            </p>
            <div className="space-y-4 text-white/80">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Strong password protection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Encrypted data storage</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Secure account access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Login */}
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>

          {/* Form Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Reset password</CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Create a new secure password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-foreground">
                    6-digit Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter the code sent to your email"
                    value={otp}
                    onChange={(e) => handleInputChange("otp", e.target.value)}
                    className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.otp ? "border-destructive" : ""}`}
                  />
                  {errors.otp && <p className="text-sm text-destructive">{errors.otp}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`h-12 pr-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                {/* Server error (e.g., invalid/expired OTP) */}
                {serverError && (
                  <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating password..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
