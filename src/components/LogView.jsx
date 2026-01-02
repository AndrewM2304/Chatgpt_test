import { Fragment } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

export const LogView = ({
  logWeekDate,
  onLogWeekDate,
  weekDays,
  weeklySchedule,
  mealOptions,
  onOpenLogModal,
}) => (
  <section className="log">
    <div className="log-schedule">
      <div className="log-schedule-header">
        <div>
          <h2>Weekly schedule</h2>
          <p className="log-schedule-caption">
            Tap a scheduled meal to edit it or view the recipe when available.
          </p>
        </div>
        <div className="log-week-controls">
          <label className="log-week-picker" htmlFor="week-of">
            Week of
            <input
              id="week-of"
              type="date"
              value={logWeekDate}
              onChange={(event) => onLogWeekDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary log-inline-action"
            onClick={() => onOpenLogModal()}
          >
            Schedule a meal
          </button>
        </div>
      </div>
      <div
        className="log-schedule-grid"
        style={{
          gridTemplateColumns: `minmax(64px, 80px) repeat(${mealOptions.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="log-schedule-corner">Date</div>
        {mealOptions.map((meal) => (
          <div key={meal.value} className="log-schedule-meal">
            {meal.label}
          </div>
        ))}
        {weekDays.map((day, index) => (
          <Fragment key={day.value}>
            <div className="log-schedule-day">
              <span className="log-day-name">
                {day.date.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
            </div>
            {mealOptions.map((meal) => {
              const entries = weeklySchedule[index][meal.value];
              return (
                <div key={`${day.value}-${meal.value}`} className="log-schedule-cell">
                  {entries.length ? (
                    <ul>
                      {entries.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            className="log-entry-button"
                            onClick={() => onOpenLogModal({ entry })}
                          >
                            <strong>{entry.name}</strong>
                            {entry.note && <em>“{entry.note}”</em>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <button
                      type="button"
                      className="log-entry-button log-empty-button"
                      onClick={() =>
                        onOpenLogModal({ date: day.value, meal: meal.value })
                      }
                      aria-label={`Schedule ${meal.label.toLowerCase()} on ${day.label}`}
                    >
                      <PlusCircleIcon className="log-empty-icon" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>

    <div className="log-sticky-action">
      <button
        type="button"
        className="primary log-sticky-button"
        onClick={() => onOpenLogModal()}
      >
        Schedule a meal
      </button>
    </div>
  </section>
);
