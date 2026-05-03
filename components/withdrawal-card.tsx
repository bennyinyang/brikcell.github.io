// components/withdrawal-card.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createWithdrawal,
  getWithdrawalBanks,
  resolveWithdrawalAccount,
  listMyWithdrawals,
  getAuth,
} from "@/lib/api"

type Props = {
  balance: number
  title?: string
  onSuccess?: () => Promise<void>
}

// ── Friendly error messages ───────────────────────────────────────────────────
function getFriendlyError(err: any): string {
  const status =
    err?.statusCode ||
    err?.response?.status ||
    err?.status ||
    0

  const raw: string =
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.message ||
    ""

  // Map known patterns to friendly copy
  if (status === 400 || raw.toLowerCase().includes("starter business")) {
    return "Withdrawals are temporarily unavailable. Please try again later."
  }
  if (status === 401 || raw.toLowerCase().includes("unauthorized")) {
    return "Your session has expired. Please log in again."
  }
  if (status === 402 || raw.toLowerCase().includes("insufficient")) {
    return "Insufficient balance to complete this withdrawal."
  }
  if (status === 422 || raw.toLowerCase().includes("invalid account")) {
    return "The account details provided are invalid. Please check and try again."
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again shortly."
  }
  if (raw) {
    // Strip any raw HTTP codes / technical jargon before showing
    const cleaned = raw.replace(/\b\d{3}\b/g, "").trim()
    if (cleaned.length > 0 && cleaned.length < 120) return cleaned
  }

  return "Withdrawal failed. Please try again later."
}

// ── Status normalizer ─────────────────────────────────────────────────────────
function formatWithdrawalStatus(status: string): { label: string; color: string } {
  switch (String(status || "").toLowerCase()) {
    case "success":
    case "successful":
    case "completed":
      return { label: "Successful", color: "text-green-600" }
    case "pending":
    case "processing":
      return { label: "Processing", color: "text-yellow-600" }
    case "failed":
    case "rejected":   // ← maps "rejected" → "Failed"
    case "declined":
    case "error":
      return { label: "Failed", color: "text-red-500" }
    default:
      return { label: status || "Unknown", color: "text-gray-500" }
  }
}

// ── Timestamp formatter ───────────────────────────────────────────────────────
function formatTimestamp(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function WithdrawalCard({ balance, title, onSuccess }: Props) {
  const auth = getAuth()
  const token = auth?.token

  const [banks, setBanks] = useState<{ name: string; code: string }[]>([])
  const [bankCode, setBankCode] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const [banksRes, withdrawals] = await Promise.all([
          getWithdrawalBanks(token),
          listMyWithdrawals(token),
        ])
        setBanks(banksRes?.banks || [])
        setHistory(Array.isArray(withdrawals) ? withdrawals : [])
      } catch (err) {
        console.error(err)
      }
    })()
  }, [token])

  useEffect(() => {
    if (!token) return
    if (!bankCode || accountNumber.trim().length !== 10) {
      setAccountName("")
      return
    }

    const t = setTimeout(async () => {
      try {
        setResolving(true)
        const res = await resolveWithdrawalAccount(accountNumber, bankCode, token)
        setAccountName(res?.accountName || "")
      } catch {
        setAccountName("")
      } finally {
        setResolving(false)
      }
    }, 500)

    return () => clearTimeout(t)
  }, [bankCode, accountNumber, token])

  const canSubmit = useMemo(() => {
    return (
      !!token &&
      !!bankCode &&
      !!bankName &&
      accountNumber.trim().length === 10 &&
      !!accountName &&
      Number(amount) > 0 &&
      Number(amount) <= Number(balance || 0)
    )
  }, [token, bankCode, bankName, accountNumber, accountName, amount, balance])

  async function handleWithdraw() {
    if (!canSubmit || !token) return

    const toastId = toast.loading("Submitting withdrawal request…")

    try {
      setLoading(true)
      await createWithdrawal(
        {
          amount: Number(amount),
          bank: {
            name: bankName,
            bank_code: bankCode,
            account_number: accountNumber,
            account_name: accountName,
            currency: "NGN",
          },
        },
        token
      )

      toast.success("Withdrawal request submitted successfully!", { id: toastId })
      setAmount("")
      await onSuccess?.()

      const withdrawals = await listMyWithdrawals(token)
      setHistory(Array.isArray(withdrawals) ? withdrawals : [])
    } catch (err: any) {
      console.error(err)
      toast.error(getFriendlyError(err), { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Available balance:{" "}
          <span className="font-semibold">₦{Number(balance || 0).toLocaleString()}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bank</label>
          <Select
            value={bankCode}
            onValueChange={(value) => {
              setBankCode(value)
              const bank = banks.find((b) => b.code === value)
              setBankName(bank?.name || "")
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account Number</label>
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="0123456789"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account Name</label>
          <Input
            value={accountName}
            readOnly
            placeholder={resolving ? "Resolving…" : "Resolved account name"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <Button onClick={handleWithdraw} disabled={!canSubmit || loading} className="w-full">
          {loading ? "Processing…" : "Withdraw"}
        </Button>

        {/* ── Recent Withdrawals ── */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold">Recent Withdrawals</h4>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No withdrawals yet.</p>
          ) : (
            history.slice(0, 5).map((item) => {
              const { label, color } = formatWithdrawalStatus(item.status)
              const ts = formatTimestamp(
                item.createdAt || item.created_at || item.updatedAt || item.updated_at
              )

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  {/* Amount */}
                  <span className="font-medium">
                    ₦{Number(item.amount || 0).toLocaleString()}
                  </span>

                  {/* Timestamp + Status */}
                  <div className="flex items-center gap-2 text-right">
                    {ts && (
                      <span className="text-gray-400 text-xs whitespace-nowrap">{ts}</span>
                    )}
                    <span className={`capitalize font-medium ₦{color}`}>{label}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}