import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCatalogGroup,
  fetchAccessPasswordHash,
  fetchCatalogDataByGroupId,
  fetchCatalogGroupByCode,
  fetchLegacyCatalogByGroupCode,
  upsertAccessPasswordHash,
  upsertCatalogData,
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
  groupId,
  defaultCatalog,
  groupCode,
  setCatalog,
  setGroupId,
}) => {
  const [status, setStatus] = useState({
    state: "connecting",
    message: STATUS_MESSAGES.connecting,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [lastSaveAt, setLastSaveAt] = useState(null);
  const [passwordHash, setPasswordHash] = useState(null);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const pendingChangesRef = useRef(false);
  const changeIdRef = useRef(0);

  const hasCatalogContent = useCallback(
    (data) =>
      ["recipes", "cookbooks", "cuisines", "logs"].some(
        (key) => Array.isArray(data?.[key]) && data[key].length > 0
      ),
    []
  );

  const markCatalogChange = useCallback(() => {
    changeIdRef.current += 1;
    pendingChangesRef.current = true;
    setPendingChanges(true);
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

  const loadLegacyCatalog = useCallback(
    async ({ groupCode, groupId }) => {
      const { data: legacyData, error: legacyError } =
        await fetchLegacyCatalogByGroupCode(groupCode);

      if (legacyError) {
        setStatus({ state: "error", message: STATUS_MESSAGES.error });
        return null;
      }

      if (!legacyData?.data || !hasCatalogContent(legacyData.data)) {
        return null;
      }

      if (!groupId) {
        const { data: created, error: createError } = await createCatalogGroup({
          groupCode,
          groupName: legacyData.group_name || "Home kitchen",
        });

        if (createError) {
          setStatus({ state: "error", message: STATUS_MESSAGES.error });
          return null;
        }

        const { error: seedError } = await upsertCatalogData({
          groupId: created.id,
          data: legacyData.data,
        });
        if (seedError) {
          setStatus({ state: "error", message: STATUS_MESSAGES.error });
          return null;
        }

        setGroupId(created.id);
        setCatalog(legacyData.data);
        pendingChangesRef.current = false;
        changeIdRef.current = 0;
        setPendingChanges(false);
        setLastSyncAt(new Date().toISOString());
        return created.id;
      }

      const { error: seedError } = await upsertCatalogData({
        groupId,
        data: legacyData.data,
      });
      if (seedError) {
        setStatus({ state: "error", message: STATUS_MESSAGES.error });
        return null;
      }

      setGroupId(groupId);
      setCatalog(legacyData.data);
      pendingChangesRef.current = false;
      changeIdRef.current = 0;
      setPendingChanges(false);
      setLastSyncAt(new Date().toISOString());
      return groupId;
    },
    [hasCatalogContent, setCatalog, setGroupId, setStatus]
  );

  const ensureCatalog = useCallback(async () => {
    const { data, error } = await fetchCatalogGroupByCode(groupCode);

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    if (data) {
      const { data: catalogData, error: catalogError } =
        await fetchCatalogDataByGroupId(data.id);
      if (catalogError) {
        setStatus({ state: "error", message: STATUS_MESSAGES.error });
        return null;
      }
      if (!hasCatalogContent(catalogData)) {
        const legacyGroupId = await loadLegacyCatalog({
          groupCode,
          groupId: data.id,
        });
        if (legacyGroupId) {
          return legacyGroupId;
        }
        if (hasCatalogContent(catalog)) {
          const { error: seedError } = await upsertCatalogData({
            groupId: data.id,
            data: catalog,
          });
          if (seedError) {
            setStatus({ state: "error", message: STATUS_MESSAGES.error });
            return null;
          }
          setGroupId(data.id);
          setCatalog(catalog);
          pendingChangesRef.current = false;
          changeIdRef.current = 0;
          setPendingChanges(false);
          setLastSyncAt(new Date().toISOString());
          return data.id;
        }
      }
      setGroupId(data.id);
      setCatalog(catalogData || defaultCatalog);
      pendingChangesRef.current = false;
      changeIdRef.current = 0;
      setPendingChanges(false);
      setLastSyncAt(new Date().toISOString());
      return data.id;
    }

    const legacyGroupId = await loadLegacyCatalog({ groupCode, groupId: null });
    if (legacyGroupId) {
      return legacyGroupId;
    }

    const { data: created, error: createError } = await createCatalogGroup({
      groupCode,
      groupName: "Home kitchen",
    });

    if (createError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    const { error: seedError } = await upsertCatalogData({
      groupId: created.id,
      data: defaultCatalog,
    });
    if (seedError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    setGroupId(created.id);
    setCatalog(defaultCatalog);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
    setPendingChanges(false);
    setLastSyncAt(new Date().toISOString());
    return created.id;
  }, [
    catalog,
    defaultCatalog,
    groupCode,
    hasCatalogContent,
    loadLegacyCatalog,
    setCatalog,
    setGroupId,
  ]);

  const syncCatalog = useCallback(async () => {
    if (!groupCode) {
      return null;
    }
    const { data, error } = await fetchCatalogGroupByCode(groupCode);

    if (error) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }

    if (!data) {
      return null;
    }
    const { data: catalogData, error: catalogError } =
      await fetchCatalogDataByGroupId(data.id);
    if (catalogError) {
      setStatus({ state: "error", message: STATUS_MESSAGES.error });
      return null;
    }
    if (!hasCatalogContent(catalogData)) {
      const legacyGroupId = await loadLegacyCatalog({
        groupCode,
        groupId: data.id,
      });
      if (legacyGroupId) {
        setGroupId(data.id);
        setHasLoadedCatalog(true);
        setLastSyncAt(new Date().toISOString());
        return legacyGroupId;
      }
      if (hasCatalogContent(catalog)) {
        const { error: seedError } = await upsertCatalogData({
          groupId: data.id,
          data: catalog,
        });
        if (seedError) {
          setStatus({ state: "error", message: STATUS_MESSAGES.error });
          return null;
        }
        setGroupId(data.id);
        setCatalog(catalog);
        setHasLoadedCatalog(true);
        pendingChangesRef.current = false;
        changeIdRef.current = 0;
        setPendingChanges(false);
        setLastSyncAt(new Date().toISOString());
        return catalog;
      }
    }
    setGroupId(data.id);
    setCatalog(catalogData || defaultCatalog);
    setHasLoadedCatalog(true);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
    setPendingChanges(false);
    setLastSyncAt(new Date().toISOString());
    return catalogData || defaultCatalog;
  }, [
    catalog,
    defaultCatalog,
    groupCode,
    hasCatalogContent,
    loadLegacyCatalog,
    setCatalog,
    setGroupId,
  ]);

  useEffect(() => {
    setHasLoadedCatalog(false);
    pendingChangesRef.current = false;
    changeIdRef.current = 0;
    setPendingChanges(false);
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
    if (!groupCode || !groupId || !hasLoadedCatalog || !pendingChangesRef.current) {
      return undefined;
    }

    const changeId = changeIdRef.current;
    const timeout = window.setTimeout(async () => {
      setIsSaving(true);
      const { error } = await upsertCatalogData({
        groupId,
        data: catalog,
      });

      if (error) {
        setStatus((prev) => ({
          ...prev,
          state: "error",
          message: STATUS_MESSAGES.error,
        }));
      }
      if (!error && changeId === changeIdRef.current) {
        pendingChangesRef.current = false;
        setPendingChanges(false);
        setLastSaveAt(new Date().toISOString());
      }
      setIsSaving(false);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [catalog, groupCode, groupId, hasLoadedCatalog]);

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
    pendingChanges,
    lastSyncAt,
    lastSaveAt,
    passwordHash,
    setAccessPassword,
    syncCatalog,
    markCatalogChange,
    setStatus,
    setGroupId,
  };
};
