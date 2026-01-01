import {
  formatDate,
  formatDuration,
  getCoverColor,
  getInitials,
  groupOptions,
} from "../utils/recipeUtils";

export const CatalogView = ({
  groupedRecipes,
  stats,
  searchTerm,
  onSearchTerm,
  groupBy,
  onGroupBy,
  onOpenRecipe,
  onEditRecipe,
  onStartLog,
  hasRecipes,
}) => (
  <section className="catalog">
    <div className="catalog-toolbar">
      <div className="control">
        <label htmlFor="search">Search recipes</label>
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
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditRecipe(recipe);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartLog(recipe.id);
                      }}
                    >
                      Log
                    </button>
                  </div>
                </header>
                <p className="recipe-meta">
                  {recipe.cookbookTitle || "No cookbook"}
                  {recipe.page ? ` · Page ${recipe.page}` : ""}
                </p>
                <p className="recipe-meta">
                  Cuisine: {recipe.cuisine || "Uncategorized"}
                </p>
                <p className="recipe-meta">
                  Rating: {recipe.rating ? `${recipe.rating} / 5` : "Unrated"} ·
                  Duration: {formatDuration(recipe.durationMinutes)}
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

    {!hasRecipes && (
      <p className="empty">No recipes yet. Add your first cookbook hit.</p>
    )}
  </section>
);
