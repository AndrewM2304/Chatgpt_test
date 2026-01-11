import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

export const Hero = () => (
  <header className="hero">
    <div className="hero-title-row">
      <h1>Cookbook</h1>
      <NavLink
        to="/settings"
        className="hero-settings-button"
        aria-label="Settings"
      >
        <Cog6ToothIcon aria-hidden="true" />
      </NavLink>
    </div>
  </header>
);
