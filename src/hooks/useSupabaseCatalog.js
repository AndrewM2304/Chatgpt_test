import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { useCatalogSync } from "./useCatalogSync.js";
import { useGroupManagement } from "./useGroupManagement.js";
import { useCatalogGroups } from "./useCatalogGroups.js";

const DEFAULT_CATALOG = {
  recipes: [],
  cookbooks: [],
  cuisines: [],
  logs: [],
  freezerMeals: [],
};

export const useSupabaseCatalog = () => {
  const [catalog, setCatalog] = useLocalStorage(
    "recipe-catalog-cache",
    DEFAULT_CATALOG
  );
  useEffect(() => {
    setCatalog((prev) => {
      if (!prev || typeof prev !== "object") {
        return DEFAULT_CATALOG;
      }
      const hasAllKeys = Object.keys(DEFAULT_CATALOG).every(
        (key) => key in prev
      );
      if (hasAllKeys) {
        return prev;
      }
      return { ...DEFAULT_CATALOG, ...prev };
    });
  }, [setCatalog]);
  const [groupId, setGroupId] = useState(null);
  const { groupCode, setGroupCode, inviteUrl } = useGroupManagement();
  const {
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
    runDiagnostics,
  } = useCatalogSync({
    catalog,
    groupId,
    defaultCatalog: DEFAULT_CATALOG,
    groupCode,
    setCatalog,
    setGroupId,
  });

  const updateCatalog = useCallback(
    (key, updater) => {
      setCatalog((prev) => {
        const nextValue =
          typeof updater === "function" ? updater(prev[key]) : updater;
        if (Object.is(nextValue, prev[key])) {
          return prev;
        }
        markCatalogChange();
        return { ...prev, [key]: nextValue };
      });
    },
    [markCatalogChange, setCatalog]
  );

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
  const setFreezerMeals = useCallback(
    (updater) => updateCatalog("freezerMeals", updater),
    [updateCatalog]
  );

  const statusMessages = useMemo(
    () => ({
      error:
        "Supabase tables are missing or inaccessible. Run the setup SQL in the app.",
      networkError:
        "Unable to reach Supabase. Check your connection and try again.",
    }),
    []
  );
  const { createNewGroup, joinGroup } = useCatalogGroups({
    catalog,
    defaultCatalog: DEFAULT_CATALOG,
    setCatalog,
    setGroupId,
    setGroupCode,
    setStatus,
    statusMessages,
  });

  const clearLocalData = useCallback(() => {
    setGroupCode("");
    setGroupId(null);
    setCatalog(DEFAULT_CATALOG);
  }, [setCatalog, setGroupCode, setGroupId]);

  return {
    catalog,
    setRecipes,
    setCookbooks,
    setCuisines,
    setLogs,
    setFreezerMeals,
    status,
    isSaving,
    pendingChanges,
    lastSyncAt,
    lastSaveAt,
    diagnostics,
    isDiagnosticsRunning,
    passwordHash,
    setAccessPassword,
    inviteUrl,
    groupCode,
    groupId,
    createNewGroup,
    joinGroup,
    clearLocalData,
    syncCatalog,
    runDiagnostics,
  };
};
