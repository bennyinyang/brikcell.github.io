"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  Hash,
  Inbox,
  Landmark,
  ListTree,
  Loader2,
  MessageSquareText,
  MessagesSquare,
  MinusCircle,
  Paperclip,
  PencilLine,
  PenLine,
  MousePointerClick,
  PlusCircle,
  Search,
  Send,
  TicketCheck,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { Header } from "@/components/header"
import { PaginationControl } from "@/components/pagination-control"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  createSupportTicket,
  deleteSupportTicket,
  getAuth,
  getMySupportTicket,
  getMySupportTicketCount,
  getSupportOptions,
  listMySupportTickets,
  normalizePaginatedResponse,
  type PaginationMeta,
  type SupportCategoryOption,
  type SupportCategoryValue,
  type SupportOptionsResponse,
  type SupportPriorityOption,
  type SupportPriorityValue,
  type SupportTicketDTO,
} from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────

type TopicKey =
  | "payments"
  | "withdrawals"
  | "booking"
  | "contracts"
  | "job_service"
  | "account"
  | "chats"

type ArticleType =
  | "Help article"
  | "Troubleshooting guide"
  | "FAQ"
  | "User guide"

interface KbArticle {
  id: string
  title: string
  excerpt: string
  type: ArticleType
  actionLabel: string
  topicKey: TopicKey
  topicLabel: string
}

interface TopicSection {
  heading: string
  articles: Omit<KbArticle, "topicKey" | "topicLabel">[]
}

interface Topic {
  key: TopicKey
  label: string
  icon: React.ElementType
  sections: TopicSection[]
}

type PageView = "home" | "search" | "topic"

type FormState = {
  category: SupportCategoryValue | ""
  issue: string
  subject: string
  description: string
  priority: SupportPriorityValue | ""
  relatedReference: string
  attachments: File[]
}

