// Local stand-in for the Worker, for tests: same code, in-memory storage, plain http.
import http from 'node:http';
import worker,{League} from './src/index.js';
const objs=new Map();
class Storage{constructor(){this.m=new Map();}async get(k){if(Array.isArray(k)){const out=new Map();k.forEach(x=>{if(this.m.has(x))out.set(x,this.m.get(x));});return out;}return this.m.get(k);}async put(a,b){if(typeof a==='object'){for(const k in a)this.m.set(k,a[k]);}else this.m.set(a,b);}async delete(k){this.m.delete(k);}}
const env={LEAGUE:{idFromName:n=>n,get:id=>{if(!objs.has(id))objs.set(id,new League({storage:new Storage()},env));const o=objs.get(id);return {fetch:r=>o.fetch(r)};}}};
const port=+process.argv[2]||8787;
http.createServer(async(req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',async()=>{try{const r=await worker.fetch(new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,body:req.method==='POST'?body:undefined}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());}catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e)}));}});}).listen(port,()=>console.log('mock league server on',port));
