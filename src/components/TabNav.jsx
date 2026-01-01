import { useState } from "react";

const tabs = [
  { id: "catalog", label: "Catalog" },
  { id: "random", label: "Random" },
  { id: "log", label: "Log cook" },
  { id: "settings", label: "Settings" },
];

export const TabNav = ({ activeTab, onSelect }) => {
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
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="tabs-toggle-label">Menu</span>
        <span aria-hidden="true" className="tabs-toggle-icon">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav className="tabs" id="tabs-menu" aria-label="Recipe navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => handleSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
