# Tic Tac Toe

## Deploy to GitHub Pages (GitHub Actions)

1. Create a GitHub repository and push this project.
2. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Merge or push to `main`/`master`. The **Deploy to GitHub Pages** workflow builds the site and publishes it.
4. Wait for the Pages URL to appear, then open it to test the game.

## Manual deploy (optional)

```bash
npm install
npm run deploy
```

## Supabase schema and migration

The app uses a normalized schema for shared cookbook data alongside the legacy
`public.catalogs` JSON backup table. The setup SQL in
`src/data/supabaseSetup.js` creates the following tables:

- `public.site_settings` for the shared access password hash.
- `public.catalogs` as the legacy JSON backup table (kept intact).
- `public.catalog_groups` for each shared group (code + name).
- `public.recipes`, `public.cookbooks`, `public.cuisines`, `public.logs` for
  normalized data tied to a `catalog_groups.id`.

The setup SQL is safe to re-run: it uses `create table if not exists` and
`on conflict` upserts, plus an idempotent migration that copies any existing
JSON blob data from `public.catalogs` into the normalized tables without
deleting the original rows. The application now reads/writes the normalized
tables, while the legacy `public.catalogs` table remains as a backup.

Last updated: 2025-12-28 11:42:57Z
