"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/adminAuth";

export default function AdminRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isAdminLoggedIn() ? "/admin/dashboard" : "/admin/login");
  }, [router]);
  return null;
}
