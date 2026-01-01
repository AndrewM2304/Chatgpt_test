import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE ?? "/recipe-logger/";

export default defineConfig({
  base,
  plugins: [react()],
});
