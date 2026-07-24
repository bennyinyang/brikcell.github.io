"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getAuth, submitFeedback, getMyFeedback } from "@/lib/api"
import { MessageSquarePlus, Star, CheckCircle, Clock, ChevronDown } from "lucide-react"

const categories = [
  "General Feedback",
  "Feature Request",
  "Bug Report",
  "UI / Design",
  "Performance",
  "Customer Support",
  "Other",
]

const STARS_LABEL = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-300"
            }`}
          />
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {STARS_LABEL[hovered || value]}
        </span>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function FeedbackPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [form, setForm] = useState({ rating: 0, category: "", title: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    if (!auth?.token) {
      setIsLoggedIn(false)
      setHistoryLoading(false)
      return
    }
    setIsLoggedIn(true)
    getMyFeedback()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) { router.push("/auth/login"); return }
    if (form.rating === 0) { toast.error("Please select a star rating."); return }
    if (!form.category) { toast.error("Please select a category."); return }
    if (!form.title.trim() || !form.message.trim()) { toast.error("Please fill in all fields."); return }

    setLoading(true)
    try {
      const item = await submitFeedback(form)
      setHistory((prev) => [item, ...prev])
      setSent(true)
      toast.success("Thank you for your feedback!")
    } catch {
      toast.error("Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ rating: 0, category: "", title: "", message: "" })
    setSent(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20 overflow-hidden">
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <MessageSquarePlus className="h-4 w-4" />
            Your voice shapes Brikcell
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">Share Your Feedback</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Tell us what's working, what isn't, or what you'd love to see next. Every submission is read by our team.
          </p>
        </div>
      </section>

      <section className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left — info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Why your feedback matters</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We read every submission and use it to improve the platform for artisans and employers alike.
              </p>
            </div>

            {[
              { icon: "", title: "Shape new features", desc: "Your requests directly influence our roadmap." },
              { icon: "", title: "Fix what's broken", desc: "Bug reports help us keep the platform reliable." },
              { icon: "", title: "Rate your experience", desc: "Star ratings help us measure satisfaction over time." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 font-[family-name:var(--font-manrope)]">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-[family-name:var(--font-urbanist)]">{desc}</p>
                </div>
              </div>
            ))}

            {/* Previous submissions */}
            {isLoggedIn && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Your past submissions
                </h3>
                {historyLoading ? (
                  <p className="text-xs text-gray-400">Loading…</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-gray-400">No submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[70%]">{item.title}</span>
                          <span className="text-[10px] text-amber-500 font-semibold">
                            {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{item.category}</span>
                          <span className="text-[10px] text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <CheckCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Feedback received!</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Thank you for taking the time to share. Our team will review your submission shortly.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={resetForm}>
                    Submit another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Submit feedback</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isLoggedIn === false
                        ? "Please sign in to submit feedback."
                        : "All fields are required."}
                    </p>
                  </div>

                  {/* Star rating */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Overall experience *</Label>
                    <StarRating value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Category *</Label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        required
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-sm text-gray-900 appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" disabled>Select a category…</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Title *</Label>
                    <Input
                      placeholder="Summarise your feedback in one line"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Details *</Label>
                    <Textarea
                      placeholder="Tell us more — the more detail, the better we can act on it."
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      rows={5}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || isLoggedIn === false}
                    className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-sm"
                    onClick={isLoggedIn === false ? () => router.push("/auth/login") : undefined}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Submitting…
                      </span>
                    ) : isLoggedIn === false ? (
                      "Sign in to submit"
                    ) : (
                      <span className="flex items-center gap-2">
                        <MessageSquarePlus className="h-4 w-4" />
                        Submit Feedback
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
