# Print agent

A small local service that runs **on the till PC**, next to the printers, and
drives them directly over ESC/POS. It exists because a browser cannot do two
things the till needs:

- print to **two different printers** from one click (the fiscal receipt and a
  non-fiscal copy), and
- print **without a dialog** — `window.print()` always shows one, which is
  unusable at per-order volume.

The admin app POSTs a document here instead; the browser print dialog remains
the automatic fallback whenever this agent isn't running (see
`printReceiptDual` in `frontend/src/services/print.js`), so a dev machine or a
laptop without the till setup still works exactly as before.

This is **not** part of the deployed backend API. It never goes on Railway — it
must be on the same machine/LAN as the hardware.

```
browser (admin app)  ──HTTP──▶  print agent (this)  ──ESC/POS──▶  printers
        │                          localhost:9100                fiscal + bar
        └── falls back to window.print() when the agent is unreachable
```

## Install & run (Windows / macOS till PC)

Requires Node 22+.

```bash
cd print-agent
npm install
cp printers.config.example.json printers.config.json   # then edit it
npm start
```

Verify: `curl http://localhost:9100/health` → `{"ok":true,...}` listing each
configured printer and whether it's reachable.

**No hardware yet?** `npm run dev` starts in `DRY_RUN` mode: documents are
rendered to real ESC/POS bytes and logged to the console, nothing is sent to a
device. Everything downstream behaves identically, so the whole flow is
demoable and testable without a printer.

### Keeping it running

For a real till you want it to survive reboots. Simplest options, in order of
how much you'll have to think about them:

- **pm2** (cross-platform): `npm i -g pm2 && pm2 start server.js --name print-agent && pm2 save && pm2 startup`
- **Windows**: run the same via [nssm](https://nssm.cc/) to register it as a
  proper Windows service.
- **macOS**: a `launchd` plist in `~/Library/LaunchAgents`.

Packaging it into a single executable (`pkg`, `node --experimental-sea-config`)
is possible but unnecessary here — the till already has Node for nothing else,
and a service manager is less machinery than a build pipeline.

## Configuration

### `printers.config.json` (this machine's hardware — gitignored)

Copy from `printers.config.example.json`. Each printer needs an `id`, a
connection, and the `docTypes` it should receive by default.

```jsonc
{
  "printers": [
    { "id": "fiscal", "label": "Cassa", "type": "network",
      "host": "192.168.1.50", "port": 9100, "docTypes": ["receipt"] },
    { "id": "bar", "label": "Bancone", "type": "usb",
      "device": "/dev/usb/lp0", "docTypes": ["nonFiscalReceipt", "kitchenTicket"] }
  ]
}
```

- `type: "network"` — needs `host` (+ optional `port`, default 9100). Most
  ESC/POS network printers listen on TCP 9100.
- `type: "usb"` — needs either `device` (an OS device path such as
  `/dev/usb/lp0`) or `name` (an OS print-queue name, which additionally
  requires `npm i @thiagoelg/node-printer`).

Hardware details deliberately live **only here**, never in MongoDB: they're
specific to this physical PC, not to the restaurant.

### Environment

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `9100` | listen port |
| `HOST` | `127.0.0.1` | bind address — keep localhost unless another machine must reach it |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | comma-separated CORS allowlist; set to the admin app's real origin, e.g. `https://pgait.up.railway.app` |
| `DRY_RUN` | unset | `true` → render + log ESC/POS, never touch hardware |
| `PRINTERS_CONFIG` | `./printers.config.json` | config file path |

### The other half: admin settings

The `id` strings above are a **shared vocabulary** with the admin app. In the
admin console → **Impostazioni → Stampa**:

- **Indirizzo print agent** — where the browser reaches this service
  (`http://localhost:9100` when the admin app runs on the till itself).
- **Stampanti ricevuta** — which ids get the customer receipt (e.g. `fiscal`).
- **Stampanti copia non fiscale** — which ids also get a copy marked
  `DOCUMENTO NON FISCALE` (e.g. `bar`). Empty = no copy.

An id typed there that doesn't exist here comes back as a per-printer error
(`unknown printer id`) rather than failing the whole print.

## API

- `GET /health` → `{ ok, dryRun, printers: [{ id, name, reachable }] }`
- `POST /print` → `{ docType, order, settings, targets? }`
  - `docType`: `receipt` | `nonFiscalReceipt` | `kitchenTicket`
  - `targets`: optional printer ids; defaults to every printer whose
    `docTypes` includes this `docType`
  - responds `{ results: [{ printerId, ok, error? }] }` — always 200 when the
    request itself was valid, because **one dead printer must not fail the
    others**. Dispatch is `Promise.allSettled`, so the fiscal receipt still
    prints when the bar printer is unplugged; the caller shows a partial-failure
    toast.

## Documents

`src/documents.js` builds the content, `renderEscPos` turns it into printer
commands. The content structure deliberately **mirrors**
`frontend/src/services/print.js` (which renders the same three documents as
HTML for the browser fallback) field for field. The two are separate processes
deployed separately, so the shape is duplicated on purpose rather than shared —
if you add or rename a field on one side, change the other to match.

ESC/POS output is intentionally ASCII (`2x` not `2×`, `-` not `−`): cheap
thermal code pages lack those glyphs. The HTML builders keep the typographic
characters.

## Tests

```bash
npm test
```

Covers document content (all three types, including that the kitchen ticket
leaks no prices), the HTTP surface in `DRY_RUN`, parallel dispatch, and — the
important one — that a failing printer doesn't block a healthy one. No hardware
required.
