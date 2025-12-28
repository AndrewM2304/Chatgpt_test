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
