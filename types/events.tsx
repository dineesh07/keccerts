/**
 * Event & Category type system — pure types + config data (no JSX).
 * Used by both public EventsSection and the Admin Portal.
 */

// ── Category ──────────────────────────────────────────────────────────────────
export type Category = "Coding" | "Quiz" | "Hackathon" | "Others";

export const CATEGORIES: Category[] = ["Coding", "Quiz", "Hackathon", "Others"];

export type CategoryConfig = {
  /** CSS class suffix for admin badges (e.g. "coding" → .admin-cat-badge--coding) */
  cssClass: string;
  /** Solid hex color for the image overlay pill */
  badgeColor: string;
  /** Gradient start for the event card overlay */
  accentFrom: string;
  /** Gradient end for the event card overlay */
  accentTo: string;
  /** Icon size to use (px) — the actual icon is rendered by getCategoryIcon() in categoryIcons.tsx */
  iconSize: number;
};

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  Coding: {
    cssClass:   "coding",
    badgeColor: "#29ABE2",
    accentFrom: "#29ABE2",
    accentTo:   "#1d8fbc",
    iconSize:   14,
  },
  Quiz: {
    cssClass:   "quiz",
    badgeColor: "#8b5cf6",
    accentFrom: "#8b5cf6",
    accentTo:   "#7c3aed",
    iconSize:   14,
  },
  Hackathon: {
    cssClass:   "hackathon",
    badgeColor: "#8DC63F",
    accentFrom: "#8DC63F",
    accentTo:   "#6fa32f",
    iconSize:   14,
  },
  Others: {
    cssClass:   "others",
    badgeColor: "#6b7280",
    accentFrom: "#6b7280",
    accentTo:   "#4b5563",
    iconSize:   14,
  },
};

// ── Winners ───────────────────────────────────────────────────────────────────
export type IndividualWinner = {
  type: "individual";
  name: string;
  rollNo: string;
  position: string;
};

export type TeamWinner = {
  type: "team";
  teamName: string;
  members: string[];
  position: string;
};

export type Winner = IndividualWinner | TeamWinner;

// ── EventCard ─────────────────────────────────────────────────────────────────
export type EventCard = {
  id: string;
  eventName: string;
  category: Category;
  bannerImageUrl: string;
  shortDescription: string;
  date: string;
  location: string;
  participantCount: number;
  winners: Winner[];
};
