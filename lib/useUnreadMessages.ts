"use client"

import { useEffect, useState } from "react"
import { getAuth, listChatRooms } from "./api"

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    const auth = getAuth()
    if (!auth?.token || !auth?.user?.id) return

    // Initial fetch from API
    const fetchCount = () => {
      listChatRooms()
        .then((rooms: any) => {
          const arr: any[] = Array.isArray(rooms) ? rooms : (rooms?.data ?? [])
          const total = arr.reduce((sum, r) => sum + (Number(r.unreadCount) || 0), 0)
          setTotalUnread(total)
        })
        .catch(() => {})
    }

    fetchCount()

    // Real-time: messaging interface dispatches this whenever conversations change
    const handleTotal = (e: Event) => {
      const total = (e as CustomEvent<{ total: number }>).detail?.total ?? 0
      setTotalUnread(total)
    }
    window.addEventListener("brikcell:unread-total", handleTotal)

    // Fallback: re-sync from API on window focus and every 60 seconds
    const interval = setInterval(fetchCount, 60_000)
    window.addEventListener("focus", fetchCount)

    return () => {
      window.removeEventListener("brikcell:unread-total", handleTotal)
      clearInterval(interval)
      window.removeEventListener("focus", fetchCount)
    }
  }, [])

  return totalUnread
}
