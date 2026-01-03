import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCatalog,
  fetchAccessPasswordHash,
  fetchCatalogByGroupCode,
  upsertAccessPasswordHash,
  upsertCatalog,
} from "../lib/catalogService.js";
import { hashPassword } from "../lib/crypto.js";

const STATUS_MESSAGES = {
  connecting: "Connecting to Supabase...",
  ready: "Connected to Supabase.",
  waiting: "Choose or create a group to start syncing.",
  error:
    "Supabase tables are missing or inaccessible. Run the setup SQL in the app.",
};

export const useCatalogSync = ({
  catalog,
  catalogId,
  defaultCatalog,
  groupCode,
  setCatalog,
  setCatalogId,
}) => {
  const [status, setStatus] = useState({
    state: "connecting",
    message: STATUS_MESSAGES.connecting,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [passwordHash, setPasswordHash] = useState(null);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const pendingChangesRef = useRef(false);
  const changeIdRef = useRef(0);

  const markCatalogChange = useCallback(() => {
    changeIdRef.current += 1;
    pendingChangesRef.current = true;
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await fetchAccessPasswordHash();

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setPasswordHash(data?.value || "");
    return data?.value || "";
  }, []);

  const ensureCatalog = useCallback(async () => {
    const { data, error } = await fetchCatalogByGroupCode(groupCode);

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    if (data) {
      setCatalogId(data.id);
      setCatalog(data.data || defaultCatalog);
      pendingChangesRef.current = false;
      changeIdRef.current = 0;
      return data.id;
    }

    const { data: created, error: createError } = await createCatalog({
      groupCode,
      groupName: "Home kitchen",
      data: defaultCatalog,
    });

    if (createError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setCatalogId(created.id);
    setCatalog(created.data || defaultCatalog);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
    return created.id;
  }, [defaultCatalog, groupCode, setCatalog, setCatalogId]);

  const syncCatalog = useCallback(async () => {
    if (!groupCode) {
      return null;
    }
    const { data, error } = await fetchCatalogByGroupCode(groupCode);

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    if (!data) {
      return null;
    }

    setCatalogId(data.id);
    setCatalog(data.data || defaultCatalog);
    setHasLoadedCatalog(true);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
    return data.data || defaultCatalog;
  }, [defaultCatalog, groupCode, setCatalog, setCatalogId]);

  useEffect(() => {
    setHasLoadedCatalog(false);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
  }, [groupCode]);

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
        setHasLoadedCatalog(true);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [ensureCatalog, groupCode, loadSettings]);

  useEffect(() => {
    if (!groupCode || typeof window === "undefined") {
      return undefined;
    }

    const refreshCatalog = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (pendingChangesRef.current || isSaving) {
        return;
      }
      syncCatalog();
    };

    refreshCatalog();
    window.addEventListener("focus", refreshCatalog);
    document.addEventListener("visibilitychange", refreshCatalog);

    return () => {
      window.removeEventListener("focus", refreshCatalog);
      document.removeEventListener("visibilitychange", refreshCatalog);
    };
  }, [groupCode, isSaving, syncCatalog]);

  useEffect(() => {
    if (!groupCode || !hasLoadedCatalog || !pendingChangesRef.current) {
      return undefined;
    }

    const changeId = changeIdRef.current;
    const timeout = window.setTimeout(async () => {
      setIsSaving(true);
      const { data, error } = await upsertCatalog({
        catalogId,
        groupCode,
        data: catalog,
      });

      if (error) {
        setStatus((prev) => ({
          ...prev,
          state: "error",
          message: STATUS_MESSAGES.error,
        }));
      } else if (!catalogId && data?.id) {
        setCatalogId(data.id);
      }
      if (!error && changeId === changeIdRef.current) {
        pendingChangesRef.current = false;
      }
      setIsSaving(false);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [catalog, catalogId, groupCode, hasLoadedCatalog, setCatalogId]);

  const setAccessPassword = useCallback(async (value) => {
    const hash = await hashPassword(value);
    const { error } = await upsertAccessPasswordHash(hash);

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return false;
    }

    setPasswordHash(hash);
    return true;
  }, []);

  return {
    status,
    isSaving,
    passwordHash,
    setAccessPassword,
    syncCatalog,
    markCatalogChange,
    setStatus,
    setCatalogId,
  };
};
