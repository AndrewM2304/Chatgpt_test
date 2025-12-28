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

const extractRepoSlug = (repo) => {
  if (!repo) {
    return null;
  }

  if (/^[^/]+\/[^/]+$/.test(repo)) {
    return repo;
  }

  const normalizedRepo = repo.replace(/\/+$/, "");
  const match = normalizedRepo.match(
    /github\.com[:/](?<slug>[^/]+\/[^/]+)(?:\.git)?$/
  );
  return match?.groups?.slug ?? null;
};

const repoSlug =
  process.env.GITHUB_REPOSITORY ?? extractRepoSlug(process.env.GH_PAGES_REPO);

if (repoSlug) {
  const [owner, repoName] = repoSlug.split("/");
  const isUserSite = repoName === `${owner}.github.io`;
  const pagesUrl = isUserSite
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repoName}/`;
  console.log(`Deployed to GitHub Pages: ${pagesUrl}`);
}