const initialForm: FormState = {
  category: "",
  issue: "",
  subject: "",
  description: "",
  priority: "",
  relatedReference: "",
  attachments: [],
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────────

const POPULAR_TOPICS: Topic[] = [
  {
    key: "payments",
    label: "Payments",
    icon: WalletCards,
    sections: [
      {
        heading: "Getting Started",
        articles: [
          {
            id: "pay-1",
            title: "How Wallet funding works",
            excerpt:
              "Your Brikcell wallet can be funded via bank transfer, card payment, or USSD. Funds reflect instantly on a successful payment and are immediately available for bookings and contracts.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-2",
            title: "Supported payment methods",
            excerpt:
              "Brikcell supports card payments (Visa, Mastercard), bank transfers, and USSD for wallet funding. All payments are processed securely through Paystack and credited to your wallet instantly.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-3",
            title: "Payment limits and transaction fees",
            excerpt:
              "There is no minimum top-up amount for card payments. Bank transfers may have a minimum of ₦100. A small processing fee may apply per transaction depending on the payment method used.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-4",
            title: "Understanding your wallet balance",
            excerpt:
              "Your wallet balance shows the total funds available for use on Brikcell. Funds held in escrow for active contracts are shown separately and not included in your available balance.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-5",
            title: "Payment processing time",
            excerpt:
              "Card payments and USSD transactions are processed instantly. Bank transfers may take up to 30 minutes during business hours. If a transfer is not reflected after 2 hours, contact support.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "Transactions",
        articles: [
          {
            id: "pay-6",
            title: "How to view payment history",
            excerpt:
              "All wallet credits, debits, and transfers are logged in your Wallet > Transaction History. You can filter by date range, transaction type, or amount to find specific entries.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-7",
            title: "Downloading payment receipts",
            excerpt:
              "To download a receipt for any transaction, go to Wallet > Transaction History, click on the transaction, and select Download Receipt. Receipts are available in PDF format.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "pay-8",
            title: "Understanding transaction references",
            excerpt:
              "Every transaction on Brikcell has a unique reference ID that can be used to track and verify payments. You can find this reference in your transaction history or payment confirmation email.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-9",
            title: "Payments status explained",
            excerpt:
              "Payments can have the following statuses: Pending (processing), Successful (completed), Failed (not completed), or Reversed (refunded). Each status indicates the current state of your transaction.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-10",
            title: "Why payments may be delayed",
            excerpt:
              "Payments may be delayed due to bank processing times, network issues, or security checks. Card payments typically resolve within minutes; bank transfers may take up to 2 hours during peak periods.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "Security",
        articles: [
          {
            id: "pay-11",
            title: "Keeping your payment secure",
            excerpt:
              "Brikcell uses bank-level encryption and processes all payments through Paystack, a PCI-DSS compliant provider. Never share your OTP or card details with anyone, including support agents.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-12",
            title: "Recognizing failed transactions",
            excerpt:
              "A transaction may fail if your card details are incorrect, your bank declines the charge, or there are insufficient funds. You will receive a failure notification and no amount will be deducted.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "pay-13",
            title: "Payment verification process",
            excerpt:
              "Some payments may require OTP verification from your bank before they are processed. This is a standard security measure. Enter the OTP sent to your registered phone number to complete the payment.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "Troubleshooting Guides",
        articles: [
          {
            id: "pay-t1",
            title: "Wallet funded but balance not updated",
            excerpt:
              "If your wallet balance has not updated after a successful payment, wait up to 30 minutes before contacting support. Share your transaction reference, payment amount, and the time of payment.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t2",
            title: "Payment failed but money was deducted",
            excerpt:
              "If your bank deducted funds but the payment shows as failed, the amount is typically reversed within 1–5 business days. If not reversed after 5 days, contact your bank with the transaction reference.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t3",
            title: "Duplicate wallet funding transaction",
            excerpt:
              "If you notice a duplicate charge on your statement, contact support immediately with both transaction references. Duplicate charges are reversed within 24–48 hours after investigation.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t4",
            title: "Unable to complete Paystack payment",
            excerpt:
              "If you are unable to complete a Paystack payment, try a different browser, disable ad blockers, or use a different card. Ensure your card is enabled for online transactions by your bank.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t5",
            title: "Transaction pending for too long",
            excerpt:
              "If a transaction has been pending for more than 2 hours, it may be stuck in processing. Contact support with your transaction reference and we will investigate and resolve it promptly.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t6",
            title: "Payment receipt missing",
            excerpt:
              "If you cannot find a payment receipt in your transaction history, it may still be processing. If the transaction is completed but no receipt is available, contact support with the transaction reference.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t7",
            title: "Invalid transaction reference",
            excerpt:
              "An invalid transaction reference error usually means the reference does not exist in our system or was entered incorrectly. Double-check the reference from your transaction history or receipt.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t8",
            title: "Payment declined by bank",
            excerpt:
              "Your bank may decline a payment due to daily limits, insufficient funds, card restrictions, or suspected fraud. Contact your bank directly to understand the reason and resolve the issue.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t9",
            title: "Card payment authorization failed",
            excerpt:
              "Card authorization failure can occur if your card details are incorrect, your card has expired, or your bank requires OTP verification. Check your card details and try again or use a different payment method.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "pay-t10",
            title: "Wallet balance incorrect after payment",
            excerpt:
              "If your wallet balance appears incorrect after a payment, check your transaction history to verify the credited amount. If there is a discrepancy, contact support with your transaction reference.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
        ],
      },
      {
        heading: "FAQs",
        articles: [
          {
            id: "pay-f1",
            title: "How long does wallet funding take?",
            excerpt:
              "Card payments and USSD top-ups reflect instantly. Bank transfers may take up to 30 minutes. If funding is not reflected after 2 hours, contact support with your transfer details.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f2",
            title: "Why is my payment still pending?",
            excerpt:
              "Payments can remain pending due to bank processing times, network delays, or security checks. Most pending transactions resolve within 30 minutes. Contact support if it exceeds 2 hours.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f3",
            title: "Can I reserve a payment?",
            excerpt:
              "Payments are held in escrow when you create a contract with a milestone. This reserves the funds for the artisan until the milestone is approved and released by you.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f4",
            title: "How do I get my receipt?",
            excerpt:
              "Go to Wallet > Transaction History, select the transaction, and click Download Receipt. Receipts are also sent to your registered email address after every successful transaction.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f5",
            title: "Why can't I use my card?",
            excerpt:
              "Your card may not work if it is not enabled for online transactions, has reached its daily limit, or has been flagged by your bank. Contact your bank to enable online and international transactions.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f6",
            title: "Is wallet funding instant?",
            excerpt:
              "Yes, card and USSD payments are credited to your wallet instantly after successful authorization. Bank transfers may take up to 30 minutes depending on your bank's processing time.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f7",
            title: "What payment methods are supported?",
            excerpt:
              "Brikcell supports Visa and Mastercard (debit and credit), bank transfers, and USSD payments via Paystack. We plan to add more payment methods in future updates.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f8",
            title: "Can someone else fund my wallet?",
            excerpt:
              "Yes, another person can fund your wallet using your unique payment link or by initiating a bank transfer to your Brikcell wallet account details. Contact support to get your wallet funding details.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
          {
            id: "pay-f9",
            title: "Why was my payment declined?",
            excerpt:
              "Payments are declined when your card details are wrong, your card has reached its limit, your bank has flagged the transaction, or 3D Secure authentication failed. Try a different card or payment method.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
        ],
      },
    ],
  },
  {
    key: "withdrawals",
    label: "Withdrawals",
    icon: Landmark,
    sections: [
      {
        heading: "Getting Started",
        articles: [
          {
            id: "wd-1",
            title: "How to withdraw funds from your wallet",
            excerpt:
              "Go to Wallet > Withdraw Funds, enter the amount you wish to withdraw, select your linked bank account, and confirm the request. Withdrawals are processed within 1–2 business days.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "wd-2",
            title: "Supported payout methods",
            excerpt:
              "Brikcell currently supports Nigerian bank account withdrawals. Your bank account must be linked and verified in Settings > Payment Methods before you can make a withdrawal.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "Issues",
        articles: [
          {
            id: "wd-3",
            title: "Withdrawal failed or declined",
            excerpt:
              "A withdrawal may fail if your bank account details are incorrect, your account is unverified, or you have insufficient wallet balance after applicable processing fees.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "wd-4",
            title: "Withdrawal pending for too long",
            excerpt:
              "Withdrawals are typically processed within 1–2 business days. If your withdrawal has been pending for over 3 business days, contact support with your withdrawal reference ID.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "wd-5",
            title: "Minimum and maximum withdrawal limits",
            excerpt:
              "The minimum withdrawal amount is ₦1,000 and the maximum per single transaction is ₦500,000. Daily cumulative limits may apply depending on your account verification level.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
        ],
      },
    ],
  },
  {
    key: "booking",
    label: "Booking",
    icon: CalendarDays,
    sections: [
      {
        heading: "Getting Started",
        articles: [
          {
            id: "bk-1",
            title: "How to book an artisan on Brikcell",
            excerpt:
              "Browse available artisans or service listings, view their profiles, then click Book Now to select a date, describe your requirements, and confirm the booking. Your payment is only captured when the artisan accepts.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "bk-2",
            title: "How artisans accept booking requests",
            excerpt:
              "Once you submit a booking, the artisan receives a notification and has 24 hours to accept or decline. You will be notified of their response via email and in-app notification.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "Managing Bookings",
        articles: [
          {
            id: "bk-3",
            title: "How to cancel a booking",
            excerpt:
              "Navigate to My Bookings, select the booking you want to cancel, and click Cancel Booking. Cancellation policies and applicable refund terms depend on how close the cancellation is to the scheduled date.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "bk-4",
            title: "Booking not confirmed by artisan",
            excerpt:
              "If an artisan has not confirmed your booking within 24 hours, the booking request expires automatically and no payment is charged to your wallet.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "bk-5",
            title: "Rescheduling a booking",
            excerpt:
              "To reschedule a booking, contact the artisan through the Brikcell chat before the scheduled date. Both parties must agree to the new date for the reschedule to take effect.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
        ],
      },
    ],
  },
  {
    key: "contracts",
    label: "Contracts",
    icon: FileText,
    sections: [
      {
        heading: "Getting Started",
        articles: [
          {
            id: "ct-1",
            title: "How contracts work on Brikcell",
            excerpt:
              "A contract is created when an employer accepts a proposal from an artisan for a posted job. It outlines the scope of work, milestones, deadlines, and agreed payment terms.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "ct-2",
            title: "How milestone payments are structured",
            excerpt:
              "Contracts are broken into milestones. Employers fund each milestone in advance and the funds are held in escrow. Once an artisan submits work and the employer approves, the milestone payment is released.",
            type: "User guide",
            actionLabel: "Get started",
          },
        ],
      },
      {
        heading: "Issues",
        articles: [
          {
            id: "ct-3",
            title: "How to raise a dispute on a contract",
            excerpt:
              "If you have a disagreement on a milestone or deliverable, navigate to the Contract page, select the milestone in question, and click Raise Dispute to initiate a resolution review.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "ct-4",
            title: "Milestone not released by employer",
            excerpt:
              "If the employer has not released a milestone payment after work has been submitted and the deadline has passed, you can raise a dispute. Your funds are protected and held securely in escrow.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "ct-5",
            title: "Contract ended without payment",
            excerpt:
              "If a contract is marked closed or completed but payment has not been released, please contact support immediately with your contract reference ID for investigation.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
        ],
      },
    ],
  },
  {
    key: "job_service",
    label: "Job or Service",
    icon: BriefcaseBusiness,
    sections: [
      {
        heading: "For Employers",
        articles: [
          {
            id: "js-1",
            title: "How to post a job or gig",
            excerpt:
              "Go to Post a Gig from your employer dashboard. Fill in the job title, description, budget, required skills, location, and deadline, then publish to receive proposals from qualified artisans.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "js-2",
            title: "How to review and accept proposals",
            excerpt:
              "Once artisans submit proposals for your job, navigate to the job listing page to review each proposal, compare rates and experience, message the artisan directly, and accept the best fit.",
            type: "Help article",
            actionLabel: "Read article",
          },
        ],
      },
      {
        heading: "For Artisans",
        articles: [
          {
            id: "js-3",
            title: "How to post a service listing",
            excerpt:
              "Navigate to Post Service from your artisan dashboard. Add your service title, description, pricing, portfolio images, and delivery time, then publish to make it discoverable by potential clients.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "js-4",
            title: "How to apply to a job",
            excerpt:
              "Browse available jobs from Browse Jobs on your artisan dashboard, select a job that matches your skills, and submit a proposal with your rate, timeline, and a cover message.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "js-5",
            title: "Service or job listing removed",
            excerpt:
              "Listings that violate Brikcell's community guidelines may be removed without notice. If you believe your listing was removed in error, contact support with the listing title and details.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
        ],
      },
    ],
  },
  {
    key: "account",
    label: "Account",
    icon: UserRound,
    sections: [
      {
        heading: "Profile & Verification",
        articles: [
          {
            id: "ac-1",
            title: "How to verify your identity on Brikcell",
            excerpt:
              "Go to Settings > Profile Verification and upload a valid government-issued ID along with a clear selfie. Verified accounts receive a trust badge and higher visibility on the platform.",
            type: "User guide",
            actionLabel: "Get started",
          },
          {
            id: "ac-2",
            title: "How to update your profile information",
            excerpt:
              "Navigate to Settings > Profile to update your display name, bio, skills, profile photo, and cover image. Changes are saved immediately and reflected across your listings and bookings.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "ac-3",
            title: "How to link a bank account",
            excerpt:
              "Go to Settings > Payment Methods and click Add Bank Account. Enter your account number and select your bank. Verification is completed via BVN matching or a small test deposit.",
            type: "User guide",
            actionLabel: "Get started",
          },
        ],
      },
      {
        heading: "Access Issues",
        articles: [
          {
            id: "ac-4",
            title: "Account suspended or restricted",
            excerpt:
              "Accounts may be suspended for policy violations such as fraudulent activity, harassment, or repeated guideline breaches. To appeal, submit a support ticket with your registered email and reason for appeal.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "ac-5",
            title: "How to reset your password",
            excerpt:
              "Click Forgot Password on the login page, enter your registered email address, and follow the reset link sent to your inbox. Password reset links expire after 30 minutes.",
            type: "FAQ",
            actionLabel: "Learn more",
          },
        ],
      },
    ],
  },
  {
    key: "chats",
    label: "Chats",
    icon: MessageSquareText,
    sections: [
      {
        heading: "Getting Started",
        articles: [
          {
            id: "ch-1",
            title: "How to start a conversation with an artisan or employer",
            excerpt:
              "From any artisan profile or service listing page, click the Message button to initiate a conversation. You can also access all active chats from the messages icon in the top navigation bar.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "ch-2",
            title: "How the Brikcell chat system works",
            excerpt:
              "Brikcell's real-time chat allows employers and artisans to communicate about jobs, bookings, and contracts. All messages are securely stored and accessible from your dashboard at any time.",
            type: "User guide",
            actionLabel: "Get started",
          },
        ],
      },
      {
        heading: "Issues",
        articles: [
          {
            id: "ch-3",
            title: "Messages not being delivered",
            excerpt:
              "If your messages show as sent but are not being delivered, check your internet connection first. If the issue persists, try refreshing the page or logging out and back in to re-establish the connection.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
          {
            id: "ch-4",
            title: "How to report or block a user",
            excerpt:
              "Open the chat with the user you want to report, click the options menu (three dots icon), and select Report or Block. Reported users are reviewed by the Brikcell trust and safety team.",
            type: "Help article",
            actionLabel: "Read article",
          },
          {
            id: "ch-5",
            title: "Chat history not loading",
            excerpt:
              "If your chat history fails to load, try clearing your browser cache and reloading the page. If the issue continues, contact support and provide the username or chat room you were messaging.",
            type: "Troubleshooting guide",
            actionLabel: "Discover solutions",
          },
        ],
      },
    ],
  },
]

const ALL_ARTICLES: KbArticle[] = POPULAR_TOPICS.flatMap((topic) =>
  topic.sections.flatMap((section) =>
    section.articles.map((article) => ({
      ...article,
      topicKey: topic.key,
      topicLabel: topic.label,
    }))
  )
)

// ─── Constants ──────────────────────────────────────────────────────────────────

const categoryIcons: Record<SupportCategoryValue, React.ElementType> = {
  payment_issue: WalletCards,
  withdrawal_issue: Landmark,
  booking_issue: CalendarDays,
  contract_milestone_issue: FileText,
  account_profile_issue: UserRound,
  job_service_issue: BriefcaseBusiness,
  chat_message_issue: MessageSquareText,
}

const categoryColours: Record<SupportCategoryValue, string> = {
  payment_issue: "bg-blue-500",
  withdrawal_issue: "bg-emerald-500",
  booking_issue: "bg-amber-500",
  contract_milestone_issue: "bg-fuchsia-500",
  account_profile_issue: "bg-violet-500",
  job_service_issue: "bg-orange-500",
  chat_message_issue: "bg-orange-500",
}

const priorityStyles: Record<SupportPriorityValue, { icon: string; selected: string }> = {
  low: { icon: "text-emerald-600", selected: "border-emerald-400 bg-emerald-50/60" },
  medium: { icon: "text-orange-500", selected: "border-orange-400 bg-orange-50/60" },
  high: { icon: "text-amber-500", selected: "border-amber-400 bg-amber-50/60" },
  urgent: { icon: "text-red-500", selected: "border-red-400 bg-red-50/60" },
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN REVIEW",
  waiting_for_user: "AWAITING YOU",
  resolved: "RESOLVED",
  closed: "CLOSED",
}

const articleTypeBadge: Record<ArticleType, string> = {
  "Help article": "border-blue-200 bg-blue-50 text-blue-700",
  "Troubleshooting guide": "border-amber-200 bg-amber-50 text-amber-700",
  FAQ: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "User guide": "border-violet-200 bg-violet-50 text-violet-700",
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const auth = getAuth()
  const role = auth?.user?.role
  const isArtisan = role === "artisan"

  // Page view state
  const [pageView, setPageView] = useState<PageView>("home")
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [createTicketOpen, setCreateTicketOpen] = useState(false)

  // Wizard state
  const [step, setStep] = useState(1)
  const [options, setOptions] = useState<SupportOptionsResponse | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ticketCount, setTicketCount] = useState(0)
  const [createdTicket, setCreatedTicket] = useState<SupportTicketDTO | null>(null)

  // My tickets state
  const [createdTickets, setCreatedTickets] = useState<SupportTicketDTO[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketPagination, setTicketPagination] = useState<PaginationMeta | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDTO | null>(null)
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false)
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SupportTicketDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Search
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return ALL_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.topicLabel.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPageView(value.trim() ? "search" : "home")
  }

  const openTopic = (key: TopicKey) => {
    setActiveTopic(key)
    setPageView("topic")
    setSearchQuery("")
  }

  const backToHome = () => {
    setPageView("home")
    setActiveTopic(null)
    setSearchQuery("")
  }

  // Data loading
  const loadCreatedTickets = async (page = ticketPage) => {
    try {
      setTicketsLoading(true)
      const response = await listMySupportTickets(page, 6)
      const paginated = normalizePaginatedResponse<SupportTicketDTO>(response)
      setCreatedTickets(paginated.data)
      setTicketPagination(paginated.pagination)
    } catch (error: any) {
      setCreatedTickets([])
      setTicketPagination(null)
      toast.error(error?.message || "Unable to load your support tickets")
    } finally {
      setTicketsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadSupportData() {
      try {
        setLoadingOptions(true)
        setTicketsLoading(true)

        const [optionsResponse, countResponse, ticketsResponse] = await Promise.all([
          getSupportOptions(),
          getMySupportTicketCount(),
          listMySupportTickets(1, 6),
        ])

        if (cancelled) return

        const paginatedTickets = normalizePaginatedResponse<SupportTicketDTO>(ticketsResponse)

        setOptions(optionsResponse)
        setTicketCount(Number(countResponse?.count || 0))
        setCreatedTickets(paginatedTickets.data)
        setTicketPagination(paginatedTickets.pagination)
      } catch (error: any) {
        toast.error(error?.message || "Unable to load support information")
      } finally {
        if (!cancelled) {
          setLoadingOptions(false)
          setTicketsLoading(false)
        }
      }
    }

    loadSupportData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (ticketPage === 1) return
    loadCreatedTickets(ticketPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketPage])

  // Wizard helpers
  const selectedCategory = useMemo(
    () => options?.categories.find((c) => c.value === form.category) || null,
    [options, form.category]
  )

  const selectedPriority = useMemo(
    () => options?.priorities.find((p) => p.value === form.priority) || null,
    [options, form.priority]
  )

  const currentStepValid = useMemo(() => {
    if (step === 1) return Boolean(form.category)
    if (step === 2)
      return Boolean(form.issue && form.subject.trim() && form.description.trim())
    if (step === 3) return Boolean(form.priority)
    return true
  }, [form, step])

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectCategory = (category: SupportCategoryOption) => {
    setForm((prev) => ({
      ...prev,
      category: category.value,
      issue: "",
      subject: "",
    }))
  }

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleFiles = (files: FileList | null) => {
    const selected = Array.from(files || [])
    if (!selected.length) return

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    const acceptedFiles = selected.filter(
      (f) => validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024
    )

    if (acceptedFiles.length !== selected.length) {
      toast.error(
        "Some files were skipped. Use PNG, JPG, WEBP, PDF or DOC files below 10 MB."
      )
    }

    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...acceptedFiles].slice(0, 5),
    }))
  }

  const nextStep = () => {
    if (!currentStepValid) {
      toast.error("Please complete the required fields")
      return
    }
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const previousStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const openTicketDetails = async (ticketId: string) => {
    setTicketDetailsOpen(true)
    setTicketDetailsLoading(true)
    setSelectedTicket(null)
    try {
      const ticket = await getMySupportTicket(ticketId)
      setSelectedTicket(ticket)
    } catch (error: any) {
      toast.error(error?.message || "Unable to load ticket details")
      setTicketDetailsOpen(false)
    } finally {
      setTicketDetailsLoading(false)
    }
  }

  const submitTicket = async () => {
    if (
      !form.category ||
      !form.issue ||
      !form.subject.trim() ||
      !form.description.trim() ||
      !form.priority
    ) {
      toast.error("Please complete all required fields")
      return
    }

    setSubmitting(true)

    try {
      const ticket = await createSupportTicket({
        category: form.category,
        issue: form.issue,
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
        relatedReference: form.relatedReference.trim() || undefined,
        attachments: form.attachments,
      })

      setCreatedTicket(ticket)
      setTicketCount((prev) => prev + 1)
      setTicketPage(1)
      setCreateTicketOpen(false)
      await loadCreatedTickets(1)
      toast.success("Support ticket created successfully")
    } catch (error: any) {
      toast.error(error?.message || "Unable to create support ticket")
    } finally {
      setSubmitting(false)
    }
  }

  const resetTicketForm = () => {
    setCreatedTicket(null)
    setForm(initialForm)
    setStep(1)
  }

  const confirmDeleteTicket = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSupportTicket(deleteTarget.id)
      setTicketCount((prev) => Math.max(0, prev - 1))
      setDeleteTarget(null)
      await loadCreatedTickets(ticketPage)
      toast.success("Ticket deleted successfully")
    } catch (error: any) {
      toast.error(error?.message || "Unable to delete ticket")
    } finally {
      setDeleting(false)
    }
  }

  const openCreateTicket = () => {
    setStep(1)
    setForm(initialForm)
    setCreateTicketOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)]">
        <SupportSidebar artisan={isArtisan} ticketCount={ticketCount} />

        <main className="min-w-0">
          {/* Hero — hidden when browsing a topic */}
          {pageView !== "topic" && <HeroSection />}

          {/* Search bar + action buttons */}
          <div className="border-b border-slate-100 px-5 py-4 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search for answers (e.g., payments, bookings, wallet...)"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Hidden when topic is active; hidden on mobile when searching */}
              <div
                className={`shrink-0 items-center gap-3 ${
                  pageView === "topic"
                    ? "hidden"
                    : searchQuery.trim()
                    ? "hidden sm:flex"
                    : "flex"
                }`}
              >
                <Button
                  type="button"
                  className="h-11 gap-1.5 rounded-lg bg-primary text-white hover:bg-primary/90"
                  onClick={openCreateTicket}
                >
                  Create ticket
                  <span className="text-lg font-light leading-none">+</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-lg"
                  onClick={() =>
                    toast.info("Live chat support coming soon. Please create a ticket for assistance.")
                  }
                >
                  Chat with support
                  <MessageSquareText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-7 sm:px-8 lg:px-10">
            <div className="flex gap-8">
              <div className="min-w-0 flex-1">
                {pageView === "search" && (
                  <SearchResultsView
                    query={searchQuery}
                    results={searchResults}
                    onTopicClick={openTopic}
                  />
                )}

                {pageView === "topic" && activeTopic && (
                  <TopicDetailView
                    topic={POPULAR_TOPICS.find((t) => t.key === activeTopic)!}
                    onBack={backToHome}
                    onCreateTicket={openCreateTicket}
                  />
                )}

                {pageView === "home" && (
                  <>
                    <PopularTopicsGrid onTopicClick={openTopic} />
                    <MyTicketsSection
                      tickets={createdTickets}
                      loading={ticketsLoading}
                      pagination={ticketPagination}
                      onPageChange={setTicketPage}
                      onViewTicket={openTicketDetails}
                      onDeleteTicket={setDeleteTarget}
                      onCreateTicket={openCreateTicket}
                    />
                  </>
                )}
              </div>

              <div className="hidden w-[240px] shrink-0 lg:block">
                <StillHaveQuestionsCard onGetInTouch={openCreateTicket} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog
        open={createTicketOpen}
        onOpenChange={(open) => {
          if (!open) setCreateTicketOpen(false)
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-32px)] max-w-[1100px] sm:max-w-[1100px] overflow-y-auto rounded-2xl p-0">
          <div className="border-b border-slate-100 px-6 py-5">
            <DialogHeader>
              <div className="flex items-center gap-3 pr-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={previousStep}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <DialogTitle className="text-lg">Create Support Ticket</DialogTitle>
              </div>
            </DialogHeader>
            <SupportStepper step={step} />
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="px-6 py-6">
              {loadingOptions ? (
                <div className="space-y-4">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="min-h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {step === 1 && options && (
                    <CategoryStep
                      categories={options.categories}
                      selected={form.category}
                      onSelect={selectCategory}
                      onNext={nextStep}
                    />
                  )}

                  {step === 2 && (
                    <DetailsStep
                      category={selectedCategory}
                      form={form}
                      updateForm={updateForm}
                      onBack={previousStep}
                      onNext={nextStep}
                    />
                  )}

                  {step === 3 && options && (
                    <AdditionalInformationStep
                      priorities={options.priorities}
                      form={form}
                      updateForm={updateForm}
                      fileInputRef={fileInputRef}
                      onFiles={handleFiles}
                      onRemoveAttachment={removeAttachment}
                      onBack={previousStep}
                      onNext={nextStep}
                    />
                  )}

                  {step === 4 && (
                    <ReviewStep
                      form={form}
                      category={selectedCategory}
                      priority={selectedPriority}
                      submitting={submitting}
                      onBack={previousStep}
                      onSubmit={submitTicket}
                      onEditStep={setStep}
                    />
                  )}
                </>
              )}
            </div>

            <div className="border-l border-slate-100 px-5 py-6">
              <TicketSummary
                form={form}
                category={selectedCategory}
                priority={selectedPriority}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        ticket={deleteTarget}
        deleting={deleting}
        onConfirm={confirmDeleteTicket}
        onCancel={() => setDeleteTarget(null)}
      />

      <TicketCreatedDialog
        ticket={createdTicket}
        open={Boolean(createdTicket)}
        onClose={resetTicketForm}
        onViewTicket={(ticketId) => {
          resetTicketForm()
          openTicketDetails(ticketId)
        }}
      />

      <TicketDetailsDialog
        open={ticketDetailsOpen}
        loading={ticketDetailsLoading}
        ticket={selectedTicket}
        options={options}
        onOpenChange={(open) => {
          setTicketDetailsOpen(open)
          if (!open) setSelectedTicket(null)
        }}
      />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <div
      className="relative mx-5 mt-5 h-[220px] overflow-hidden rounded-2xl sm:mx-8 sm:h-[240px] lg:mx-10"
      style={{
        backgroundImage: "url('/support-hero.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative flex h-full flex-col justify-center px-8 sm:px-10 lg:px-12">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Support Center</h1>
        <p className="mt-2 text-sm text-white/80">
          Find answers or contact support, we&apos;re here to help
        </p>
      </div>
    </div>
  )
}

// ─── Search Results ──────────────────────────────────────────────────────────

function SearchResultsView({
  query,
  results,
  onTopicClick,
}: {
  query: string
  results: KbArticle[]
  onTopicClick: (key: TopicKey) => void
}) {
  if (!query.trim()) return null

  if (results.length === 0) {
    return (
      <div>
        <p className="text-sm text-slate-700">
          No results for{" "}
          <span className="font-semibold text-primary">&quot;{query}&quot;</span>.
        </p>
        <p className="mt-1 text-sm text-slate-500">Try searching for something else.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-6 text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold text-slate-800">{results.length}</span>{" "}
        result{results.length !== 1 ? "s" : ""} for{" "}
        <span className="font-semibold text-primary">&quot;{query}&quot;</span>
      </p>

      <div className="divide-y divide-slate-100">
        {results.map((article) => (
          <div key={article.id} className="py-6 first:pt-0">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                articleTypeBadge[article.type]
              }`}
            >
              {article.type}
            </span>

            <h3 className="mt-3 text-xl font-semibold text-slate-900">{article.title}</h3>

            <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
              {article.excerpt}
            </p>

            <button
              type="button"
              onClick={() => onTopicClick(article.topicKey)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {article.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Popular Topics Grid ──────────────────────────────────────────────────────

function PopularTopicsGrid({ onTopicClick }: { onTopicClick: (key: TopicKey) => void }) {
  return (
    <div className="mb-10">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">Popular Topics</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {POPULAR_TOPICS.map((topic) => {
          const Icon = topic.icon
          return (
            <button
              key={topic.key}
              type="button"
              onClick={() => onTopicClick(topic.key)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-primary/30 hover:shadow-sm"
            >
              <Icon className="h-5 w-5 shrink-0 text-slate-500" />
              <span className="text-sm font-medium text-slate-800">{topic.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Topic Detail ─────────────────────────────────────────────────────────────

function TopicDetailView({
  topic,
  onBack,
  onCreateTicket,
}: {
  topic: Topic
  onBack: () => void
  onCreateTicket: () => void
}) {
  const [openArticleId, setOpenArticleId] = useState<string | null>(null)

  return (
    <div>
      <nav className="mb-5 flex items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-primary hover:underline"
        >
          Support Center
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-700">{topic.label}</span>
      </nav>

      <p className="mb-1 text-xs font-medium text-slate-500">Help Articles</p>
      <h2 className="text-2xl font-bold text-slate-900">{topic.label}</h2>

      <div className="mt-7 space-y-8">
        {topic.sections.map((section) => (
          <div key={section.heading}>
            <h3 className="mb-3 text-lg font-semibold text-slate-800">{section.heading}</h3>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {section.articles.map((article) => {
                const isOpen = openArticleId === article.id
                return (
                  <div key={article.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenArticleId(isOpen ? null : article.id)
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {article.title}
                      </span>
                      {isOpen ? (
                        <MinusCircle className="h-5 w-5 shrink-0 text-slate-400" />
                      ) : (
                        <PlusCircle className="h-5 w-5 shrink-0 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                        <p className="text-sm leading-6 text-slate-600">
                          {article.excerpt}
                        </p>
                        <button
                          type="button"
                          onClick={onCreateTicket}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                        >
                          <span className="text-slate-900">Still need help?</span>
                          <span className="text-primary">Create a ticket</span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── My Tickets ───────────────────────────────────────────────────────────────

function MyTicketsSection({
  tickets,
  loading,
  pagination,
  onPageChange,
  onViewTicket,
  onDeleteTicket,
  onCreateTicket,
}: {
  tickets: SupportTicketDTO[]
  loading: boolean
  pagination: PaginationMeta | null
  onPageChange: (page: number) => void
  onViewTicket: (ticketId: string) => void
  onDeleteTicket: (ticket: SupportTicketDTO) => void
  onCreateTicket: () => void
}) {
  return (
    <section>
      <h2 className="mb-5 text-lg font-semibold text-slate-900">My Tickets</h2>

      {loading ? (
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 sm:grid sm:grid-cols-[130px_minmax(0,1fr)_160px_200px_80px] sm:items-center sm:gap-4">
            {["Ticket", "Subject", "Status", "Last Update", ""].map((h, i) => (
              <p key={i} className="text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[130px_minmax(0,1fr)_160px_200px_80px] sm:items-center sm:gap-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200">
            <Inbox className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No tickets found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create ticket to get your issues sorted
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 gap-1.5"
            onClick={onCreateTicket}
          >
            Create ticket
            <span className="text-base font-light leading-none">+</span>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white">
          {/* Table header */}
          <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 sm:grid sm:grid-cols-[130px_minmax(0,1fr)_160px_200px_80px] sm:items-center sm:gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ticket
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subject
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last Update
            </p>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[130px_minmax(0,1fr)_160px_200px_80px] sm:items-center sm:gap-4"
              >
                <p className="text-xs font-semibold text-slate-500 sm:text-sm sm:font-medium sm:text-slate-700">
                  {ticket.ticket_number}
                </p>

                <p className="truncate text-sm text-slate-800">{ticket.subject}</p>

                <div>
                  <TicketStatusBadge status={ticket.status} />
                </div>

                <p className="text-xs text-slate-500">
                  {formatTicketDate(
                    ticket.createdAt || ticket.created_at,
                    true
                  )}
                </p>

                <div className="flex items-center gap-2">
                  {["open", "waiting_for_user"].includes(ticket.status) ? (
                    <button
                      type="button"
                      title="Delete ticket"
                      onClick={() => onDeleteTicket(ticket)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span
                      title="Tickets in progress or resolved cannot be deleted"
                      className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-slate-100 text-slate-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  )}

                  <button
                    type="button"
                    title="View ticket"
                    onClick={() => onViewTicket(ticket.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-primary/30 hover:text-primary"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && (
            <div className="border-t border-slate-100 px-5 py-4">
              <PaginationControl
                pagination={pagination}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ─── Wizard Steps (unchanged logic, used inside Create Ticket Dialog) ──────────

function SupportStepper({ step }: { step: number }) {
  const steps = ["Category", "Details", "Additional Info", "Review & Submit"]

  return (
    <div className="mt-6">
      <div className="grid grid-cols-4">
        {steps.map((label, index) => {
          const number = index + 1
          const completed = step > number
          const active = step === number

          return (
            <div key={label} className="relative flex flex-col items-center">
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 top-4 h-px w-full ${
                    step > number ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium ${
                  completed || active
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                {completed ? <Check className="h-4 w-4" /> : number}
              </div>

              <span className="mt-3 hidden text-center text-xs font-medium text-slate-700 sm:block">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoryStep({
  categories,
  selected,
  onSelect,
  onNext,
}: {
  categories: SupportCategoryOption[]
  selected: FormState["category"]
  onSelect: (category: SupportCategoryOption) => void
  onNext: () => void
}) {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          1. Select Issue Category
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose the category that best matches your issue
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const Icon = categoryIcons[category.value]
          const active = selected === category.value

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => onSelect(category)}
              className={`relative min-h-40 rounded-xl border p-4 text-left transition ${
                active
                  ? "border-blue-500 bg-blue-50/30 shadow-sm"
                  : "border-slate-200 hover:border-primary/40"
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${
                  active ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>

              <CompactSupportIcon colour={categoryColours[category.value]}>
                <Icon className="h-5 w-5 text-white" />
              </CompactSupportIcon>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">{category.label}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{category.description}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-7 flex justify-end">
        <Button type="button" disabled={!selected} onClick={onNext} className="min-w-44">
          Next: Ticket details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

function DetailsStep({
  category,
  form,
  updateForm,
  onBack,
  onNext,
}: {
  category: SupportCategoryOption | null
  form: FormState
  updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-slate-950">2. Ticket Details</h2>
        <p className="mt-2 text-sm text-slate-500">
          Please provide more information about the issue you&apos;re facing
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label>
            Specific issue <span className="text-red-500">*</span>
          </Label>
          <select
            value={form.issue}
            onChange={(e) => updateForm("issue", e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Select the specific issue</option>
            {(category?.issues || []).map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.subject}
            onChange={(e) => updateForm("subject", e.target.value)}
            placeholder="Enter a short summary of your issue"
            maxLength={180}
          />
          <p className="text-xs text-slate-500">A short summary of your issue</p>
        </div>

        <div className="space-y-2">
          <Label>
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            placeholder="Describe what happened and include any important details"
            rows={6}
            maxLength={5000}
          />
          <p className="text-xs text-slate-500">Provide as much detail as possible</p>
        </div>
      </div>

      <WizardButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Next: Additional information"
        disableNext={!form.issue || !form.subject.trim() || !form.description.trim()}
      />
    </>
  )
}

function AdditionalInformationStep({
  priorities,
  form,
  updateForm,
  fileInputRef,
  onFiles,
  onRemoveAttachment,
  onBack,
  onNext,
}: {
  priorities: SupportPriorityOption[]
  form: FormState
  updateForm: <K extends keyof FormState>(field: K, value: FormState[K]) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onFiles: (files: FileList | null) => void
  onRemoveAttachment: (index: number) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-slate-950">3. Additional Information</h2>
        <p className="mt-2 text-sm text-slate-500">Help us investigate your issue faster</p>
      </div>

      <div className="mt-6">
        <Label>
          Priority level <span className="text-red-500">*</span>
        </Label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {priorities.map((priority) => {
            const active = form.priority === priority.value
            const styles = priorityStyles[priority.value]

            return (
              <button
                key={priority.value}
                type="button"
                onClick={() => updateForm("priority", priority.value)}
                className={`relative min-h-28 rounded-xl border p-4 text-left transition ${
                  active ? styles.selected : "border-slate-200 hover:border-primary/40"
                }`}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <CircleAlert className={`h-5 w-5 ${styles.icon}`} />
                <p className="mt-3 text-sm font-semibold text-slate-950">{priority.label}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {priority.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label>Reference ID (Optional)</Label>
        <Input
          value={form.relatedReference}
          onChange={(e) => updateForm("relatedReference", e.target.value)}
          placeholder="Transaction ID, Booking ID, Job ID, Contract ID etc."
        />
        <p className="text-xs text-slate-500">
          Transaction ID, Booking ID, Job ID, Contract ID etc.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <Label>Attach Screenshot or Supporting Documents</Label>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center transition hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200">
            <Upload className="h-4 w-4 text-slate-600" />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP, PDF or DOC. Maximum 10 MB each.</p>
        </button>
      </div>

      {form.attachments.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-slate-800">
            Uploaded files ({form.attachments.length})
          </p>

          {form.attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(index)}
                className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <WizardButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Next: Review & submit"
        disableNext={!form.priority}
      />
    </>
  )
}

function ReviewStep({
  form,
  category,
  priority,
  submitting,
  onBack,
  onSubmit,
  onEditStep,
}: {
  form: FormState
  category: SupportCategoryOption | null
  priority: SupportPriorityOption | null
  submitting: boolean
  onBack: () => void
  onSubmit: () => void
  onEditStep: (step: number) => void
}) {
  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-slate-950">4. Review & Submit</h2>
        <p className="mt-2 text-sm text-slate-500">
          Please review your ticket details before submitting
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <ReviewDetailCard
          icon={WalletCards}
          label="Category"
          value={category?.label || "Not selected"}
          onEdit={() => onEditStep(1)}
        />
        <ReviewDetailCard
          icon={FileText}
          label="Subject"
          value={form.subject || "Not entered"}
          onEdit={() => onEditStep(2)}
        />
        <ReviewDetailCard
          icon={PenLine}
          label="Description"
          value={form.description || "Not entered"}
          truncate
          onEdit={() => onEditStep(2)}
        />
        <ReviewDetailCard
          icon={MousePointerClick}
          label="Priority"
          value={priority?.label || "Not selected"}
          valueClassName={getPriorityTextClass(form.priority)}
          onEdit={() => onEditStep(3)}
        />
        <ReviewDetailCard
          icon={Hash}
          label="Reference ID"
          value={form.relatedReference || "Not provided"}
          onEdit={() => onEditStep(3)}
        />
        <ReviewAttachmentCard files={form.attachments} onEdit={() => onEditStep(3)} />
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting} className="h-11 px-5">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={submitting} className="h-11 min-w-40 px-5">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit ticket
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </>
  )
}

// ─── Review Cards ─────────────────────────────────────────────────────────────

function ReviewDetailCard({
  icon: Icon,
  label,
  value,
  onEdit,
  truncate = false,
  valueClassName = "",
}: {
  icon: React.ElementType
  label: string
  value: string
  onEdit: () => void
  truncate?: boolean
  valueClassName?: string
}) {
  return (
    <div className="flex min-h-[82px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
        <p
          className={`mt-1 text-xs leading-5 ${valueClassName || "text-slate-500"} ${
            truncate ? "line-clamp-1" : "break-words"
          }`}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
      >
        <PencilLine className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>
    </div>
  )
}

function ReviewAttachmentCard({ files, onEdit }: { files: File[]; onEdit: () => void }) {
  const visibleFiles = files.slice(0, 2)
  const remainingFiles = Math.max(files.length - visibleFiles.length, 0)

  return (
    <div className="flex min-h-[94px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <Paperclip className="h-5 w-5 text-slate-700" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-950">Attachment ({files.length})</h3>
        {files.length > 0 ? (
          <div className="mt-2 flex items-center gap-1.5">
            {visibleFiles.map((file, index) => (
              <ReviewFileThumbnail key={`${file.name}-${file.size}-${index}`} file={file} />
            ))}
            {remainingFiles > 0 && (
              <div className="flex h-11 min-w-11 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
                +{remainingFiles}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-500">No files attached</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
      >
        <PencilLine className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>
    </div>
  )
}

function ReviewFileThumbnail({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  if (!previewUrl) {
    return (
      <div
        title={file.name}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50"
      >
        <FileText className="h-5 w-5 text-primary" />
      </div>
    )
  }

  return (
    <div
      title={file.name}
      className="h-11 w-11 overflow-hidden rounded-md border border-slate-300 bg-slate-100"
    >
      <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
    </div>
  )
}

// ─── Ticket Summary Sidebar ───────────────────────────────────────────────────

function TicketSummary({
  form,
  category,
  priority,
}: {
  form: FormState
  category: SupportCategoryOption | null
  priority: SupportPriorityOption | null
}) {
  return (
    <aside>
      <h2 className="border-b border-slate-200 pb-4 text-base font-semibold text-slate-950">
        Ticket Summary
      </h2>
      <div className="mt-5 space-y-5">
        <SummaryItem
          icon={ListTree}
          label="Category"
          value={category?.label || "Not selected"}
          highlighted={Boolean(category)}
        />
        <SummaryItem
          icon={FileText}
          label="Subject"
          value={form.subject || "Not selected"}
        />
        <SummaryItem
          icon={CircleAlert}
          label="Priority"
          value={priority?.label || "Not selected"}
        />
        <SummaryItem
          icon={Hash}
          label="Reference ID"
          value={form.relatedReference || "Not selected"}
        />
        <SummaryItem
          icon={Paperclip}
          label="Attachment"
          value={form.attachments.length ? `${form.attachments.length} file(s)` : "Not selected"}
        />
      </div>
    </aside>
  )
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function TicketCreatedDialog({
  ticket,
  open,
  onClose,
  onViewTicket,
}: {
  ticket: SupportTicketDTO | null
  open: boolean
  onClose: () => void
  onViewTicket: (ticketId: string) => void
}) {
  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-2xl">
        <div className="py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <TicketCheck className="h-7 w-7 text-emerald-600" />
          </div>

          <DialogHeader className="mt-5">
            <DialogTitle className="text-center text-xl">Ticket submitted</DialogTitle>
          </DialogHeader>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your support request has been received and is now being reviewed.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Ticket number</p>
            <p className="mt-1 font-semibold text-primary">{ticket.ticket_number}</p>
            <div className="mt-3 flex justify-center">
              <TicketStatusBadge status={ticket.status} />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button type="button" className="flex-1" onClick={() => onViewTicket(ticket.id)}>
              View ticket
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TicketDetailsDialog({
  open,
  loading,
  ticket,
  options,
  onOpenChange,
}: {
  open: boolean
  loading: boolean
  ticket: SupportTicketDTO | null
  options: SupportOptionsResponse | null
  onOpenChange: (open: boolean) => void
}) {
  const category = options?.categories.find((item) => item.value === ticket?.category)
  const priority = options?.priorities.find((item) => item.value === ticket?.priority)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl p-0">
        {loading ? (
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="h-px bg-slate-100" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${90 - i * 8}%` }} />
              ))}
            </div>
          </div>
        ) : ticket ? (
          <>
            <div className="border-b border-slate-100 px-6 py-5">
              <DialogHeader>
                <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <DialogTitle className="break-words text-xl text-slate-950">
                      {ticket.subject}
                    </DialogTitle>
                    <p className="mt-2 text-xs text-slate-500">{ticket.ticket_number}</p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-7 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <TicketInformationCard
                  label="Category"
                  value={category?.label || humanizeTicketValue(ticket.category)}
                />
                <TicketInformationCard
                  label="Priority"
                  value={priority?.label || humanizeTicketValue(ticket.priority)}
                />
                <TicketInformationCard label="Specific issue" value={ticket.issue} />
                <TicketInformationCard
                  label="Submitted"
                  value={formatTicketDate(ticket.createdAt || ticket.created_at, true)}
                />
                <TicketInformationCard
                  label="Reference ID"
                  value={ticket.related_reference || "Not provided"}
                />
                <TicketInformationCard
                  label="Current status"
                  value={humanizeTicketValue(ticket.status)}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {ticket.description}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Attachments</h3>
                {ticket.attachments?.length ? (
                  <div className="mt-3 space-y-3">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Paperclip className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {attachment.original_name || "Ticket attachment"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {attachment.mime_type || "Uploaded file"}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No attachments were submitted.</p>
                )}
              </div>

              <AdminResponsePanel ticket={ticket} />
            </div>
          </>
        ) : (
          <div className="flex min-h-72 items-center justify-center px-6 text-center text-sm text-slate-500">
            Ticket information could not be loaded.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdminResponsePanel({ ticket }: { ticket: SupportTicketDTO }) {
  const response = ticket.resolution_note?.trim()

  return (
    <div>
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">Support team response</h3>
      </div>

      {response ? (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{response}</p>
          {ticket.resolved_at && (
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              Responded on {formatTicketDate(ticket.resolved_at, true)}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <MessagesSquare className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">No response yet</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            The support team has not responded to this ticket yet.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Still Have Questions Card ────────────────────────────────────────────────

function StillHaveQuestionsCard({ onGetInTouch }: { onGetInTouch: () => void }) {
  return (
    <div className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* 3 overlapping avatar circles */}
      <div className="mb-5 flex justify-center">
        <div className="relative flex items-center">
          <div className="relative z-10 h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <img
              src="/stillQuestions-1.png"
              alt="Support agent"
              className="h-full w-full object-cover"
              style={{ objectPosition: "10% center" }}
            />
          </div>
          <div className="relative z-20 -ml-3 h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <img
              src="/stillQuestions-2.png"
              alt="Support agent"
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% center" }}
            />
          </div>
          <div className="relative z-30 -ml-3 h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <img
              src="/stillQuestions-3.png"
              alt="Support agent"
              className="h-full w-full object-cover"
              style={{ objectPosition: "90% center" }}
            />
          </div>
        </div>
      </div>

      <h3 className="text-center text-base font-semibold text-slate-900">
        Still have questions?
      </h3>
      <p className="mt-2 text-center text-xs leading-5 text-slate-500">
        Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
      </p>

      <Button
        type="button"
        className="mt-5 w-full rounded-lg bg-primary text-sm font-semibold hover:bg-primary/90"
        onClick={onGetInTouch}
      >
        Get in touch
      </Button>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SupportSidebar({
  artisan,
  ticketCount,
}: {
  artisan: boolean
  ticketCount: number
}) {
  const links = artisan
    ? [
        ["Dashboard", "/dashboard/artisan"],
        ["Browse Jobs", "/dashboard/jobs"],
        ["My Bookings", "/dashboard/bookings"],
        ["Post Service", "/dashboard/services/new"],
        ["Wallet", "/dashboard/wallet"],
        ["Settings", "/dashboard/settings"],
      ]
    : [
        ["Dashboard", "/dashboard/customer"],
        ["Browse Talent", "/search"],
        ["My Bookings", "/dashboard/customer/bookings"],
        ["Post a Gig", "/post-job"],
        ["Wallet", "/dashboard/customer/wallet"],
        ["Settings", "/dashboard/customer/settings"],
      ]

  return (
    <aside className="hidden border-r border-slate-100 px-5 py-8 lg:block">
      <nav className="space-y-2">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="block rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            {label}
          </Link>
        ))}

        <Link
          href="/support"
          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Support
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
            {ticketCount}
          </span>
        </Link>
      </nav>
    </aside>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function TicketStatusBadge({ status }: { status: SupportTicketDTO["status"] }) {
  const styles: Record<SupportTicketDTO["status"], string> = {
    open: "border-blue-200 bg-blue-50 text-blue-700",
    in_progress: "border-amber-200 bg-amber-50 text-amber-700",
    waiting_for_user: "border-violet-200 bg-violet-50 text-violet-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    closed: "border-slate-200 bg-slate-100 text-slate-600",
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        styles[status] || styles.open
      }`}
    >
      {TICKET_STATUS_LABELS[status] || humanizeTicketValue(status)}
    </span>
  )
}

function TicketInformationCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  highlighted = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlighted?: boolean
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p
          className={`mt-1 break-words text-xs ${
            highlighted ? "text-primary" : "text-slate-500"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function WizardButtons({
  onBack,
  onNext,
  nextLabel,
  disableNext = false,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel: string
  disableNext?: boolean
}) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Button type="button" onClick={onNext} disabled={disableNext}>
        {nextLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

function CompactSupportIcon({
  children,
  colour,
}: {
  children: React.ReactNode
  colour: string
}) {
  return (
    <div className="relative h-12 w-12">
      <div
        className={`absolute left-1 top-1 h-10 w-10 rotate-12 rounded-lg ${colour} opacity-70`}
      />
      <div
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg ${colour} shadow-lg shadow-primary/20`}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  ticket,
  deleting,
  onConfirm,
  onCancel,
}: {
  ticket: SupportTicketDTO | null
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={Boolean(ticket)} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-sm rounded-2xl">
        <div className="py-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>

          <DialogHeader className="mt-5">
            <DialogTitle className="text-center text-lg">Delete ticket?</DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This will permanently delete{" "}
            <span className="font-semibold text-slate-700">
              {ticket?.ticket_number}
            </span>{" "}
            and all its attachments. This action cannot be undone.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete ticket"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function getPriorityTextClass(priority: SupportPriorityValue | "") {
  const classes: Record<SupportPriorityValue, string> = {
    low: "text-emerald-600",
    medium: "text-orange-500",
    high: "text-orange-600",
    urgent: "text-red-600",
  }
  return priority ? classes[priority] : "text-slate-500"
}

function humanizeTicketValue(value?: string | null) {
  if (!value) return "Not available"
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTicketDate(value?: string | null, includeTime = false) {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date)
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB"
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`
  return `${(kilobytes / 1024).toFixed(1)} MB`
}
