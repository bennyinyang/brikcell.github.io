//wallet
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  X,
  Landmark,
  Loader2,
  Plus,
  Wallet,
  ReceiptText,
  ChevronDown,
} from "lucide-react";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getEmployerWalletStats,
  getEmployerWalletTransactions,
  initDeposit,
  type EmployerWalletTransaction,
  normalizePaginatedResponse,
  type PaginationMeta,
} from "@/lib/api";
import { WithdrawalCard } from "@/components/withdrawal-card";
import { PaginationControl } from "@/components/pagination-control";

type ActivePanel = "transactions" | "payment";
type WalletMode = "idle" | "fund" | "withdraw";

function toNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const PAYSTACK_FEE_RATE = 0.02;

function withPaystackFee(desiredAmount: number): number {
  return Math.ceil(desiredAmount / (1 - PAYSTACK_FEE_RATE));
}

function formatCurrency(value: any) {
  return `₦${toNumber(value).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTransactionAmountClass(transaction: EmployerWalletTransaction) {
  if (transaction.type === "deposit") return "text-emerald-600";
  if (transaction.type === "withdrawal") return "text-red-600";
  if (transaction.type === "job_payment") return "text-red-600";

  return "text-slate-950";
}

function getTransactionAmountPrefix(transaction: EmployerWalletTransaction) {
  if (transaction.type === "deposit") return "+";
  if (transaction.type === "withdrawal") return "-";
  if (transaction.type === "job_payment") return "-";

  return "";
}

function getStatusBadgeClass(status: string) {
  const value = String(status || "").toLowerCase();

  if (["success", "completed"].includes(value)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (["pending"].includes(value)) {
    return "border-orange-100 bg-orange-50 text-orange-700";
  }

  if (["failed", "rejected", "cancelled"].includes(value)) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-slate-100 bg-slate-50 text-slate-600";
}

function EmployerSidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "Browse Gigs", href: "/search" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Post a Gig", href: "/post-job" },
    { label: "Wallet", href: "/dashboard/customer/wallet", active: true },
    { label: "Settings", href: "/dashboard/customer/settings" },
    { label: "Support", href: "/support" },
  ];

  return (
    <aside className="hidden w-[190px] shrink-0 lg:block">
      <nav className="space-y-4 text-sm">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 transition ${
              item.active
                ? "bg-slate-50 font-medium text-slate-950"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {item.active && (
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {!item.active && <span className="mr-3" />}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function EmptyTransactionsState({
  onFundWallet,
}: {
  onFundWallet: () => void;
}) {
  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center px-4 text-center">
      <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-slate-50">
        <div className="absolute h-48 w-48 rounded-full border border-slate-50" />
        <div className="absolute h-40 w-40 rounded-full border border-slate-100" />
        <div className="absolute h-32 w-32 rounded-full border border-slate-100" />
        <div className="absolute h-24 w-24 rounded-full border border-slate-200" />

        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <ReceiptText className="h-5 w-5 text-slate-500" />
        </div>
      </div>

      <h3 className="-mt-8 text-sm font-semibold text-slate-950">
        No transactions found
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Fund wallet to begin transaction
      </p>

      <Button
        size="sm"
        onClick={onFundWallet}
        className="mt-5 bg-primary text-white hover:bg-primary/90"
      >
        Fund wallet
        <Plus className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function FundWalletPanel({
  walletBalance,
  onSuccess,
}: {
  walletBalance: number;
  onSuccess: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const desiredAmount = toNumber(amount);
  const chargeAmount = desiredAmount > 0 ? withPaystackFee(desiredAmount) : 0;
  const feeAmount = chargeAmount - desiredAmount;

  async function handleFund() {
    if (desiredAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const toastId = toast.loading("Initialising payment...");
    setLoading(true);

    try {
      const response = await initDeposit(chargeAmount);

      const authUrl = response?.authorization_url;
      if (!authUrl) throw new Error("No payment URL returned");

      toast.success("Payment page opened. Complete your payment there.", {
        id: toastId,
      });

      window.open(authUrl, "_blank");
      setAmount("");
      await onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Unable to initialise payment", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Fund wallet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Add money to your wallet for job payments.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current balance</span>
            <span className="font-semibold text-slate-950">
              {formatCurrency(walletBalance)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Amount</label>
          <Input
            type="number"
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₦0.00"
            disabled={loading}
            className="h-10"
          />
        </div>

        {desiredAmount > 0 && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Wallet credit</span>
              <span>{formatCurrency(desiredAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-500">
              <span>Processing fee</span>
              <span>{formatCurrency(feeAmount)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-950">
              <span>Total charge</span>
              <span>{formatCurrency(chargeAmount)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleFund}
          disabled={loading || desiredAmount <= 0}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              Fund wallet
              <Plus className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentMethodPanel({
  onFundWallet,
}: {
  onFundWallet: () => void
}) {
  const [showAddCardModal, setShowAddCardModal] = useState(false)

  const [cardForm, setCardForm] = useState({
    name: "",
    expiry: "",
    cardNumber: "",
    cvv: "",
    saveCard: false,
  })

  const [isRedirecting, setIsRedirecting] = useState(false)

  async function handlePaystackRedirect() {
    const toastId = toast.loading("Redirecting to Paystack...")
    setIsRedirecting(true)

    try {
      const response = await initDeposit(100)

      const authUrl = response?.authorization_url
      if (!authUrl) throw new Error("No Paystack payment URL returned")

      toast.success("Paystack payment page opened", { id: toastId })
      window.open(authUrl, "_blank")
      setShowAddCardModal(false)
    } catch (error: any) {
      toast.error(error?.message || "Unable to open Paystack payment page", {
        id: toastId,
      })
    } finally {
      setIsRedirecting(false)
    }
  }

  return (
    <>
      <Card className="rounded-2xl border border-slate-100 shadow-sm">
        <CardContent className="space-y-6 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Payment method
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose how you want to fund your wallet.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-700">
              Select payment method
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Pick a payment option below.
            </p>

            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => setShowAddCardModal(true)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100">
                    <CreditCard className="h-4 w-4 text-slate-600" />
                  </span>

                  <div>
                    <p className="text-xs font-medium text-slate-900">
                      Debit card/Visa, Verve, Mastercard
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Fund directly from your bank card.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-primary">
                  Add card
                </span>
              </button>

              <button
                type="button"
                onClick={onFundWallet}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100">
                    <Landmark className="h-4 w-4 text-slate-600" />
                  </span>

                  <div>
                    <p className="text-xs font-medium text-slate-900">
                      Bank Transfer
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Open the funding form to pay by bank transfer.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-primary">
                  Fund wallet
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-700">
              Contact email
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Where should invoices be sent?
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-center gap-2">
                <input type="radio" defaultChecked className="accent-primary" />
                Send to my account email
              </label>

              <label className="flex items-center gap-2">
                <input type="radio" className="accent-primary" />
                Send to an alternative email
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-sm">Add payment method</DialogTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Add your card details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Name on card</label>
                <Input
                  value={cardForm.name}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Olivia Rhye"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Expiry</label>
                <Input
                  value={cardForm.expiry}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      expiry: e.target.value,
                    }))
                  }
                  placeholder="06 / 2024"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Card number</label>
                <Input
                  value={cardForm.cardNumber}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cardNumber: e.target.value,
                    }))
                  }
                  placeholder="1234 1234 1234"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">CVV</label>
                <Input
                  value={cardForm.cvv}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cvv: e.target.value,
                    }))
                  }
                  placeholder="—"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={cardForm.saveCard}
                onChange={(e) =>
                  setCardForm((prev) => ({
                    ...prev,
                    saveCard: e.target.checked,
                  }))
                }
                className="accent-primary"
              />
              Save card
            </label>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddCardModal(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                disabled={isRedirecting}
                onClick={handlePaystackRedirect}
              >
                {isRedirecting ? "Redirecting..." : "Pay now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TransactionList({
  transactions,
  loading,
  onFundWallet,
  onViewDetails,
}: {
  transactions: EmployerWalletTransaction[];
  loading: boolean;
  onFundWallet: () => void;
  onViewDetails: (transaction: EmployerWalletTransaction) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[86px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return <EmptyTransactionsState onFundWallet={onFundWallet} />;
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card
          key={`${transaction.type}-${transaction.id}`}
          className="rounded-2xl border border-slate-100 shadow-sm"
        >
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-950">
                  {transaction.title}
                </h3>

                <p
                  className={`mt-1 text-xs font-medium ${getTransactionAmountClass(
                    transaction,
                  )}`}
                >
                  {getTransactionAmountPrefix(transaction)}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              <Badge
                className={`${getStatusBadgeClass(
                  transaction.status,
                )} w-fit text-xs`}
              >
                {transaction.status}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              <span>Date initiated: {formatDate(transaction.createdAt)}</span>
              <span>Time: {formatTime(transaction.createdAt)}</span>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(transaction)}
                className="h-8 border-primary/40 text-xs text-primary hover:bg-primary/5"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EmployerWalletPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<EmployerWalletTransaction[]>(
    [],
  );
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPagination, setTransactionPagination] =
    useState<PaginationMeta | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<EmployerWalletTransaction | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("transactions");
  const [walletMode, setWalletMode] = useState<WalletMode>("idle");
  const [loading, setLoading] = useState(true);
  
  async function loadWallet() {
    try {
      setLoading(true);

      const [stats, transactionList] = await Promise.all([
        getEmployerWalletStats(),
        getEmployerWalletTransactions(transactionPage, 10),
      ]);

      const paginatedTransactions =
        normalizePaginatedResponse<EmployerWalletTransaction>(transactionList);

      setWalletBalance(toNumber((stats as any)?.walletBalance));
      setEscrowBalance(toNumber((stats as any)?.escrowBalance));
      setTotalSpent(toNumber((stats as any)?.totalSpent));

      setTransactions(paginatedTransactions.data);
      setTransactionPagination(paginatedTransactions.pagination);
    } catch (error) {
      console.error("Failed to load wallet:", error);
      toast.error("Failed to load wallet");
      setTransactions([]);
      setTransactionPagination(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionPage]);

  useEffect(() => {
    if (activePanel === "transactions") {
      setTransactionPage(1);
    }
  }, [activePanel]);

  const mobilePanelLabel = useMemo(() => {
    if (activePanel === "transactions") return "Transaction history";
    return "Payment method";
  }, [activePanel]);

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-64px)] bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <EmployerSidebar />

          <section className="min-w-0 flex-1">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Wallet Balance:{" "}
                  <span className="text-primary">
                    {formatCurrency(walletBalance)}
                  </span>
                </h1>

                <div className="hidden gap-4 sm:flex">
                  <Button
                    size="sm"
                    variant={walletMode === "fund" ? "default" : "outline"}
                    onClick={() =>
                      setWalletMode((prev) =>
                        prev === "fund" ? "idle" : "fund",
                      )
                    }
                    className={
                      walletMode === "fund"
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border-primary/40 text-primary hover:bg-primary/5"
                    }
                  >
                    Fund wallet
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setWalletMode((prev) =>
                        prev === "withdraw" ? "idle" : "withdraw",
                      )
                    }
                    className="text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    Withdraw
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:hidden">
                  <Button
                    size="sm"
                    onClick={() =>
                      setWalletMode((prev) =>
                        prev === "fund" ? "idle" : "fund",
                      )
                    }
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Fund wallet
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setWalletMode((prev) =>
                        prev === "withdraw" ? "idle" : "withdraw",
                      )
                    }
                    className="text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                  <p className="text-slate-500">Funds held in escrow</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {formatCurrency(escrowBalance)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                  <p className="text-slate-500">Total spending</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                walletMode === "fund"
                  ? "grid-rows-[1fr] opacity-100 mt-5"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <FundWalletPanel
                  walletBalance={walletBalance}
                  onSuccess={loadWallet}
                />
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                walletMode === "withdraw"
                  ? "grid-rows-[1fr] opacity-100 mt-5"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <WithdrawalCard
                  balance={walletBalance}
                  title="Withdraw from Wallet"
                  onSuccess={loadWallet}
                />
              </div>
            </div>

            <div className="mt-6 hidden grid-cols-2 rounded-lg border border-slate-100 bg-white p-1 sm:grid">
              <button
                type="button"
                onClick={() => setActivePanel("transactions")}
                className={`h-9 rounded-md text-xs transition ${
                  activePanel === "transactions"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Transaction history
              </button>

              <button
                type="button"
                onClick={() => setActivePanel("payment")}
                className={`h-9 rounded-md text-xs transition ${
                  activePanel === "payment"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Payment method
              </button>
            </div>

            <div className="mt-5 block sm:hidden">
              <Select
                value={activePanel}
                onValueChange={(value: ActivePanel) => setActivePanel(value)}
              >
                <SelectTrigger className="h-10 rounded-md border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <SelectValue placeholder={mobilePanelLabel} />
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="transactions">
                    Transaction history
                  </SelectItem>
                  <SelectItem value="payment">Payment method</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <section className="mt-6">
              {activePanel === "transactions" ? (
                <>
                  <TransactionList
                    transactions={transactions}
                    loading={loading}
                    onFundWallet={() => setWalletMode("fund")}
                    onViewDetails={setSelectedTransaction}
                  />

                  {transactionPagination && transactions.length > 0 && (
                    <PaginationControl
                      pagination={transactionPagination}
                      onPageChange={setTransactionPage}
                    />
                  )}
                </>
              ) : (
                <PaymentMethodPanel
                  onFundWallet={() => {
                    setWalletMode("fund")
                  }}
                />
              )}
            </section>
          </section>
        </div>
      </main>
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Transaction</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {selectedTransaction.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p
                    className={`mt-1 font-semibold ${getTransactionAmountClass(
                      selectedTransaction,
                    )}`}
                  >
                    {getTransactionAmountPrefix(selectedTransaction)}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge
                    className={`${getStatusBadgeClass(
                      selectedTransaction.status,
                    )} mt-1 text-xs`}
                  >
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-100 p-4 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {String(selectedTransaction.type || "—").replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {String(selectedTransaction.method || "—").replace(
                      "_",
                      " ",
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(selectedTransaction.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium text-slate-900">
                    {formatTime(selectedTransaction.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Reference</span>
                  <span className="max-w-[180px] truncate text-right font-medium text-slate-900">
                    {selectedTransaction.reference || "—"}
                  </span>
                </div>

                {selectedTransaction.contractId && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Contract ID</span>
                    <span className="max-w-[180px] truncate text-right font-medium text-slate-900">
                      {selectedTransaction.contractId}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
