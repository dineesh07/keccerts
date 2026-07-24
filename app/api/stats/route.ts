import { NextResponse } from "next/server";
import { fetchPortalStats } from "@/lib/mockApi";

export const revalidate = 0; // Disable static caching so stats are fetched in real-time

export async function GET() {
  try {
    const stats = await fetchPortalStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
