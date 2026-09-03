"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ContractCreationModal } from "@/components/modals/contract-creation-modal"
import { BookingModal } from "@/components/modals/booking-modal"
import { type Socket } from "socket.io-client"
import { sendContract } from "@/lib/chatSenders"
import { useRouter } from "next/navigation"
import {
  listChatRooms, listChatMessages, markChatRoomRead, editChatMessage, API_BASE, getAuth,
  acceptContract,
  sendChatMessageWithFile,
  declineContract,
  requestContractChanges,
  listContractTransactions,
  fundMilestone,
  submitMilestone,
  releaseMilestone,
  partialReleaseMilestone,
  refundMilestone,
  getContractState,
  topupContractEscrow,
  getIncomingMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
  type MessageRequestDTO,
} from "@/lib/api"
import { getSocket } from "@/lib/socket-client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Search,
  Send,
  Paperclip,
  ImageIcon,
  Phone,
  MoreVertical,
  CheckCheck,
  Check,
  Clock,
  FileText,
  DollarSign,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Shield,
  User,
  BellOff,
  Ban,
  Flag,
  Trash2,
  Archive,
} from "lucide-react"

interface Phase {
  id: string | number
  name: string
  description: string
  deliverables: string[]
  amount: number
  labour_cost?: number
  material_cost?: number
  initial_release_done?: boolean
  status:
    | "pending"
    | "in-progress"
    | "delivered"
    | "submitted"
    | "approved"
    | "partial-release"
    | "released"
    | "paid"
    | "cancelled"
    | "refunded"
    | "declined"
  dueDate?: string
  completedDate?: string
}

interface Material {
  id: number
  name: string
  cost: number
  coveredBy: "client" | "artisan"
  receipt?: string
}

interface Contract {
  id: number
  title: string
  description: string
  totalAmount: number
  depositAmount: number
  depositPaid: boolean
  phases: Phase[]
  materials: Material[]
  status: "draft" | "in_review" | "accepted" | "active" | "completed"| "cancelled"
  payment_mode?: 'FULL' | 'MILESTONE'
  createdAt: string
  acceptedAt?: string
}

type MessageStatus = "sent" | "delivered" | "read"

interface Message {
  id: string | number
  text?: string
  timestamp: string
  sender: "me" | "them"
  status: MessageStatus
  type: "text" | "system" | "contract" | "phase-update" | "payment-prompt" | "file"
  attachments?: { type: string; url: string; name: string }[]
  contract?: Contract
  phaseUpdate?: { phaseId: number; status: string; message: string }
  paymentPrompt?: { phaseId: number; amount: number }
  isEdited?: boolean
}

interface ConversationParticipant {
  id: string
  name: string
  email: string
  avatar?: string | null
  service?: string | null
  isOnline?: boolean
  lastSeen?: string
}

interface ConversationLastMessage {
  text: string
  timestamp: string
  isRead: boolean
  sender: "me" | "them"
  type?: string
}

interface Conversation {
  id: string
  participant: ConversationParticipant
  lastMessage: ConversationLastMessage | null
  unreadCount: number
  jobTitle?: string
  jobBudget?: string
  hasActiveContract?: boolean
}

export function MessagingInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showConversationList, setShowConversationList] = useState(true)
  const [showJobSummary, setShowJobSummary] = useState(true)
  const [activeContract, setActiveContract] = useState<Contract | null>(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [roomsLoaded, setRoomsLoaded] = useState(false)
  const [contractActionLoading, setContractActionLoading] = useState<string | null>(null)
  const [contractTxReleasedTotal, setContractTxReleasedTotal] = useState<number>(0)
  const [contractTxDepositPaid, setContractTxDepositPaid] = useState<number>(0)
  const [contractTxLoading, setContractTxLoading] = useState<boolean>(false)
  const [milestoneActionLoading, setMilestoneActionLoading] = useState<string | null>(null)
  const [partialReleaseOpenFor, setPartialReleaseOpenFor] = useState<string | null>(null)
  const [partialReleaseAmount, setPartialReleaseAmount] = useState<Record<string, string>>({})
  const [activeContractEscrowBalance, setActiveContractEscrowBalance] = useState<number | null>(null)
  const [escrowTopupLoading, setEscrowTopupLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isSendingFile, setIsSendingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const selectedRoomIdRef = useRef<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const [pendingRequests, setPendingRequests] = useState<MessageRequestDTO[]>([])
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const incomingArtisanId = searchParams.get("artisanId")
  const incomingArtisanEmail = searchParams.get("artisanEmail")
  const incomingArtisanName = searchParams.get("artisanName")

  const auth = getAuth()
  console.log("[Messaging] auth.user.id =", auth?.user?.id)
  console.log("[Messaging] auth.user.role =", auth?.user?.role)
  //console.log("[Messaging] tokenExists =", Boolean(auth?.token))
  const currentUserRole = auth?.user?.role
  const currentUserId = auth?.user?.id as string | undefined

  const canStartFromUrl = Boolean(incomingArtisanId || incomingArtisanEmail)
  const canType = Boolean(selectedConversation?.id || canStartFromUrl)

  // contractTxReleasedTotal = escrow outflows only (milestone releases).
  // contractTxDepositPaid   = Paystack deposit transactions (wallet top-ups).
  const totalContract = Number(activeContract?.totalAmount ?? 0)

  // When every phase is fully released the contract is complete — use phase amounts
  // so that platform-fee rounding never creates a phantom "remaining" balance.
  const allPhasesReleased =
    (activeContract?.phases ?? []).length > 0 &&
    (activeContract?.phases ?? []).every((p) =>
      ["released", "paid"].includes(String(p.status || "").toLowerCase())
    )
  const totalPaid = allPhasesReleased
    ? totalContract
    : Math.min(contractTxReleasedTotal, totalContract)
  const remaining = Math.max(0, totalContract - totalPaid)

  const depositRequired = Number(activeContract?.depositAmount ?? 0)
  // After final release the full contract value has been paid — show 100%.
  // During the cycle: sum all employer deposits (Paystack checkout + wallet topups).
  const depositPaidAmount = allPhasesReleased
    ? totalContract
    : contractTxDepositPaid > 0
      ? contractTxDepositPaid
      : Math.min(depositRequired, totalPaid)
  const depositFullyPaid = allPhasesReleased || contractTxDepositPaid >= depositRequired || totalPaid >= totalContract



  const mapBackendContractToUI = (contract: any): Contract => ({
  id: contract.id,
  title: contract.title || "Contract",
  description: contract.description || "",
  totalAmount: Number(contract.totalAmount || 0),
  depositAmount: Number(contract.depositAmount || 0),
  depositPaid: Boolean(contract.depositPaid),
  payment_mode: contract.payment_mode ?? undefined,
  materials: Array.isArray(contract.materials) ? contract.materials : [],
  phases: Array.isArray(contract.phases)
    ? contract.phases.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
        amount: Number(p.amount || 0),
        labour_cost: Number(p.labour_cost || 0),
        material_cost: Number(p.material_cost || 0),
        initial_release_done: Boolean(p.initial_release_done),
        status: normalizePhaseStatus(p.status),
        dueDate: p.dueDate || undefined,
        completedDate: p.completedDate || undefined,
      }))
    : [],
    status: normalizeContractStatus(contract.status),
    createdAt: contract.createdAt,
    acceptedAt: contract.acceptedAt,
  })


  const refreshActiveContractState = async (contractId?: string | number) => {
  const id = String(contractId || activeContract?.id || "")
  if (!id) return

  try {
    const res = await getContractState(id)
    const fresh = mapBackendContractToUI(res.contract)

    setActiveContract(fresh)
    // Always sync from DB — backend always returns a number (0 when unfunded)
    setActiveContractEscrowBalance(res.contract.escrowBalance ?? 0)

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type !== "contract" || !msg.contract) return msg
        if (String(msg.contract.id) !== String(id)) return msg
        return {
          ...msg,
          contract: {
            ...msg.contract,
            ...fresh,
          },
        }
      })
    )
    } catch (err) {
      console.error("[Messaging] Failed to refresh contract state", err)
    }
  }

 const patchPhaseEverywhere = (
  matcher: (phase: Phase) => boolean,
  nextStatus: Phase["status"]
) => {
  const patchContract = (contract: Contract | null) => {
    if (!contract) return contract

    return {
      ...contract,
      phases: (contract.phases || []).map((phase) =>
        matcher(phase) ? { ...phase, status: nextStatus } : phase
      ),
    }
  }

  setActiveContract((prev) => patchContract(prev))

  setMessages((prev) =>
    prev.map((msg) => {
      if (msg.type !== "contract" || !msg.contract) return msg
      return {
        ...msg,
        contract: patchContract(msg.contract) || msg.contract,
      }
    })
  )
}

const patchPhaseByIdEverywhere = (
  phaseId: string | number,
  nextStatus: Phase["status"]
) => {
  patchPhaseEverywhere(
    (phase) => String(phase.id) === String(phaseId),
    nextStatus
  )
}

const patchPhaseByTitleEverywhere = (
  milestoneTitle: string,
  nextStatus: Phase["status"]
) => {
  const norm = (v: string) => String(v || "").trim().toLowerCase()

  patchPhaseEverywhere(
    (phase) => norm(phase.name) === norm(milestoneTitle),
    nextStatus
  )
}

