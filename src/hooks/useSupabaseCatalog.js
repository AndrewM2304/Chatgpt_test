import { useCallback, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { useCatalogSync } from "./useCatalogSync.js";
import { useGroupManagement } from "./useGroupManagement.js";
import { useCatalogGroups } from "./useCatalogGroups.js";

const DEFAULT_CATALOG = {
  recipes: [],
  cookbooks: [],
  cuisines: [],
  logs: [],
};

export const useSupabaseCatalog = () => {
  const [catalog, setCatalog] = useLocalStorage(
    "recipe-catalog-cache",
    DEFAULT_CATALOG
  );
  const [catalogId, setCatalogId] = useState(null);
  const { groupCode, setGroupCode, inviteUrl } = useGroupManagement();
  const {
    status,
    isSaving,
    passwordHash,
    setAccessPassword,
    syncCatalog,
    markCatalogChange,
    setStatus,
  } = useCatalogSync({
    catalog,
    catalogId,
    defaultCatalog: DEFAULT_CATALOG,
    groupCode,
    setCatalog,
    setCatalogId,
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

  const statusMessages = useMemo(
    () => ({
      error:
        "Supabase tables are missing or inaccessible. Run the setup SQL in the app.",
    }),
    []
  );
  const { createNewGroup, joinGroup } = useCatalogGroups({
    catalog,
    defaultCatalog: DEFAULT_CATALOG,
    setCatalog,
    setCatalogId,
    setGroupCode,
    setStatus,
    statusMessages,
  });

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
    syncCatalog,
  };
};
