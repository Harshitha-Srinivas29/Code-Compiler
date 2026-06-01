const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

const LANGUAGE_CONFIG = {
  python: { image: "compiler-python", filename: "solution.py" },
  cpp:    { image: "compiler-cpp",    filename: "solution.cpp" },
  c:      { image: "compiler-c",      filename: "solution.c" },
  java:   { image: "compiler-java",   filename: "Main.java" },
  javascript: { image: "compiler-node", filename: "solution.js" },
};

const TIMEOUT_MS = 15000;

function toDockerPath(p) {
  return p.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);
}

// Original: used by the queue worker, returns full result
function executeCode({ code, language, input }) {
  return new Promise((resolve, reject) => {
    const config = LANGUAGE_CONFIG[language];
    if (!config) return reject(new Error(`Unsupported language: ${language}`));

    const runId = uuidv4();
    const tmpDir = path.join(os.tmpdir(), `compiler-${runId}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, config.filename), code);

    const dockerCmd = [
      "docker run --rm",
      `--memory=128m`,
      `--cpus=0.5`,
      `--ulimit nproc=50`,
      `-v "${toDockerPath(tmpDir)}:/code"`,
      config.image,
    ].join(" ");

    console.log("Running:", dockerCmd);

    const proc = exec(dockerCmd, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (error && error.killed) {
        return resolve({ output: "", error: "Time limit exceeded (15s)" });
      }
      resolve({ output: stdout, error: stderr });
    });

    if (input) proc.stdin.write(input);
    proc.stdin.end();
  });
}

// New: streams stdout/stderr line-by-line via callbacks
function executeCodeStreaming({ code, language, input, onOutput, onError, onDone }) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    onError(`Unsupported language: ${language}`);
    onDone();
    return;
  }

  const runId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `compiler-${runId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, config.filename), code);

  const dockerCmd = [
    "docker run --rm",
    `--memory=128m`,
    `--cpus=0.5`,
    `--ulimit nproc=50`,
    `-v "${toDockerPath(tmpDir)}:/code"`,
    config.image,
  ].join(" ");

  console.log("Streaming:", dockerCmd);

  const proc = exec(dockerCmd, { timeout: TIMEOUT_MS });

  // Stream stdout line by line
  proc.stdout.on("data", (chunk) => {
    onOutput(chunk.toString());
  });

  // Stream stderr line by line  
  proc.stderr.on("data", (chunk) => {
    onError(chunk.toString());
  });

  proc.on("close", (code, signal) => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (signal === "SIGTERM") {
      onError("Time limit exceeded (15s)");
    }
    onDone();
  });

  proc.on("error", (err) => {
    onError(err.message);
    onDone();
  });

  if (input) proc.stdin.write(input);
  proc.stdin.end();
}

module.exports = { executeCode, executeCodeStreaming };