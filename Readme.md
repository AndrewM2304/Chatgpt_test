# Tic Tac Toe

## Deploy to GitHub Pages (GitHub Actions)

1. Create a GitHub repository and push this project.
2. In GitHub, open **Settings → Pages** and set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `gh-pages` / `/ (root)`
3. Merge or push to `main`/`master`. The **Deploy to GitHub Pages** workflow runs `npm run deploy` and publishes the site.
4. Wait for the Pages URL to appear, then open it to test the game.

The workflow uses `GH_PAGES_REPO` to pass a token-authenticated repo URL to
`gh-pages`, so it can publish without prompting for credentials.

## Manual deploy (optional)

```bash
npm install
npm run deploy
```

Last updated: 2025-12-28 11:42:57Z
