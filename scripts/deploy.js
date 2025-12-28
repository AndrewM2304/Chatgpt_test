import { execSync } from "node:child_process";

const run = (command) => {
  execSync(command, { stdio: "inherit", env: process.env });
};

run("npm run build");

const repo = process.env.GH_PAGES_REPO;
const ghPagesCommand = repo
  ? `npx --no-install gh-pages -d dist -r "${repo}"`
  : "npx --no-install gh-pages -d dist";

run(ghPagesCommand);

const repoSlug =
  process.env.GITHUB_REPOSITORY ??
  process.env.GH_PAGES_REPO?.match(/github\.com\/([^/]+\/[^/]+)\.git$/)?.[1];

if (repoSlug) {
  const [owner, repoName] = repoSlug.split("/");
  const isUserSite = repoName === `${owner}.github.io`;
  const pagesUrl = isUserSite
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repoName}/`;
  console.log(`Deployed to GitHub Pages: ${pagesUrl}`);
}
