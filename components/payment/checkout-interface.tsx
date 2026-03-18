"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Shield, Clock, Lock, Wallet, Building2 } from "lucide-react"
import { initDeposit } from "@/lib/api"

type Phase = {
  id?: number | string
  name?: string
  description?: string
  deliverables?: string[]
  amount?: number
  status?: string
  dueDate?: string
}

type Material = {
  id?: number | string
  name?: string
  cost?: number
  coveredBy?: "client" | "artisan"
  receipt?: string
}

type Contract = {
  id?: number | string
  title?: string
  description?: string
  totalAmount?: number
  depositAmount?: number
  depositPaid?: boolean
  phases?: Phase[]
  materials?: Material[]
  status?: string
  createdAt?: string
  acceptedAt?: string
  version?: number
}

export function CheckoutInterface() {
  const searchParams = useSearchParams()

  const contract: Contract | null = useMemo(() => {
    const raw = searchParams.get("contract")
    if (!raw) return null
    try {
      return JSON.parse(decodeURIComponent(raw))
    } catch {
      return null
    }
  }, [searchParams])

  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "NG",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const depositAmount = Number(contract?.depositAmount ?? 0)
  const serviceFee = Math.round(depositAmount * 0.02) // 5% service fee on deposit
  const totalAmount = depositAmount + serviceFee

const handlePayment = async () => {
  if (!agreeToTerms) return
  if (!contract) return

  try {
    setIsProcessing(true)

    // You are charging DEPOSIT + service fee on this page
    // If you want Paystack to charge ONLY deposit, then pass depositAmount instead.
    const payload = await initDeposit(depositAmount, String(contract.id))

    // Hard redirect to Paystack checkout
    window.location.href = payload.authorization_url
  } catch (err: any) {
    console.error("Paystack init failed:", err)
    alert(err?.message || "Unable to start payment. Please try again.")
    setIsProcessing(false)
  }
}

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No contract was supplied for checkout. Please return to the chat and open checkout from the contract card.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contract Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Secure Checkout</span>
                </div>

                {"version" in contract && contract.version != null && (
                  <Badge variant="secondary" className="text-xs">
                    v{contract.version}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contract Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{contract.title || "Contract"}</h3>
                {!!contract.description && <p className="text-sm text-gray-600 mb-3">{contract.description}</p>}

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Deposit funding</span>
                  <span>•</span>
                  <Badge variant="secondary">{String(contract.status || "accepted").replaceAll("_", " ")}</Badge>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit to Fund</span>
                  <span className="font-medium">₦{depositAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">₦{serviceFee.toLocaleString()}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>

                {!!contract.totalAmount && (
                  <div className="pt-2 text-xs text-gray-500">
                    Total contract value: <span className="font-medium text-gray-700">₦{Number(contract.totalAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Escrow Protection */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-green-900">Escrow Protection</h5>
                    <p className="text-xs text-green-800 mt-1">
                      Your deposit is held securely in escrow. Funds are released only after you approve milestones.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Phases */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Project Phases</h4>
                <div className="space-y-2">
                  {(contract.phases || []).map((p, idx) => (
                    <div key={String(p.id ?? idx)} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            Phase {idx + 1}: {p.name || "Untitled phase"}
                          </p>
                          {!!p.description && <p className="text-xs text-gray-600 mt-1">{p.description}</p>}
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          ₦{Number(p.amount || 0).toLocaleString()}
                        </div>
                      </div>

                      {!!(p.deliverables && p.deliverables.length) && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Deliverables:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5 list-disc pl-4">
                            {p.deliverables.filter(Boolean).map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  {(contract.phases || []).length === 0 && (
                    <p className="text-xs text-gray-500">No phases found on this contract.</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Materials */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Materials & Tools</h4>
                <div className="space-y-2">
                  {(contract.materials || []).map((m, idx) => (
                    <div key={String(m.id ?? idx)} className="flex items-start justify-between gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name || "Material"}</p>
                        {!!m.coveredBy && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            Covered by: <span className="font-medium text-gray-700">{m.coveredBy === "client" ? "You" : "Artisan"}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold whitespace-nowrap">
                        ₦{Number(m.cost || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {(contract.materials || []).length === 0 && (
                    <p className="text-xs text-gray-500">No materials listed.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="h-4 w-4" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>

                  {/* Keep these for UI parity; Paystack will still be the real method later */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Wallet className="h-4 w-4" />
                    <Label htmlFor="paypal">PayPal</Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="bank" id="bank" />
                    <Building2 className="h-4 w-4" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Card Details */}
 
              {/* Billing Address */}
              <div className="space-y-4">
                <Label>Billing Address</Label>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    placeholder="Street Address"
                    value={billingAddress.street}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, street: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="City"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress((prev) => ({ ...prev, city: e.target.value }))}
                    />
                    <Input
                      placeholder="State"
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="ZIP Code"
                      value={billingAddress.zip}
                      onChange={(e) => setBillingAddress((prev) => ({ ...prev, zip: e.target.value }))}
                    />
                    <Input
                      placeholder="Country"
                      value={billingAddress.country}
                      onChange={(e) => setBillingAddress((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={setAgreeToTerms} />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  . I understand that payment will be held in escrow until job completion.
                </Label>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900">Secure Payment</h5>
                    <p className="text-sm text-blue-800 mt-1">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button onClick={handlePayment} disabled={!agreeToTerms || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Pay ₦{totalAmount.toLocaleString()} Securely
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}