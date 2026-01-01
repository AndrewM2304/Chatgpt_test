import { useMemo, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";

const groupOptions = [
  { value: "none", label: "All recipes" },
  { value: "cookbook", label: "Cookbook" },
  { value: "cuisine", label: "Cuisine" },
  { value: "times", label: "Times cooked" },
];

const timesBuckets = [
  { label: "Never cooked", test: (count) => count === 0 },
  { label: "1-2 times", test: (count) => count >= 1 && count <= 2 },
  { label: "3-5 times", test: (count) => count >= 3 && count <= 5 },
  { label: "6+ times", test: (count) => count >= 6 },
];

const getInitials = (title) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const getCoverColor = (title) => {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 88%)`;
};

const formatDate = (value) => {
  if (!value) {
    return "Not cooked yet";
  }
  return new Date(value).toLocaleDateString();
};

export default function App() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [recipes, setRecipes] = useLocalStorage("recipe-catalog", []);
  const [cookbooks, setCookbooks] = useLocalStorage("recipe-cookbooks", []);
  const [cuisines, setCuisines] = useLocalStorage("recipe-cuisines", []);
  const [logs, setLogs] = useLocalStorage("recipe-logs", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [excludedCuisines, setExcludedCuisines] = useState([]);
  const [randomPick, setRandomPick] = useState(null);
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
  });
  const [editingId, setEditingId] = useState(null);

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

  const stats = useMemo(() => {
    return {
      totalRecipes: recipes.length,
      totalCooked: recipes.reduce((sum, recipe) => sum + recipe.timesCooked, 0),
    };
  }, [recipes]);

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setFormData({ name: "", cookbookTitle: "", page: "", cuisine: "" });
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
  };

  const handleEditRecipe = (recipe) => {
    setFormData({
      name: recipe.name,
      cookbookTitle: recipe.cookbookTitle,
      page: recipe.page,
      cuisine: recipe.cuisine,
    });
    setEditingId(recipe.id);
    setActiveTab("manage");
  };

  const handleDeleteRecipe = (recipeId) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setLogs((prev) => prev.filter((entry) => entry.recipeId !== recipeId));
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

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Recipe catalog</p>
        <h1>Cookbook Keeper</h1>
        <p className="subtitle">
          Track your favorite recipes, log every cook, and pick a random dinner
          without repeating the same cuisine.
        </p>
      </header>

      <main className="panel">
        {activeTab === "catalog" && (
          <section className="catalog">
            <div className="catalog-toolbar">
              <div className="control">
                <label htmlFor="search">Search recipes</label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search by name, cookbook, cuisine..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="control">
                <label htmlFor="group">Group by</label>
                <select
                  id="group"
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value)}
                >
                  {groupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="catalog-stats">
              <div>
                <strong>{stats.totalRecipes}</strong>
                <span>Total recipes</span>
              </div>
              <div>
                <strong>{stats.totalCooked}</strong>
                <span>Meals cooked</span>
              </div>
            </div>

            {groupedRecipes.map((group) => (
              <div key={group.label} className="catalog-group">
                <h2>{group.label}</h2>
                <div className="recipe-grid">
                  {group.items.map((recipe) => (
                    <article key={recipe.id} className="recipe-card">
                      <div
                        className="recipe-cover"
                        style={{
                          background: getCoverColor(
                            recipe.cookbookTitle || "Cookbook"
                          ),
                        }}
                      >
                        <span>{getInitials(recipe.cookbookTitle || "Cookbook")}</span>
                      </div>
                      <div className="recipe-details">
                        <header>
                          <h3>{recipe.name}</h3>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            Edit
                          </button>
                        </header>
                        <p className="recipe-meta">
                          {recipe.cookbookTitle || "No cookbook"}
                          {recipe.page ? ` · Page ${recipe.page}` : ""}
                        </p>
                        <p className="recipe-meta">
                          Cuisine: {recipe.cuisine || "Uncategorized"}
                        </p>
                        <div className="recipe-footer">
                          <span>{recipe.timesCooked} cooks logged</span>
                          <span>Last cooked: {formatDate(recipe.lastCooked)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {!recipes.length && (
              <p className="empty">No recipes yet. Add your first cookbook hit.</p>
            )}
          </section>
        )}

        {activeTab === "random" && (
          <section className="random">
            <div className="random-controls">
              <h2>Random dinner picker</h2>
              <p>
                Toggle cuisines you want a break from, then pick a recipe at
                random.
              </p>
              <div className="chip-grid">
                {cuisineOptions.length ? (
                  cuisineOptions.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      className={`chip${
                        excludedCuisines.includes(cuisine) ? " is-off" : ""
                      }`}
                      onClick={() => handleToggleCuisine(cuisine)}
                    >
                      {cuisine}
                    </button>
                  ))
                ) : (
                  <span className="empty">Add cuisines to start filtering.</span>
                )}
              </div>
              <button
                type="button"
                className="primary"
                onClick={handlePickRandom}
                disabled={!randomCandidates.length}
              >
                Pick a random recipe
              </button>
              {!randomCandidates.length && recipes.length > 0 && (
                <p className="empty">
                  All recipes are filtered out. Turn a cuisine back on.
                </p>
              )}
              {!recipes.length && (
                <p className="empty">Add recipes to unlock the picker.</p>
              )}
            </div>

            {randomPick && (
              <div className="random-result">
                <p className="eyebrow">Tonight&apos;s pick</p>
                <h3>{randomPick.name}</h3>
                <p>
                  {randomPick.cookbookTitle || "No cookbook"}
                  {randomPick.page ? ` · Page ${randomPick.page}` : ""}
                </p>
                <p className="recipe-meta">
                  Cuisine: {randomPick.cuisine || "Uncategorized"}
                </p>
                <div className="recipe-footer">
                  <span>{randomPick.timesCooked} cooks logged</span>
                  <span>Last cooked: {formatDate(randomPick.lastCooked)}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "log" && (
          <section className="log">
            <div className="log-form">
              <h2>Log a cook</h2>
              <form onSubmit={handleLogCook}>
                <label htmlFor="recipe">Recipe</label>
                <select
                  id="recipe"
                  value={logRecipeId}
                  onChange={(event) => setLogRecipeId(event.target.value)}
                >
                  <option value="">Select a recipe</option>
                  {recipes
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                </select>

                <label htmlFor="cook-date">Date cooked</label>
                <input
                  id="cook-date"
                  type="date"
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                />

                <label htmlFor="cook-note">Notes (optional)</label>
                <input
                  id="cook-note"
                  type="text"
                  placeholder="Added extra basil"
                  value={logNote}
                  onChange={(event) => setLogNote(event.target.value)}
                />

                <button className="primary" type="submit" disabled={!recipes.length}>
                  Save log
                </button>
              </form>
            </div>

            <div className="log-history">
              <h2>Recent cooking</h2>
              {recentLogs.length ? (
                <ul>
                  {recentLogs.map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <strong>{entry.name}</strong>
                        <span>
                          {entry.cuisine || "Uncategorized"} · {entry.cookbookTitle || "No cookbook"}
                        </span>
                        {entry.note && <em>“{entry.note}”</em>}
                      </div>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No cooking logs yet.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "manage" && (
          <section className="manage">
            <div className="manage-form">
              <h2>{editingId ? "Edit recipe" : "Add a recipe"}</h2>
              <form onSubmit={handleSaveRecipe}>
                <label htmlFor="recipe-name">Recipe name</label>
                <input
                  id="recipe-name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange("name")}
                  placeholder="Creamy lemon pasta"
                />

                <label htmlFor="cookbook">Cookbook title</label>
                <input
                  id="cookbook"
                  type="text"
                  list="cookbook-options"
                  value={formData.cookbookTitle}
                  onChange={handleFormChange("cookbookTitle")}
                  placeholder="Sunday Suppers"
                />
                <datalist id="cookbook-options">
                  {cookbookOptions.map((title) => (
                    <option key={title} value={title} />
                  ))}
                </datalist>

                <label htmlFor="page">Page</label>
                <input
                  id="page"
                  type="text"
                  value={formData.page}
                  onChange={handleFormChange("page")}
                  placeholder="112"
                />

                <label htmlFor="cuisine">Cuisine</label>
                <input
                  id="cuisine"
                  type="text"
                  list="cuisine-options"
                  value={formData.cuisine}
                  onChange={handleFormChange("cuisine")}
                  placeholder="Italian"
                />
                <datalist id="cuisine-options">
                  {cuisineOptions.map((title) => (
                    <option key={title} value={title} />
                  ))}
                </datalist>

                <div className="form-actions">
                  <button className="primary" type="submit">
                    {editingId ? "Save changes" : "Add recipe"}
                  </button>
                  {editingId && (
                    <button type="button" className="ghost" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="manage-list">
              <h2>Saved recipes</h2>
              {recipes.length ? (
                <ul>
                  {recipes
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((recipe) => (
                      <li key={recipe.id}>
                        <div>
                          <strong>{recipe.name}</strong>
                          <span>
                            {recipe.cookbookTitle || "No cookbook"}
                            {recipe.page ? ` · Page ${recipe.page}` : ""}
                          </span>
                        </div>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ghost danger"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="empty">No recipes saved yet.</p>
              )}

              <div className="share-card">
                <h3>Share & sync</h3>
                <p>
                  Export your catalog and share the file with your wife (via
                  email or cloud drive). Import it on another device to keep
                  everything in sync.
                </p>
                <div className="share-actions">
                  <button type="button" className="primary" onClick={handleExport}>
                    Export catalog
                  </button>
                  <label className="ghost file-input">
                    Import catalog
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImport}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="tabs" aria-label="Recipe navigation">
        {[
          { id: "catalog", label: "Catalog" },
          { id: "random", label: "Random" },
          { id: "log", label: "Log cook" },
          { id: "manage", label: "Add/Edit" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
