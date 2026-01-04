import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { CatalogView } from "../components/CatalogView";
import { RecipeModal } from "../components/RecipeModal";
import { RecipeView } from "../components/RecipeView";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { createId } from "../utils/idUtils";
import { durationBuckets, timesBuckets } from "../utils/recipeUtils";

const CatalogDetailLayout = ({
  activeRecipeId,
  groupedRecipes,
  totalRecipes,
  searchTerm,
  onSearchTerm,
  groupBy,
  onGroupBy,
  onOpenRecipe,
  hasRecipes,
  onAddRecipe,
  onRatingChange,
  cookbookCovers,
  onStartLog,
  onEditRecipe,
  onDeleteRecipe,
  recipeById,
}) => {
  const activeRecipe = activeRecipeId ? recipeById[activeRecipeId] || null : null;

  return (
    <div className="catalog-detail">
      <div className="catalog-detail-sidebar">
        <CatalogView
          groupedRecipes={groupedRecipes}
          totalRecipes={totalRecipes}
          searchTerm={searchTerm}
          onSearchTerm={onSearchTerm}
          groupBy={groupBy}
          onGroupBy={onGroupBy}
          onOpenRecipe={onOpenRecipe}
          hasRecipes={hasRecipes}
          onAddRecipe={onAddRecipe}
          onRatingChange={onRatingChange}
          cookbookCovers={cookbookCovers}
        />
      </div>
      <div className="catalog-detail-preview">
        <RecipeView
          activeRecipe={activeRecipe}
          onStartLog={(recipeId) => onStartLog(recipeId, { deferNavigation: true })}
          onEditRecipe={onEditRecipe}
          onDeleteRecipe={onDeleteRecipe}
          onRatingChange={(value) => onRatingChange(activeRecipe?.id, value)}
          cookbookCovers={cookbookCovers}
        />
      </div>
    </div>
  );
};

const RecipeRoute = (props) => {
  const { recipeId } = useParams();
  return <CatalogDetailLayout activeRecipeId={recipeId} {...props} />;
};