const applySystemMilestoneUpdate = (messageText?: string) => {
  if (!messageText) return

  const submitMatch = messageText.match(/^Artisan has submitted milestone "(.+)" for review$/i)
  if (submitMatch) {
    patchPhaseByTitleEverywhere(submitMatch[1], "submitted")
    return
  }

  const releaseMatch = messageText.match(/^Employer released milestone "(.+)"$/i)
  if (releaseMatch) {
    patchPhaseByTitleEverywhere(releaseMatch[1], "released")
    return
  }

  const partialReleaseMatch = messageText.match(/^Employer partially released milestone "(.+)"$/i)
  if (partialReleaseMatch) {
    patchPhaseByTitleEverywhere(partialReleaseMatch[1], "partial-release")
    return
  }

  const refundMatch = messageText.match(/^Employer refunded milestone "(.+)"$/i)
  if (refundMatch) {
    patchPhaseByTitleEverywhere(refundMatch[1], "refunded")
    return
  }
}

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [conversations, searchQuery])

  const bookingContractCandidates = useMemo(() => {
    const candidates = messages
      .filter(
        (message) =>
          message.type === "contract" &&
          message.contract?.id
      )
      .map((message) => ({
        id: String(message.contract!.id),
        title:
          message.contract?.title || "Contract",
      }))

    const unique = new Map<
      string,
      {
        id: string
        title: string
      }
    >()

    candidates.forEach((candidate) => {
      if (!unique.has(candidate.id)) {
        unique.set(candidate.id, candidate)
      }
    })

    return Array.from(unique.values())
  }, [messages])

  const calcTxTotals = (txs: any[]) => {
    const successful = (txs || []).filter(
      (t) => String(t?.status || "").toLowerCase() === "success"
    )
    // Separate deposit (wallet top-up) from escrow release records so they don't
    // inflate "Total Paid". After the backend user_id filter each user sees only
    // their own records, so employer gets: deposit + employer-side release rows.
    // Artisan gets: artisan-side release rows only (no deposit).
    const depositTotal = successful
      .filter((t) => ["deposit", "escrow_topup"].includes(String(t?.type || "").toLowerCase()))
      .reduce((sum, t) => sum + Number(t?.amount || 0), 0)

    const releaseTotal = successful
      .filter((t) => !["deposit", "milestone_refund"].includes(String(t?.type || "").toLowerCase()))
      .reduce((sum, t) => sum + Number(t?.amount || 0), 0)

    return { depositTotal, releaseTotal }
  }

  const scrollToBottom = () => {
    try {
      const el = messagesScrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null
      if (el) el.scrollTop = el.scrollHeight
    } catch (_) {}
  }

  const getConversationPreview = (msg: ConversationLastMessage | null) => {
    if (!msg) return "No messages yet"
    if (msg.type === "contract") return "Contract Proposal"
    if (msg.type === "phase-update") return "Phase Update"
    if (msg.type === "payment-prompt") return "Payment Request"
    return msg.text || "No message content"
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const getMessageStatus = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <Check className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  const normalizePhaseStatus = (raw: any): Phase["status"] => {
  const v = String(raw || "").toUpperCase()

  switch (v) {
      case "DRAFT":
      case "PENDING":
        return "pending"

      case "ACTIVE":
      case "FUNDED":
      case "IN_PROGRESS":
      case "IN-PROGRESS":
        return "in-progress"

      case "DELIVERED":
        return "delivered"

      case "SUBMITTED":
        return "submitted"

      case "APPROVAL_PENDING":
      case "APPROVED":
        return "approved"

      case "PARTIAL_RELEASED":
      case "PARTIAL-RELEASE":
      case "PARTIAL_RELEASE":
        return "partial-release"

      case "RELEASED":
        return "released"

      case "PAID":
        return "paid"

      case "REFUNDED":
        return "refunded"

      case "CANCELLED":
      case "CANCELED":
        return "cancelled"

      case "DECLINED":
        return "declined"

      default:
        return "pending"
    }
  }

  const getPhaseDisplayStatus = (status: string, role?: string) => {
    const s = normalizePhaseStatus(status)

    if (role === "artisan") {
      if (s === "partial-release") return "Partial Payment"
      if (s === "released" || s === "paid") return "Paid"
      if (s === "refunded" || s === "cancelled") return "Cancelled"
      if (s === "submitted") return "Submitted"
      if (s === "approved") return "Approved"
      if (s === "in-progress") return "In Progress"
      return "Pending"
    }

    if (s === "submitted") return "Submitted"
    if (s === "approved") return "Approved"
    if (s === "partial-release") return "Partial Release"
    if (s === "released") return "Released"
    if (s === "refunded") return "Refunded"
    if (s === "cancelled") return "Cancelled"
    if (s === "in-progress") return "Pending"
    return "Pending"
  }

  // const updateActivePhaseStatus = (phaseId: string | number, nextStatus: Phase["status"]) => {
  //   setActiveContract((prev) => {
  //     if (!prev) return prev

  //     return {
  //       ...prev,
  //       phases: prev.phases.map((phase) =>
  //         String(phase.id) === String(phaseId)
  //           ? { ...phase, status: nextStatus }
  //           : phase
  //       ),
  //     }
  //   })
  // }

  const updateActivePhaseStatus = (phaseId: string | number, nextStatus: Phase["status"]) => {
    patchPhaseByIdEverywhere(phaseId, nextStatus)
  }

  const canArtisanSubmitPhase = (status: string) => {
    const s = normalizePhaseStatus(status)
    return s === "pending" || s === "in-progress"
  }

  const canEmployerResolvePhase = (status: string) => {
    const s = normalizePhaseStatus(status)
    return s === "submitted" || s === "approved"
  }

  const getPhaseStatusColor = (status: string) => {
    const s = normalizePhaseStatus(status)

    switch (s) {
      case "paid":
      case "released":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "submitted":
        return "bg-purple-100 text-purple-800"
      case "partial-release":
        return "bg-amber-100 text-amber-800"
      case "refunded":
      case "cancelled":
      case "declined":
        return "bg-red-100 text-red-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPhaseStatusIcon = (status: string) => {
    const s = normalizePhaseStatus(status)

    switch (s) {
      case "paid":
      case "released":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "submitted":
        return <Package className="h-4 w-4 text-purple-600" />
      case "partial-release":
        return <DollarSign className="h-4 w-4 text-amber-600" />
      case "refunded":
      case "cancelled":
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "pending":
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const normalizeContractStatus = (raw: any): Contract["status"] => {
  const v = String(raw || "").toLowerCase();

  if (v === "in_review" || v === "in-review" || v === "review") return "in_review";
  if (v === "draft") return "draft";
  if (v === "accepted" || v === "active") return "accepted"; // ACTIVE maps to Accepted badge in UI
  if (v === "cancelled" || v === "canceled" || v === "declined") return "cancelled";
  if (v === "completed") return "completed";

  // safe fallback
    return "in_review";
  };

  // Normalize participant objects that might be:
  // - a User
  // - a ChatParticipant row containing participantUser/user/User
  // - a ChatParticipant row containing user_id/userId
  function normalizeUser(p: any): { id: string; name: string; email: string; avatar_url: string | null } | null {
    if (!p) return null

    // try common nested shapes first
    const u = p.participantUser || p.user || p.User || p

    const id = u?.id ?? p?.user_id ?? p?.userId ?? p?.id
    if (!id) return null

    return {
      id: String(id),
      name: u?.name || u?.userName || u?.username || "User",
      email: u?.email || "",
      avatar_url: u?.avatar_url || u?.ArtisanProfile?.profile_image || u?.artisanProfile?.profile_image || null,
    }
  }
    
  // PATCH 1: robust "other participant" selection
  function getOtherParticipant(participants: any[], meId: string) {
    if (!Array.isArray(participants)) return null

    const me = String(meId)

    const unique = participants.filter(
      (p, idx, arr) => p && arr.findIndex((x: any) => String(x.id) === String(p.id)) === idx
    )

    const others = unique.filter((p: any) => String(p.id) !== me)

    return others.length ? others[0] : null
  }

  // Sort conversations so the most recently active one is always first.
  function sortByRecentMessage(convs: Conversation[]): Conversation[] {
    return [...convs].sort((a, b) => {
      const ta = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
      const tb = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
      return tb - ta
    })
  }

  // PATCH 3: guard null other participant and filter out bad rooms
  function mapRoomsToConversations(rooms: any[]): Conversation[] {
    if (!currentUserId) return []

    const mapped = (rooms || [])
      .map((room) => {
        // IMPORTANT: artisan may receive participantLinks instead of participants
        const rawParticipants =
          room.participants ||
          room.participantLinks ||
          room.participant_links ||
          room.ChatParticipants ||
          []

        const normalizedParticipants = rawParticipants.map(normalizeUser).filter(Boolean) as any[]

        console.log("[Messaging] room", room.id, {
          me: String(currentUserId),
          rawParticipants: rawParticipants,
          normalizedParticipants,
        })

        const other = getOtherParticipant(normalizedParticipants, String(currentUserId))
        if (!other) {
          console.warn("[Messaging] Room missing other participant; skipping:", room?.id)
          return null
        }

        const lastMessageRaw = room.lastMessage || null

        const lastMessage: ConversationLastMessage | null = lastMessageRaw
          ? {
              text: lastMessageRaw.message,
              timestamp: lastMessageRaw.createdAt || lastMessageRaw.created_at,
              isRead: true,
              sender:
                String(lastMessageRaw.senderId ?? lastMessageRaw.sender_id) === String(currentUserId) ? "me" : "them",
              type: lastMessageRaw.type,
            }
          : null

        return {
          id: String(room.id),
          participant: {
            id: String(other.id),
            name: other.name,
            email: other.email,
            avatar: other.avatar_url || null,
            service: null,
            isOnline: false,
            lastSeen: "",
          },
          lastMessage,
          unreadCount: room.unreadCount || 0,
          hasActiveContract: false,
        } as Conversation
      })
      .filter(Boolean) as Conversation[]

    return sortByRecentMessage(mapped)
  }

  function mapMessages(apiMessages: any[]): Message[] {
    if (!currentUserId) return []
    const me = String(currentUserId)

    console.log(
    "[Messaging][debug] raw contract messages",
    (apiMessages || [])
      .filter((m) => m?.type === "contract")
      .map((m) => ({
        messageId: m.id,
        contractId: m?.contract_data?.id ?? m?.contract_data?.contractId,
        phases: (m?.contract_data?.phases || []).map((p: any) => ({
          id: p?.id,
          name: p?.name,
          status: p?.status,
          amount: p?.amount,
        })),
      }))
    )

    return (apiMessages || []).map((m) => ({
      id: m.id,
      text: m.message,
      timestamp: m.createdAt || m.created_at,
      sender: String(m.sender_id) === me ? "me" : "them",
      status: "read",
      type: (m.type as any) || "text",
      contract:
      m.type === "contract"
        ? {
            ...m.contract_data,
            id: m.contract_data.id ?? m.contract_data.contractId,
            status: normalizeContractStatus(m.contract_data?.status ?? m.contract_data?.contractStatus),
          }
        : undefined,
      isEdited: m.is_edited === true,
      phaseUpdate: m.type === "phase-update" ? m.phase_update_data : undefined,
      paymentPrompt: m.type === "payment-prompt" ? m.payment_prompt_data : undefined,
      attachments:
        m.type === "file"
          ? [
              {
                type: m.file_mime_type || m.file_resource_type || "file",
                url: m.file_url || "",
                name: m.file_original_name || m.message || "Attachment",
              },
            ].filter((file) => Boolean(file.url))
          : undefined,
    }))
  }

  // Helper to initiate / reuse a 1-to-1 chat with a user
  const initiateChatWith = async (opts: {
    targetUserId?: string | null
    targetEmail?: string | null
    displayName?: string | null
  }): Promise<string | null> => {
    const { targetUserId, targetEmail, displayName } = opts

    if (!currentUserId) {
      console.warn("[Messaging] initiateChatWith: missing auth/currentUserId, aborting")
      return null
    }

    if (!targetUserId && !targetEmail) {
      console.warn("[Messaging] initiateChatWith: no target userId/email, aborting")
      return null
    }

    try {
      const res = await fetch(`${API_BASE}/chat/initiate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          //Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          userId: targetUserId ?? undefined,
          email: targetEmail ?? undefined,
        }),
      })

      if (!res.ok) {
        console.error("[Messaging] initiateChatWith failed. Status:", res.status)
        return null
      }

      const room = await res.json()
      if (!room?.id) {
        console.error("[Messaging] initiateChatWith: backend returned no room.id, aborting")
        return null
      }

      const roomId = room.id as string

      // IMPORTANT: update ref immediately so socket handlers know the active room
      selectedRoomIdRef.current = roomId

      // Normalize participants before selecting "other"
      const rawParts = room.participants || room.participantLinks || room.participant_links || []
      const normalizedParts = (rawParts as any[])
        .map(normalizeUser)
        .filter(Boolean) as { id: string; name: string; email: string }[]

      const otherRaw =
        normalizedParts.find((p) => p?.id && String(p.id) !== String(currentUserId)) || null

      const participant: ConversationParticipant = {
        id: otherRaw?.id || targetUserId || "",
        name: otherRaw?.name || displayName || "User",
        email: otherRaw?.email || targetEmail || "",
        avatar: null,
        service: null,
        isOnline: false,
        lastSeen: "",
      }

      const newConv: Conversation = {
        id: roomId,
        participant,
        lastMessage: null,
        unreadCount: 0,
      }

      let conversationToSelect: Conversation = newConv

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === roomId)
        if (existing) {
          conversationToSelect = existing
          return prev
        }
        return [newConv, ...prev]
      })

      setSelectedConversation(conversationToSelect)
      setShowConversationList(false)

      const msgs = await listChatMessages(roomId)
      setMessages(mapMessages(msgs as any[]))

      // join room for realtime
      socketRef.current?.emit("chat:leave-all")
      socketRef.current?.emit("chat:join", { roomId })

      return roomId
    } catch (err) {
      console.error("[Messaging] initiateChatWith error:", err)
      return null
    }
  }

  // Load chat rooms on mount
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const rooms = await listChatRooms()
        if (cancelled) return
        const mapped = mapRoomsToConversations(rooms as any[])
        setConversations(mapped)
        setRoomsLoaded(true)
        if (mapped.length && !selectedConversation) setSelectedConversation(mapped[0])

        // FIX: removed the line that hid conversation list when empty
        // if (mapped.length === 0) setShowConversationList(false)
      } catch (err) {
        console.error("Failed to load chat rooms", err)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Paid for Active Contracts
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!activeContract?.id) {
        setContractTxReleasedTotal(0)
        setContractTxDepositPaid(0)
        return
      }

      try {
        setContractTxLoading(true)

        const txs = await listContractTransactions(String(activeContract.id))
        if (cancelled) return

        const { depositTotal, releaseTotal } = calcTxTotals(txs)
        setContractTxDepositPaid(depositTotal)
        setContractTxReleasedTotal(releaseTotal)
      } catch (err) {
        console.error("[JobSummary] Failed to load contract transactions:", err)
        if (!cancelled) {
          setContractTxReleasedTotal(0)
          setContractTxDepositPaid(0)
        }
      } finally {
        if (!cancelled) setContractTxLoading(false)
      }
      })()

    return () => {
      cancelled = true
    }
  }, [activeContract?.id])


useEffect(() => {
  if (!activeContract) return

  console.log("[Messaging][debug] activeContract selected", {
    contractId: activeContract.id,
    contractStatus: activeContract.status,
    phases: activeContract.phases?.map((phase) => ({
      id: phase.id,
      name: phase.name,
      status: phase.status,
      normalizedStatus: normalizePhaseStatus(phase.status),
      amount: phase.amount,
    })),
  })
}, [activeContract])


  // Track current room id in a ref for socket listener
useEffect(() => {
    selectedRoomIdRef.current = selectedConversation?.id || null
  }, [selectedConversation?.id])

  // Connect socket.io once using singleton
useEffect(() => {
    if (!auth?.token || !currentUserId) return
    if (socketRef.current) return

    const socket = getSocket(auth.token)
    socketRef.current = socket

    const handleConnect = () => {
      console.log("Socket connected/reconnected", socket.id)
      // Rejoin the current room on reconnect so broadcasts still reach this socket
      const currentRoomId = selectedRoomIdRef.current
      if (currentRoomId) {
        socket.emit("chat:join", { roomId: currentRoomId })
      }
    }
    socket.on("connect", handleConnect)
    socket.on("disconnect", () => console.log("Socket disconnected"))

    const handleChatNewMessage = (payload: {
      id: string
      room_id: string
      sender_id: string
      message: string
      created_at: string
      type?: string
      contract?: Contract
      file_url?: string | null
      file_original_name?: string | null
      file_mime_type?: string | null
      file_resource_type?: string | null
      file_size?: number | null
      contractStatus?: {
        contractId: string
        status: Contract["status"]
      }
    }) => {
      // Handle contract status broadcasts
      if (payload.type === "contract-status" && payload.contractStatus) {
        const { contractId } = payload.contractStatus
        const status = normalizeContractStatus(payload.contractStatus.status)

        setMessages((prev) =>
          prev.map((m) => {
            if (m.type !== "contract" || !m.contract) return m
            if (String(m.contract.id) !== String(contractId)) return m
            return { ...m, contract: { ...m.contract, status } }
          }),
        )

        if (status === "accepted") {
          setActiveContract((prev) => {
            if (prev) return prev
            const found = messages.find(
              (m) => m.type === "contract" && String(m.contract?.id) === String(contractId)
            )
            return found?.contract || prev
          })
        }

        setActiveContract((prev) => {
          if (!prev) return prev
          if (String(prev.id) !== String(contractId)) return prev
          return { ...prev, status }
        })

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== payload.room_id) return conv
            const previewText =
              status === "accepted" ? "Contract accepted"
              : status === "in_review" ? "Contract updated"
              : status === "cancelled" ? "Contract declined"
              : "Contract status changed"
            return {
              ...conv,
              lastMessage: {
                text: previewText,
                timestamp: payload.created_at,
                isRead: true,
                sender: payload.sender_id === currentUserId ? "me" : "them",
                type: "contract",
              },
            }
          }),
        )

        return
      }

      const currentRoomId = selectedRoomIdRef.current
      const msgType = (payload.type as Message["type"]) || "text"

      if (msgType === "system") {
        applySystemMilestoneUpdate(payload.message)
        if (payload.room_id === selectedRoomIdRef.current && activeContract?.id) {
          refreshActiveContractState(activeContract.id)
        }
      }

      if (currentRoomId && payload.room_id === currentRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev
          const mapped: Message = {
            id: payload.id,
            text: payload.message,
            timestamp: payload.created_at,
            sender: payload.sender_id === currentUserId ? "me" : "them",
            status: "delivered",
            type: msgType,
            contract: msgType === "contract" ? payload.contract : undefined,
            attachments:
              msgType === "file"
                ? [
                    {
                      type: payload.file_mime_type || payload.file_resource_type || "file",
                      url: payload.file_url || "",
                      name: payload.file_original_name || payload.message || "Attachment",
                    },
                  ].filter((file) => Boolean(file.url))
                : undefined,
          }
          // Replace matching temp message with the real one; otherwise append
          const tempIndex = prev.findIndex(
            (m) => m.id.toString().startsWith("temp-") && m.text === payload.message && m.sender === "me"
          )
          if (tempIndex !== -1) {
            const next = [...prev]
            next[tempIndex] = mapped
            return next
          }
          return [...prev, mapped]
        })
        setTimeout(() => scrollToBottom(), 50)
      }

      setConversations((prev) =>
        sortByRecentMessage(prev.map((conv) => {
          if (conv.id !== payload.room_id) return conv
          const isMe = payload.sender_id === currentUserId
          const isActive = currentRoomId === conv.id
          const previewText =
            msgType === "contract" ? "Contract Proposal"
            : msgType === "payment-prompt" ? "Payment Request"
            : msgType === "phase-update" ? "Phase Update"
            : msgType === "file" ? "File attachment"
            : payload.message
          return {
            ...conv,
            lastMessage: {
              text: previewText,
              timestamp: payload.created_at,
              isRead: isMe || isActive,
              sender: (isMe ? "me" : "them") as "me" | "them",
              type: msgType,
            },
            unreadCount: !isMe && !isActive ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
          }
        }))
      )
    }

    const handleChatRead = ({ roomId }: { roomId: string; readerId?: string }) => {
      const currentRoomId = selectedRoomIdRef.current
      if (roomId !== currentRoomId) return
      setMessages((prev) => prev.map((m) => (m.sender === "me" ? { ...m, status: "read" } : m)))
    }

    const handleConnectError = (err: Error) => {
      console.error("[Socket] connect_error:", err.message)
    }

    const handleChatError = (msg: string) => {
      console.error("[Socket] chat:error:", msg)
    }

    const handleError = (msg: string) => {
      console.error("[Socket] error:", msg)
    }

    const handleMessageEdited = (payload: { id: string; message: string; is_edited: boolean }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(payload.id)
            ? { ...m, text: payload.message, isEdited: true }
            : m
        )
      )
    }

    const handleMessageRequestNew = () => {
      if (currentUserRole === "employer") {
        getIncomingMessageRequests()
          .then((reqs) => setPendingRequests(reqs))
          .catch(() => {})
      }
    }

    socket.on("chat:new-message", handleChatNewMessage)
    socket.on("chat:read", handleChatRead)
    socket.on("chat:message-edited", handleMessageEdited)
    socket.on("connect_error", handleConnectError)
    socket.on("chat:error", handleChatError)
    socket.on("error", handleError)
    socket.on("message_request:new", handleMessageRequestNew)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("chat:new-message", handleChatNewMessage)
      socket.off("chat:read", handleChatRead)
      socket.off("chat:message-edited", handleMessageEdited)
      socket.off("connect_error", handleConnectError)
      socket.off("chat:error", handleChatError)
      socket.off("error", handleError)
      socket.off("message_request:new", handleMessageRequestNew)
    }
  }, [auth?.token, currentUserId])

  // Broadcast total unread count to the header badge whenever conversations update
  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
    window.dispatchEvent(new CustomEvent("brikcell:unread-total", { detail: { total } }))
  }, [conversations])

  // PATCH 2: prevent re-creating chat rooms on refresh (only initiate if no existing conversation with that user)
  useEffect(() => {
    if (!incomingArtisanId || !currentUserId) return
    if (incomingArtisanId === currentUserId) return
    if (!roomsLoaded) return

    const alreadyExists = conversations.some((c) => c.participant.id === incomingArtisanId)
    if (alreadyExists) return

    initiateChatWith({
      targetUserId: incomingArtisanId,
      targetEmail: incomingArtisanEmail,
      displayName: incomingArtisanName || "User",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingArtisanId, conversations.length, currentUserId])

  // Load pending message requests for employer on mount
  useEffect(() => {
    if (currentUserRole !== "employer") return
    getIncomingMessageRequests()
      .then((reqs) => setPendingRequests(reqs))
      .catch(() => {})
  }, [currentUserRole])

  // Load messages whenever selected conversation changes
  useEffect(() => {
    if (!selectedConversation?.id) return
    if (!currentUserId) return

    // Clear previous contract state immediately so the job summary panel
    // never shows a stale contract from the prior conversation.
    setActiveContract(null)
    setActiveContractEscrowBalance(null)
    setContractTxReleasedTotal(0)
    setContractTxDepositPaid(0)

    let cancelled = false

    ;(async () => {
      try {
        const msgs = await listChatMessages(selectedConversation.id)
        if (cancelled) return

        const mapped = mapMessages(msgs as any[])
        setMessages(mapped)

        // Re-apply system milestone events after messages hydrate from backend
        for (const m of msgs as any[]) {
          if (m?.type === "system") {
            applySystemMilestoneUpdate(m.message)
          }
        }

        const latestContractMessage = [...mapped]
          .reverse()
          .find((m) => m.type === "contract" && m.contract?.id)

        if (latestContractMessage?.contract?.id) {
          await refreshActiveContractState(latestContractMessage.contract.id)
        }

        if (socketRef.current) {
          socketRef.current.emit("chat:leave-all")
          socketRef.current.emit("chat:join", { roomId: selectedConversation.id })
        }

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  unreadCount: 0,
                  lastMessage: conv.lastMessage ? { ...conv.lastMessage, isRead: true } : conv.lastMessage,
                }
              : conv,
          ),
        )

        socketRef.current?.emit("chat:read", { roomId: selectedConversation.id })
        markChatRoomRead(selectedConversation.id).catch(() => {})
        setTimeout(() => scrollToBottom(), 50)
      } catch (err) {
        console.error("Failed to load messages for room", selectedConversation.id, err)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id])

  const sendMessageHandler = async () => {
    const text = newMessage.trim()
    if (!text) return

    if (!socketRef.current) {
      console.warn("[Messaging] No socket, cannot send via socket")
      return
    }

    setNewMessage("")

    try {
      let roomId: string | undefined = selectedConversation?.id

      if (!roomId) {
        const initiatedRoomId = await initiateChatWith({
          targetUserId: incomingArtisanId,
          targetEmail: incomingArtisanEmail,
          displayName: incomingArtisanName || "User",
        })

        if (!initiatedRoomId) {
          console.warn("[Messaging] Could not initiate chat room from URL params")
          setNewMessage(text)
          return
        }

        roomId = initiatedRoomId
      }

      if (selectedFile) {
      setIsSendingFile(true)

      const fileToSend = selectedFile
      setSelectedFile(null)

      const created = await sendChatMessageWithFile(roomId, {
        message: text,
        file: fileToSend,
      })

      const fileMessage: Message = {
        id: created.id,
        text: created.message || fileToSend.name,
        timestamp: created.createdAt || created.created_at || new Date().toISOString(),
        sender: "me",
        status: "sent",
        type: "file",
        attachments: [
          {
            type:
              created.file_mime_type ||
              created.file_resource_type ||
              fileToSend.type ||
              "file",
            url: created.file_url || "",
            name: created.file_original_name || fileToSend.name,
          },
        ].filter((file) => Boolean(file.url)),
      }

      setMessages((prev) => [...prev, fileMessage])

      setConversations((prev) =>
        sortByRecentMessage(prev.map((conv) =>
          conv.id === roomId
            ? {
                ...conv,
                lastMessage: {
                  text: "File attachment",
                  timestamp: fileMessage.timestamp,
                  isRead: true,
                  sender: "me",
                  type: "file",
                },
              }
            : conv
        ))
      )

      setTimeout(() => scrollToBottom(), 50)
      return
    }

    if (!socketRef.current) {
      console.warn("[Messaging] No socket, cannot send via socket")
      setNewMessage(text)
      return
    }

      socketRef.current.emit("chatMessage", {
        roomId,
        message: text,
      })

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text,
        timestamp: new Date().toISOString(),
        sender: "me",
        status: "sent",
        type: "text",
      }

      setMessages((prev) => [...prev, tempMessage])
      setTimeout(() => scrollToBottom(), 50)
    } catch (err: any) {
      console.error("Failed to send message", err)
      toast.error(err?.message || "Failed to send message")

      if (text) setNewMessage(text)
    } finally {
      setIsSendingFile(false)
    }
  }

  const updateContractMessageInList = (contractId: string, nextStatus: Contract["status"]) => {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.type !== "contract" || !m.contract) return m
      // contract.id might be number in UI model; normalize
      if (String(m.contract.id) !== String(contractId)) return m
      return { ...m, contract: { ...m.contract, status: nextStatus } }
    }),
  )

  // Keep sidebar/job summary in sync if this is the active one
  setActiveContract((prev) => {
    if (!prev) return prev
    if (String(prev.id) !== String(contractId)) return prev
    return { ...prev, status: nextStatus }
    })
  }

  const handleAcceptContract = async (contract: Contract) => {
  const id = String(contract.id)
  try {
    setContractActionLoading(id)

    await acceptContract(id)

    // Update badge/UI only (no messaging/socket changes)
    updateContractMessageInList(id, "accepted")
    setActiveContract({ ...contract, status: "accepted" })

    // toast?.success?.("Contract accepted")
    console.log("Contract accepted:", id)
  } catch (err: any) {
    // toast?.error?.(err?.message || "Failed to accept contract")
    console.error("Failed to accept contract:", err)
  } finally {
    setContractActionLoading(null)
    }
  }

  const handleDeclineContract = async (contract: Contract) => {
    const id = String(contract.id)
    try {
      setContractActionLoading(id)

      await declineContract(id)

      //  You can pick your own status naming.
      // Your UI union doesn't include "declined", so we keep it non-breaking:
      // set to "draft" or "proposed" depending on your meaning.
      updateContractMessageInList(id, "draft")

      // toast?.success?.("Contract declined")
      console.log("Contract declined:", id)
    } catch (err: any) {
      // toast?.error?.(err?.message || "Failed to decline contract")
      console.error("Failed to decline contract:", err)
    } finally {
      setContractActionLoading(null)
    }
  }

  const handleAcceptMessageRequest = async (req: MessageRequestDTO) => {
    try {
      setRequestActionLoading(req.id)
      const result = await acceptMessageRequest(req.id)
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id))
      const newRoomId = result?.room?.id
      if (newRoomId) {
        const rooms = await listChatRooms()
        const mapped = mapRoomsToConversations(rooms as any[])
        setConversations(mapped)
        setRoomsLoaded(true)
        const target = mapped.find((c) => c.id === newRoomId)
        if (target) {
          setSelectedConversation(target)
          setShowConversationList(false)
        }
      }
      toast.success(`Started conversation with ${req.sender?.name || "artisan"}`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept request")
    } finally {
      setRequestActionLoading(null)
    }
  }

  const handleDeclineMessageRequest = async (req: MessageRequestDTO) => {
    try {
      setRequestActionLoading(req.id)
      await declineMessageRequest(req.id)
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id))
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline request")
    } finally {
      setRequestActionLoading(null)
    }
  }

  const handleRequestChanges = async (contract: Contract) => {
    const id = String(contract.id)
    try {
      setContractActionLoading(id)

      // optionally include a message later via modal
      await requestContractChanges(id, { message: "Please adjust the contract details." })

      // Keep status as proposed/pending in UI; just show feedback or keep same
      // If your backend sets status to something, you can map it here later.
      // For now, no breaking changes:
      updateContractMessageInList(id, contract.status)

      // toast?.success?.("Requested changes")
      console.log("Requested changes:", id)
    } catch (err: any) {
      // toast?.error?.(err?.message || "Failed to request changes")
      console.error("Failed to request changes:", err)
    } finally {
      setContractActionLoading(null)
    }
  }


  // const handleSubmitPhase = async (phaseId: string | number) => {
  //   try {
  //     setMilestoneActionLoading(String(phaseId))

  //     const res = await submitMilestone(String(phaseId))
  //     const next = normalizePhaseStatus(res?.milestone?.status || "SUBMITTED")

  //     updateActivePhaseStatus(phaseId, next)
  //     toast.success("Milestone submitted for review")
  //   } catch (err: any) {
  //     toast.error(err?.message || "Failed to submit milestone")
  //   } finally {
  //     setMilestoneActionLoading(null)
  //   }
  // }

  const handleFundMilestone = async (phaseId: string | number) => {
    try {
      setMilestoneActionLoading(String(phaseId))
      await fundMilestone(String(phaseId))
      toast.success("Milestone funded — advance payment released to artisan")
      await refreshActiveContractState(activeContract?.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund milestone")
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const handleSubmitPhase = async (phaseId: string | number) => {
    console.log("[Messaging][debug] submit clicked", {
      phaseId,
      phaseIdType: typeof phaseId,
      activeContractId: activeContract?.id,
      phases: activeContract?.phases?.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
      })),
    })

    try {
      setMilestoneActionLoading(String(phaseId))

      const res = await submitMilestone(String(phaseId))

      console.log("[Messaging][debug] submit response", res)

      const next = normalizePhaseStatus(res?.milestone?.status || "SUBMITTED")

      updateActivePhaseStatus(phaseId, next)
  
      toast.success("Milestone submitted for review")

      await refreshActiveContractState(activeContract?.id)

    } catch (err: any) {
      console.error("[Messaging][debug] submit failed", err)
      const errMsg = String(err?.message || "").toLowerCase()
      const contractAccepted = ["accepted", "active"].includes(
        String(activeContract?.status || "").toLowerCase()
      )
      // "Milestone not ready to submit" (400) when contract not yet accepted,
      // or any explicit 409 "not accept-able" variant
      const isContractGate =
        !contractAccepted ||
        err?.status === 409 ||
        errMsg.includes("not ready") ||
        errMsg.includes("not accept")
      if (isContractGate) {
        toast.error(
          "This contract must be accepted by both parties before a milestone can be submitted. Ask the client to accept the contract first.",
          { duration: 6000 }
        )
      } else {
        toast.error(err?.message || "Failed to submit milestone")
      }
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const handleReleasePhase = async (phaseId: string | number) => {
    // If deposit < total, verify the escrow has enough to cover the final payout
    if (activeContract) {
      const ph = activeContract.phases.find((p) => String(p.id) === String(phaseId))
      if (ph?.initial_release_done) {
        const totalAmt   = Number(activeContract.totalAmount  ?? 0)
        const depositAmt = Number(activeContract.depositAmount ?? 0)
        const fundingGap = Math.max(0, totalAmt - depositAmt)
        if (fundingGap > 0) {
          const escrowBal = activeContractEscrowBalance !== null
            ? activeContractEscrowBalance
            : Math.max(0, depositAmt - contractTxReleasedTotal)
          const finalDue = Number(ph.labour_cost ?? 0) * 0.9
          if (escrowBal < finalDue) {
            const shortfall = Math.ceil(finalDue - escrowBal)
            toast.error(
              `Insufficient escrow balance. Transfer ₦${shortfall.toLocaleString()} from your wallet to escrow first.`,
              { duration: 8000 }
            )
            return
          }
        }
      }
    }

    try {
      setMilestoneActionLoading(String(phaseId))

      const res = await releaseMilestone(String(phaseId))
      const next = normalizePhaseStatus(res?.milestone?.status || "RELEASED")

      patchPhaseByIdEverywhere(phaseId, next)

      toast.success("Milestone released successfully")

      await refreshActiveContractState(activeContract?.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to release milestone")
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const handlePartialReleasePhase = async (phaseId: string | number, totalAmount: number) => {
    const key = String(phaseId)
    const rawValue = partialReleaseAmount[key]
    const amount = Number(rawValue)

    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(totalAmount)) {
      toast.error("Enter a valid amount")
      return
    }

    try {
      setMilestoneActionLoading(key)

      const res = await partialReleaseMilestone(key, amount)
      const next = normalizePhaseStatus(res?.milestone?.status || "PARTIAL_RELEASED")

      patchPhaseByIdEverywhere(phaseId, next)
      setPartialReleaseOpenFor(null)
      setPartialReleaseAmount((prev) => ({ ...prev, [key]: "" }))

      toast.success("Partial release completed")

      await refreshActiveContractState(activeContract?.id)

    } catch (err: any) {
      toast.error(err?.message || "Failed to partially release milestone")
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const handleTopupEscrow = async (contractId: string | number, amount: number) => {
    try {
      setEscrowTopupLoading(true)
      const res = await topupContractEscrow(String(contractId), amount)
      setActiveContractEscrowBalance(res.escrowBalance)
      toast.success(`₦${amount.toLocaleString()} transferred to escrow successfully`)
      await refreshActiveContractState(contractId)
    } catch (err: any) {
      toast.error(err?.message || "Failed to transfer funds to escrow")
    } finally {
      setEscrowTopupLoading(false)
    }
  }

  const handleRefundPhase = async (phaseId: string | number) => {
    try {
      setMilestoneActionLoading(String(phaseId))

      const res = await refundMilestone(String(phaseId))
      const next = normalizePhaseStatus(res?.milestone?.status || "REFUNDED")

      patchPhaseByIdEverywhere(phaseId, next)

      toast.success("Milestone refunded successfully")

      await refreshActiveContractState(activeContract?.id)
    } catch (err: any) {
      toast.error(err?.message || "Failed to refund milestone")
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const calculateProgress = () => {
    if (!activeContract || !activeContract.phases.length) return 0

    const totalWeight = activeContract.phases.length * 100

    const achieved = activeContract.phases.reduce((sum, phase) => {
      const s = normalizePhaseStatus(phase.status)

      if (s === "released" || s === "paid" || s === "refunded" || s === "cancelled") {
        return sum + 100
      }

      if (s === "partial-release") {
        return sum + 50
      }

      if (s === "submitted" || s === "approved") {
        return sum + 75
      }

      if (s === "in-progress") {
        return sum + 25
      }

      return sum
    }, 0)

    return (achieved / totalWeight) * 100
  }

  const calculateTotalPaid = () => {
    if (!activeContract) return 0
    return activeContract.phases
      .filter((p) => {
        const s = normalizePhaseStatus(p.status)
        return s === "paid" || s === "released" || s === "partial-release"
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }

  function downloadContractPDF(contract: Contract) {
    const isCompleted = allPhasesReleased || contract.status === "completed"

    const statusLabel =
      isCompleted ? "Completed"
      : contract.status === "accepted" ? "Active"
      : contract.status === "in_review" ? "Pending"
      : contract.status === "draft" ? "Draft"
      : contract.status

    // Amounts for the document — use live payment state when available
    const docTotalPaid    = isCompleted ? totalContract : depositPaidAmount
    const docTotalContract = totalContract || Number(contract.totalAmount)

    const createdDate = contract.createdAt
      ? new Date(contract.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "—"

    const acceptedDate = contract.acceptedAt
      ? new Date(contract.acceptedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : null

    const myName = auth?.user?.name || "—"
    const otherName = selectedConversation?.participant?.name || "—"
    const employerName = currentUserRole === "employer" ? myName : otherName
    const artisanName  = currentUserRole === "artisan"  ? myName : otherName

    const phasesHTML = contract.phases.map((phase, i) => {
      const labourCost   = Number(phase.labour_cost || phase.amount || 0)
      const materialCost = Number(phase.material_cost || 0)
      const initialPct   = 10
      const phase1Advance = Math.round((materialCost + labourCost * initialPct / 100) * 100) / 100
      const phase2Final   = Math.round((labourCost * (100 - initialPct) / 100) * 100) / 100
      const phaseStatus   = String(phase.status || "").toLowerCase()
      const phaseReleased = ["released", "paid", "approved"].includes(phaseStatus)

      const paymentBreakdown = isCompleted && contract.payment_mode === "MILESTONE" ? `
        <div class="phase-payment">
          <span class="pay-row"><span class="pay-lbl">Phase 1 — Advance (materials + 10% labour):</span> <span class="pay-val">₦${phase1Advance.toLocaleString()}</span></span>
          <span class="pay-row"><span class="pay-lbl">Phase 2 — Final release (90% labour):</span> <span class="pay-val">₦${phase2Final.toLocaleString()}</span></span>
        </div>
      ` : ""

      return `
      <div class="phase">
        <div class="phase-header">
          <span class="phase-title">Phase ${i + 1}: ${phase.name}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="phase-amount">₦${Number(phase.amount).toLocaleString()}</span>
            ${phaseReleased ? `<span class="phase-paid-badge">✓ Paid</span>` : ""}
          </div>
        </div>
        ${phase.description ? `<p class="phase-desc">${phase.description}</p>` : ""}
        ${phase.deliverables?.length ? `
          <ul class="deliverables">
            ${phase.deliverables.map((d: string) => `<li>${d}</li>`).join("")}
          </ul>
        ` : ""}
        ${paymentBreakdown}
      </div>
    `}).join("")

    const materialsHTML = contract.materials?.length ? `
      <section>
        <h3>Materials &amp; Tools</h3>
        <table>
          <thead><tr><th>Item</th><th>Cost</th><th>Covered By</th></tr></thead>
          <tbody>
            ${contract.materials.map((m) => `
              <tr>
                <td>${m.name}</td>
                <td>₦${Number(m.cost).toLocaleString()}</td>
                <td>${m.coveredBy === "client" ? "Client" : "Artisan"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    ` : ""

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Contract — ${contract.title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      padding: 48px 56px;
      max-width: 820px;
      margin: 0 auto;
    }
    /* header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #7c3aed;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand { font-size: 22px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
    .doc-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      background: ${isCompleted ? "#d1fae5" : contract.status === "draft" ? "#e5e7eb" : "#fef3c7"};
      color: ${isCompleted ? "#065f46" : contract.status === "draft" ? "#374151" : "#92400e"};
    }
    .payment-complete-banner {
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 16px 0;
      font-size: 13px;
      font-weight: 600;
      color: #065f46;
    }
    .phase-paid-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: #065f46;
      background: #d1fae5;
      border-radius: 999px;
      padding: 1px 7px;
    }
    .phase-payment {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .pay-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .pay-lbl { color: #6b7280; }
    .pay-val { font-weight: 600; color: #374151; }
    /* meta row */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      margin-bottom: 24px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 12px;
    }
    .meta-grid .label { color: #6b7280; margin-bottom: 2px; }
    .meta-grid .value { font-weight: 600; }
    /* sections */
    h2 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    h3 { font-size: 13px; font-weight: 700; color: #374151; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    p { line-height: 1.6; color: #374151; }
    section { margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
    /* amounts */
    .amounts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 16px 0;
    }
    .amount-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
    }
    .amount-box .lbl { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .amount-box .val { font-size: 20px; font-weight: 800; color: #7c3aed; }
    /* phases */
    .phase {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .phase-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    .phase-title { font-weight: 600; font-size: 13px; }
    .phase-amount { font-weight: 700; color: #7c3aed; white-space: nowrap; margin-left: 12px; }
    .phase-desc { font-size: 12px; color: #6b7280; margin: 4px 0 6px; }
    .deliverables { padding-left: 18px; margin-top: 6px; }
    .deliverables li { font-size: 12px; color: #374151; margin-bottom: 3px; }
    /* materials table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 6px 10px; background: #f3f4f6; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
    /* escrow note */
    .escrow-note {
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 12px;
      color: #1e40af;
      margin-top: 20px;
    }
    /* signatures */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 36px;
      page-break-inside: avoid;
    }
    .sig-box {
      border-top: 1px solid #6b7280;
      padding-top: 8px;
      font-size: 11px;
      color: #6b7280;
    }
    .sig-name {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    /* print */
    @media print {
      body { padding: 32px 40px; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand">Brikcell</div>
      <div class="doc-label">Contract Agreement</div>
    </div>
    <span class="status-badge">${statusLabel}</span>
  </div>

  <div class="meta-grid">
    <div><div class="label">Date Issued</div><div class="value">${createdDate}</div></div>
    ${acceptedDate ? `<div><div class="label">Date Accepted</div><div class="value">${acceptedDate}</div></div>` : "<div></div>"}
    <div><div class="label">Contract ID</div><div class="value">#${contract.id}</div></div>
    <div><div class="label">Payment Mode</div><div class="value">${contract.payment_mode ?? "MILESTONE"}</div></div>
  </div>

  <section>
    <h2>${contract.title}</h2>
    <p>${contract.description || ""}</p>
  </section>

  ${isCompleted ? `
  <div class="payment-complete-banner">
    <span style="font-size:18px;">✅</span>
    <span>Payment Complete — Full contract amount of ₦${docTotalContract.toLocaleString()} settled in full</span>
  </div>
  ` : ""}

  <div class="amounts">
    <div class="amount-box">
      <div class="lbl">Total Contract Value</div>
      <div class="val">₦${docTotalContract.toLocaleString()}</div>
    </div>
    <div class="amount-box" style="${isCompleted ? "border-color:#6ee7b7;background:#f0fdf4;" : ""}">
      <div class="lbl">${isCompleted ? "Total Paid" : "Initial Deposit"}</div>
      <div class="val" style="${isCompleted ? "color:#059669;" : ""}">₦${docTotalPaid.toLocaleString()}</div>
    </div>
  </div>

  ${!isCompleted && Number(contract.depositAmount) > 0 ? `
  <div style="font-size:11px;color:#6b7280;margin-top:-8px;margin-bottom:16px;padding:0 2px;">
    Remaining ₦${Math.max(0, docTotalContract - docTotalPaid).toLocaleString()} released upon final approval.
  </div>
  ` : ""}

  <hr />

  <section>
    <h3>Project Phases (${contract.phases.length})</h3>
    ${phasesHTML}
  </section>

  ${materialsHTML}

  <div class="escrow-note">
    <strong>Escrow Protection:</strong> All payments are held securely in Brikcell escrow and released to the artisan
    only upon your explicit approval of each completed phase. This document serves as a legally binding agreement
    between both parties.
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-name">${employerName}</div>
      Client / Employer — Signature &amp; Date
    </div>
    <div class="sig-box">
      <div class="sig-name">${artisanName}</div>
      Artisan — Signature &amp; Date
    </div>
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Brikcell-Contract-${contract.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const ContractCard = ({ contract, sender }: { contract: Contract; sender: "me" | "them" }) => {
    const isAccepted = contract.status === "accepted"
    const isDraft = contract.status === "draft"
    const isInReview = contract.status === "in_review"

    return (
    <div className="max-w-2xl">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contract Proposal</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {"version" in contract && (
                <Badge variant="secondary" className="text-xs">
                  v{(contract as any).version}
                </Badge>
              )}
              <Badge
                className={
                  isAccepted
                    ? "bg-green-500"
                    : isDraft
                    ? "bg-gray-500"
                    : "bg-yellow-500"
                }
              >
                {isAccepted
                ? "Accepted"
                : isInReview
                ? "Pending"
                : isDraft
                ? "Draft"
                : contract.status}
              </Badge>
              <button
                onClick={() => downloadContractPDF(contract)}
                title="Download PDF"
                className="flex items-center gap-1 rounded-md border border-primary/30 bg-white px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{contract.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{contract.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₦{contract.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Deposit Required</p>
              <p className="text-2xl font-bold text-gray-900">₦{contract.depositAmount.toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Project Phases ({contract.phases.length})
            </h4>
            <div className="space-y-3">
              {contract.phases.map((phase, index) => (
                <div key={phase.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Phase {index + 1}: {phase.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                    </div>
                    <p className="font-semibold text-primary ml-3">₦{phase.amount.toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Deliverables:</p>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      {phase.deliverables.map((deliverable, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-3 w-3 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Wrench className="h-4 w-4 mr-2 text-primary" />
              Materials & Tools
            </h4>
            <div className="space-y-2">
              {contract.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${material.coveredBy === "client" ? "bg-blue-500" : "bg-green-500"}`}
                    />
                    <span>{material.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">₦{material.cost.toLocaleString()}</span>
                    <Badge variant="secondary" className="text-xs">
                      {material.coveredBy === "client" ? "You pay" : "Artisan pays"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-blue-900">Escrow Protection</h5>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Your payment is held securely in escrow. Funds are released to the artisan only after you approve each
                  phase.
                </p>
              </div>
            </div>
          </div>

          {/* EDIT & RESEND — ARTISAN ONLY */}
          {sender === "me" && contract.status === "in_review" && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                onClick={() => {
                  setShowContractModal(true)

                  // pass contract for editing
                  ;(window as any).__editingContract = contract
                }}
              >
                Edit & Resend Contract
              </Button>
            </div>
          )}

          {sender === "them" && contract.status === "in_review" && (
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => handleAcceptContract(contract)}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={contractActionLoading === String(contract.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {contractActionLoading === String(contract.id) ? "Processing..." : "Accept Contract"}
              </Button>

              <Button
                onClick={() => handleRequestChanges(contract)}
                variant="outline"
                className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                disabled={contractActionLoading === String(contract.id)}
              >
                Request Changes
              </Button>

              <Button
                onClick={() => handleDeclineContract(contract)}
                variant="outline"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                disabled={contractActionLoading === String(contract.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* EMPLOYER: CHECKOUT (before deposit) or FUND & ADVANCE PAY (after deposit) */}
          {sender === "them" && contract.status === "accepted" && (
            <div className="pt-2 space-y-2">
              {(() => {
                // depositFullyPaid is computed from real transactions in MessagingInterface.
                // initial_release_done on any phase is a fallback signal that checkout already ran
                // even before the tx list has loaded.
                const hasDepositBeenPaid =
                  depositFullyPaid || contract.phases.some((p) => p.initial_release_done)

                if (!hasDepositBeenPaid) {
                  return (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const payload = encodeURIComponent(JSON.stringify(contract))
                        router.push(`/checkout?contract=${payload}`)
                      }}
                    >
                      Proceed to Checkout
                    </Button>
                  )
                }

                // Deposit paid — render one "Fund & Advance Pay" button per unfunded milestone
                const unfunded = contract.phases.filter(
                  (p) => !p.initial_release_done && normalizePhaseStatus(p.status) === "in-progress"
                )
                if (unfunded.length === 0) return null

                return unfunded.map((phase) => {
                  const phaseIdx = contract.phases.findIndex(
                    (p) => String(p.id) === String(phase.id)
                  )
                  const isLoading = milestoneActionLoading === String(phase.id)
                  const phaseLabour = Number(phase.labour_cost || phase.amount || 0)
                  const phaseMaterial = Number(phase.material_cost || 0)
                  const phase1Need = Math.round((phaseMaterial + phaseLabour * 0.1) * 100) / 100
                  const escrowBal = activeContractEscrowBalance ?? 0
                  const escrowCoversPhase1 = activeContractEscrowBalance === null || escrowBal >= phase1Need
                  const phase1Shortfall = Math.max(0, Math.round((phase1Need - escrowBal) * 100) / 100)
                  const showFundBanner = activeContractEscrowBalance !== null && !escrowCoversPhase1
                  return (
                    <div key={phase.id} className="space-y-1.5">
                      {showFundBanner && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
                          <p className="text-xs text-amber-800 leading-snug">
                            <span className="font-semibold">Escrow underfunded: </span>
                            Escrow has ₦{escrowBal.toLocaleString()} but the advance payment needs
                            at least ₦{phase1Need.toLocaleString()} (materials + 10% labour).
                            Transfer ₦{phase1Shortfall.toLocaleString()} from your main wallet to proceed.
                          </p>
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={escrowTopupLoading}
                            onClick={() => handleTopupEscrow(contract.id, phase1Shortfall)}
                          >
                            {escrowTopupLoading
                              ? "Transferring..."
                              : `Transfer ₦${phase1Shortfall.toLocaleString()} From Main Balance`}
                          </Button>
                        </div>
                      )}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isLoading || showFundBanner}
                        onClick={() => handleFundMilestone(phase.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {isLoading
                          ? "Processing..."
                          : contract.phases.length > 1
                            ? `Fund & Advance Pay · Phase ${phaseIdx + 1}`
                            : "Fund & Advance Pay"}
                      </Button>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
  }

  const PhaseUpdateCard = ({
    phaseUpdate,
  }: {
    phaseUpdate: { phaseId: number; status: string; message: string }
    sender: "me" | "them"
  }) => {
    if (!activeContract) return null
    const phase = activeContract.phases.find((p) => p.id === phaseUpdate.phaseId)
    if (!phase) return null

    return (
      <div className="max-w-md">
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">{getPhaseStatusIcon(phaseUpdate.status)}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Phase Update: {phase.name}</h4>
                <p className="text-sm text-gray-700 mb-2">{phaseUpdate.message}</p>
                <Badge className={getPhaseStatusColor(phaseUpdate.status)}>
                  {getPhaseDisplayStatus(phaseUpdate.status, currentUserRole)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const PaymentPromptCard = ({ paymentPrompt }: { paymentPrompt: { phaseId: number; amount: number } }) => {
    if (!activeContract) return null
    const phase = activeContract.phases.find((p) => p.id === paymentPrompt.phaseId)
    if (!phase) return null

    return (
      <div className="max-w-md">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Payment Request</h4>
                <p className="text-sm text-gray-700 mb-3">
                  {phase.name} has been completed. Please review and approve the payment.
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-green-600">₦{paymentPrompt.amount.toLocaleString()}</span>
                </div>
                {phase.status === "delivered" && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleReleasePhase(paymentPrompt.phaseId)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Release
                    </Button>
                    <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600 bg-transparent">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSendContract = async (contract: any) => {
    const roomId = selectedConversation?.id
    if (!roomId) {
      console.error("No roomId found, cannot send contract.")
      return
    }

    try {
      const created = await sendContract(roomId, contract)

      // Optimistically insert the contract message using the server response so
      // the sender sees it immediately — same pattern as file messages.
      // When the socket broadcast arrives, the dedup check (m.id === created.id)
      // prevents a duplicate from being added.
      const contractData = created.contract_data || contract
      const optimisticMessage: Message = {
        id: created.id,
        text: "",
        timestamp: created.createdAt || created.created_at || new Date().toISOString(),
        sender: "me",
        status: "sent",
        type: "contract",
        contract: mapBackendContractToUI({
          ...contractData,
          id: contractData.id ?? created.id,
          status: contractData.status ?? "in_review",
          depositPaid: contractData.depositPaid ?? false,
        }),
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev
        return [...prev, optimisticMessage]
      })

      setConversations((prev) =>
        sortByRecentMessage(prev.map((conv) =>
          conv.id === roomId
            ? {
                ...conv,
                lastMessage: {
                  text: "Contract Proposal",
                  timestamp: optimisticMessage.timestamp,
                  isRead: true,
                  sender: "me",
                  type: "contract",
                },
              }
            : conv
        ))
      )

      setTimeout(() => scrollToBottom(), 50)
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.status === 409) {
        toast.error("There is already an active contract in this conversation.")
        return
      }
      toast.error(err?.message || "Failed to send contract proposal")
      console.error("Failed to send contract:", err)
    }
  }

  return (
    <div className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 bg-gray-50/30 min-h-[calc(100vh-4rem)]">
      <ContractCreationModal
        open={showContractModal}
        onOpenChange={setShowContractModal}
        onSendContract={handleSendContract}
        initialContract={typeof window !== "undefined" ? (window as any).__editingContract || null : null}
      />

      <BookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        currentUser={auth?.user}
        participant={
          selectedConversation
            ? {
                id: selectedConversation.participant.id,
                name: selectedConversation.participant.name,
                email:
                  selectedConversation.participant.email,
              }
            : null
        }
        contractCandidates={bookingContractCandidates}
        onSaved={(booking) => {
          console.log(
            "[Messaging] Booking saved:",
            booking.id
          )
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-7rem)] lg:h-[calc(100vh-9.5rem)]">
        {/* Conversations List - Left Panel */}
        <Card className={`lg:col-span-3 py-0 flex flex-col overflow-hidden border-gray-100/80 shadow-sm ${showConversationList ? "flex" : "hidden"} lg:flex`}>
          <CardHeader className="flex-shrink-0 pb-3 px-4 pt-5 border-b border-gray-50/80">
            <CardTitle className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-gray-900">Messages</span>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500 border-0">
                {conversations.length}
              </Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm bg-gray-50/80 border-gray-200/80 rounded-xl focus-visible:ring-primary/30"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea
              ref={scrollAreaRef}
              className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)]"
            >
              <div className="py-2">
                {/* Pending message requests — employer only */}
                {currentUserRole === "employer" && pendingRequests.length > 0 && (
                  <div className="mx-2 mb-3">
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Message Requests ({pendingRequests.length})
                    </p>
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="mb-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {req.sender?.name || "Artisan"}
                        </p>
                        {req.message && (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{req.message}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 flex-1 text-xs"
                            disabled={requestActionLoading === req.id}
                            onClick={() => handleAcceptMessageRequest(req)}
                          >
                            {requestActionLoading === req.id ? "..." : "Accept"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 text-xs"
                            disabled={requestActionLoading === req.id}
                            onClick={() => handleDeclineMessageRequest(req)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator className="mt-2 mb-1" />
                  </div>
                )}

                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      setShowConversationList(false)
                    }}
                    className={`cursor-pointer px-3 py-3 mx-2 rounded-xl transition-all mb-0.5 border-l-[3px] ${
                      selectedConversation?.id === conversation.id
                        ? "bg-primary/5 border-l-primary"
                        : "border-l-transparent hover:bg-gray-50/80"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className={`h-10 w-10 ${selectedConversation?.id === conversation.id ? "ring-2 ring-primary/20 ring-offset-1" : ""}`}>
                          <AvatarImage
                            src={conversation.participant.avatar || "/placeholder.svg"}
                            alt={conversation.participant.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {conversation.participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`text-sm truncate ${
                            selectedConversation?.id === conversation.id
                              ? "font-semibold text-gray-900"
                              : conversation.unreadCount > 0
                              ? "font-bold text-gray-900"
                              : "font-medium text-gray-800"
                          }`}>
                            {conversation.participant.name}
                          </h3>
                          <span className={`text-[11px] flex-shrink-0 ml-2 ${conversation.unreadCount > 0 ? "text-primary font-medium" : "text-gray-400"}`}>
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ""}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          {conversation.participant.service && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-gray-100/80 text-gray-500 border-0">
                              {conversation.participant.service}
                            </Badge>
                          )}
                          {conversation.hasActiveContract && (
                            <Badge className="text-[10px] py-0 px-1.5 h-4 bg-emerald-50 text-emerald-700 border-0">
                              <FileText className="h-2.5 w-2.5 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs line-clamp-1 ${conversation.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                          {getConversationPreview(conversation.lastMessage)}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <div className="mt-1 flex items-center justify-end">
                            <span className="h-5 min-w-[20px] px-1.5 bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="text-center py-10 px-4">
                    <p className="text-sm text-gray-400">No conversations yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* FIX: Chat Interface panel is ALWAYS rendered (no outer selectedConversation conditional) */}
        <Card
          className={`lg:col-span-6 flex flex-col py-0 overflow-hidden border-gray-100/80 shadow-sm ${
            showConversationList && conversations.length > 0 ? "hidden" : "flex"
          } lg:flex ${!showJobSummary ? "lg:col-span-9" : ""}`}
        >
          <CardHeader className="flex-shrink-0 pb-0 border-b border-gray-50/80 px-4 py-3.5">
            {selectedConversation ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 w-8 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600 rounded-lg"
                    onClick={() => setShowConversationList(true)}
                  >
                    ←
                  </Button>

                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={selectedConversation.participant.avatar || "/placeholder.svg"}
                        alt={selectedConversation.participant.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {selectedConversation.participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.participant.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{selectedConversation.participant.name}</h3>
                    <p className="text-xs truncate">
                      {selectedConversation.participant.isOnline
                        ? <span className="text-emerald-500 font-medium">Online</span>
                        : selectedConversation.participant.lastSeen
                        ? <span className="text-gray-400">Last seen {selectedConversation.participant.lastSeen}</span>
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                    onClick={() => setShowBookingModal(true)}
                    disabled={
                      !selectedConversation?.participant?.id ||
                      !["employer", "artisan"].includes(
                        String(currentUserRole)
                      )
                    }
                    title={
                      currentUserRole === "employer"
                        ? "Create or edit booking"
                        : "View or edit booking"
                    }
                  >
                    <Phone className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg lg:hidden"
                    onClick={() => setShowJobSummary(!showJobSummary)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BellOff className="h-4 w-4 mr-2" />
                        Mute Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Conversation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Flag className="h-4 w-4 mr-2" />
                        Report Issue
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Ban className="h-4 w-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900">Messages</h3>
                  <p className="text-xs text-gray-400">
                    {incomingArtisanName ? `Start a new chat with ${incomingArtisanName}` : "Start a new chat"}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
            <ScrollArea ref={messagesScrollRef} className="h-full">
              <div className="space-y-3 px-4 py-4">
                {selectedConversation ? (
                  <>
                    {/* FIX: restored message rendering logic */}
                    {messages.map((message) => {
                      const isMine = message.sender === "me"
                      const alignLeft = !isMine

                      const isEditing = editingMessageId === String(message.id)

                      return (
                        <div key={message.id} className={`flex ${alignLeft ? "justify-start" : "justify-end"}`}>
                          {/* TEXT */}
                          {message.type === "text" && (
                            <div className={`relative group max-w-[75%] sm:max-w-[65%] ${alignLeft ? "" : "flex flex-col items-end"}`}>
                              {isEditing ? (
                                <div className="w-full min-w-[220px]">
                                  <textarea
                                    autoFocus
                                    className="w-full rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/30 text-gray-900 text-sm px-4 py-2.5 resize-none outline-none focus:ring-2 focus:ring-primary/30"
                                    rows={Math.max(1, (editText.match(/\n/g) || []).length + 1)}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={async (e) => {
                                      if (e.key === "Escape") {
                                        setEditingMessageId(null)
                                        setEditText("")
                                      }
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        if (!editText.trim() || !selectedConversation) return
                                        try {
                                          await editChatMessage(selectedConversation.id, String(message.id), editText)
                                          setMessages((prev) =>
                                            prev.map((m) =>
                                              String(m.id) === String(message.id)
                                                ? { ...m, text: editText.trim(), isEdited: true }
                                                : m
                                            )
                                          )
                                        } catch { toast.error("Failed to edit message") }
                                        setEditingMessageId(null)
                                        setEditText("")
                                      }
                                    }}
                                  />
                                  <div className="flex items-center gap-2 mt-1.5 justify-end">
                                    <button
                                      className="text-[11px] text-gray-400 hover:text-gray-600"
                                      onClick={() => { setEditingMessageId(null); setEditText("") }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="text-[11px] font-medium text-primary hover:text-primary/80"
                                      onClick={async () => {
                                        if (!editText.trim() || !selectedConversation) return
                                        try {
                                          await editChatMessage(selectedConversation.id, String(message.id), editText)
                                          setMessages((prev) =>
                                            prev.map((m) =>
                                              String(m.id) === String(message.id)
                                                ? { ...m, text: editText.trim(), isEdited: true }
                                                : m
                                            )
                                          )
                                        } catch { toast.error("Failed to edit message") }
                                        setEditingMessageId(null)
                                        setEditText("")
                                      }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className={`px-4 py-2.5 shadow-sm ${
                                      alignLeft
                                        ? "bg-white border border-gray-100 rounded-2xl rounded-tl-sm text-gray-900"
                                        : "bg-primary text-white rounded-2xl rounded-tr-sm"
                                    }`}
                                  >
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text || ""}</div>
                                    <div className={`mt-1 flex items-center justify-end space-x-1.5 text-[10px] ${isMine ? "text-white/60" : "text-gray-400"}`}>
                                      {message.isEdited && <span className="italic">edited</span>}
                                      <span>{formatTime(message.timestamp)}</span>
                                      {isMine ? getMessageStatus(message.status) : null}
                                    </div>
                                  </div>
                                  {isMine && (
                                    <button
                                      className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                      title="Edit message"
                                      onClick={() => {
                                        setEditingMessageId(String(message.id))
                                        setEditText(message.text || "")
                                      }}
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* System */}
                          {message.type === "system" && (
                            <div className="w-full flex justify-center my-1">
                              <div className="text-[11px] text-gray-400 bg-gray-100/80 px-3.5 py-1 rounded-full">
                                {message.text}
                              </div>
                            </div>
                          )}

                          {/* FILE */}
                          {message.type === "file" && (
                            <div
                              className={`max-w-[75%] px-4 py-3 shadow-sm ${
                                alignLeft
                                  ? "bg-white border border-gray-100 rounded-2xl rounded-tl-sm"
                                  : "bg-primary/5 border border-primary/20 rounded-2xl rounded-tr-sm"
                              }`}
                            >
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Attachment</div>
                              <div className="space-y-2">
                                {(message.attachments || []).map((a, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3 bg-gray-50/80 rounded-lg px-3 py-2 border border-gray-100">
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium text-gray-900 truncate">{a.name}</div>
                                      <div className="text-[10px] text-gray-400 mt-0.5">{a.type}</div>
                                    </div>
                                    <a
                                      href={a.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex-shrink-0 inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 gap-1"
                                    >
                                      <Download className="h-3 w-3" />
                                      Save
                                    </a>
                                  </div>
                                ))}
                                {(message.attachments || []).length === 0 && (
                                  <div className="text-xs text-gray-400">No attachment data.</div>
                                )}
                              </div>
                              <div className={`mt-2 flex items-center justify-end space-x-1.5 text-[10px] ${isMine ? "text-primary/50" : "text-gray-400"}`}>
                                <span>{formatTime(message.timestamp)}</span>
                                {message.sender === "me" ? getMessageStatus(message.status) : null}
                              </div>
                            </div>
                          )}

                          {/* CONTRACT */}
                          {message.type === "contract" && message.contract && (
                            <div
                              onClick={() => {
                                if (message.contract) {
                                  console.log("[Messaging][debug] contract clicked", {
                                    contractId: message.contract.id,
                                    phases: message.contract.phases?.map((p) => ({
                                      id: p.id,
                                      name: p.name,
                                      status: p.status,
                                    })),
                                  })
                                  //setActiveContract(message.contract)
                                  setShowJobSummary(true)
                                  refreshActiveContractState(message.contract.id)
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <ContractCard contract={message.contract} sender={message.sender} />
                            </div>
                          )}

                          {/* PHASE UPDATE */}
                          {message.type === "phase-update" && message.phaseUpdate && (
                            <PhaseUpdateCard phaseUpdate={message.phaseUpdate} sender={message.sender} />
                          )}

                          {/* PAYMENT PROMPT */}
                          {message.type === "payment-prompt" && message.paymentPrompt && (
                            <PaymentPromptCard paymentPrompt={message.paymentPrompt} />
                          )}
                        </div>
                      )
                    })}

                    {messages.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-10">No messages yet. Start the conversation!</div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-400 text-center py-16">
                    No conversation selected. Use the box below to start messaging.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Composer ALWAYS visible */}
          <div className="flex-shrink-0 border-t border-gray-50/80 px-4 py-3 bg-white">
            {selectedFile && (
              <div className="mb-2.5 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setSelectedFile(file)
                  e.target.value = ""
                }}
              />
              {auth?.user?.role === "artisan" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 flex-shrink-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl"
                  onClick={() => setShowContractModal(true)}
                  title="Send Contract"
                  disabled={!selectedConversation?.id}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canType || isSendingFile || !selectedConversation?.id}
                title="Attach File">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canType || isSendingFile || !selectedConversation?.id}
                title="Attach Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Input
                placeholder={
                  selectedFile
                    ? "Add a message about this file..."
                    : selectedConversation?.id
                    ? "Type your message..."
                    : canStartFromUrl
                    ? "Type your message to start chat..."
                    : "Select a conversation to start messaging..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canType && sendMessageHandler()}
                className="h-9 text-sm bg-gray-50/80 border-gray-200/80 rounded-xl focus-visible:ring-primary/30"
                disabled={!canType}
              />

              <Button
                size="sm"
                onClick={sendMessageHandler}
                disabled={!canType || isSendingFile || (!newMessage.trim() && !selectedFile)}
                className="h-9 w-9 p-0 flex-shrink-0 bg-primary hover:bg-primary/90 rounded-xl shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Mobile backdrop — blurs the message body behind the Job Summary card */}
        {showJobSummary && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/10 backdrop-blur-[3px]"
            onClick={() => setShowJobSummary(false)}
          />
        )}

        {/* Job Summary Panel - Right Panel */}
        <Card
          className={`
            lg:col-span-3 lg:static lg:top-auto lg:left-auto
            lg:translate-x-0 lg:translate-y-0 lg:w-auto lg:max-h-none lg:z-auto
            flex flex-col py-0 overflow-hidden border-gray-100/80 shadow-sm
            ${showJobSummary
              ? "block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[72%] max-h-[85vh] overflow-hidden shadow-2xl"
              : "hidden lg:flex"
            }
          `}
        >
          <CardHeader className="flex-shrink-0 pb-3 border-b border-gray-50/80 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900">Job Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-7 w-7 p-0 text-gray-400 hover:text-gray-600 rounded-lg"
                onClick={() => setShowJobSummary(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(72vh-4rem)] lg:h-[calc(100vh-16rem)]">
              <div className="p-4 space-y-5">
                {!activeContract ? (
                  <div className="text-sm text-gray-500 text-center py-8">No contract details available for this conversation yet.</div>
                ) : (
                  <>
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Contract Status</h4>
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                          <span className="text-sm font-bold text-primary">{Math.round(calculateProgress())}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-1.5 mb-2.5" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {activeContract.phases.filter((p) => {
                              const s = normalizePhaseStatus(p.status)
                              return ["released", "paid", "partial-release", "refunded", "cancelled"].includes(s)
                            }).length} of {activeContract.phases.length}{" "}
                            phases completed
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Payment Summary</h4>
                      <div className="space-y-2.5 bg-gray-50/50 rounded-xl p-3.5 border border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total Contract</span>
                          <span className="font-semibold text-gray-900">₦{activeContract.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Deposit Paid</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              ₦{depositPaidAmount.toLocaleString()}
                            </span>
                            {depositFullyPaid && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                            {contractTxLoading && <span className="text-xs text-gray-400">…</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total Paid</span>
                            <span className="font-semibold text-emerald-600">
                              ₦{totalPaid.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2.5 border-t border-gray-100">
                          <span className="text-gray-500">Remaining</span>
                          <span className="font-semibold text-gray-900">
                            ₦{remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Project Phases</h4>
                      <div className="space-y-3">
                      {activeContract.phases.map((phase, index) => {
                        const rawStatus = normalizePhaseStatus(phase.status)
                        const displayStatus = getPhaseDisplayStatus(phase.status, currentUserRole)
                        const isLoading = milestoneActionLoading === String(phase.id)

                        console.log("[Messaging][debug] phase render", {
                          role: currentUserRole,
                          phaseId: phase.id,
                          phaseName: phase.name,
                          originalStatus: phase.status,
                          rawStatus,
                          displayStatus,
                          canArtisanSubmit: canArtisanSubmitPhase(rawStatus),
                          canEmployerResolve: canEmployerResolvePhase(rawStatus),
                        })

                        return (
                          <div key={phase.id} className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-1 mb-1.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Phase {index + 1}</span>
                                  <Badge className={`${getPhaseStatusColor(rawStatus)} text-[10px] py-0 px-1.5 h-4 border-0`}>
                                    {displayStatus}
                                  </Badge>
                                  {phase.initial_release_done && rawStatus === "in-progress" && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5 h-4 border-0">
                                      Advance Paid
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">{phase.name}</p>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {getPhaseStatusIcon(rawStatus)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Total Value</span>
                              <span className="font-semibold text-primary">
                                ₦{Number(phase.amount || 0).toLocaleString()}
                              </span>
                            </div>

                            {phase.initial_release_done && (() => {
                              const materialAmt  = Number(phase.material_cost || 0)
                              const labourAmt    = Number(phase.labour_cost || 0)
                              const advanceGross = materialAmt + labourAmt * 0.1
                              const pendingGross = labourAmt * 0.9
                              const isFullyPaid  = ["released", "paid"].includes(rawStatus)
                              return (
                                <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                      <CheckCircle className="h-3 w-3" />
                                      {currentUserRole === "artisan" ? "Advance Received" : "Advance Released"}
                                    </span>
                                    <span className="font-semibold text-emerald-700">
                                      ₦{advanceGross.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    {isFullyPaid ? (
                                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                        {currentUserRole === "artisan" ? "Final Payment Received" : "Final Payment Released"}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">Pending approval</span>
                                    )}
                                    <span className={`font-semibold ${isFullyPaid ? "text-emerald-700" : "text-gray-700"}`}>
                                      ₦{pendingGross.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              )
                            })()}

                            {phase.dueDate && (
                              <div className="flex items-center text-xs text-gray-400 mb-2">
                                <Clock className="h-3 w-3 mr-1.5" />
                                Due: {new Date(phase.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            {/* Employer: fund milestone when it's active but not yet funded */}
                            {currentUserRole === "employer" && rawStatus === "in-progress" && !phase.initial_release_done && (() => {
                              const p1Labour   = Number(phase.labour_cost || phase.amount || 0)
                              const p1Material = Number(phase.material_cost || 0)
                              const p1Need     = Math.round((p1Material + p1Labour * 0.1) * 100) / 100
                              const p1EscrowBal = activeContractEscrowBalance ?? 0
                              const p1Covers   = activeContractEscrowBalance === null || p1EscrowBal >= p1Need
                              const p1Shortfall = Math.max(0, Math.round((p1Need - p1EscrowBal) * 100) / 100)
                              return (
                                <div className="mt-2 space-y-1.5">
                                  {activeContractEscrowBalance !== null && !p1Covers && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1.5">
                                      <p className="text-xs text-amber-800 leading-snug">
                                        <span className="font-semibold">Escrow underfunded: </span>
                                        ₦{p1EscrowBal.toLocaleString()} available, ₦{p1Need.toLocaleString()} needed.
                                        Transfer ₦{p1Shortfall.toLocaleString()} from your wallet to proceed.
                                      </p>
                                      <Button
                                        size="sm"
                                        className="w-full h-7 text-xs rounded-md bg-amber-600 hover:bg-amber-700 text-white"
                                        disabled={escrowTopupLoading}
                                        onClick={() => handleTopupEscrow(activeContract!.id, p1Shortfall)}
                                      >
                                        {escrowTopupLoading
                                          ? "Transferring..."
                                          : `Transfer ₦${p1Shortfall.toLocaleString()} From Main Balance`}
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    onClick={() => handleFundMilestone(phase.id)}
                                    size="sm"
                                    className="w-full h-8 text-xs rounded-lg bg-primary hover:bg-primary/90"
                                    disabled={isLoading || (activeContractEscrowBalance !== null && !p1Covers)}
                                  >
                                    <DollarSign className="h-3 w-3 mr-2" />
                                    {isLoading
                                      ? "Processing..."
                                      : activeContract?.payment_mode === "MILESTONE"
                                        ? "Fund & Advance Pay"
                                        : "Fund Milestone"}
                                  </Button>
                                </div>
                              )
                            })()}

                            {/* Artisan: submit completed work */}
                            {currentUserRole === "artisan" && canArtisanSubmitPhase(rawStatus) && (
                              <Button
                                onClick={() => handleSubmitPhase(phase.id)}
                                size="sm"
                                className="w-full mt-2 h-8 text-xs rounded-lg"
                                disabled={isLoading}
                              >
                                <Package className="h-3 w-3 mr-2" />
                                {isLoading ? "Submitting..." : "Submit Work"}
                              </Button>
                            )}

                            {currentUserRole === "employer" && canEmployerResolvePhase(rawStatus) && (() => {
                              // After Phase 1, only the remaining 90% labour can be released/refunded.
                              // Before Phase 1 (FULL-mode or legacy), the full amount applies.
                              const phase2Max = phase.initial_release_done
                                ? Number(phase.labour_cost || 0) * 0.9
                                : Number(phase.amount || 0)

                              // Compute funding shortfall using real escrow balance when available
                              const phFundingGap = Math.max(
                                0,
                                Number(activeContract.totalAmount ?? 0) - Number(activeContract.depositAmount ?? 0)
                              )
                              const phEscrowBal = activeContractEscrowBalance !== null
                                ? activeContractEscrowBalance
                                : Math.max(0, Number(activeContract.depositAmount ?? 0) - contractTxReleasedTotal)
                              const phFinalDue = phase.initial_release_done
                                ? Number(phase.labour_cost ?? 0) * 0.9
                                : Number(phase.amount ?? 0)
                              const phShortfall = phase.initial_release_done && phFundingGap > 0
                                ? Math.max(0, Math.ceil(phFinalDue - phEscrowBal))
                                : 0
                              const actionsLocked = phShortfall > 0

                              return (
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {actionsLocked && (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
                                    <p className="text-xs text-amber-800 leading-snug">
                                      <span className="font-semibold">Funding required: </span>
                                      The initial deposit did not cover the full contract amount.
                                      Transfer <span className="font-bold">₦{phShortfall.toLocaleString()}</span> from
                                      your main wallet to escrow before the final payment can be released.
                                    </p>
                                    <Button
                                      size="sm"
                                      className="w-full h-8 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                                      disabled={escrowTopupLoading}
                                      onClick={() => handleTopupEscrow(activeContract.id, phShortfall)}
                                    >
                                      {escrowTopupLoading ? "Transferring..." : `Transfer ₦${phShortfall.toLocaleString()} From Main Balance`}
                                    </Button>
                                  </div>
                                )}
                                <Button
                                  onClick={() => handleReleasePhase(phase.id)}
                                  size="sm"
                                  className="w-full h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                  disabled={isLoading || actionsLocked}
                                >
                                  <CheckCircle className="h-3 w-3 mr-2" />
                                  {isLoading ? "Processing..." : "Release"}
                                </Button>

                                <Button
                                  onClick={() =>
                                    setPartialReleaseOpenFor((prev) =>
                                      prev === String(phase.id) ? null : String(phase.id)
                                    )
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-8 text-xs rounded-lg"
                                  disabled={isLoading || actionsLocked}
                                >
                                  <DollarSign className="h-3 w-3 mr-2" />
                                  Partial Release
                                </Button>

                                {partialReleaseOpenFor === String(phase.id) && (
                                  <div className="mt-1 space-y-2 rounded-xl border border-gray-100 p-3 bg-gray-50/80">
                                    {phase.initial_release_done && (
                                      <p className="text-[10px] text-gray-400 leading-tight">
                                        Advance already released. Max releasable: ₦{Math.round(phase2Max).toLocaleString()}
                                      </p>
                                    )}
                                    <Input
                                      type="number"
                                      min="1"
                                      max={phase2Max}
                                      step="0.01"
                                      placeholder="Enter amount"
                                      value={partialReleaseAmount[String(phase.id)] || ""}
                                      onChange={(e) =>
                                        setPartialReleaseAmount((prev) => ({
                                          ...prev,
                                          [String(phase.id)]: e.target.value,
                                        }))
                                      }
                                      disabled={isLoading}
                                      className="h-8 text-xs rounded-lg"
                                    />

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1 h-8 text-xs rounded-lg"
                                        onClick={() => handlePartialReleasePhase(phase.id, phase2Max)}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? "Processing..." : "Confirm"}
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs rounded-lg"
                                        onClick={() => {
                                          setPartialReleaseOpenFor(null)
                                          setPartialReleaseAmount((prev) => ({
                                            ...prev,
                                            [String(phase.id)]: "",
                                          }))
                                        }}
                                        disabled={isLoading}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <Button
                                  onClick={() => handleRefundPhase(phase.id)}
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-8 text-xs rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                  disabled={isLoading || actionsLocked}
                                >
                                  <XCircle className="h-3 w-3 mr-2" />
                                  {phase.initial_release_done ? "Refund Remaining" : "Refund"}
                                </Button>
                              </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-gray-400" />
                        Materials &amp; Tools
                      </h4>
                      <div className="space-y-2">
                        {activeContract.materials.map((material) => (
                          <div key={material.id}>
                            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                              <div className="flex items-start justify-between mb-1.5">
                                <p className="text-xs font-medium text-gray-900 flex-1">{material.name}</p>
                                <Badge variant="secondary" className="text-[10px] ml-2 border-0 bg-gray-100 text-gray-500">
                                  {material.coveredBy === "client" ? "You" : "Artisan"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">₦{material.cost.toLocaleString()}</span>
                              </div>
                            </div>
                            {material.receipt && (
                              <div className="mt-1.5 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-3 text-xs text-primary hover:bg-primary/5 rounded-lg"
                                  title="Download Receipt"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  Download Receipt
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                      <div className="flex items-start space-x-2.5">
                        <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-semibold text-blue-900 mb-1">Escrow Protection Active</h5>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Your funds are held securely. Release payments only after reviewing and approving each phase.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
