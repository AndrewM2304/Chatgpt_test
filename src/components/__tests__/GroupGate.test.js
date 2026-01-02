import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupGate } from "../GroupGate.jsx";

test("renders join and create actions", () => {
  const html = renderToStaticMarkup(
    React.createElement(GroupGate, {
      onJoinGroup: () => true,
      onCreateGroup: async () => "group-1234",
      statusMessage: "",
    })
  );

  assert.match(html, /Join a shared cookbook/);
  assert.match(html, /Join group/);
  assert.match(html, /Create new group/);
});
