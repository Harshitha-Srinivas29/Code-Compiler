import Editor from "@monaco-editor/react";

const LANGUAGE_MAP = {
  python: "python",
  cpp:    "cpp",
  c:      "c",
  java:   "java",
};

export default function CodeEditor({ language, value, onChange, theme = "vs-dark" }) {
  return (
    <Editor
      height="60vh"
      language={LANGUAGE_MAP[language] || "plaintext"}
      value={value}
      onChange={onChange}
      theme={theme}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "on",
      }}
    />
  );
}