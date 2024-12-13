# Tailwind CSS Compiler

`@anttikivi/tailwindcss-compiler` is a compiler for
[Tailwind CSS](https://tailwindcss.com) v4 and up. The compiler wraps the
`@tailwindcss/node` package in a simple Node.js API and, thus, the compiler
should be used through this API. The compiler uses
[Lightning CSS](https://lightningcss.dev) to transform and optimize the CSS code
and allows you to pass custom options to Lightning CSS.

The primary motivation for this compiler is to be able to use Tailwind in
Node.js without [PostCSS](https://postcss.org) as an intermediary. Although
Tailwind itself now uses Lightning CSS to transform the CSS output, making
PostCSS unnecessary, I didn’t find a good way to use Tailwind in Node.js without
PostCSS.

In addition to that, neither Tailwind CLI nor Tailwind’s PostCSS plugin allow
passing custom options to Lightning CSS. This compiler uses the same options as
Tailwind by default but lets you to specify your own options to Lightning CSS.
It is possible to run Lightning CSS with custom options on the output of the
Tailwind-provided compilers but, as fast as Lightning CSS is, it is inefficient
to run it needlessly.
