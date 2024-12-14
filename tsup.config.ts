import { defineConfig } from "tsup";

export default defineConfig([
  {
    format: ["esm"],
    minify: true,
    cjsInterop: true,
    dts: true,
    entry: ["index.ts"],
  },
  {
    format: ["cjs"],
    minify: true,
    cjsInterop: true,
    dts: true,
    entry: ["index.ts"],
  },
]);
