const fs = require("fs");
const path = require("path");
const BT = String.fromCharCode(96);
const SQ = String.fromCharCode(39);
const outPath = path.join("c:", "rare", "frontend", "src", "components", "themes", "NeonTheme.tsx");

const styleCSS = ".neon-page {
" +
"          font-family: " + SQ + "Inter" + SQ + ", " + SQ + "Segoe UI" + SQ + ", system-ui, -apple-system, sans-serif;
" +
"}
" +
".neon-glass-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
" +
".neon-glass-card:hover { transform: translateY(-4px); box-shadow: 0 0 24px rgba(168,85,247,0.35), 0 8px 32px rgba(0,0,0,0.4); border-color: rgba(168,85,247,0.4); }
" +
".neon-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }
" +
".neon-cta:hover { transform: scale(1.04); box-shadow: 0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(6,182,212,0.3); }
" +
".neon-stat-value { text-shadow: 0 0 12px rgba(168,85,247,0.6), 0 0 24px rgba(168,85,247,0.3); }
" +
".neon-follower-glow:hover { box-shadow: 0 0 20px rgba(6,182,212,0.4); }
" +
".neon-pill { transition: transform 0.15s ease, box-shadow 0.15s ease; }
" +
".neon-pill:hover { transform: scale(1.06); box-shadow: 0 0 16px rgba(168,85,247,0.4); }";

// Read the template
let tmpl = fs.readFileSync(path.join("c:", "rare", "frontend", "src", "components", "themes", "NeonTheme.tsx"), "utf8");
// Replace placeholders
tmpl = tmpl.replace(/BACKTICK/g, BT);
tmpl = tmpl.replace("STYLECSSHERE", styleCSS);
fs.writeFileSync(outPath, tmpl, "utf8");
console.log("Final written", tmpl.length, "chars");