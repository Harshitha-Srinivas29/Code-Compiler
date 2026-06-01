import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Editor } from '@monaco-editor/react';
import Navbar from './Navbar';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

const DEFAULT_CODE = {
  python:     "# Enter your code here",
  c:          "// Enter your code here",
  cpp:        "// Enter your code here",
  java:       "// Enter your code here",
  javascript: "// Enter your code here",
};

function App() {
  const [userCode, setUserCode]     = useState('');
  const [userLang, setUserLang]     = useState("python");
  const [userTheme, setUserTheme]   = useState("vs-dark");
  const [fontSize, setFontSize]     = useState(14);
  const [userInput, setUserInput]   = useState("");
  const [userOutput, setUserOutput] = useState("");
  const [userError, setUserError]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [hasOutput, setHasOutput]   = useState(false);

   function handleLangChange(lang) {
    setUserLang(lang);
    setUserCode('');
  }

  // Resizer state
  const [leftWidth, setLeftWidth]   = useState(62); // percent
  const [isDragging, setIsDragging] = useState(false);
  const mainRef    = useRef(null);
  const outputRef  = useRef(null);

  // ── Socket events ──────────────────────────────
  useEffect(() => {
    socket.on("start", () => {
      setUserOutput("");
      setUserError("");
      setHasOutput(false);
      setLoading(true);
    });
    socket.on("output", (chunk) => {
      setHasOutput(true);
      setUserOutput((prev) => prev + chunk);
    });
    socket.on("error", (chunk) => {
      setHasOutput(true);
      setUserError((prev) => prev + chunk);
    });
    socket.on("done", () => setLoading(false));

    return () => {
      socket.off("start");
      socket.off("output");
      socket.off("error");
      socket.off("done");
    };
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [userOutput, userError]);

  // ── Resizer drag logic ─────────────────────────
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
      const newLeftPct = ((e.clientX - rect.left) / rect.width) * 100;
      // clamp between 20% and 80%
      setLeftWidth(Math.min(80, Math.max(20, newLeftPct)));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('no-select');
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // ── Actions ────────────────────────────────────
  function compile() {
    if (!userCode.trim() || loading) return;
    socket.emit("run", { code: userCode, language: userLang, input: userInput });
  }

  function clearOutput() {
    setUserOutput("");
    setUserError("");
    setHasOutput(false);
  }

  const editorOptions = {
    fontSize: fontSize,
    fontFamily: "'Geist Mono', 'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    wordWrap: "on",
    lineHeight: 1.7,
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: "none",
    overviewRulerLanes: 0,
    scrollbar: { vertical: "hidden", horizontal: "hidden" },
  };

  return (
    <div className="App">
      <Navbar
        userLang={userLang}   setUserLang={handleLangChange}
        userTheme={userTheme} setUserTheme={setUserTheme}
        fontSize={fontSize}   setFontSize={setFontSize}
      />

      <div className="main" ref={mainRef}>

        {/* ── LEFT: Editor ── */}
        <div
          className="left-container"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="editor-wrapper">
            <Editor
              options={editorOptions}
              height="100%"
              width="100%"
              theme={userTheme}
              language={userLang}
              value={userCode || DEFAULT_CODE[userLang]}
              onChange={(value) => setUserCode(value || '')}
            />
          </div>

          <div className="editor-footer">
            <span className="lang-badge">{userLang}</span>
            <button className="run-btn" onClick={compile} disabled={loading}>
              <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 2L11 7L3 12V2Z" fill="currentColor"/>
              </svg>
              {loading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* ── RESIZER ── */}
        <div
          className={`resizer ${isDragging ? 'dragging' : ''}`}
          onMouseDown={onMouseDown}
        >
          <div className="resizer-grip">
            <span /><span /><span />
          </div>
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
                  <div className="spinner-dot" />
                  <div className="spinner-dot" />
                  <div className="spinner-dot" />
                </div>
              )}
              {userError
                ? <pre className="error-output">{userError}</pre>
                : <pre>{userOutput}</pre>
              }
            </div>

            <div className="output-actions">
              <button className="clear-btn" onClick={clearOutput}>clear</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;