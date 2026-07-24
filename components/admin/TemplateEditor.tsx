"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Save,
  MousePointer,
  Type,
  CheckCircle2,
  Sliders,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { TemplateConfig, TemplateField, TextAlign } from "@/types";

type Props = {
  eventId: string;
  eventName: string;
  initialTemplateUrl?: string;
  initialConfig?: TemplateConfig;
};

const DEFAULT_CONFIG: TemplateConfig = {
  name: {
    x: 600,
    y: 410,
    font: "Poppins-Bold.ttf",
    size: 52,
    color: "#000000",
    align: "center",
  },
  rollNo: {
    x: 600,
    y: 480,
    font: "Poppins-Regular.ttf",
    size: 28,
    color: "#444444",
    align: "center",
  },
};

const FONTS = [
  "Poppins",
  "Plus Jakarta Sans",
  "Inter",
  "Roboto",
];

import { uploadTemplateImage, deleteTemplateStorageObject, saveTemplate } from "@/services/templateService";

export function TemplateEditor({ eventId, eventName, initialTemplateUrl, initialConfig }: Props) {
  const router = useRouter();

  const [templateUrl, setTemplateUrl] = useState<string>(initialTemplateUrl || "");
  const [config, setConfig] = useState<TemplateConfig>(initialConfig || DEFAULT_CONFIG);
  const [activeField, setActiveField] = useState<"name" | "rollNo">("name");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Upload template image to Supabase Storage and insert DB record
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSavedSuccess(false);

    try {
      // 1. Upload file to Supabase Storage bucket "certificate-templates"
      const uploadRes = await uploadTemplateImage(file);
      if (!uploadRes.success || !uploadRes.publicUrl || !uploadRes.filePath) {
        alert(`Upload failed: ${uploadRes.error || "Could not upload image"}`);
        return;
      }

      const publicUrl = uploadRes.publicUrl;

      // 2. Insert row into certificate_templates table with public URL
      const saveRes = await saveTemplate(eventId, publicUrl, config);
      if (!saveRes.success) {
        // If database insert fails, delete the uploaded storage object
        await deleteTemplateStorageObject(uploadRes.filePath);
        alert(`Database insert failed: ${saveRes.error}`);
        return;
      }

      // 3. Update preview with public URL, show success message, refresh list
      setTemplateUrl(publicUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      router.refresh();
    } catch (err: any) {
      alert(`Error uploading template: ${err?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Click handler to set coordinates
  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Relative position normalized to a standard 1200x850 canvas scale
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = 1200 / rect.width;
    const scaleY = 850 / rect.height;

    const targetX = Math.round(clickX * scaleX);
    const targetY = Math.round(clickY * scaleY);

    setConfig((prev) => ({
      ...prev,
      [activeField]: {
        ...prev[activeField],
        x: targetX,
        y: targetY,
      },
    }));
  }

  function updateField(field: "name" | "rollNo", patch: Partial<TemplateField>) {
    setConfig((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...patch,
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          templateUrl,
          config,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(`Failed to save template: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Error saving template: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  const currentField = config[activeField];

  // Render scale calculations for visual marker placement
  const namePosPct = { x: (config.name.x / 1200) * 100, y: (config.name.y / 850) * 100 };
  const rollPosPct = { x: (config.rollNo.x / 1200) * 100, y: (config.rollNo.y / 850) * 100 };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Visual Template Editor</h1>
          <p className="admin-page__sub">
            Event: <strong>{eventName}</strong> · Click anywhere on the template to place text positions
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="admin-btn admin-btn--ghost" onClick={() => setConfig(DEFAULT_CONFIG)}>
            <RotateCcw size={15} /> Reset Config
          </button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner spinner--dark" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="upload-result__success" style={{ padding: "0.75rem 1rem" }}>
          <CheckCircle2 size={18} />
          <span>Configuration saved to Supabase <code>certificate_templates.config</code></span>
        </div>
      )}

      <div className="event-form-layout event-form-layout--split">
        {/* ── Left Controls ── */}
        <div className="admin-card" style={{ width: "340px", flexShrink: 0 }}>
          <h2 className="admin-card__title">
            <Sliders size={18} />
            Field Configuration
          </h2>

          {/* Active field selector */}
          <div className="admin-tabs" style={{ width: "100%" }}>
            <button
              className={`admin-tab ${activeField === "name" ? "admin-tab--active" : ""}`}
              onClick={() => setActiveField("name")}
              style={{ flex: 1 }}
            >
              <Type size={15} /> Name Position
            </button>
            <button
              className={`admin-tab ${activeField === "rollNo" ? "admin-tab--active" : ""}`}
              onClick={() => setActiveField("rollNo")}
              style={{ flex: 1 }}
            >
              <MousePointer size={15} /> Roll No Position
            </button>
          </div>

          {/* Upload template image input */}
          <div className="admin-form-group">
            <label className="admin-form-label">Template Background Image</label>
            <label
              htmlFor="tpl-file"
              className="admin-banner-label"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: uploading ? 0.7 : 1,
                pointerEvents: uploading ? "none" : "auto",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <span className="spinner spinner--dark" style={{ width: "16px", height: "16px" }} />
              ) : (
                <UploadCloud size={18} />
              )}
              {uploading
                ? "Uploading Image..."
                : templateUrl
                ? "Change Template Image"
                : "Upload Template Image"}
            </label>
            <input
              id="tpl-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>

          {/* X & Y Coordinates */}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">X Position (px)</label>
              <input
                type="number"
                className="admin-input"
                value={currentField.x}
                onChange={(e) => updateField(activeField, { x: Number(e.target.value) })}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Y Position (px)</label>
              <input
                type="number"
                className="admin-input"
                value={currentField.y}
                onChange={(e) => updateField(activeField, { y: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Font Family */}
          <div className="admin-form-group">
            <label className="admin-form-label">Font Family</label>
            <select
              className="admin-select"
              value={currentField.font}
              onChange={(e) => updateField(activeField, { font: e.target.value })}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="admin-form-group">
            <div className="admin-section__row">
              <label className="admin-form-label">Font Size</label>
              <span className="event-meta-item">{currentField.size}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="120"
              value={currentField.size}
              onChange={(e) => updateField(activeField, { size: Number(e.target.value) })}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </div>

          {/* Text Color */}
          <div className="admin-form-group">
            <label className="admin-form-label">Text Color</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="color"
                value={currentField.color}
                onChange={(e) => updateField(activeField, { color: e.target.value })}
                style={{ width: "40px", height: "36px", border: "none", cursor: "pointer", borderRadius: "4px" }}
              />
              <input
                type="text"
                className="admin-input"
                value={currentField.color}
                onChange={(e) => updateField(activeField, { color: e.target.value })}
              />
            </div>
          </div>

          {/* Alignment */}
          <div className="admin-form-group">
            <label className="admin-form-label">Text Alignment</label>
            <div className="admin-tabs" style={{ width: "100%" }}>
              {(["left", "center", "right"] as TextAlign[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`admin-tab ${currentField.align === a ? "admin-tab--active" : ""}`}
                  onClick={() => updateField(activeField, { align: a })}
                  style={{ flex: 1, textTransform: "capitalize" }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Interactive Preview Canvas ── */}
        <div className="admin-card" style={{ flex: 1, minWidth: 0, padding: "1.25rem" }}>
          <div className="admin-section__row" style={{ marginBottom: "0.75rem" }}>
            <h3 className="admin-card__title">
              <Sparkles size={18} />
              Interactive Canvas Preview
            </h3>
            <span className="event-meta-item">
              Click anywhere on the certificate to set <strong>{activeField.toUpperCase()}</strong> position
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1200 / 850",
              background: templateUrl ? "none" : "#f1f5f9",
              border: "2px dashed var(--blue)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              cursor: "crosshair",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {templateUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={templateUrl}
                alt="Certificate template"
                style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
              />
            )}

            {!templateUrl && (
              <div className="events-empty" style={{ paddingTop: "20%" }}>
                <UploadCloud size={48} />
                <p>No template background uploaded yet.</p>
                <p style={{ fontSize: "0.8rem" }}>Upload an image from the left panel or click to position text.</p>
              </div>
            )}

            {/* Name Marker */}
            <div
              style={{
                position: "absolute",
                left: `${namePosPct.x}%`,
                top: `${namePosPct.y}%`,
                transform: `translate(${config.name.align === "center" ? "-50%" : config.name.align === "right" ? "-100%" : "0%"}, -50%)`,
                color: config.name.color,
                fontSize: `clamp(12px, ${config.name.size * 0.05}vw, ${config.name.size}px)`,
                fontWeight: "700",
                fontFamily: config.name.font.includes("Inter")
                  ? "'Inter', sans-serif"
                  : config.name.font.includes("Plus")
                  ? "'Plus Jakarta Sans', sans-serif"
                  : config.name.font.includes("Roboto")
                  ? "'Roboto', sans-serif"
                  : "'Poppins', sans-serif",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                border: activeField === "name" ? "1.5px dashed var(--blue)" : "none",
                padding: "2px 6px",
                borderRadius: "4px",
                background: activeField === "name" ? "rgba(41,171,226,0.15)" : "transparent",
              }}
            >
              Arun Kumar S
            </div>

            {/* Roll Number Marker */}
            <div
              style={{
                position: "absolute",
                left: `${rollPosPct.x}%`,
                top: `${rollPosPct.y}%`,
                transform: `translate(${config.rollNo.align === "center" ? "-50%" : config.rollNo.align === "right" ? "-100%" : "0%"}, -50%)`,
                color: config.rollNo.color,
                fontSize: `clamp(10px, ${config.rollNo.size * 0.05}vw, ${config.rollNo.size}px)`,
                fontWeight: "400",
                fontFamily: config.rollNo.font.includes("Inter")
                  ? "'Inter', sans-serif"
                  : config.rollNo.font.includes("Plus")
                  ? "'Plus Jakarta Sans', sans-serif"
                  : config.rollNo.font.includes("Roboto")
                  ? "'Roboto', sans-serif"
                  : "'Poppins', sans-serif",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                border: activeField === "rollNo" ? "1.5px dashed var(--green)" : "none",
                padding: "2px 6px",
                borderRadius: "4px",
                background: activeField === "rollNo" ? "rgba(141,198,63,0.15)" : "transparent",
              }}
            >
              21CS101
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
