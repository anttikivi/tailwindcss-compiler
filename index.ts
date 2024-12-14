// Based on TailwindCSS.
// Copyright (c) Tailwind Labs, Inc.

import { compile as _compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import {
  Features,
  transform,
  type CustomAtRuleDefinition,
  type TransformOptions,
} from "lightningcss";
import fs from "node:fs/promises";
import path from "node:path";

type Previous = {
  css: string;
  optimizedCSS: string;
};

type NoInputTransformOptions = Omit<
  TransformOptions<{ [name: string]: CustomAtRuleDefinition }>,
  "filename" | "code"
>;

export type CompilerOptions = NoInputTransformOptions & {
  /**
   * Whether or not to run the Lightning CSS transformations. By default, the transforms are enabled.
   */
  disableTransforms?: boolean;
  /**
   * Whether or not to run Lightning CSS transforms twice like Tailwind does. By default, Lightning CSS transforms are run only once.
   */
  transformTwice?: boolean;
};

const defaultInput = String.raw`
@import "tailwindcss";
`;

const defaultOptions: CompilerOptions = {
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

function eprintln(value: string = "") {
  process.stderr.write(`${value}\n`);
}

async function handleError<T>(fn: () => T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error) {
      eprintln(err.toString());
    }
    process.exit(1);
  }
}

function optimizeCSS(
  input: string,
  options: CompilerOptions & { filename: string },
): string {
  const transformTwice = options.transformTwice;
  delete options.transformTwice;

  function optimize(code: Buffer | Uint8Array) {
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

async function handle(
  input: string,
  inputFile?: string,
  basePath?: string,
  options?: CompilerOptions,
): Promise<string> {
  const base = basePath || process.cwd();

  const inputCSS = input;

  const previous: Previous = {
    css: "",
    optimizedCSS: "",
  };

  const inputFilePath = inputFile ? path.resolve(inputFile) : null;
  const inputBasePath = inputFilePath
    ? path.dirname(inputFilePath)
    : process.cwd();

  const fullRebuildPaths: string[] = inputFilePath ? [inputFilePath] : [];

  const [compiler, scanner] = await handleError(async () => {
    const compiler = await _compile(inputCSS, {
      base: inputBasePath,
      onDependency(path) {
        fullRebuildPaths.push(path);
      },
    });

    const sources = (() => {
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

    const scanner = new Scanner({ sources });

    return [compiler, scanner] as const;
  });

  const candidates = scanner.scan();
  let output = await handleError(() => compiler.build(candidates));

  // Optimize the output
  if (!options || !options.disableTransforms) {
    if (output !== previous.css) {
      const { ...transformOptions } = options ? options : defaultOptions;
      delete transformOptions.disableTransforms;
      const optimizedCSS = optimizeCSS(output, {
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

/**
 * Compiles CSS with Tailwind and optionally transforms it using Lightning CSS.
 *
 * The function returns the compiled CSS code.
 */
export async function compile(
  /**
   * The CSS to compile.
   */
  input: string,
  /**
   * An optional base path for the Tailwind compiler. If it is not set, the current working directory will be used.
   */
  basePath?: string,
  /**
   * Option to pass to Lightning CSS.
   */
  options?: CompilerOptions,
) {
  return await handle(input || defaultInput, undefined, basePath, options);
}

/**
 * Compiles a CSS file with Tailwind and optionally transforms it using Lightning CSS.
 *
 * The function returns the compiled CSS code.
 */
export async function compileFile(
  /**
   * Path to the input file.
   */
  inputFile: string,
  /**
   * An optional base path for the Tailwind compiler. If it is not set, the current working directory will be used.
   */
  basePath?: string,
  /**
   * Option to pass to Lightning CSS.
   */
  options?: CompilerOptions,
) {
  return await handle(
    inputFile ? await fs.readFile(inputFile, "utf-8") : defaultInput,
    inputFile,
    basePath,
    options,
  );
}
