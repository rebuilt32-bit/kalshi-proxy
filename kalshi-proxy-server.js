// kalshi-proxy-server.js
// Deploy this to Railway or Render — free tier, no credit card needed.
// Your iPhone bot connects to the deployed URL instead of localhost.

const https = require(“https”);
const http  = require(“http”);

const PORT        = process.env.PORT || 3001;
const KALSHI_HOST = “demo-api.kalshi.co”;
const KALSHI_BASE = “/trade-api/v2”;

// ── Allowed origins (add your Claude artifact origin if needed) ──
const ALLOWED = [
“https://claude.ai”,
“https://artifacts.claude.ai”,
“http://localhost”,
“http://localhost:5173”,
“http://localhost:3000”,
];

function corsHeaders(origin) {
const allowed = ALLOWED.some(o => origin?.startsWith(o)) ? origin : ALLOWED[0];
return {
“Access-Control-Allow-Origin”:  allowed,
“Access-Control-Allow-Methods”: “GET,POST,PUT,DELETE,OPTIONS”,
“Access-Control-Allow-Headers”: “Content-Type,KALSHI-ACCESS-KEY,KALSHI-ACCESS-TIMESTAMP,KALSHI-ACCESS-SIGNATURE,Authorization”,
“Access-Control-Max-Age”:       “86400”,
};
}

const server = http.createServer((req, res) => {
const origin = req.headers[“origin”] || “”;
const cors   = corsHeaders(origin);

// Preflight
if (req.method === “OPTIONS”) {
res.writeHead(200, cors);
res.end();
return;
}

// Strip /kalshi prefix if present
const path = req.url.replace(/^/kalshi/, “”);
const target = KALSHI_BASE + path;

const chunks = [];
req.on(“data”, c => chunks.push(c));
req.on(“end”, () => {
const body = chunks.length ? Buffer.concat(chunks) : null;

```
// Forward headers (drop host)
const fwdHeaders = { ...req.headers, host: KALSHI_HOST };
delete fwdHeaders["content-length"];
if (body) fwdHeaders["content-length"] = Buffer.byteLength(body);

const opts = {
  hostname: KALSHI_HOST,
  port:     443,
  path:     target,
  method:   req.method,
  headers:  fwdHeaders,
};

const proxy = https.request(opts, upstream => {
  const responseHeaders = { ...upstream.headers, ...cors };
  // Remove conflicting CORS headers from upstream
  delete responseHeaders["access-control-allow-origin"];
  res.writeHead(upstream.statusCode, responseHeaders);
  upstream.pipe(res);
});

proxy.on("error", err => {
  console.error("Proxy error:", err.message);
  res.writeHead(502, { ...cors, "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Proxy error", detail: err.message }));
});

if (body) proxy.write(body);
proxy.end();
```

});
});

server.listen(PORT, () => {
console.log(`✓ Kalshi proxy running on port ${PORT}`);
console.log(`  Forwarding → https://${KALSHI_HOST}${KALSHI_BASE}`);
});
