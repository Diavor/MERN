// Print agent entry point — runs ON THE TILL PC, next to the printers.
// Config comes from printers.config.json (hardware, see the .example file)
// and environment variables (behavior):
//   PORT           listen port                          (default 9100)
//   HOST           bind address; keep localhost unless   (default 127.0.0.1)
//                  other LAN tills must reach this agent
//   ALLOWED_ORIGIN comma-separated CORS allowlist        (default http://localhost:3000)
//                  — set to the deployed admin app origin, e.g.
//                  https://pgait.up.railway.app
//   DRY_RUN=true   log ESC/POS instead of printing (demo/tests, no hardware)
//   PRINTERS_CONFIG path to the config file              (default ./printers.config.json)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { createApp } from "./src/app.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = process.env.PRINTERS_CONFIG || path.join(here, "printers.config.json");

let printers = [];
try {
  printers = JSON.parse(readFileSync(configPath, "utf8")).printers || [];
} catch (err) {
  console.warn(
    `⚠ Could not read ${configPath} (${err.message}).\n` +
      "  Copy printers.config.example.json to printers.config.json and edit it.\n" +
      "  Starting with NO printers configured."
  );
}

const dryRun = process.env.DRY_RUN === "true";
const port = Number(process.env.PORT) || 9100;
const host = process.env.HOST || "127.0.0.1";
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = createApp({ printers, dryRun, allowedOrigins });

app.listen(port, host, () => {
  console.log(
    `Print agent listening on http://${host}:${port}` +
      (dryRun ? " [DRY_RUN — nothing will actually print]" : "") +
      `\nPrinters: ${printers.map((p) => p.id).join(", ") || "(none)"}` +
      `\nAllowed origins: ${allowedOrigins.join(", ")}`
  );
});
