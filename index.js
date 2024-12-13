// Based on TailwindCSS.
// Copyright (c) Tailwind Labs, Inc.

import { compile as _compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { Features, transform } from "lightningcss";
import fs from "node:fs/promises";
import path from "node:path";

const defaultInput = String.raw`
@import "tailwindcss";
`;

/** @type {import("./index.d.ts").CompilerOptions} */
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
  exclude: Features.LogicalProperties | Features.DirSelector,
  targets: {
    safari: (16 << 16) | (4 << 8),
    ios_saf: (16 << 16) | (4 << 8),
    firefox: 128 << 16,
    chrome: 111 << 16,
  },
  errorRecovery: true,
};

/**
 * @param {string} value
 */
function eprintln(value = "") {
  process.stderr.write(`${value}\n`);
}

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
 * @param {import("./index.d.ts").CompilerOptions & { filename: string }} options
 *
 * @returns {string} The optimized CSS.
 */
function optimizeCSS(input, options) {
  const transformTwice = options.transformTwice;
  delete options.transformTwice;

  /**
   * @param {Buffer | Uint8Array} code
   */
  function optimize(code) {
    return transform({
      code,
      ...options,
    }).code;
  }

  if (transformTwice) {
    // Running Lightning CSS twice to ensure that adjacent rules are merged after
    // nesting is applied. This creates a more optimized output.
    return optimize(optimize(Buffer.from(input))).toString();
  }

  return optimize(Buffer.from(input)).toString();
}

/** @type {import("./index.d.ts").handle} */
async function handle(input, inputFile, basePath, options) {
  let base = basePath || process.cwd();

  let inputCSS = input;

  /** @type {import("./index.d.ts").Previous} */
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
    /** @type {() => [ReturnType<typeof _compile>, Scanner] as const} */ async () => {
      let compiler = await _compile(inputCSS, {
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
      let optimizedCSS = optimizeCSS(output, {
        filename: inputFile ?? "input.css",
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

/** @type {import("./index.d.ts").compile} */
export async function compile(input, basePath, options) {
  return await handle(input || defaultInput, null, basePath, options);
}

/** @type {import("./index.d.ts").compileFile} */
export async function compileFile(inputFile, basePath, options) {
  return await handle(
    inputFile ? await fs.readFile(inputFile, "utf-8") : defaultInput,
    inputFile,
    basePath,
    options,
  );
}
