export const LogView = ({
  recipes,
  logRecipeId,
  onLogRecipeId,
  logDate,
  onLogDate,
  logNote,
  onLogNote,
  onSubmit,
  recentLogs,
}) => (
  <section className="log">
    <div className="log-form">
      <h2>Log a cook</h2>
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

        <label htmlFor="cook-date">Date cooked</label>
        <input
          id="cook-date"
          type="date"
          value={logDate}
          onChange={(event) => onLogDate(event.target.value)}
        />

        <label htmlFor="cook-note">Notes (optional)</label>
        <input
          id="cook-note"
          type="text"
          placeholder="Added extra basil"
          value={logNote}
          onChange={(event) => onLogNote(event.target.value)}
        />

        <button className="primary" type="submit" disabled={!recipes.length}>
          Save log
        </button>
      </form>
    </div>

    <div className="log-history">
      <h2>Recent cooking</h2>
      {recentLogs.length ? (
        <ul>
          {recentLogs.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.name}</strong>
                <span>
                  {entry.cuisine || "Uncategorized"} · {entry.cookbookTitle || "No cookbook"}
                </span>
                {entry.note && <em>“{entry.note}”</em>}
              </div>
              <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No cooking logs yet.</p>
      )}
    </div>
  </section>
);
