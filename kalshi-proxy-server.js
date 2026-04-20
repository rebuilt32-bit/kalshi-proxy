const https=require("https"),http=require("http");
const PORT=process.env.PORT||3001;
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type,KALSHI-ACCESS-KEY,KALSHI-ACCESS-TIMESTAMP,KALSHI-ACCESS-SIGNATURE"};
http.createServer((req,res)=>{
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  if(req.method==="OPTIONS"){res.writeHead(200);res.end();return;}
  const path=req.url.replace(/^\/kalshi/,"");
  const chunks=[];
  req.on("data",c=>chunks.push(c));
  req.on("end",()=>{
    const body=chunks.length?Buffer.concat(chunks):null;
    const fwd={...req.headers,host:"demo-api.kalshi.co"};
    delete fwd["content-length"];
    if(body)fwd["content-length"]=Buffer.byteLength(body);
    const pr=https.request({hostname:"demo-api.kalshi.co",port:443,path:"/trade-api/v2"+path,method:req.method,headers:fwd},up=>{
      res.writeHead(up.statusCode,{...up.headers,...CORS});
      up.pipe(res);
    });
    pr.on("error",e=>{res.writeHead(502);res.end(e.message);});
    if(body)pr.write(body);
    pr.end();
  });
}).listen(PORT,()=>console.log("Kalshi proxy on port "+PORT));
