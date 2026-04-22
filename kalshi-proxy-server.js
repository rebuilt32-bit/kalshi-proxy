var https = require('https');
var http = require('http');
var PORT = process.env.PORT || 3001;

http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,KALSHI-ACCESS-KEY,KALSHI-ACCESS-TIMESTAMP,KALSHI-ACCESS-SIGNATURE');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  var kalshiPath = '/trade-api/v2' + req.url;
  var chunks = [];

  req.on('data', function(c) { chunks.push(c); });

  req.on('end', function() {
    var body = chunks.length ? Buffer.concat(chunks) : null;
    var h = {};
    Object.keys(req.headers).forEach(function(k) {
      if (k !== 'host') h[k] = req.headers[k];
    });
    h['host'] = 'demo-api.kalshi.co';
    if (body) h['content-length'] = Buffer.byteLength(body);

    var pr = https.request({
      hostname: 'demo-api.kalshi.co',
      port: 443,
      path: kalshiPath,
      method: req.method,
      headers: h
    }, function(up) {
      var out = {};
      Object.keys(up.headers).forEach(function(k) { out[k] = up.headers[k]; });
      out['Access-Control-Allow-Origin'] = '*';
      res.writeHead(up.statusCode, out);
      up.pipe(res);
    });

    pr.on('error', function(e) {
      res.writeHead(502);
      res.end(e.message);
    });

    if (body) pr.write(body);
    pr.end();
  });

}).listen(PORT, function() {
  console.log('proxy on port ' + PORT);
});
