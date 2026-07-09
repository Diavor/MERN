import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

slotSchema.index({ date: 1, time: 1 }, { unique: true });

const Slot = mongoose.model("Slot", slotSchema);
export default Slot;
