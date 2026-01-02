import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const renderHook = (callback) => {
  let hookResult;
  const HookWrapper = () => {
    hookResult = callback();
    return null;
  };

  renderToStaticMarkup(React.createElement(HookWrapper));
  return hookResult;
};
