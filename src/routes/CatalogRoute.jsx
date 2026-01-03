import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { CatalogView } from "../components/CatalogView";
import { RecipeModal } from "../components/RecipeModal";
import { RecipeView } from "../components/RecipeView";
import { durationBuckets, timesBuckets } from "../utils/recipeUtils";

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
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastAddSignal = useRef(0);

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
    }
  }, [openAddRecipeSignal, resetForm]);

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
          durationBuckets.find((item) => item.test(recipe.durationMinutes))
            ?.label || "No duration set";
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

  const resetForm = useCallback(() => {
    setEditingId(null);
  }, []);

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

  const handleDeleteFromView = (recipeId) => {
    if (!recipeId) {
      return;
    }
    const recipeName = recipeById[recipeId]?.name || "this recipe";
    const confirmed = window.confirm(`Delete ${recipeName}?`);
    if (!confirmed) {
      return;
    }
    onDeleteRecipe(recipeId);
    if (editingId === recipeId) {
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
    onDeleteRecipe(recipeId);
    setIsModalOpen(false);
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
            onOpenRecipe={onOpenRecipe}
            hasRecipes={recipes.length > 0}
            onAddRecipe={handleOpenAddModal}
            onRatingChange={handleUpdateRecipeRating}
            cookbookCovers={cookbookCoverMap}
          />
        </div>
        <div className="catalog-detail-preview">
          <RecipeView
            activeRecipe={activeRecipe}
            onStartLog={(recipeId) =>
              onStartLog(recipeId, { deferNavigation: true })
            }
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteFromView}
            onRatingChange={(value) =>
              handleUpdateRecipeRating(activeRecipe?.id, value)
            }
            cookbookCovers={cookbookCoverMap}
          />
        </div>
      </div>
    );
  };

  const RecipeRoute = () => {
    const { recipeId } = useParams();
    return <CatalogDetailLayout activeRecipeId={recipeId} />;
  };

  return (
    <>
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
                onOpenRecipe={onOpenRecipe}
                hasRecipes={recipes.length > 0}
                onAddRecipe={handleOpenAddModal}
                onRatingChange={handleUpdateRecipeRating}
                cookbookCovers={cookbookCoverMap}
              />
            )
          }
        />
        <Route path="/recipe/:recipeId" element={<RecipeRoute />} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
      <RecipeModal
        isOpen={isModalOpen}
        editingRecipe={editingId ? recipeById[editingId] : null}
        onSaveRecipe={handleSaveRecipe}
        onClose={handleCloseModal}
        onDeleteRecipe={handleDeleteFromModal}
        cookbookOptions={cookbookOptions}
        cuisineOptions={cuisineOptions}
      />
    </>
  );
};
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
