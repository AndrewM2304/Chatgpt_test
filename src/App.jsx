import { useEffect, useMemo, useState } from "react";
import { CatalogView } from "./components/CatalogView";
import { Hero } from "./components/Hero";
import { LogView } from "./components/LogView";
import { SettingsView } from "./components/SettingsView";
import { RandomView } from "./components/RandomView";
import { RecipeView } from "./components/RecipeView";
import { RecipeModal } from "./components/RecipeModal";
import { TabNav } from "./components/TabNav";
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
  const [activeTab, setActiveTab] = useState("catalog");
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
  } = useSupabaseCatalog();
  const { recipes, logs } = catalog;
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [excludedCuisines, setExcludedCuisines] = useState([]);
  const [randomPick, setRandomPick] = useState(null);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [logRecipeId, setLogRecipeId] = useState("");
  const [logRecipeQuery, setLogRecipeQuery] = useState("");
  const [logDate, setLogDate] = useState(() =>
    toDateInputValue(new Date())
  );
  const [logWeekDate, setLogWeekDate] = useState(() =>
    toDateInputValue(new Date())
  );
  const [logMeal, setLogMeal] = useState("dinner");
  const [logNote, setLogNote] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cookbookTitle: "",
    page: "",
    cuisine: "",
    rating: "",
    duration: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const activeRecipe = useMemo(() => {
    if (!activeRecipeId) {
      return null;
    }
    return recipeById[activeRecipeId] || null;
  }, [activeRecipeId, recipeById]);

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

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFormValueChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (value) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      cookbookTitle: "",
      page: "",
      cuisine: "",
      rating: "",
      duration: "",
    });
    setEditingId(null);
  };

  const handleSaveRecipe = (event) => {
    event.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      return;
    }
    const trimmedCookbook = formData.cookbookTitle.trim();
    const trimmedCuisine = formData.cuisine.trim();
    const ratingValue = formData.rating
      ? Number.parseInt(formData.rating, 10)
      : null;
    const durationValue = formData.duration
      ? Number.parseInt(formData.duration, 10)
      : null;

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                name: trimmedName,
                cookbookTitle: trimmedCookbook,
                page: formData.page.trim(),
                cuisine: trimmedCuisine,
                rating: Number.isNaN(ratingValue) ? null : ratingValue,
                durationMinutes: Number.isNaN(durationValue)
                  ? null
                  : durationValue,
              }
            : recipe
        )
      );
    } else {
      const newRecipe = {
        id: crypto.randomUUID(),
        name: trimmedName,
        cookbookTitle: trimmedCookbook,
        page: formData.page.trim(),
        cuisine: trimmedCuisine,
        rating: Number.isNaN(ratingValue) ? null : ratingValue,
        durationMinutes: Number.isNaN(durationValue) ? null : durationValue,
        timesCooked: 0,
        lastCooked: null,
      };
      setRecipes((prev) => [newRecipe, ...prev]);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleEditRecipe = (recipe) => {
    setFormData({
      name: recipe.name,
      cookbookTitle: recipe.cookbookTitle,
      page: recipe.page,
      cuisine: recipe.cuisine,
      rating: recipe.rating ? String(recipe.rating) : "",
      duration: recipe.durationMinutes
        ? String(recipe.durationMinutes)
        : "",
    });
    setEditingId(recipe.id);
    setIsModalOpen(true);
  };

  const handleOpenRecipe = (recipe) => {
    setActiveRecipeId(recipe.id);
    setActiveTab("recipe");
  };

  const handleStartLog = (recipeId) => {
    setLogRecipeId(recipeId);
    const recipeName = recipeById[recipeId]?.name || "";
    setLogRecipeQuery(recipeName);
    const today = new Date();
    setLogWeekDate(toDateInputValue(today));
    setLogDate(toDateInputValue(today));
    setLogMeal("dinner");
    setLogNote("");
    setActiveTab("log");
    setEditingLogId(null);
    setIsLogModalOpen(true);
  };

  const handleDeleteRecipe = (recipeId) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setLogs((prev) => prev.filter((entry) => entry.recipeId !== recipeId));
    setActiveRecipeId((prev) => {
      if (prev === recipeId) {
        setActiveTab("catalog");
        return null;
      }
      return prev;
    });
    if (editingId === recipeId) {
      resetForm();
    }
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

  const handleLogCook = (event) => {
    event.preventDefault();
    if (!logRecipeId) {
      return;
    }
    if (!logDate) {
      return;
    }
    const selectedRecipe = recipeById[logRecipeId];
    if (!selectedRecipe) {
      return;
    }
    const nowStamp = new Date().toISOString();
    const entryPayload = {
      id: editingLogId || crypto.randomUUID(),
      recipeId: selectedRecipe.id,
      name: selectedRecipe.name,
      cuisine: selectedRecipe.cuisine,
      cookbookTitle: selectedRecipe.cookbookTitle,
      date: logDate,
      meal: logMeal,
      timestamp: nowStamp,
      note: logNote.trim(),
    };

    if (editingLogId) {
      setLogs((prev) =>
        prev.map((entry) =>
          entry.id === editingLogId ? entryPayload : entry
        )
      );
    } else {
      setLogs((prev) => [entryPayload, ...prev]);
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === selectedRecipe.id
            ? {
                ...recipe,
                timesCooked: recipe.timesCooked + 1,
                lastCooked: nowStamp,
              }
            : recipe
        )
      );
    }
    setLogWeekDate(logDate);
    setLogRecipeId("");
    setLogRecipeQuery("");
    setLogNote("");
    setEditingLogId(null);
    setIsLogModalOpen(false);
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
      setEditingLogId(entry.id);
      setLogRecipeId(entry.recipeId);
      setLogRecipeQuery(entry.name || "");
      setLogDate(entry.date);
      setLogMeal(entry.meal || "dinner");
      setLogNote(entry.note || "");
    } else {
      setEditingLogId(null);
      setLogRecipeId("");
      setLogRecipeQuery("");
      setLogNote("");
      setLogDate(date || toDateInputValue(new Date()));
      setLogMeal(meal || "dinner");
    }
    setIsLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    setEditingLogId(null);
    setLogRecipeId("");
    setLogRecipeQuery("");
    setLogNote("");
    setIsLogModalOpen(false);
  };

  const handleExport = () => {
    const payload = {
      recipes,
      cookbooks: cookbookOptions,
      cuisines: cuisineOptions,
      logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recipe-catalog.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.recipes) {
          setRecipes(data.recipes);
        }
        if (data.cookbooks) {
          setCookbooks(data.cookbooks);
        }
        if (data.cuisines) {
          setCuisines(data.cuisines);
        }
        if (data.logs) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to import catalog", error);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateInvite = async () => {
    setShowInvite(true);
    if (inviteUrl && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(inviteUrl);
    }
  };

  const handleCreateGroup = async () => {
    await createNewGroup({ name: "Shared kitchen", duplicate: true });
    setShowInvite(true);
  };

  const handleJoinGroup = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const codeMatch = trimmed.match(/invite=([^&]+)/i);
    const code = codeMatch ? decodeURIComponent(codeMatch[1]) : trimmed;
    return joinGroup(code);
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

  return (
    <div className="app">
      <header className="app-header">
        <Hero />
        <TabNav
          activeTab={activeTab}
          onSelect={setActiveTab}
          onAddRecipe={handleOpenAddModal}
        />
      </header>
      <main className="panel">
        <div className="panel-content">
          {activeTab === "catalog" && (
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
          )}

          {activeTab === "random" && (
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
          )}

          {activeTab === "recipe" && (
            <RecipeView
              activeRecipe={activeRecipe}
              onBack={() => setActiveTab("catalog")}
              onStartLog={handleStartLog}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteFromView}
            />
          )}

          {activeTab === "log" && (
            <LogView
              recipes={recipes}
              logRecipeId={logRecipeId}
              logRecipeQuery={logRecipeQuery}
              onLogRecipeQuery={handleLogRecipeQuery}
              logWeekDate={logWeekDate}
              onLogWeekDate={setLogWeekDate}
              logDate={logDate}
              onLogDate={setLogDate}
              logMeal={logMeal}
              onLogMeal={setLogMeal}
              logNote={logNote}
              onLogNote={setLogNote}
              onSubmit={handleLogCook}
              weekDays={weekDays}
              weeklySchedule={weeklySchedule}
              mealOptions={MEAL_OPTIONS}
              isLogModalOpen={isLogModalOpen}
              editingLogId={editingLogId}
              onOpenLogModal={handleOpenLogModal}
              onCloseLogModal={handleCloseLogModal}
              onDeleteLogEntry={handleDeleteLogEntry}
              onPickRandomMeal={handlePickRandomMeal}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              onExport={handleExport}
              onImport={handleImport}
              onGenerateInvite={handleGenerateInvite}
              onCreateGroup={handleCreateGroup}
              onClearData={handleClearData}
              onJoinGroup={handleJoinGroup}
              inviteUrl={showInvite ? inviteUrl : ""}
              statusMessage={status.state === "error" ? status.message : ""}
              hasGroup={Boolean(groupCode)}
            />
          )}
        </div>
      </main>
      <RecipeModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        onFormChange={handleFormChange}
        onValueChange={handleFormValueChange}
        onRatingChange={handleRatingChange}
        onSaveRecipe={handleSaveRecipe}
        onClose={handleCloseModal}
        onDeleteRecipe={handleDeleteFromModal}
        cookbookOptions={cookbookOptions}
        cuisineOptions={cuisineOptions}
      />
    </div>
  );
}
