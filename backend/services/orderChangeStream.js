import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { emitOrderEvent, setChangeStreamActive } from "./orderEvents.js";

// MongoDB change stream on the orders collection — the authoritative source of
// order events for the SSE feed. Unlike controller-side emits, this also sees
// writes from other processes (seeder, a second API instance, manual mongosh
// edits). Requires mongod to run as a replica set; on a standalone server the
// stream errors out and we fall back to in-process emits (see orderEvents.js).
let stream = null;

export const startOrderChangeStream = () => {
  const coll = mongoose.connection.collection("orders");
  // fullDocument: deliver the post-update document so subscribers get the same
  // shape a controller emit would have produced.
  stream = coll.watch([], { fullDocument: "updateLookup" });

  stream.on("change", (change) => {
    if (change.operationType === "insert") {
      emitOrderEvent("created", change.fullDocument);
    } else if (
      (change.operationType === "update" || change.operationType === "replace") &&
      change.fullDocument
    ) {
      emitOrderEvent("updated", change.fullDocument);
    }
  });

  stream.on("error", (err) => {
    setChangeStreamActive(false);
    logger.warn(
      { err },
      "Order change stream failed — falling back to in-process order events"
    );
    stream.close().catch(() => {});
    stream = null;
  });

  setChangeStreamActive(true);
  logger.info("Order change stream active (MongoDB replica set)");
};

export const stopOrderChangeStream = async () => {
  setChangeStreamActive(false);
  if (stream) {
    await stream.close().catch(() => {});
    stream = null;
  }
};