export const CatalogRoute = ({
  recipes,
  setRecipes,
  syncCatalog,
  addToast,
  cookbookCoverMap,
  cuisineOptions,
  onOpenRecipe,
  onDeleteRecipe,
  onStartLog,
  isDesktop,
  openAddRecipeSignal,
  onRecipeModalOpenChange,
  pendingEditRecipeId,
  onEditHandled,
  onAddRecipeSignalHandled,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [viewMode, setViewMode] = useLocalStorage("catalog-view-mode", "list");
  const [selectedCookbook, setSelectedCookbook] = useState("");
  const [previousViewMode, setPreviousViewMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastAddSignal = useRef(0);

  const resetForm = useCallback(() => {
    setEditingId(null);
  }, []);

  useEffect(() => {
    onRecipeModalOpenChange?.(isModalOpen);
    return () => {
      onRecipeModalOpenChange?.(false);
    };
  }, [isModalOpen, onRecipeModalOpenChange]);

  useEffect(() => {
    if (openAddRecipeSignal === 0) {
      return;
    }
    if (openAddRecipeSignal !== lastAddSignal.current) {
      lastAddSignal.current = openAddRecipeSignal;
      resetForm();
      setIsModalOpen(true);
      onAddRecipeSignalHandled?.();
    }
  }, [onAddRecipeSignalHandled, openAddRecipeSignal, resetForm]);

  const isWebsiteRecipe = (recipe) =>
    recipe.sourceType === "website" || (!recipe.sourceType && recipe.url);

  const cookbookOptions = useMemo(() => {
    return Array.from(
      new Set(
        recipes
          .filter((recipe) => !isWebsiteRecipe(recipe))
          .map((recipe) => recipe.cookbookTitle)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const websiteOptions = useMemo(() => {
    return Array.from(
      new Set(
        recipes
          .filter((recipe) => isWebsiteRecipe(recipe))
          .map((recipe) => recipe.cookbookTitle)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const cookbookCards = useMemo(() => {
    const cookbookMap = new Map();

    recipes.forEach((recipe) => {
      const isWebsite = isWebsiteRecipe(recipe);
      const title = recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");
      if (!cookbookMap.has(title)) {
        cookbookMap.set(title, 0);
      }
      cookbookMap.set(title, cookbookMap.get(title) + 1);
    });

    return Array.from(cookbookMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [recipes]);

  const recipeById = useMemo(() => {
    return recipes.reduce((accumulator, recipe) => {
      accumulator[recipe.id] = recipe;
      return accumulator;
    }, {});
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return selectedCookbook
        ? recipes.filter((recipe) => {
            const isWebsite = isWebsiteRecipe(recipe);
            const title =
              recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");
            return title === selectedCookbook;
          })
        : recipes;
    }
    return recipes.filter((recipe) => {
      if (selectedCookbook) {
        const isWebsite = isWebsiteRecipe(recipe);
        const title =
          recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");
        if (title !== selectedCookbook) {
          return false;
        }
      }
      return [
        recipe.name,
        recipe.cuisine,
        recipe.page,
        recipe.url,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [recipes, searchTerm, selectedCookbook]);

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
          durationBuckets.find((item) => item.test(recipe.durationMinutes))
            ?.label || "No duration set";
        addToGroup(bucket, recipe);
        return;
      }
      addToGroup("All recipes", recipe);
    });

    const getPageValue = (recipe) => {
      const pageNumber = Number.parseInt(recipe.page, 10);
      return Number.isNaN(pageNumber) ? Number.POSITIVE_INFINITY : pageNumber;
    };

    const sortByName = (a, b) => a.name.localeCompare(b.name);
    const sortByPage = (a, b) => {
      const pageDelta = getPageValue(a) - getPageValue(b);
      if (pageDelta !== 0) {
        return pageDelta;
      }
      return sortByName(a, b);
    };

    const sortRecipes = selectedCookbook ? sortByPage : sortByName;

    return Array.from(groups.entries())
      .map(([label, items]) => ({
        label,
        items: items.sort(sortRecipes),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredRecipes, groupBy, selectedCookbook]);

  const defaultRecipeId = useMemo(() => {
    return groupedRecipes[0]?.items?.[0]?.id ?? null;
  }, [groupedRecipes]);

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
      const latestCatalog = await syncCatalog();
      const latestRecipes = Array.isArray(latestCatalog?.recipes)
        ? latestCatalog.recipes
        : recipes;

      setRecipes(
        latestRecipes.map((recipe) =>
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
        id: createId(),
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

  const handleSelectCookbook = useCallback(
    (title) => {
      setPreviousViewMode(viewMode);
      setSelectedCookbook(title);
      setSearchTerm("");
      setGroupBy("none");
      setViewMode("list");
    },
    [setViewMode, viewMode]
  );

  const handleViewModeChange = useCallback((nextMode) => {
    setViewMode(nextMode);
    if (nextMode === "cards") {
      setSelectedCookbook("");
    }
  }, [setSelectedCookbook, setViewMode]);

  const handleClearCookbook = useCallback(() => {
    setSelectedCookbook("");
    setViewMode(previousViewMode);
  }, [previousViewMode, setViewMode]);

  const handleDeleteFromView = (recipeId) => {
    if (!recipeId) {
      return;
    }
    const deleted = onDeleteRecipe(recipeId);
    if (deleted && editingId === recipeId) {
      resetForm();
    }
  };

  const handleOpenAddModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleDeleteFromModal = (recipeId = editingId) => {
    if (!recipeId) {
      return;
    }
    const deleted = onDeleteRecipe(recipeId);
    if (deleted) {
      setIsModalOpen(false);
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

  const detailLayoutProps = {
    groupedRecipes,
    totalRecipes: recipes.length,
    searchTerm,
    onSearchTerm: setSearchTerm,
    groupBy,
    onGroupBy: setGroupBy,
    onOpenRecipe,
    hasRecipes: recipes.length > 0,
    onAddRecipe: handleOpenAddModal,
    onRatingChange: handleUpdateRecipeRating,
    cookbookCovers: cookbookCoverMap,
    cookbookCards,
    viewMode,
    onViewModeChange: handleViewModeChange,
    selectedCookbook,
    onSelectCookbook: handleSelectCookbook,
    onClearCookbook: handleClearCookbook,
    onStartLog,
    onEditRecipe: handleEditRecipe,
    onDeleteRecipe: handleDeleteFromView,
    recipeById,
  };

  const catalogContent = isDesktop ? (
    <CatalogDetailLayout activeRecipeId={defaultRecipeId} {...detailLayoutProps} />
  ) : (
    <CatalogView
      groupedRecipes={groupedRecipes}
      totalRecipes={recipes.length}
      searchTerm={searchTerm}
      onSearchTerm={setSearchTerm}
      groupBy={groupBy}
      onGroupBy={setGroupBy}
      onOpenRecipe={onOpenRecipe}
      hasRecipes={recipes.length > 0}
      onAddRecipe={handleOpenAddModal}
      onRatingChange={handleUpdateRecipeRating}
      cookbookCovers={cookbookCoverMap}
      cookbookCards={cookbookCards}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      selectedCookbook={selectedCookbook}
      onSelectCookbook={handleSelectCookbook}
      onClearCookbook={handleClearCookbook}
    />
  );

  useEffect(() => {
    if (!pendingEditRecipeId) {
      return;
    }
    const recipe = recipeById[pendingEditRecipeId];
    if (!recipe) {
      return;
    }
    setEditingId(recipe.id);
    setIsModalOpen(true);
    onEditHandled?.();
  }, [onEditHandled, pendingEditRecipeId, recipeById]);

  return (
    <>
      <Routes>
        <Route path="/" element={catalogContent} />
        <Route path="/catalog" element={catalogContent} />
        <Route path="/recipe/:recipeId" element={<RecipeRoute {...detailLayoutProps} />} />
        <Route path="*" element={catalogContent} />
      </Routes>
      <RecipeModal
        isOpen={isModalOpen}
        editingRecipe={editingId ? recipeById[editingId] : null}
        onSaveRecipe={handleSaveRecipe}
        onClose={handleCloseModal}
        onDeleteRecipe={handleDeleteFromModal}
        cookbookOptions={cookbookOptions}
        websiteOptions={websiteOptions}
        cuisineOptions={cuisineOptions}
      />
    </>
  );
};
