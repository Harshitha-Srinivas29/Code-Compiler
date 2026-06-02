import React from "react";
import './Navbar.css';

const Navbar = ({
  userLang, setUserLang,
  userTheme, setUserTheme,
  fontSize, setFontSize,
  onGenerate, onAnalyze, aiLoading
}) => {

  const languages = [
    { value: "c",          label: "C"          },
    { value: "cpp",        label: "C++"        },
    { value: "python",     label: "Python"     },
    { value: "java",       label: "Java"       },
    { value: "javascript", label: "JavaScript" },
  ];

  const themes = [
    { value: "vs-dark", label: "Dark"  },
    { value: "light",   label: "Light" },
  ];

  return (
    <nav className="navbar">

      {/* Logo */}
      <div className="navbar-logo">
        <div className="navbar-logo-icon">
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L1 7L3 9.5" stroke="#0e0e0e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 4.5L13 7L11 9.5" stroke="#0e0e0e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 2L5.5 12" stroke="#0e0e0e" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3>compiler</h3>
      </div>

      <div className="navbar-divider" />

      {/* Controls */}
      <div className="navbar-controls">
        <div className="select-wrapper">
          <select value={userLang} onChange={(e) => setUserLang(e.target.value)}>
            {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <div className="select-wrapper">
          <select value={userTheme} onChange={(e) => setUserTheme(e.target.value)}>
            {themes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="navbar-divider" />

        <div className="font-control">
          <label>Font</label>
          <input
            type="range" min="12" max="28" step="1"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          <span className="font-size-val">{fontSize}</span>
        </div>
      </div>

      {/* AI Buttons */}
      <div className="navbar-right">
        <button
          className="nav-ai-btn"
          onClick={onGenerate}
          disabled={!!aiLoading}
          title="Generate code from description"
        >
          ✦ Generate
        </button>

        <button
          className="nav-ai-btn nav-ai-btn--outline"
          onClick={onAnalyze}
          disabled={!!aiLoading}
          title="Analyze time & space complexity"
        >
          {aiLoading === "analyze" ? "Analyzing..." : "⊙ Complexity"}
        </button>

        <div className="navbar-divider" />

        <div className="status-pill">
          <div className="status-dot" />
          ready
        </div>
      </div>

    </nav>
  );
};

export default Navbar;