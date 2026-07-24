/**
 * Template Service — DB operations for certificate_templates table
 */

import { createClient } from "@supabase/supabase-js";
import type { CertificateTemplate, TemplateConfig } from "@/types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rnqmwvlgllhehfqwuapq.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucW13dmxnbGxoZWhmcXd1YXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDY0NTcsImV4cCI6MjEwMDIyMjQ1N30.r6Cy9KR81A528RtI4laK9fStHmNlWFxPJuBKYTebUKI";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getTemplateByEventId(eventId: string): Promise<CertificateTemplate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      eventId: data.event_id,
      templateUrl: data.template_url,
      config: data.config as TemplateConfig,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn("Failed to fetch template by eventId:", err);
    return null;
  }
}

export async function uploadTemplateImage(
  file: File
): Promise<{ success: boolean; publicUrl?: string; filePath?: string; error?: string }> {
  try {
    // 1. Try server-side upload API route first (bulletproof on Vercel)
    const formData = new FormData();
    formData.append("file", file);

    const apiRes = await fetch("/api/upload-template", {
      method: "POST",
      body: formData,
    });

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && json.publicUrl) {
        return {
          success: true,
          publicUrl: json.publicUrl,
          filePath: json.filePath,
        };
      }
    }
  } catch {
    // Fallback to client SDK if API route is unreachable
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedFileName = (file.name || "template.png").replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${timestamp}-${sanitizedFileName}`;
    const mimeType = file.type && file.type.length > 0 ? file.type : "image/png";

    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificate-templates")
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("certificate-templates")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { success: false, error: "Failed to retrieve public URL from Supabase Storage" };
    }

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      filePath: filePath,
    };
  } catch (err: any) {
    console.error("Failed to upload template image:", err);
    return { success: false, error: err?.message || "Failed to upload template image" };
  }
}

export async function deleteTemplateStorageObject(filePath: string): Promise<void> {
  try {
    await supabaseAdmin.storage.from("certificate-templates").remove([filePath]);
  } catch (err) {
    console.warn("Failed to delete uploaded storage object after DB insert error:", err);
  }
}

export async function saveTemplate(
  eventId: string,
  templateUrl: string,
  config: TemplateConfig
): Promise<{ success: boolean; data?: CertificateTemplate; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("certificate_templates")
      .upsert(
        {
          event_id: eventId,
          template_url: templateUrl,
          config: config,
        },
        { onConflict: "event_id" }
      )
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      data: {
        id: data.id,
        eventId: data.event_id,
        templateUrl: data.template_url,
        config: data.config as TemplateConfig,
        createdAt: data.created_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save template" };
  }
}
