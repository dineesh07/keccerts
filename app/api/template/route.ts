import { NextResponse } from "next/server";
import { getTemplateByEventId, saveTemplate } from "@/services/templateService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ success: false, error: "eventId is required" }, { status: 400 });
  }

  const template = await getTemplateByEventId(eventId);
  return NextResponse.json({ success: true, data: template });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, templateUrl, config } = body;

    if (!eventId || !config) {
      return NextResponse.json({ success: false, error: "eventId and config are required" }, { status: 400 });
    }

    const res = await saveTemplate(eventId, templateUrl || "", config);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to save template" }, { status: 500 });
  }
}
