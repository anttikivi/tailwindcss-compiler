import type { CustomAtRuleDefinition, TransformOptions } from "lightningcss";

export type NoInputTransformOptions = Omit<
  TransformOptions<{ [name: string]: CustomAtRuleDefinition }>,
  "filename" | "code"
>;

export type CompilerOptions = NoInputTransformOptions & {
  disableTransforms?: boolean;
};

export interface Previous {
  css: string;
  optimizedCSS: string;
}

/**
 * Compiles a CSS file with Tailwind and optionally transforms it using LightningCSS.
 *
 * The function returns the compiled CSS code.
 */
export declare function compileTailwind(
  /**
   * Path to the input file.
   */
  inputFile: string,
  /**
   * An optional base path for the Tailwind compiler. If it is not set, the current working directory will be used.
   */
  basePath?: string,
  /**
   * Option to pass to LightningCSS.
   */
  options?: CompilerOptions,
): Promise<string>;
