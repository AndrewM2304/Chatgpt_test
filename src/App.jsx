import { useMemo, useState } from "react";
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
  const { recipes, cookbooks, cuisines, logs } = catalog;
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [excludedCuisines, setExcludedCuisines] = useState([]);
  const [randomPick, setRandomPick] = useState(null);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [logRecipeId, setLogRecipeId] = useState("");
  const [logDate, setLogDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [logNote, setLogNote] = useState("");
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
    const fromRecipes = recipes
      .map((recipe) => recipe.cookbookTitle)
      .filter(Boolean);
    return Array.from(new Set([...cookbooks, ...fromRecipes])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [cookbooks, recipes]);

  const cuisineOptions = useMemo(() => {
    const fromRecipes = recipes.map((recipe) => recipe.cuisine).filter(Boolean);
    return Array.from(new Set([...cuisines, ...fromRecipes])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [cuisines, recipes]);

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

  const recentLogs = useMemo(() => logs.slice(0, 8), [logs]);

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
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

    if (trimmedCookbook && !cookbookOptions.includes(trimmedCookbook)) {
      setCookbooks((prev) => [...prev, trimmedCookbook]);
    }
    if (trimmedCuisine && !cuisineOptions.includes(trimmedCuisine)) {
      setCuisines((prev) => [...prev, trimmedCuisine]);
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
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogNote("");
    setActiveTab("log");
  };

  const handleDeleteRecipe = (recipeId) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setLogs((prev) => prev.filter((entry) => entry.recipeId !== recipeId));
    setActiveRecipeId((prev) => (prev === recipeId ? null : prev));
    if (editingId === recipeId) {
      resetForm();
    }
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
    const selectedRecipe = recipeById[logRecipeId];
    if (!selectedRecipe) {
      return;
    }
    const timestamp = new Date(logDate).toISOString();
    const newLog = {
      id: crypto.randomUUID(),
      recipeId: selectedRecipe.id,
      name: selectedRecipe.name,
      cuisine: selectedRecipe.cuisine,
      cookbookTitle: selectedRecipe.cookbookTitle,
      timestamp,
      note: logNote.trim(),
    };

    setLogs((prev) => [newLog, ...prev]);
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              timesCooked: recipe.timesCooked + 1,
              lastCooked: timestamp,
            }
          : recipe
      )
    );
    setLogRecipeId("");
    setLogNote("");
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
            />
          )}

          {activeTab === "log" && (
            <LogView
              recipes={recipes}
              logRecipeId={logRecipeId}
              onLogRecipeId={setLogRecipeId}
              logDate={logDate}
              onLogDate={setLogDate}
              logNote={logNote}
              onLogNote={setLogNote}
              onSubmit={handleLogCook}
              recentLogs={recentLogs}
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
