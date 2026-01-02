import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { renderHook } from "../../test/renderHook.js";
import { useLocalStorage } from "../useLocalStorage.js";

const createStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
};

beforeEach(() => {
  globalThis.window = {
    localStorage: createStorage(),
  };
});

test("reads existing localStorage values", () => {
  window.localStorage.setItem("stored-key", JSON.stringify("stored"));
  const [value] = renderHook(() =>
    useLocalStorage("stored-key", "default")
  );
  assert.equal(value, "stored");
});

test("falls back to the initial value when parsing fails", () => {
  window.localStorage.setItem("stored-key", "{not-json}");
  const originalError = console.error;
  console.error = () => {};
  let value;
  try {
    [value] = renderHook(() =>
      useLocalStorage("stored-key", "default")
    );
  } finally {
    console.error = originalError;
  }
  assert.equal(value, "default");
});
