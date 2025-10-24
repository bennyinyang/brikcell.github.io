"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Send,
  Paperclip,
  ImageIcon,
  Phone,
  Video,
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
  ChevronLeft,
} from "lucide-react"

interface Phase {
  id: number
  name: string
  description: string
  deliverables: string[]
  amount: number
  status: "pending" | "in-progress" | "delivered" | "approved" | "paid"
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
  status: "draft" | "proposed" | "accepted" | "active" | "completed"
  createdAt: string
  acceptedAt?: string
}

interface Message {
  id: number
  text?: string
  timestamp: string
  sender: "me" | "them"
  status: "sent" | "delivered" | "read"
  type: "text" | "contract" | "phase-update" | "payment-prompt" | "file"
  attachments?: { type: string; url: string; name: string }[]
  contract?: Contract
  phaseUpdate?: { phaseId: number; status: string; message: string }
  paymentPrompt?: { phaseId: number; amount: number }
}

const mockContract: Contract = {
  id: 1,
  title: "Kitchen Plumbing Repair & Faucet Replacement",
  description:
    "Complete kitchen plumbing repair including fixing the leaking sink, replacing the old faucet with a new modern fixture, and ensuring all connections are properly sealed.",
  totalAmount: 75000,
  depositAmount: 22500,
  depositPaid: true,
  status: "active",
  createdAt: "2024-01-15T10:00:00Z",
  acceptedAt: "2024-01-15T14:00:00Z",
  phases: [
    {
      id: 1,
      name: "Initial Assessment & Preparation",
      description: "Inspect the plumbing system, identify issues, and prepare materials",
      deliverables: ["Detailed assessment report", "List of required materials", "Work timeline"],
      amount: 15000,
      status: "paid",
      dueDate: "2024-01-16",
      completedDate: "2024-01-16",
    },
    {
      id: 2,
      name: "Leak Repair & Old Faucet Removal",
      description: "Fix the leaking sink and safely remove the old faucet",
      deliverables: ["Leak completely fixed", "Old faucet removed", "Area cleaned"],
      amount: 30000,
      status: "delivered",
      dueDate: "2024-01-17",
      completedDate: "2024-01-17",
    },
    {
      id: 3,
      name: "New Faucet Installation & Testing",
      description: "Install the new faucet and test all connections",
      deliverables: ["New faucet installed", "All connections tested", "Final inspection"],
      amount: 30000,
      status: "in-progress",
      dueDate: "2024-01-18",
    },
  ],
  materials: [
    { id: 1, name: "Modern Kitchen Faucet (Chrome)", cost: 12500, coveredBy: "client" },
    { id: 2, name: "Plumbing Sealant & Tape", cost: 2500, coveredBy: "artisan" },
    { id: 3, name: "Pipe Fittings & Connectors", cost: 3500, coveredBy: "artisan" },
    { id: 4, name: "Replacement Gaskets", cost: 1500, coveredBy: "client", receipt: "/receipts/gaskets.pdf" },
  ],
}

