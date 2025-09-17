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
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface JobApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: {
    id: string
    title: string
    category: string
    budget: string
    timeline: string
    location: string
    description: string
  }
  onSubmitApplication: (application: { quote: string; timeline: string; message: string }) => Promise<void>
}

export function JobApplicationModal({ open, onOpenChange, job, onSubmitApplication }: JobApplicationModalProps) {
  const [quote, setQuote] = useState("")
  const [timeline, setTimeline] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!quote.trim() || !timeline.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmitApplication({ quote, timeline, message })
      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the customer.",
        variant: "default",
      })
      setQuote("")
      setTimeline("")
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" />
            Apply for Job
          </DialogTitle>
          <DialogDescription>Submit your proposal for this project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-navy-900">{job.title}</h3>
            <Badge variant="secondary" className="mt-1">
              {job.category}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{job.budget}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{job.timeline}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <MapPin className="h-3 w-3" />
              <span>{job.location}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quote">Your Quote *</Label>
              <Input id="quote" placeholder="$500" value={quote} onChange={(e) => setQuote(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="timeline">Your Timeline *</Label>
              <Input
                id="timeline"
                placeholder="3-5 days"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="message">Cover Letter *</Label>
            <Textarea
              id="message"
              placeholder="Explain why you're the right fit for this project, your relevant experience, and your approach..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !quote.trim() || !timeline.trim() || !message.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
