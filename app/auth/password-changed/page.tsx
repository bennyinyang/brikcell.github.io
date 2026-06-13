"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function PasswordChangedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/auth/login")
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <AuthImagePanel />

        <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <CheckCircle2 className="h-4 w-4 text-slate-700" />
            </div>

            <div className="mb-7">
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
                Password reset
              </h1>
              <p className="mt-3 text-[13px] leading-5 text-slate-500">
                Your password has been successfully reset. Click below to log in.
              </p>
            </div>

            <Button
              asChild
              className="h-11 w-full rounded-md bg-primary text-[14px] font-medium text-white hover:bg-primary/90"
            >
              <Link href="/auth/login">Back to login</Link>
            </Button>
          </div>

          <SupportEmail />
        </section>
      </div>
    </main>
  )
}

function AuthImagePanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden lg:block">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/auth/forgot-hero.png')",
        }}
      />
    </section>
  )
}

function SupportEmail() {
  return (
    <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[12px] text-slate-500 lg:flex">
      <Mail className="h-4 w-4" />
      support@brikcell.com
    </div>
  )
}