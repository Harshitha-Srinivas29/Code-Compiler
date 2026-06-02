const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

const LANGUAGE_CONFIG = {
  python:     { cmd: "python3", filename: "solution.py" },
  cpp:        { cmd: null,      filename: "solution.cpp" },
  c:          { cmd: null,      filename: "solution.c"   },
  java:       { cmd: null,      filename: "Main.java"    },
  javascript: { cmd: "node",   filename: "solution.js"  },
};

const TIMEOUT_MS = 15000;

function buildCommand(language, tmpDir, filename) {
  const filePath = path.join(tmpDir, filename);
  switch (language) {
    case "python":     return `python3 "${filePath}"`;
    case "javascript": return `node "${filePath}"`;
    case "cpp":        return `g++ -o "${path.join(tmpDir, 'solution')}" "${filePath}" && "${path.join(tmpDir, 'solution')}"`;
    case "c":          return `gcc -o "${path.join(tmpDir, 'solution')}" "${filePath}" && "${path.join(tmpDir, 'solution')}"`;
    case "java":       return `javac "${filePath}" && java -cp "${tmpDir}" Main`;
    default: throw new Error(`Unsupported language: ${language}`);
  }
}

function executeCode({ code, language, input }) {
  return new Promise((resolve, reject) => {
    const config = LANGUAGE_CONFIG[language];
    if (!config) return reject(new Error(`Unsupported language: ${language}`));

    const runId = uuidv4();
    const tmpDir = path.join(os.tmpdir(), `compiler-${runId}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, config.filename), code);

    const cmd = buildCommand(language, tmpDir, config.filename);

    const proc = exec(cmd, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
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

function executeCodeStreaming({ code, language, input, onOutput, onError, onDone }) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) { onError(`Unsupported language: ${language}`); onDone(); return; }

  const runId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `compiler-${runId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, config.filename), code);

  const cmd = buildCommand(language, tmpDir, config.filename);
  const proc = exec(cmd, { timeout: TIMEOUT_MS });

  proc.stdout.on("data", (chunk) => onOutput(chunk.toString()));
  proc.stderr.on("data", (chunk) => onError(chunk.toString()));

  proc.on("close", (code, signal) => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (signal === "SIGTERM") onError("Time limit exceeded (15s)");
    onDone();
  });

  proc.on("error", (err) => { onError(err.message); onDone(); });

  if (input) proc.stdin.write(input);
  proc.stdin.end();
}

module.exports = { executeCode, executeCodeStreaming };