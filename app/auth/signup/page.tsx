"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthAPI } from "@/lib/api" 

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    userType: "employer", // Added user type selection
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
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

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

    if (formData.userType === "artisan") {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business name is required"
      }
      if (!formData.skills.trim()) {
        newErrors.skills = "Skills are required"
      }
      if (!formData.location.trim()) {
        newErrors.location = "Location is required"
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required"
      }
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions"
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
      // Map frontend userType → backend role
      const role = formData.userType === "artisan" ? "artisan" : "employer"

      // Build payload based on role
      const payload: any = {
        email: formData.email,
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
        // employer optional fields if you want to capture them
        if (formData.phone) payload.phone = formData.phone
        if (formData.location) payload.location = formData.location
      }

      await AuthAPI.signup(payload)

      setIsLoading(false)

      // After success, go to verify-otp for signup flow
      setTimeout(() => {
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&flow=signup`)
      }, 1000)
      } catch (err: any) {
        setIsLoading(false)
        setErrors((prev) => ({ ...prev, form: err?.message || "Signup failed" }))
      }
    }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
                <h2 className="text-2xl font-bold text-foreground">Welcome to Brikcell!</h2>
                <p className="text-muted-foreground mt-2">
                  Your {formData.userType} account has been created successfully.
                  {formData.userType === "artisan"
                    ? " You can now start receiving job requests from customers."
                    : " You can now start connecting with skilled artisans."}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to your verification...</p>
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
            backgroundImage: "url('/professional-artisan-team-working-together-on-cons.jpg')",
          }}
        />

        {/* Overlay */}

        {/* Content */}
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          {/* Form Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0">
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Create account</CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Join Brikcell to connect with trusted artisans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleSubmit} className="space-y-5">

              {/* Form-level error from server */}
                {errors.form && (
                  <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                    {errors.form}
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">I want to join as:</Label>
                  <RadioGroup
                    value={formData.userType}
                    onValueChange={(value) => handleInputChange("userType", value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="employer" id="employer" />
                      <Label htmlFor="employer" className="text-sm font-medium cursor-pointer">
                        Employer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="artisan" id="artisan" />
                      <Label htmlFor="artisan" className="text-sm font-medium cursor-pointer">
                        Artisan
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.name ? "border-destructive" : ""}`}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {formData.userType === "artisan" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-sm font-medium text-foreground">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Enter your business name"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.businessName ? "border-destructive" : ""}`}
                      />
                      {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills" className="text-sm font-medium text-foreground">
                        Skills & Services
                      </Label>
                      <Textarea
                        id="skills"
                        placeholder="Describe your skills and services (e.g., plumbing, electrical, carpentry)"
                        value={formData.skills}
                        onChange={(e) => handleInputChange("skills", e.target.value)}
                        className={`min-h-[80px] bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.skills ? "border-destructive" : ""}`}
                      />
                      {errors.skills && <p className="text-sm text-destructive">{errors.skills}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium text-foreground">
                          Location
                        </Label>
                        <Input
                          id="location"
                          type="text"
                          placeholder="City, State"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.location ? "border-destructive" : ""}`}
                        />
                        {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className={`h-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.phone ? "border-destructive" : ""}`}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-sm font-medium text-foreground">
                        Years of Experience (Optional)
                      </Label>
                      <Input
                        id="experience"
                        type="text"
                        placeholder="e.g., 5 years"
                        value={formData.experience}
                        onChange={(e) => handleInputChange("experience", e.target.value)}
                        className="h-12 bg-card border-border focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`h-12 pr-12 bg-card border-border focus:border-primary focus:ring-primary/20 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
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

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                      className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-5">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-muted-foreground hover:text-primary font-medium transition-colors"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-muted-foreground hover:text-primary font-medium transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : `Create ${formData.userType} account`}
                </Button>
              </form>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">Already have an account? </span>
                <Link
                  href="/auth/login"
                  className="text-sm hover:text-primary font-medium transition-colors text-slate-800"
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
