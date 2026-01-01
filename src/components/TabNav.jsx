import { useState } from "react";

const tabs = [
  {
    id: "catalog",
    label: "Catalog",
    description: "Browse and search your recipes.",
  },
  {
    id: "random",
    label: "Random",
    description: "Pick a surprise dinner idea.",
  },
  {
    id: "log",
    label: "Log cook",
    description: "Track what you cooked recently.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Sync, backup, and share your catalog.",
  },
];

export const TabNav = ({ activeTab, onSelect, onAddRecipe }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (tabId) => {
    onSelect(tabId);
    setIsOpen(false);
  };

  return (
    <div className={`tabs-shell${isOpen ? " is-open" : ""}`}>
      {isOpen && (
        <button
          type="button"
          className="tabs-backdrop"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        type="button"
        className="tabs-toggle"
        aria-expanded={isOpen}
        aria-controls="tabs-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span aria-hidden="true" className="tabs-toggle-icon">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav className="tabs" id="tabs-menu" aria-label="Recipe navigation">
        <button
          type="button"
          className="tab tab-action-item"
          onClick={onAddRecipe}
        >
          <span className="tab-label">Add recipe</span>
          <span className="tab-description">Create a new recipe entry.</span>
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => handleSelect(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-description">{tab.description}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
