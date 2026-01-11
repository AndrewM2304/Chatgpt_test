import { XMarkIcon } from "@heroicons/react/24/outline";

export const SettingsModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="modal-card settings-modal">
        <header className="modal-header">
          <div>
            <h2 id="settings-modal-title">Settings</h2>
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
        {children}
      </div>
    </div>
  );
};
