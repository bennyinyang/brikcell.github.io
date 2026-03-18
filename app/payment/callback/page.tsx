"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, XCircle, Shield } from "lucide-react"
import { API_BASE, getAuth } from "@/lib/api"

type VerifyResponse = {
  status: string
  amount: number
  metadata?: any
}

type UiState = "loading" | "success" | "failed" | "missing"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [uiState, setUiState] = useState<UiState>("loading")
  const [message, setMessage] = useState<string>("Verifying your payment…")
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null)
  const [countdown, setCountdown] = useState<number>(5)

  // Paystack commonly returns either ?reference=... or ?trxref=... (sometimes both)
  const reference = useMemo(() => {
    const ref = searchParams.get("reference") || searchParams.get("trxref") || ""
    return ref.trim()
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    async function runVerify() {
      if (!reference) {
        setUiState("missing")
        setMessage("We couldn’t find a payment reference in the redirect URL.")
        return
      }

      try {
        setUiState("loading")
        setMessage("Verifying your payment…")

        const auth = getAuth()
        const token = auth?.token

        const res = await fetch(`/api/payments/verify/${encodeURIComponent(reference)}`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          const msg = data?.message || data?.error?.message || `Verify failed (HTTP ${res.status})`
          throw new Error(msg)
        }

        const status = String(data?.status || "").toLowerCase()
        const ok = status === "success"

        if (cancelled) return

        setVerifyData(data as VerifyResponse)

        if (ok) {
          setUiState("success")
          setMessage("Payment confirmed. Redirecting you to your dashboard…")
        } else {
          setUiState("failed")
          setMessage("Payment was not successful. You can try again.")
        }
      } catch (err: any) {
        if (cancelled) return
        setUiState("failed")
        setMessage(err?.message || "We couldn’t verify this payment. Please try again.")
      }
    }

    runVerify()

    return () => {
      cancelled = true
    }
  }, [reference])

  // Auto redirect on success
  useEffect(() => {
    if (uiState !== "success") return

    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t)
          router.replace("/dashboard/customer")
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(t)
  }, [uiState, router])

  const badge = (() => {
    if (uiState === "success") return <Badge className="bg-green-600">SUCCESS</Badge>
    if (uiState === "failed") return <Badge className="bg-red-600">FAILED</Badge>
    if (uiState === "missing") return <Badge className="bg-yellow-500">MISSING REF</Badge>
    return <Badge variant="secondary">VERIFYING</Badge>
  })()

  const icon = (() => {
    if (uiState === "success") return <CheckCircle2 className="h-10 w-10 text-green-600" />
    if (uiState === "failed") return <XCircle className="h-10 w-10 text-red-600" />
    if (uiState === "missing") return <XCircle className="h-10 w-10 text-yellow-600" />
    return <Loader2 className="h-10 w-10 animate-spin text-primary" />
  })()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-base sm:text-lg">Payment Callback</span>
              </div>
              {badge}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              {icon}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {uiState === "success"
                    ? "Payment Successful"
                    : uiState === "failed"
                    ? "Payment Failed"
                    : uiState === "missing"
                    ? "Missing Payment Reference"
                    : "Verifying Payment"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{message}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reference</span>
                <span className="font-medium">{reference || "—"}</span>
              </div>

              {verifyData?.amount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-primary">₦{Number(verifyData.amount).toLocaleString()}</span>
                </div>
              )}

              {verifyData?.status && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verify Status</span>
                  <span className="font-medium">{String(verifyData.status)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-2">
              {uiState === "success" ? (
                <>
                  <Button className="flex-1" onClick={() => router.replace("/dashboard")}>
                    Go to Dashboard ({countdown})
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => router.replace("/messages")}
                  >
                    Back to Messages
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => router.replace("/messages")}
                  >
                    Back to Messages
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => router.replace("/checkout")}
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                Your payment is verified securely before any status is shown. If verification fails due to network issues,
                you can retry from checkout.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}