import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  printReceiptDual,
  receiptPrintMessage,
  buildReceiptHTML,
  buildNonFiscalReceiptHTML,
  buildKitchenTicketHTML,
} from "../print.js";

// print.js is framework-free ESM (no React, no JSX), so Node's built-in test
// runner can exercise it directly — no browser test framework needed. The two
// browser globals it touches (window.open, fetch) are stubbed per test.
//
// Run via `npm test` at the repo root, which includes this path.

const ORDER = {
  _id: "64f000abcdef12345678",
  createdAt: "2026-08-28T18:30:00Z",
  paymentMethod: "Contanti",
  shippingAddress: { orderType: "pickup" },
  orderItems: [{ qty: 2, name: "Margherita", price: 8.5, toppings: [{ name: "bufala" }] }],
  itemsPrice: 17,
  shippingPrice: 0,
  taxPrice: 0,
  totalPrice: 17,
};

const withPrinting = (printing) => ({
  restaurant: { name: "Grani Antichi" },
  ...(printing ? { printing } : {}),
});
const CONFIGURED = withPrinting({
  agentUrl: "http://localhost:9100",
  receiptPrinterIds: ["fiscal"],
  nonFiscalPrinterIds: ["bar"],
});

// Minimal window.open stub: records whether the browser dialog was used.
let openedWindows;
const stubWindow = ({ blocked = false } = {}) => {
  openedWindows = [];
  globalThis.window = {
    open: () => {
      if (blocked) return null;
      const w = {
        document: { open() {}, write(html) { w.html = html; }, close() {}, title: "" },
        focus() {},
        print() { w.printed = true; },
      };
      openedWindows.push(w);
      return w;
    },
  };
};

let fetchCalls;
const stubFetch = (impl) => {
  fetchCalls = [];
  globalThis.fetch = async (url, opts) => {
    fetchCalls.push({ url, body: JSON.parse(opts.body), signal: opts.signal });
    return impl(url, opts);
  };
};
const agentOk = (results) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ results }),
});

beforeEach(() => stubWindow());
afterEach(() => {
  delete globalThis.window;
  delete globalThis.fetch;
});

describe("printReceiptDual — agent path", () => {
  test("sends TWO requests: the fiscal receipt and the non-fiscal copy, to their own printers", async () => {
    stubFetch((url, opts) => {
      const { docType } = JSON.parse(opts.body);
      return agentOk([
        { printerId: docType === "receipt" ? "fiscal" : "bar", ok: true },
      ])();
    });

    const status = await printReceiptDual(ORDER, CONFIGURED);

    assert.equal(fetchCalls.length, 2);
    assert.deepEqual(
      fetchCalls.map((c) => [c.body.docType, c.body.targets]).sort(),
      [
        ["nonFiscalReceipt", ["bar"]],
        ["receipt", ["fiscal"]],
      ]
    );
    assert.ok(fetchCalls.every((c) => c.url === "http://localhost:9100/print"));
    assert.equal(status.mode, "agent");
    assert.equal(status.ok, true);
    assert.equal(openedWindows.length, 0, "must not also open the browser dialog");
  });

  test("reports a partial failure WITHOUT falling back (no duplicate receipt)", async () => {
    stubFetch((url, opts) => {
      const { docType } = JSON.parse(opts.body);
      return docType === "receipt"
        ? agentOk([{ printerId: "fiscal", ok: true }])()
        : agentOk([{ printerId: "bar", ok: false, error: "ECONNREFUSED" }])();
    });

    const status = await printReceiptDual(ORDER, CONFIGURED);

    assert.equal(status.mode, "agent");
    assert.equal(status.ok, false);
    assert.deepEqual(status.failed, ["bar"]);
    assert.equal(openedWindows.length, 0, "the receipt already printed — must not print again");
  });

  test("only sends the fiscal document when no non-fiscal printers are configured", async () => {
    stubFetch(agentOk([{ printerId: "fiscal", ok: true }]));
    const status = await printReceiptDual(
      ORDER,
      withPrinting({ agentUrl: "http://localhost:9100", receiptPrinterIds: ["fiscal"], nonFiscalPrinterIds: [] })
    );
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].body.docType, "receipt");
    assert.equal(status.ok, true);
  });
});

