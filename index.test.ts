import { expect, test } from "vitest";
import { compile } from ".";

test("compiles CSS", async () => {
  expect(
    await compile(
      String.raw`
@import "tailwindcss";
`,
    ),
  ).not.toBeFalsy();
});
