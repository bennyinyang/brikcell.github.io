"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  Archive,
  VolumeX,
  Trash2,
  Flag,
  KanbanSquareDashed as MarkAsUnread,
  AlertTriangle,
  Shield,
} from "lucide-react"

// Mock data for conversations
const conversations = [
  {
    id: 1,
    participant: {
      name: "Sarah Johnson",
      avatar: "/professional-hairstylist-woman.png",
      service: "Hair Styling",
      isOnline: true,
    },
    lastMessage: {
      text: "Perfect! I'll see you tomorrow at 2 PM for the hair styling session.",
      timestamp: "2024-01-15T14:30:00Z",
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
    jobTitle: "Wedding Hair Styling",
    jobBudget: "$150",
  },
  {
    id: 2,
    participant: {
      name: "Mike Rodriguez",
      avatar: "/professional-plumber.png",
      service: "Plumbing",
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
    jobTitle: "Kitchen Plumbing Repair",
    jobBudget: "$150",
  },
  {
    id: 3,
    participant: {
      name: "David Chen",
      avatar: "/professional-carpenter.png",
      service: "Carpentry",
      isOnline: true,
    },
    lastMessage: {
      text: "Thanks for the great review! It was a pleasure working on your bookshelf project.",
      timestamp: "2024-01-14T16:45:00Z",
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
    jobTitle: "Custom Bookshelf",
    jobBudget: "$300",
  },
]

// Mock messages for active conversation
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
    text: "The kitchen sink has been leaking for a few days, and I think the faucet needs to be replaced too. Here are some photos of the current situation.",
    timestamp: "2024-01-15T10:10:00Z",
    sender: "me",
    status: "read",
    attachments: [
      { type: "image", url: "/kitchen-sink-leak.jpg", name: "kitchen-sink-leak.jpg" },
      { type: "image", url: "/old-faucet.jpg", name: "old-faucet.jpg" },
    ],
  },
  {
    id: 4,
    text: "Thanks for the photos! I can see the issue clearly. This looks like a straightforward repair. I can replace the faucet and fix the leak. My rate is $80/hour and I estimate this will take about 2-3 hours.",
    timestamp: "2024-01-15T10:20:00Z",
    sender: "them",
    status: "read",
  },
  {
    id: 5,
    text: "That sounds reasonable. When would you be available to start the work?",
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
  const [showConversationList, setShowConversationList] = useState(true)
  const [conversationState, setConversationState] = useState({
    isMuted: false,
    isArchived: false,
    isBlocked: false,
    isUnread: false,
  })
  const [conversationStates, setConversationStates] = useState<
    Record<
      number,
      {
        isMuted: boolean
        isArchived: boolean
        isBlocked: boolean
        isUnread: boolean
      }
    >
  >({})
  const [modals, setModals] = useState({
    blockUser: false,
    reportUser: false,
    deleteConversation: false,
    reportSuccess: false,
  })

  const [reportForm, setReportForm] = useState({
    reason: "",
    description: "",
  })

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

  const sendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via API/socket
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const handleMuteConversation = () => {
    setConversationState((prev) => ({ ...prev, isMuted: !prev.isMuted }))
    setConversationStates((prev) => ({
      ...prev,
      [selectedConversation.id]: {
        ...prev[selectedConversation.id],
        isMuted: !conversationState.isMuted,
      },
    }))
    const action = conversationState.isMuted ? "Unmuted" : "Muted"
    console.log(`${action} conversation with ${selectedConversation.participant.name}`)
  }

  const handleArchiveConversation = () => {
    setConversationState((prev) => ({ ...prev, isArchived: !prev.isArchived }))
    setConversationStates((prev) => ({
      ...prev,
      [selectedConversation.id]: {
        ...prev[selectedConversation.id],
        isArchived: !conversationState.isArchived,
      },
    }))
    const action = conversationState.isArchived ? "Unarchived" : "Archived"
    console.log(`${action} conversation with ${selectedConversation.participant.name}`)
  }

  const handleDeleteConversation = () => {
    setModals((prev) => ({ ...prev, deleteConversation: true }))
  }

  const confirmDeleteConversation = () => {
    console.log("Deleting conversation with", selectedConversation.participant.name)
    setModals((prev) => ({ ...prev, deleteConversation: false }))
    // In a real app, this would delete the conversation and redirect to conversation list
  }

  const handleBlockUser = () => {
    setModals((prev) => ({ ...prev, blockUser: true }))
  }

  const confirmBlockUser = () => {
    console.log("Blocking user", selectedConversation.participant.name)
    setModals((prev) => ({ ...prev, blockUser: false }))
    setConversationStates((prev) => ({
      ...prev,
      [selectedConversation.id]: {
        ...prev[selectedConversation.id],
        isBlocked: true,
      },
    }))
    setConversationState((prev) => ({ ...prev, isBlocked: true }))
  }

  const handleReportUser = () => {
    setModals((prev) => ({ ...prev, reportUser: true }))
  }

  const confirmReportUser = () => {
    if (!reportForm.reason) {
      return // Don't proceed without a reason
    }

    console.log("Reported user", selectedConversation.participant.name, {
      reason: reportForm.reason,
      description: reportForm.description,
    })

    // Close report modal and show success modal
    setModals((prev) => ({ ...prev, reportUser: false, reportSuccess: true }))

    // Reset form
    setReportForm({ reason: "", description: "" })
  }

  const closeModal = (modalName: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalName]: false }))
    if (modalName === "reportUser") {
      setReportForm({ reason: "", description: "" })
    }
  }

  const handleMarkAsUnread = () => {
    setConversationState((prev) => ({ ...prev, isUnread: !prev.isUnread }))
    setConversationStates((prev) => ({
      ...prev,
      [selectedConversation.id]: {
        ...prev[selectedConversation.id],
        isUnread: !conversationState.isUnread,
      },
    }))
    const action = conversationState.isUnread ? "Mark as Read" : "Mark as Unread"
    console.log(`${action} conversation with ${selectedConversation.participant.name}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 ${showConversationList ? "block" : "hidden"} lg:block`}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <CardTitle className="flex items-center justify-between">
              <span className="text-base sm:text-lg lg:text-xl">Messages</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {conversations.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-8 w-8 p-0 text-lg font-bold hover:bg-gray-100"
                  onClick={() => setShowConversationList(false)}
                >
                  ×
                </Button>
              </div>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)]">
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 w-full">
                {filteredConversations.map((conversation) => {
                  const convState = conversationStates[conversation.id] || {
                    isMuted: false,
                    isArchived: false,
                    isBlocked: false,
                    isUnread: false,
                  }

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`group relative cursor-pointer transition-all duration-300 hover:-translate-y-0.5 rounded-2xl sm:rounded-3xl overflow-hidden ${
                        selectedConversation.id === conversation.id
                          ? "bg-white/90 backdrop-blur-md shadow-xl border border-primary/30 ring-1 ring-primary/20"
                          : "bg-white/70 backdrop-blur-sm hover:bg-white/85 hover:shadow-lg border border-gray-200/60 hover:border-primary/20"
                      } ${convState.isArchived ? "opacity-60" : ""}`}
                    >
                      {/* ... existing gradient overlay ... */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                          selectedConversation.id === conversation.id
                            ? "from-primary/8 via-primary/4 to-transparent opacity-100"
                            : "from-primary/4 via-primary/2 to-transparent opacity-0 group-hover:opacity-100"
                        }`}
                      ></div>

                      {/* ... existing unread indicator ... */}
                      {(selectedConversation.id === conversation.id ||
                        convState.isUnread ||
                        (!conversation.lastMessage.isRead && conversation.unreadCount > 0)) && (
                        <div
                          className={`absolute top-3 sm:top-4 left-3 sm:left-4 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                            selectedConversation.id === conversation.id
                              ? "bg-primary shadow-lg shadow-primary/30"
                              : convState.isUnread || (!conversation.lastMessage.isRead && conversation.unreadCount > 0)
                                ? "bg-primary/80 shadow-md shadow-primary/20"
                                : "bg-primary/40"
                          }`}
                        ></div>
                      )}

                      <div className="relative p-3 sm:p-4 lg:p-5">
                        <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 ring-2 ring-white/60 shadow-lg">
                              <AvatarImage
                                src={conversation.participant.avatar || "/placeholder.svg"}
                                alt={conversation.participant.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-primary font-bold text-sm sm:text-base lg:text-lg">
                                {conversation.participant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.participant.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 bg-green-500 border-2 sm:border-3 border-white rounded-full shadow-md"></div>
                            )}
                            {convState.isBlocked && (
                              <div className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                                <Shield className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base lg:text-base">
                                  {conversation.participant.name}
                                </h3>
                                <div className="flex items-center space-x-1 sm:space-x-1.5">
                                  {convState.isMuted && <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />}
                                  {convState.isArchived && (
                                    <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                                <span className="text-xs sm:text-xs font-medium text-gray-500">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                                {(convState.isUnread ||
                                  (!conversation.lastMessage.isRead && conversation.unreadCount > 0)) && (
                                  <div className="relative">
                                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center p-0 shadow-primary/30 font-bold shadow-none">
                                      {conversation.unreadCount}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-primary/15 to-primary/10 text-primary border-0 font-medium rounded-full"
                              >
                                {conversation.participant.service}
                              </Badge>
                              <span className="text-xs sm:text-sm font-bold text-primary bg-primary/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                {conversation.jobBudget}
                              </span>
                            </div>

                            <div className="mb-2 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed line-clamp-2 sm:line-clamp-1 lg:line-clamp-2 break-words w-auto">
                                {conversation.lastMessage.text}
                              </p>
                              <div className="flex items-center mt-1.5 sm:mt-2 space-x-2">
                                <span className="text-xs text-gray-500 font-medium truncate bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full max-w-[120px] sm:max-w-[160px] lg:max-w-[200px]">
                                  {conversation.jobTitle}
                                </span>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {conversation.lastMessage.sender === "me" && (
                                    <div className="flex-shrink-0">
                                      {getMessageStatus(conversation.lastMessage.isRead ? "read" : "delivered")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ... existing bottom gradient line ... */}
                      <div
                        className={`absolute bottom-0 left-4 sm:left-6 right-4 sm:right-6 h-0.5 bg-gradient-to-r transition-opacity duration-300 ${
                          selectedConversation.id === conversation.id
                            ? "from-transparent via-primary/40 to-transparent opacity-100"
                            : "from-transparent via-gray-300/50 to-transparent opacity-0 group-hover:opacity-100"
                        }`}
                      ></div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className={`lg:col-span-2 flex flex-col ${showConversationList ? "hidden" : "block"} lg:block`}>
          {/* Chat Header */}
          <CardHeader className="pb-2 sm:pb-3 border-b px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-9 w-9 p-0 flex-shrink-0 text-lg hover:bg-gray-100"
                  onClick={() => setShowConversationList(true)}
                >
                  ←
                </Button>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
                    <AvatarImage
                      src={selectedConversation.participant.avatar || "/placeholder.svg"}
                      alt={selectedConversation.participant.name}
                    />
                    <AvatarFallback className="text-xs sm:text-sm lg:text-base">
                      {selectedConversation.participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate">
                      {selectedConversation.participant.name}
                    </h3>
                    {conversationState.isMuted && (
                      <Badge variant="secondary" className="text-xs">
                        Muted
                      </Badge>
                    )}
                    {conversationState.isBlocked && (
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                    )}
                    {conversationState.isUnread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {conversationState.isBlocked
                      ? "User blocked"
                      : selectedConversation.participant.isOnline
                        ? "Online"
                        : `Last seen ${selectedConversation.participant.lastSeen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors bg-transparent h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  <Phone className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors bg-transparent h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  <Video className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors bg-transparent h-9 w-9 sm:h-10 sm:w-10 p-0"
                    >
                      <MoreVertical className="h-4 w-4 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={handleMarkAsUnread}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <MarkAsUnread className="h-4 w-4 mr-2" />
                      {conversationState.isUnread ? "Mark as Read" : "Mark as Unread"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleMuteConversation}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      {conversationState.isMuted ? "Unmute Conversation" : "Mute Conversation"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleArchiveConversation}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      {conversationState.isArchived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleBlockUser}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                      disabled={conversationState.isBlocked}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {conversationState.isBlocked ? "User Blocked" : "Block User"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleReportUser}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteConversation}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Job Context */}
            <div className="bg-primary/5 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-primary truncate">
                    {selectedConversation.jobTitle}
                  </p>
                  <p className="text-xs text-primary/70">Budget: {selectedConversation.jobBudget}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0 ml-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <span className="hidden sm:inline">View Job Details</span>
                  <span className="sm:hidden">Details</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-18rem)] sm:h-[calc(100vh-22rem)] lg:h-[calc(100vh-28rem)] p-3 sm:p-4 lg:p-6">
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-md ${message.sender === "me" ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${
                          message.sender === "me" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm sm:text-base leading-relaxed break-words">{message.text}</p>
                        {message.attachments && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="bg-white/20 rounded p-2">
                                <div className="flex items-center space-x-2">
                                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm truncate">{attachment.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`flex items-center mt-1.5 space-x-1 ${
                          message.sender === "me" ? "justify-end" : "justify-start"
                        }`}
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
          <div className="border-t p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0 bg-transparent"
              >
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0 bg-transparent"
              >
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={modals.blockUser} onOpenChange={() => closeModal("blockUser")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <span>Block User</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to block <strong>{selectedConversation.participant.name}</strong>? They will no
              longer be able to contact you or see your profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => closeModal("blockUser")}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBlockUser} className="bg-orange-500 hover:bg-orange-600">
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modals.reportUser} onOpenChange={() => closeModal("reportUser")}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flag className="h-5 w-5 text-red-500" />
              <span>Report User</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Report <strong>{selectedConversation.participant.name}</strong> for inappropriate behavior. Please select
              a reason and provide additional details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Reason for reporting</Label>
              <RadioGroup
                value={reportForm.reason}
                onValueChange={(value) => setReportForm((prev) => ({ ...prev, reason: value }))}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" />
                  <Label htmlFor="harassment" className="text-sm">
                    Harassment or bullying
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="text-sm">
                    Inappropriate content or behavior
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam" className="text-sm">
                    Spam or unwanted messages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fraud" id="fraud" />
                  <Label htmlFor="fraud" className="text-sm">
                    Fraud or scam
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake" id="fake" />
                  <Label htmlFor="fake" className="text-sm">
                    Fake profile or impersonation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-sm">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional details (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide any additional context that might help our team review this report..."
                value={reportForm.description}
                onChange={(e) => setReportForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => closeModal("reportUser")}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReportUser}
              className="bg-red-500 hover:bg-red-600"
              disabled={!reportForm.reason}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modals.reportSuccess} onOpenChange={() => closeModal("reportSuccess")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <span>Report Submitted</span>
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                Thank you for reporting <strong>{selectedConversation.participant.name}</strong>. Your report has been
                submitted successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 text-sm mb-1">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Our team will review your report within 24 hours</li>
                  <li>• We may contact you if we need additional information</li>
                  <li>• Appropriate action will be taken if violations are found</li>
                  <li>• You'll receive an update on the outcome</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Report ID:{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">RPT-{Date.now().toString().slice(-6)}</code>
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => closeModal("reportSuccess")} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modals.deleteConversation} onOpenChange={() => closeModal("deleteConversation")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete Conversation</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete this conversation with{" "}
              <strong>{selectedConversation.participant.name}</strong>? This action cannot be undone and all messages
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => closeModal("deleteConversation")}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConversation}>
              Delete Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
