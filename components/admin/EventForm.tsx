"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  Save,
  ChevronDown,
} from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import type { Category, EventCard, Winner, IndividualWinner, TeamWinner } from "@/types";
import { CATEGORIES, CATEGORY_CONFIG } from "@/types";
import { EventCardComponent } from "@/components/EventCard";
import { getCategoryIcon } from "@/lib/categoryIcons";


// ── Helpers ──────────────────────────────────────────────────────────────────
function newIndividual(): IndividualWinner {
  return { type: "individual", name: "", rollNo: "", position: "1st" };
}
function newTeam(): TeamWinner {
  return { type: "team", teamName: "", members: [""], position: "1st" };
}

const POSITIONS = ["1st", "2nd", "3rd", "4th", "5th"];

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  initialData?: EventCard;
  mode: "new" | "edit";
};

// ── Component ─────────────────────────────────────────────────────────────────
export function EventForm({ initialData, mode }: Props) {
  const { addEvent, updateEvent } = useEventsStore();
  const router = useRouter();

  const isHackathon = (cat: Category) => cat === "Hackathon";

  /* ── Form state ── */
  const [eventName,      setEventName]      = useState(initialData?.eventName      ?? "");
  const [category,       setCategory]       = useState<Category>(initialData?.category ?? "Coding");
  const [bannerPreview,  setBannerPreview]  = useState(initialData?.bannerImageUrl  ?? "");
  const [date,           setDate]           = useState(initialData?.date            ?? "");
  const [location,       setLocation]       = useState(initialData?.location        ?? "");
  const [participants,   setParticipants]   = useState(initialData?.participantCount ?? 0);
  const [description,    setDescription]    = useState(initialData?.shortDescription ?? "");
  const [winners,        setWinners]        = useState<Winner[]>(
    initialData?.winners ?? [newIndividual()]
  );
  const [showPreview,    setShowPreview]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  /* ── Category change: swap winner types ── */
  function handleCategoryChange(cat: Category) {
    setCategory(cat);
    // Removed the forced type mapping to allow users to mix/match Individual and Team winners across all categories
  }

  /* ── Banner image ── */
  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  /* ── Winner helpers ── */
  function addIndividual() {
    setWinners((prev) => [...prev, newIndividual()]);
  }

  function addTeam() {
    setWinners((prev) => [...prev, newTeam()]);
  }

  function removeWinner(idx: number) {
    setWinners((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateWinner(idx: number, patch: Partial<Winner>) {
    setWinners((prev) =>
      prev.map((w, i) => (i === idx ? ({ ...w, ...patch } as Winner) : w))
    );
  }

  function updateTeamMember(winnerIdx: number, memberIdx: number, val: string) {
    setWinners((prev) =>
      prev.map((w, i) => {
        if (i !== winnerIdx || w.type !== "team") return w;
        const members = [...w.members];
        members[memberIdx] = val;
        return { ...w, members } as TeamWinner;
      })
    );
  }

  function addTeamMember(winnerIdx: number) {
    setWinners((prev) =>
      prev.map((w, i) => {
        if (i !== winnerIdx || w.type !== "team") return w;
        return { ...w, members: [...w.members, ""] } as TeamWinner;
      })
    );
  }

  function removeTeamMember(winnerIdx: number, memberIdx: number) {
    setWinners((prev) =>
      prev.map((w, i) => {
        if (i !== winnerIdx || w.type !== "team") return w;
        return { ...w, members: w.members.filter((_, mi) => mi !== memberIdx) } as TeamWinner;
      })
    );
  }

  /* ── Validation ── */
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!eventName.trim()) e.eventName = "Event name is required.";
    if (!date.trim())      e.date      = "Date is required.";
    if (!location.trim())  e.location  = "Location is required.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    const slug = eventName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: EventCard = {
      id: initialData?.id ?? (slug ? `${slug}` : `event-${Date.now()}`),
      eventName:        eventName.trim(),
      category,
      bannerImageUrl:   bannerPreview || "/event_coding.png",
      shortDescription: description.trim(),
      date:             date.trim(),
      location:         location.trim(),
      participantCount: Number(participants),
      winners,
    };

    if (mode === "new") addEvent(payload);
    else                updateEvent(payload.id, payload);

    setSaving(false);
    router.push("/admin/events");
  }

  /* ── Preview data ── */
  const previewData: EventCard = {
    id: "preview",
    eventName:        eventName || "Event Name",
    category,
    bannerImageUrl:   bannerPreview || "/event_coding.png",
    shortDescription: description || "Event description will appear here.",
    date:             date || "Date TBD",
    location:         location || "Venue TBD",
    participantCount: Number(participants) || 0,
    winners,
  };

  const cfg = CATEGORY_CONFIG[category];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">
            {mode === "new" ? "Post New Event" : "Edit Event"}
          </h1>
          <p className="admin-page__sub">
            {mode === "new"
              ? "Fill in the details and publish to the public home page"
              : "Update event details — changes reflect immediately"}
          </p>
        </div>
        <button
          type="button"
          className={`admin-btn ${showPreview ? "admin-btn--ghost" : "admin-btn--outline"}`}
          onClick={() => setShowPreview((p) => !p)}
        >
          {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
          {showPreview ? "Hide Preview" : "Live Preview"}
        </button>
      </div>

      <div className={`event-form-layout ${showPreview ? "event-form-layout--split" : ""}`}>
        {/* ── Form ── */}
        <form className="admin-card event-form" onSubmit={handleSubmit} noValidate>

          {/* Event Name */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ef-name">
              Event Name <span aria-hidden>*</span>
            </label>
            <input
              id="ef-name"
              className={`admin-input ${errors.eventName ? "admin-input--error" : ""}`}
              placeholder="e.g. Code Clash 2024"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            {errors.eventName && <p className="admin-field-err">{errors.eventName}</p>}
          </div>

          {/* Category */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ef-cat">
              Category <span aria-hidden>*</span>
            </label>
            <div className="admin-select-wrap">
              <select
                id="ef-cat"
                className="admin-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="admin-select-arrow" aria-hidden="true" />
            </div>
            {/* Category badge preview */}
            <div className="admin-cat-preview">
              <span
                className="event-card__category"
                style={{ background: cfg.badgeColor, position: "relative", top: "auto", left: "auto", display: "inline-flex" }}
              >
                {getCategoryIcon(category)}
                {category}
              </span>
            </div>
          </div>

          {/* Banner Image */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ef-banner">Banner Image</label>
            <div className="admin-banner-upload">
              {bannerPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerPreview} alt="Banner preview" className="admin-banner-preview" />
              )}
              <label htmlFor="ef-banner" className="admin-banner-label">
                <ImagePlus size={18} />
                {bannerPreview ? "Change Image" : "Upload Banner"}
              </label>
              <input
                id="ef-banner"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleBannerChange}
              />
            </div>
          </div>

          {/* Date + Location */}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ef-date">Date <span aria-hidden>*</span></label>
              <input
                id="ef-date"
                type="date"
                className={`admin-input ${errors.date ? "admin-input--error" : ""}`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && <p className="admin-field-err">{errors.date}</p>}
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ef-loc">Location <span aria-hidden>*</span></label>
              <input
                id="ef-loc"
                className={`admin-input ${errors.location ? "admin-input--error" : ""}`}
                placeholder="e.g. CS Lab Block – A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {errors.location && <p className="admin-field-err">{errors.location}</p>}
            </div>
          </div>

          {/* Participants */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ef-pcount">Participant Count</label>
            <input
              id="ef-pcount"
              type="number"
              min="0"
              className="admin-input"
              placeholder="e.g. 142"
              value={participants || ""}
              onChange={(e) => setParticipants(Number(e.target.value))}
            />
          </div>

          {/* Description */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ef-desc">
              Short Description <span aria-hidden>*</span>
            </label>
            <textarea
              id="ef-desc"
              className={`admin-textarea ${errors.description ? "admin-input--error" : ""}`}
              placeholder="Describe the event briefly…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className="admin-field-err">{errors.description}</p>}
          </div>

          {/* Winners */}
          <div className="admin-form-group">
            <div className="admin-section__row">
              <label className="admin-form-label">
                Winners{" "}
                <span className="admin-form-label--hint">
                  (add individual or team winners)
                </span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="admin-btn admin-btn--xs" onClick={addIndividual}>
                  <Plus size={13} /> Add Individual
                </button>
                <button type="button" className="admin-btn admin-btn--xs" onClick={addTeam}>
                  <Plus size={13} /> Add Team
                </button>
              </div>
            </div>

            <div className="winners-list">
              {winners.map((w, idx) => (
                <div key={idx} className="winner-entry">
                  {/* Position */}
                  <div className="winner-entry__pos">
                    <select
                      className="admin-select admin-select--sm"
                      value={w.position}
                      onChange={(e) => updateWinner(idx, { position: e.target.value })}
                      aria-label="Position"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Individual fields */}
                  {w.type === "individual" && (
                    <div className="winner-entry__fields">
                      <input
                        className="admin-input admin-input--sm"
                        placeholder="Name"
                        value={w.name}
                        onChange={(e) => updateWinner(idx, { name: e.target.value })}
                      />
                      <input
                        className="admin-input admin-input--sm"
                        placeholder="Roll No"
                        value={w.rollNo}
                        onChange={(e) => updateWinner(idx, { rollNo: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Team fields */}
                  {w.type === "team" && (
                    <div className="winner-entry__fields winner-entry__fields--team">
                      <input
                        className="admin-input admin-input--sm"
                        placeholder="Team Name"
                        value={w.teamName}
                        onChange={(e) => updateWinner(idx, { teamName: e.target.value })}
                      />
                      <div className="team-members">
                        {w.members.map((m, mi) => (
                          <div key={mi} className="team-member-row">
                            <input
                              className="admin-input admin-input--sm"
                              placeholder={`Member ${mi + 1} (Name or Name (RollNo))`}
                              value={m}
                              onChange={(e) => updateTeamMember(idx, mi, e.target.value)}
                            />
                            {w.members.length > 1 && (
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--red admin-icon-btn--xs"
                                onClick={() => removeTeamMember(idx, mi)}
                                aria-label="Remove member"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="admin-btn admin-btn--xs admin-btn--ghost"
                          onClick={() => addTeamMember(idx)}
                        >
                          <Plus size={12} /> Add Member
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remove winner */}
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--red"
                    onClick={() => removeWinner(idx)}
                    aria-label="Remove winner row"
                    disabled={winners.length === 1}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => router.push("/admin/events")}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? <span className="spinner spinner--dark" /> : <Save size={15} />}
              {saving ? "Publishing…" : mode === "new" ? "Publish Event" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* ── Live Preview ── */}
        {showPreview && (
          <div className="event-form-preview">
            <p className="event-form-preview__label">
              <Eye size={14} /> Live Preview
            </p>
            <div className="event-form-preview__card">
              <EventCardComponent event={previewData} previewMode />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
