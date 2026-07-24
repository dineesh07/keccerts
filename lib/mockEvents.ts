/**
 * Event Store — Integrates Supabase `events` table with fallback to localStorage.
 */

import type { EventCard } from "@/types";
import { supabase } from "@/lib/supabase";

const SEED_EVENTS: EventCard[] = [];

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
