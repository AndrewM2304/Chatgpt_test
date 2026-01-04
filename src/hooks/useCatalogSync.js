import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCatalogGroup,
  fetchAccessPasswordHash,
  fetchCatalogDataByGroupId,
  fetchCatalogGroupByCode,
  fetchLegacyCatalogByGroupCode,
  checkSupabaseAccess,
  upsertAccessPasswordHash,
  upsertCatalogData,
} from "../lib/catalogService.js";
import { hashPassword } from "../lib/crypto.js";

const STATUS_MESSAGES = {
  connecting: "Connecting to Supabase...",
  ready: "Connected to Supabase.",
  waiting: "Choose or create a group to start syncing.",
  networkError: "Unable to reach Supabase. Check your connection and try again.",
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
  const [diagnostics, setDiagnostics] = useState({
    checks: [],
    lastCheckedAt: null,
    error: null,
  });
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [passwordHash, setPasswordHash] = useState(null);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const pendingChangesRef = useRef(false);
  const changeIdRef = useRef(0);
  const catalogRef = useRef(catalog);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  const hasCatalogContent = useCallback(
    (data) =>
      ["recipes", "cookbooks", "cuisines", "logs"].some(
        (key) => Array.isArray(data?.[key]) && data[key].length > 0
      ),
    []
  );

  const resolveStatusMessage = useCallback(
    (error) =>
      error?.isNetworkError ? STATUS_MESSAGES.networkError : STATUS_MESSAGES.error,
    []
  );

  const buildErrorDetails = useCallback((error) => {
    if (!error) {
      return null;
    }
    return {
      name: error.name || null,
      message: error.message || null,
      code: error.code || error.status || error.statusCode || null,
      details: error.details || null,
      hint: error.hint || null,
      isNetworkError: Boolean(error.isNetworkError),
    };
  }, []);

  const markCatalogChange = useCallback(() => {
    changeIdRef.current += 1;
    pendingChangesRef.current = true;
    setPendingChanges(true);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await fetchAccessPasswordHash();

    if (error) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(error),
        details: buildErrorDetails(error),
      });
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
        setStatus({
          state: "error",
          message: resolveStatusMessage(legacyError),
          details: buildErrorDetails(legacyError),
        });
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
          setStatus({
            state: "error",
            message: resolveStatusMessage(createError),
            details: buildErrorDetails(createError),
          });
          return null;
        }

        const { error: seedError } = await upsertCatalogData({
          groupId: created.id,
          data: legacyData.data,
        });
        if (seedError) {
          setStatus({
            state: "error",
            message: resolveStatusMessage(seedError),
            details: buildErrorDetails(seedError),
          });
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
        setStatus({
          state: "error",
          message: resolveStatusMessage(seedError),
          details: buildErrorDetails(seedError),
        });
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
    [
      buildErrorDetails,
      hasCatalogContent,
      resolveStatusMessage,
      setCatalog,
      setGroupId,
      setStatus,
    ]
  );

  const ensureCatalog = useCallback(async () => {
    const currentCatalog = catalogRef.current;
    const { data, error } = await fetchCatalogGroupByCode(groupCode);

    if (error) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(error),
        details: buildErrorDetails(error),
      });
      return null;
    }

    if (data) {
      const { data: catalogData, error: catalogError } =
        await fetchCatalogDataByGroupId(data.id);
      if (catalogError) {
        setStatus({
          state: "error",
          message: resolveStatusMessage(catalogError),
          details: buildErrorDetails(catalogError),
        });
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
        if (hasCatalogContent(currentCatalog)) {
          const { error: seedError } = await upsertCatalogData({
            groupId: data.id,
            data: currentCatalog,
          });
          if (seedError) {
            setStatus({
              state: "error",
              message: resolveStatusMessage(seedError),
              details: buildErrorDetails(seedError),
            });
            return null;
          }
          setGroupId(data.id);
          setCatalog(currentCatalog);
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
      setStatus({
        state: "error",
        message: resolveStatusMessage(createError),
        details: buildErrorDetails(createError),
      });
      return null;
    }

    const { error: seedError } = await upsertCatalogData({
      groupId: created.id,
      data: defaultCatalog,
    });
    if (seedError) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(seedError),
        details: buildErrorDetails(seedError),
      });
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
    buildErrorDetails,
    defaultCatalog,
    groupCode,
    hasCatalogContent,
    loadLegacyCatalog,
    resolveStatusMessage,
    setCatalog,
    setGroupId,
  ]);

  const syncCatalog = useCallback(async () => {
    const currentCatalog = catalogRef.current;
    if (!groupCode) {
      return null;
    }
    const { data, error } = await fetchCatalogGroupByCode(groupCode);

    if (error) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(error),
        details: buildErrorDetails(error),
      });
      return null;
    }

    if (!data) {
      return null;
    }
    const { data: catalogData, error: catalogError } =
      await fetchCatalogDataByGroupId(data.id);
    if (catalogError) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(catalogError),
        details: buildErrorDetails(catalogError),
      });
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
      if (hasCatalogContent(currentCatalog)) {
        const { error: seedError } = await upsertCatalogData({
          groupId: data.id,
          data: currentCatalog,
        });
        if (seedError) {
          setStatus({
            state: "error",
            message: resolveStatusMessage(seedError),
            details: buildErrorDetails(seedError),
          });
          return null;
        }
        setGroupId(data.id);
        setCatalog(currentCatalog);
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
    buildErrorDetails,
    defaultCatalog,
    groupCode,
    hasCatalogContent,
    loadLegacyCatalog,
    resolveStatusMessage,
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
        setStatus({
          state: "waiting",
          message: STATUS_MESSAGES.waiting,
          details: null,
        });
        return;
      }
      setStatus({
        state: "connecting",
        message: STATUS_MESSAGES.connecting,
        details: null,
      });
      try {
        const settingsResult = await loadSettings();
        const catalogResult = await ensureCatalog();

        if (isMounted && settingsResult !== null && catalogResult !== null) {
          setStatus({
            state: "ready",
            message: STATUS_MESSAGES.ready,
            details: null,
          });
          setHasLoadedCatalog(true);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setStatus({
          state: "error",
          message: resolveStatusMessage(error),
          details: buildErrorDetails(error),
        });
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
          message: resolveStatusMessage(error),
          details: buildErrorDetails(error),
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
  }, [buildErrorDetails, catalog, groupCode, groupId, hasLoadedCatalog]);

  const setAccessPassword = useCallback(async (value) => {
    const hash = await hashPassword(value);
    const { error } = await upsertAccessPasswordHash(hash);

    if (error) {
      setStatus({
        state: "error",
        message: resolveStatusMessage(error),
        details: buildErrorDetails(error),
      });
      return false;
    }

    setPasswordHash(hash);
    return true;
  }, [buildErrorDetails, resolveStatusMessage]);

  const runDiagnostics = useCallback(async () => {
    setIsDiagnosticsRunning(true);
    const { data, error } = await checkSupabaseAccess({ groupCode, groupId });
    setDiagnostics({
      checks: data || [],
      lastCheckedAt: new Date().toISOString(),
      error: buildErrorDetails(error),
    });
    setIsDiagnosticsRunning(false);
  }, [buildErrorDetails, groupCode, groupId]);

  return {
    status,
    isSaving,
    pendingChanges,
    lastSyncAt,
    lastSaveAt,
    diagnostics,
    isDiagnosticsRunning,
    passwordHash,
    setAccessPassword,
    syncCatalog,
    markCatalogChange,
    setStatus,
    setGroupId,
    runDiagnostics,
  };
};
