// One-off / cron-less runner for the weekly R2 orphan-cleanup sweep — for ops
// environments with no Redis (so the BullMQ repeatable job in server.js never
// gets scheduled) or for triggering an out-of-band run. Mirrors seeder.js's
// invocation style (`node backend/reconcileImages.js`); on Railway, run it
// from the service's Console tab.
//
// Usage:
//   node backend/reconcileImages.js            dry-run (or whatever
//                                               IMAGE_RECONCILE_DRY_RUN says)
//   node backend/reconcileImages.js --delete    force real deletion, regardless
//                                               of the env default
import dotenv from "dotenv";
import "colors";
dotenv.config();

const forceDelete = process.argv.includes("--delete");

const run = async () => {
  try {
    const { default: connectDB, disconnectDB } = await import("./config/db.js");
    await connectDB();
    const { reconcileImageStorage } = await import("./services/imageCleanup.js");

    const summary = await reconcileImageStorage(forceDelete ? { dryRun: false } : {});
    console.log(JSON.stringify(summary, null, 2)[summary.dryRun ? "yellow" : "green"] || "");
    console.log(
      (summary.dryRun ? "Dry run complete — nothing was deleted." : "Reconciliation complete.")[
        summary.dryRun ? "yellow" : "green"
      ]
    );

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

run();
