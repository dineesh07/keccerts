"use client";

/**
 * Admin route layout — replaces the public Navbar/Footer with the AdminShell.
 * Auth guard: if not logged in and not on the login page, redirect to /admin/login.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/adminAuth";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onLoginPage = pathname === "/admin/login" || pathname === "/admin";
    if (!onLoginPage && !isAdminLoggedIn()) {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  // Login page renders bare (no sidebar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
