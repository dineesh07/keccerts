// Core data types mirroring the real API / DB schema
export type { Category, CategoryConfig, EventCard, IndividualWinner, TeamWinner, Winner, } from "./events";
export { CATEGORIES, CATEGORY_CONFIG } from "./events";
export type { CertificateTemplate, TemplateConfig, TemplateField, CertificateStatus, TextAlign, ParticipantRecord } from "./certificate";

export type Participation = {
  id: string;
  rollNo: string;
  studentName: string;
  contestName: string;
  date: string; // ISO date string e.g. "2024-03-15"
  certificateUrl: string; // Will point to a Cloudflare R2 file
  status?: "pending" | "generated" | "failed";
  generatedAt?: string;
  eventId?: string;
};


export type SearchQuery = {
  type: "rollNo" | "name";
  value: string;
};

export type SearchResult = {
  student: Pick<Participation, "rollNo" | "studentName">;
  participations: Participation[];
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
