import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { buildContent, renderEscPos } from "../src/documents.js";
import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";

const PRINTERS = [
  { id: "fiscal", label: "Cassa", type: "network", host: "192.0.2.1", docTypes: ["receipt"] },
  { id: "bar", label: "Bar", type: "network", host: "192.0.2.2", docTypes: ["nonFiscalReceipt"] },
];

const ORDER = {
  _id: "64f000abcdef12345678",
  createdAt: "2026-08-28T18:30:00Z",
  paymentMethod: "Contanti",
  shippingAddress: { orderType: "pickup", notes: "senza basilico" },
  orderItems: [
    { qty: 2, name: "Margherita", price: 8.5, toppings: [{ name: "bufala" }] },
    { qty: 1, name: "Diavola", price: 10, toppings: [] },
  ],
  itemsPrice: 27,
  shippingPrice: 0,
  taxPrice: 0,
  discountPrice: 2,
  couponCode: "PIZZA10",
  totalPrice: 25,
};

const SETTINGS = {
  restaurant: { name: "Grani Antichi", vat: "12345678901", address: "Via Canova 23" },
};

// Render a doc to its raw ESC/POS bytes; text content is readable as latin1.
const escposText = (docType) => {
  const p = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: "tcp://192.0.2.9",
    characterSet: "PC858_EURO", // same as the real driver in src/printers.js
  });
  renderEscPos(p, buildContent(docType, ORDER, SETTINGS));
  return p.getBuffer().toString("latin1");
};

// Boot the app on an ephemeral port; exercised over real HTTP like the SPA does.
const listen = (app) =>
  new Promise((resolve) => {
    const srv = app.listen(0, "127.0.0.1", () =>
      resolve({ srv, base: `http://127.0.0.1:${srv.address().port}` })
    );
  });

describe("ESC/POS documents", () => {
  it("receipt carries header, items, coupon discount and total", () => {
    const text = escposText("receipt");
    for (const expected of [
      "Grani Antichi",
      "P.IVA 12345678901",
      "2x Margherita",
      "+ bufala",
      "Sconto PIZZA10",
      "Totale",
      "BR-",
    ]) {
      assert.ok(text.includes(expected), `missing "${expected}"`);
    }
  });

  it("non-fiscal copy is clearly marked and keeps the same totals", () => {
    const text = escposText("nonFiscalReceipt");
    assert.ok(text.includes("DOCUMENTO NON FISCALE"));
    assert.ok(text.includes("COPIA NON VALIDA AI FINI FISCALI"));
    assert.ok(text.includes("Totale"));
  });

  it("kitchen ticket has items and notes but no prices", () => {
    const text = escposText("kitchenTicket");
    assert.ok(text.includes("2x Margherita"));
    assert.ok(text.includes("NOTE: senza basilico"));
    assert.ok(text.includes("RITIRO"));
    assert.ok(!text.includes("Totale") && !text.includes("Subtotale"), "prices leaked into ticket");
  });

  it("rejects an unknown docType", () => {
    assert.throws(() => buildContent("invoice", ORDER, SETTINGS), /Unknown docType/);
  });
});

describe("print agent HTTP API (DRY_RUN)", () => {
  let base, srv;
  before(async () => {
    ({ srv, base } = await listen(createApp({ printers: PRINTERS, dryRun: true })));
  });
  after(() => srv.close());

  it("GET /health reports every configured printer as reachable in dry-run", async () => {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.deepEqual(
      body.printers.map((p) => [p.id, p.reachable]),
      [["fiscal", true], ["bar", true]]
    );
  });

  it("POST /print fans out to all requested printers", async () => {
    const res = await fetch(`${base}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docType: "receipt",
        order: ORDER,
        settings: SETTINGS,
        targets: ["fiscal", "bar"],
      }),
    });
    const { results } = await res.json();
    assert.deepEqual(results, [
      { printerId: "fiscal", ok: true },
      { printerId: "bar", ok: true },
    ]);
  });

  it("defaults targets from each printer's docTypes when none are passed", async () => {
    const res = await fetch(`${base}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType: "nonFiscalReceipt", order: ORDER, settings: SETTINGS }),
    });
    const { results } = await res.json();
    assert.deepEqual(results, [{ printerId: "bar", ok: true }]);
  });

  it("400s on a bad docType and on a missing order", async () => {
    const post = (body) =>
      fetch(`${base}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    assert.equal((await post({ docType: "nope", order: ORDER })).status, 400);
    assert.equal((await post({ docType: "receipt" })).status, 400);
  });
});

describe("partial failure", () => {
  it("one dead printer never blocks the other (allSettled semantics)", async () => {
    // Inject a driver where the fiscal printer hard-fails.
    const driver = {
      isReachable: async () => true,
      printDocument: async (cfg) =>
        cfg.id === "fiscal"
          ? { printerId: cfg.id, ok: false, error: "ECONNREFUSED" }
          : { printerId: cfg.id, ok: true },
    };
    const { srv, base } = await listen(createApp({ printers: PRINTERS, driver }));
    try {
      const res = await fetch(`${base}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "receipt",
          order: ORDER,
          targets: ["fiscal", "bar"],
        }),
      });
      const { results } = await res.json();
      assert.deepEqual(results, [
        { printerId: "fiscal", ok: false, error: "ECONNREFUSED" },
        { printerId: "bar", ok: true },
      ]);
    } finally {
      srv.close();
    }
  });

  it("an unknown target id yields a per-printer error, not a request failure", async () => {
    const { srv, base } = await listen(createApp({ printers: PRINTERS, dryRun: true }));
    try {
      const res = await fetch(`${base}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "receipt",
          order: ORDER,
          targets: ["fiscal", "ghost"],
        }),
      });
      assert.equal(res.status, 200);
      const { results } = await res.json();
      assert.deepEqual(results, [
        { printerId: "fiscal", ok: true },
        { printerId: "ghost", ok: false, error: "unknown printer id" },
      ]);
    } finally {
      srv.close();
    }
  });
});
