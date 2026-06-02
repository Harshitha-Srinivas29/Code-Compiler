const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 1. Fix with AI ─────────────────────────────────────────────
async function fixCode({ code, language, error }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an expert ${language} developer. 
The following code has an error. Return ONLY the fixed code with no explanation, no markdown, no backticks — just the raw fixed code.

Language: ${language}
Error:
${error}

Code:
${code}`
    }]
  });
  return response.content[0].text.trim();
}

// ── 2. Generate Code ───────────────────────────────────────────
async function generateCode({ prompt, language }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an expert ${language} developer.
Generate ${language} code for the following request. Return ONLY the raw code with no explanation, no markdown, no backticks.

Request: ${prompt}`
    }]
  });
  return response.content[0].text.trim();
}

// ── 3. Analyze Complexity ──────────────────────────────────────
async function analyzeComplexity({ code, language }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are an expert ${language} developer and algorithms specialist.
Analyze the time and space complexity of the following code.
Respond in this exact format and nothing else:

Time Complexity: O(?)
Space Complexity: O(?)

Explanation: 2-3 sentences max explaining why.

Language: ${language}
Code:
${code}`
    }]
  });
  return response.content[0].text.trim();
}

module.exports = { fixCode, generateCode, analyzeComplexity };