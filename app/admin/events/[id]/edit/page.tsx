"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/mockEvents";
import { EventForm } from "@/components/admin/EventForm";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = getEventById(id);
  if (!event) notFound();
  return <EventForm mode="edit" initialData={event} />;
}
