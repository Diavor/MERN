import mongoose from "mongoose";
import defaults from "../data/settings.js";

// Site-wide configuration shown/edited from the admin console (Impostazioni).
// This is a SINGLETON: exactly one document exists. The controller reads it with
// findOne() and upserts a default on first access, so callers never deal with ids.
//
// Schema defaults are sourced from ../data/settings.js (single source of truth),
// so even a fresh DB with no seed run shows the real business information.

// One opening-hours entry per weekday. A single open/close range today; a future
// "split shift" (lunch + dinner) becomes a `ranges: [{ open, close }]` array with
// no change to the surrounding model — hence the isolated sub-schema.
const hoursDaySchema = mongoose.Schema(
  {
    day: { type: String, required: true },
    closed: { type: Boolean, default: false },
    open: { type: String, default: "18:00" },
    close: { type: String, default: "23:00" },
  },
  { _id: false }
);

const settingSchema = mongoose.Schema(
  {
    restaurant: {
      name: { type: String, default: defaults.restaurant.name },
      vat: { type: String, default: defaults.restaurant.vat },
      address: { type: String, default: defaults.restaurant.address },
      phone: { type: String, default: defaults.restaurant.phone },
      email: { type: String, default: defaults.restaurant.email },
    },

    // Fresh copy per document so subdocs aren't shared across instances.
    hours: { type: [hoursDaySchema], default: () => defaults.hours.map((d) => ({ ...d })) },

    payments: {
      stripe: { type: Boolean, default: defaults.payments.stripe },
      apple: { type: Boolean, default: defaults.payments.apple },
      google: { type: Boolean, default: defaults.payments.google },
      // Contanti supports a richer state than on/off ("solo ritiro").
      cash: { type: String, enum: ["off", "pickup", "all"], default: defaults.payments.cash },
    },

    notifications: {
      emailNewOrders: { type: Boolean, default: defaults.notifications.emailNewOrders },
      smsRider: { type: Boolean, default: defaults.notifications.smsRider },
      pushCustomer: { type: Boolean, default: defaults.notifications.pushCustomer },
      dailySummary: { type: String, default: defaults.notifications.dailySummary },
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
