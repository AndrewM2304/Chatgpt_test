import { supabase } from "./supabaseClient.js";

export const fetchAccessPasswordHash = async () =>
  supabase
    .from("site_settings")
    .select("value")
    .eq("key", "access_password_hash")
    .maybeSingle();

const summarizeSupabaseError = (error) => {
  if (!error) {
    return null;
  }
  return {
    message: error.message || "Unknown error",
    code: error.code || error.statusCode || error.status || null,
    details: error.details || null,
    hint: error.hint || null,
    isNetworkError: Boolean(error.isNetworkError),
  };
};

export const fetchCatalogGroupByCode = async (groupCode) => {
  const trimmedCode = String(groupCode || "").trim();
  if (!trimmedCode) {
    return { data: null, error: null };
  }

  const exactMatch = await supabase
    .from("catalog_groups")
    .select("id, group_code, group_name")
    .eq("group_code", trimmedCode)
    .maybeSingle();

  if (exactMatch.error || exactMatch.data) {
    return exactMatch;
  }

  return supabase
    .from("catalog_groups")
    .select("id, group_code, group_name")
    .ilike("group_code", trimmedCode)
    .maybeSingle();
};

export const fetchLegacyCatalogByGroupCode = async (groupCode) =>
  supabase
    .from("catalogs")
    .select("group_code, group_name, data, updated_at")
    .eq("group_code", groupCode)
    .maybeSingle();

export const createCatalogGroup = async ({ groupCode, groupName }) =>
  supabase
    .from("catalog_groups")
    .insert({
      group_code: groupCode,
      group_name: groupName,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

const normalizeRecipeRow = (row) => ({
  id: row.id,
  name: row.name,
  sourceType: row.source_type || "",
  cookbookTitle: row.cookbook_title || "",
  cuisine: row.cuisine || "",
  page: row.page || "",
  url: row.url || "",
  rating: row.rating ?? null,
  durationMinutes: row.duration_minutes ?? null,
  notes: row.notes || "",
  timesCooked: row.times_cooked ?? 0,
  lastCooked: row.last_cooked || null,
});

const normalizeCookbookRow = (row) => ({
  title: row.title,
  coverUrl: row.cover_url || "",
});

const normalizeLogRow = (row) => ({
  id: row.id,
  recipeId: row.recipe_id || null,
  name: row.name,
  cuisine: row.cuisine || null,
  cookbookTitle: row.cookbook_title || null,
  date: row.date || null,
  meal: row.meal || null,
  timestamp: row.timestamp || null,
  note: row.note || "",
});

export const fetchCatalogDataByGroupId = async (groupId) => {
  const [recipes, cookbooks, cuisines, logs] = await Promise.all([
    supabase.from("recipes").select("*").eq("group_id", groupId),
    supabase.from("cookbooks").select("*").eq("group_id", groupId),
    supabase.from("cuisines").select("*").eq("group_id", groupId),
    supabase.from("logs").select("*").eq("group_id", groupId),
  ]);

  const error = recipes.error || cookbooks.error || cuisines.error || logs.error;
  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      recipes: (recipes.data || []).map(normalizeRecipeRow),
      cookbooks: (cookbooks.data || []).map(normalizeCookbookRow),
      cuisines: (cuisines.data || []).map((row) => row.name),
      logs: (logs.data || []).map(normalizeLogRow),
    },
    error: null,
  };
};

const buildRecipePayload = (recipe, groupId) => ({
  group_id: groupId,
  id: recipe.id,
  name: recipe.name,
  source_type: recipe.sourceType || null,
  cookbook_title: recipe.cookbookTitle || null,
  cuisine: recipe.cuisine || null,
  page: recipe.page || null,
  url: recipe.url || null,
  rating: recipe.rating ?? null,
  duration_minutes: recipe.durationMinutes ?? null,
  notes: recipe.notes || null,
  times_cooked: recipe.timesCooked ?? 0,
  last_cooked: recipe.lastCooked || null,
  updated_at: new Date().toISOString(),
});

const buildCookbookPayload = (cookbook, groupId) => ({
  group_id: groupId,
  title: cookbook.title,
  cover_url: cookbook.coverUrl || "",
  updated_at: new Date().toISOString(),
});

const buildCuisinePayload = (name, groupId) => ({
  group_id: groupId,
  name,
  updated_at: new Date().toISOString(),
});

const buildLogPayload = (entry, groupId) => ({
  group_id: groupId,
  id: entry.id,
  recipe_id: entry.recipeId || null,
  name: entry.name,
  cuisine: entry.cuisine || null,
  cookbook_title: entry.cookbookTitle || null,
  date: entry.date || null,
  meal: entry.meal || null,
  timestamp: entry.timestamp || null,
  note: entry.note || null,
});

const escapeFilterValue = (value) => String(value).replaceAll('"', '\\"');

