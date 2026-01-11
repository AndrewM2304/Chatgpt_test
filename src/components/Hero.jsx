import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export const Hero = ({ onOpenSettings }) => (
  <header className="hero">
    <div className="hero-title-row">
      <h1>Cookbook</h1>
      <button
        type="button"
        className="hero-settings-button"
        aria-label="Settings"
        onClick={onOpenSettings}
      >
        <Cog6ToothIcon aria-hidden="true" />
      </button>
    </div>
  </header>
);
