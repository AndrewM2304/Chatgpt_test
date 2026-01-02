import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  {
    id: "catalog",
    label: "Catalog",
    description: "Browse and search your recipes.",
    path: "/catalog",
  },
  {
    id: "random",
    label: "Random",
    description: "Pick a surprise dinner idea.",
    path: "/random",
  },
  {
    id: "log",
    label: "Schedule",
    description: "Plan breakfasts, lunches, and dinners for the week.",
    path: "/log",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Sync, backup, and share your catalog.",
    path: "/settings",
  },
];

export const TabNav = ({ onAddRecipe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
        className="tabs-toggle ghost icon-button"
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
        {tabs.map((tab) => {
          const isCatalogRoute =
            tab.id === "catalog" &&
            location.pathname.startsWith("/recipe/");
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `tab${isActive || isCatalogRoute ? " is-active" : ""}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </NavLink>
          );
        })}
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
