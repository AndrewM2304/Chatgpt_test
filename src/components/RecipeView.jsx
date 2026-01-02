import {
  formatDate,
  formatDuration,
  getCoverColor,
  getInitials,
} from "../utils/recipeUtils";
import { StarRating } from "./StarRating";

export const RecipeView = ({
  activeRecipe,
  onBack,
  onStartLog,
  onEditRecipe,
  onDeleteRecipe,
}) => {
  if (!activeRecipe) {
    return (
      <section className="recipe-view">
        <div className="recipe-view-empty">
          <p className="empty">That recipe is no longer available.</p>
          <button type="button" className="ghost" onClick={onBack}>
            Back to catalog
          </button>
        </div>
      </section>
    );
  }

  const isWebsite =
    activeRecipe.sourceType === "website" ||
    (!activeRecipe.sourceType && activeRecipe.url);
  const sourceTitle =
    activeRecipe.cookbookTitle || (isWebsite ? "Website" : "No cookbook");

  return (
    <section className="recipe-view">
      <div className="recipe-view-header">
        <button type="button" className="ghost" onClick={onBack}>
          Back to catalog
        </button>
      </div>
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
          <p className="eyebrow">Recipe card</p>
          <h2>{activeRecipe.name}</h2>
          <p className="recipe-meta">
            {sourceTitle}
            {!isWebsite && activeRecipe.page
              ? ` · Page ${activeRecipe.page}`
              : ""}
          </p>
          {isWebsite && activeRecipe.url && (
            <p className="recipe-meta">
              <a
                href={activeRecipe.url}
                target="_blank"
                rel="noreferrer"
              >
                {activeRecipe.url}
              </a>
            </p>
          )}
          <p className="recipe-meta">
            Cuisine: {activeRecipe.cuisine || "Uncategorized"}
          </p>
          <div className="recipe-rating">
            <StarRating
              value={activeRecipe.rating || 0}
              label="Recipe rating"
            />
            <span className="recipe-rating-text">
              {activeRecipe.rating ? `${activeRecipe.rating} / 5` : "Unrated"}
            </span>
          </div>
          <p className="recipe-meta">
            {formatDuration(activeRecipe.durationMinutes)}
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
            <button
              type="button"
              className="ghost danger"
              onClick={() => onDeleteRecipe?.(activeRecipe.id)}
            >
              Delete recipe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
