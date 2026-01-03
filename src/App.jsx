import { useCallback, useEffect, useMemo, useState } from "react";
import { Route, Routes, useMatch, useNavigate } from "react-router-dom";
import { Hero } from "./components/Hero";
import { RecipePreviewModal } from "./components/RecipePreviewModal";
import { ScheduleModal } from "./components/ScheduleModal";
import { LandscapeHeaderNav } from "./components/LandscapeHeaderNav";
import { MobileTabBar } from "./components/MobileTabBar";
import { ToastStack } from "./components/ToastStack";
import { useSupabaseCatalog } from "./hooks/useSupabaseCatalog";
import { CatalogRoute } from "./routes/CatalogRoute";
import { RandomRoute } from "./routes/RandomRoute";
import { LogRoute } from "./routes/LogRoute";
import { SettingsRoute } from "./routes/SettingsRoute";

const MEAL_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
];

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekdayIndex = (date) => (date.getDay() + 6) % 7;

const getWeekStart = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const offset = getWeekdayIndex(date);
  const start = new Date(date);
  start.setDate(date.getDate() - offset);
  return start;
};

const normalizeCookbookEntry = (entry) => {
  if (!entry) {
    return null;
  }
  if (typeof entry === "string") {
    return { title: entry, coverUrl: "" };
  }
  if (typeof entry === "object") {
    return {
      title: entry.title || "",
      coverUrl: entry.coverUrl || "",
    };
  }
  return null;
};

const normalizeCookbookEntries = (entries) =>
  (Array.isArray(entries) ? entries : [])
    .map(normalizeCookbookEntry)
    .filter((entry) => entry?.title);

const mergeCookbookEntries = (entries, titles) => {
  const normalized = normalizeCookbookEntries(entries);
  const entryMap = new Map(
    normalized.map((entry) => [entry.title, entry])
  );
  return titles.map((title) => entryMap.get(title) || { title, coverUrl: "" });
};

const areCookbookEntriesEqual = (left, right) => {
  const leftNormalized = normalizeCookbookEntries(left);
  const rightNormalized = normalizeCookbookEntries(right);
  if (leftNormalized.length !== rightNormalized.length) {
    return false;
  }
  return leftNormalized.every((entry, index) => {
    const compare = rightNormalized[index];
    return (
      entry.title === compare.title &&
      (entry.coverUrl || "") === (compare.coverUrl || "")
    );
  });
};

