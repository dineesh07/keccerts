/**
 * CSV Parser Utility for Student Participants
 */

import type { ParticipantRecord } from "@/types";

export function parseParticipantCSV(text: string): ParticipantRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const records: ParticipantRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim());
    
    const getVal = (possibleKeys: string[]) => {
      for (const k of possibleKeys) {
        const idx = headers.indexOf(k);
        if (idx !== -1 && vals[idx]) return vals[idx];
      }
      return "";
    };

    const name = getVal(["name", "studentname", "student name", "fullname"]);
    const rollNo = getVal(["rollno", "roll no", "roll number", "roll"]);

    const hasError = !name || !rollNo;

    records.push({
      name,
      rollNo: rollNo.toUpperCase(),
      status: hasError ? "failed" : "pending",
      error: hasError ? "Missing required Name or Roll Number" : undefined,
    });
  }

  return records;
}
