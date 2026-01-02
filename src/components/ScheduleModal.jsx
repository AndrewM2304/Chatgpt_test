import { TypeaheadInput } from "./TypeaheadInput";

export const ScheduleModal = ({
  isOpen,
  editingLogId,
  recipeOptions,
  logRecipeId,
  logRecipeQuery,
  onLogRecipeQuery,
  selectedDays,
  selectedMeals,
  onToggleDay,
  onToggleMeal,
  weekDays,
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

          <fieldset className="log-days">
            <legend>Days</legend>
            <div className="log-days-grid">
              {weekDays.map((day) => {
                const inputId = `log-day-${day.value}`;
                return (
                  <label key={day.value} className="log-day-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => onToggleDay(day.value)}
                    />
                    <span>{day.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="log-days">
            <legend>Meals</legend>
            <div className="log-days-grid">
              {mealOptions.map((option) => {
                const inputId = `log-meal-${option.value}`;
                return (
                  <label key={option.value} className="log-day-option" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={selectedMeals.includes(option.value)}
                      onChange={() => onToggleMeal(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

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
              disabled={
                !hasRecipes ||
                !logRecipeId ||
                !selectedDays.length ||
                !selectedMeals.length
              }
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
