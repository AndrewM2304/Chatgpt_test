import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import { CatalogView } from "./components/CatalogView";
import { Hero } from "./components/Hero";
import { LogView } from "./components/LogView";
import { SettingsView } from "./components/SettingsView";
import { RandomView } from "./components/RandomView";
import { RecipeView } from "./components/RecipeView";
import { RecipeModal } from "./components/RecipeModal";
import { RecipePreviewModal } from "./components/RecipePreviewModal";
import { ScheduleModal } from "./components/ScheduleModal";
import { LandscapeHeaderNav } from "./components/LandscapeHeaderNav";
import { MobileTabBar } from "./components/MobileTabBar";
import { ToastStack } from "./components/ToastStack";
import { useSupabaseCatalog } from "./hooks/useSupabaseCatalog";
import { durationBuckets, timesBuckets } from "./utils/recipeUtils";

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
  const recipeMatch = useMatch("/recipe/:recipeId");
  const catalogMatch = useMatch("/catalog");
  const { recipes, logs } = catalog;
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [excludedCuisines, setExcludedCuisines] = useState([]);
  const [randomPick, setRandomPick] = useState(null);
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
  const [editingId, setEditingId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRecipeId, setPreviewRecipeId] = useState(null);
  const [shouldNavigateAfterLog, setShouldNavigateAfterLog] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(min-width: 900px)").matches;
  });

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
    const shouldLock = isModalOpen || isLogModalOpen || isPreviewOpen;
    document.body.classList.toggle("modal-open", shouldLock);
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isModalOpen, isLogModalOpen, isPreviewOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone;
      setIsInstalled(Boolean(isStandalone));
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      addToast("Cookbook Keeper is installed.", "success");
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => checkInstalled();
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      displayModeQuery.addListener(handleDisplayModeChange);
    }

    checkInstalled();
    setIsIosDevice(
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
        !window.MSStream
    );

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (displayModeQuery.removeEventListener) {
        displayModeQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        displayModeQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

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

  const cookbookOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cookbookTitle).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const cuisineOptions = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  useEffect(() => {
    setCookbooks(cookbookOptions);
  }, [cookbookOptions, setCookbooks]);

  useEffect(() => {
    setCuisines(cuisineOptions);
  }, [cuisineOptions, setCuisines]);

  const recipeById = useMemo(() => {
    return recipes.reduce((accumulator, recipe) => {
      accumulator[recipe.id] = recipe;
      return accumulator;
    }, {});
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return recipes;
    }
    return recipes.filter((recipe) => {
      return [
        recipe.name,
        recipe.cookbookTitle,
        recipe.cuisine,
        recipe.page,
        recipe.url,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [recipes, searchTerm]);

  const groupedRecipes = useMemo(() => {
    const groups = new Map();

    const addToGroup = (key, recipe) => {
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(recipe);
    };

    filteredRecipes.forEach((recipe) => {
      if (groupBy === "cookbook") {
        addToGroup(recipe.cookbookTitle || "No cookbook yet", recipe);
        return;
      }
      if (groupBy === "cuisine") {
        addToGroup(recipe.cuisine || "Uncategorized", recipe);
        return;
      }
      if (groupBy === "times") {
        const bucket =
          timesBuckets.find((item) => item.test(recipe.timesCooked))?.label ||
          "Never cooked";
        addToGroup(bucket, recipe);
        return;
      }
      if (groupBy === "duration") {
        const bucket =
          durationBuckets.find((item) =>
            item.test(recipe.durationMinutes)
          )?.label || "No duration set";
        addToGroup(bucket, recipe);
        return;
      }
      addToGroup("All recipes", recipe);
    });

    return Array.from(groups.entries())
      .map(([label, items]) => ({
        label,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredRecipes, groupBy]);

  const defaultRecipeId = useMemo(() => {
    return groupedRecipes[0]?.items?.[0]?.id ?? null;
  }, [groupedRecipes]);

  const randomCandidates = useMemo(() => {
    if (!recipes.length) {
      return [];
    }
    return recipes.filter((recipe) => {
      if (!recipe.cuisine) {
        return true;
      }
      return !excludedCuisines.includes(recipe.cuisine);
    });
  }, [excludedCuisines, recipes]);

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

  const resetForm = () => {
    setEditingId(null);
  };

  const handleInstallApp = async () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    const outcome = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome?.outcome === "accepted") {
      addToast("Install request sent to your device.", "success");
    } else {
      addToast("Install dismissed.", "info");
    }
  };

  const handleSaveRecipe = async (draft) => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      return;
    }
    const isEditing = Boolean(editingId);
    const sourceType = draft.sourceType || "cookbook";
    const trimmedCookbook = draft.cookbookTitle.trim();
    const trimmedCuisine = draft.cuisine.trim();
    const trimmedUrl = draft.url.trim();
    const trimmedNotes = draft.notes.trim();
    const pageValue = sourceType === "website" ? "" : draft.page.trim();
    const urlValue = sourceType === "website" ? trimmedUrl : "";
    const ratingValue = draft.rating
      ? Number.parseInt(draft.rating, 10)
      : null;
    const durationValue = draft.duration
      ? Number.parseInt(draft.duration, 10)
      : null;

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                name: trimmedName,
                sourceType,
                cookbookTitle: trimmedCookbook,
                page: pageValue,
                url: urlValue,
                cuisine: trimmedCuisine,
                rating: Number.isNaN(ratingValue) ? null : ratingValue,
                durationMinutes: Number.isNaN(durationValue)
                  ? null
                  : durationValue,
                notes: trimmedNotes,
              }
            : recipe
        )
      );
    } else {
      const newRecipe = {
        id: crypto.randomUUID(),
        name: trimmedName,
        sourceType,
        cookbookTitle: trimmedCookbook,
        page: pageValue,
        url: urlValue,
        cuisine: trimmedCuisine,
        rating: Number.isNaN(ratingValue) ? null : ratingValue,
        durationMinutes: Number.isNaN(durationValue) ? null : durationValue,
        notes: trimmedNotes,
        timesCooked: 0,
        lastCooked: null,
      };
      const latestCatalog = await syncCatalog();
      const latestRecipes = Array.isArray(latestCatalog?.recipes)
        ? latestCatalog.recipes
        : recipes;
      setRecipes([newRecipe, ...latestRecipes]);
    }

    addToast(`${trimmedName} ${isEditing ? "updated" : "created"}.`, "success");
    resetForm();
    setIsModalOpen(false);
  };

  const handleEditRecipe = (recipe) => {
    setEditingId(recipe.id);
    setIsModalOpen(true);
  };

  const handleOpenRecipe = (recipe) => {
    if (!isDesktop) {
      setPreviewRecipeId(recipe.id);
      setIsPreviewOpen(true);
      return;
    }
    navigate(`/recipe/${recipe.id}`);
  };

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

  const handleDeleteRecipe = (recipeId) => {
    const recipeName = recipeById[recipeId]?.name || "Recipe";
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setLogs((prev) => prev.filter((entry) => entry.recipeId !== recipeId));
    if (recipeMatch?.params?.recipeId === recipeId) {
      navigate("/catalog");
    }
    if (editingId === recipeId) {
      resetForm();
    }
    if (previewRecipeId === recipeId) {
      setIsPreviewOpen(false);
      setPreviewRecipeId(null);
    }
    addToast(`${recipeName} deleted.`, "success");
  };

  const handleDeleteFromView = (recipeId) => {
    if (!recipeId) {
      return;
    }
    const recipeName = recipeById[recipeId]?.name || "this recipe";
    const confirmed = window.confirm(`Delete ${recipeName}?`);
    if (!confirmed) {
      return;
    }
    handleDeleteRecipe(recipeId);
  };

  const handleToggleCuisine = (cuisine) => {
    setExcludedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((item) => item !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handlePickRandom = () => {
    if (!randomCandidates.length) {
      setRandomPick(null);
      return;
    }
    const index = Math.floor(Math.random() * randomCandidates.length);
    setRandomPick(randomCandidates[index]);
  };

  const handleLogCook = async (event) => {
    event.preventDefault();
    if (!logRecipeId) {
      return;
    }
    if (!logSelectedDays.length || !logSelectedMeals.length) {
      return;
    }
    const selectedRecipe = recipeById[logRecipeId];
    if (!selectedRecipe) {
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
          recipeId: selectedRecipe.id,
          name: selectedRecipe.name,
          cuisine: selectedRecipe.cuisine,
          cookbookTitle: selectedRecipe.cookbookTitle,
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
      const shouldEdit = window.confirm(
        `Edit "${entry.name}"? Select OK to edit the schedule entry, or Cancel to open the recipe preview.`
      );
      if (!shouldEdit) {
        if (entry.recipeId) {
          if (!isDesktop) {
            setPreviewRecipeId(entry.recipeId);
            setIsPreviewOpen(true);
            return;
          }
          navigate(`/recipe/${entry.recipeId}`);
          return;
        }
      }
      setEditingLogId(entry.id);
      setLogRecipeId(entry.recipeId);
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

  const buildInviteUrl = (code) => {
    if (!code || typeof window === "undefined") {
      return "";
    }
    const baseUrl = new URL(
      import.meta.env.BASE_URL || "/",
      window.location.origin
    );
    baseUrl.searchParams.set("invite", code);
    return baseUrl.toString();
  };

  const handleGenerateInvite = async () => {
    setShowInvite(true);
    let nextInvite = inviteUrl;
    if (!groupCode) {
      const newCode = await createNewGroup({
        name: "Shared kitchen",
        duplicate: true,
      });
      nextInvite = buildInviteUrl(newCode);
    }
    if (nextInvite && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(nextInvite);
      addToast("Invite link copied.", "success");
    }
  };

  const handleCopyGroupCode = async () => {
    if (!groupCode || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(groupCode);
    addToast("Group code copied.", "success");
  };

  const handleJoinGroup = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const codeMatch = trimmed.match(/invite=([^&]+)/i);
    const code = codeMatch ? decodeURIComponent(codeMatch[1]) : trimmed;
    const joined = joinGroup(code);
    if (joined) {
      addToast("Joined group successfully.", "success");
    }
    return joined;
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      "Delete all recipes, logs, and saved settings? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }
    setRecipes([]);
    setCookbooks([]);
    setCuisines([]);
    setLogs([]);
    resetForm();
  };

  const handleDeleteFromModal = (recipeId = editingId) => {
    if (!recipeId) {
      return;
    }
    handleDeleteRecipe(recipeId);
    setIsModalOpen(false);
  };

  const handleUpdateRecipeRating = (recipeId, value) => {
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
  };

  const CatalogDetailLayout = ({ activeRecipeId }) => {
    const activeRecipe = activeRecipeId ? recipeById[activeRecipeId] || null : null;

    return (
      <div className="catalog-detail">
        <div className="catalog-detail-sidebar">
          <CatalogView
            groupedRecipes={groupedRecipes}
            totalRecipes={recipes.length}
            searchTerm={searchTerm}
            onSearchTerm={setSearchTerm}
            groupBy={groupBy}
            onGroupBy={setGroupBy}
            onOpenRecipe={handleOpenRecipe}
            hasRecipes={recipes.length > 0}
            onAddRecipe={handleOpenAddModal}
          />
        </div>
        <div className="catalog-detail-preview">
          <RecipeView
            activeRecipe={activeRecipe}
            onStartLog={(recipeId) =>
              handleStartLog(recipeId, { deferNavigation: true })
            }
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteFromView}
            onRatingChange={(value) =>
              handleUpdateRecipeRating(activeRecipe?.id, value)
            }
          />
        </div>
      </div>
    );
  };

  const RecipeRoute = () => {
    const { recipeId } = useParams();
    return <CatalogDetailLayout activeRecipeId={recipeId} />;
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRecipeId(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <LandscapeHeaderNav onAddRecipe={handleOpenAddModal} />
      </header>
      <main className="panel">
        <div
          className={`panel-content${
            catalogMatch || recipeMatch ? " is-catalog" : ""
          }`}
        >
          <Hero />
          <Routes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route
              path="/catalog"
              element={
                isDesktop ? (
                  <CatalogDetailLayout activeRecipeId={defaultRecipeId} />
                ) : (
                  <CatalogView
                    groupedRecipes={groupedRecipes}
                    totalRecipes={recipes.length}
                    searchTerm={searchTerm}
                    onSearchTerm={setSearchTerm}
                    groupBy={groupBy}
                    onGroupBy={setGroupBy}
                    onOpenRecipe={handleOpenRecipe}
                    hasRecipes={recipes.length > 0}
                    onAddRecipe={handleOpenAddModal}
                  />
                )
              }
            />
            <Route
              path="/random"
              element={
                <RandomView
                  cuisineOptions={cuisineOptions}
                  excludedCuisines={excludedCuisines}
                  onToggleCuisine={handleToggleCuisine}
                  onPickRandom={handlePickRandom}
                  randomCandidates={randomCandidates}
                  randomPick={randomPick}
                  onStartLog={handleStartLog}
                  hasRecipes={recipes.length > 0}
                />
              }
            />
            <Route path="/recipe/:recipeId" element={<RecipeRoute />} />
            <Route
              path="/log"
              element={
                <LogView
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
                <SettingsView
                  onGenerateInvite={handleGenerateInvite}
                  onClearData={handleClearData}
                  onJoinGroup={handleJoinGroup}
                  onCopyGroupCode={handleCopyGroupCode}
                  onInstallApp={handleInstallApp}
                  inviteUrl={showInvite ? inviteUrl : ""}
                  groupCode={groupCode}
                  statusMessage={status.state === "error" ? status.message : ""}
                  hasGroup={Boolean(groupCode)}
                  canInstallApp={Boolean(installPrompt) && !isInstalled}
                  isInstalled={isInstalled}
                  isIosDevice={isIosDevice}
                />
              }
            />
            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </div>
      </main>
      <MobileTabBar />
      <ToastStack toasts={toasts} />
      <RecipeModal
        isOpen={isModalOpen}
        editingRecipe={editingId ? recipeById[editingId] : null}
        onSaveRecipe={handleSaveRecipe}
        onClose={handleCloseModal}
        onDeleteRecipe={handleDeleteFromModal}
        cookbookOptions={cookbookOptions}
        cuisineOptions={cuisineOptions}
      />
      <RecipePreviewModal
        isOpen={isPreviewOpen}
        recipe={previewRecipeId ? recipeById[previewRecipeId] : null}
        onClose={handleClosePreview}
        onStartLog={(recipeId) => {
          handleClosePreview();
          handleStartLog(recipeId, { deferNavigation: true });
        }}
        onEditRecipe={(recipe) => {
          handleClosePreview();
          handleEditRecipe(recipe);
        }}
        onDeleteRecipe={(recipeId) => {
          handleClosePreview();
          handleDeleteFromView(recipeId);
        }}
        onRatingChange={(value) =>
          handleUpdateRecipeRating(previewRecipeId, value)
        }
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
