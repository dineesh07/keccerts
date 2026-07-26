"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  UploadCloud,
  X,
  Sparkles,
  ChevronDown,
  CloudUpload,
  Download,
} from "lucide-react";
import { useEventsStore } from "@/lib/eventsStore";
import type { ParticipantRecord } from "@/types";

type UploadResult = { total: number; generated: number; failed: number };

function parseCSV(text: string): ParticipantRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const get = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.indexOf(k);
        if (idx !== -1 && vals[idx]) return vals[idx];
      }
      return "";
    };
    const name = get(["name", "studentname", "student name", "fullname"]);
    const rollNo = get(["rollno", "roll no", "roll number", "roll"]);
    const hasError = !name || !rollNo;

    return {
      name,
      rollNo: rollNo.toUpperCase(),
      status: hasError ? "failed" : "pending",
      error: hasError ? "Missing required Name or Roll Number" : undefined,
    } as ParticipantRecord;
  });
}

export default function UploadPage() {
  const { events } = useEventsStore();
  const [tab, setTab] = useState<"csv" | "manual">("csv");
  // Initialize as "" to match server render (events not loaded on server).
  // useEffect sets the first event after client hydration.
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  /* ── CSV State ── */
  const [records, setRecords] = useState<ParticipantRecord[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [genResult, setGenResult] = useState<UploadResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* ── Manual Entry State ── */
  const [manual, setManual] = useState({ name: "", rollNo: "", contest: "", date: "", file: "" });
  const [manualResult, setManualResult] = useState<"success" | "error" | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  /* ── Generated Participants History State ── */
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("participations")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setHistoryList(data);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const [historyEventFilter, setHistoryEventFilter] = useState<"selected" | "all">("selected");

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const filteredHistory = historyList.filter((item) => {
    if (historyEventFilter === "selected" && selectedEvent) {
      const matchContest = item.contest_name?.toLowerCase() === selectedEvent.eventName.toLowerCase();
      if (!matchContest) return false;
    }
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    return (
      (item.student_name && item.student_name.toLowerCase().includes(q)) ||
      (item.roll_no && item.roll_no.toLowerCase().includes(q)) ||
      (item.contest_name && item.contest_name.toLowerCase().includes(q))
    );
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    processCsvFile(f);
  }

  function processCsvFile(f: File) {
    setCsvFileName(f.name);
    setGenResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRecords(parsed);
    };
    reader.readAsText(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dropRef.current?.classList.remove("drag-over");
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx"))) {
      processCsvFile(f);
    }
  }

  // Generate Certificates Trigger
  async function handleGenerateCertificates() {
    if (!selectedEvent) {
      alert("Please select an event first.");
      return;
    }
    const validRecords = records.filter((r) => r.name && r.rollNo && r.status !== "generated");
    if (validRecords.length === 0) {
      alert("No pending or retryable student records to generate.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          contestName: selectedEvent.eventName,
          date: selectedEvent.date,
          participants: validRecords,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setGenResult({
          total: json.data.total,
          generated: json.data.generated,
          failed: json.data.failed,
        });

        // Update record statuses in UI
        if (json.data.results) {
          const resMap = new Map(json.data.results.map((r: any) => [r.rollNo, r]));
          setRecords((prev) =>
            prev.map((r) => {
              const updated = resMap.get(r.rollNo);
              return updated ? { ...r, ...updated } : r;
            })
          );
          fetchHistory();
        }
      } else {
        alert(`Certificate Generation Error: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Generation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  }

  function clearCsv() {
    setRecords([]);
    setCsvFileName("");
    setGenResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadSampleCsv() {
    const csvHeader = "Name,Roll Number\n";
    const sampleRows = [
      "Arun Kumar S,21CS101",
      "Priya Dharshini R,22CS048",
      "Gowtham M,21CS087",
      "Divya Lakshmi K,22EC012",
      "Karthik Raj P,21EC055",
    ].join("\n");
    const blob = new Blob([csvHeader + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_participants_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Manual Submit
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true);

    try {
      const { supabase } = await import("@/lib/supabase");
      const cleanRoll = manual.rollNo.trim().toUpperCase();
      const cleanName = manual.name.trim();

      await supabase
        .from("students")
        .upsert({ roll_no: cleanRoll, student_name: cleanName }, { onConflict: "roll_no" });

      let validDate = manual.date ? manual.date.trim() : new Date().toISOString().split("T")[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(validDate)) {
        validDate = new Date().toISOString().split("T")[0];
      }

      const { error: partErr } = await supabase.from("participations").insert({
        roll_no: cleanRoll,
        student_name: cleanName,
        contest_name: manual.contest.trim() || selectedEvent?.eventName || "Event Certificate",
        event_id: selectedEventId || undefined,
        date: validDate,
        certificate_url: manual.file
          ? `https://example.com/certificates/${manual.file}`
          : `https://example.com/certificates/${cleanRoll.toLowerCase()}-cert.pdf`,
        status: "generated",
        generated_at: new Date().toISOString(),
      });

      if (partErr) {
        console.error("Supabase participation insert error:", partErr);
        alert(`Insert Warning: ${partErr.message}`);
      }

      setManualResult("success");
      setManual({ name: "", rollNo: "", contest: "", date: "", file: "" });
    } catch (err: any) {
      alert(`Error saving record: ${err?.message || "Unknown error"}`);
      setManualResult("error");
    } finally {
      setManualLoading(false);
    }
  }

  const validCount = records.filter((r) => r.name && r.rollNo && r.status !== "generated").length;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Upload & Generate Certificates</h1>
          <p className="admin-page__sub">
            Upload participant CSV, generate certificates using Pillow/Canvas, and store in Cloudflare R2
          </p>
        </div>
      </div>

      {/* ── High-Visibility Target Event Selector Banner (Matching SS Design) ── */}
      <div
        style={{
          background: "#f0f9ff",
          border: "1.5px solid #38bdf8",
          boxShadow: "0 2px 12px -2px rgba(56, 189, 248, 0.15)",
          padding: "1.25rem 1.75rem",
          marginBottom: "1.5rem",
          borderRadius: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span
                style={{
                  background: "#0ea5e9",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                STEP 1: SELECT TARGET EVENT *
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Certificates will be generated for this selected event
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.01em" }}>
              {selectedEvent ? selectedEvent.eventName : "Select an Event"}
            </h2>
          </div>

          <div style={{ flex: "1", maxWidth: "440px", minWidth: "260px" }}>
            <div className="admin-select-wrap" style={{ border: "2px solid #38bdf8", borderRadius: "12px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <select
                id="upload-event-select"
                className="admin-select"
                style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)", padding: "0.65rem 2.4rem 0.65rem 0.9rem" }}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName} ({ev.date})
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="admin-select-arrow" style={{ color: "#0284c7", right: "0.85rem" }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "csv" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("csv")}
        >
          <FileSpreadsheet size={16} />
          CSV Participant Upload & Generator
        </button>
        <button
          className={`admin-tab ${tab === "manual" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("manual")}
        >
          <UserPlus size={16} />
          Manual One-Off Entry
        </button>
      </div>

      {/* ── CSV Upload & Generation Tab ── */}
      {tab === "csv" && (
        <div className="admin-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2 className="admin-card__title" style={{ margin: 0 }}>
                <FileSpreadsheet size={18} />
                CSV Participant Upload
              </h2>
              <p className="admin-card__desc" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
                Upload a <code>.csv</code> file containing <strong>Name, Roll Number</strong> columns.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={downloadSampleCsv}
              style={{ fontSize: "0.85rem", gap: "0.4rem" }}
            >
              <Download size={15} />
              Download Sample CSV Template
            </button>
          </div>

          {!csvFileName && (
            <div
              ref={dropRef}
              className="upload-dropzone"
              onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add("drag-over"); }}
              onDragLeave={() => dropRef.current?.classList.remove("drag-over")}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud size={40} className="upload-dropzone__icon" />
              <p className="upload-dropzone__label">Drag & drop your participant CSV file here</p>
              <p className="upload-dropzone__hint">or click to browse — CSV format with Name & Roll Number</p>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSampleCsv();
                }}
                style={{ marginTop: "0.5rem", fontSize: "0.8rem", padding: "0.35rem 0.75rem", gap: "0.4rem" }}
              >
                <Download size={14} /> Download Sample CSV Template
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
            </div>
          )}

          {csvFileName && (
            <div className="upload-file-badge">
              <FileSpreadsheet size={16} />
              <span>{csvFileName}</span>
              <button onClick={clearCsv} className="upload-file-badge__remove">
                <X size={14} />
              </button>
            </div>
          )}

          {records.length > 0 && (
            <>
              {/* Stats Summary */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card admin-stat-card--blue">
                  <div>
                    <p className="admin-stat-card__value">{records.length}</p>
                    <p className="admin-stat-card__label">Total Students</p>
                  </div>
                </div>
                <div className="admin-stat-card admin-stat-card--green">
                  <div>
                    <p className="admin-stat-card__value">{validCount}</p>
                    <p className="admin-stat-card__label">Valid / Pending</p>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="admin-section">
                <div className="admin-section__row">
                  <h3 className="admin-card__title">
                    <Eye size={16} />
                    Preview Table — {records.length} participants
                  </h3>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Status</th>
                        <th>Certificate URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={i} className={r.status === "failed" ? "admin-table__row--error" : ""}>
                          <td>{i + 1}</td>
                          <td>{r.name || <em className="text-muted">—</em>}</td>
                          <td>{r.rollNo || <em className="text-muted">—</em>}</td>
                          <td>
                            {r.status === "generated" ? (
                              <span className="status-ok">
                                <CheckCircle2 size={14} /> Generated
                              </span>
                            ) : r.status === "failed" ? (
                              <span className="status-err" title={r.error}>
                                <AlertCircle size={14} /> Failed
                              </span>
                            ) : (
                              <span className="admin-cat-badge admin-cat-badge--quiz">Pending</span>
                            )}
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>
                            {r.certificateUrl ? (
                              <a href={r.certificateUrl} target="_blank" rel="noreferrer" className="admin-section__link">
                                View / Download R2
                              </a>
                            ) : (
                              <em className="text-muted">—</em>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="admin-form-actions">
                <button className="admin-btn admin-btn--ghost" onClick={clearCsv}>
                  <Trash2 size={15} /> Clear CSV
                </button>
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={handleGenerateCertificates}
                  disabled={generating || validCount === 0}
                >
                  {generating ? <span className="spinner spinner--dark" /> : <Sparkles size={16} />}
                  {generating ? "Generating & Storing in R2…" : "Generate Certificates"}
                </button>
              </div>
            </>
          )}

          {/* Results Notification */}
          {genResult && (
            <div className="upload-result">
              <div className="upload-result__success">
                <CloudUpload size={22} />
                <div>
                  <strong>{genResult.generated} certificates generated successfully and stored in R2!</strong>
                  {genResult.failed > 0 && (
                    <p style={{ fontSize: "0.82rem", color: "#dc2626", marginTop: "0.2rem" }}>
                      {genResult.failed} failed due to invalid data.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manual Entry Tab ── */}
      {tab === "manual" && (
        <div className="admin-card">
          <h2 className="admin-card__title">
            <UserPlus size={18} />
            Manual One-Off Entry
          </h2>
          <p className="admin-card__desc">Add a single student certificate record directly.</p>

          {manualResult === "success" && (
            <div className="upload-result">
              <div className="upload-result__success">
                <CheckCircle2 size={20} />
                <strong>Record added successfully to database.</strong>
              </div>
              <button className="admin-btn admin-btn--ghost" onClick={() => setManualResult(null)}>
                Add Another
              </button>
            </div>
          )}

          {manualResult !== "success" && (
            <form className="admin-form" onSubmit={handleManualSubmit} noValidate>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="m-name">Student Name *</label>
                  <input
                    id="m-name"
                    className="admin-input"
                    required
                    value={manual.name}
                    onChange={(e) => setManual((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Arun Kumar S"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="m-roll">Roll Number *</label>
                  <input
                    id="m-roll"
                    className="admin-input"
                    required
                    value={manual.rollNo}
                    onChange={(e) => setManual((p) => ({ ...p, rollNo: e.target.value }))}
                    placeholder="e.g. 22CS048"
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="m-contest">Contest / Event Name</label>
                  <input
                    id="m-contest"
                    className="admin-input"
                    value={manual.contest}
                    onChange={(e) => setManual((p) => ({ ...p, contest: e.target.value }))}
                    placeholder={selectedEvent?.eventName || "e.g. Code Clash 2024"}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="m-date">Date</label>
                  <input
                    id="m-date"
                    type="date"
                    className="admin-input"
                    value={manual.date}
                    onChange={(e) => setManual((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="m-cert">Certificate File (PDF)</label>
                <input
                  id="m-cert"
                  type="file"
                  accept=".pdf"
                  className="admin-input admin-input--file"
                  onChange={(e) => setManual((p) => ({ ...p, file: e.target.files?.[0]?.name ?? "" }))}
                />
              </div>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={manualLoading || !manual.name || !manual.rollNo}
                >
                  <UserPlus size={15} />
                  {manualLoading ? "Saving…" : "Add Record"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Generated Participants & Certificates History Section ── */}
      <div className="admin-card" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <h2 className="admin-card__title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={20} color="var(--green)" />
              Generated Certificates ({filteredHistory.length})
            </h2>
            <p className="admin-card__desc" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
              Showing generated certificates stored in Supabase & Cloudflare R2
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Event Filter Toggle Buttons */}
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
              <button
                type="button"
                className={`admin-btn ${historyEventFilter === "selected" ? "admin-btn--primary" : "admin-btn--ghost"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "6px" }}
                onClick={() => setHistoryEventFilter("selected")}
              >
                Target Event Only ({selectedEvent ? selectedEvent.eventName : "Selected"})
              </button>
              <button
                type="button"
                className={`admin-btn ${historyEventFilter === "all" ? "admin-btn--primary" : "admin-btn--ghost"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "6px" }}
                onClick={() => setHistoryEventFilter("all")}
              >
                All Events ({historyList.length})
              </button>
            </div>

            <input
              type="text"
              className="admin-input"
              style={{ width: "200px", fontSize: "0.85rem" }}
              placeholder="Search by name, roll..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={fetchHistory}
              style={{ fontSize: "0.85rem" }}
            >
              Refresh
            </button>
          </div>
        </div>

        {historyLoading && (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <span className="spinner spinner--dark" style={{ width: "24px", height: "24px" }} />
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading generated records…</p>
          </div>
        )}

        {!historyLoading && filteredHistory.length === 0 && (
          <div className="events-empty" style={{ padding: "2rem" }}>
            <p>No generated certificate records found matching your filter.</p>
          </div>
        )}

        {!historyLoading && filteredHistory.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Contest / Event</th>
                  <th>Date Issued</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{item.student_name}</strong></td>
                    <td><code>{item.roll_no}</code></td>
                    <td>{item.contest_name}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className="status-ok">
                        <CheckCircle2 size={14} /> Generated
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <a
                          href={item.certificate_url}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn admin-btn--ghost"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        >
                          <Eye size={13} /> View
                        </a>
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                          onClick={async () => {
                            try {
                              const res = await fetch(item.certificate_url);
                              const blob = await res.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = blobUrl;
                              const cleanContest = (item.contest_name || "Event").replace(/\s+/g, "_");
                              a.download = `${item.roll_no}_${cleanContest}_Certificate.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(blobUrl);
                            } catch {
                              window.open(item.certificate_url, "_blank");
                            }
                          }}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
