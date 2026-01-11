import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useMatch, useNavigate } from "react-router-dom";
import { Hero } from "./components/Hero";
import { FreezerModal } from "./components/FreezerModal";
import { RecipePreviewModal } from "./components/RecipePreviewModal";
import { ScheduleModal } from "./components/ScheduleModal";
import { LandscapeHeaderNav } from "./components/LandscapeHeaderNav";
import { MobileTabBar } from "./components/MobileTabBar";
import { SettingsModal } from "./components/SettingsModal";
import { ToastStack } from "./components/ToastStack";
import { useUI } from "./context/UIContext.jsx";
import { buildCookbookCoverMap, buildCookbookCoverTargets, buildRecipeById } from "./lib/catalogDomain.js";
import { deleteFreezerMeal } from "./lib/catalogService.js";
import { useLogModalState } from "./hooks/useLogModalState.js";
import { useSupabaseCatalog } from "./hooks/useSupabaseCatalog";
import { CatalogRoute } from "./routes/CatalogRoute";
import { StorageRoute } from "./routes/StorageRoute";
import { RandomRoute } from "./routes/RandomRoute";
import { LogRoute } from "./routes/LogRoute";
import { SettingsRoute } from "./routes/SettingsRoute";
import { areCookbookEntriesEqual, mergeCookbookEntries, normalizeCookbookEntries } from "./utils/cookbookUtils.js";
import { toDateInputValue } from "./utils/dateUtils.js";
import { createId } from "./utils/idUtils.js";

