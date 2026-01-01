export const StarRating = ({
  value = 0,
  onChange,
  label = "Rating",
  isEditable = false,
}) => {
  const ratingValue = Number(value) || 0;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`star-rating${isEditable ? " is-editable" : ""}`}
      role={isEditable ? "radiogroup" : undefined}
      aria-label={label}
    >
      {stars.map((star) => {
        const isFilled = star <= ratingValue;
        if (!isEditable) {
          return (
            <span
              key={star}
              className={`star${isFilled ? " is-filled" : ""}`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            className={`star-button${isFilled ? " is-filled" : ""}`}
            aria-pressed={isFilled}
            onClick={() => {
              const nextValue = star === ratingValue ? "" : String(star);
              onChange?.(nextValue);
            }}
          >
            ★
            <span className="sr-only">{star} star rating</span>
          </button>
        );
      })}
    </div>
  );
};
