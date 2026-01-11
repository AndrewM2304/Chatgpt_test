export const FreezerView = ({ items, onOpenModal, onUpdatePortionsLeft }) => {
  const buildPortionOptions = (item) => {
    const values = new Set([item.portionsLeft]);
    for (let value = item.portions - 1; value >= 0; value -= 1) {
      values.add(value);
    }
    return Array.from(values).sort((a, b) => b - a);
  };

  return (
    <section className="freezer">
      <div className="freezer-header">
        <div>
          <h2>Freezer meals</h2>
          <p className="freezer-caption">
            Track what is in the freezer and update portions as meals are used.
          </p>
        </div>
        <button
          type="button"
          className="primary log-inline-action"
          onClick={onOpenModal}
        >
          Add freezer meal
        </button>
      </div>

      {items.length ? (
        <ul className="freezer-list">
          {items.map((item) => (
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
                    onUpdatePortionsLeft(item.id, Number(event.target.value))
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
      ) : (
        <div className="freezer-empty">
          <p>No freezer meals yet. Add one to get started.</p>
        </div>
      )}

      <div className="log-sticky-action freezer-sticky-action">
        <button
          type="button"
          className="primary log-sticky-button"
          onClick={onOpenModal}
        >
          Add freezer meal
        </button>
      </div>
    </section>
  );
};
