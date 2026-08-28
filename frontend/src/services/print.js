// PrintService — reusable printing for the pizzeria.
//
// Two document types share one print pipeline: a customer RECEIPT (restaurant
// info, VAT, prices, totals) and a kitchen TICKET (no prices, large type, just
// what the line needs to cook). Rendering is pure HTML string builders, so they
// are easy to test and to retarget later (thermal/ESC-POS, multiple printers)
// without touching call sites. `printHTML` is the only side-effecting function.

const money = (n) => "€" + Number(n || 0).toFixed(2).replace(/\.00$/, "");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shortId = (o) => "BR-" + String(o._id || "").slice(-8).toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleString("it-IT") : "");
const lineExtras = (it) =>
  (it.toppings || []).length ? it.toppings.map((t) => t.name).join(", ") : "";

/**
 * Open a print window for arbitrary HTML and trigger the browser print dialog.
 * Kept isolated so document builders stay pure and testable.
 * @param {string} html  Full <html> document string.
 * @param {string} [title]
 */
export function printHTML(html, title = "Stampa") {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) {
    // Popup blocked — surface via return value so the caller can toast.
    return false;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  // Give the new document a tick to lay out before printing.
  w.onload = () => {
    w.focus();
    w.print();
  };
  // Fallback if onload doesn't fire (already-complete documents).
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* window may already be closing */
    }
  }, 300);
  return true;
}

const shell = (title, bodyCss, body) => `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(title)}</title><style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 16px; color: #111; }
  .r { display: flex; justify-content: space-between; gap: 12px; }
  .muted { color: #666; }
  hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
  ${bodyCss}
  @media print { body { padding: 0; } }
</style></head><body>${body}</body></html>`;

// Shared receipt body — the fiscal receipt and its non-fiscal copy print the
// exact same lines/totals; only the banner/footer marking differs.
// ⚠ The field structure here (header, id+date, meta line, item rows, totals,
// footer) is deliberately mirrored by print-agent/src/documents.js for the
// ESC/POS path — if you add/rename a field, update both sides.
const receiptBody = (order, settings) => {
  const r = settings?.restaurant || {};
  const items = order.orderItems || [];
  const rows = items
    .map(
      (it) => `<div class="r"><span>${it.qty}× ${esc(it.name)}</span><span>${money(it.price * it.qty)}</span></div>` +
      (lineExtras(it) ? `<div class="muted xs">+ ${esc(lineExtras(it))}</div>` : "")
    )
    .join("");
  const discount =
    Number(order.discountPrice) ||
    Math.max(0, Number(order.itemsPrice) + Number(order.shippingPrice) - Number(order.totalPrice));

  return `
    <div style="text-align:center">
      <div class="name">${esc(r.name || "Pizzeria")}</div>
      ${r.address ? `<div class="muted xs">${esc(r.address)}</div>` : ""}
      ${r.vat ? `<div class="muted xs">P.IVA ${esc(r.vat)}</div>` : ""}
      ${r.phone ? `<div class="muted xs">${esc(r.phone)}</div>` : ""}
    </div>
    <hr>
    <div class="r"><strong>${shortId(order)}</strong><span class="muted xs">${fmtDate(order.createdAt)}</span></div>
    <div class="muted xs">${order.shippingAddress?.orderType === "pickup" ? "Ritiro" : "Consegna"} · ${esc(order.paymentMethod || "")}</div>
    <hr>
    ${rows}
    <hr>
    <div class="r muted"><span>Subtotale</span><span>${money(order.itemsPrice)}</span></div>
    ${discount > 0 ? `<div class="r"><span>Sconto${order.couponCode ? " · " + esc(order.couponCode) : ""}</span><span>−${money(discount)}</span></div>` : ""}
    <div class="r muted"><span>Consegna</span><span>${Number(order.shippingPrice) === 0 ? "Gratis" : money(order.shippingPrice)}</span></div>
    <div class="r muted"><span>IVA</span><span>${money(order.taxPrice)}</span></div>
    <div class="r total"><strong>Totale</strong><strong>${money(order.totalPrice)}</strong></div>
    <hr>
    <div style="text-align:center" class="muted xs">Grazie! · ${esc(shortId(order))}</div>
  `;
};

