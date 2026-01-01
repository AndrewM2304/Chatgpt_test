const tabs = [
  { id: "catalog", label: "Catalog" },
  { id: "random", label: "Random" },
  { id: "log", label: "Log cook" },
  { id: "settings", label: "Settings" },
];

export const TabNav = ({ activeTab, onSelect }) => (
  <nav className="tabs" aria-label="Recipe navigation">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`tab${activeTab === tab.id ? " is-active" : ""}`}
        onClick={() => onSelect(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);
