"use client";

import { useState } from "react";
import type { Participation } from "@/types";
import { Download, Calendar, Trophy, Eye, CheckCircle2, Clock } from "lucide-react";

interface CertificateCardProps {
  participation: Participation;
  index: number;
}

export function CertificateCard({ participation, index }: CertificateCardProps) {
  const [downloading, setDownloading] = useState(false);

  const formattedDate = new Date(participation.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isGenerated = participation.status === "generated" || !participation.status;

  async function handleDirectDownload() {
    setDownloading(true);
    try {
      const res = await fetch(participation.certificateUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const cleanContest = participation.contestName.replace(/\s+/g, "_");
      link.download = `${participation.rollNo}_${cleanContest}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(participation.certificateUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article
      className="cert-card"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-label={`Certificate for ${participation.contestName}`}
    >
      {/* Left accent bar */}
      <div className="cert-card__accent" aria-hidden="true" />

      <div className="cert-card__body">
        {/* Contest icon + name + status */}
        <div className="cert-card__header">
          <span className="cert-card__icon" aria-hidden="true">
            <Trophy size={18} />
          </span>
          <h3 className="cert-card__title">{participation.contestName}</h3>
        </div>

        {/* Date & Status */}
        <div className="cert-card__meta">
          <Calendar size={14} aria-hidden="true" />
          <time dateTime={participation.date} className="cert-card__date">
            {formattedDate}
          </time>

          <span className="event-meta-sep" aria-hidden="true" />

          {isGenerated ? (
            <span className="status-ok" style={{ fontSize: "0.75rem" }}>
              <CheckCircle2 size={13} /> Ready to View / Download
            </span>
          ) : (
            <span className="status-err" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <Clock size={13} /> {participation.status}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <a
          href={participation.certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cert-download-btn"
          style={{ background: "rgba(241, 245, 249, 0.9)", color: "var(--text-main)" }}
          aria-label={`View certificate for ${participation.contestName}`}
        >
          <Eye size={15} aria-hidden="true" />
          <span>View</span>
        </a>

        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={downloading}
          className="cert-download-btn"
          aria-label={`Download certificate for ${participation.contestName}`}
        >
          {downloading ? (
            <span className="spinner spinner--dark" style={{ width: "14px", height: "14px" }} />
          ) : (
            <Download size={15} aria-hidden="true" />
          )}
          <span>{downloading ? "Downloading…" : "Download"}</span>
        </button>
      </div>
    </article>
  );
}
