"use client";

import { useState, useRef } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsList } from "@/components/ResultsList";
import { SearchSkeleton } from "@/components/SearchSkeleton";
import { EventsSection } from "@/components/EventsSection";
import { searchParticipations, type PortalStats } from "@/lib/mockApi";
import type { SearchQuery, SearchResult } from "@/types";
import { ShieldAlert, SearchX, GraduationCap, FileCheck2, Users } from "lucide-react";

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SearchResult }
  | { status: "no_results"; query: SearchQuery }
  | { status: "error"; message: string };

export function HomePageClient({ initialStats }: { initialStats: PortalStats }) {
  const [pageState, setPageState] = useState<PageState>({ status: "idle" });
  const [stats] = useState<PortalStats>(initialStats);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSearch(query: SearchQuery) {
    setPageState({ status: "loading" });

    // Smooth-scroll to results area so mobile users see the spinner
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      const response = await searchParticipations(query);

      if (!response.success) {
        if (response.error === "NO_RESULTS") {
          setPageState({ status: "no_results", query });
        } else {
          setPageState({ status: "error", message: response.error });
        }
      } else {
        setPageState({ status: "success", data: response.data });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    } catch {
      setPageState({
        status: "error",
        message: "Something went wrong. Please try again in a moment.",
      });
    }
  }

  return (
    <main className="main-content" id="main-content">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-heading">
        {/* Decorative blobs */}
        <div className="hero__blob hero__blob--blue" aria-hidden="true" />
        <div className="hero__blob hero__blob--green" aria-hidden="true" />

        <div className="hero__content">
          <h1 id="hero-heading" className="hero__title">
            Your Achievements,
            <br />
            <span className="hero__title--gradient">One Search Away</span>
          </h1>

          <p className="hero__desc">
            Find and download participation certificates for all contests and events
            conducted by the Department of CT-PG. Search by roll number or name —
            it&apos;s that simple.
          </p>

          {/* Stats strip — Real-time live counts */}
          <div className="hero__stats" aria-label="Portal statistics">
            <div className="hero__stat">
              <GraduationCap size={20} aria-hidden="true" />
              <span className="hero__stat-value">{stats.studentsCount}</span>
              <span className="hero__stat-label">Students</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat">
              <FileCheck2 size={20} aria-hidden="true" />
              <span className="hero__stat-value">{stats.certificatesCount.toLocaleString()}</span>
              <span className="hero__stat-label">Certificates</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat">
              <Users size={20} aria-hidden="true" />
              <span className="hero__stat-value">{stats.contestsCount}</span>
              <span className="hero__stat-label">{stats.contestsCount === 1 ? "Contest" : "Contests"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Card ─────────────────────────────────────── */}
      <section id="search" className="search-section" aria-label="Search for your certificate">
        <div className="glass-card">
          <div className="glass-card__header">
            <h2 className="glass-card__title">Search Your Certificates</h2>
            <p className="glass-card__sub">
              Enter your roll number or name to find your certificates.
            </p>
          </div>
          <SearchForm
            onSearch={handleSearch}
            isLoading={pageState.status === "loading"}
          />
        </div>
      </section>

      {/* ── Results Area ─────────────────────────────────────── */}
      {pageState.status !== "idle" && (
        <section
          className="results-area"
          ref={resultsRef}
          aria-live="polite"
          aria-atomic="true"
          aria-label="Search results"
        >
          {pageState.status === "loading" && <SearchSkeleton />}

          {pageState.status === "success" && (
            <ResultsList result={pageState.data} />
          )}

          {pageState.status === "no_results" && (
            <div className="state-card state-card--empty" role="status">
              <div className="state-card__icon state-card__icon--empty" aria-hidden="true">
                <SearchX size={40} />
              </div>
              <h3 className="state-card__title">No Certificates Found</h3>
              <p className="state-card__desc">
                We couldn&apos;t find any certificates for{" "}
                <strong>
                  {pageState.query.type === "rollNo"
                    ? `Roll No: ${pageState.query.value}`
                    : `"${pageState.query.value}"`}
                </strong>
                . Please double-check and try again.
              </p>
              <ul className="state-card__tips">
                <li>Make sure the roll number is entered exactly as on your ID card.</li>
                <li>Try searching with your full name if the roll number doesn&apos;t work.</li>
                <li>Contact the Academic Office if you believe this is an error.</li>
              </ul>
            </div>
          )}

          {pageState.status === "error" && (
            <div className="state-card state-card--error" role="alert">
              <div className="state-card__icon state-card__icon--error" aria-hidden="true">
                <ShieldAlert size={40} />
              </div>
              <h3 className="state-card__title">Something Went Wrong</h3>
              <p className="state-card__desc">{pageState.message}</p>
              <button
                className="state-card__retry"
                onClick={() => setPageState({ status: "idle" })}
              >
                Try Again
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Events Section ────────────────────────────────── */}
      <EventsSection />
    </main>
  );
}