const MEAL_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
];
const FREEZER_PORTION_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function App() {
  const {
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
    debugLogs,
    addDebugLog,
    clearDebugLogs,
    diagnostics,
    isDiagnosticsRunning,
    inviteUrl,
    groupCode,
    groupId,
    createNewGroup,
    joinGroup,
    clearLocalData,
    syncCatalog,
    runDiagnostics,
  } = useSupabaseCatalog();
  const navigate = useNavigate();
  const { recipes = [], logs = [], freezerMeals = [] } = catalog ?? {};
  const {
    isLogModalOpen,
    setIsLogModalOpen,
    isRecipeModalOpen,
    setIsRecipeModalOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    previewRecipeId,
    setPreviewRecipeId,
    addToast,
  } = useUI();
  const {
    state: logState,
    setLogWeekDate,
    setLogRecipeId,
    setLogRecipeQuery,
    setLogNote,
    setEditingLogId,
    setShouldNavigateAfterLog,
    toggleLogDay,
    toggleLogMeal,
    openForStart,
    openForEntry,
    resetForClose,
    resetAfterSubmit,
  } = useLogModalState();
  const [openAddRecipeSignal, setOpenAddRecipeSignal] = useState(0);
  const [pendingEditRecipeId, setPendingEditRecipeId] = useState(null);
  const [isLogWeekCustomized, setIsLogWeekCustomized] = useState(false);
  const [isFreezerModalOpen, setIsFreezerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [freezerMealName, setFreezerMealName] = useState("");
  const [freezerPortions, setFreezerPortions] = useState(
    String(FREEZER_PORTION_OPTIONS[0])
  );
  const [freezerCategory, setFreezerCategory] = useState("");
  const [freezerNotes, setFreezerNotes] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(min-width: 900px)").matches;
  });

  const recipeMatch = useMatch("/recipe/:recipeId");
  const catalogMatch = useMatch("/catalog");
  const homeMatch = useMatch({ path: "/", end: true });
  const logMatch = useMatch({ path: "/log", end: true });
  const isCatalogRoute = Boolean(homeMatch || catalogMatch || recipeMatch);
  const {
    logRecipeId,
    logRecipeQuery,
    logWeekDate,
    logSelectedDays,
    logSelectedMeals,
    logNote,
    editingLogId,
    shouldNavigateAfterLog,
  } = logState;
  const recipeOptions = useMemo(
    () =>
      recipes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((recipe) => recipe.name),
    [recipes]
  );

  useEffect(() => {
    const shouldLock =
      isRecipeModalOpen ||
      isLogModalOpen ||
      isPreviewOpen ||
      isFreezerModalOpen ||
      isSettingsModalOpen;
    document.body.classList.toggle("modal-open", shouldLock);
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [
    isRecipeModalOpen,
    isLogModalOpen,
    isPreviewOpen,
    isFreezerModalOpen,
    isSettingsModalOpen,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const mediaQuery = window.matchMedia("(min-width: 900px)");
    const handleChange = (event) => setIsDesktop(event.matches);
    setIsDesktop(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!logMatch || isLogWeekCustomized) {
      return;
    }
    const todayValue = toDateInputValue(new Date());
    if (logWeekDate !== todayValue) {
      setLogWeekDate(todayValue);
    }
  }, [isLogWeekCustomized, logMatch, logWeekDate, setLogWeekDate]);

  const cookbookEntries = useMemo(
    () => normalizeCookbookEntries(catalog.cookbooks),
    [catalog.cookbooks]
  );

  const cookbookOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cookbookTitle).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const settingsCookbookOptions = useMemo(() => {
    const options = new Set(cookbookOptions);
    const hasWebsiteRecipes = recipes.some(
      (recipe) =>
        recipe.sourceType === "website" || (!recipe.sourceType && recipe.url)
    );
    if (hasWebsiteRecipes) {
      options.add("Website");
    }
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [cookbookOptions, recipes]);

  const recipeById = useMemo(() => {
    return buildRecipeById(recipes);
  }, [recipes]);

  const cookbookCoverTargets = useMemo(() => {
    return buildCookbookCoverTargets({
      recipes,
      cookbookEntries,
      cookbookOptions,
    });
  }, [cookbookEntries, cookbookOptions, recipes]);

  const cookbookCoverMap = useMemo(
    () => buildCookbookCoverMap(cookbookEntries),
    [cookbookEntries]
  );

  const cuisineOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const freezerCategoryOptions = useMemo(() => {
    return Array.from(
      new Set(freezerMeals.map((item) => item.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [freezerMeals]);

  const storageByLocation = useMemo(() => {
    return freezerMeals.reduce((accumulator, item) => {
      const location = item.category?.trim() || "Unassigned";
      if (!accumulator[location]) {
        accumulator[location] = {
          location,
          items: [],
          itemCount: 0,
        };
      }
      accumulator[location].items.push(item);
      accumulator[location].itemCount += 1;
      return accumulator;
    }, {});
  }, [freezerMeals]);

  useEffect(() => {
    setCookbooks((prev) => {
      const next = mergeCookbookEntries(prev, cookbookCoverTargets);
      return areCookbookEntriesEqual(prev, next) ? prev : next;
    });
  }, [cookbookCoverTargets, setCookbooks]);

  useEffect(() => {
    setCuisines((prev) => {
      if (prev.length !== cuisineOptions.length) {
        return cuisineOptions;
      }
      const isSame = prev.every((value, index) => value === cuisineOptions[index]);
      return isSame ? prev : cuisineOptions;
    });
  }, [cuisineOptions, setCuisines]);

  const weekDays = useMemo(() => {
    const start = new Date(`${logWeekDate}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        date: day,
        value: toDateInputValue(day),
        label: day.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [logWeekDate]);

  const weeklySchedule = useMemo(() => {
    const schedule = weekDays.map(() => ({
      breakfast: [],
      lunch: [],
      dinner: [],
    }));
    const dateIndex = new Map(
      weekDays.map((day, index) => [day.value, index])
    );
    logs.forEach((entry) => {
      const entryDate =
        entry.date || (entry.timestamp ? entry.timestamp.slice(0, 10) : null);
      if (!entryDate || !dateIndex.has(entryDate)) {
        return;
      }
      const meal = MEAL_OPTIONS.some((option) => option.value === entry.meal)
        ? entry.meal
        : "dinner";
      schedule[dateIndex.get(entryDate)][meal].push(entry);
    });
    return schedule;
  }, [logs, weekDays]);

  const handleOpenRecipe = useCallback((recipe) => {
    if (!isDesktop) {
      setPreviewRecipeId(recipe.id);
      setIsPreviewOpen(true);
      return;
    }
    navigate(`/recipe/${recipe.id}`);
  }, [isDesktop, navigate]);

  const handleOpenAddModal = () => {
    setOpenAddRecipeSignal((prev) => prev + 1);
    if (!isCatalogRoute) {
      navigate("/catalog");
    }
  };

  const handleAddRecipeSignalHandled = () => {
    setOpenAddRecipeSignal(0);
  };

  const handleUpdateRecipeRating = useCallback((recipeId, value) => {
    if (!recipeId) {
      return;
    }
    const nextRating = value ? Number.parseInt(value, 10) : null;
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? {
              ...recipe,
              rating: Number.isNaN(nextRating) ? null : nextRating,
            }
          : recipe
      )
    );
  }, [setRecipes]);

  const handleStartLog = (recipeId, { deferNavigation = false } = {}) => {
    const recipeName = recipeById[recipeId]?.name || "";
    const today = new Date();
    const todayValue = toDateInputValue(today);
    setIsLogWeekCustomized(false);
    openForStart({
      recipeId,
      recipeQuery: recipeName,
      weekDate: todayValue,
      shouldNavigateAfterLog: deferNavigation,
    });
    if (!deferNavigation) {
      navigate("/log");
    }
    setIsLogModalOpen(true);
  };

  const handleLogCook = async (event) => {
    event.preventDefault();
    if (!logSelectedDays.length || !logSelectedMeals.length) {
      return;
    }
    const trimmedRecipeQuery = logRecipeQuery.trim();
    const selectedRecipe = logRecipeId ? recipeById[logRecipeId] : null;
    const recipeName = selectedRecipe?.name || trimmedRecipeQuery;
    if (!recipeName) {
      return;
    }
    const [selectedDay] = logSelectedDays;
    const [selectedMeal] = logSelectedMeals;
    if (!selectedDay || !selectedMeal) {
      return;
    }
    const nowStamp = new Date().toISOString();

    let entryIndex = 0;
    const entries = logSelectedDays.flatMap((day) =>
      logSelectedMeals.map((meal) => {
        const id =
          editingLogId && entryIndex === 0 ? editingLogId : createId();
        entryIndex += 1;
        return {
          id,
          recipeId: selectedRecipe?.id || null,
          name: recipeName,
          cuisine: selectedRecipe?.cuisine || null,
          cookbookTitle: selectedRecipe?.cookbookTitle || null,
          date: day,
          meal,
          timestamp: nowStamp,
          note: logNote.trim(),
        };
      })
    );
    if (editingLogId) {
      setLogs((prev) => {
        const remaining = prev.filter((entry) => entry.id !== editingLogId);
        return [...entries, ...remaining];
      });
    } else {
      const latestCatalog = await syncCatalog();
      const latestRecipes = Array.isArray(latestCatalog?.recipes)
        ? latestCatalog.recipes
        : recipes;
      const latestLogs = Array.isArray(latestCatalog?.logs)
        ? latestCatalog.logs
        : logs;
      setLogs([...entries, ...latestLogs]);
      if (selectedRecipe) {
        setRecipes(
          latestRecipes.map((recipe) =>
            recipe.id === selectedRecipe.id
              ? {
                  ...recipe,
                  timesCooked: recipe.timesCooked + entries.length,
                  lastCooked: nowStamp,
                }
              : recipe
          )
        );
      }
    }
    resetAfterSubmit(selectedDay);
    setIsLogModalOpen(false);
    if (shouldNavigateAfterLog) {
      navigate("/log");
      setShouldNavigateAfterLog(false);
    }
  };

  const handleDeleteLogEntry = (entryId) => {
    if (!entryId) {
      return;
    }
    setLogs((prev) => prev.filter((entry) => entry.id !== entryId));
    setEditingLogId(null);
    setIsLogModalOpen(false);
  };

  const resetFreezerModal = () => {
    setFreezerMealName("");
    setFreezerPortions(String(FREEZER_PORTION_OPTIONS[0]));
    setFreezerCategory("");
    setFreezerNotes("");
  };

  const handleOpenFreezerModal = () => {
    resetFreezerModal();
    setIsFreezerModalOpen(true);
  };

  const handleCloseFreezerModal = () => {
    setIsFreezerModalOpen(false);
  };

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const handleAddFreezerMeal = (event) => {
    event.preventDefault();
    const trimmedName = freezerMealName.trim();
    const trimmedCategory = freezerCategory.trim();
    const portionCount = Number.parseInt(freezerPortions, 10);
    if (
      !trimmedName ||
      !trimmedCategory ||
      Number.isNaN(portionCount) ||
      portionCount <= 0
    ) {
      return;
    }
    setFreezerMeals((prev) => [
      {
        id: createId(),
        name: trimmedName,
        portions: portionCount,
        portionsLeft: portionCount,
        category: trimmedCategory ? trimmedCategory : null,
        notes: freezerNotes.trim(),
      },
      ...prev,
    ]);
    setIsFreezerModalOpen(false);
  };

  const handleUpdateFreezerPortionsLeft = useCallback(async (mealId, nextValue) => {
    if (!mealId) {
      return;
    }
    if (nextValue === 0) {
      setFreezerMeals((prev) => prev.filter((item) => item.id !== mealId));
      addDebugLog("Storage item removed locally. Pending sync will delete it.", {
        mealId,
        hasGroup: Boolean(groupId),
      });
      if (groupId) {
        const { error } = await deleteFreezerMeal({ groupId, mealId });
        if (error) {
          addDebugLog("Storage item delete failed on sync.", {
            mealId,
            groupId,
            error,
          });
        } else {
          addDebugLog("Storage item deleted from sync.", { mealId, groupId });
        }
      }
      return;
    }
    setFreezerMeals((prev) =>
      prev.map((item) =>
        item.id === mealId ? { ...item, portionsLeft: nextValue } : item
      )
    );
  }, [addDebugLog, groupId, setFreezerMeals]);

  const handleLogRecipeQuery = (value) => {
    setLogRecipeQuery(value);
    const match = recipes.find(
      (recipe) => recipe.name.toLowerCase() === value.trim().toLowerCase()
    );
    setLogRecipeId(match ? match.id : "");
  };

  const handlePickRandomMeal = () => {
    if (!recipes.length) {
      return;
    }
    const index = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[index];
    if (!randomRecipe) {
      return;
    }
    setLogRecipeId(randomRecipe.id);
    setLogRecipeQuery(randomRecipe.name);
  };

  const handleOpenLogModal = ({ date, meal, entry } = {}) => {
    if (entry) {
      if (entry.recipeId) {
        const shouldEdit = window.confirm(
          `Edit "${entry.name}"? Select OK to edit the schedule entry, or Cancel to open the recipe preview.`
        );
        if (!shouldEdit) {
          const recipe = recipeById[entry.recipeId];
          if (recipe) {
            handleOpenRecipe(recipe);
            return;
          }
        }
      }
      openForEntry({ entry, date, meal });
    } else {
      openForEntry({ date, meal });
    }
    setIsLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    resetForClose(logWeekDate);
    setIsLogModalOpen(false);
  };

  const handleLogWeekDateChange = (value) => {
    setIsLogWeekCustomized(true);
    setLogWeekDate(value);
  };

  const handleToggleLogDay = (value) => {
    toggleLogDay(value);
  };

  const handleToggleLogMeal = (value) => {
    toggleLogMeal(value);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRecipeId(null);
  };

  const handleDeleteRecipe = useCallback((recipeId) => {
    if (!recipeId) {
      console.log("[debug] delete recipe aborted: missing recipeId");
      return false;
    }
    const recipeName = recipeById[recipeId]?.name || "Recipe";
    console.log("[debug] delete recipe requested", { recipeId, recipeName });
    const confirmed = window.confirm(`Delete ${recipeName}?`);
    console.log("[debug] delete recipe confirmation", {
      recipeId,
      confirmed,
    });
    if (!confirmed) {
      return false;
    }
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setLogs((prev) => prev.filter((entry) => entry.recipeId !== recipeId));
    if (recipeMatch?.params?.recipeId === recipeId) {
      navigate("/catalog");
    }
    if (previewRecipeId === recipeId) {
      setIsPreviewOpen(false);
      setPreviewRecipeId(null);
    }
    addToast(`${recipeName} deleted.`, "success");
    console.log("[debug] delete recipe completed", { recipeId });
    return true;
  }, [addToast, navigate, previewRecipeId, recipeById, recipeMatch, setLogs, setRecipes]);

  const handleRequestEditRecipe = (recipe) => {
    if (!recipe?.id) {
      return;
    }
    setPendingEditRecipeId(recipe.id);
    handleClosePreview();
    if (!isCatalogRoute) {
      navigate("/catalog");
    }
  };

  const catalogRouteElement = (
    <CatalogRoute
      recipes={recipes}
      setRecipes={setRecipes}
      syncCatalog={syncCatalog}
      addToast={addToast}
      cookbookCoverMap={cookbookCoverMap}
      cuisineOptions={cuisineOptions}
      onOpenRecipe={handleOpenRecipe}
      onDeleteRecipe={handleDeleteRecipe}
      onStartLog={handleStartLog}
      isDesktop={isDesktop}
      openAddRecipeSignal={openAddRecipeSignal}
      onRecipeModalOpenChange={setIsRecipeModalOpen}
      pendingEditRecipeId={pendingEditRecipeId}
      onEditHandled={() => setPendingEditRecipeId(null)}
      onAddRecipeSignalHandled={handleAddRecipeSignalHandled}
    />
  );

  return (
    <div className="app">
      <header className="app-header">
        <LandscapeHeaderNav onAddRecipe={handleOpenAddModal} />
      </header>
      <main className="panel">
        <div
          className={`panel-content${
            isCatalogRoute ? " is-catalog" : ""
          }`}
        >
          <Hero onOpenSettings={handleOpenSettingsModal} />
          <Routes>
            <Route path="/" element={catalogRouteElement} />
            <Route
              path="/catalog"
              element={
                catalogRouteElement
              }
            />
            <Route
              path="/recipe/:recipeId"
              element={
                catalogRouteElement
              }
            />
            <Route
              path="/random"
              element={
                <RandomRoute
                  recipes={recipes}
                  cuisineOptions={cuisineOptions}
                  onStartLog={handleStartLog}
                  cookbookCovers={cookbookCoverMap}
                />
              }
            />
            <Route
              path="/log"
              element={
                <LogRoute
                  logWeekDate={logWeekDate}
                  onLogWeekDate={handleLogWeekDateChange}
                  weekDays={weekDays}
                  weeklySchedule={weeklySchedule}
                  mealOptions={MEAL_OPTIONS}
                  onOpenLogModal={handleOpenLogModal}
                />
              }
            />
            <Route
              path="/storage"
              element={
                <StorageRoute
                  storageByLocation={storageByLocation}
                  onOpenModal={handleOpenFreezerModal}
                  onUpdatePortionsLeft={handleUpdateFreezerPortionsLeft}
                />
              }
            />
            <Route path="/freezer" element={<Navigate to="/storage" replace />} />
            <Route
              path="/settings"
              element={
                <SettingsRoute
                  status={status}
                  isSaving={isSaving}
                  pendingChanges={pendingChanges}
                  lastSyncAt={lastSyncAt}
                  lastSaveAt={lastSaveAt}
                  debugLogs={debugLogs}
                  clearDebugLogs={clearDebugLogs}
                  diagnostics={diagnostics}
                  isDiagnosticsRunning={isDiagnosticsRunning}
                  runDiagnostics={runDiagnostics}
                  inviteUrl={inviteUrl}
                  groupCode={groupCode}
                  groupId={groupId}
                  createNewGroup={createNewGroup}
                  joinGroup={joinGroup}
                  addToast={addToast}
                  onLogout={clearLocalData}
                  setCookbooks={setCookbooks}
                  cookbookOptions={settingsCookbookOptions}
                  cookbookCoverTargets={cookbookCoverTargets}
                  cookbookCoverMap={cookbookCoverMap}
                />
              }
            />
          </Routes>
        </div>
      </main>
      <MobileTabBar />
      <ToastStack />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal}>
        <SettingsRoute
          status={status}
          isSaving={isSaving}
          pendingChanges={pendingChanges}
          lastSyncAt={lastSyncAt}
          lastSaveAt={lastSaveAt}
          debugLogs={debugLogs}
          clearDebugLogs={clearDebugLogs}
          diagnostics={diagnostics}
          isDiagnosticsRunning={isDiagnosticsRunning}
          runDiagnostics={runDiagnostics}
          inviteUrl={inviteUrl}
          groupCode={groupCode}
          groupId={groupId}
          createNewGroup={createNewGroup}
          joinGroup={joinGroup}
          addToast={addToast}
          onLogout={clearLocalData}
          setCookbooks={setCookbooks}
          cookbookOptions={settingsCookbookOptions}
          cookbookCoverTargets={cookbookCoverTargets}
          cookbookCoverMap={cookbookCoverMap}
        />
      </SettingsModal>
      <RecipePreviewModal
        isOpen={isPreviewOpen}
        recipe={previewRecipeId ? recipeById[previewRecipeId] : null}
        onClose={handleClosePreview}
        onStartLog={(recipeId) => {
          handleClosePreview();
          handleStartLog(recipeId, { deferNavigation: true });
        }}
        onEditRecipe={handleRequestEditRecipe}
        onDeleteRecipe={(recipeId) => {
          handleClosePreview();
          handleDeleteRecipe(recipeId);
        }}
        onRatingChange={(value) =>
          handleUpdateRecipeRating(previewRecipeId, value)
        }
        cookbookCovers={cookbookCoverMap}
      />
      <ScheduleModal
        isOpen={isLogModalOpen}
        editingLogId={editingLogId}
        recipeOptions={recipeOptions}
        logRecipeId={logRecipeId}
        logRecipeQuery={logRecipeQuery}
        onLogRecipeQuery={handleLogRecipeQuery}
        selectedDays={logSelectedDays}
        selectedMeals={logSelectedMeals}
        onToggleDay={handleToggleLogDay}
        onToggleMeal={handleToggleLogMeal}
        weekDays={weekDays}
        logNote={logNote}
        onLogNote={setLogNote}
        onSubmit={handleLogCook}
        onClose={handleCloseLogModal}
        onDelete={handleDeleteLogEntry}
        onPickRandom={handlePickRandomMeal}
        mealOptions={MEAL_OPTIONS}
        hasRecipes={recipes.length > 0}
      />
      <FreezerModal
        isOpen={isFreezerModalOpen}
        name={freezerMealName}
        portions={freezerPortions}
        category={freezerCategory}
        notes={freezerNotes}
        categoryOptions={freezerCategoryOptions}
        portionOptions={FREEZER_PORTION_OPTIONS}
        onNameChange={setFreezerMealName}
        onPortionsChange={setFreezerPortions}
        onCategoryChange={setFreezerCategory}
        onNotesChange={setFreezerNotes}
        onSubmit={handleAddFreezerMeal}
        onClose={handleCloseFreezerModal}
      />
    </div>
  );
}
