import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export const TypeaheadInput = ({
  id,
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  hasError = false,
  required = false,
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
      <div className="typeahead-field">
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
          required={required}
          className={`${value ? "has-clear" : ""}${hasError ? " input-error" : ""}`}
        />
        {value && (
          <button
            type="button"
            className="typeahead-clear"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            <XMarkIcon className="close-icon" aria-hidden="true" />
          </button>
        )}
      </div>
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
