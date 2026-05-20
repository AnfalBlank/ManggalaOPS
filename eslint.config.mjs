import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Documented pattern in this codebase: hydrating internal state from
      // server-provided filter props via useEffect. The Next 16 lint rule
      // flags this as an error; we keep it as a warning so genuine new
      // violations are still surfaced without breaking existing files.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "off",
      // PDF generators rely on the `internal` field which is not typed by jspdf.
      // Allow `any` only for those specific call sites; we want strictness elsewhere.
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