const RECEIPT_CSS = `.name{font-size:18px;font-weight:700}.xs{font-size:11px}.total{font-size:16px;margin-top:6px}`;

/**
 * Customer receipt document.
 * @param {object} order
 * @param {object} [settings]  site settings (restaurant name/vat/address).
 * @returns {string} HTML
 */
export function buildReceiptHTML(order, settings) {
  return shell(shortId(order), RECEIPT_CSS, receiptBody(order, settings));
}

/**
 * Non-fiscal copy of the receipt: identical items/totals, prominently marked
 * as NOT a fiscal document (banner + footer), for the backup/bar printer.
 * @param {object} order
 * @param {object} [settings]
 * @returns {string} HTML
 */
export function buildNonFiscalReceiptHTML(order, settings) {
  const banner = `<div class="nf-banner">DOCUMENTO NON FISCALE</div>`;
  const footer = `<div class="nf-banner nf-footer">COPIA NON VALIDA AI FINI FISCALI</div>`;
  return shell(
    "Copia non fiscale " + shortId(order),
    RECEIPT_CSS +
      `.nf-banner{background:#000;color:#fff;text-align:center;font-weight:800;letter-spacing:.08em;padding:6px 4px;margin-bottom:10px}.nf-footer{margin:10px 0 0}`,
    banner + receiptBody(order, settings) + footer
  );
}

/**
 * Kitchen ticket document — no prices, large legible type.
 * @param {object} order
 * @returns {string} HTML
 */
export function buildKitchenTicketHTML(order) {
  const items = order.orderItems || [];
  const rows = items
    .map(
      (it) =>
        `<div class="item"><span class="qty">${it.qty}×</span> ${esc(it.name)}</div>` +
        (lineExtras(it) ? `<div class="extra">+ ${esc(lineExtras(it))}</div>` : "")
    )
    .join("");
  const type = order.shippingAddress?.orderType === "pickup" ? "RITIRO" : "CONSEGNA";
  const notes = order.shippingAddress?.notes;

  const body = `
    <div class="r"><div class="big">${shortId(order)}</div><div class="type">${type}</div></div>
    <div class="muted">${fmtDate(order.createdAt)}${order.shippingAddress?.deliverySlot ? " · " + esc(order.shippingAddress.deliverySlot) : ""}</div>
    <hr>
    ${rows}
    ${notes ? `<hr><div class="notes">NOTE: ${esc(notes)}</div>` : ""}
  `;
  return shell(
    "Ticket " + shortId(order),
    `.big{font-size:26px;font-weight:800}.type{font-size:16px;font-weight:700;align-self:center}
     .item{font-size:20px;font-weight:700;margin-top:8px}.qty{color:#000}
     .extra{font-size:15px;margin-left:24px}.notes{font-size:16px;font-weight:700}`,
    body
  );
}

/** Print a customer receipt. @returns {boolean} false if popup blocked. */
export const printReceipt = (order, settings) => printHTML(buildReceiptHTML(order, settings), "Ricevuta");

/** Print a kitchen ticket. @returns {boolean} false if popup blocked. */
export const printKitchenTicket = (order) => printHTML(buildKitchenTicketHTML(order), "Ticket cucina");

// ---------------------------------------------------------------------------
// Local print agent (silent, multi-printer)
// ---------------------------------------------------------------------------
// At the till, one click must put the customer receipt on the fiscal printer
// AND a non-fiscal copy on a second printer, with no print dialog.
// window.print() can do neither (one printer, always a dialog), so the till PC
// runs a small local service — print-agent/ at the repo root — that drives the
// printers directly over ESC/POS. See docs in that folder's README.

// A till with no agent running must fail FAST, not hang the click.
const AGENT_TIMEOUT_MS = 2500;

/**
 * Read the printing settings defensively: the section may be missing entirely
 * on settings cached by a browser from before the feature existed.
 */
const printingConfig = (settings) => {
  const p = settings?.printing || {};
  const ids = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  return {
    agentUrl: typeof p.agentUrl === "string" ? p.agentUrl.replace(/\/+$/, "") : "",
    receiptPrinterIds: ids(p.receiptPrinterIds),
    nonFiscalPrinterIds: ids(p.nonFiscalPrinterIds),
  };
};

