import { StarRating } from "./StarRating";

export const RecipeModal = ({
  isOpen,
  editingId,
  formData,
  onFormChange,
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

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Recipe form</p>
            <h2 id="recipe-modal-title">
              {editingId ? "Edit recipe" : "Add a recipe"}
            </h2>
          </div>
          <button type="button" className="ghost icon-button" onClick={onClose}>
            <span aria-hidden="true">×</span>
            <span>Close</span>
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

          <label htmlFor="cookbook">Cookbook title</label>
          <input
            id="cookbook"
            type="text"
            list="cookbook-options"
            name="cookbook"
            autoComplete="on"
            value={formData.cookbookTitle}
            onChange={onFormChange("cookbookTitle")}
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
            type="number"
            inputMode="numeric"
            min="1"
            value={formData.page}
            onChange={onFormChange("page")}
            placeholder="112"
          />

          <label htmlFor="cuisine">Cuisine</label>
          <input
            id="cuisine"
            type="text"
            list="cuisine-options"
            name="cuisine"
            autoComplete="on"
            value={formData.cuisine}
            onChange={onFormChange("cuisine")}
            placeholder="Italian"
          />
          <datalist id="cuisine-options">
            {cuisineOptions.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>

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
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
            {editingId && (
              <button
                type="button"
                className="ghost danger"
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
