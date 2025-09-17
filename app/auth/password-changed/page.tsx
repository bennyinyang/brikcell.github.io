"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PasswordChangedPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push("/auth/login")
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Password Changed Successfully!</h1>
              <p className="text-muted-foreground">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
            </div>

            {/* Security Tips */}
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-sm mb-2">Security Tips:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep your password secure and don't share it</li>
                <li>• Use a unique password for your Brikcell account</li>
                <li>• Consider enabling two-factor authentication</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full h-11">
                <Link href="/auth/login">
                  Sign in with new password
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full h-11 bg-transparent">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>

            {/* Auto-redirect Notice */}
            <p className="text-xs text-muted-foreground">
              You'll be automatically redirected to the login page in 10 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
