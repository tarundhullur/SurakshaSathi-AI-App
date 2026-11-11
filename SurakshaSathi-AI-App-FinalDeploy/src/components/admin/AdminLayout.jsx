import React, { useState } from "react"
import { Outlet } from "react-router-dom"
import AdminSidebar from "./AdminSidebar.jsx"
import AdminHeader from "./AdminHeader.jsx"
import ToastContainer from "./ToastContainer.jsx"

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#070D1A] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <ToastContainer />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
