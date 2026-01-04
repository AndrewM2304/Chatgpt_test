import { useMemo, useState } from "react";

export const TypeaheadInput = ({
  id,
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) =>
      option.toLowerCase().includes(term)
    );
  }, [options, value]);

  const listId = `${id}-listbox`;
  const shouldShowList = isOpen && filteredOptions.length > 0;

  const handleInputChange = (event) => {
    onChange(event.target.value);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="control typeahead">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldShowList}
        aria-controls={listId}
        className={hasError ? "input-error" : ""}
      />
      {shouldShowList && (
        <ul className="typeahead-list" role="listbox" id={listId}>
          {filteredOptions.map((option) => (
            <li key={option} role="option">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
