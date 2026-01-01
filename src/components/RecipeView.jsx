import { formatDate, getCoverColor, getInitials } from "../utils/recipeUtils";

export const RecipeView = ({
  activeRecipe,
  onBack,
  onStartLog,
  onEditRecipe,
}) => (
  <section className="recipe-view">
    {activeRecipe ? (
      <>
        <div className="recipe-view-header">
          <button type="button" className="ghost" onClick={onBack}>
            Back to catalog
          </button>
        </div>
        <div className="recipe-view-card">
          <div
            className="recipe-cover"
            style={{
              background: getCoverColor(
                activeRecipe.cookbookTitle || "Cookbook"
              ),
            }}
          >
            <span>{getInitials(activeRecipe.cookbookTitle || "Cookbook")}</span>
          </div>
          <div className="recipe-view-details">
            <p className="eyebrow">Recipe card</p>
            <h2>{activeRecipe.name}</h2>
            <p className="recipe-meta">
              {activeRecipe.cookbookTitle || "No cookbook"}
              {activeRecipe.page ? ` · Page ${activeRecipe.page}` : ""}
            </p>
            <p className="recipe-meta">
              Cuisine: {activeRecipe.cuisine || "Uncategorized"}
            </p>
            <div className="recipe-footer">
              <span>{activeRecipe.timesCooked} cooks logged</span>
              <span>Last cooked: {formatDate(activeRecipe.lastCooked)}</span>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="primary"
                onClick={() => onStartLog(activeRecipe.id)}
              >
                Log a cook
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => onEditRecipe(activeRecipe)}
              >
                Edit recipe
              </button>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="recipe-view-empty">
        <p className="empty">That recipe is no longer available.</p>
        <button type="button" className="ghost" onClick={onBack}>
          Back to catalog
        </button>
      </div>
    )}
  </section>
);
