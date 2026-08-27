import Slot from "../models/slotModel.js";

// Single source of truth for delivery/pickup slot capacity. `Slot.count` is the
// booked load for a given (date, time); a reservation succeeds only while the
// slot stays at or below its ceiling. Both the storefront checkout and the
// embeddable widget go through here so capacity can never be oversold from one
// path while the other looks empty.
//
// Capacity is expressed as a per-slot ceiling passed in by the caller: the
// storefront uses the global default, optionally tightened to a delivery zone's
// `maxOrders`; the widget passes the same global default.
export const SLOT_CAPACITY = 10;
export const SLOT_OPEN_HOUR = 18;
export const SLOT_CLOSE_HOUR = 22;

// Generate the bookable HH:MM grid (18:00–22:00 in 15-min steps).
export const generateTimeSlots = () => {
  const slots = [];
  for (let h = SLOT_OPEN_HOUR; h < SLOT_CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
};

/**
 * Atomically reserve `units` of capacity on a (date, time) slot without ever
 * exceeding `capacity`. Handles the first-booking create and the concurrent
 * create race (duplicate-key retry).
 *
 * @param {{ date: string, time: string, units?: number, capacity?: number }} opts
 * @returns {Promise<{ ok: boolean, slot: import('mongoose').Document|null }>}
 *   `ok:false` means the slot is full (caller should respond 409).
 */
export const reserveSlot = async ({
  date,
  time,
  units = 1,
  capacity = SLOT_CAPACITY,
}) => {
  if (units > capacity) return { ok: false, slot: null };

  // Fast path: bump an existing slot that still has room.
  const bumped = await Slot.findOneAndUpdate(
    { date, time, count: { $lte: capacity - units } },
    { $inc: { count: units } },
    { new: true }
  );
  if (bumped) return { ok: true, slot: bumped };

  // No matching slot: either it doesn't exist yet, or it's full.
  const existing = await Slot.findOne({ date, time });
  if (existing) return { ok: false, slot: existing }; // exists but no room → full

  // First booking for this slot — create it.
  try {
    const created = await Slot.create({ date, time, count: units });
    return { ok: true, slot: created };
  } catch (err) {
    if (err.code === 11000) {
      // A concurrent request created the slot first — retry the bump once.
      const retry = await Slot.findOneAndUpdate(
        { date, time, count: { $lte: capacity - units } },
        { $inc: { count: units } },
        { new: true }
      );
      return retry ? { ok: true, slot: retry } : { ok: false, slot: null };
    }
    throw err;
  }
};

/**
 * Release previously-reserved capacity (best effort). Used to roll back a
 * reservation when the surrounding write fails, so a crashed order never leaves
 * phantom load on a slot. Never throws.
 *
 * @param {{ date: string, time: string, units?: number }} opts
 */
export const releaseSlot = async ({ date, time, units = 1 }) => {
  try {
    await Slot.updateOne(
      { date, time, count: { $gte: units } },
      { $inc: { count: -units } }
    );
  } catch {
    /* best effort — a failed release must never mask the original error */
  }
};
