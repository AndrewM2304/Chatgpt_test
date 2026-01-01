import { formatDate } from "../utils/recipeUtils";

export const RandomView = ({
  cuisineOptions,
  excludedCuisines,
  onToggleCuisine,
  onPickRandom,
  randomCandidates,
  randomPick,
  onStartLog,
  hasRecipes,
}) => (
  <section className="random">
    <div className="random-controls">
      <h2>Random dinner picker</h2>
      <p>
        Toggle cuisines you want a break from, then pick a recipe at random.
      </p>
      <div className="chip-grid">
        {cuisineOptions.length ? (
          cuisineOptions.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`chip${
                excludedCuisines.includes(cuisine) ? " is-off" : ""
              }`}
              onClick={() => onToggleCuisine(cuisine)}
            >
              {cuisine}
            </button>
          ))
        ) : (
          <span className="empty">Add cuisines to start filtering.</span>
        )}
      </div>
      <button
        type="button"
        className="primary"
        onClick={onPickRandom}
        disabled={!randomCandidates.length}
      >
        Pick a random recipe
      </button>
      {!randomCandidates.length && hasRecipes && (
        <p className="empty">
          All recipes are filtered out. Turn a cuisine back on.
        </p>
      )}
      {!hasRecipes && <p className="empty">Add recipes to unlock the picker.</p>}
    </div>

    {randomPick && (
      <div className="random-result">
        <p className="eyebrow">Tonight&apos;s pick</p>
        <h3>{randomPick.name}</h3>
        <p>
          {randomPick.cookbookTitle || "No cookbook"}
          {randomPick.page ? ` · Page ${randomPick.page}` : ""}
        </p>
        <p className="recipe-meta">
          Cuisine: {randomPick.cuisine || "Uncategorized"}
        </p>
        <div className="recipe-footer">
          <span>{randomPick.timesCooked} cooks logged</span>
          <span>Last cooked: {formatDate(randomPick.lastCooked)}</span>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => onStartLog(randomPick.id)}
        >
          Log this cook
        </button>
      </div>
    )}
  </section>
);
