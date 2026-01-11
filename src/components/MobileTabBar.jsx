import { NavLink, useLocation } from "react-router-dom";

import { NAV_TABS } from "./navTabs";

export const MobileTabBar = () => {
  const location = useLocation();
  const mobileTabs = NAV_TABS.filter(({ id }) => id !== "settings");

  return (
    <nav className="mobile-tab-bar" aria-label="Primary">
      <div className="mobile-tab-bar-inner">
        {mobileTabs.map(({ id, label, path, Icon }) => {
          const isCatalogRoute =
            id === "catalog" &&
            (location.pathname === "/" ||
              location.pathname.startsWith("/recipe/"));
          return (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `mobile-tab${isActive || isCatalogRoute ? " is-active" : ""}`
              }
            >
              <Icon aria-hidden="true" />
              <span className="mobile-tab-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
