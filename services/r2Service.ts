/**
 * Certificate Storage Service
 * Uploads generated PNG certificates to Supabase Storage (bucket "certificates").
 * Obtains the public URL via supabase.storage.from("certificates").getPublicUrl(filename).
 * Falls back gracefully to Cloudflare R2 if configured.
 */

import { supabase } from "@/lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
  // 1. Primary: Upload PNG to Supabase Storage bucket "certificates"
  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("certificates")
      .upload(filename, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (!uploadErr) {
      const { data: publicUrlData } = supabase.storage
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
  const { data: fallbackUrlData } = supabase.storage
    .from("certificates")
    .getPublicUrl(filename);

  return fallbackUrlData.publicUrl;
}
