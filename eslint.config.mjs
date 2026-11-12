import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/retailer/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*INTERNAL_*", "**/INTERNAL_*"],
              message: "Retailer components must not import INTERNAL_* profiles or fields.",
            },
          ],
          paths: [
            {
              name: "@/lib/mock",
              importNames: ["INTERNAL_RETAILER_PROFILE", "InternalRetailerProfile"],
              message: "Retailer components must only import RetailerPublicProfile.",
            },
            {
              name: "@/lib/mock/retailer",
              importNames: ["INTERNAL_RETAILER_PROFILE", "InternalRetailerProfile"],
              message: "Retailer components must only import RetailerPublicProfile.",
            },
            {
              name: "@/lib/mock/types",
              importNames: ["InternalRetailerProfile"],
              message: "Retailer components must only import RetailerPublicProfile.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
