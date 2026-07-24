"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { sendContactForm } from "@/lib/api"
import { Mail, MapPin, Clock, Send, MessageCircle, Phone } from "lucide-react"

const contactDetails = [
  {
    icon: Mail,
    label: "Email us",
    value: "brikcellsupport@mail.com",
    sub: "We reply within 24 hours",
  },
  {
    icon: Phone,
    label: "Call us",
    value: "+234 800 000 0000",
    sub: "Mon – Fri, 9 am – 6 pm WAT",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Lagos, Nigeria",
    sub: "Brikcell Marketplace HQ",
  },
  {
    icon: Clock,
    label: "Support hours",
    value: "Mon – Sat",
    sub: "9:00 am – 7:00 pm WAT",
  },
]

const subjects = [
  "General Enquiry",
  "Account & Billing",
  "Technical Support",
  "Partnership",
  "Report an Issue",
  "Other",
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      await sendContactForm(form)
      setSent(true)
      toast.success("Message sent! We'll be in touch soon.")
    } catch {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero strip */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <MessageCircle className="h-4 w-4" />
            We'd love to hear from you
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Have a question, idea, or need help? Drop us a message and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left — contact details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Contact information</h2>
              <p className="text-sm text-gray-500">Reach out through any of the channels below.</p>
            </div>

            <div className="space-y-4">
              {contactDetails.map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-[family-name:var(--font-manrope)]">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 font-[family-name:var(--font-manrope)]">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-[family-name:var(--font-urbanist)]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-1 text-gray-900">Looking to hire an artisan?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Browse our marketplace to find verified, skilled professionals near you.
              </p>
              <a
                href="/search"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Explore artisans →
              </a>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <Send className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Thanks for reaching out. We'll get back to you at <span className="font-medium text-gray-700">{form.email}</span> within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Send us a message</h2>
                    <p className="text-sm text-gray-500 mt-1">Fill in the form and we'll respond within 24 hours.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Full name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={form.name}
                        onChange={set("name")}
                        className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Email address *</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Subject *</Label>
                    <select
                      value={form.subject}
                      onChange={set("subject")}
                      required
                      className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="" disabled>Select a subject…</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Message *</Label>
                    <Textarea
                      placeholder="Tell us how we can help…"
                      value={form.message}
                      onChange={set("message")}
                      rows={6}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>

                  <p className="text-[11px] text-gray-400 text-center">
                    By submitting this form you agree to our{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      
    </div>
  )
}
