import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ParticipantRecord } from "@/types";

// Extend Vercel serverless function timeout.
// Default is 10s (Hobby) which is too short for sharp image processing + Supabase uploads.
// Max on Hobby plan is 60s; Pro plan allows up to 300s.
export const maxDuration = 60;

function toValidIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const cleanStr = trimmed.replace(/–\d+/, "").replace(/-\d+/, "");
  const parsed = Date.parse(cleanStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (!/\d{4}/.test(trimmed)) {
      d.setFullYear(new Date().getFullYear());
    }
    return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, contestName, date, participants } = body;

    if (!eventId || !contestName || !Array.isArray(participants)) {
      return NextResponse.json(
        { success: false, error: "eventId, contestName, and participants array are required" },
        { status: 400 }
      );
    }

    const issueDate = toValidIsoDate(date);


    const results: ParticipantRecord[] = [];
    let successCount = 0;

    for (const p of participants as ParticipantRecord[]) {
      if (!p.name || !p.rollNo) {
        results.push({ ...p, status: "failed", error: "Missing Name or Roll Number" });
        continue;
      }

      try {
        const rollUpper = p.rollNo.trim().toUpperCase();
        const cleanName = p.name.trim();

        // 2. Set dynamic certificate URL
        const certificateUrl = `/api/certificates/download?rollNo=${encodeURIComponent(rollUpper)}&eventId=${encodeURIComponent(eventId)}`;

        // 3. Upsert student profile in Supabase
        await supabase.from("students").upsert(
          { roll_no: rollUpper, student_name: cleanName },
          { onConflict: "roll_no" }
        );

        // 4. Insert participation record in Supabase
        let { error: partErr } = await supabase.from("participations").insert({
          roll_no: rollUpper,
          student_name: cleanName,
          contest_name: contestName,
          event_id: eventId,
          date: issueDate,
          certificate_url: certificateUrl,
          status: "generated",
          generated_at: new Date().toISOString(),
        });

        // Fallback: If FK error on event_id, insert with event_id set to null
        if (partErr && (partErr?.code === "23503" || partErr?.message?.includes("foreign key"))) {
          console.warn(`FK constraint on event_id ${eventId}, retrying without event_id...`);
          const fallbackRes = await supabase.from("participations").insert({
            roll_no: rollUpper,
            student_name: cleanName,
            contest_name: contestName,
            date: issueDate,
            certificate_url: certificateUrl,
            status: "generated",
            generated_at: new Date().toISOString(),
          });
          partErr = fallbackRes.error;
        }

        if (partErr) {
          console.error("DB Insert error for student:", rollUpper, partErr);
          results.push({
            name: cleanName,
            rollNo: rollUpper,
            status: "failed",
            error: `Failed to save in DB: ${partErr?.message}`,
          });
          continue;
        }

        successCount++;
        results.push({
          name: cleanName,
          rollNo: rollUpper,
          status: "generated",
          certificateUrl,
        });
      } catch (err: any) {
        console.error(`Failed to generate certificate for ${p.rollNo}:`, err);
        results.push({
          name: p.name,
          rollNo: p.rollNo,
          status: "failed",
          error: err?.message || "Generation failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: participants.length,
        generated: successCount,
        failed: participants.length - successCount,
        results,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal generation error" },
      { status: 500 }
    );
  }
}
