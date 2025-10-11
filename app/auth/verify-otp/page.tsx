"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Check } from "lucide-react"
import { AuthAPI } from "@/lib/api";

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  // Prefill OTP from query (?otp=123456) if present
  const initialOtpStr = (searchParams.get("otp") || "").replace(/\D/g, "").slice(0, 6);
  const initialOtpArray = Array.from({ length: 6 }, (_, i) => initialOtpStr[i] ?? "");

  // Initialize OTP input boxes with the prefilled values
  const [otp, setOtp] = useState<string[]>(initialOtpArray);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    const v = value.replace(/\D/g, "");
    const newOtp = [...otp]
    newOtp[index] = v
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const otpString = otp.join("");

  if (otpString.length !== 6) {
    setError("Please enter the complete 6-digit code");
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const mode = (searchParams.get("mode") || "").toLowerCase();

    console.log("[FE verify-otp] API_BASE", process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log("[FE verify-otp] payload", { email: normalizedEmail, otp: otpString });

    if (mode === "reset") {
      // 🚫 Skip hitting /auth/verify-otp (email already verified).
      // ✅ Carry the code to the reset page.
      setIsSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}&otp=${encodeURIComponent(otpString)}`
        );
      }, 800);
      return;
    }

    // ✅ Normal signup verification flow
    await AuthAPI.verifyOtp({ email: normalizedEmail, otp: otpString });

    setIsSuccess(true);
    setIsLoading(false);
    setTimeout(() => {
      router.push("/auth/login");
    }, 800);
  } catch (err: any) {
      setError(err?.message || "Invalid verification code. Please try again.");
      setIsLoading(false);
      setOtp(["", "", "", "", "", ""]);
      // @ts-ignore
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Missing email address.");
      return;
    }

    setResendCooldown(60);
    setError("");

    try {
      await AuthAPI.sendOtp({ email: (email || "").trim().toLowerCase() });
    } catch (err: any) {
      setResendCooldown(0);
      setError(err?.message || "Failed to resend code. Please try again.");
    }
  };

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
                <h2 className="text-2xl font-bold text-foreground">Code Verified!</h2>
                <p className="text-muted-foreground mt-2">Your verification code has been confirmed successfully.</p>
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to password reset...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/90 via-primary to-primary/80 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/professional-hairstylist-woman.png')",
          }}
        />
        {/* Overlay */}
        

        {/* Content */}
        
      </div>

      {/* Right Side - OTP Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Forgot Password */}
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>

          {/* Form Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Verify your email</CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                We sent a 6-digit code to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }} 
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold bg-card border-border focus:border-primary focus:ring-primary/20"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading || otp.join("").length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <Button
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="text-secondary hover:text-secondary/80 hover:bg-transparent"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