describe("printReceiptDual — fallback to the browser dialog", () => {
  const assertFellBack = (status, reason) => {
    assert.equal(status.mode, "browser");
    assert.equal(status.ok, true);
    assert.equal(status.reason, reason);
    assert.equal(openedWindows.length, 1);
    assert.match(openedWindows[0].html, /Grani Antichi/);
  };

  test("when the agent is unreachable (network error)", async () => {
    stubFetch(async () => {
      throw new Error("Failed to fetch");
    });
    assertFellBack(await printReceiptDual(ORDER, CONFIGURED), "agent-unavailable");
  });

  test("when the agent returns a non-2xx response", async () => {
    stubFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    assertFellBack(await printReceiptDual(ORDER, CONFIGURED), "agent-unavailable");
  });

  test("when the agent responds but every printer failed", async () => {
    stubFetch(agentOk([{ printerId: "fiscal", ok: false, error: "offline" }]));
    assertFellBack(await printReceiptDual(ORDER, CONFIGURED), "agent-unavailable");
  });

  test("when no agent is configured at all", async () => {
    stubFetch(async () => {
      throw new Error("should never be called");
    });
    assertFellBack(await printReceiptDual(ORDER, withPrinting(null)), "agent-not-configured");
    assert.equal(fetchCalls.length, 0);
  });

  test("when settings predate the printing section entirely (old cached settings)", async () => {
    stubFetch(async () => {
      throw new Error("should never be called");
    });
    const status = await printReceiptDual(ORDER, { restaurant: { name: "X" } });
    assert.equal(status.mode, "browser");
    assert.equal(fetchCalls.length, 0);
  });

  test("reports popup-blocked rather than throwing", async () => {
    stubWindow({ blocked: true });
    stubFetch(async () => {
      throw new Error("unreachable");
    });
    const status = await printReceiptDual(ORDER, CONFIGURED);
    assert.equal(status.mode, "blocked");
    assert.equal(status.ok, false);
  });

  test("aborts a hanging agent instead of hanging the click", async () => {
    // Resolve only when the AbortController fires, proving a signal is wired in.
    stubFetch(
      (url, opts) =>
        new Promise((_, reject) => {
          opts.signal.addEventListener("abort", () => reject(new Error("AbortError")));
        })
    );
    const status = await printReceiptDual(ORDER, CONFIGURED);
    assert.equal(status.mode, "browser", "a hung agent must fall back, not hang");
  });
});

describe("receiptPrintMessage", () => {
  test("says nothing on a fully successful silent print", () => {
    assert.equal(receiptPrintMessage({ mode: "agent", ok: true, results: [] }), null);
  });
  test("names the printers that failed on a partial success", () => {
    const msg = receiptPrintMessage({ mode: "agent", ok: false, failed: ["bar"] });
    assert.match(msg.text, /bar/);
  });
  test("flags an expected-but-missing agent, stays quiet when none is configured", () => {
    assert.match(
      receiptPrintMessage({ mode: "browser", ok: true, reason: "agent-unavailable" }).text,
      /non raggiungibile/
    );
    assert.equal(
      receiptPrintMessage({ mode: "browser", ok: true, reason: "agent-not-configured" }),
      null
    );
  });
  test("tells the user to allow popups when blocked", () => {
    assert.match(receiptPrintMessage({ mode: "blocked", ok: false }).text, /popup/i);
  });
});

describe("document builders stay in sync", () => {
  test("the non-fiscal copy carries the same totals as the receipt, plus its markings", () => {
    const receipt = buildReceiptHTML(ORDER, CONFIGURED);
    const copy = buildNonFiscalReceiptHTML(ORDER, CONFIGURED);

    assert.ok(!receipt.includes("NON FISCALE"));
    assert.ok(copy.includes("DOCUMENTO NON FISCALE"));
    assert.ok(copy.includes("COPIA NON VALIDA AI FINI FISCALI"));
    // Same money lines in both.
    for (const fragment of ["Totale", "€17", "Margherita"]) {
      assert.ok(receipt.includes(fragment), `receipt missing ${fragment}`);
      assert.ok(copy.includes(fragment), `non-fiscal copy missing ${fragment}`);
    }
  });

  test("the kitchen ticket carries no prices", () => {
    const ticket = buildKitchenTicketHTML(ORDER);
    assert.ok(ticket.includes("Margherita"));
    assert.ok(ticket.includes("RITIRO"));
    assert.ok(!ticket.includes("Totale") && !ticket.includes("€"));
  });
});
