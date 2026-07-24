"use client";

import Link from "next/link";
import { Sliders, CalendarDays, ArrowRight, ImagePlus } from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import { CATEGORY_CONFIG } from "@/types";

export default function AdminTemplatesListPage() {
  const { events } = useEventsStore();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Certificate Templates</h1>
          <p className="admin-page__sub">
            Upload background templates and visually configure Name & Roll Number text positions per event.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="admin-empty">
          <CalendarDays size={48} className="admin-empty__icon" />
          <p className="admin-empty__label">No events posted yet</p>
          <Link href="/admin/events/new" className="admin-btn admin-btn--primary">
            Create an Event First
          </Link>
        </div>
      ) : (
        <div className="admin-actions-grid">
          {events.map((ev) => {
            const cat = CATEGORY_CONFIG[ev.category];
            return (
              <div key={ev.id} className="admin-card">
                <div className="admin-section__row">
                  <span className={`admin-cat-badge admin-cat-badge--${cat.cssClass}`}>
                    {ev.category}
                  </span>
                  <span className="event-meta-item">{ev.date}</span>
                </div>

                <h3 className="admin-card__title">
                  <Sliders size={18} />
                  {ev.eventName}
                </h3>

                <p className="admin-card__desc">{ev.shortDescription}</p>

                <div className="admin-form-actions">
                  <Link
                    href={`/admin/templates/${ev.id}`}
                    className="admin-btn admin-btn--primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <ImagePlus size={16} />
                    Configure Template & Text Layout
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
