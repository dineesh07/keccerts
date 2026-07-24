"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/mockEvents";
import { getTemplateByEventId } from "@/services/templateService";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import type { CertificateTemplate } from "@/types";

export default function ConfigureEventTemplatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const event = getEventById(eventId);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplateByEventId(eventId).then((tpl) => {
      setTemplate(tpl);
      setLoading(false);
    });
  }, [eventId]);

  if (!event) notFound();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card" style={{ alignItems: "center", padding: "3rem" }}>
          <span className="spinner spinner--dark" style={{ width: "32px", height: "32px" }} />
          <p className="admin-card__desc">Loading template configuration…</p>
        </div>
      </div>
    );
  }

  return (
    <TemplateEditor
      eventId={event.id}
      eventName={event.eventName}
      initialTemplateUrl={template?.templateUrl}
      initialConfig={template?.config}
    />
  );
}
