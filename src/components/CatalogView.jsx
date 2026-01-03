import { memo } from "react";
import {
  QueueListIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  formatDuration,
  getCoverColor,
  getInitials,
  groupOptions,
} from "../utils/recipeUtils";
import { RecipeRating } from "./RecipeRating";

export const CatalogView = memo(({
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
  cookbookCards,
  viewMode,
  onViewModeChange,
  selectedCookbook,
  onSelectCookbook,
  onClearCookbook,
}) => {
  const recipeCountLabel = totalRecipes === 1 ? "recipe" : "recipes";
  const hasResults = groupedRecipes.length > 0;
  const isCardView = viewMode === "cards";
  const activeRecipesLabel = selectedCookbook
    ? `${selectedCookbook} recipes`
    : `Search from ${totalRecipes} ${recipeCountLabel}`;

  return (
    <section className="catalog">
      <div className="catalog-toolbar">
        <div className="control">
          <div className="catalog-search-header">
            <label htmlFor="search">{activeRecipesLabel}</label>
            <div className="catalog-view-toggle">
              <div className="view-toggle" role="group" aria-label="Catalog view">
                <button
                  type="button"
                  className={`view-toggle-button${!isCardView ? " is-active" : ""}`}
                  aria-pressed={!isCardView}
                  aria-label="List view"
                  title="List view"
                  onClick={() => onViewModeChange("list")}
                >
                  <QueueListIcon className="view-toggle-icon" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`view-toggle-button${isCardView ? " is-active" : ""}`}
                  aria-pressed={isCardView}
                  aria-label="Card view"
                  title="Card view"
                  onClick={() => onViewModeChange("cards")}
                >
                  <Squares2X2Icon className="view-toggle-icon" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <input
            id="search"
            type="search"
            placeholder="Search by name, cuisine, page, URL..."
            value={searchTerm}
            onChange={(event) => onSearchTerm(event.target.value)}
          />
        </div>
        <div className="control">
          <label htmlFor="group">Group by</label>
          <select
            id="group"
            value={groupBy}
            onChange={(event) => onGroupBy(event.target.value)}
            disabled={Boolean(selectedCookbook)}
          >
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="catalog-body">
        {selectedCookbook && (
          <div className="catalog-selection">
            <div>
              <p className="catalog-selection-title">{selectedCookbook}</p>
              <p className="catalog-selection-meta">Browsing by page number.</p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={onClearCookbook}
            >
              Back to all cookbooks
            </button>
          </div>
        )}

        {isCardView ? (
          <div className="cookbook-grid">
            {cookbookCards.map((cookbook) => {
              const coverUrl = cookbookCovers?.[cookbook.title];
              return (
                <button
                  key={cookbook.title}
                  type="button"
                  className="cookbook-card"
                  aria-label={`${cookbook.title} (${cookbook.count} ${
                    cookbook.count === 1 ? "recipe" : "recipes"
                  })`}
                  onClick={() => onSelectCookbook(cookbook.title)}
                >
                  <div
                    className={`cookbook-cover${coverUrl ? " has-image" : ""}`}
                    aria-hidden="true"
                    style={{
                      backgroundColor: getCoverColor(cookbook.title),
                      ...(coverUrl
                        ? { backgroundImage: `url(${coverUrl})` }
                        : {}),
                    }}
                  >
                    {!coverUrl && <span>{getInitials(cookbook.title)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          groupedRecipes.map((group) => (
            <div key={group.label} className="catalog-group">
              <h2>{group.label}</h2>
              <div className="recipe-grid">
                {group.items.map((recipe) => {
                  const isWebsite =
                    recipe.sourceType === "website" ||
                    (!recipe.sourceType && recipe.url);
                  const sourceTitle =
                    recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");
                  const coverUrl = cookbookCovers?.[sourceTitle];

                  return (
                    <article
                      key={recipe.id}
                      className="recipe-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenRecipe(recipe)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenRecipe(recipe);
                        }
                      }}
                    >
                      <div
                        className={`recipe-cover${coverUrl ? " has-image" : ""}`}
                        role="img"
                        aria-label={`${sourceTitle} cover`}
                        style={{
                          backgroundColor: getCoverColor(sourceTitle),
                          ...(coverUrl
                            ? { backgroundImage: `url(${coverUrl})` }
                            : {}),
                        }}
                      >
                        {!coverUrl && <span>{getInitials(sourceTitle)}</span>}
                      </div>
                      <div className="recipe-details">
                        <header>
                          <h3>{recipe.name}</h3>
                        </header>
                        {recipe.durationMinutes ? (
                          <p className="recipe-meta">
                            {formatDuration(recipe.durationMinutes)}
                          </p>
                        ) : null}
                        <div
                          className="recipe-rating-control"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <RecipeRating
                            value={recipe.rating || 0}
                            label="Recipe rating"
                            isEditable
                            onChange={(value) => onRatingChange?.(recipe.id, value)}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasRecipes && !hasResults && !isCardView && (
          <div className="empty-state">
            <p className="empty">No recipes match your search.</p>
            <button
              type="button"
              className="secondary"
              onClick={() => onSearchTerm("")}
            >
              Clear search
            </button>
          </div>
        )}

        {isCardView && cookbookCards.length === 0 && (
          <p className="empty">No cookbooks yet. Add your first recipe.</p>
        )}

        {!hasRecipes && !isCardView && (
          <p className="empty">No recipes yet. Add your first cookbook hit.</p>
        )}
      </div>

      <div className="log-sticky-action catalog-sticky-action">
        <button
          type="button"
          className="primary log-sticky-button"
          onClick={onAddRecipe}
        >
          Add recipe
        </button>
      </div>
    </section>
  );
});

CatalogView.displayName = "CatalogView";
