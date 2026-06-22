import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist-scripts/**",
    "encuestas_anterior/**",
  ]),
  {
    // React Compiler / react-hooks v6 correctness rules, enforced as errors.
    // Effects that legitimately set state (SSR mount guards, async bootstrap,
    // external store sync) carry an inline eslint-disable with a specific reason.
    rules: {
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/refs": "error",
      "react-hooks/preserve-manual-memoization": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/incompatible-library": "error",
    },
  },
  {
    // Accessibility rules (see AGENTS.md "Accessibility"). eslint-config-next only
    // enables the valid-ARIA subset; these add the interactive-element checks that
    // catch missing keyboard handlers on click targets. label-has-associated-control
    // is deliberately omitted: it can't see i18n-dynamic label text or a wrapper
    // primitive's consumer-supplied control, so it only false-positives here.
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
    },
  },
  {
    // Full-strict: promote the remaining advisory rules from eslint-config-next to
    // errors. Combined with `--max-warnings 0` in the lint script, the lint gate
    // fails on any problem.
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@next/next/no-img-element": "error",
      "import/no-anonymous-default-export": "error",
    },
  },
]);

export default eslintConfig;
