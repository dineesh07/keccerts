import { NextResponse } from "next/server";
import { parseParticipantCSV } from "@/utils/csvParser";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csvText || "";
    }

    if (!csvText) {
      return NextResponse.json({ success: false, error: "CSV content is empty" }, { status: 400 });
    }

    const records = parseParticipantCSV(csvText);
    const validCount = records.filter((r) => r.status === "pending").length;

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: records.length,
        validStudents: validCount,
        records,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to parse CSV" }, { status: 500 });
  }
}
