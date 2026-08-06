import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTemplateByEventId } from "@/services/templateService";
import { renderCertificateBuffer } from "@/services/certificateGenerator";
import type { TemplateConfig } from "@/types";

export const maxDuration = 60; // Allow enough time for image rendering

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rollNo = searchParams.get("rollNo");
  const eventId = searchParams.get("eventId");

  if (!rollNo || !eventId) {
    return new NextResponse("rollNo and eventId query parameters are required", { status: 400 });
  }

  try {
    // 1. Verify participation in the database
    const { data: participation, error } = await supabase
      .from("participations")
      .select("student_name, contest_name")
      .eq("roll_no", rollNo.trim().toUpperCase())
      .eq("event_id", eventId)
      .single();

    if (error || !participation) {
      return new NextResponse(
        "Certificate not found. You either did not participate in this event, or the participant list has not been uploaded yet.",
        { status: 404, headers: { "Content-Type": "text/plain" } }
      );
    }

    // 2. Fetch the template for the event
    const template = await getTemplateByEventId(eventId);
    const defaultConfig: TemplateConfig = {
      name: { x: 600, y: 410, font: "Poppins-Bold.ttf", size: 52, color: "#000000", align: "center" },
      rollNo: { x: 600, y: 480, font: "Poppins-Regular.ttf", size: 28, color: "#444444", align: "center" },
    };

    const config = template?.config || defaultConfig;
    const templateUrl = template?.templateUrl || "";

    // 3. Render the certificate buffer
    const imageBuffer = await renderCertificateBuffer(
      templateUrl,
      participation.student_name,
      rollNo.trim().toUpperCase(),
      config
    );

    // 4. Return the generated image directly to the browser
    return new NextResponse(imageBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=31536000",
        "Content-Disposition": `inline; filename="${participation.contest_name.replace(/[^a-zA-Z0-9]/g, "_")}_${rollNo.trim().toUpperCase()}_Certificate.png"`,
      },
    });
  } catch (err: any) {
    console.error(`[api/certificates/download] Error generating certificate:`, err);
    return new NextResponse("Internal Server Error generating certificate", { status: 500 });
  }
}
