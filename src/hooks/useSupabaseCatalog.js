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
  waiting: "Choose or create a group to start syncing.",
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
    ""
  );
  const [catalogId, setCatalogId] = useState(null);
  const [passwordHash, setPasswordHash] = useState(null);
  const [status, setStatus] = useState({
    state: "connecting",
    message: STATUS_MESSAGES.connecting,
  });
  const [isSaving, setIsSaving] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !groupCode) {
      return "";
    }
    const baseUrl = new URL(
      import.meta.env.BASE_URL || "/",
      window.location.origin
    );
    baseUrl.searchParams.set("invite", groupCode);
    return baseUrl.toString();
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
      if (!groupCode) {
        setStatus({ state: "waiting", message: STATUS_MESSAGES.waiting });
        return;
      }
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
  }, [ensureCatalog, groupCode, loadSettings]);

  useEffect(() => {
    if (!groupCode) {
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setIsSaving(true);
      const payload = {
        group_code: groupCode,
        data: catalog,
        updated_at: new Date().toISOString(),
      };
      if (catalogId) {
        payload.id = catalogId;
      }
      const { data, error } = await supabase
        .from("catalogs")
        .upsert(payload, { onConflict: "group_code" })
        .select("id")
        .single();

      if (error) {
        setStatus((prev) => ({
          ...prev,
          state: "error",
          message: STATUS_MESSAGES.error,
        }));
      } else if (!catalogId && data?.id) {
        setCatalogId(data.id);
      }
      setIsSaving(false);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [catalog, catalogId, groupCode]);

  const setAccessPassword = useCallback(async (value) => {
    const hash = await hashPassword(value);
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "access_password_hash",
        value: hash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return false;
    }

    setPasswordHash(hash);
    return true;
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

  const joinGroup = useCallback(
    (code) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return false;
      }
      setGroupCode(trimmed);
      setCatalogId(null);
      setCatalog(DEFAULT_CATALOG);
      return true;
    },
    [setCatalog, setGroupCode]
  );

  return {
    catalog,
    setRecipes,
    setCookbooks,
    setCuisines,
    setLogs,
    status,
    isSaving,
    passwordHash,
    setAccessPassword,
    inviteUrl,
    groupCode,
    createNewGroup,
    joinGroup,
  };
};
