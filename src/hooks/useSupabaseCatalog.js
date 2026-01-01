import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { hashPassword } from "../lib/crypto";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_CATALOG = {
  recipes: [],
  cookbooks: [],
  cuisines: [],
  logs: [],
};

const STATUS_MESSAGES = {
  connecting: "Connecting to Supabase...",
  ready: "Connected to Supabase.",
  error:
    "Supabase tables are missing or inaccessible. Run the setup SQL in the app.",
};

const generateGroupCode = () =>
  `group-${crypto.randomUUID().split("-")[0]}`.toLowerCase();

export const useSupabaseCatalog = () => {
  const [catalog, setCatalog] = useLocalStorage(
    "recipe-catalog-cache",
    DEFAULT_CATALOG
  );
  const [groupCode, setGroupCode] = useLocalStorage(
    "recipe-group-code",
    "home-kitchen"
  );
  const [catalogId, setCatalogId] = useState(null);
  const [passwordHash, setPasswordHash] = useState(null);
  const [adminPasswordHash, setAdminPasswordHash] = useState(null);
  const [accessGranted, setAccessGranted] = useLocalStorage(
    "recipe-access-granted",
    false
  );
  const [status, setStatus] = useState({
    state: "connecting",
    message: STATUS_MESSAGES.connecting,
  });
  const [isSaving, setIsSaving] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}?invite=${groupCode}`;
  }, [groupCode]);

  const updateCatalog = useCallback((key, updater) => {
    setCatalog((prev) => {
      const nextValue =
        typeof updater === "function" ? updater(prev[key]) : updater;
      return { ...prev, [key]: nextValue };
    });
  }, [setCatalog]);

  const setRecipes = useCallback(
    (updater) => updateCatalog("recipes", updater),
    [updateCatalog]
  );
  const setCookbooks = useCallback(
    (updater) => updateCatalog("cookbooks", updater),
    [updateCatalog]
  );
  const setCuisines = useCallback(
    (updater) => updateCatalog("cuisines", updater),
    [updateCatalog]
  );
  const setLogs = useCallback(
    (updater) => updateCatalog("logs", updater),
    [updateCatalog]
  );

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "access_password_hash")
      .maybeSingle();

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setPasswordHash(data?.value || "");
    const { data: adminData, error: adminError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "admin_password_hash")
      .maybeSingle();

    if (adminError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setAdminPasswordHash(adminData?.value || "");
    return data?.value || "";
  }, []);

  const ensureCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from("catalogs")
      .select("id, data, group_code")
      .eq("group_code", groupCode)
      .maybeSingle();

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    if (data) {
      setCatalogId(data.id);
      setCatalog(data.data || DEFAULT_CATALOG);
      return data.id;
    }

    const { data: created, error: createError } = await supabase
      .from("catalogs")
      .insert({
        group_code: groupCode,
        group_name: "Home kitchen",
        data: DEFAULT_CATALOG,
      })
      .select()
      .single();

    if (createError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setCatalogId(created.id);
    setCatalog(created.data || DEFAULT_CATALOG);
    return created.id;
  }, [groupCode, setCatalog]);

  useEffect(() => {
    const inviteCode =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("invite")
        : null;
    if (inviteCode && inviteCode !== groupCode) {
      setGroupCode(inviteCode);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", url);
      }
    }
  }, [groupCode, setGroupCode]);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      setStatus({ state: "connecting", message: STATUS_MESSAGES.connecting });
      const settingsResult = await loadSettings();
      const catalogResult = await ensureCatalog();

      if (isMounted && settingsResult !== null && catalogResult !== null) {
        setStatus({ state: "ready", message: STATUS_MESSAGES.ready });
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [ensureCatalog, loadSettings]);

  useEffect(() => {
    if (!catalogId || !accessGranted) {
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setIsSaving(true);
      const { error } = await supabase
        .from("catalogs")
        .update({ data: catalog, updated_at: new Date().toISOString() })
        .eq("id", catalogId);

      if (error) {
        setStatus((prev) => ({
          ...prev,
          state: "error",
          message: STATUS_MESSAGES.error,
        }));
      }
      setIsSaving(false);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [accessGranted, catalog, catalogId]);

  const setAccessPassword = useCallback(async (value) => {
    const hash = await hashPassword(value);
    const { error } = await supabase.from("site_settings").upsert({
      key: "access_password_hash",
      value: hash,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return false;
    }

    setPasswordHash(hash);
    setAccessGranted(true);
    return true;
  }, [setAccessGranted]);

  const setAdminPassword = useCallback(async (value) => {
    const hash = await hashPassword(value);
    const { error } = await supabase.from("site_settings").upsert({
      key: "admin_password_hash",
      value: hash,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return false;
    }

    setAdminPasswordHash(hash);
    return true;
  }, []);

  const verifyAccessPassword = useCallback(
    async (value) => {
      const hash = await hashPassword(value);
      const isMatch = hash === passwordHash;
      setAccessGranted(isMatch);
      return isMatch;
    },
    [passwordHash, setAccessGranted]
  );

  const runAdminSql = useCallback(async ({ sql, password }) => {
    const trimmedSql = sql.trim();
    if (!trimmedSql) {
      return { ok: false, error: "SQL cannot be empty." };
    }

    const hash = await hashPassword(password);
    const { error } = await supabase.rpc("run_admin_sql", {
      sql: trimmedSql,
      password_hash: hash,
    });

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return {
        ok: false,
        error: error?.message || "Failed to run admin SQL.",
      };
    }

    return { ok: true };
  }, []);

  const createNewGroup = useCallback(
    async ({ name, duplicate }) => {
      const newCode = generateGroupCode();
      const dataPayload = duplicate ? catalog : DEFAULT_CATALOG;
      const { data, error } = await supabase
        .from("catalogs")
        .insert({
          group_code: newCode,
          group_name: name || "Shared kitchen",
          data: dataPayload,
        })
        .select()
        .single();

      if (error) {
        setStatus({ state: "error", message: STATUS_MESSAGES.error });
        return null;
      }

      setGroupCode(newCode);
      setCatalogId(data.id);
      setCatalog(data.data || DEFAULT_CATALOG);
      return newCode;
    },
    [catalog, setCatalog, setGroupCode]
  );

  return {
    catalog,
    setRecipes,
    setCookbooks,
    setCuisines,
    setLogs,
    status,
    isSaving,
    accessGranted,
    passwordHash,
    adminPasswordHash,
    setAccessPassword,
    setAdminPassword,
    verifyAccessPassword,
    runAdminSql,
    inviteUrl,
    groupCode,
    createNewGroup,
  };
};
