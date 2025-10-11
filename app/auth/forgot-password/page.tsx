"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Check } from "lucide-react"
import { useRouter } from "next/navigation"

// ✅ ADDED: real API
import { AuthAPI } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      const normalizedEmail = email.trim().toLowerCase()
      await AuthAPI.forgotPassword({ email: normalizedEmail })
      setIsSuccess(true)
      setTimeout(() => {
        // Pass a mode so verify-otp knows this is a password-reset flow
        router.push(`/auth/verify-otp?email=${encodeURIComponent(normalizedEmail)}&mode=reset`)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Please try again.")
    } finally {
      setIsLoading(false)
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
                <h2 className="text-2xl font-bold text-foreground">Reset Link Sent!</h2>
                <p className="text-muted-foreground mt-2">
                  We've sent a verification code to <strong>{email}</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to verification page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-row">
      {/* Left Side - Brand Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/90 via-primary to-primary/80 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/professional-plumber.png')",
          }}
        />
        {/* Overlay */}
        
        {/* Content */}
        
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full flex justify-center p-8 bg-background px-8 items-center lg:w-6/12">
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
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Forgot password?</CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                No worries! Enter your email and we'll send you a reset code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-card border-border focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending reset code..." : "Send reset code"}
                </Button>
              </form>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">Remember your password? </span>
                <Link
                  href="/auth/login"
                  className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
