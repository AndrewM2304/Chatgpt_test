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
    label: "Schedule",
    description: "Plan breakfasts, lunches, and dinners for the week.",
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

  const handleAddRecipe = () => {
    onAddRecipe();
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
        className="tabs-toggle primary"
        aria-expanded={isOpen}
        aria-controls="tabs-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <span aria-hidden="true" className="tabs-toggle-close">
            ×
          </span>
        ) : (
          <span aria-hidden="true" className="tabs-toggle-icon">
            <span />
            <span />
            <span />
          </span>
        )}
      </button>
      <nav className="tabs" id="tabs-menu" aria-label="Recipe navigation">
        <span className="tabs-title">Cookbook</span>
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
        <button
          type="button"
          className="tab tab-action-item"
          onClick={handleAddRecipe}
        >
          <span className="tab-label">Add recipe</span>
        </button>
      </nav>
    </div>
  );
};
