import { NextResponse } from "next/server";
import { getTemplateByEventId } from "@/services/templateService";
import { renderCertificateBuffer } from "@/services/certificateGenerator";
import { uploadCertificateToR2 } from "@/services/r2Service";
import { supabase } from "@/lib/supabase";
import type { TemplateConfig, ParticipantRecord } from "@/types";

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

    // 1. Fetch event template configuration
    const template = await getTemplateByEventId(eventId);
    const defaultConfig: TemplateConfig = {
      name: { x: 600, y: 410, font: "Poppins-Bold.ttf", size: 52, color: "#000000", align: "center" },
      rollNo: { x: 600, y: 480, font: "Poppins-Regular.ttf", size: 28, color: "#444444", align: "center" },
    };

    const config = template?.config || defaultConfig;
    const templateUrl = template?.templateUrl || "";
    const issueDate = toValidIsoDate(date);

    if (!templateUrl) {
      console.warn(`[generate-certificates] No template URL found for eventId="${eventId}". Certificates will render on a plain white background.`);
    } else {
      console.log(`[generate-certificates] Using template: ${templateUrl}`);
    }


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

        // 2. Render certificate image
        const imageBuffer = await renderCertificateBuffer(templateUrl, cleanName, rollUpper, config);

        // 3. Upload certificate to Cloudflare R2 / Supabase Storage
        const filename = `${eventId}-${rollUpper.toLowerCase()}-${Date.now()}.png`;
        const certificateUrl = await uploadCertificateToR2(imageBuffer, filename, "image/png");

        // 4. Upsert student profile in Supabase
        await supabase.from("students").upsert(
          { roll_no: rollUpper, student_name: cleanName },
          { onConflict: "roll_no" }
        );

        // 5. Insert participation record in Supabase
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
