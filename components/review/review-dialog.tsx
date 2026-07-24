"use client"

import { useState } from "react"
import { Star, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { submitReview } from "@/lib/api"

interface ReviewDialogProps {
  open: boolean
  onClose: () => void
  revieweeId: string
  revieweeName: string
  jobId?: string
  jobTitle?: string
  onSubmitted?: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              s <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

export function ReviewDialog({
  open,
  onClose,
  revieweeId,
  revieweeName,
  jobId,
  jobTitle,
  onSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await submitReview({
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || undefined,
        job_id: jobId,
      })
      setDone(true)
      onSubmitted?.()
    } catch (err: any) {
      setError(err?.message || "Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setComment("")
    setDone(false)
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{done ? "Review submitted!" : `Review ${revieweeName}`}</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <div className="text-4xl">⭐</div>
            <p className="text-sm text-slate-600">
              Thank you for your feedback. Your review helps others make better decisions.
            </p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {jobTitle && (
              <p className="text-xs text-slate-500">
                For: <span className="font-medium text-slate-700">{jobTitle}</span>
              </p>
            )}

            {/* Star picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Overall rating</label>
              <div className="flex items-center gap-3">
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <span className="text-sm font-medium text-yellow-600">
                    {RATING_LABELS[rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Written review <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your experience working with ${revieweeName}...`}
                rows={4}
                maxLength={2000}
                className="resize-none text-sm"
              />
              <p className="text-right text-xs text-slate-400">{comment.length}/2000</p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 animate-pulse" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
