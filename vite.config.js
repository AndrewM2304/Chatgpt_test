import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const defaultBase = repoName ? `/${repoName}/` : "/";
const base = process.env.VITE_BASE ?? defaultBase;

export default defineConfig({
  base,
  plugins: [react()],
});
