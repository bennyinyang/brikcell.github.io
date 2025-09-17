"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Shield, Clock, Lock, Wallet, Building2 } from "lucide-react"

// Mock job data
const jobData = {
  id: "job-123",
  title: "Kitchen Plumbing Repair",
  description: "Fix leaking kitchen sink and replace faucet",
  artisan: {
    name: "Mike Rodriguez",
    avatar: "/professional-plumber.png",
    rating: 4.8,
    reviews: 89,
    service: "Plumbing",
  },
  budget: 75000, // ₦75,000 instead of $150
  budgetType: "fixed",
  estimatedHours: 3,
  location: "Downtown",
  urgency: "medium",
}

export function CheckoutInterface() {
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
    country: "US",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const serviceFee = Math.round(jobData.budget * 0.05) // 5% service fee
  const totalAmount = jobData.budget + serviceFee

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to success page
      console.log("Payment processed successfully")
    }, 3000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Secure Checkout</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{jobData.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{jobData.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{jobData.location}</span>
                  <span>•</span>
                  <Badge variant="secondary">{jobData.urgency}</Badge>
                </div>
              </div>

              <Separator />

              {/* Artisan Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={jobData.artisan.avatar || "/placeholder.svg"} alt={jobData.artisan.name} />
                  <AvatarFallback>
                    {jobData.artisan.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{jobData.artisan.name}</h4>
                  <p className="text-sm text-primary">{jobData.artisan.service}</p>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-3 w-3 rounded-full ${
                            i < Math.floor(jobData.artisan.rating) ? "bg-yellow-400" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">({jobData.artisan.reviews})</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Cost</span>
                  <span className="font-medium">₦{jobData.budget.toLocaleString()}</span>
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
              </div>

              {/* Escrow Protection */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-green-900">Escrow Protection</h5>
                    <p className="text-xs text-green-800 mt-1">
                      Your payment is held securely until the job is completed to your satisfaction.
                    </p>
                  </div>
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
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardData.name}
                      onChange={(e) => setCardData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.number}
                      onChange={(e) => setCardData((prev) => ({ ...prev, number: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => setCardData((prev) => ({ ...prev, expiry: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

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
