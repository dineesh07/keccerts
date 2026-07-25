/**
 * Certificate Storage Service
 * Uploads generated PNG certificates to Supabase Storage (bucket "certificates").
 * Obtains the public URL via supabase.storage.from("certificates").getPublicUrl(filename).
 * Falls back gracefully to Cloudflare R2 if configured.
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rnqmwvlgllhehfqwuapq.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucW13dmxnbGxoZWhmcXd1YXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDY0NTcsImV4cCI6MjEwMDIyMjQ1N30.r6Cy9KR81A528RtI4laK9fStHmNlWFxPJuBKYTebUKI";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "certificates";
const publicDomain = process.env.R2_PUBLIC_DOMAIN || "";

let r2Client: S3Client | null = null;

if (accountId && accessKeyId && secretAccessKey) {
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadCertificateToR2(
  fileBuffer: Buffer,
  filename: string,
  contentType = "image/png"
): Promise<string> {
  // 1. Primary: Upload PNG to Supabase Storage bucket "certificates" using admin privileges
  try {
    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket("certificates", { public: true });
    } catch {
      // ignore
    }

    // Use Uint8Array inside Blob for binary-safe transport.
    // Passing a plain Buffer to Blob([buffer]) can be treated as a string array in some
    // Node.js/Edge environments, causing UTF-8 corruption. Uint8Array is always binary-safe.
    const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: contentType });
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from("certificates")
      .upload(filename, fileBlob, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (!uploadErr) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("certificates")
        .getPublicUrl(filename);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    } else {
      console.warn("Supabase storage upload notice:", uploadErr.message);
    }
  } catch (err) {
    console.warn("Supabase storage certificate upload exception:", err);
  }

  // 2. Secondary Fallback: Cloudflare R2 if configured
  if (r2Client && publicDomain) {
    try {
      const key = `certificates/${filename}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );
      const cleanDomain = publicDomain.endsWith("/") ? publicDomain.slice(0, -1) : publicDomain;
      return `${cleanDomain}/${key}`;
    } catch (err) {
      console.warn("Cloudflare R2 upload failed:", err);
    }
  }

  // 3. Fallback: Get public URL from Supabase Storage
  const { data: fallbackUrlData } = supabaseAdmin.storage
    .from("certificates")
    .getPublicUrl(filename);

  return fallbackUrlData.publicUrl;
}
