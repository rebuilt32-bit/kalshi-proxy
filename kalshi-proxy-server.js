var https = require(“https”);
var http = require(“http”);
var PORT = process.env.PORT || 3001;

http.createServer(function(req, res) {
res.setHeader(“Access-Control-Allow-Origin”, “*”);
res.setHeader(“Access-Control-Allow-Methods”, “GET,POST,PUT,DELETE,OPTIONS”);
res.setHeader(“Access-Control-Allow-Headers”, “Content-Type,KALSHI-ACCESS-KEY,KALSHI-ACCESS-TIMESTAMP,KALSHI-ACCESS-SIGNATURE”);

if (req.method === “OPTIONS”) {
res.writeHead(200);
res.end();
return;
}

var path = “/trade-api/v2” + req.url;
var body = [];

req.on(“data”, function(chunk) { body.push(chunk); });

req.on(“end”, function() {
var data = body.length ? Buffer.concat(body) : null;

```
var headers = {};
var keys = Object.keys(req.headers);
for (var i = 0; i < keys.length; i++) {
  if (keys[i] !== "host") headers[keys[i]] = req.headers[keys[i]];
}
headers["host"] = "demo-api.kalshi.co";
if (data) headers["content-length"] = Buffer.byteLength(data);

var options = {
  hostname: "demo-api.kalshi.co",
  port: 443,
  path: path,
  method: req.method,
  headers: headers
};

var proxy = https.request(options, function(upstream) {
  var outHeaders = {};
  var upKeys = Object.keys(upstream.headers);
  for (var j = 0; j < upKeys.length; j++) {
    outHeaders[upKeys[j]] = upstream.headers[upKeys[j]];
  }
  outHeaders["Access-Control-Allow-Origin"] = "*";
  res.writeHead(upstream.statusCode, outHeaders);
  upstream.pipe(res);
});

proxy.on("error", function(err) {
  res.writeHead(502);
  res.end(JSON.stringify({ error: err.message }));
});

if (data) proxy.write(data);
proxy.end();
```

});

}).listen(PORT, function() {
console.log(“proxy running on port “ + PORT);
});
