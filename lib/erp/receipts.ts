/**
 * Receipt attachment storage for financial_ledger entries (Supabase Storage).
 * Bucket is private — files are written and read only through this
 * server-only module using the service-role client; viewing goes through a
 * short-lived signed URL rather than a public URL.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';

export const RECEIPT_BUCKET = 'expense-receipts';
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type === 'application/pdf' ? 'pdf' : 'jpg';
}

/**
 * Upload a receipt file and return its Storage object path (not a URL —
 * the bucket is private, so callers must fetch a signed URL to view it).
 * Throws with a user-facing message on validation failure or upload error.
 */
export async function uploadReceiptFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Receipt must be an image (JPG/PNG/WEBP/HEIC) or a PDF');
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error('Receipt file is too large (max 5MB)');
  }

  const path = `${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload receipt: ${error.message}`);
  }
  return path;
}

/**
 * Generate a short-lived signed URL to view/download a stored receipt.
 * Returns null (rather than throwing) on failure — callers treat a missing
 * URL as "receipt currently unavailable" instead of a hard error.
 */
export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, 60 * 10); // 10 minutes — enough to open/download once

  if (error) {
    console.error('Error creating receipt signed URL:', error);
    return null;
  }
  return data?.signedUrl ?? null;
}
