"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import type { SearchQuery } from "@/types";
import { Search, Hash, User, GraduationCap, ChevronRight } from "lucide-react";

interface SearchFormProps {
  onSearch: (query: SearchQuery) => void;
  isLoading: boolean;
}

interface SuggestionItem {
  name: string;
  rollNo: string;
  count: number;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [searchType, setSearchType] = useState<"rollNo" | "name">("rollNo");
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const q = value.replace(/^#\s*/, "").trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        let query = supabase.from("participations").select("student_name, roll_no");
        if (searchType === "rollNo") {
          query = query.ilike("roll_no", `%${q}%`);
        } else {
          query = query.ilike("student_name", `%${q}%`);
        }
        const { data, error } = await query.limit(10);
        if (isMounted && !error && data) {
          const map = new Map<string, SuggestionItem>();
          for (const row of data) {
            const r = row.roll_no;
            if (!map.has(r)) {
              map.set(r, { name: row.student_name, rollNo: r, count: 1 });
            } else {
              map.get(r)!.count += 1;
            }
          }
          const list = Array.from(map.values());
          setSuggestions(list);
          setShowDropdown(list.length > 0);
        }
      } catch {
        // ignore
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [value, searchType]);

  // Hide dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setShowDropdown(false);
    onSearch({ type: searchType, value: value.trim() });
  }

  function handleSelectSuggestion(item: SuggestionItem) {
    const val = searchType === "rollNo" ? item.rollNo : item.name;
    setValue(val);
    setShowDropdown(false);
    onSearch({ type: searchType, value: val });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="search-form"
      aria-label="Certificate search form"
      style={{ position: "relative" }}
      ref={dropdownRef}
    >
      {/* Toggle Tabs */}
      <div className="search-tabs" role="group" aria-label="Search by">
        <button
          type="button"
          role="tab"
          aria-selected={searchType === "rollNo"}
          className={`search-tab ${searchType === "rollNo" ? "search-tab--active" : ""}`}
          onClick={() => { setSearchType("rollNo"); setValue(""); setSuggestions([]); setShowDropdown(false); }}
        >
          <Hash size={16} aria-hidden="true" />
          Roll Number
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={searchType === "name"}
          className={`search-tab ${searchType === "name" ? "search-tab--active" : ""}`}
          onClick={() => { setSearchType("name"); setValue(""); setSuggestions([]); setShowDropdown(false); }}
        >
          <User size={16} aria-hidden="true" />
          Student Name
        </button>
      </div>

      {/* Input Group */}
      <div className="search-input-group">
        <label htmlFor="search-input" className="search-label">
          {searchType === "rollNo" ? "Enter your Roll Number" : "Enter Student Name"}
        </label>
        <div className="search-input-wrapper">
          <span className="search-input-icon" aria-hidden="true">
            {searchType === "rollNo" ? <Hash size={20} /> : <User size={20} />}
          </span>
          <input
            id="search-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder={
              searchType === "rollNo"
                ? "e.g. 24ISR007"
                : "e.g. PAARTHI"
            }
            className="search-input"
            aria-required="true"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Live Auto-suggest Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: "0.4rem",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "0.5rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              Matching Students ({suggestions.length})
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  cursor: "pointer",
                  borderBottom: idx < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Roll No: <strong>{item.rollNo}</strong></div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#0284c7", fontWeight: 500 }}>
                  <span>{item.count} Cert{item.count > 1 ? "s" : ""}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="search-btn"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Searching…
          </>
        ) : (
          <>
            <Search size={18} aria-hidden="true" />
            Search Certificates
          </>
        )}
      </button>

      {/* Helper hint */}
      <p className="search-hint">
        {searchType === "rollNo"
          ? "Enter your exact roll number as printed on your ID card."
          : "Start typing a student name to see live matching suggestions."}
      </p>
    </form>
  );
}
