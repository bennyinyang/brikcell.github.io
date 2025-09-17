"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContactArtisanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artisan: {
    id: string
    name: string
    avatar: string
    rating: number
    category: string
    responseTime: string
  }
  onSendMessage: (message: { subject: string; message: string }) => Promise<void>
}

export function ContactArtisanModal({ open, onOpenChange, artisan, onSendMessage }: ContactArtisanModalProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await onSendMessage({ subject, message })
      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${artisan.name}.`,
        variant: "default",
      })
      setSubject("")
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageCircle className="h-5 w-5" />
            Contact Artisan
          </DialogTitle>
          <DialogDescription>Send a message to discuss your project requirements.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={artisan.avatar || "/placeholder.svg"} alt={artisan.name} />
            <AvatarFallback>
              {artisan.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-navy-900">{artisan.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {artisan.category}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">{artisan.rating}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Responds in {artisan.responseTime}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What's your project about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your project requirements, timeline, and any specific questions..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
