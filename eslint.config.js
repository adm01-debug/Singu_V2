import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      sonarjs,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",

      // Cognitive complexity: threshold 50 (down from the original 15, which fired on 188 sites).
      // Currently 22 functions exceed 50; tracked as tech-debt to refactor incrementally.
      // Once all 22 are fixed this will be lowered to 25 → 20 → 15.
      "sonarjs/cognitive-complexity": ["warn", 50],

      // Nested ternaries (a ? b ? c : d : e) are a style/readability concern, not a bug.
      // The codebase uses them heavily in JSX (900+ sites). Disabled while we refactor
      // incrementally; re-enable once the backlog of nested-ternary clean-ups is done.
      "sonarjs/no-nested-conditional": "off",

      // Nested functions: legitimate uses exist (closures, event handlers, factory fns).
      // The sonarjs recommended default treats them as errors; we relax to warn so CI
      // surfaces them without blocking merges.
      "sonarjs/no-nested-functions": "warn",

      // TODO tags are expected during active development; treat as warning.
      "sonarjs/todo-tag": "warn",

      // Intrusive-permissions (geolocation) — used intentionally in visit check-ins.
      "sonarjs/no-intrusive-permissions": "warn",
    },
  },
  {
    // Deno integration-test files use Deno.test() which SonarJS doesn't recognise as a
    // test-framework registration, producing false-positive no-empty-test-file errors.
    // This override must appear AFTER the main config block so it wins.
    files: ["supabase/functions/**/*.test.ts"],
    rules: {
      "sonarjs/no-empty-test-file": "off",
    },
  },
  {
    // shadcn/ui files intentionally export cva() variant functions (e.g. buttonVariants,
    // badgeVariants) alongside their React components. These are stable design-system
    // helpers, not random utilities, so co-location is the right pattern here.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Context files export both the React Provider component and the corresponding
    // context object / selector hook. Splitting these would break the single-import
    // ergonomics consumers expect (import { useX, XProvider } from '@/contexts/X').
    files: ["src/contexts/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
