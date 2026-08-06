/**
 * Reusable EventCard component.
 * Used by EventsSection (public) and admin live preview.
 */

import {
  Trophy,
  Medal,
  Award,
  Users2,
  CalendarDays,
  MapPin,
  ChevronRight,
  Info,
} from "lucide-react";
import type { EventCard, Winner } from "@/types";
import { CATEGORY_CONFIG } from "@/types";
import { getCategoryIcon } from "@/lib/categoryIcons";


type PlaceCfg = { icon: React.ReactNode; label: string; cls: string };

function positionConfig(pos: string): PlaceCfg {
  const map: Record<string, PlaceCfg> = {
    "1st": { icon: <Trophy size={13} />, label: "1st", cls: "winner-badge--gold" },
    "2nd": { icon: <Medal  size={13} />, label: "2nd", cls: "winner-badge--silver" },
    "3rd": { icon: <Award  size={13} />, label: "3rd", cls: "winner-badge--bronze" },
  };
  return map[pos] ?? { icon: <Award size={13} />, label: pos, cls: "winner-badge--bronze" };
}

function WinnerRow({ winner }: { winner: Winner }) {
  const cfg = positionConfig(winner.position);
  if (winner.type === "team") {
    return (
      <li className="winner-row">
        <span className={`winner-badge ${cfg.cls}`}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="winner-name">{winner.teamName}</span>
        {winner.members.length > 0 && (
          <span className="winner-roll" style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "help" }} title={winner.members.join(", ")}>
            {winner.members.length} members
            <Info size={14} style={{ color: "var(--text-muted)", opacity: 0.7 }} />
          </span>
        )}
      </li>
    );
  }
  return (
    <li className="winner-row">
      <span className={`winner-badge ${cfg.cls}`}>
        {cfg.icon}
        {cfg.label}
      </span>
      <span className="winner-name">{winner.name}</span>
      <span className="winner-roll">{winner.rollNo}</span>
    </li>
  );
}

type Props = {
  event: EventCard;
  /** When true, hides the "Find Your Certificate" CTA (used in admin preview) */
  previewMode?: boolean;
};

export function EventCardComponent({ event, previewMode = false }: Props) {
  const cfg = CATEGORY_CONFIG[event.category];

  return (
    <article className="event-card" aria-label={event.eventName}>
      {/* Image */}
      <div className="event-card__img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerImageUrl}
          alt={`${event.eventName} banner`}
          className="event-card__img"
        />
        {/* Category pill */}
        <span className="event-card__category">
          {getCategoryIcon(event.category)}
          {event.category}
        </span>
        {/* Overlay */}
        <div className="event-card__overlay" />
      </div>

      {/* Body */}
      <div className="event-card__body">
        {/* Meta row */}
        <div className="event-card__meta">
          <span className="event-meta-item">
            <CalendarDays size={13} aria-hidden="true" />
            {event.date}
          </span>
          <span className="event-meta-sep" aria-hidden="true" />
          <span className="event-meta-item">
            <MapPin size={13} aria-hidden="true" />
            {event.location}
          </span>
          <span className="event-meta-sep" aria-hidden="true" />
          <span className="event-meta-item">
            <Users2 size={13} aria-hidden="true" />
            {event.participantCount} Participants
          </span>
        </div>

        {/* Title */}
        <h3 className="event-card__title">{event.eventName}</h3>

        {/* Description */}
        <p className="event-card__desc">{event.shortDescription}</p>

        {/* Winners */}
        {event.winners.length > 0 && (
          <div className="event-card__winners">
            <div className="event-winners__heading">
              <Trophy size={15} aria-hidden="true" />
              <span>Winners</span>
            </div>
            <ul className="event-winners__list" aria-label="Event winners">
              {event.winners.map((w, i) => (
                <WinnerRow key={i} winner={w} />
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        {!previewMode && (
          <a
            href="#search"
            className="event-card__cta"
            aria-label={`Find certificates for ${event.eventName}`}
          >
            Find Your Certificate
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
