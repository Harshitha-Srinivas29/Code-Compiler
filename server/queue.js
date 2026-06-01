const { Queue, Worker, QueueEvents } = require("bullmq");
const { executeCode } = require("./executor");

const connection = {
  host: "localhost",
  port: 6379,
};

// The queue — jobs get added here
const compileQueue = new Queue("compile", { connection });

// The worker — picks up jobs and runs them
const compileWorker = new Worker(
  "compile",
  async (job) => {
    const { code, language, input } = job.data;
    console.log(`[Worker] Processing job ${job.id} — ${language}`);
    const result = await executeCode({ code, language, input });
    return result; // { output, error }
  },
  {
    connection,
    concurrency: 3, // process up to 3 jobs simultaneously
  }
);

// Queue events — for logging
const queueEvents = new QueueEvents("compile", { connection });

queueEvents.on("completed", ({ jobId }) => {
  console.log(`[Queue] Job ${jobId} completed`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`[Queue] Job ${jobId} failed: ${failedReason}`);
});

compileWorker.on("error", (err) => {
  console.error("[Worker] Error:", err);
});

module.exports = { compileQueue, queueEvents };