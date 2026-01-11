export const FreezerView = ({
  storageByLocation,
  onOpenModal,
  onUpdatePortionsLeft,
}) => {
  const buildPortionOptions = (item) => {
    const values = new Set([item.portionsLeft]);
    for (let value = item.portions - 1; value >= 0; value -= 1) {
      values.add(value);
    }
    return Array.from(values).sort((a, b) => b - a);
  };

  const locations = Object.values(storageByLocation).sort((a, b) =>
    a.location.localeCompare(b.location)
  );
  const hasItems = locations.some((location) => location.items.length);

  return (
    <section className="freezer">
      <div className="freezer-header">
        <div>
          <h2>Storage</h2>
          <p className="freezer-caption">
            Track items in storage and update portions as they are used.
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

      {hasItems ? (
        <div className="freezer-groups">
          {locations.map((location) => (
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
                      <span>
                        {item.portionsLeft} of {item.portions} portions left
                      </span>
                      {item.notes ? <em>“{item.notes}”</em> : null}
                    </div>
                    <label className="freezer-portion-control">
                      Portions left
                      <select
                        value={item.portionsLeft}
                        onChange={(event) =>
                          onUpdatePortionsLeft(
                            item.id,
                            Number(event.target.value)
                          )
                        }
                      >
                        {buildPortionOptions(item).map((value) => (
                          <option key={value} value={value}>
                            {value === 0 ? "Remove" : value}
                          </option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="freezer-empty">
          <p>No storage items yet. Add one to get started.</p>
        </div>
      )}

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
