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
}) => {
  const isWebsite =
    randomPick?.sourceType === "website" ||
    (!randomPick?.sourceType && randomPick?.url);
  const sourceTitle = randomPick
    ? randomPick.cookbookTitle || (isWebsite ? "Website" : "No cookbook")
    : "";

  return (
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
          className="primary random-inline-action"
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
        {!hasRecipes && (
          <p className="empty">Add recipes to unlock the picker.</p>
        )}
      </div>

      {randomPick && (
        <div className="random-result">
          <p className="eyebrow">Tonight&apos;s pick</p>
          <h3>{randomPick.name}</h3>
          <p>
            {sourceTitle}
            {!isWebsite && randomPick.page ? ` · Page ${randomPick.page}` : ""}
          </p>
          {isWebsite && randomPick.url && (
            <p>
              <a href={randomPick.url} target="_blank" rel="noreferrer">
                {randomPick.url}
              </a>
            </p>
          )}
          <p className="recipe-meta">
            Cuisine: {randomPick.cuisine || "Uncategorized"}
          </p>
          <div className="recipe-footer">
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

      <div className="log-sticky-action random-sticky-action">
        <button
          type="button"
          className="primary log-sticky-button"
          onClick={onPickRandom}
          disabled={!randomCandidates.length}
        >
          Pick a random recipe
        </button>
      </div>
    </section>
  );
};
