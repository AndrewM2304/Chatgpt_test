import { useCallback, useReducer } from "react";
import { toDateInputValue } from "../utils/dateUtils.js";

const getBlankState = (weekDate) => ({
  logRecipeId: "",
  logRecipeQuery: "",
  logWeekDate: weekDate,
  logSelectedDays: [weekDate],
  logSelectedMeals: ["dinner"],
  logNote: "",
  editingLogId: null,
  shouldNavigateAfterLog: false,
});

const reducer = (state, action) => {
  switch (action.type) {
    case "set-week-date":
      return {
        ...state,
        logWeekDate: action.value,
      };
    case "set-recipe-id":
      return {
        ...state,
        logRecipeId: action.value,
      };
    case "set-recipe-query":
      return {
        ...state,
        logRecipeQuery: action.value,
      };
    case "set-selected-days":
      return {
        ...state,
        logSelectedDays: action.value,
      };
    case "set-selected-meals":
      return {
        ...state,
        logSelectedMeals: action.value,
      };
    case "set-note":
      return {
        ...state,
        logNote: action.value,
      };
    case "set-editing-log":
      return {
        ...state,
        editingLogId: action.value,
      };
    case "set-should-navigate":
      return {
        ...state,
        shouldNavigateAfterLog: action.value,
      };
    case "toggle-day":
      return {
        ...state,
        logSelectedDays: state.logSelectedDays.includes(action.value)
          ? state.logSelectedDays.filter((day) => day !== action.value)
          : [...state.logSelectedDays, action.value],
      };
    case "toggle-meal":
      return {
        ...state,
        logSelectedMeals: state.logSelectedMeals.includes(action.value)
          ? state.logSelectedMeals.filter((meal) => meal !== action.value)
          : [...state.logSelectedMeals, action.value],
      };
    case "open-start": {
      const weekDate = action.weekDate;
      return {
        ...getBlankState(weekDate),
        logRecipeId: action.recipeId || "",
        logRecipeQuery: action.recipeQuery || "",
        shouldNavigateAfterLog: action.shouldNavigateAfterLog,
      };
    }
    case "open-entry": {
      if (action.entry) {
        return {
          ...state,
          editingLogId: action.entry.id,
          logRecipeId: action.entry.recipeId || "",
          logRecipeQuery: action.entry.name || "",
          logSelectedDays: [action.entry.date],
          logSelectedMeals: [action.entry.meal || "dinner"],
          logNote: action.entry.note || "",
          shouldNavigateAfterLog: false,
        };
      }
      return {
        ...state,
        editingLogId: null,
        logRecipeId: "",
        logRecipeQuery: "",
        logNote: "",
        logSelectedDays: [action.date || state.logWeekDate],
        logSelectedMeals: [action.meal || "dinner"],
        shouldNavigateAfterLog: false,
      };
    }
    case "reset-close":
      return {
        ...getBlankState(action.weekDate),
      };
    case "after-submit":
      return {
        ...getBlankState(action.weekDate),
      };
    default:
      return state;
  }
};

export const useLogModalState = () => {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const today = toDateInputValue(new Date());
    return getBlankState(today);
  });

  const setLogWeekDate = useCallback(
    (value) => dispatch({ type: "set-week-date", value }),
    []
  );
  const setLogRecipeId = useCallback(
    (value) => dispatch({ type: "set-recipe-id", value }),
    []
  );
  const setLogRecipeQuery = useCallback(
    (value) => dispatch({ type: "set-recipe-query", value }),
    []
  );
  const setLogSelectedDays = useCallback(
    (value) => dispatch({ type: "set-selected-days", value }),
    []
  );
  const setLogSelectedMeals = useCallback(
    (value) => dispatch({ type: "set-selected-meals", value }),
    []
  );
  const setLogNote = useCallback(
    (value) => dispatch({ type: "set-note", value }),
    []
  );
  const setEditingLogId = useCallback(
    (value) => dispatch({ type: "set-editing-log", value }),
    []
  );
  const setShouldNavigateAfterLog = useCallback(
    (value) => dispatch({ type: "set-should-navigate", value }),
    []
  );
  const toggleLogDay = useCallback(
    (value) => dispatch({ type: "toggle-day", value }),
    []
  );
  const toggleLogMeal = useCallback(
    (value) => dispatch({ type: "toggle-meal", value }),
    []
  );
  const openForStart = useCallback(
    ({ recipeId, recipeQuery, weekDate, shouldNavigateAfterLog }) =>
      dispatch({
        type: "open-start",
        recipeId,
        recipeQuery,
        weekDate,
        shouldNavigateAfterLog,
      }),
    []
  );
  const openForEntry = useCallback(
    ({ entry, date, meal }) =>
      dispatch({ type: "open-entry", entry, date, meal }),
    []
  );
  const resetForClose = useCallback(
    (weekDate) => dispatch({ type: "reset-close", weekDate }),
    []
  );
  const resetAfterSubmit = useCallback(
    (weekDate) => dispatch({ type: "after-submit", weekDate }),
    []
  );

  return {
    state,
    setLogWeekDate,
    setLogRecipeId,
    setLogRecipeQuery,
    setLogSelectedDays,
    setLogSelectedMeals,
    setLogNote,
    setEditingLogId,
    setShouldNavigateAfterLog,
    toggleLogDay,
    toggleLogMeal,
    openForStart,
    openForEntry,
    resetForClose,
    resetAfterSubmit,
  };
};
