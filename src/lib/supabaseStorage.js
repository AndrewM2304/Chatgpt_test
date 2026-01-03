import { supabaseAnonKey, supabaseUrl } from "./supabaseClient.js";

const STORAGE_BUCKET =
  import.meta.env?.VITE_SUPABASE_STORAGE_BUCKET || "cookbook_storage";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const getFileExtension = (file) => {
  const nameParts = file?.name?.split(".") || [];
  if (nameParts.length > 1) {
    return nameParts.pop().toLowerCase();
  }
  if (file?.type) {
    const typeParts = file.type.split("/");
    return typeParts[typeParts.length - 1] || "png";
  }
  return "png";
};

const parseStorageError = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    const text = await response.text();
    return { message: text || "Storage upload failed", error };
  }
};

export const uploadCookbookCover = async ({
  title,
  groupCode,
  file,
  bucket = STORAGE_BUCKET,
}) => {
  if (!file) {
    return { data: null, error: { message: "Choose an image to upload." } };
  }

  const safeTitle = slugify(title || "cookbook") || "cookbook";
  const extension = getFileExtension(file);
  const path = `${encodeURIComponent(groupCode)}/${safeTitle}.${extension}`;
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!response.ok) {
    return { data: null, error: await parseStorageError(response) };
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return { data: { publicUrl, path }, error: null };
};
