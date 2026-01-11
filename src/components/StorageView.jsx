import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export const StorageView = ({
  storageByLocation,
  onOpenModal,
  onUpdatePortionsLeft,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const buildPortionOptions = (item) => {
    const values = new Set();
    if (item.portionsLeft > 0) {
      values.add(item.portionsLeft);
    }
    for (let value = item.portions; value > 0; value -= 1) {
      values.add(value);
    }
    return Array.from(values).sort((a, b) => b - a);
  };

  const locations = useMemo(
    () =>
      Object.values(storageByLocation).sort((a, b) =>
        a.location.localeCompare(b.location)
      ),
    [storageByLocation]
  );
  const totalItems = locations.reduce(
    (total, location) => total + location.itemCount,
    0
  );
  const itemCountLabel = totalItems === 1 ? "item" : "items";
  const activeItemsLabel = `Search ${totalItems} ${itemCountLabel}`;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLocations = locations
    .filter(
      (location) =>
        locationFilter === "all" || location.location === locationFilter
    )
    .map((location) => {
      const items = location.items.filter((item) => {
        if (!normalizedSearch) {
          return true;
        }
        const notesText = item.notes ? ` ${item.notes}` : "";
        return `${item.name}${notesText}`.toLowerCase().includes(normalizedSearch);
      });
      return {
        ...location,
        items,
        itemCount: items.length,
      };
    })
    .filter((location) => location.items.length > 0);
  const hasItems = totalItems > 0;
  const hasResults = filteredLocations.length > 0;

  return (
    <section className="freezer">
      <div className="freezer-header">
        <div>
          <h2>Storage</h2>
          <p className="freezer-caption">
            Track items in storage and remove them when they’re used up.
          </p>
        </div>
        <button
          type="button"
          className="primary log-inline-action"
          onClick={onOpenModal}
        >
          Add item
        </button>
      </div>

      <div className="catalog-toolbar freezer-toolbar">
        <div className="control">
          <label htmlFor="storage-search">{activeItemsLabel}</label>
          <div className="clearable-field">
            <input
              id="storage-search"
              type="search"
              placeholder="Search by item or note..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={searchTerm ? "has-clear" : ""}
            />
            {searchTerm && (
              <button
                type="button"
                className="typeahead-clear"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <XMarkIcon className="close-icon" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="control">
          <label htmlFor="storage-location">Location</label>
          <select
            id="storage-location"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            disabled={locations.length === 0}
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.location} value={location.location}>
                {location.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasItems && hasResults ? (
        <div className="freezer-groups">
          {filteredLocations.map((location) => (
            <section key={location.location} className="freezer-group">
              <div className="freezer-group-header">
                <h3>{location.location}</h3>
                <span>
                  {location.itemCount}{" "}
                  {location.itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <ul className="freezer-list">
                {location.items.map((item) => (
                  <li key={item.id}>
                    <div className="freezer-item-details">
                      <strong>{item.name}</strong>
                      {item.notes ? <em>“{item.notes}”</em> : null}
                    </div>
                    <div className="freezer-portion-control">
                      <select
                        aria-label="Portions left"
                        value={item.portionsLeft}
                        onChange={(event) => {
                          const { value } = event.target;
                          if (value === "remove") {
                            onUpdatePortionsLeft(item.id, 0);
                            return;
                          }
                          const parsedValue = Number(value);
                          if (!Number.isNaN(parsedValue)) {
                            onUpdatePortionsLeft(item.id, parsedValue);
                          }
                        }}
                      >
                        {buildPortionOptions(item).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                        <option value="remove">Remove</option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {!hasItems ? (
        <div className="freezer-empty">
          <p>No storage items yet. Add one to get started.</p>
        </div>
      ) : null}

      {hasItems && !hasResults ? (
        <div className="freezer-empty">
          <p>No storage items match your search.</p>
          {(searchTerm || locationFilter !== "all") && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      <div className="log-sticky-action freezer-sticky-action">
        <button
          type="button"
          className="primary log-sticky-button"
          onClick={onOpenModal}
        >
          Add item
        </button>
      </div>
    </section>
  );
};
