import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { renderHook } from "../../test/renderHook.js";
import { useSupabaseCatalog } from "../useSupabaseCatalog.js";

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
    location: {
      search: "",
      href: "http://localhost/",
    },
    history: {
      replaceState: () => {},
    },
  };
});

test("initializes with a blank group code and connecting status", () => {
  const result = renderHook(() => useSupabaseCatalog());

  assert.equal(result.groupCode, "");
  assert.equal(result.inviteUrl, "");
  assert.equal(result.status.state, "connecting");
});
