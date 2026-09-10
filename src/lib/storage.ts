import { createClient } from "./supabase-server";

/**
 * Upload a file to Supabase Storage and return its public URL.
 *
 * Storage bucket: "documents" (create manually in Supabase Dashboard → Storage)
 * Policy: authenticated upload, public read.
 */
export async function uploadDocument(
  file: File,
  path: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Generate a unique storage path for a document.
 */
export function documentPath(
  uploaderId: string,
  type: string,
  fileName: string
): string {
  const ext = fileName.split(".").pop() ?? "bin";
  const ts = Date.now();
  return `${type}/${uploaderId}/${ts}.${ext}`;
}
