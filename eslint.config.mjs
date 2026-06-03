import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  tailwindcss.configs.recommended,
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      "tailwindcss/no-arbitrary-value": "error",
      "tailwindcss/no-custom-classname": "error",
    },
    settings: {
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl"],
        whitelist: ["maplibregl\\-.*"],
        cssConfigPath: path.resolve(__dirname, "src/styles/theme.css"),
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
  ]),
]);

export default eslintConfig;
