/**
 * Search API layer — Queries live Supabase database with fallback to mock data.
 */

import type { ApiResponse, Participation, SearchQuery, SearchResult } from "@/types";
import { supabase } from "@/lib/supabase";
import { getEvents } from "@/lib/mockEvents";

// ---------------------------------------------------------------------------
// Fallback Mock data
// ---------------------------------------------------------------------------
const MOCK_PARTICIPATIONS: Participation[] = [];

// ---------------------------------------------------------------------------
// Search function — queries Supabase DB table `participations`
// ---------------------------------------------------------------------------
export async function searchParticipations(
  query: SearchQuery
): Promise<ApiResponse<SearchResult>> {
  let cleanedValue = query.value.trim();
  // Strip any leading '#' if user typed e.g. '#24ISR007' or '# 24ISR007'
  cleanedValue = cleanedValue.replace(/^#\s*/, "").trim();

  if (!cleanedValue) {
    return { success: false, error: "Please enter a search value." };
  }

  try {
    let dbQuery = supabase.from("participations").select("*");

    if (query.type === "rollNo") {
      dbQuery = dbQuery.ilike("roll_no", cleanedValue);
    } else {
      dbQuery = dbQuery.ilike("student_name", `%${cleanedValue}%`);
    }

    const { data, error } = await dbQuery;

    if (!error) {
      if (data && data.length > 0) {
        const matches: Participation[] = data.map((row) => ({
          id: row.id,
          rollNo: row.roll_no,
          studentName: row.student_name,
          contestName: row.contest_name,
          date: row.date,
          certificateUrl: row.certificate_url,
        }));

        const first = matches[0];
        return {
          success: true,
          data: {
            student: { rollNo: first.rollNo, studentName: first.studentName },
            participations: matches.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          },
        };
      } else {
        // Supabase DB query completed successfully but found 0 matches
        return { success: false, error: "NO_RESULTS" };
      }
    } else {
      console.warn("Supabase query notice, falling back to mock:", error);
    }
  } catch (e) {
    console.warn("Supabase query error, falling back to mock:", e);
  }

  // Fallback to local mock data ONLY if Supabase connection/query failed completely
  const searchLower = cleanedValue.toLowerCase();
  let matches: Participation[];

  if (query.type === "rollNo") {
    matches = MOCK_PARTICIPATIONS.filter((p) =>
      p.rollNo.toLowerCase() === searchLower
    );
  } else {
    matches = MOCK_PARTICIPATIONS.filter((p) =>
      p.studentName.toLowerCase().includes(searchLower)
    );
  }

  if (matches.length === 0) {
    return { success: false, error: "NO_RESULTS" };
  }

  const first = matches[0];
  return {
    success: true,
    data: {
      student: { rollNo: first.rollNo, studentName: first.studentName },
      participations: matches.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Real-time Statistics API — fetches live counts from Supabase DB tables
// ---------------------------------------------------------------------------
export type PortalStats = {
  studentsCount: number;
  certificatesCount: number;
  contestsCount: number;
};

export async function fetchPortalStats(): Promise<PortalStats> {
  try {
    // 1. Live total certificates count from participations table
    const { count: certCount, error: certErr } = await supabase
      .from("participations")
      .select("*", { count: "exact", head: true });

    // 2. Live total contests count from events table
    const { count: eventCount, error: eventErr } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // 3. Live unique students count from students table or participations
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    let finalCertificates = certCount;
    let finalEvents = eventCount;
    let finalStudents = studentCount;

    if (!finalStudents || finalStudents === 0) {
      const { data: rollData } = await supabase.from("participations").select("roll_no");
      if (rollData && rollData.length > 0) {
        finalStudents = new Set(rollData.map((r) => r.roll_no)).size;
      }
    }

    // If Supabase database returns valid counts, return exact real-time DB counts
    if (!certErr && certCount !== null && !eventErr && eventCount !== null) {
      return {
        studentsCount: finalStudents || 0,
        certificatesCount: finalCertificates || 0,
        contestsCount: finalEvents || 0,
      };
    }
  } catch (err) {
    console.warn("Supabase stats query notice, using dynamic fallback:", err);
  }

  // Dynamic fallback calculation based on local store
  const fallbackStudents = new Set(MOCK_PARTICIPATIONS.map((p) => p.rollNo)).size;
  return {
    studentsCount: fallbackStudents,
    certificatesCount: MOCK_PARTICIPATIONS.length,
    contestsCount: getEvents().length,
  };
}