const deleteMissingRows = async ({ table, groupId, column, values }) => {
  const base = supabase.from(table).delete().eq("group_id", groupId);
  if (values.length === 0) {
    return base;
  }
  return base.not(
    column,
    "in",
    `(${values.map((value) => `"${escapeFilterValue(value)}"`).join(",")})`
  );
};

export const upsertCatalogData = async ({ groupId, data }) => {
  const recipes = Array.isArray(data.recipes) ? data.recipes : [];
  const cookbooks = Array.isArray(data.cookbooks) ? data.cookbooks : [];
  const cuisines = Array.isArray(data.cuisines) ? data.cuisines : [];
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const recipeIds = recipes.map((recipe) => recipe.id).filter(Boolean);
  const cookbookTitles = cookbooks
    .map((cookbook) => cookbook.title)
    .filter(Boolean);
  const cuisineNames = cuisines.filter(Boolean);
  const logIds = logs.map((entry) => entry.id).filter(Boolean);

  const recipePayload = recipes
    .filter((recipe) => recipe.id)
    .map((recipe) => buildRecipePayload(recipe, groupId));
  const cookbookPayload = cookbooks
    .filter((cookbook) => cookbook.title)
    .map((cookbook) => buildCookbookPayload(cookbook, groupId));
  const cuisinePayload = cuisines
    .filter(Boolean)
    .map((name) => buildCuisinePayload(name, groupId));
  const logPayload = logs
    .filter((entry) => entry.id)
    .map((entry) => buildLogPayload(entry, groupId));

  const [recipeUpsert, cookbookUpsert, cuisineUpsert, logUpsert] =
    await Promise.all([
      recipePayload.length
        ? supabase
            .from("recipes")
            .upsert(recipePayload, { onConflict: "group_id,id" })
        : Promise.resolve({ error: null }),
      cookbookPayload.length
        ? supabase
            .from("cookbooks")
            .upsert(cookbookPayload, { onConflict: "group_id,title" })
        : Promise.resolve({ error: null }),
      cuisinePayload.length
        ? supabase
            .from("cuisines")
            .upsert(cuisinePayload, { onConflict: "group_id,name" })
        : Promise.resolve({ error: null }),
      logPayload.length
        ? supabase
            .from("logs")
            .upsert(logPayload, { onConflict: "group_id,id" })
        : Promise.resolve({ error: null }),
    ]);

  const upsertError =
    recipeUpsert.error ||
    cookbookUpsert.error ||
    cuisineUpsert.error ||
    logUpsert.error;
  if (upsertError) {
    return { error: upsertError };
  }

  const [recipeDelete, cookbookDelete, cuisineDelete, logDelete] =
    await Promise.all([
      deleteMissingRows({
        table: "recipes",
        groupId,
        column: "id",
        values: recipeIds,
      }),
      deleteMissingRows({
        table: "cookbooks",
        groupId,
        column: "title",
        values: cookbookTitles,
      }),
      deleteMissingRows({
        table: "cuisines",
        groupId,
        column: "name",
        values: cuisineNames,
      }),
      deleteMissingRows({
        table: "logs",
        groupId,
        column: "id",
        values: logIds,
      }),
    ]);

  const deleteError =
    recipeDelete.error ||
    cookbookDelete.error ||
    cuisineDelete.error ||
    logDelete.error;
  if (deleteError) {
    return { error: deleteError };
  }

  const { error: groupError } = await supabase
    .from("catalog_groups")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (groupError) {
    return { error: groupError };
  }

  return { error: null };
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

export const checkSupabaseAccess = async ({ groupCode, groupId } = {}) => {
  const catalogGroupQuery = groupCode
    ? supabase
        .from("catalog_groups")
        .select("id, group_code")
        .eq("group_code", groupCode)
        .limit(1)
    : supabase.from("catalog_groups").select("id, group_code").limit(1);
  const groupScopedQuery = (table, columns) =>
    groupId
      ? supabase.from(table).select(columns).eq("group_id", groupId).limit(1)
      : supabase.from(table).select(columns).limit(1);

  const checks = [
    {
      label: "site_settings (read)",
      request: supabase.from("site_settings").select("key").limit(1),
    },
    { label: "catalog_groups (read)", request: catalogGroupQuery },
    { label: "recipes (read)", request: groupScopedQuery("recipes", "id") },
    {
      label: "cookbooks (read)",
      request: groupScopedQuery("cookbooks", "title"),
    },
    {
      label: "cuisines (read)",
      request: groupScopedQuery("cuisines", "name"),
    },
    { label: "logs (read)", request: groupScopedQuery("logs", "id") },
  ];

  const results = await Promise.all(
    checks.map(async ({ label, request }) => {
      const { data, error } = await request;
      const rows = Array.isArray(data) ? data.length : data ? 1 : 0;
      return {
        label,
        ok: !error,
        rows,
        error: summarizeSupabaseError(error),
      };
    })
  );

  return { data: results, error: null };
};
