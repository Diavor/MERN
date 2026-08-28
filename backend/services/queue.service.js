import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { sendOrderConfirmation } from "./email.service.js";

// BullMQ job queues backed by Redis. Workers run in-process — right-sized for a
// single-instance deployment; to scale out, move the Worker construction into a
// separate worker process and deploy it independently (queue definitions and
// handlers stay as they are).
//
// Degradation: in tests, or when Redis is unreachable, jobs run inline
// (fire-and-forget) so the request path never depends on Redis being up.
//
// Image optimization (resize + WebP conversion) is NOT a queue job — it runs
// synchronously inside storage.service.js's persistUpload, before a URL is
// ever returned (see that file's header comment for why format conversion
// can't safely happen after the fact). The IMAGES queue instead carries
// deletion work: cleaning up an orphaned upload is safe to defer/retry,
// unlike minting the URL a client is about to persist.
export const QUEUE = { EMAILS: "emails", IMAGES: "images" };
export const JOB = {
  ORDER_CONFIRMATION: "order-confirmation",
  DELETE_IMAGE: "delete-image",
  RECONCILE_IMAGES: "reconcile-images",
};

// Job handlers are imported lazily inside the dispatcher (not at module top
// level) to avoid a require cycle: imageCleanup.js pulls in the mongoose
// models, which is fine, but keeping this file's only load-bearing top-level
// imports to email/logger keeps it cheap to import from contexts (like a
// one-off script) that don't need Mongoose wired up yet.
const processors = {
  [QUEUE.EMAILS]: async (job) => {
    if (job.name === JOB.ORDER_CONFIRMATION) return sendOrderConfirmation(job.data);
    throw new Error(`Unknown email job: ${job.name}`);
  },
  [QUEUE.IMAGES]: async (job) => {
    const { deleteImageIfUnreferenced, reconcileImageStorage } =
      await import("./imageCleanup.js");
    if (job.name === JOB.DELETE_IMAGE) return deleteImageIfUnreferenced(job.data);
    if (job.name === JOB.RECONCILE_IMAGES) return reconcileImageStorage(job.data);
    throw new Error(`Unknown image job: ${job.name}`);
  },
};

const queues = {};
const workers = [];
const connections = [];

const enabled = !env.isTest && Boolean(env.REDIS_URL);

if (enabled) {
  // BullMQ in native ESM needs pre-constructed clients. Workers each get their
  // own connection (they hold a blocking BRPOPLPUSH); queues share one.
  const makeConnection = () => {
    const conn = new IORedis(env.REDIS_URL, {
      // BullMQ workers hold a blocking connection; retries must not be capped.
      maxRetriesPerRequest: null,
    });
    conn.on("error", (err) =>
      logger.warn({ err: err.message }, "Redis connection error")
    );
    connections.push(conn);
    return conn;
  };
  const queueConnection = makeConnection();

  for (const name of Object.values(QUEUE)) {
    queues[name] = new Queue(name, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 200, // keep recent history for the dashboard
        removeOnFail: 500,
      },
    });
    queues[name].on("error", (err) =>
      logger.warn({ err, queue: name }, "Queue connection error")
    );

    const worker = new Worker(name, processors[name], { connection: makeConnection() });
    worker.on("completed", (job) =>
      logger.debug({ queue: name, job: job.name, id: job.id }, "Job completed")
    );
    worker.on("failed", (job, err) =>
      logger.error({ queue: name, job: job?.name, id: job?.id, err }, "Job failed")
    );
    worker.on("error", (err) => logger.warn({ err, queue: name }, "Worker error"));
    workers.push(worker);
  }
}

export const queuesEnabled = () => enabled;

/** Queue instances, for the bull-board dashboard. Empty when disabled. */
export const getQueues = () => Object.values(queues);

/**
 * Enqueue a background job. Falls back to inline (best-effort, off the request
 * path) execution when queues are disabled or the enqueue fails.
 */
export const enqueue = async (queueName, jobName, data) => {
  const runInline = () =>
    setImmediate(() =>
      processors[queueName]({ name: jobName, data }).catch((err) =>
        logger.error({ err, queue: queueName, job: jobName }, "Inline job failed")
      )
    );

  const q = queues[queueName];
  if (!q) return runInline();

  try {
    await q.add(jobName, data);
  } catch (err) {
    logger.warn(
      { err, queue: queueName, job: jobName },
      "Enqueue failed — running inline"
    );
    runInline();
  }
};

/**
 * Register a recurring job on a cron schedule (BullMQ `repeat.pattern`).
 * Requires Redis — there's nothing to drive a schedule when queues are
 * disabled (no cron, no long-lived timer), so this is a documented no-op in
 * that case; callers that need the work to happen regardless (e.g. the image
 * reconciliation sweep) should also expose a directly-callable function for
 * a manual/scripted run. `jobId` is derived from `jobName` so re-registering
 * on every boot updates the existing repeatable job instead of duplicating it.
 * @returns {Promise<boolean>} whether the job was actually scheduled.
 */
export const scheduleRepeatable = async (queueName, jobName, data, { pattern }) => {
  const q = queues[queueName];
  if (!q) {
    logger.info(
      { queue: queueName, job: jobName },
      "Repeatable job not scheduled — queues disabled (no REDIS_URL); run it manually instead"
    );
    return false;
  }
  await q.add(jobName, data, { repeat: { pattern }, jobId: `repeatable:${jobName}` });
  logger.info({ queue: queueName, job: jobName, pattern }, "Repeatable job scheduled");
  return true;
};

/** Graceful shutdown: stop taking jobs, then close queue connections. */
export const closeQueues = async () => {
  await Promise.allSettled(workers.map((w) => w.close()));
  await Promise.allSettled(Object.values(queues).map((q) => q.close()));
  // External connections are owned by us, not BullMQ — quit them explicitly.
  await Promise.allSettled(connections.map((c) => c.quit()));
};