export default function App() {
  const {
    catalog,
    setRecipes,
    setCookbooks,
    setCuisines,
    setLogs,
    status,
    inviteUrl,
    groupCode,
    createNewGroup,
    joinGroup,
    syncCatalog,
  } = useSupabaseCatalog();
  const navigate = useNavigate();
  const { recipes, logs } = catalog;
  const [logRecipeId, setLogRecipeId] = useState("");
  const [logRecipeQuery, setLogRecipeQuery] = useState("");
  const [logWeekDate, setLogWeekDate] = useState(() =>
    toDateInputValue(new Date())
  );
  const [logSelectedDays, setLogSelectedDays] = useState(() => [
    toDateInputValue(new Date()),
  ]);
  const [logSelectedMeals, setLogSelectedMeals] = useState(["dinner"]);
  const [logNote, setLogNote] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRecipeId, setPreviewRecipeId] = useState(null);
  const [shouldNavigateAfterLog, setShouldNavigateAfterLog] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [openAddRecipeSignal, setOpenAddRecipeSignal] = useState(0);
  const [pendingEditRecipeId, setPendingEditRecipeId] = useState(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(min-width: 900px)").matches;
  });

  const recipeMatch = useMatch("/recipe/:recipeId");
  const catalogMatch = useMatch("/catalog");
  const homeMatch = useMatch({ path: "/", end: true });
  const isCatalogRoute = Boolean(homeMatch || catalogMatch || recipeMatch);

  const addToast = (message, variant = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };
  const recipeOptions = useMemo(
    () =>
      recipes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((recipe) => recipe.name),
    [recipes]
  );

  useEffect(() => {
    const shouldLock = isRecipeModalOpen || isLogModalOpen || isPreviewOpen;
    document.body.classList.toggle("modal-open", shouldLock);
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isRecipeModalOpen, isLogModalOpen, isPreviewOpen]);

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

  const cookbookEntries = useMemo(
    () => normalizeCookbookEntries(catalog.cookbooks),
    [catalog.cookbooks]
  );

  const cookbookOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cookbookTitle).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const recipeById = useMemo(() => {
    return recipes.reduce((accumulator, recipe) => {
      accumulator[recipe.id] = recipe;
      return accumulator;
    }, {});
  }, [recipes]);

  const cookbookCoverTargets = useMemo(() => {
    const targets = new Set(cookbookOptions);
    cookbookEntries.forEach((entry) => targets.add(entry.title));
    const hasWebsiteRecipes = recipes.some(
      (recipe) =>
        recipe.sourceType === "website" || (!recipe.sourceType && recipe.url)
    );
    if (hasWebsiteRecipes || cookbookEntries.some((entry) => entry.title === "Website")) {
      targets.add("Website");
    }
    return Array.from(targets).sort((a, b) => a.localeCompare(b));
  }, [cookbookEntries, cookbookOptions, recipes]);

  const cookbookCoverMap = useMemo(() => {
    return cookbookEntries.reduce((accumulator, entry) => {
      if (entry.coverUrl) {
        accumulator[entry.title] = entry.coverUrl;
      }
      return accumulator;
    }, {});
  }, [cookbookEntries]);

  const cuisineOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

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
    const start = getWeekStart(logWeekDate);
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
    setLogRecipeId(recipeId);
    const recipeName = recipeById[recipeId]?.name || "";
    setLogRecipeQuery(recipeName);
    const today = new Date();
    setLogWeekDate(toDateInputValue(today));
    setLogSelectedDays([toDateInputValue(today)]);
    setLogSelectedMeals(["dinner"]);
    setLogNote("");
    setShouldNavigateAfterLog(deferNavigation);
    if (!deferNavigation) {
      navigate("/log");
    }
    setEditingLogId(null);
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
          editingLogId && entryIndex === 0 ? editingLogId : crypto.randomUUID();
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
    setLogWeekDate(selectedDay);
    setLogRecipeId("");
    setLogRecipeQuery("");
    setLogNote("");
    setEditingLogId(null);
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
      setEditingLogId(entry.id);
      setLogRecipeId(entry.recipeId || "");
      setLogRecipeQuery(entry.name || "");
      setLogSelectedDays([entry.date]);
      setLogSelectedMeals([entry.meal || "dinner"]);
      setLogNote(entry.note || "");
    } else {
      setEditingLogId(null);
      setLogRecipeId("");
      setLogRecipeQuery("");
      setLogNote("");
      setLogSelectedDays([date || logWeekDate]);
      setLogSelectedMeals([meal || "dinner"]);
    }
    setShouldNavigateAfterLog(false);
    setIsLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    setEditingLogId(null);
    setLogRecipeId("");
    setLogRecipeQuery("");
    setLogNote("");
    setLogSelectedDays([logWeekDate]);
    setLogSelectedMeals(["dinner"]);
    setIsLogModalOpen(false);
    setShouldNavigateAfterLog(false);
  };

  const handleToggleLogDay = (value) => {
    setLogSelectedDays((prev) => {
      return prev.includes(value)
        ? prev.filter((day) => day !== value)
        : [...prev, value];
    });
  };

  const handleToggleLogMeal = (value) => {
    setLogSelectedMeals((prev) => {
      return prev.includes(value)
        ? prev.filter((meal) => meal !== value)
        : [...prev, value];
    });
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRecipeId(null);
  };

  const handleDeleteRecipe = useCallback((recipeId) => {
    const recipeName = recipeById[recipeId]?.name || "Recipe";
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
          <Hero />
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
                />
              }
            />
            <Route
              path="/log"
              element={
                <LogRoute
                  logWeekDate={logWeekDate}
                  onLogWeekDate={setLogWeekDate}
                  weekDays={weekDays}
                  weeklySchedule={weeklySchedule}
                  mealOptions={MEAL_OPTIONS}
                  onOpenLogModal={handleOpenLogModal}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsRoute
                  status={status}
                  inviteUrl={inviteUrl}
                  groupCode={groupCode}
                  createNewGroup={createNewGroup}
                  joinGroup={joinGroup}
                  addToast={addToast}
                  setRecipes={setRecipes}
                  setCookbooks={setCookbooks}
                  setCuisines={setCuisines}
                  setLogs={setLogs}
                  cookbookCoverTargets={cookbookCoverTargets}
                  cookbookCoverMap={cookbookCoverMap}
                />
              }
            />
          </Routes>
        </div>
      </main>
      <MobileTabBar />
      <ToastStack toasts={toasts} />
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
    </div>
  );
}
