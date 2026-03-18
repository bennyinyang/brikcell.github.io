


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
import { type Socket } from "socket.io-client"
import { sendContract } from "@/lib/chatSenders"
import { useRouter } from "next/navigation"
import { 
  listChatRooms, listChatMessages, API_BASE, getAuth,
  acceptContract,
  declineContract,
  requestContractChanges,
  listContractTransactions,
  submitMilestone,
  releaseMilestone,
  partialReleaseMilestone,
  refundMilestone,
  getContractState,
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
  const [roomsLoaded, setRoomsLoaded] = useState(false)
  const [contractActionLoading, setContractActionLoading] = useState<string | null>(null)
  const [contractTxTotalPaid, setContractTxTotalPaid] = useState<number>(0)
  const [contractTxLoading, setContractTxLoading] = useState<boolean>(false)
  const [milestoneActionLoading, setMilestoneActionLoading] = useState<string | null>(null)
  const [partialReleaseOpenFor, setPartialReleaseOpenFor] = useState<string | null>(null)
  const [partialReleaseAmount, setPartialReleaseAmount] = useState<Record<string, string>>({})

  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const selectedRoomIdRef = useRef<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  const searchParams = useSearchParams()
  const incomingArtisanId = searchParams.get("artisanId")
  const incomingArtisanEmail = searchParams.get("artisanEmail")
  const incomingArtisanName = searchParams.get("artisanName")

  const auth = getAuth()
  console.log("[Messaging] auth.user.id =", auth?.user?.id)
  console.log("[Messaging] auth.user.role =", auth?.user?.role)
  console.log("[Messaging] tokenExists =", Boolean(auth?.token))
  const currentUserRole = auth?.user?.role
  const currentUserId = auth?.user?.id as string | undefined

  const canStartFromUrl = Boolean(incomingArtisanId || incomingArtisanEmail)
  const canType = Boolean(selectedConversation?.id || canStartFromUrl)

  const totalPaid = contractTxTotalPaid
  const totalContract = Number(activeContract?.totalAmount ?? 0)
  const remaining = Math.max(0, totalContract - totalPaid)

  // deposit is considered fully paid when totalPaid covers depositAmount
  const depositRequired = Number(activeContract?.depositAmount ?? 0)
  const depositFullyPaid = totalPaid >= depositRequired 
  const depositPaidAmount = Math.min(depositRequired, totalPaid)



  const mapBackendContractToUI = (contract: any): Contract => ({
  id: contract.id,
  title: contract.title || "Contract",
  description: contract.description || "",
  totalAmount: Number(contract.totalAmount || 0),
  depositAmount: Number(contract.depositAmount || 0),
  depositPaid: Boolean(contract.depositPaid),
  materials: Array.isArray(contract.materials) ? contract.materials : [],
  phases: Array.isArray(contract.phases)
    ? contract.phases.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
        amount: Number(p.amount || 0),
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

  const calcTotalPaidFromTransactions = (txs: any[]) => {
    return (txs || [])
      .filter((t) => String(t?.status || "").toLowerCase() === "success")
      .reduce((sum, t) => sum + Number(t?.amount || 0), 0)
  }

  const scrollToBottom = () => {
    try {
      const el = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null
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
  function normalizeUser(p: any): { id: string; name: string; email: string } | null {
    if (!p) return null

    // try common nested shapes first
    const u = p.participantUser || p.user || p.User || p

    const id = u?.id ?? p?.user_id ?? p?.userId ?? p?.id
    if (!id) return null

    return {
      id: String(id),
      name: u?.name || u?.userName || u?.username || "User",
      email: u?.email || "",
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

  // PATCH 3: guard null other participant and filter out bad rooms
  function mapRoomsToConversations(rooms: any[]): Conversation[] {
    if (!currentUserId) return []

    return (rooms || [])
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
            avatar: null,
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
      phaseUpdate: m.type === "phase-update" ? m.phase_update_data : undefined,
      paymentPrompt: m.type === "payment-prompt" ? m.payment_prompt_data : undefined,
      attachments: m.type === "file" ? m.attachments : undefined,
    }))
  }

  // Helper to initiate / reuse a 1-to-1 chat with a user
  const initiateChatWith = async (opts: {
    targetUserId?: string | null
    targetEmail?: string | null
    displayName?: string | null
  }): Promise<string | null> => {
    const { targetUserId, targetEmail, displayName } = opts

    if (!auth?.token || !currentUserId) {
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
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
        setContractTxTotalPaid(0)
        return
      }

      try {
        setContractTxLoading(true)

        const txs = await listContractTransactions(String(activeContract.id))
        if (cancelled) return

        const totalPaid = calcTotalPaidFromTransactions(txs)
        setContractTxTotalPaid(totalPaid)
      } catch (err) {
        console.error("[JobSummary] Failed to load contract transactions:", err)
        if (!cancelled) setContractTxTotalPaid(0)
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

    socket.on("connect", () => console.log("Socket connected", socket.id))
    socket.on("disconnect", () => console.log("Socket disconnected"))

    socket.on(
      "chat:new-message",
      (payload: {
        id: string
        room_id: string
        sender_id: string
        message: string
        created_at: string
        type?: string
        contract?: Contract
        contractStatus?: {
          contractId: string
          status: Contract["status"]
        }
      }) => {

        // Handle contract status broadcasts
        if (payload.type === "contract-status" && payload.contractStatus) {
          const { contractId } = payload.contractStatus
          const status = normalizeContractStatus(payload.contractStatus.status)

          // Update contract message inside chat history
          setMessages((prev) =>
            prev.map((m) => {
              if (m.type !== "contract" || !m.contract) return m
              if (String(m.contract.id) !== String(contractId)) return m
              return {
                ...m,
                contract: {
                  ...m.contract,
                  status,
                },
              }
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

          // Update right-side contract panel
          setActiveContract((prev) => {
            if (!prev) return prev
            if (String(prev.id) !== String(contractId)) return prev
            return {
              ...prev,
              status,
            }
          })

          // Update sidebar preview text
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== payload.room_id) return conv

              const previewText =
                status === "accepted"
                  ? "Contract accepted"
                  : status === "in_review"
                  ? "Contract updated"
                  : status === "cancelled"
                  ? "Contract declined"
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

            const normalized = prev.map((m) =>
              m.id.toString().startsWith("temp-") && m.text === payload.message && m.sender === "me"
                ? { ...m, status: "delivered" as const }
                : m,
            )

            const mapped: Message = {
              id: payload.id,
              text: payload.message,
              timestamp: payload.created_at,
              sender: payload.sender_id === currentUserId ? "me" : "them",
              status: "delivered",
              type: msgType,
              contract: msgType === "contract" ? payload.contract : undefined,
            }

            return [...normalized, mapped]
          })
        }

        setConversations((prev) => {
          const updated: Conversation[] = prev.map((conv) => {
            if (conv.id !== payload.room_id) return conv

            const isMe = payload.sender_id === currentUserId
            const isActive = currentRoomId === conv.id

            const previewText =
              msgType === "contract"
                ? "Contract Proposal"
                : msgType === "payment-prompt"
                ? "Payment Request"
                : msgType === "phase-update"
                ? "Phase Update"
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
          })

          return updated
        })
      },
    )

    socket.on("chat:read", ({ roomId }: { roomId: string; readerId?: string }) => {
      const currentRoomId = selectedRoomIdRef.current
      if (roomId !== currentRoomId) return

      setMessages((prev) => prev.map((m) => (m.sender === "me" ? { ...m, status: "read" } : m)))
    })

    return () => {
      socket.off("chat:new-message")
      socket.off("chat:read")
    }
  }, [auth?.token, currentUserId])

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

  // Load messages whenever selected conversation changes
  useEffect(() => {
    if (!selectedConversation?.id) return
    if (!currentUserId) return

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
    } catch (err) {
      console.error("Failed to send message", err)
      setNewMessage(text)
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
      toast.error(err?.message || "Failed to submit milestone")
    } finally {
      setMilestoneActionLoading(null)
    }
  }

  const handleReleasePhase = async (phaseId: string | number) => {
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
            {/* VERSION BADGE — ADD HERE */}
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

          {sender === "them" && contract.status !== "accepted" && (
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
          
          {/* EMPLOYER: PROCEED TO CHECKOUT (deposit funding) */}
          {sender === "them" && contract.status === "accepted" && (
            <div className="pt-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // pass contract via URL query (simple + reliable)
                  const payload = encodeURIComponent(JSON.stringify(contract))
                  router.push(`/checkout?contract=${payload}`)
                }}
              >
                Proceed to Checkout
              </Button>
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
      const res = await sendContract(roomId, contract)

      console.log("[Messaging][debug] sendContract response", res)
      console.log("[Messaging][debug] sendContract phases from response", res?.contract?.phases)

      const message: Message = {
        id: res.message?.id ?? Date.now().toString(),
        text: "",
        timestamp: new Date().toISOString(),
        sender: "me",
        status: "sent",
        type: "contract",
        contract: {
          ...(res.contract || contract),
          id: res.contractId ?? res.contract?.id,
          status: "in_review",
        },
      }

      setMessages((prev) => [...prev, message])
      setTimeout(() => scrollToBottom(), 50)
      //console.log("Contract ID being accepted:", contract.id)
      console.log("Contract sent:", res)
    } catch (err: any) {
      if (err?.status === 409) {
      toast.error("There is already an active contract in this conversation.")
      return
    }
      console.error("Failed to send contract:", err)
    }
  }

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
      <ContractCreationModal
        open={showContractModal}
        onOpenChange={setShowContractModal}
        onSendContract={handleSendContract}
        initialContract={typeof window !== "undefined" ? (window as any).__editingContract || null : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 lg:gap-6 h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)]">
        {/* Conversations List - Left Panel */}
        <Card className={`lg:col-span-3 py-0 ${showConversationList ? "block" : "hidden"} lg:block`}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <CardTitle className="flex items-center justify-between">
              <span className="text-base sm:text-lg lg:text-xl">Messages</span>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {conversations.length}
              </Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea
              ref={scrollAreaRef}
              className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)]"
            >
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      setShowConversationList(false)
                    }}
                    className={`cursor-pointer rounded-xl p-3 transition-all ${
                      selectedConversation?.id === conversation.id
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={conversation.participant.avatar || "/placeholder.svg"}
                            alt={conversation.participant.name}
                          />
                          <AvatarFallback>
                            {conversation.participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">{conversation.participant.name}</h3>
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ""}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          {conversation.participant.service && (
                            <Badge variant="secondary" className="text-xs">
                              {conversation.participant.service}
                            </Badge>
                          )}
                          {conversation.hasActiveContract && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {getConversationPreview(conversation.lastMessage)}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="mt-1 bg-primary text-white text-xs">{conversation.unreadCount} new</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="text-xs text-gray-500 px-2 py-4">No conversations yet.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* FIX: Chat Interface panel is ALWAYS rendered (no outer selectedConversation conditional) */}
        <Card
          className={`lg:col-span-6 flex flex-col py-0 ${
            showConversationList && conversations.length > 0 ? "hidden" : "block"
          } lg:block ${!showJobSummary ? "lg:col-span-9" : ""}`}
        >
          <CardHeader className="pb-2 sm:pb-3 border-b px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            {selectedConversation ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-9 w-9 p-0 flex-shrink-0"
                    onClick={() => setShowConversationList(true)}
                  >
                    ←
                  </Button>

                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                      <AvatarImage
                        src={selectedConversation.participant.avatar || "/placeholder.svg"}
                        alt={selectedConversation.participant.name}
                      />
                      <AvatarFallback>
                        {selectedConversation.participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.participant.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm lg:text-base truncate">{selectedConversation.participant.name}</h3>
                    <p className="text-xs text-gray-600 truncate">
                      {selectedConversation.participant.isOnline
                        ? "Online"
                        : selectedConversation.participant.lastSeen
                        ? `Last seen ${selectedConversation.participant.lastSeen}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 hidden sm:flex bg-transparent">
                    <Phone className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 lg:hidden bg-transparent"
                    onClick={() => setShowJobSummary(!showJobSummary)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent">
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
                  <h3 className="font-semibold text-sm lg:text-base">Messages</h3>
                  <p className="text-xs text-gray-600">
                    {incomingArtisanName ? `Start a new chat with ${incomingArtisanName}` : "Start a new chat"}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-18rem)] sm:h-[calc(100vh-22rem)] lg:h-[calc(100vh-28rem)] p-3 sm:p-4 lg:p-6">
              <div className="space-y-4">
                {selectedConversation ? (
                  <>
                    {/* FIX: restored message rendering logic */}
                    {messages.map((message) => {
                      const isMine = message.sender === "me"
                      const alignLeft = !isMine

                      return (
                        <div key={message.id} className={`flex ${alignLeft ? "justify-start" : "justify-end"}`}>
                          {/* TEXT */}
                          {message.type === "text" && (
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
                                alignLeft ? "bg-white" : "bg-primary/10"
                              }`}
                            >
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">{message.text || ""}</div>
                              <div className="mt-1 flex items-center justify-end space-x-2 text-[11px] text-gray-500">
                                <span>{formatTime(message.timestamp)}</span>
                                {message.sender === "me" ? getMessageStatus(message.status) : null}
                              </div>
                            </div>
                          )}

                          {/* System */}
                          {message.type === "system" && (
                            <div className="w-full flex justify-center my-2">
                              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {message.text}
                              </div>
                            </div>
                          )}

                          {/* FILE */}
                          {message.type === "file" && (
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
                                alignLeft ? "bg-white" : "bg-primary/10"
                              }`}
                            >
                              <div className="text-sm font-medium text-gray-900 mb-2">Attachment</div>
                              <div className="space-y-2">
                                {(message.attachments || []).map((a, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-2">
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium text-gray-900 truncate">{a.name}</div>
                                      <div className="text-[11px] text-gray-500 truncate">{a.type}</div>
                                    </div>
                                    <a
                                      href={a.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </a>
                                  </div>
                                ))}
                                {(message.attachments || []).length === 0 && (
                                  <div className="text-xs text-gray-500">No attachment data.</div>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-end space-x-2 text-[11px] text-gray-500">
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
                      <div className="text-xs text-gray-500 text-center py-4">No messages yet.</div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-10">
                    No conversations yet. Use the box below to start messaging.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Composer ALWAYS visible */}
          <div className="border-t p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              {auth?.user?.role === "artisan" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 flex-shrink-0 bg-transparent"
                  onClick={() => setShowContractModal(true)}
                  title="Send Contract"
                  disabled={!selectedConversation?.id}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 flex-shrink-0 bg-transparent"
                disabled={!selectedConversation?.id}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 flex-shrink-0 bg-transparent"
                disabled={!selectedConversation?.id}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Input
                placeholder={
                  selectedConversation?.id
                    ? "Type your message..."
                    : canStartFromUrl
                    ? "Type your message to start chat..."
                    : "Select a conversation to start messaging..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canType && sendMessageHandler()}
                className="h-10 text-sm"
                disabled={!canType}
              />

              <Button
                size="sm"
                onClick={sendMessageHandler}
                disabled={!canType || !newMessage.trim()}
                className="h-10 w-10 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Job Summary Panel - Right Panel */}
        <Card
          className={`lg:col-span-3 ${showJobSummary ? "block" : "hidden"} lg:block absolute lg:relative inset-0 lg:inset-auto z-50 lg:z-auto`}
        >
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base lg:text-lg">Job Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setShowJobSummary(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-16rem)]">
              <div className="p-4 space-y-4">
                {!activeContract ? (
                  <div className="text-sm text-gray-600">No contract details are available for this conversation yet.</div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Contract Status</h3>
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm font-bold text-primary">{Math.round(calculateProgress())}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2 mb-2" />
                        <div className="flex items-center justify-between text-xs text-gray-600">
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

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm mb-3">Payment Summary</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Contract</span>
                          <span className="font-semibold">₦{activeContract.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Deposit Paid</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              ₦{depositPaidAmount.toLocaleString()}
                            </span>
                            {depositFullyPaid && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {contractTxLoading && <span className="text-xs text-gray-500">…</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Paid</span>
                            <span className="font-semibold text-green-600">
                              ₦{totalPaid.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Remaining</span>
                          <span className="font-semibold text-green-600">
                            ₦{remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm mb-3">Project Phases</h3>
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
                          <div key={phase.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500">Phase {index + 1}</span>
                                  <Badge className={`${getPhaseStatusColor(rawStatus)} text-xs`}>
                                    {displayStatus}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium">{phase.name}</p>
                              </div>
                              {getPhaseStatusIcon(rawStatus)}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span>Amount:</span>
                              <span className="font-semibold text-primary">
                                ₦{Number(phase.amount || 0).toLocaleString()}
                              </span>
                            </div>

                            {phase.dueDate && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Due: {new Date(phase.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            {currentUserRole === "artisan" && canArtisanSubmitPhase(rawStatus) && (
                              <Button
                                onClick={() => handleSubmitPhase(phase.id)}
                                size="sm"
                                className="w-full mt-2"
                                disabled={isLoading}
                              >
                                <Package className="h-3 w-3 mr-2" />
                                {isLoading ? "Submitting..." : "Submit"}
                              </Button>
                            )}

                            {currentUserRole === "employer" && canEmployerResolvePhase(rawStatus) && (
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                <Button
                                  onClick={() => handleReleasePhase(phase.id)}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  disabled={isLoading}
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
                                  className="w-full"
                                  disabled={isLoading}
                                >
                                  <DollarSign className="h-3 w-3 mr-2" />
                                  Partial Release
                                </Button>

                                {partialReleaseOpenFor === String(phase.id) && (
                                  <div className="mt-2 space-y-2 rounded-md border p-2 bg-gray-50">
                                    <Input
                                      type="number"
                                      min="1"
                                      max={Number(phase.amount || 0)}
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
                                    />

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handlePartialReleasePhase(phase.id, Number(phase.amount || 0))}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? "Processing..." : "Confirm Partial Release"}
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
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
                                  className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                  disabled={isLoading}
                                >
                                  <XCircle className="h-3 w-3 mr-2" />
                                  Refund
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm mb-3 flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-primary" />
                        Materials & Tools
                      </h3>
                      <div className="space-y-2">
                        {activeContract.materials.map((material) => (
                          <div key={material.id}>
                            <div className="bg-gray-50 rounded p-2">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-xs font-medium flex-1">{material.name}</p>
                                <Badge variant="secondary" className="text-xs ml-2">
                                  {material.coveredBy === "client" ? "You" : "Artisan"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">₦{material.cost.toLocaleString()}</span>
                              </div>
                            </div>
                            {material.receipt && (
                              <div className="mt-2 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                  title="Download Receipt"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  <span className="text-xs">Download Receipt</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-medium text-blue-900 mb-1">Escrow Protection Active</h5>
                          <p className="text-xs text-blue-800 leading-relaxed">
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