/**
 * POST one document to the agent. Uses plain fetch rather than the app's axios
 * singleton on purpose: that instance carries our API base URL, auth headers
 * and the 401→refresh interceptor, none of which apply to (or should fire on)
 * a call to a printer daemon on localhost.
 * @returns {Promise<Array<{printerId: string, ok: boolean, error?: string}>>}
 */
const sendToAgent = async (agentUrl, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${agentUrl}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Agent responded ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Print the customer receipt via the local print agent — silently, and to the
 * fiscal and non-fiscal printers at once — falling back to the ordinary
 * browser print dialog whenever the agent can't be used.
 *
 * The fiscal receipt and the non-fiscal copy differ in content (the copy is
 * banner-marked as not valid for tax), so they're sent as two concurrent
 * requests with distinct docTypes rather than one request listing every
 * printer.
 *
 * Falls back to `printReceipt`'s exact behaviour when the agent is not
 * configured, unreachable, times out, errors, or reports that NOTHING printed
 * — so the button never regresses to "does nothing" on a dev machine or any
 * environment without the till setup. It deliberately does NOT fall back on a
 * partial failure (fiscal printed, bar printer down): the customer's receipt
 * already exists on paper, and printing it again from the browser would hand
 * them a duplicate.
 *
 * @param {object} order
 * @param {object} [settings]  site settings, incl. the `printing` section.
 * @returns {Promise<{mode: "agent"|"browser"|"blocked", ok: boolean,
 *   results?: Array<{printerId: string, ok: boolean, error?: string}>,
 *   failed?: string[], reason?: string}>} status for the caller to toast.
 */
export async function printReceiptDual(order, settings) {
  const { agentUrl, receiptPrinterIds, nonFiscalPrinterIds } = printingConfig(settings);

  const jobs = [];
  if (receiptPrinterIds.length) jobs.push(["receipt", receiptPrinterIds]);
  if (nonFiscalPrinterIds.length) jobs.push(["nonFiscalReceipt", nonFiscalPrinterIds]);

  if (agentUrl && jobs.length) {
    try {
      const settled = await Promise.allSettled(
        jobs.map(([docType, targets]) =>
          sendToAgent(agentUrl, { docType, order, settings, targets })
        )
      );

      // A rejected call means that whole document never reached the agent;
      // surface its printers as failed rather than losing them silently.
      const results = settled.flatMap((s, i) =>
        s.status === "fulfilled"
          ? s.value
          : jobs[i][1].map((printerId) => ({
              printerId,
              ok: false,
              error: String(s.reason?.message || s.reason),
            }))
      );

      if (results.some((r) => r.ok)) {
        const failed = results.filter((r) => !r.ok).map((r) => r.printerId);
        return { mode: "agent", ok: failed.length === 0, results, failed };
      }
      // Nothing printed at all — treat exactly like an unreachable agent.
    } catch {
      /* fall through to the browser dialog */
    }
  }

  const printed = printHTML(buildReceiptHTML(order, settings), "Ricevuta");
  return {
    mode: printed ? "browser" : "blocked",
    ok: printed,
    reason: agentUrl && jobs.length ? "agent-unavailable" : "agent-not-configured",
  };
}

/**
 * Map a printReceiptDual result to the message the till should see. Kept here,
 * next to the states it describes, so both call sites stay consistent.
 * Silence is deliberate on the fully-successful agent path: the paper coming
 * out of the printer is the feedback, and a toast per order is noise at till
 * volume.
 * @param {object} status  the resolved value of printReceiptDual
 * @returns {{text: string, tone: "ok"|"info"}|null} null ⇒ say nothing
 */
export function receiptPrintMessage(status) {
  if (!status) return null;
  if (status.mode === "agent") {
    return status.ok
      ? null
      : {
          text: `Ricevuta stampata, ma queste stampanti non hanno risposto: ${status.failed.join(", ")}`,
          tone: "info",
        };
  }
  if (status.mode === "blocked") {
    return { text: "Consenti i popup per stampare", tone: "info" };
  }
  // Browser fallback: only worth flagging when an agent was expected.
  return status.reason === "agent-unavailable"
    ? { text: "Print agent non raggiungibile — stampa dal browser", tone: "info" }
    : null;
}
