import {
  formatDuration,
  getCoverColor,
  getInitials,
  groupOptions,
} from "../utils/recipeUtils";
import { RecipeRating } from "./RecipeRating";

export const CatalogView = ({
  groupedRecipes,
  totalRecipes,
  searchTerm,
  onSearchTerm,
  groupBy,
  onGroupBy,
  onOpenRecipe,
  hasRecipes,
  onAddRecipe,
}) => {
  const recipeCountLabel = totalRecipes === 1 ? "recipe" : "recipes";

  return (
    <section className="catalog">
      <div className="catalog-toolbar">
        <div className="control">
          <label htmlFor="search">
            Search from {totalRecipes} {recipeCountLabel}
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name, cookbook, cuisine..."
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
        {groupedRecipes.map((group) => (
          <div key={group.label} className="catalog-group">
            <h2>{group.label}</h2>
            <div className="recipe-grid">
              {group.items.map((recipe) => {
                const isWebsite =
                  recipe.sourceType === "website" ||
                  (!recipe.sourceType && recipe.url);
                const sourceTitle =
                  recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");

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
                      className="recipe-cover"
                      style={{
                        background: getCoverColor(sourceTitle),
                      }}
                    >
                      <span>{getInitials(sourceTitle)}</span>
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
                      <RecipeRating
                        value={recipe.rating || 0}
                        label="Recipe rating"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

        {!hasRecipes && (
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
};
