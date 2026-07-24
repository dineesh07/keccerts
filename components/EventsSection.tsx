"use client";

import { Star } from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import { EventCardComponent } from "@/components/EventCard";

export function EventsSection() {
  const { events } = useEventsStore();

  return (
    <section id="events" className="events-section" aria-labelledby="events-heading">
      {/* Section header */}
      <div className="events-header">
        <div className="events-header__badge">
          <Star size={14} aria-hidden="true" />
          <span>Highlights</span>
        </div>
        <h2 id="events-heading" className="events-header__title">
          Featured <span className="events-header__title--gradient">Events</span>
        </h2>
        <p className="events-header__sub">
          Competitions, hackathons, and contests that shaped our students&apos;
          journey — meet the champions.
        </p>
      </div>

      {/* Cards grid */}
      {events.length === 0 ? (
        <p className="events-empty">No events posted yet.</p>
      ) : (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCardComponent key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </section>
  );
}
