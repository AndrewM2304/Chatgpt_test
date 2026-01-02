import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".jsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const result = await transform(source, {
      loader: "jsx",
      format: "esm",
      sourcemap: "inline",
      jsx: "automatic",
    });
    return {
      format: "module",
      source: result.code,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
