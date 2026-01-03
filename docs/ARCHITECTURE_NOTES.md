# Architecture & Refactoring Notes

This document summarizes the refactoring that separated UI state, catalog domain logic,
and Supabase persistence into distinct modules. It can be referenced for future prompts
and to locate the new abstractions quickly.

## Key Modules

- **UI state context**
  - `src/context/UIContext.jsx`
  - Centralizes modal visibility and toast state for the app.
  - Use `useUI()` to access modal setters and `addToast`.

- **Log modal reducer**
  - `src/hooks/useLogModalState.js`
  - Manages log modal fields with a reducer + helper actions.

- **Catalog domain helpers**
  - `src/lib/catalogDomain.js`
  - Functions for building `recipeById` and cookbook cover maps/targets.

- **Catalog persistence service**
  - `src/lib/catalogService.js`
  - Supabase-facing CRUD helpers used by hooks.

- **Catalog sync & group hooks**
  - `src/hooks/useCatalogSync.js`
  - `src/hooks/useGroupManagement.js`
  - `src/hooks/useCatalogGroups.js`
  - Keep `useSupabaseCatalog` focused on composing state and actions.

- **Utility helpers**
  - `src/utils/dateUtils.js`
  - `src/utils/cookbookUtils.js`

## App Wiring

- `src/main.jsx` now wraps the app with `UIProvider`.
- `src/App.jsx` consumes UI context and log reducer state, leaving domain logic
  to shared modules.
