"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  type NotificationDTO,
  getAuth,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api"
import { getSocket } from "./socket-client"

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const fetchedRef = useRef(false)

  const fetchAll = useCallback(async () => {
    const auth = getAuth()
    if (!auth?.token || !auth?.user?.id) {
      setLoading(false)
      return
    }
    try {
      const [listRes, countRes] = await Promise.all([
        listNotifications(1, 30),
        getUnreadNotificationCount(),
      ])
      setNotifications(listRes.notifications ?? [])
      setTotal(listRes.total ?? 0)
      setUnreadCount(countRes.count ?? 0)
    } catch {
      // silently ignore — notification failure should never block the UI
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const auth = getAuth()
    if (!auth?.token || !auth?.user?.id) {
      setLoading(false)
      return
    }

    fetchAll()

    // Real-time: new notification pushed from server
    const socket = getSocket(auth.token)
    const handleNew = (notif: NotificationDTO) => {
      setNotifications((prev) => [notif, ...prev])
      setUnreadCount((n) => n + 1)
      setTotal((n) => n + 1)
    }
    socket.on("notification:new", handleNew)

    // Fallback poll on focus and every 90 seconds
    const interval = setInterval(fetchAll, 90_000)
    window.addEventListener("focus", fetchAll)

    return () => {
      socket.off("notification:new", handleNew)
      clearInterval(interval)
      window.removeEventListener("focus", fetchAll)
    }
  }, [fetchAll])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((n) => Math.max(0, n - 1))
    await markNotificationRead(id).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await markAllNotificationsRead().catch(() => {})
  }, [])

  return { notifications, unreadCount, total, loading, markRead, markAllRead, refetch: fetchAll }
}
