"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { EventCard } from "@/types";
import {
  getEvents,
  fetchEventsFromSupabase,
  addEvent as storeAdd,
  updateEvent as storeUpdate,
  deleteEvent as storeDelete,
} from "@/lib/mockEvents";

type EventsCtx = {
  events: EventCard[];
  addEvent: (e: EventCard) => Promise<void>;
  updateEvent: (id: string, e: EventCard) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const EventsContext = createContext<EventsCtx | null>(null);

export function EventsStoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventCard[]>(() => getEvents());

  useEffect(() => {
    fetchEventsFromSupabase().then((data) => {
      setEvents([...data]);
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kec_events_data") {
        setEvents(getEvents());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchEventsFromSupabase();
    setEvents([...data]);
  }, []);

  const addEvent = useCallback(async (e: EventCard) => {
    await storeAdd(e);
    setEvents([...getEvents()]);
  }, []);

  const updateEvent = useCallback(async (id: string, e: EventCard) => {
    await storeUpdate(id, e);
    setEvents([...getEvents()]);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await storeDelete(id);
    setEvents([...getEvents()]);
  }, []);

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, refresh }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsStore(): EventsCtx {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEventsStore must be used inside <EventsStoreProvider>");
  return ctx;
}
