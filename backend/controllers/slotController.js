import asyncHandler from "express-async-handler";
import Slot from "../models/slotModel.js";
import PizzaOrder from "../models/pizzaOrderModel.js";
import {
  SLOT_CAPACITY,
  generateTimeSlots,
  reserveSlot,
} from "../services/slotReservation.js";

// @desc    Get available slots for a given date
// @route   GET /api/slots?date=YYYY-MM-DD
// @access  Public
const getSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400);
    throw new Error("Valid date in YYYY-MM-DD format is required");
  }

  const allSlots = generateTimeSlots();
  const bookings = await Slot.find({ date });
  const bookingMap = Object.fromEntries(bookings.map((b) => [b.time, b.count]));

  const slots = allSlots.map((time) => ({
    time,
    available: Math.max(0, SLOT_CAPACITY - (bookingMap[time] || 0)),
    maxCapacity: SLOT_CAPACITY,
  }));

  res.json(slots);
});

// @desc    Create a pizza delivery order
// @route   POST /api/pizza-orders
// @access  Public
const createPizzaOrder = asyncHandler(async (req, res) => {
  const { items, deliveryDate, deliverySlot } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Order must contain at least one item");
  }

  if (!deliveryDate || !deliverySlot) {
    res.status(400);
    throw new Error("Delivery date and time slot are required");
  }

  const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.qty * item.price, 0);

  if (totalQty < 1) {
    res.status(400);
    throw new Error("Order must contain at least one pizza");
  }

  if (totalQty > SLOT_CAPACITY) {
    res.status(400);
    throw new Error(`Cannot order more than ${SLOT_CAPACITY} pizzas per slot`);
  }

  // Atomically reserve this order's pizza load against the slot ceiling.
  const { ok } = await reserveSlot({
    date: deliveryDate,
    time: deliverySlot,
    units: totalQty,
    capacity: SLOT_CAPACITY,
  });
  if (!ok) {
    res.status(409);
    throw new Error("This time slot is full. Please choose another slot.");
  }

  const order = await PizzaOrder.create({
    items,
    deliveryDate,
    deliverySlot,
    totalQty,
    totalPrice,
  });

  res.status(201).json(order);
});

export { getSlots, createPizzaOrder };
