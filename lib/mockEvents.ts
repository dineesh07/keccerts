/**
 * Event Store — Integrates Supabase `events` table with fallback to localStorage.
 */

import type { EventCard } from "@/types";
import { supabase } from "@/lib/supabase";

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_EVENTS: EventCard[] = [
  {
    id: "code-clash-2024",
    eventName: "Code Clash 2024",
    category: "Coding",
    bannerImageUrl: "/event_coding.png",
    shortDescription:
      "An intense 3-hour individual coding competition testing algorithmic thinking and problem-solving speed. Students tackled 5 progressively harder challenges across data structures, dynamic programming, and graph theory.",
    date: "March 15, 2024",
    location: "CS Lab Block – A",
    participantCount: 142,
    winners: [
      { type: "individual", name: "Arun Kumar S", rollNo: "21CS101", position: "1st" },
      { type: "individual", name: "Priya Dharshini R", rollNo: "22CS048", position: "2nd" },
      { type: "individual", name: "Gowtham M", rollNo: "21CS087", position: "3rd" },
    ],
  },
  {
    id: "techquiz-2024",
    eventName: "Tech Trivia Showdown",
    category: "Quiz",
    bannerImageUrl: "/event_quiz.png",
    shortDescription:
      "A fast-paced technical quiz covering CS fundamentals, current tech trends, and general engineering aptitude. Teams of two competed through rapid-fire rounds with buzzer battles and elimination stages.",
    date: "April 8, 2024",
    location: "Seminar Hall – Main Block",
    participantCount: 96,
    winners: [
      { type: "individual", name: "Divya Lakshmi K", rollNo: "22EC012", position: "1st" },
      { type: "individual", name: "Karthik Raj P", rollNo: "21EC055", position: "2nd" },
      { type: "individual", name: "Sneha B", rollNo: "22IT033", position: "3rd" },
    ],
  },
  {
    id: "hackfest-2024",
    eventName: "HackFest Innovation Sprint",
    category: "Hackathon",
    bannerImageUrl: "/event_hackathon.png",
    shortDescription:
      "A 24-hour hackathon where teams of 3–4 built real-world solutions around the themes of Smart Campus, Green Tech, and AI for Good. Projects were judged on innovation, feasibility, design, and live demo impact.",
    date: "May 22–23, 2024",
    location: "Innovation Hub – KEC Campus",
    participantCount: 204,
    winners: [
      { type: "team", teamName: "Team Nexus", members: ["Rahul V (22CS011)", "Sneha R (22CS023)", "Dev M (22CS034)", "Anya K (22CS045)"], position: "1st" },
      { type: "team", teamName: "Team Byte Force", members: ["Arjun P (21CS099)", "Meena S (21CS078)"], position: "2nd" },
      { type: "team", teamName: "Team GreenBit", members: ["Kavi T (22IT012)", "Raj N (22IT031)"], position: "3rd" },
    ],
  },
];

const STORAGE_KEY = "kec_events_data";

function loadLocalStorage(): EventCard[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [...SEED_EVENTS];
}

function saveLocalStorage(events: EventCard[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.warn("Could not save to localStorage", err);
    }
  }
}

let _events: EventCard[] | null = null;

export function getEvents(): EventCard[] {
  if (!_events) {
    _events = loadLocalStorage();
  }
  return _events;
}

export async function fetchEventsFromSupabase(): Promise<EventCard[]> {
  try {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      const fetched: EventCard[] = data.map((row) => ({
        id: row.id,
        eventName: row.event_name,
        category: row.category,
        bannerImageUrl: row.banner_image_url,
        shortDescription: row.short_description,
        date: row.date,
        location: row.location,
        participantCount: row.participant_count,
        winners: row.winners || [],
      }));
      _events = fetched;
      saveLocalStorage(fetched);
      return fetched;
    }
  } catch (err) {
    console.warn("Supabase fetch events failed, using cached store", err);
  }
  return getEvents();
}

export async function addEvent(event: EventCard): Promise<void> {
  const current = getEvents();
  _events = [event, ...current];
  saveLocalStorage(_events);

  try {
    await supabase.from("events").insert({
      id: event.id,
      event_name: event.eventName,
      category: event.category,
      banner_image_url: event.bannerImageUrl,
      short_description: event.shortDescription,
      date: event.date,
      location: event.location,
      participant_count: event.participantCount,
      winners: event.winners,
    });
  } catch (err) {
    console.warn("Supabase event insert error:", err);
  }
}

export async function updateEvent(id: string, updated: EventCard): Promise<void> {
  const current = getEvents();
  _events = current.map((e) => (e.id === id ? updated : e));
  saveLocalStorage(_events);

  try {
    await supabase.from("events").update({
      event_name: updated.eventName,
      category: updated.category,
      banner_image_url: updated.bannerImageUrl,
      short_description: updated.shortDescription,
      date: updated.date,
      location: updated.location,
      participant_count: updated.participantCount,
      winners: updated.winners,
    }).eq("id", id);
  } catch (err) {
    console.warn("Supabase event update error:", err);
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const current = getEvents();
  _events = current.filter((e) => e.id !== id);
  saveLocalStorage(_events);

  try {
    await supabase.from("events").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase event delete error:", err);
  }
}

export function getEventById(id: string): EventCard | undefined {
  return getEvents().find((e) => e.id === id);
}
