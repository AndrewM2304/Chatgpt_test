import { formatDate, getCoverColor, getInitials } from "../utils/recipeUtils";
import { RecipeRating } from "./RecipeRating";

export const RandomView = ({
  cuisineOptions,
  durationOptions,
  selectedCuisine,
  selectedDuration,
  onCuisineChange,
  onDurationChange,
  onPickRandom,
  randomCandidates,
  randomPick,
  onStartLog,
  hasRecipes,
  cookbookCovers,
}) => {
  const isWebsite =
    randomPick?.sourceType === "website" ||
    (!randomPick?.sourceType && randomPick?.url);
  const sourceTitle = randomPick
    ? randomPick.cookbookTitle || (isWebsite ? "Website" : "No cookbook")
    : "";
  const coverUrl = sourceTitle ? cookbookCovers?.[sourceTitle] : "";

  return (
    <section className="random">
      <div className="random-controls">
        <h2>Random dinner picker</h2>
        <p>Filter by cuisine or timing, then pick a recipe at random.</p>
        <div className="random-filters">
          <div className="control">
            <label htmlFor="random-cuisine">Cuisine</label>
            <select
              id="random-cuisine"
              value={selectedCuisine}
              onChange={(event) => onCuisineChange(event.target.value)}
            >
              <option value="all">All cuisines</option>
              {cuisineOptions.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label htmlFor="random-duration">Timing</label>
            <select
              id="random-duration"
              value={selectedDuration}
              onChange={(event) => onDurationChange(event.target.value)}
            >
              <option value="all">Any time</option>
              {durationOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
          <p className="empty">No recipes match the filters. Try another pick.</p>
        )}
        {!hasRecipes && (
          <p className="empty">Add recipes to unlock the picker.</p>
        )}
      </div>

      {randomPick && (
        <div className="random-result">
          <p className="eyebrow">Tonight&apos;s pick</p>
          <div
            className={`recipe-cover${coverUrl ? " has-image" : ""}`}
            role="img"
            aria-label={`${sourceTitle} cover`}
            style={{
              backgroundColor: getCoverColor(sourceTitle),
              ...(coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}),
            }}
          >
            {!coverUrl && <span>{getInitials(sourceTitle)}</span>}
          </div>
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
          <RecipeRating
            value={randomPick.rating || 0}
            label="Recipe rating"
          />
          <div className="recipe-footer">
            <span>Last cooked: {formatDate(randomPick.lastCooked)}</span>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => onStartLog(randomPick.id)}
          >
            Schedule meal
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
