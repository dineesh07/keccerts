import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rollNo = searchParams.get("rollNo");

  if (!rollNo) {
    return NextResponse.json({ success: false, error: "rollNo query parameter is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("participations")
      .select("*")
      .ilike("roll_no", rollNo.trim())
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const certificates = (data || []).map((row) => ({
      id: row.id,
      rollNo: row.roll_no,
      studentName: row.student_name,
      contestName: row.contest_name,
      eventId: row.event_id,
      date: row.date,
      certificateUrl: row.certificate_url,
      status: row.status || "generated",
      generatedAt: row.generated_at,
    }));

    return NextResponse.json({ success: true, data: certificates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch certificates" }, { status: 500 });
  }
}
