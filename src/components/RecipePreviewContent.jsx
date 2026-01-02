import {
  formatDate,
  formatDuration,
  getCoverColor,
  getInitials,
} from "../utils/recipeUtils";
import { RecipeRating } from "./RecipeRating";

export const RecipePreviewContent = ({
  recipe,
  onStartLog,
  onEditRecipe,
  onDeleteRecipe,
  onRatingChange,
  showTitle = true,
}) => {
  const isWebsite =
    recipe.sourceType === "website" || (!recipe.sourceType && recipe.url);
  const sourceTitle =
    recipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");
  const durationLabel = formatDuration(recipe.durationMinutes);

  return (
    <div className="recipe-view-card">
      <div
        className="recipe-cover"
        style={{
          background: getCoverColor(sourceTitle),
        }}
      >
        <span>{getInitials(sourceTitle)}</span>
      </div>
      <div className="recipe-view-details">
        {showTitle && <h2>{recipe.name}</h2>}
        <p className="recipe-meta">
          {sourceTitle}
          {!isWebsite && recipe.page ? ` · Page ${recipe.page}` : ""}
        </p>
        {isWebsite && recipe.url && (
          <p className="recipe-meta">
            <a href={recipe.url} target="_blank" rel="noreferrer">
              {recipe.url}
            </a>
          </p>
        )}
        <p className="recipe-meta">
          Cuisine: {recipe.cuisine || "Uncategorized"}
        </p>
        <RecipeRating
          value={recipe.rating || 0}
          label="Recipe rating"
          isEditable
          onChange={onRatingChange}
        />
        {durationLabel ? (
          <p className="recipe-meta">{durationLabel}</p>
        ) : null}
        {recipe.notes ? <p className="recipe-notes">{recipe.notes}</p> : null}
        <div className="recipe-footer">
          <span>Last cooked: {formatDate(recipe.lastCooked)}</span>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="primary"
            onClick={() => onStartLog(recipe.id)}
          >
            Schedule meal
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onEditRecipe(recipe)}
          >
            Edit recipe
          </button>
          <button
            type="button"
            className="secondary danger"
            onClick={() => onDeleteRecipe?.(recipe.id)}
          >
            Delete recipe
          </button>
        </div>
      </div>
    </div>
  );
};
