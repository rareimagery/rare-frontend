"use client";

import { useEffect, useRef } from "react";

export default function LivePreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    // Extract just the JSX/component body from code fences if present
    const cleaned = code
      .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { margin: 0; background: #0a0a0a; }
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes rainbow { 0%{color:#ff0080} 25%{color:#00ffff} 50%{color:#ffff00} 75%{color:#00ff80} 100%{color:#ff0080} }
    @keyframes glitter { 0%,100%{opacity:1} 50%{opacity:0.5} }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    ${cleaned}

    // Render the default export or first function component found
    try {
      const Component = typeof exports !== 'undefined' && exports.default
        ? exports.default
        : null;
      if (Component) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
      }
    } catch(e) {
      document.getElementById('root').innerHTML =
        '<p style="color:#ff4444;padding:1rem;font-family:monospace">' + e.message + '</p>';
    }
  <\/script>
</body>
</html>`;

    iframeRef.current.srcdoc = html;
  }, [code]);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Generate a component to preview it here
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      className="w-full h-[400px] border-0"
      title="Component Preview"
    />
  );
}
