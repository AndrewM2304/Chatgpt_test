import { supabase } from "./supabaseClient.js";

export const fetchAccessPasswordHash = async () =>
  supabase
    .from("site_settings")
    .select("value")
    .eq("key", "access_password_hash")
    .maybeSingle();

export const fetchCatalogByGroupCode = async (groupCode) =>
  supabase
    .from("catalogs")
    .select("id, data, group_code")
    .eq("group_code", groupCode)
    .maybeSingle();

export const createCatalog = async ({ groupCode, groupName, data }) =>
  supabase
    .from("catalogs")
    .insert({
      group_code: groupCode,
      group_name: groupName,
      data,
    })
    .select()
    .single();

export const upsertCatalog = async ({ catalogId, groupCode, data }) => {
  const payload = {
    group_code: groupCode,
    data,
    updated_at: new Date().toISOString(),
  };
  if (catalogId) {
    payload.id = catalogId;
  }
  return supabase
    .from("catalogs")
    .upsert(payload, { onConflict: "group_code" })
    .select("id")
    .single();
};

export const upsertAccessPasswordHash = async (hash) =>
  supabase.from("site_settings").upsert(
    {
      key: "access_password_hash",
      value: hash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