const conversations = [
  {
    id: 1,
    participant: {
      name: "Mike Rodriguez",
      avatar: "/professional-plumber.png",
      service: "Plumbing",
      isOnline: true,
    },
    lastMessage: {
      text: "Phase 2 has been completed! Please review and approve the payment.",
      timestamp: "2024-01-17T16:30:00Z",
      isRead: false,
      sender: "them",
    },
    unreadCount: 2,
    jobTitle: "Kitchen Plumbing Repair",
    jobBudget: "₦75,000",
    hasActiveContract: true,
  },
  {
    id: 2,
    participant: {
      name: "Sarah Johnson",
      avatar: "/professional-hairstylist-woman.png",
      service: "Hair Styling",
      isOnline: false,
      lastSeen: "1 hour ago",
    },
    lastMessage: {
      text: "I've sent you a contract proposal for the wedding hair styling.",
      timestamp: "2024-01-15T14:30:00Z",
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
    jobTitle: "Wedding Hair Styling",
    jobBudget: "₦42,500",
    hasActiveContract: false,
  },
]

const messages: Message[] = [
  {
    id: 1,
    text: "Hi Mike! I saw your profile and I'm interested in hiring you for a kitchen plumbing repair.",
    timestamp: "2024-01-15T10:00:00Z",
    sender: "me",
    status: "read",
    type: "text",
  },
  {
    id: 2,
    text: "Hello! Thanks for reaching out. I'd be happy to help with your kitchen plumbing. Can you tell me more about the issue?",
    timestamp: "2024-01-15T10:05:00Z",
    sender: "them",
    status: "read",
    type: "text",
  },
  {
    id: 3,
    text: "The kitchen sink has been leaking for a few days, and I think the faucet needs to be replaced too. Here are some photos.",
    timestamp: "2024-01-15T10:10:00Z",
    sender: "me",
    status: "read",
    type: "file",
    attachments: [
      { type: "image", url: "/kitchen-sink-leak.jpg", name: "kitchen-sink-leak.jpg" },
      { type: "image", url: "/old-faucet.jpg", name: "old-faucet.jpg" },
    ],
  },
  {
    id: 4,
    text: "Thanks for the photos! I can see the issue clearly. I've prepared a detailed contract for this project with 3 phases. Please review it.",
    timestamp: "2024-01-15T11:00:00Z",
    sender: "them",
    status: "read",
    type: "text",
  },
  {
    id: 5,
    timestamp: "2024-01-15T11:05:00Z",
    sender: "them",
    status: "read",
    type: "contract",
    contract: mockContract,
  },
  {
    id: 6,
    text: "This looks great! I've accepted the contract and paid the deposit. When can you start?",
    timestamp: "2024-01-15T14:00:00Z",
    sender: "me",
    status: "read",
    type: "text",
  },
  {
    id: 7,
    text: "Perfect! I'll start tomorrow morning. Phase 1 is complete - I've assessed everything and prepared the materials.",
    timestamp: "2024-01-16T16:00:00Z",
    sender: "them",
    status: "read",
    type: "phase-update",
    phaseUpdate: { phaseId: 1, status: "completed", message: "Assessment complete, ready for phase 2" },
  },
  {
    id: 8,
    timestamp: "2024-01-16T16:05:00Z",
    sender: "them",
    status: "read",
    type: "payment-prompt",
    paymentPrompt: { phaseId: 1, amount: 15000 },
  },
  {
    id: 9,
    text: "Great work! I've approved and released the payment for Phase 1.",
    timestamp: "2024-01-16T17:00:00Z",
    sender: "me",
    status: "read",
    type: "text",
  },
  {
    id: 10,
    text: "Phase 2 is now complete! I've fixed the leak and removed the old faucet. Please review the work.",
    timestamp: "2024-01-17T16:00:00Z",
    sender: "them",
    status: "delivered",
    type: "phase-update",
    phaseUpdate: { phaseId: 2, status: "delivered", message: "Leak fixed and old faucet removed" },
  },
  {
    id: 11,
    timestamp: "2024-01-17T16:30:00Z",
    sender: "them",
    status: "delivered",
    type: "payment-prompt",
    paymentPrompt: { phaseId: 2, amount: 30000 },
  },
]

export function MessagingInterface() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showConversationList, setShowConversationList] = useState(true)
  const [showJobSummary, setShowJobSummary] = useState(false)
  const [activeContract, setActiveContract] = useState<Contract>(mockContract)

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
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

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-purple-100 text-purple-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "delivered":
        return <Package className="h-4 w-4 text-purple-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const handleAcceptContract = (contract: Contract) => {
    console.log("Accepting contract:", contract.id)
    setActiveContract({ ...contract, status: "accepted" })
  }

  const handleDeclineContract = (contract: Contract) => {
    console.log("Declining contract:", contract.id)
  }

  const handleRequestChanges = (contract: Contract) => {
    console.log("Requesting changes for contract:", contract.id)
  }

  const handleApprovePhase = (phaseId: number) => {
    console.log("Approving phase:", phaseId)
    const updatedPhases = activeContract.phases.map((phase) =>
      phase.id === phaseId ? { ...phase, status: "approved" as const } : phase,
    )
    setActiveContract({ ...activeContract, phases: updatedPhases })
  }

  const handleReleasePayment = (phaseId: number) => {
    console.log("Releasing payment for phase:", phaseId)
    const updatedPhases = activeContract.phases.map((phase) =>
      phase.id === phaseId ? { ...phase, status: "paid" as const } : phase,
    )
    setActiveContract({ ...activeContract, phases: updatedPhases })
  }

  const calculateProgress = () => {
    const completedPhases = activeContract.phases.filter((p) => p.status === "paid").length
    return (completedPhases / activeContract.phases.length) * 100
  }

  const calculateTotalPaid = () => {
    return activeContract.phases.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  }

  const ContractCard = ({ contract, sender }: { contract: Contract; sender: "me" | "them" }) => (
    <div className="max-w-full sm:max-w-2xl">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg">Contract Proposal</CardTitle>
            </div>
            <Badge
              className={`${contract.status === "accepted" ? "bg-green-500" : "bg-yellow-500"} text-xs sm:text-sm flex-shrink-0`}
            >
              {contract.status === "accepted" ? "Accepted" : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-3 sm:px-4 lg:px-6">
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-2">{contract.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{contract.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">₦{contract.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Deposit Required</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{contract.depositAmount.toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Project Phases ({contract.phases.length})
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {contract.phases.map((phase, index) => (
                <div key={phase.id} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">
                        Phase {index + 1}: {phase.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{phase.description}</p>
                    </div>
                    <p className="font-semibold text-primary text-sm sm:text-base flex-shrink-0">
                      ₦{phase.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Deliverables:</p>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      {phase.deliverables.map((deliverable, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-3 w-3 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                          <span className="flex-1">{deliverable}</span>
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
            <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center">
              <Wrench className="h-4 w-4 mr-2 text-primary" />
              Materials & Tools
            </h4>
            <div className="space-y-2">
              {contract.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${material.coveredBy === "client" ? "bg-blue-500" : "bg-green-500"}`}
                    ></div>
                    <span className="truncate">{material.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
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
                <h5 className="text-xs sm:text-sm font-medium text-blue-900">Escrow Protection</h5>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Your payment is held securely in escrow. Funds are released to the artisan only after you approve each
                  phase.
                </p>
              </div>
            </div>
          </div>

          {sender === "them" && contract.status !== "accepted" && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => handleAcceptContract(contract)}
                className="flex-1 bg-primary hover:bg-primary/90 h-10 sm:h-auto text-sm sm:text-base"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Contract
              </Button>
              <Button
                onClick={() => handleRequestChanges(contract)}
                variant="outline"
                className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30 h-10 sm:h-auto text-sm sm:text-base"
              >
                Request Changes
              </Button>
              <Button
                onClick={() => handleDeclineContract(contract)}
                variant="outline"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-10 sm:h-auto w-full sm:w-auto"
              >
                <XCircle className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">Decline</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const PhaseUpdateCard = ({
    phaseUpdate,
    sender,
  }: { phaseUpdate: { phaseId: number; status: string; message: string }; sender: "me" | "them" }) => {
    const phase = activeContract.phases.find((p) => p.id === phaseUpdate.phaseId)
    if (!phase) return null

    return (
      <div className="max-w-full sm:max-w-md">
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">{getPhaseStatusIcon(phaseUpdate.status)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2">Phase Update: {phase.name}</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">{phaseUpdate.message}</p>
                <Badge className={`${getPhaseStatusColor(phaseUpdate.status)} text-xs`}>{phaseUpdate.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const PaymentPromptCard = ({ paymentPrompt }: { paymentPrompt: { phaseId: number; amount: number } }) => {
    const phase = activeContract.phases.find((p) => p.id === paymentPrompt.phaseId)
    if (!phase) return null

    return (
      <div className="max-w-full sm:max-w-md">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-1">Payment Request</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  {phase.name} has been completed. Please review and approve the payment.
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm text-gray-600">Amount:</span>
                  <span className="text-base sm:text-lg font-bold text-green-600">
                    ₦{paymentPrompt.amount.toLocaleString()}
                  </span>
                </div>
                {phase.status === "delivered" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleReleasePayment(paymentPrompt.phaseId)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 h-9 sm:h-8 text-xs sm:text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Release
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-red-50 hover:text-red-600 bg-transparent h-9 sm:h-8 w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 sm:mr-2" />
                      <span className="sm:inline">Decline</span>
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

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 lg:py-6 xl:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] lg:h-[calc(100vh-10rem)] xl:h-[calc(100vh-12rem)]">
        {/* Conversations List - Left Panel */}
        <Card className={`lg:col-span-3 ${showConversationList ? "block" : "hidden"} lg:block overflow-hidden`}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-5 xl:px-6 py-3 sm:py-4 lg:py-5 xl:py-6">
            <CardTitle className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-base sm:text-lg lg:text-xl">Messages</span>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {conversations.length}
              </Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-16rem)] lg:h-[calc(100vh-18rem)] xl:h-[calc(100vh-20rem)]">
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      setShowConversationList(false)
                    }}
                    className={`cursor-pointer rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-all ${
                      selectedConversation.id === conversation.id
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage
                            src={conversation.participant.avatar || "/placeholder.svg"}
                            alt={conversation.participant.name}
                          />
                          <AvatarFallback className="text-xs sm:text-sm">
                            {conversation.participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 className="font-semibold text-xs sm:text-sm truncate">{conversation.participant.name}</h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {conversation.participant.service}
                          </Badge>
                          {conversation.hasActiveContract && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">{conversation.lastMessage.text}</p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="mt-1.5 bg-primary text-white text-xs">{conversation.unreadCount} new</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface - Middle Panel */}
        <Card
          className={`lg:col-span-6 flex flex-col ${showConversationList ? "hidden" : "block"} lg:block ${!showJobSummary ? "lg:col-span-9" : ""} overflow-hidden`}
        >
          <CardHeader className="sm:pb-3 border-b px-2 sm:px-3 lg:px-4 xl:px-6 sm:py-3 lg:py-4 xl:py-6 flex-shrink-0 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                  onClick={() => setShowConversationList(true)}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
                    <AvatarImage
                      src={selectedConversation.participant.avatar || "/placeholder.svg"}
                      alt={selectedConversation.participant.name}
                    />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {selectedConversation.participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base truncate">
                    {selectedConversation.participant.name}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedConversation.participant.isOnline
                      ? "Online"
                      : `Last seen ${selectedConversation.participant.lastSeen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex bg-transparent">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex bg-transparent">
                  <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 lg:hidden bg-transparent"
                  onClick={() => setShowJobSummary(!showJobSummary)}
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 bg-transparent">
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-24rem)] xl:h-[calc(100vh-28rem)] p-2 sm:p-3 lg:p-4 xl:p-6">
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    {message.type === "text" && (
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] ${message.sender === "me" ? "order-2" : "order-1"}`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                            message.sender === "me" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-xs sm:text-sm leading-relaxed break-words">{message.text}</p>
                        </div>
                        <div
                          className={`flex items-center mt-1 space-x-1 ${
                            message.sender === "me" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          {message.sender === "me" && getMessageStatus(message.status)}
                        </div>
                      </div>
                    )}

                    {message.type === "file" && message.attachments && (
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] ${message.sender === "me" ? "order-2" : "order-1"}`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                            message.sender === "me" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.text && (
                            <p className="text-xs sm:text-sm leading-relaxed mb-2 break-words">{message.text}</p>
                          )}
                          <div className="space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className={`rounded p-2 ${message.sender === "me" ? "bg-white/20" : "bg-white"}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="text-xs truncate">{attachment.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          className={`flex items-center mt-1 space-x-1 ${
                            message.sender === "me" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          {message.sender === "me" && getMessageStatus(message.status)}
                        </div>
                      </div>
                    )}

                    {message.type === "contract" && message.contract && (
                      <div className="w-full">
                        <ContractCard contract={message.contract} sender={message.sender} />
                        <div className="flex justify-start mt-1">
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    )}

                    {message.type === "phase-update" && message.phaseUpdate && (
                      <div className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} w-full`}>
                        <div className="w-full sm:w-auto">
                          <PhaseUpdateCard phaseUpdate={message.phaseUpdate} sender={message.sender} />
                          <div className={`flex mt-1 ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.type === "payment-prompt" && message.paymentPrompt && (
                      <div className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} w-full`}>
                        <div className="w-full sm:w-auto">
                          <PaymentPromptCard paymentPrompt={message.paymentPrompt} />
                          <div className={`flex mt-1 ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="border-t p-2 sm:p-3 lg:p-4 flex-shrink-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Button variant="outline" size="sm" className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0 bg-transparent">
                <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0 bg-transparent">
                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Job Summary Panel - Right Panel */}
        <Card
          className={`lg:col-span-3 ${showJobSummary ? "block" : "hidden"} lg:block fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto m-2 sm:m-4 lg:m-0 overflow-hidden`}
        >
          <CardHeader className="pb-2 sm:pb-3 border-b px-3 sm:px-4 lg:px-5 xl:px-6 py-3 sm:py-4 lg:py-5 xl:py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base lg:text-lg">Job Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => setShowJobSummary(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] lg:h-[calc(100vh-14rem)] xl:h-[calc(100vh-16rem)]">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Contract Status */}
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm mb-2">Contract Status</h3>
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium">Overall Progress</span>
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {Math.round(calculateProgress())}%
                      </span>
                    </div>
                    <Progress value={calculateProgress()} className="h-1.5 sm:h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {activeContract.phases.filter((p) => p.status === "paid").length} of{" "}
                        {activeContract.phases.length} phases completed
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Payment Summary</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total Contract</span>
                      <span className="font-semibold">₦{activeContract.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Deposit Paid</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">₦{activeContract.depositAmount.toLocaleString()}</span>
                        {activeContract.depositPaid && (
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total Paid</span>
                      <span className="font-semibold text-green-600">₦{calculateTotalPaid().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1.5 sm:pt-2 border-t">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-bold text-primary">
                        ₦{(activeContract.totalAmount - calculateTotalPaid()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Phases */}
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Project Phases</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {activeContract.phases.map((phase, index) => (
                      <div key={phase.id} className="border rounded-lg p-2.5 sm:p-3">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">Phase {index + 1}</span>
                              <Badge className={`${getPhaseStatusColor(phase.status)} text-xs`}>{phase.status}</Badge>
                            </div>
                            <p className="text-xs sm:text-sm font-medium line-clamp-2">{phase.name}</p>
                          </div>
                          <div className="flex-shrink-0">{getPhaseStatusIcon(phase.status)}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                          <span>Amount:</span>
                          <span className="font-semibold text-primary">₦{phase.amount.toLocaleString()}</span>
                        </div>
                        {phase.dueDate && (
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {new Date(phase.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        {phase.status === "delivered" && (
                          <Button
                            onClick={() => handleReleasePayment(phase.id)}
                            size="sm"
                            className="w-full mt-2 bg-green-600 hover:bg-green-700 h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                            Release Payment
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Materials */}
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center">
                    <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />
                    Materials & Tools
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {activeContract.materials.map((material) => (
                      <div key={material.id} className="bg-gray-50 rounded p-2">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <p className="text-xs font-medium flex-1 line-clamp-2">{material.name}</p>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {material.coveredBy === "client" ? "You" : "Artisan"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">₦{material.cost.toLocaleString()}</span>
                          {material.receipt && (
                            <Button variant="ghost" size="sm" className="h-5 sm:h-6 text-xs p-1">
                              <Download className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Escrow Protection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-medium text-blue-900 mb-1">Escrow Protection Active</h5>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Your funds are held securely. Release payments only after reviewing and approving each phase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
