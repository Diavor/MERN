// Printer driver layer: turns a printers.config.json entry into a
// node-thermal-printer instance, renders a document onto it, and sends it.
// All hardware I/O is behind the dryRun flag so the agent is fully testable
// (and demoable) with no printer attached: in dry-run the ESC/POS buffer is
// built exactly as it would be for the device, logged, and never sent.

import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";
import { buildContent, renderEscPos } from "./documents.js";

const EXECUTE_TIMEOUT_MS = 5000;
const REACHABLE_TIMEOUT_MS = 1500;

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms).unref?.()),
  ]);

/**
 * Map a config entry to a node-thermal-printer `interface` string.
 *  - network → "tcp://host:port" (standard ESC/POS network printers, port 9100)
 *  - usb + device → an OS device path, e.g. "/dev/usb/lp0" (Linux/macOS)
 *  - usb + name → "printer:<queue name>" via the OS spooler (needs the optional
 *    '@thiagoelg/node-printer' package installed on the till machine)
 */
export function interfaceFor(cfg) {
  if (cfg.type === "network") {
    if (!cfg.host) throw new Error(`Printer "${cfg.id}": network type needs a host`);
    return `tcp://${cfg.host}:${cfg.port || 9100}`;
  }
  if (cfg.type === "usb") {
    if (cfg.device) return cfg.device;
    if (cfg.name) return `printer:${cfg.name}`;
    throw new Error(`Printer "${cfg.id}": usb type needs a device path or a queue name`);
  }
  throw new Error(`Printer "${cfg.id}": unknown type "${cfg.type}"`);
}

const makePrinter = (cfg) =>
  new ThermalPrinter({
    type: PrinterTypes[String(cfg.printerType || "EPSON").toUpperCase()] || PrinterTypes.EPSON,
    interface: interfaceFor(cfg),
    characterSet: cfg.characterSet || "PC858_EURO", // has the € glyph
    options: { timeout: EXECUTE_TIMEOUT_MS },
  });

/**
 * Build the ESC/POS document for `docType` and send it to one printer.
 * Never throws — always resolves to a per-printer result the endpoint can
 * aggregate.
 * @returns {Promise<{printerId: string, ok: boolean, error?: string}>}
 */
export async function printDocument(cfg, docType, order, settings, { dryRun = false } = {}) {
  try {
    const printer = makePrinter(cfg);
    renderEscPos(printer, buildContent(docType, order, settings));

    if (dryRun) {
      const buffer = printer.getBuffer();
      console.log(
        `[dry-run] ${docType} → ${cfg.id} (${interfaceFor(cfg)}): ${buffer.length} bytes\n` +
          buffer.toString("latin1").replace(/[^\x20-\x7EàèéìòùÀÈÉÌÒÙ€\n]/g, "·")
      );
      return { printerId: cfg.id, ok: true };
    }

    await withTimeout(
      printer.execute(),
      EXECUTE_TIMEOUT_MS,
      `timeout after ${EXECUTE_TIMEOUT_MS}ms`
    );
    return { printerId: cfg.id, ok: true };
  } catch (err) {
    return { printerId: cfg.id, ok: false, error: err.message };
  }
}

/** @returns {Promise<boolean>} best-effort reachability for /health. */
export async function isReachable(cfg, { dryRun = false } = {}) {
  if (dryRun) return true;
  try {
    const printer = makePrinter(cfg);
    return await withTimeout(
      printer.isPrinterConnected(),
      REACHABLE_TIMEOUT_MS,
      "reachability check timed out"
    );
  } catch {
    return false;
  }
}
