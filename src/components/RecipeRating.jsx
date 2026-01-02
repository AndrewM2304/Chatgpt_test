import { StarRating } from "./StarRating";

export const RecipeRating = ({
  value = 0,
  onChange,
  label = "Recipe rating",
  isEditable = false,
}) => {
  return (
    <div className={`recipe-rating${isEditable ? "" : " is-static"}`}>
      <StarRating
        value={value}
        onChange={onChange}
        label={label}
        isEditable={isEditable}
      />
    </div>
  );
};
