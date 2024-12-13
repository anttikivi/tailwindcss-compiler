import type { CustomAtRuleDefinition, TransformOptions } from "lightningcss";

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
   * Whether or not to run the Lightning CSS transformations.
   */
  disableTransforms?: boolean;
};

/**
 * Internal function that compiles CSS with Tailwind and optionally transforms it using Lightning CSS.
 *
 * The function returns the compiled CSS code.
 */
declare function handle(
  /**
   * The CSS to compile.
   */
  input: string,
  /**
   * Path to the input file, if any.
   */
  inputFile?: string,
  /**
   * An optional base path for the Tailwind compiler. If it is not set, the current working directory will be used.
   */
  basePath?: string,
  /**
   * Option to pass to Lightning CSS.
   */
  options?: CompilerOptions,
): Promise<string>;

/**
 * Compiles CSS with Tailwind and optionally transforms it using Lightning CSS.
 *
 * The function returns the compiled CSS code.
 */
export declare function compile(
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
): Promise<string>;

/**
 * Compiles a CSS file with Tailwind and optionally transforms it using Lightning CSS.
 *
 * The function returns the compiled CSS code.
 */
export declare function compileFile(
  /**
   * Path to the input file.
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
): Promise<string>;
