// HTTP surface of the print agent. Kept separate from server.js (which loads
// config from disk/env) so tests can create an app with an inline config and
// dryRun forced on.

import express from "express";
import cors from "cors";
import { DOC_TYPES } from "./documents.js";
import { printDocument, isReachable } from "./printers.js";

/**
 * @param {object}   opts
 * @param {Array}    opts.printers        printers.config.json "printers" array.
 * @param {boolean}  [opts.dryRun]        Build+log ESC/POS but never touch hardware.
 * @param {string[]} [opts.allowedOrigins] CORS allowlist (the admin app's origins).
 * @param {object}   [opts.driver]        Injection point for tests: { printDocument, isReachable }.
 */
export function createApp({
  printers = [],
  dryRun = false,
  allowedOrigins = ["http://localhost:3000"],
  driver = { printDocument, isReachable },
} = {}) {
  const app = express();
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "1mb" }));

  const byId = new Map(printers.map((p) => [p.id, p]));
  // Default targets per docType: every printer that declares that docType.
  const defaultTargets = (docType) =>
    printers.filter((p) => (p.docTypes || []).includes(docType)).map((p) => p.id);

  app.get("/health", async (req, res) => {
    const checks = await Promise.allSettled(
      printers.map((p) => driver.isReachable(p, { dryRun }))
    );
    res.json({
      ok: true,
      dryRun,
      printers: printers.map((p, i) => ({
        id: p.id,
        name: p.label || p.id,
        reachable: checks[i].status === "fulfilled" ? checks[i].value : false,
      })),
    });
  });

  app.post("/print", async (req, res) => {
    const { docType, order, settings, targets } = req.body || {};
    if (!DOC_TYPES.includes(docType)) {
      return res.status(400).json({ message: `docType must be one of: ${DOC_TYPES.join(", ")}` });
    }
    if (!order || typeof order !== "object") {
      return res.status(400).json({ message: "order is required" });
    }

    const ids = Array.isArray(targets) && targets.length ? targets : defaultTargets(docType);
    if (!ids.length) {
      return res.status(400).json({ message: `No printers configured for docType "${docType}"` });
    }

    // allSettled semantics: one printer failing must never block the others.
    // (printDocument also never rejects, but allSettled guards regressions.)
    const settled = await Promise.allSettled(
      ids.map((id) => {
        const cfg = byId.get(id);
        if (!cfg) {
          return Promise.resolve({ printerId: id, ok: false, error: "unknown printer id" });
        }
        return driver.printDocument(cfg, docType, order, settings, { dryRun });
      })
    );

    res.json({
      results: settled.map((s, i) =>
        s.status === "fulfilled"
          ? s.value
          : { printerId: ids[i], ok: false, error: String(s.reason?.message || s.reason) }
      ),
    });
  });

  return app;
}
