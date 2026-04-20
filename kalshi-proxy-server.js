const https = require(“https”);
const http  = require(“http”);
const PORT  = process.env.PORT || 3001;

const CORS = {
“Access-Control-Allow-Origin”:  “*”,
“Access-Control-Allow-Methods”: “GET,POST,PUT,DELETE,PATCH,OPTIONS”,
“Access-Control-Allow-Headers”: “Content-Type,Authorization,KALSHI-ACCESS-KEY,KALSHI-ACCESS-TIMESTAMP,KALSHI-ACCESS-SIGNATURE”,
“Access-Control-Max-Age”: “86400”,
};

http.createServer((req, res) => {
// Set CORS on EVERY response including errors
Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

// Preflight
if (req.method === “OPTIONS”) {
res.writeHead(204);
res.end();
return;
}

// Strip optional /kalshi prefix
const kalshiPath = “/trade-api/v2” + req.url.replace(/^/kalshi/, “”);

const chunks = [];
req.on(“data”, c => chunks.push(c));
req.on(“end”, () => {
const body = chunks.length ? Buffer.concat(chunks) : null;

```
const fwdHeaders = {};
for (const [k, v] of Object.entries(req.headers)) {
  if (k.toLowerCase() !== "host") fwdHeaders[k] = v;
}
fwdHeaders["host"] = "demo-api.kalshi.co";
if (body) fwdHeaders["content-length"] = Buffer.byteLength(body);

const proxy = https.request(
  { hostname:"demo-api.kalshi.co", port:443, path:kalshiPath, method:req.method, headers:fwdHeaders },
  upstream => {
    const out = { ...upstream.headers, ...CORS };
    delete out["content-encoding"];
    res.writeHead(upstream.statusCode, out);
    upstream.pipe(res);
  }
);

proxy.on("error", err => {
  res.writeHead(502, { "Content-Type":"application/json", ...CORS });
  res.end(JSON.stringify({ error:"Proxy error", detail:err.message }));
});

if (body) proxy.write(body);
proxy.end();
```

});

}).listen(PORT, () => {
console.log(“Kalshi proxy running on port “ + PORT);
});
