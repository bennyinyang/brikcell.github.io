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
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface JobConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobData: {
    title: string
    category: string
    budget: string
    timeline: string
    location: string
    description: string
  }
  onConfirm: () => void
}

export function JobConfirmationModal({ open, onOpenChange, jobData, onConfirm }: JobConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      toast({
        title: "Job Posted Successfully!",
        description: "Your job has been posted and artisans will start applying soon.",
        variant: "default",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Confirm Job Posting
          </DialogTitle>
          <DialogDescription>Please review your job details before posting.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">{jobData.title}</h3>
            <Badge variant="secondary" className="mt-1">
              {jobData.category}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Budget: {jobData.budget}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Timeline: {jobData.timeline}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Location: {jobData.location}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 line-clamp-3">{jobData.description}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Edit Job
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? "Posting..." : "Post Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
