import React, { createContext, useContext, useState } from "react"

const AdminNotificationContext = createContext(null)

const initialNotifications = [
  {
    id: "notif-1",
    title: "Surge Warning Triggered",
    message: "Rain surge applied (1.25x) in Electronic City corridor.",
    time: "10 mins ago",
    unread: true,
    type: "warning",
  },
  {
    id: "notif-2",
    title: "New Admin Account Assigned",
    message: "Rohan Kapoor granted Admin role permissions.",
    time: "45 mins ago",
    unread: true,
    type: "info",
  },
  {
    id: "notif-3",
    title: "High API Traffic Detected",
    message: "Ride compare endpoint traffic spiked by +28% this hour.",
    time: "2 hours ago",
    unread: false,
    type: "success",
  },
]

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      removeToast(id)
    }, 3800)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <AdminNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  )
}

export function useAdminNotification() {
  const context = useContext(AdminNotificationContext)
  if (!context) {
    throw new Error("useAdminNotification must be used within AdminNotificationProvider")
  }
  return context
}
