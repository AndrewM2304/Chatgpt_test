import { Fragment } from "react";

export const LogView = ({
  recipes,
  logRecipeId,
  onLogRecipeId,
  logWeekDate,
  onLogWeekDate,
  logDays,
  onToggleLogDay,
  logMeal,
  onLogMeal,
  logNote,
  onLogNote,
  onSubmit,
  weekDays,
  weeklySchedule,
  mealOptions,
}) => (
  <section className="log">
    <div className="log-form">
      <h2>Schedule meals</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="recipe">Recipe</label>
        <select
          id="recipe"
          value={logRecipeId}
          onChange={(event) => onLogRecipeId(event.target.value)}
        >
          <option value="">Select a recipe</option>
          {recipes
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
        </select>

        <label htmlFor="week-of">Week of</label>
        <input
          id="week-of"
          type="date"
          value={logWeekDate}
          onChange={(event) => onLogWeekDate(event.target.value)}
        />

        <label htmlFor="meal-type">Meal slot</label>
        <select
          id="meal-type"
          value={logMeal}
          onChange={(event) => onLogMeal(event.target.value)}
        >
          {mealOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <fieldset className="log-days">
          <legend>Days</legend>
          <div className="log-days-grid">
            {weekDays.map((day, index) => (
              <label key={day.value} className="log-day-option">
                <input
                  type="checkbox"
                  checked={logDays.includes(index)}
                  onChange={() => onToggleLogDay(index)}
                />
                <span>
                  {day.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="cook-note">Notes (optional)</label>
        <input
          id="cook-note"
          type="text"
          placeholder="Added extra basil"
          value={logNote}
          onChange={(event) => onLogNote(event.target.value)}
        />

        <button
          className="primary"
          type="submit"
          disabled={!recipes.length || !logRecipeId || !logDays.length}
        >
          Add to schedule
        </button>
      </form>
    </div>

    <div className="log-schedule">
      <h2>Weekly schedule</h2>
      <div
        className="log-schedule-grid"
        style={{ gridTemplateColumns: `140px repeat(${weekDays.length}, 1fr)` }}
      >
        <div className="log-schedule-corner" />
        {weekDays.map((day) => (
          <div key={day.value} className="log-schedule-day">
            <span>{day.label}</span>
          </div>
        ))}
        {mealOptions.map((meal) => (
          <Fragment key={meal.value}>
            <div className="log-schedule-meal">
              {meal.label}
            </div>
            {weekDays.map((day, index) => {
              const entries = weeklySchedule[index][meal.value];
              return (
                <div key={`${day.value}-${meal.value}`} className="log-schedule-cell">
                  {entries.length ? (
                    <ul>
                      {entries.map((entry) => (
                        <li key={entry.id}>
                          <strong>{entry.name}</strong>
                          {entry.note && <em>“{entry.note}”</em>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="empty">—</span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  </section>
);
