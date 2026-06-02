import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Editor } from '@monaco-editor/react';
import Navbar from './Navbar';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000');
const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const DEFAULT_CODE = {
  python:     "# Enter your code here",
  c:          "// Enter your code here",
  cpp:        "// Enter your code here",
  java:       "// Enter your code here",
  javascript: "// Enter your code here",
};

function App() {
  const [userCode, setUserCode]       = useState('');
  const [userLang, setUserLang]       = useState("python");
  const [userTheme, setUserTheme]     = useState("vs-dark");
  const [fontSize, setFontSize]       = useState(14);
  const [userInput, setUserInput]     = useState("");
  const [userOutput, setUserOutput]   = useState("");
  const [userError, setUserError]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [hasOutput, setHasOutput]     = useState(false);

  // AI state
  const [aiLoading, setAiLoading]     = useState(""); // "fix" | "generate" | "analyze" | ""
  const [aiResult, setAiResult]       = useState("");  // complexity analysis result
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");

  // Resizer
  const [leftWidth, setLeftWidth]     = useState(62);
  const [isDragging, setIsDragging]   = useState(false);
  const mainRef   = useRef(null);
  const outputRef = useRef(null);

  function handleLangChange(lang) {
    setUserLang(lang);
    setUserCode('');
    setAiResult('');
  }

  // ── Socket events ──────────────────────────────
  useEffect(() => {
    socket.on("start", () => {
      setUserOutput(""); setUserError("");
      setHasOutput(false); setAiResult("");
      setLoading(true);
    });
    socket.on("output", (chunk) => { setHasOutput(true); setUserOutput(p => p + chunk); });
    socket.on("error",  (chunk) => { setHasOutput(true); setUserError(p => p + chunk); });
    socket.on("done",   ()      => setLoading(false));
    return () => { socket.off("start"); socket.off("output"); socket.off("error"); socket.off("done"); };
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [userOutput, userError]);

  // ── Resizer ────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.classList.add('no-select');
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      if (!mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(80, Math.max(20, pct)));
    };
    const onMouseUp = () => { setIsDragging(false); document.body.classList.remove('no-select'); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [isDragging]);

  // ── Run ────────────────────────────────────────
  function compile() {
    if (!userCode.trim() || loading) return;
    socket.emit("run", { code: userCode, language: userLang, input: userInput });
  }

  function clearOutput() {
    setUserOutput(""); setUserError(""); setHasOutput(false); setAiResult("");
  }

  // ── AI: Fix ────────────────────────────────────
  async function handleFix() {
    if (!userError || !userCode) return;
    setAiLoading("fix");
    try {
      const res = await fetch(`${API}/ai/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userCode, language: userLang, error: userError })
      });
      const data = await res.json();
      if (data.result) setUserCode(data.result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading("");
    }
  }

  // ── AI: Generate ───────────────────────────────
  async function handleGenerate() {
    if (!generatePrompt.trim()) return;
    setAiLoading("generate");
    try {
      const res = await fetch(`${API}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt, language: userLang })
      });
      const data = await res.json();
      if (data.result) { setUserCode(data.result); setShowGenerate(false); setGeneratePrompt(""); }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading("");
    }
  }

  // ── AI: Analyze ────────────────────────────────
  async function handleAnalyze() {
    if (!userCode.trim()) return;
    setAiLoading("analyze");
    setAiResult("");
    try {
      const res = await fetch(`${API}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userCode, language: userLang })
      });
      const data = await res.json();
      if (data.result) setAiResult(data.result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading("");
    }
  }

  const editorOptions = {
    fontSize, fontFamily: "'Geist Mono', monospace", fontLigatures: true,
    minimap: { enabled: false }, scrollBeyondLastLine: false,
    automaticLayout: true, tabSize: 4, wordWrap: "on", lineHeight: 1.7,
    padding: { top: 16, bottom: 16 }, renderLineHighlight: "none",
    overviewRulerLanes: 0, scrollbar: { vertical: "hidden", horizontal: "hidden" },
  };

  return (
    <div className="App">
      <Navbar
        userLang={userLang}   setUserLang={handleLangChange}
        userTheme={userTheme} setUserTheme={setUserTheme}
        fontSize={fontSize}   setFontSize={setFontSize}
        onGenerate={() => setShowGenerate(true)}
        onAnalyze={handleAnalyze}
        aiLoading={aiLoading}
      />

      {/* ── Generate modal ── */}
      {showGenerate && (
        <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Generate Code</span>
              <button className="modal-close" onClick={() => setShowGenerate(false)}>✕</button>
            </div>
            <textarea
              className="modal-input"
              placeholder={`Describe what you want in ${userLang}...\ne.g. "binary search function" or "linked list with insert and delete"`}
              value={generatePrompt}
              onChange={e => setGeneratePrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
              autoFocus
            />
            <div className="modal-footer">
              <span className="modal-hint">⌘ Enter to generate</span>
              <button
                className="modal-btn"
                onClick={handleGenerate}
                disabled={aiLoading === "generate" || !generatePrompt.trim()}
              >
                {aiLoading === "generate" ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main" ref={mainRef}>

        {/* ── LEFT: Editor ── */}
        <div className="left-container" style={{ width: `${leftWidth}%` }}>
          <div className="editor-wrapper">
            <Editor
              options={editorOptions}
              height="100%"
              width="100%"
              theme={userTheme}
              language={userLang}
              defaultLanguage="python"
              value={userCode || DEFAULT_CODE[userLang]}
              onChange={(value) => setUserCode(value || '')}
            />
          </div>

          {/* Complexity result bar */}
          {aiResult && (
            <div className="complexity-bar">
              <span className="complexity-label">AI Analysis</span>
              <pre className="complexity-text">{aiResult}</pre>
              <button className="complexity-close" onClick={() => setAiResult("")}>✕</button>
            </div>
          )}

          {aiLoading === "analyze" && (
            <div className="complexity-bar complexity-loading">
              <span className="complexity-label">Analyzing...</span>
              <div className="spinner-box" style={{ padding: "4px 0" }}>
                <div className="spinner-dot" /><div className="spinner-dot" /><div className="spinner-dot" />
              </div>
            </div>
          )}

          <div className="editor-footer">
            <span className="lang-badge">{userLang}</span>
            <button className="run-btn" onClick={compile} disabled={loading || !!aiLoading}>
              <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 2L11 7L3 12V2Z" fill="currentColor"/>
              </svg>
              {loading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* ── RESIZER ── */}
        <div className={`resizer ${isDragging ? 'dragging' : ''}`} onMouseDown={onMouseDown}>
          <div className="resizer-grip"><span /><span /><span /></div>
        </div>

        {/* ── RIGHT: I/O ── */}
        <div className="right-container">
          <div className="panel-section">
            <div className="panel-label">
              <span>stdin</span>
              <div className={`dot ${userInput ? 'active' : ''}`} />
            </div>
            <textarea
              className="code-inp"
              placeholder="Program input (optional)"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>

          <div className="panel-section">
            <div className="panel-label">
              <span>stdout</span>
              <div className={`dot ${hasOutput ? 'active' : ''}`} />
            </div>

            <div className="output-box" ref={outputRef}>
              {loading && !hasOutput && (
                <div className="spinner-box">
                  <div className="spinner-dot" /><div className="spinner-dot" /><div className="spinner-dot" />
                </div>
              )}
              {userError
                ? <pre className="error-output">{userError}</pre>
                : <pre>{userOutput}</pre>
              }
            </div>

            <div className="output-actions">
              {userError && (
                <button
                  className="ai-fix-btn"
                  onClick={handleFix}
                  disabled={aiLoading === "fix"}
                >
                  {aiLoading === "fix" ? "Fixing..." : "✦ Fix with AI"}
                </button>
              )}
              <button className="clear-btn" onClick={clearOutput}>clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;