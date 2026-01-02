import { NavLink, useLocation } from "react-router-dom";

import { NAV_TABS } from "./navTabs";

export const LandscapeHeaderNav = ({ onAddRecipe }) => {
  const location = useLocation();

  return (
    <div className="header-nav" role="navigation" aria-label="Primary">
      <div className="header-nav-inner">
        <nav className="header-tabs">
          {NAV_TABS.map(({ id, label, path, Icon }) => {
            const isCatalogRoute =
              id === "catalog" && location.pathname.startsWith("/recipe/");
            return (
              <NavLink
                key={id}
                to={path}
                className={({ isActive }) =>
                  `header-tab${isActive || isCatalogRoute ? " is-active" : ""}`
                }
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button type="button" className="primary header-add" onClick={onAddRecipe}>
          Add recipe
        </button>
      </div>
    </div>
  );
};
