// Document CONTENT builders for the print agent.
//
// ⚠ Kept deliberately in sync with frontend/src/services/print.js — the two
// processes are deployed separately (browser bundle vs. till PC), so the
// content shape is duplicated on purpose rather than shared. If a field is
// added/renamed on one side, mirror it on the other. The shared field list:
//
//   receipt / nonFiscalReceipt:
//     header lines (name, address, "P.IVA <vat>", phone), banner (non-fiscal
//     only), shortId + createdAt, orderType + paymentMethod line, item rows
//     (qty× name / extras / line total), totals (Subtotale, Sconto?, Consegna,
//     IVA, Totale), footer ("Grazie! · id"; non-fiscal adds the invalidity line)
//   kitchenTicket:
//     shortId, RITIRO|CONSEGNA, createdAt + deliverySlot, item rows (qty× name
//     / extras — NO prices), notes
//
// The builders return a plain "content" object; renderEscPos() turns it into
// ESC/POS commands on a node-thermal-printer instance. Content stays pure and
// unit-testable without hardware.

const money = (n) =>
  "€" +
  Number(n || 0)
    .toFixed(2)
    .replace(/\.00$/, "");
const shortId = (o) => "BR-" + String(o._id || "").slice(-8).toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleString("it-IT") : "");
const lineExtras = (it) =>
  (it.toppings || []).length ? it.toppings.map((t) => t.name).join(", ") : "";

const NON_FISCAL_BANNER = "DOCUMENTO NON FISCALE";
const NON_FISCAL_FOOTER = "COPIA NON VALIDA AI FINI FISCALI";

// NOTE: thermal-safe ASCII on purpose — "2x" not "2×", "-" not "−". Cheap
// thermal code pages miss those glyphs; the HTML builders keep the pretty ones.
const receiptItems = (order) =>
  (order.orderItems || []).map((it) => ({
    qty: it.qty,
    name: it.name,
    extras: lineExtras(it),
    total: money(it.price * it.qty),
  }));

const receiptTotals = (order) => {
  const discount =
    Number(order.discountPrice) ||
    Math.max(
      0,
      Number(order.itemsPrice) + Number(order.shippingPrice) - Number(order.totalPrice)
    );
  const rows = [["Subtotale", money(order.itemsPrice)]];
  if (discount > 0) {
    rows.push([
      "Sconto" + (order.couponCode ? " " + order.couponCode : ""),
      "-" + money(discount),
    ]);
  }
  rows.push([
    "Consegna",
    Number(order.shippingPrice) === 0 ? "Gratis" : money(order.shippingPrice),
  ]);
  rows.push(["IVA", money(order.taxPrice)]);
  return rows;
};

/** Customer receipt content (fiscal register copy). */
export function receiptContent(order, settings = {}) {
  const r = settings.restaurant || {};
  return {
    kind: "receipt",
    banner: null,
    header: [
      { text: r.name || "Pizzeria", big: true },
      ...(r.address ? [{ text: r.address }] : []),
      ...(r.vat ? [{ text: "P.IVA " + r.vat }] : []),
      ...(r.phone ? [{ text: r.phone }] : []),
    ],
    id: shortId(order),
    date: fmtDate(order.createdAt),
    meta:
      (order.shippingAddress?.orderType === "pickup" ? "Ritiro" : "Consegna") +
      " - " +
      (order.paymentMethod || ""),
    items: receiptItems(order),
    totals: receiptTotals(order),
    grandTotal: ["Totale", money(order.totalPrice)],
    footer: ["Grazie! - " + shortId(order)],
  };
}

/** Non-fiscal copy: same lines/totals, prominently marked as not fiscal. */
export function nonFiscalReceiptContent(order, settings = {}) {
  const c = receiptContent(order, settings);
  return {
    ...c,
    kind: "nonFiscalReceipt",
    banner: NON_FISCAL_BANNER,
    footer: [NON_FISCAL_FOOTER, ...c.footer],
  };
}

/** Kitchen ticket: no prices, just what the line needs to cook. */
export function kitchenTicketContent(order) {
  return {
    kind: "kitchenTicket",
    banner: null,
    header: [],
    id: shortId(order),
    type: order.shippingAddress?.orderType === "pickup" ? "RITIRO" : "CONSEGNA",
    date:
      fmtDate(order.createdAt) +
      (order.shippingAddress?.deliverySlot
        ? " - " + order.shippingAddress.deliverySlot
        : ""),
    items: (order.orderItems || []).map((it) => ({
      qty: it.qty,
      name: it.name,
      extras: lineExtras(it),
    })),
    totals: [],
    grandTotal: null,
    footer: [],
    notes: order.shippingAddress?.notes || "",
  };
}

const BUILDERS = {
  receipt: receiptContent,
  nonFiscalReceipt: nonFiscalReceiptContent,
  kitchenTicket: kitchenTicketContent,
};

export const DOC_TYPES = Object.keys(BUILDERS);

/** @throws on unknown docType */
export function buildContent(docType, order, settings) {
  const build = BUILDERS[docType];
  if (!build) throw new Error(`Unknown docType: ${docType}`);
  return build(order, settings);
}

/**
 * Render a content object as ESC/POS commands onto a node-thermal-printer
 * instance (mutates the printer's command buffer; does NOT execute/send).
 */
export function renderEscPos(printer, content) {
  if (content.banner) {
    printer.alignCenter();
    printer.bold(true);
    printer.invert(true);
    printer.println(` ${content.banner} `);
    printer.invert(false);
    printer.bold(false);
    printer.newLine();
  }

  if (content.header.length) {
    printer.alignCenter();
    for (const line of content.header) {
      if (line.big) {
        printer.setTextDoubleHeight();
        printer.bold(true);
        printer.println(line.text);
        printer.bold(false);
        printer.setTextNormal();
      } else {
        printer.println(line.text);
      }
    }
    printer.drawLine();
  }

  printer.alignLeft();
  if (content.kind === "kitchenTicket") {
    printer.setTextDoubleHeight();
    printer.bold(true);
    printer.leftRight(content.id, content.type);
    printer.bold(false);
    printer.setTextNormal();
    printer.println(content.date);
    printer.drawLine();
    for (const it of content.items) {
      printer.setTextDoubleHeight();
      printer.bold(true);
      printer.println(`${it.qty}x ${it.name}`);
      printer.bold(false);
      printer.setTextNormal();
      if (it.extras) printer.println(`  + ${it.extras}`);
    }
    if (content.notes) {
      printer.drawLine();
      printer.bold(true);
      printer.println("NOTE: " + content.notes);
      printer.bold(false);
    }
  } else {
    printer.bold(true);
    printer.leftRight(content.id, content.date);
    printer.bold(false);
    printer.println(content.meta);
    printer.drawLine();
    for (const it of content.items) {
      printer.leftRight(`${it.qty}x ${it.name}`, it.total);
      if (it.extras) printer.println(`  + ${it.extras}`);
    }
    printer.drawLine();
    for (const [label, value] of content.totals) printer.leftRight(label, value);
    if (content.grandTotal) {
      printer.bold(true);
      printer.setTextDoubleHeight();
      printer.leftRight(content.grandTotal[0], content.grandTotal[1]);
      printer.setTextNormal();
      printer.bold(false);
    }
  }

  if (content.footer.length) {
    printer.drawLine();
    printer.alignCenter();
    for (const line of content.footer) printer.println(line);
  }

  printer.newLine();
  printer.cut();
  return printer;
}
