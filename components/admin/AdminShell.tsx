"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  CalendarDays,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { clearAdminSession } from "@/lib/adminAuth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard",      icon: <LayoutDashboard size={18} /> },
  { href: "/admin/templates", label: "Cert Templates", icon: <Sliders size={18} /> },
  { href: "/admin/upload",    label: "Upload Details",  icon: <Upload size={18} /> },
  { href: "/admin/events",    label: "Manage Events",  icon: <CalendarDays size={18} /> },
];


export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  const SidebarContent = () => (
    <>
      {/* Nav links */}
      <nav className="admin-sidebar__nav" aria-label="Admin navigation" style={{ paddingTop: "1rem" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${active ? "admin-nav-item--active" : ""}`}
              onClick={() => setSidebarOpen(false)}
              aria-current={active ? "page" : undefined}
            >
              <span className="admin-nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="admin-nav-item__chevron" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / logout */}
      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__session">
          <ShieldCheck size={14} />
          <span>Logged in as <strong>kec-admin</strong></span>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} aria-label="Log out of admin portal">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      {/* Desktop sidebar */}
      <aside className="admin-sidebar admin-sidebar--desktop" aria-label="Admin sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`admin-sidebar admin-sidebar--mobile ${sidebarOpen ? "admin-sidebar--open" : ""}`}
        aria-label="Admin sidebar"
      >
        <button
          className="admin-sidebar__close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="admin-main">
        {/* Mobile topbar */}
        <header className="admin-topbar">
          <button
            className="admin-topbar__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <span className="admin-topbar__title">Kongu Engineering College Admin Portal</span>
          <button className="admin-topbar__logout" onClick={handleLogout} aria-label="Logout">
            <LogOut size={18} />
          </button>
        </header>

        {/* Page content */}
        <main className="admin-content" id="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
