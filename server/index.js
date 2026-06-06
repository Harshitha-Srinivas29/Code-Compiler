require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { compileQueue, queueEvents } = require("./queue");
const { executeCodeStreaming } = require(
  process.env.NODE_ENV === "production" ? "./executor.prod" : "./executor"
);
const { fixCode, generateCode, analyzeComplexity } = require("./ai");

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://code-compiler-khaki.vercel.app/",
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], // explicitly allow both
});

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── AI: Fix error ──────────────────────────────────────────────
app.post("/ai/fix", async (req, res) => {
  const { code, language, error } = req.body;
  if (!code || !language || !error)
    return res.status(400).json({ error: "code, language and error are required" });
  try {
    const fixed = await fixCode({ code, language, error });
    res.json({ result: fixed });
  } catch (err) {
    console.error("[AI Fix]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: Generate code ──────────────────────────────────────────
app.post("/ai/generate", async (req, res) => {
  const { prompt, language } = req.body;
  if (!prompt || !language)
    return res.status(400).json({ error: "prompt and language are required" });
  try {
    const generated = await generateCode({ prompt, language });
    res.json({ result: generated });
  } catch (err) {
    console.error("[AI Generate]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: Analyze complexity ─────────────────────────────────────
app.post("/ai/analyze", async (req, res) => {
  const { code, language } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: "code and language are required" });
  try {
    const analysis = await analyzeComplexity({ code, language });
    res.json({ result: analysis });
  } catch (err) {
    console.error("[AI Analyze]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// REST endpoint (queue-backed, returns full result)
app.post("/compile", async (req, res) => {
  const { code, language, input } = req.body;
  if (!code || !language) {
    return res.status(400).json({ error: "code and language are required" });
  }
  try {
    const job = await compileQueue.add("run", { code, language, input });
    console.log(`[API] Job ${job.id} queued — ${language}`);
    const result = await job.waitUntilFinished(queueEvents, 20000);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(err.message.includes("timed out") ? 408 : 500)
       .json({ error: err.message });
  }
});

// WebSocket — streams output back line by line
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on("run", ({ code, language, input }) => {
    if (!code || !language) {
      socket.emit("error", "code and language are required");
      socket.emit("done");
      return;
    }

    console.log(`[Socket] Streaming run — ${language} — ${socket.id}`);

    // Clear previous output on the client
    socket.emit("start");

    executeCodeStreaming({
      code,
      language,
      input,
      onOutput: (chunk) => socket.emit("output", chunk),
      onError:  (chunk) => socket.emit("error",  chunk),
      onDone:   ()      => socket.emit("done"),
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));