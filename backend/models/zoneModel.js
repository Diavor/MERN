import mongoose from "mongoose";

// A delivery zone drives the checkout fee/ETA and is managed from the admin
// console (Zone consegna). Mirrors the ZoneModal form in the design handoff.
const timeRangeSchema = mongoose.Schema(
  {
    open: { type: String, default: "18:00" },
    close: { type: String, default: "23:00" },
  },
  { _id: false }
);

const zoneSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String, default: "" },
    active: { type: Boolean, default: true },

    // Consegna
    fee: { type: Number, required: true, default: 0 },
    freeThreshold: { type: Number, default: 40 },
    minOrder: { type: Number, default: 0 },
    eta: { type: String, default: "20–30 min" },
    maxOrders: { type: Number, default: 25 },

    // Disponibilità — by default a zone follows the restaurant's opening hours
    // (managed in Settings). `schedule` is the per-zone override used only when
    // useGlobalHours is false; it collapses the former weekday/weekend ranges
    // into one "from → to".
    useGlobalHours: { type: Boolean, default: true },
    schedule: { type: timeRangeSchema, default: () => ({ open: "18:00", close: "22:00" }) },
    holidays: { type: Boolean, default: false },

    // Copertura
    coverage: { type: String, enum: ["radius", "postal", "polygon"], default: "radius" },
    radius: { type: Number, default: 2.0 },
    postalCodes: { type: String, default: "" },
    polygon: { type: [[Number]], default: undefined },

    // Sede & pagamenti
    restaurant: { type: String, default: "Via dei Forni 14" },
    payments: { type: [String], default: ["card", "apple", "google", "cash"] },

    // Restrizioni & note
    restrictions: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

zoneSchema.index({ active: 1 });

const Zone = mongoose.model("Zone", zoneSchema);

export default Zone;
