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

/**
 * Customer receipt document.
 * @param {object} order
 * @param {object} [settings]  site settings (restaurant name/vat/address).
 * @returns {string} HTML
 */
export function buildReceiptHTML(order, settings) {
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

  const body = `
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
  return shell(shortId(order), `.name{font-size:18px;font-weight:700}.xs{font-size:11px}.total{font-size:16px;margin-top:6px}`, body);
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
