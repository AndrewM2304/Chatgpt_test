import { XMarkIcon } from "@heroicons/react/24/outline";
import { TypeaheadInput } from "./TypeaheadInput";

export const FreezerModal = ({
  isOpen,
  name,
  portions,
  category,
  notes,
  categoryOptions,
  portionOptions,
  onNameChange,
  onPortionsChange,
  onCategoryChange,
  onNotesChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const isNameValid = Boolean(name.trim());
  const isCategoryValid = Boolean(category.trim());

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <h2 id="freezer-modal-title">Add a storage item</h2>
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
        <form onSubmit={onSubmit} className="modal-form">
          <label htmlFor="freezer-name">Item</label>
          <input
            id="freezer-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Pantry pasta"
            required
          />

          <TypeaheadInput
            id="freezer-category"
            label="Location"
            name="freezer-category"
            value={category}
            onChange={onCategoryChange}
            options={categoryOptions}
            placeholder="Freezer, pantry, cupboard"
            required
          />

          <label htmlFor="freezer-portions">Portions</label>
          <select
            id="freezer-portions"
            value={portions}
            onChange={(event) => onPortionsChange(event.target.value)}
          >
            {portionOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <label htmlFor="freezer-notes">Notes (optional)</label>
          <textarea
            id="freezer-notes"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
          />

          <div className="form-actions">
            <button
              className="primary"
              type="submit"
              disabled={!isNameValid || !isCategoryValid}
            >
              Save
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
