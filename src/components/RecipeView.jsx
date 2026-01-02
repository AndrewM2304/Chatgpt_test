import { RecipePreviewContent } from "./RecipePreviewContent";

export const RecipeView = ({
  activeRecipe,
  onBack,
  onStartLog,
  onEditRecipe,
  onDeleteRecipe,
  onRatingChange,
}) => {
  if (!activeRecipe) {
    return (
      <section className="recipe-view">
        <div className="recipe-view-empty">
          <p className="empty">That recipe is no longer available.</p>
          <button type="button" className="secondary" onClick={onBack}>
            Back to catalog
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="recipe-view">
      <div className="recipe-view-header">
        <button type="button" className="secondary" onClick={onBack}>
          Back to catalog
        </button>
      </div>
      <RecipePreviewContent
        recipe={activeRecipe}
        onStartLog={onStartLog}
        onEditRecipe={onEditRecipe}
        onDeleteRecipe={onDeleteRecipe}
        onRatingChange={onRatingChange}
      />
    </section>
  );
};
