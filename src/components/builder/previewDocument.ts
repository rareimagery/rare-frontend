export function buildPreviewDocument(code: string): string {
  const cleaned = code
    .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RareImagery Builder Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { margin: 0; background: #0a0a0a; color: #f4f4f5; }
    .ri-shell { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root" class="ri-shell"></div>
  <script type="text/babel" data-presets="react">
    ${cleaned}

    try {
      const root = ReactDOM.createRoot(document.getElementById("root"));
      if (typeof App === "function") {
        root.render(React.createElement(App));
      } else if (typeof Component === "function") {
        root.render(React.createElement(Component));
      } else {
        root.render(React.createElement("div", { style: { padding: "1rem", fontFamily: "monospace", color: "#fbbf24" } }, "Define App or Component for preview."));
      }
    } catch (e) {
      document.getElementById("root").innerHTML =
        '<p style="color:#ff4444;padding:1rem;font-family:monospace">' + (e?.message || "Preview render failed") + '</p>';
    }
  <\/script>
</body>
</html>`;
}
