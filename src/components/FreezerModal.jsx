import { XMarkIcon } from "@heroicons/react/24/outline";

export const FreezerModal = ({
  isOpen,
  name,
  portions,
  notes,
  portionOptions,
  onNameChange,
  onPortionsChange,
  onNotesChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <h2 id="freezer-modal-title">Add a freezer meal</h2>
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
          <label htmlFor="freezer-name">Meal</label>
          <input
            id="freezer-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Freezer lasagna"
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
            <button className="primary" type="submit" disabled={!name.trim()}>
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
