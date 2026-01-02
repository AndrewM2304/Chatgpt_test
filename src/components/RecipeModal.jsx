import { useEffect, useMemo, useState } from "react";
import { StarRating } from "./StarRating";
import { TypeaheadInput } from "./TypeaheadInput";

export const RecipeModal = ({
  isOpen,
  editingRecipe,
  onSaveRecipe,
  onClose,
  onDeleteRecipe,
  cookbookOptions,
  cuisineOptions,
}) => {
  if (!isOpen) {
    return null;
  }

  const emptyForm = useMemo(
    () => ({
      name: "",
      sourceType: "cookbook",
      cookbookTitle: "",
      page: "",
      url: "",
      cuisine: "",
      rating: "",
      duration: "",
      notes: "",
    }),
    []
  );
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!editingRecipe) {
      setFormData(emptyForm);
      return;
    }
    setFormData({
      name: editingRecipe.name,
      sourceType:
        editingRecipe.sourceType || (editingRecipe.url ? "website" : "cookbook"),
      cookbookTitle: editingRecipe.cookbookTitle,
      page: editingRecipe.page,
      url: editingRecipe.url || "",
      cuisine: editingRecipe.cuisine,
      rating: editingRecipe.rating ? String(editingRecipe.rating) : "",
      duration: editingRecipe.durationMinutes
        ? String(editingRecipe.durationMinutes)
        : "",
      notes: editingRecipe.notes || "",
    });
  }, [editingRecipe, emptyForm, isOpen]);

  const isWebsite = formData.sourceType === "website";

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFormValueChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (value) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSaveRecipe(formData);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <h2 id="recipe-modal-title">
              {editingRecipe ? "Edit recipe" : "Add a recipe"}
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
        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="recipe-name">Recipe name</label>
          <input
            id="recipe-name"
            type="text"
            value={formData.name}
            onChange={handleFormChange("name")}
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
                  onChange={handleFormChange("sourceType")}
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
                  onChange={handleFormChange("sourceType")}
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
            onChange={handleFormValueChange("cookbookTitle")}
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
                onChange={handleFormChange("url")}
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
                onChange={handleFormChange("page")}
                placeholder="112"
              />
            </>
          )}

          <TypeaheadInput
            id="cuisine"
            name="cuisine"
            label="Cuisine"
            value={formData.cuisine}
            onChange={handleFormValueChange("cuisine")}
            options={cuisineOptions}
            placeholder="Italian"
          />

          <div className="modal-grid">
            {editingRecipe && (
              <div className="control">
                <label id="rating-label">Rating</label>
                <div id="rating" aria-labelledby="rating-label">
                  <StarRating
                    value={formData.rating}
                    onChange={handleRatingChange}
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
                onChange={handleFormChange("duration")}
                placeholder="45"
              />
            </div>
          </div>

          <label htmlFor="recipe-notes">Details or notes</label>
          <input
            id="recipe-notes"
            type="text"
            value={formData.notes}
            onChange={handleFormChange("notes")}
            placeholder="Add tips, substitutions, or reminders."
          />

          <div className="form-actions">
            <button className="primary" type="submit">
              {editingRecipe ? "Save changes" : "Add recipe"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            {editingRecipe && (
              <button
                type="button"
                className="secondary danger"
                onClick={() => onDeleteRecipe(editingRecipe.id)}
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
