import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rnqmwvlgllhehfqwuapq.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucW13dmxnbGxoZWhmcXd1YXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDY0NTcsImV4cCI6MjEwMDIyMjQ1N30.r6Cy9KR81A528RtI4laK9fStHmNlWFxPJuBKYTebUKI";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedFileName = (file.name || "template.png").replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${timestamp}-${sanitizedFileName}`;
    const mimeType = file.type && file.type.length > 0 ? file.type : "image/png";

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificate-templates")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Server-side template upload error:", uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("certificate-templates")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      publicUrl: publicUrlData.publicUrl,
      filePath,
    });
  } catch (err: any) {
    console.error("Upload template route exception:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to process image upload" }, { status: 500 });
  }
}
