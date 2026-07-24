"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Users2,
  Trophy,
} from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import { CATEGORY_CONFIG } from "@/types";
import { getCategoryIcon } from "@/lib/categoryIcons";


export default function AdminEventsPage() {
  const { events, deleteEvent } = useEventsStore();
  const router = useRouter();

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteEvent(id);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Manage Events</h1>
          <p className="admin-page__sub">{events.length} event{events.length !== 1 ? "s" : ""} posted</p>
        </div>
        <Link href="/admin/events/new" className="admin-btn admin-btn--primary">
          <Plus size={16} />
          Post New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="admin-empty">
          <CalendarDays size={48} className="admin-empty__icon" />
          <p className="admin-empty__label">No events yet</p>
          <Link href="/admin/events/new" className="admin-btn admin-btn--primary">
            <Plus size={15} /> Post First Event
          </Link>
        </div>
      ) : (
        <div className="admin-events-list">
          {events.map((ev) => {
            const cfg = CATEGORY_CONFIG[ev.category];
            return (
              <div key={ev.id} className="admin-event-row">
                {/* Thumbnail */}
                <div className="admin-event-row__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ev.bannerImageUrl} alt={ev.eventName} />
                  <span
                    className="admin-event-row__cat"
                    style={{ background: cfg.badgeColor }}
                  >
                    {getCategoryIcon(ev.category, 10)} {ev.category}
                  </span>
                </div>

                {/* Info */}
                <div className="admin-event-row__info">
                  <p className="admin-event-row__name">{ev.eventName}</p>
                  <div className="admin-event-row__meta">
                    <span><CalendarDays size={12} /> {ev.date}</span>
                    <span><MapPin size={12} /> {ev.location}</span>
                    <span><Users2 size={12} /> {ev.participantCount}</span>
                    <span><Trophy size={12} /> {ev.winners.length} winners</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="admin-event-row__actions">
                  <Link
                    href={`/admin/events/${ev.id}/edit`}
                    className="admin-icon-btn admin-icon-btn--blue"
                    aria-label={`Edit ${ev.eventName}`}
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    className="admin-icon-btn admin-icon-btn--red"
                    onClick={() => handleDelete(ev.id, ev.eventName)}
                    aria-label={`Delete ${ev.eventName}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
