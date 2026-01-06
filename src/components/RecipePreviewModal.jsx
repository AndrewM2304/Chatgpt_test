import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  RecipePreviewActions,
  RecipePreviewContent,
} from "./RecipePreviewContent";

export const RecipePreviewModal = ({
  isOpen,
  recipe,
  onClose,
  onStartLog,
  onEditRecipe,
  onDeleteRecipe,
  onRatingChange,
  cookbookCovers,
}) => {
  if (!isOpen || !recipe) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-preview-title"
    >
      <div className="modal-card recipe-preview-modal">
        <header className="modal-header">
          <div>
            <h2 id="recipe-preview-title">{recipe.name}</h2>
          </div>
          <button
            type="button"
            className="secondary icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="close-icon" aria-hidden="true" />
          </button>
        </header>
        <div className="recipe-preview-body">
          <RecipePreviewContent
            recipe={recipe}
            onStartLog={onStartLog}
            onEditRecipe={onEditRecipe}
            onDeleteRecipe={onDeleteRecipe}
            onRatingChange={onRatingChange}
            showTitle={false}
            showActions={false}
            cookbookCovers={cookbookCovers}
          />
        </div>
        <RecipePreviewActions
          recipe={recipe}
          onStartLog={onStartLog}
          onEditRecipe={onEditRecipe}
          onDeleteRecipe={onDeleteRecipe}
        />
      </div>
    </div>
  );
};
