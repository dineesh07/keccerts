"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileCheck2,
  GraduationCap,
  Plus,
  Upload,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import { CATEGORY_CONFIG } from "@/types";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { events } = useEventsStore();

  const [realCertsCount, setRealCertsCount] = useState<number | null>(null);
  const [realStudentsCount, setRealStudentsCount] = useState<number | null>(null);

  // Computed from local event store as immediate baseline
  const storeCertSum = events.reduce((sum, e) => sum + (e.participantCount || 0), 0);
  const storeStudentEst = Math.round(storeCertSum * 0.85);

  useEffect(() => {
    async function fetchRealTimeStats() {
      try {
        const { count: certCount, error: certError } = await supabase
          .from("participations")
          .select("*", { count: "exact", head: true });

        if (!certError && certCount !== null && certCount > 0) {
          setRealCertsCount(certCount);
        }

        const { data: rollData, error: rollError } = await supabase
          .from("participations")
          .select("roll_no");

        if (!rollError && rollData && rollData.length > 0) {
          const uniqueRolls = new Set(rollData.map((r) => r.roll_no).filter(Boolean));
          setRealStudentsCount(uniqueRolls.size);
        }
      } catch (err) {
        console.error("Error fetching real-time dashboard stats:", err);
      }
    }

    fetchRealTimeStats();
  }, [events]);

  const totalEvents   = events.length;
  const totalCerts    = realCertsCount ?? storeCertSum;
  const totalStudents = realStudentsCount ?? storeStudentEst;

  const recentEvents = [...events].slice(0, 3);

  const STATS = [
    { label: "Total Events",       value: totalEvents,   icon: <CalendarDays size={22} />, color: "blue"  },
    { label: "Certificates Issued", value: totalCerts,    icon: <FileCheck2 size={22} />, color: "green" },
    { label: "Students Enrolled",  value: totalStudents, icon: <GraduationCap size={22} />, color: "purple" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Dashboard</h1>
        <p className="admin-page__sub">Overview of the KEC Certificate Portal</p>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className={`admin-stat-card admin-stat-card--${s.color}`}>
            <div className="admin-stat-card__icon">{s.icon}</div>
            <div>
              <p className="admin-stat-card__value">{s.value}</p>
              <p className="admin-stat-card__label">{s.label}</p>
            </div>
            <TrendingUp size={16} className="admin-stat-card__trend" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="admin-section">
        <h2 className="admin-section__title">Quick Actions</h2>
        <div className="admin-actions-grid">
          <Link href="/admin/upload" className="admin-action-card">
            <div className="admin-action-card__icon admin-action-card__icon--blue">
              <Upload size={24} />
            </div>
            <div>
              <p className="admin-action-card__label">Upload Details</p>
              <p className="admin-action-card__desc">Bulk CSV upload or manual entry</p>
            </div>
            <ArrowRight size={18} className="admin-action-card__arrow" />
          </Link>
          <Link href="/admin/events/new" className="admin-action-card">
            <div className="admin-action-card__icon admin-action-card__icon--green">
              <Plus size={24} />
            </div>
            <div>
              <p className="admin-action-card__label">Post New Event</p>
              <p className="admin-action-card__desc">Create event with live preview</p>
            </div>
            <ArrowRight size={18} className="admin-action-card__arrow" />
          </Link>
        </div>
      </div>

      {/* Recent events */}
      <div className="admin-section">
        <div className="admin-section__row">
          <h2 className="admin-section__title">Recent Events</h2>
          <Link href="/admin/events" className="admin-section__link">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Winners</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((ev) => {
                const cat = CATEGORY_CONFIG[ev.category];
                return (
                  <tr key={ev.id}>
                    <td className="admin-table__name">{ev.eventName}</td>
                    <td>
                      <span className={`admin-cat-badge admin-cat-badge--${cat.cssClass}`}>
                        {getCategoryIcon(ev.category, 12)}
                        {ev.category}
                      </span>
                    </td>
                    <td>{ev.date}</td>
                    <td>{ev.participantCount}</td>
                    <td>{ev.winners.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
