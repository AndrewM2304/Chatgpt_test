# Cookbook

Cookbook is a React + Vite meal planning app for managing recipes, weekly logs, and freezer inventory with optional shared sync through Supabase group spaces.

## Features

- Recipe catalog with cookbook and cuisine organization.
- Weekly meal log workflow with modal-driven entry and editing.
- Freezer/storage tracking by location/category.
- Random recipe selection view.
- Group-based shared catalog syncing backed by Supabase.
- Local-first behavior with sync status, pending changes, and diagnostics tools.

## Tech stack

- React 18
- React Router 6
- Vite 5
- Heroicons
- Supabase (for shared persistence)

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Available scripts

- `npm run dev` — start Vite development server.
- `npm run build` — produce a production build.
- `npm run preview` — preview the built app.
- `npm test` — run node-based test suite.
- `npm run deploy` — deploy using `scripts/deploy.js`.

## Deployment

### GitHub Pages (GitHub Actions)

1. Push this project to a GitHub repository.
2. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push/merge to your default branch (`main`/`master`) to trigger deploy.
4. Open the published Pages URL when the workflow finishes.

### Manual deploy (optional)

```bash
npm install
npm run deploy
```

## Supabase schema and migration

The app uses a normalized schema for shared catalog data while keeping the legacy
`public.catalogs` JSON backup table. The setup SQL in `src/data/supabaseSetup.js`
creates these tables:

- `public.site_settings` for shared access password hash.
- `public.catalogs` as legacy JSON backup table.
- `public.catalog_groups` for shared group code + name.
- `public.recipes`, `public.cookbooks`, `public.cuisines`, `public.logs` for
  normalized data tied to `catalog_groups.id`.

The SQL is idempotent and includes migration logic to copy existing JSON data
from `public.catalogs` to normalized tables without deleting existing backup rows.

## Project structure (high level)

- `src/App.jsx` — top-level app wiring and route shell.
- `src/routes/*` — route-level containers (catalog, log, random, storage, settings).
- `src/components/*` — reusable UI components and modals.
- `src/hooks/*` — app state + sync hooks.
- `src/lib/*` — Supabase and catalog domain services.
- `docs/ARCHITECTURE_NOTES.md` — refactoring and module notes.
