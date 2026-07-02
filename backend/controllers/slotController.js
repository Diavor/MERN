import asyncHandler from 'express-async-handler'
import Slot from '../models/slotModel.js'
import PizzaOrder from '../models/pizzaOrderModel.js'

const MAX_CAPACITY = 10
const OPEN_HOUR = 18
const CLOSE_HOUR = 22

const generateTimeSlots = () => {
  const slots = []
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

// @desc    Get available slots for a given date
// @route   GET /api/slots?date=YYYY-MM-DD
// @access  Public
const getSlots = asyncHandler(async (req, res) => {
  const { date } = req.query

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400)
    throw new Error('Valid date in YYYY-MM-DD format is required')
  }

  const allSlots = generateTimeSlots()
  const bookings = await Slot.find({ date })
  const bookingMap = Object.fromEntries(bookings.map((b) => [b.time, b.count]))

  const slots = allSlots.map((time) => ({
    time,
    available: Math.max(0, MAX_CAPACITY - (bookingMap[time] || 0)),
    maxCapacity: MAX_CAPACITY,
  }))

  res.json(slots)
})

// @desc    Create a pizza delivery order
// @route   POST /api/pizza-orders
// @access  Public
const createPizzaOrder = asyncHandler(async (req, res) => {
  const { items, deliveryDate, deliverySlot } = req.body

  if (!items || items.length === 0) {
    res.status(400)
    throw new Error('Order must contain at least one item')
  }

  if (!deliveryDate || !deliverySlot) {
    res.status(400)
    throw new Error('Delivery date and time slot are required')
  }

  const totalQty = items.reduce((acc, item) => acc + item.qty, 0)
  const totalPrice = items.reduce((acc, item) => acc + item.qty * item.price, 0)

  if (totalQty < 1) {
    res.status(400)
    throw new Error('Order must contain at least one pizza')
  }

  if (totalQty > MAX_CAPACITY) {
    res.status(400)
    throw new Error(`Cannot order more than ${MAX_CAPACITY} pizzas per slot`)
  }

  // Atomically reserve capacity on an existing slot
  const updatedSlot = await Slot.findOneAndUpdate(
    {
      date: deliveryDate,
      time: deliverySlot,
      count: { $lte: MAX_CAPACITY - totalQty },
    },
    { $inc: { count: totalQty } },
    { new: true }
  )

  if (!updatedSlot) {
    const existingSlot = await Slot.findOne({ date: deliveryDate, time: deliverySlot })

    if (existingSlot) {
      res.status(409)
      throw new Error('This time slot is full. Please choose another slot.')
    }

    // First booking for this slot — create it
    try {
      await Slot.create({ date: deliveryDate, time: deliverySlot, count: totalQty })
    } catch (err) {
      if (err.code === 11000) {
        // Race condition: another request created the slot simultaneously — retry
        const retry = await Slot.findOneAndUpdate(
          {
            date: deliveryDate,
            time: deliverySlot,
            count: { $lte: MAX_CAPACITY - totalQty },
          },
          { $inc: { count: totalQty } },
          { new: true }
        )
        if (!retry) {
          res.status(409)
          throw new Error('This time slot is now full. Please choose another slot.')
        }
      } else {
        throw err
      }
    }
  }

  const order = await PizzaOrder.create({
    items,
    deliveryDate,
    deliverySlot,
    totalQty,
    totalPrice,
  })

  res.status(201).json(order)
})

export { getSlots, createPizzaOrder }
