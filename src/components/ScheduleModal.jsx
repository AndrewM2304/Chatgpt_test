import { TypeaheadInput } from "./TypeaheadInput";

export const ScheduleModal = ({
  isOpen,
  editingLogId,
  recipeOptions,
  logRecipeId,
  logRecipeQuery,
  onLogRecipeQuery,
  logDate,
  onLogDate,
  logMeal,
  onLogMeal,
  logNote,
  onLogNote,
  onSubmit,
  onClose,
  onDelete,
  onPickRandom,
  mealOptions,
  hasRecipes,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Schedule meals</p>
            <h2 id="schedule-modal-title">
              {editingLogId ? "Edit meal" : "Add a meal"}
            </h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form onSubmit={onSubmit} className="modal-form">
          <TypeaheadInput
            id="log-recipe"
            name="log-recipe"
            label="Recipe"
            value={logRecipeQuery}
            onChange={onLogRecipeQuery}
            options={recipeOptions}
            placeholder="Search recipes"
          />
          <button
            type="button"
            className="ghost"
            onClick={onPickRandom}
            disabled={!hasRecipes}
          >
            Pick a random meal
          </button>

          <div className="modal-grid">
            <div className="control">
              <label htmlFor="log-date">Date</label>
              <input
                id="log-date"
                type="date"
                value={logDate}
                onChange={(event) => onLogDate(event.target.value)}
              />
            </div>
            <div className="control">
              <label htmlFor="log-meal">Meal slot</label>
              <select
                id="log-meal"
                value={logMeal}
                onChange={(event) => onLogMeal(event.target.value)}
              >
                {mealOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="log-note">Notes (optional)</label>
          <input
            id="log-note"
            type="text"
            placeholder="Added extra basil"
            value={logNote}
            onChange={(event) => onLogNote(event.target.value)}
          />

          <div className="form-actions">
            <button
              className="primary"
              type="submit"
              disabled={!hasRecipes || !logRecipeId || !logDate}
            >
              {editingLogId ? "Save changes" : "Add to schedule"}
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
            {editingLogId && (
              <button
                type="button"
                className="ghost danger"
                onClick={() => onDelete(editingLogId)}
              >
                Remove meal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
