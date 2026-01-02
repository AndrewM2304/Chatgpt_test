import { StarRating } from "./StarRating";
import { TypeaheadInput } from "./TypeaheadInput";

export const RecipeModal = ({
  isOpen,
  editingId,
  formData,
  onFormChange,
  onValueChange,
  onRatingChange,
  onSaveRecipe,
  onClose,
  onDeleteRecipe,
  cookbookOptions,
  cuisineOptions,
}) => {
  if (!isOpen) {
    return null;
  }

  const isWebsite = formData.sourceType === "website";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <h2 id="recipe-modal-title">
              {editingId ? "Edit recipe" : "Add a recipe"}
            </h2>
          </div>
          <button
            type="button"
            className="secondary icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form onSubmit={onSaveRecipe} className="modal-form">
          <label htmlFor="recipe-name">Recipe name</label>
          <input
            id="recipe-name"
            type="text"
            value={formData.name}
            onChange={onFormChange("name")}
            placeholder="Creamy lemon pasta"
          />

          <div className="control">
            <span className="radio-group-label">Entry type</span>
            <div className="radio-options">
              <label className="radio-option" htmlFor="source-cookbook">
                <input
                  id="source-cookbook"
                  type="radio"
                  name="sourceType"
                  value="cookbook"
                  checked={!isWebsite}
                  onChange={onFormChange("sourceType")}
                />
                Cookbook
              </label>
              <label className="radio-option" htmlFor="source-website">
                <input
                  id="source-website"
                  type="radio"
                  name="sourceType"
                  value="website"
                  checked={isWebsite}
                  onChange={onFormChange("sourceType")}
                />
                Website
              </label>
            </div>
          </div>

          <TypeaheadInput
            id="cookbook"
            name="cookbook"
            label={isWebsite ? "Website name" : "Cookbook title"}
            value={formData.cookbookTitle}
            onChange={onValueChange("cookbookTitle")}
            options={cookbookOptions}
            placeholder={isWebsite ? "NYT Cooking" : "Sunday Suppers"}
          />

          {isWebsite ? (
            <>
              <label htmlFor="recipe-url">Recipe URL</label>
              <input
                id="recipe-url"
                type="url"
                value={formData.url}
                onChange={onFormChange("url")}
                placeholder="https://example.com/recipe"
              />
            </>
          ) : (
            <>
              <label htmlFor="page">Page</label>
              <input
                id="page"
                type="number"
                inputMode="numeric"
                min="1"
                value={formData.page}
                onChange={onFormChange("page")}
                placeholder="112"
              />
            </>
          )}

          <TypeaheadInput
            id="cuisine"
            name="cuisine"
            label="Cuisine"
            value={formData.cuisine}
            onChange={onValueChange("cuisine")}
            options={cuisineOptions}
            placeholder="Italian"
          />

          <div className="modal-grid">
            {editingId && (
              <div className="control">
                <label id="rating-label">Rating</label>
                <div id="rating" aria-labelledby="rating-label">
                  <div className="rating-row">
                    <div className="rating-label">
                      {formData.rating ? `${formData.rating} / 5` : "Unrated"}
                    </div>
                  </div>
                  <StarRating
                    value={formData.rating}
                    onChange={onRatingChange}
                    label="Recipe rating"
                    isEditable
                  />
                </div>
              </div>
            )}
            <div className="control">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                min="1"
                inputMode="numeric"
                value={formData.duration}
                onChange={onFormChange("duration")}
                placeholder="45"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="primary" type="submit">
              {editingId ? "Save changes" : "Add recipe"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary danger"
                onClick={() => onDeleteRecipe(editingId)}
              >
                Delete recipe
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
