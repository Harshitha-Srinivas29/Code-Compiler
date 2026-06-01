const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { compileQueue, queueEvents } = require("./queue");
const { executeCodeStreaming } = require("./executor");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

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