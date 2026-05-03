import { Suspense } from "react";
import Header from "@/components/header";
import { MessagingInterface } from "@/components/messaging/messaging-interface";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <MessagingInterface />
      </Suspense>
    </div>
  );
}