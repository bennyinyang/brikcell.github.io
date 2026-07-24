import { Suspense } from "react";
import Header from "@/components/header";
import { MessagingInterface } from "@/components/messaging/messaging-interface";

export const dynamic = "force-dynamic";

function MessagingSkeletonFallback() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="hidden w-80 shrink-0 border-r border-slate-100 p-4 lg:block">
        <div className="mb-4 h-10 w-full animate-pulse rounded-md bg-slate-100" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div className={`h-10 animate-pulse rounded-2xl bg-slate-100 ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 p-4">
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<MessagingSkeletonFallback />}>
        <MessagingInterface />
      </Suspense>
    </div>
  );
}