// Based on TailwindCSS.
// Copyright (c) Tailwind Labs, Inc.

import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { Features, transform } from "lightningcss";
import fs from "node:fs/promises";
import path from "node:path";
import { eprintln } from "./renderer.js";

/**
 * @typedef {Omit<import("lightningcss").TransformOptions, "filename" | "code">} NoInputTransformOptions
 */

/**
 * @typedef {NoInputTransformOptions & { disableTransforms: boolean? }} CompilerOptions
 */

/**
 * @typedef {object} Previous
 * @property {string} css
 * @property {string} optimizedCSS
 */

/** @type {NoInputTransformOptions} */
const defaultOptions = {
  minify: false,
  sourceMap: false,
  drafts: {
    customMedia: true,
  },
  nonStandard: {
    deepSelectorCombinator: true,
  },
  include: Features.Nesting,
  exclude: Features.LogicalProperties,
  targets: {
    safari: (16 << 16) | (4 << 8),
    ios_saf: (16 << 16) | (4 << 8),
    firefox: 128 << 16,
    chrome: 120 << 16,
  },
  errorRecovery: true,
};

/**
 * @template T
 * @param {() => T} fn
 *
 * @returns {Promise<T>}
 */
async function handleError(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error) {
      eprintln(err.toString());
    }
    process.exit(1);
  }
}

/**
 * @param {string} input
 * @param {Omit<import("lightningcss").TransformOptions, "code">} options
 *
 * @returns {Promise<string>} The optimized CSS.
 */
async function optimizeCSS(input, options) {
  /**
   * @param {Buffer | Uint8Array} code
   */
  function optimize(code) {
    return transform({
      code,
      ...options,
    }).code;
  }

  // Running Lightning CSS twice to ensure that adjacent rules are merged after
  // nesting is applied. This creates a more optimized output.
  return optimize(optimize(Buffer.from(input))).toString();
}

/**
 * Compiles a CSS file with Tailwind and optionally transforms it using LightningCSS.
 *
 * @param {string} inputFile Path to the input file.
 * @param {string | undefined} basePath An optional base path for the Tailwind compiler. If it is not set, the current working directory will be used.
 * @param {?CompilerOptions} options Option to pass to LightningCSS.
 *
 * @returns {Promise<string>} The compiled CSS code.
 */
export default async function compileTailwind(inputFile, basePath, options) {
  let base = basePath || process.cwd();

  let inputCSS = inputFile
    ? await fs.readFile(inputFile, "utf-8")
    : String.raw`
        @import "tailwindcss";
      `;

  /** @type {Previous} */
  let previous = {
    css: "",
    optimizedCSS: "",
  };

  let inputFilePath = inputFile ? path.resolve(inputFile) : null;
  let inputBasePath = inputFilePath
    ? path.dirname(inputFilePath)
    : process.cwd();

  /** @type {string[]} */
  let fullRebuildPaths = inputFilePath ? [inputFilePath] : [];

  let [compiler, scanner] = await handleError(
    /** @type {() => [ReturnType<typeof compile>, Scanner] as const} */ async () => {
      let compiler = await compile(inputCSS, {
        base: inputBasePath,
        onDependency(path) {
          fullRebuildPaths.push(path);
        },
      });

      let sources = (() => {
        // Disable auto source detection
        if (compiler.root === "none") {
          return [];
        }

        // No root specified, use the base directory
        if (compiler.root === null) {
          return [{ base, pattern: "**/*" }];
        }

        // Use the specified root
        return [compiler.root];
      })().concat(compiler.globs);

      let scanner = new Scanner({ sources });

      return /** @type {const} */ [compiler, scanner];
    },
  );

  let candidates = scanner.scan();
  let output = await handleError(() => compiler.build(candidates));

  // Optimize the output
  if (!options || !options.disableTransforms) {
    if (output !== previous.css) {
      const { ...transformOptions } = options ? options : defaultOptions;
      delete transformOptions.disableTransforms;
      let optimizedCSS = await optimizeCSS(output, {
        file: inputFile ?? "input.css",
        ...transformOptions,
      });
      previous.css = output;
      previous.optimizedCSS = optimizedCSS;
      output = optimizedCSS;
    } else {
      output = previous.optimizedCSS;
    }
  }

  return output;
}