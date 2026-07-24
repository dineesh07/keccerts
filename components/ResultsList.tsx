"use client";

import type { SearchResult } from "@/types";
import { CertificateCard } from "./CertificateCard";
import { Award, User, Hash } from "lucide-react";

interface ResultsListProps {
  result: SearchResult;
}

export function ResultsList({ result }: ResultsListProps) {
  const { student, participations } = result;
  const count = participations.length;

  return (
    <section className="results-section" aria-label="Search results">
      {/* Student identity banner */}
      <div className="results-banner">
        <div className="results-banner__avatar" aria-hidden="true">
          <User size={28} />
        </div>
        <div className="results-banner__info">
          <h2 className="results-banner__name">{student.studentName}</h2>
          <div className="results-banner__meta">
            <Hash size={13} aria-hidden="true" />
            <span>{student.rollNo}</span>
          </div>
        </div>
        <div className="results-banner__count" aria-label={`${count} certificate${count !== 1 ? "s" : ""} found`}>
          <Award size={18} aria-hidden="true" />
          <span>
            {count} Certificate{count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Card list */}
      <div className="results-list" role="list" aria-label="Certificate list">
        {participations.map((p, i) => (
          <div role="listitem" key={p.id}>
            <CertificateCard participation={p} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
