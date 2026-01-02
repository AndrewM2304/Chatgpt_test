import { RecipePreviewContent } from "./RecipePreviewContent";

export const RecipeView = ({
  activeRecipe,
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
        </div>
      </section>
    );
  }

  return (
    <section className="recipe-view">
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
