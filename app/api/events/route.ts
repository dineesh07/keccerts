import { NextResponse } from "next/server";
import { getEvents, addEvent } from "@/lib/mockEvents";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      return NextResponse.json({ success: true, data });
    }
  } catch {
    // fallback
  }
  return NextResponse.json({ success: true, data: getEvents() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await addEvent(body);
    return NextResponse.json({ success: true, data: body });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to save event" }, { status: 500 });
  }
}
