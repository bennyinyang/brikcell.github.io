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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  DollarSign,
  FileText,
  Calendar,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  CreditCard,
  Download,
  Eye,
} from "lucide-react"

// Mock data for conversations with contract information
const conversations = [
  {
    id: 1,
    participant: {
      name: "Sarah Johnson",
      avatar: "/professional-hairstylist-woman.png",
      service: "Hair Styling",
      rating: 4.9,
      reviewCount: 127,
      isOnline: true,
    },
    lastMessage: {
      text: "Perfect! I'll see you tomorrow at 2 PM for the hair styling session.",
      timestamp: "2024-01-15T14:30:00Z",
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
    contract: {
      id: "CNT-001",
      jobTitle: "Wedding Hair Styling",
      status: "in-progress",
      totalAmount: 350,
      paidAmount: 175,
      location: "123 Main St, New York, NY",
      scheduledDate: "2024-01-20",
      scheduledTime: "2:00 PM",
      phases: [
        {
          id: 1,
          name: "Initial Consultation & Design",
          amount: 175,
          status: "completed",
          dueDate: "2024-01-15",
          description: "Hair consultation and wedding style planning",
          completedDate: "2024-01-15",
        },
        {
          id: 2,
          name: "Wedding Day Styling",
          amount: 175,
          status: "pending",
          dueDate: "2024-01-20",
          description: "Complete hair styling on wedding day",
        },
      ],
      milestones: [
        { name: "Consultation Complete", completed: true, date: "2024-01-15" },
        { name: "Trial Session", completed: false, date: "2024-01-18" },
        { name: "Wedding Day Service", completed: false, date: "2024-01-20" },
      ],
    },
  },
  {
    id: 2,
    participant: {
      name: "Mike Rodriguez",
      avatar: "/professional-plumber.png",
      service: "Plumbing",
      rating: 4.8,
      reviewCount: 89,
      isOnline: false,
      lastSeen: "2 hours ago",
    },
    lastMessage: {
      text: "I can start the kitchen plumbing repair this Thursday. Does that work for you?",
      timestamp: "2024-01-15T12:15:00Z",
      isRead: false,
      sender: "them",
    },
    unreadCount: 2,
    contract: {
      id: "CNT-002",
      jobTitle: "Kitchen Plumbing Repair",
      status: "negotiating",
      totalAmount: 450,
      paidAmount: 0,
      location: "456 Oak Ave, Brooklyn, NY",
      scheduledDate: "2024-01-18",
      scheduledTime: "10:00 AM",
      phases: [
        {
          id: 1,
          name: "Initial Assessment",
          amount: 100,
          status: "pending",
          dueDate: "2024-01-18",
          description: "Inspection and diagnosis of plumbing issues",
        },
        {
          id: 2,
          name: "Parts & Materials",
          amount: 150,
          status: "pending",
          dueDate: "2024-01-18",
          description: "Purchase necessary parts and materials",
        },
        {
          id: 3,
          name: "Repair Work",
          amount: 200,
          status: "pending",
          dueDate: "2024-01-19",
          description: "Complete plumbing repairs",
        },
      ],
      milestones: [
        { name: "Contract Signed", completed: false, date: "2024-01-16" },
        { name: "Initial Payment", completed: false, date: "2024-01-16" },
        { name: "Work Completed", completed: false, date: "2024-01-19" },
      ],
    },
  },
  {
    id: 3,
    participant: {
      name: "David Chen",
      avatar: "/professional-carpenter.png",
      service: "Carpentry",
      rating: 5.0,
      reviewCount: 203,
      isOnline: true,
    },
    lastMessage: {
      text: "Thanks for the great review! It was a pleasure working on your bookshelf project.",
      timestamp: "2024-01-14T16:45:00Z",
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
    contract: {
      id: "CNT-003",
      jobTitle: "Custom Bookshelf Installation",
      status: "completed",
      totalAmount: 800,
      paidAmount: 800,
      location: "789 Pine Rd, Manhattan, NY",
      scheduledDate: "2024-01-10",
      scheduledTime: "9:00 AM",
      phases: [
        {
          id: 1,
          name: "Design & Planning",
          amount: 200,
          status: "completed",
          dueDate: "2024-01-08",
          description: "Custom design consultation",
          completedDate: "2024-01-08",
        },
        {
          id: 2,
          name: "Materials Purchase",
          amount: 300,
          status: "completed",
          dueDate: "2024-01-09",
          description: "Wood and hardware procurement",
          completedDate: "2024-01-09",
        },
        {
          id: 3,
          name: "Installation",
          amount: 300,
          status: "completed",
          dueDate: "2024-01-10",
          description: "Complete bookshelf installation",
          completedDate: "2024-01-10",
        },
      ],
      milestones: [
        { name: "Design Approved", completed: true, date: "2024-01-08" },
        { name: "Materials Delivered", completed: true, date: "2024-01-09" },
        { name: "Installation Complete", completed: true, date: "2024-01-10" },
        { name: "Final Review", completed: true, date: "2024-01-12" },
      ],
    },
  },
]

// Mock messages
const messages = [
  {
    id: 1,
    text: "Hi Mike! I saw your profile and I'm interested in hiring you for a kitchen plumbing repair.",
    timestamp: "2024-01-15T10:00:00Z",
    sender: "me",
    status: "read",
  },
  {
    id: 2,
    text: "Hello! Thanks for reaching out. I'd be happy to help with your kitchen plumbing. Can you tell me more about the issue?",
    timestamp: "2024-01-15T10:05:00Z",
    sender: "them",
    status: "read",
  },
  {
    id: 3,
    text: "The kitchen sink has been leaking for a few days, and I think the faucet needs to be replaced too.",
    timestamp: "2024-01-15T10:10:00Z",
    sender: "me",
    status: "read",
  },
  {
    id: 4,
    text: "I can definitely help with that. Based on your description, I estimate this will cost around $450 including parts and labor. I've sent you a detailed contract with payment phases.",
    timestamp: "2024-01-15T10:20:00Z",
    sender: "them",
    status: "read",
  },
  {
    id: 5,
    text: "That sounds reasonable. When would you be available to start?",
    timestamp: "2024-01-15T10:25:00Z",
    sender: "me",
    status: "read",
  },
  {
    id: 6,
    text: "I can start the kitchen plumbing repair this Thursday. Does that work for you?",
    timestamp: "2024-01-15T12:15:00Z",
    sender: "them",
    status: "delivered",
  },
]

export function MessagingInterface() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[1])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" })
  const [disputeForm, setDisputeForm] = useState({ reason: "", description: "" })

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contract.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "negotiating":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Negotiating
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "disputed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Disputed
          </Badge>
        )
      default:
        return null
    }
  }

  const getPhaseStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
            Pending
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">
            Completed
          </Badge>
        )
      default:
        return null
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      console.log("[v0] Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const handleReleasePayment = (phaseId: number) => {
    console.log("[v0] Releasing payment for phase:", phaseId)
  }

  const handleAcceptContract = () => {
    console.log("[v0] Accepting contract:", selectedConversation.contract.id)
  }

  const handleRejectContract = () => {
    console.log("[v0] Rejecting contract:", selectedConversation.contract.id)
  }

  const handleCompleteJob = () => {
    console.log("[v0] Marking job as complete:", selectedConversation.contract.id)
  }

  const handleSubmitReview = () => {
    console.log("[v0] Submitting review:", reviewForm)
    setShowReviewModal(false)
    setReviewForm({ rating: 5, comment: "" })
  }

  const handleSubmitDispute = () => {
    console.log("[v0] Submitting dispute:", disputeForm)
    setShowDisputeModal(false)
    setDisputeForm({ reason: "", description: "" })
  }

  const progressPercentage =
    (selectedConversation.contract.paidAmount / selectedConversation.contract.totalAmount) * 100

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
        {/* Left Panel - Conversations List */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge variant="secondary">{conversations.length}</Badge>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 p-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`cursor-pointer rounded-xl p-3 transition-all ${
                      selectedConversation.id === conversation.id
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.participant.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {conversation.participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">{conversation.participant.name}</h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{conversation.participant.rating}</span>
                          <span className="text-xs text-gray-500">({conversation.participant.reviewCount})</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-2">{conversation.lastMessage.text}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {conversation.participant.service}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-primary text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Middle Panel - Chat Interface */}
        <Card className="col-span-12 lg:col-span-5 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.participant.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedConversation.participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{selectedConversation.participant.name}</h3>
                  <p className="text-xs text-gray-600">
                    {selectedConversation.participant.isOnline
                      ? "Online"
                      : `Last seen ${selectedConversation.participant.lastSeen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-4">
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${message.sender === "me" ? "order-2" : "order-1"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.sender === "me" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                      <div
                        className={`flex items-center mt-1 space-x-1 ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                      >
                        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                        {message.sender === "me" && getMessageStatus(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 bg-transparent">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 bg-transparent">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1"
              />
              <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()} className="h-10 w-10 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Panel - Contract & Job Details */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Contract Details</CardTitle>
              {getContractStatusBadge(selectedConversation.contract.status)}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="p-4 space-y-6">
                {/* Job Information */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Job Information
                  </h3>
                  <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">Job Title:</span>
                      <span className="text-sm font-medium text-right">{selectedConversation.contract.jobTitle}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">Contract ID:</span>
                      <span className="text-sm font-mono">{selectedConversation.contract.id}</span>
                    </div>
                    <Separator />
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{selectedConversation.contract.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedConversation.contract.scheduledDate} at {selectedConversation.contract.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Payment Summary
                  </h3>
                  <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="text-lg font-bold text-primary">
                        ${selectedConversation.contract.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paid:</span>
                      <span className="text-sm font-semibold text-green-600">
                        ${selectedConversation.contract.paidAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${selectedConversation.contract.totalAmount - selectedConversation.contract.paidAmount}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Payment Phases */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    Payment Phases
                  </h3>
                  <div className="space-y-3">
                    {selectedConversation.contract.phases.map((phase, index) => (
                      <div key={phase.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-semibold">Phase {index + 1}</span>
                              {getPhaseStatusBadge(phase.status)}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{phase.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-primary">${phase.amount}</span>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(phase.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        {phase.status === "pending" &&
                          selectedConversation.contract.status === "in-progress" &&
                          index === 1 && (
                            <Button size="sm" className="w-full mt-3" onClick={() => handleReleasePayment(phase.id)}>
                              <Shield className="h-3 w-3 mr-2" />
                              Release Payment from Escrow
                            </Button>
                          )}
                        {phase.status === "completed" && (
                          <div className="mt-3 flex items-center justify-between bg-green-50 rounded px-2 py-1.5">
                            <span className="text-xs text-green-700 font-medium">Paid on {phase.completedDate}</span>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                    Milestones
                  </h3>
                  <div className="space-y-2">
                    {selectedConversation.contract.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center ${
                            milestone.completed ? "bg-green-500" : "bg-gray-200"
                          }`}
                        >
                          {milestone.completed && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${milestone.completed ? "line-through text-gray-500" : "font-medium"}`}
                          >
                            {milestone.name}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(milestone.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Actions */}
                <div className="space-y-2">
                  {selectedConversation.contract.status === "negotiating" && (
                    <>
                      <Button className="w-full" onClick={handleAcceptContract}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Contract
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent" onClick={handleRejectContract}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Contract
                      </Button>
                    </>
                  )}
                  {selectedConversation.contract.status === "in-progress" && (
                    <>
                      <Button className="w-full" onClick={handleCompleteJob}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => setShowDisputeModal(true)}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Open Dispute
                      </Button>
                    </>
                  )}
                  {selectedConversation.contract.status === "completed" && (
                    <>
                      <Button className="w-full" onClick={() => setShowReviewModal(true)}>
                        <Star className="h-4 w-4 mr-2" />
                        Leave Review
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        View Receipt
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Share your experience with {selectedConversation.participant.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Rating</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment" className="text-sm font-medium mb-2 block">
                Your Review
              </Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Open a Dispute</span>
            </DialogTitle>
            <DialogDescription>Describe the issue you're experiencing with this contract</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dispute-reason" className="text-sm font-medium mb-2 block">
                Reason for Dispute
              </Label>
              <Input
                id="dispute-reason"
                placeholder="e.g., Work not completed as agreed"
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dispute-description" className="text-sm font-medium mb-2 block">
                Detailed Description
              </Label>
              <Textarea
                id="dispute-description"
                placeholder="Provide details about the issue..."
                value={disputeForm.description}
                onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Opening a dispute will pause all payments and notify our support team. We'll work with both parties to
                resolve the issue.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDispute}
              disabled={!disputeForm.reason || !disputeForm.description}
            >
              Open Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
