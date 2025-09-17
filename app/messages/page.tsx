import Header from "@/components/header"
import { MessagingInterface } from "@/components/messaging/messaging-interface"

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MessagingInterface />
    </div>
  )
}
