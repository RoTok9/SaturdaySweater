// Saturday Sweater league server: one Durable Object per league.
// Holds the shared save (base), each coach's pending week (delta), ready flags and a version counter.
// The game client runs the sim; the last coach to ready up merges everyone's week and uploads the new base.
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const json=(o,st)=>new Response(JSON.stringify(o),{status:st||200,headers:Object.assign({'Content-Type':'application/json'},CORS)});
const code=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s;};
const tok=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');};
const CHUNK=100000;

export default{
  async fetch(req,env){
    if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
    const url=new URL(req.url);const parts=url.pathname.split('/').filter(Boolean);
    if(parts[0]==='health')return json({ok:true,t:Date.now()});
    if(parts[0]!=='leagues')return json({error:'not found'},404);
    let id=parts[1];
    if(!id){if(req.method!=='POST')return json({error:'method'},405);for(let i=0;i<5;i++){id=code();const stub=env.LEAGUE.get(env.LEAGUE.idFromName(id));const r=await stub.fetch(new Request('https://do/exists'));const ex=await r.json();if(!ex.exists)break;}}
    const stub=env.LEAGUE.get(env.LEAGUE.idFromName(id.toUpperCase()));
    const sub='/'+parts.slice(2).join('/');
    const fwd=new Request('https://do'+(parts[1]?sub:'/create')+url.search,{method:req.method,headers:req.headers,body:req.method==='POST'?await req.text():undefined});
    fwd.headers.set('x-league-id',id.toUpperCase());
    return stub.fetch(fwd);
  }
};

export class League{
  constructor(state,env){this.state=state;this.s=state.storage;}
  async getBase(){const n=(await this.s.get('baseN'))||0;if(!n)return null;const ks=[];for(let i=0;i<n;i++)ks.push('base:'+i);const m=await this.s.get(ks);let out='';for(let i=0;i<n;i++)out+=m.get('base:'+i)||'';return out;}
  async putBase(str){const old=(await this.s.get('baseN'))||0;const n=Math.ceil(str.length/CHUNK);const ents={baseN:n};for(let i=0;i<n;i++)ents['base:'+i]=str.slice(i*CHUNK,(i+1)*CHUNK);await this.s.put(ents);for(let i=n;i<old;i++)await this.s.delete('base:'+i);}
  async fetch(req){
    const url=new URL(req.url);const path=url.pathname;const id=req.headers.get('x-league-id');
    const meta=await this.s.get('meta');
    if(path==='/exists')return json({exists:!!meta});
    let body={};if(req.method==='POST'){try{body=JSON.parse(await req.text()||'{}');}catch(e){return json({error:'bad json'},400);}}
    if(path==='/create'){
      if(meta)return json({error:'exists'},409);if(!body.base||!body.coach||body.coach.tid==null)return json({error:'missing fields'},400);
      const token=tok();const m={id,name:String(body.name||'League').slice(0,40),version:1,created:Date.now(),updated:Date.now(),meta:body.meta||{},commissioner:body.coach.tid};
      const coaches={[body.coach.tid]:{tid:body.coach.tid,name:String(body.coach.name||'Coach').slice(0,28),token,ready:false,joined:Date.now()}};
      await this.s.put({meta:m,coaches,deltas:{}});await this.putBase(body.base);
      return json({id,token,version:1,meta:m.meta,name:m.name});
    }
    if(!meta)return json({error:'no such league'},404);
    const coaches=(await this.s.get('coaches'))||{};
    const pub=()=>Object.values(coaches).map(c=>({tid:c.tid,name:c.name,ready:!!c.ready,joined:c.joined})).sort((a,b)=>a.joined-b.joined);
    const auth=()=>{const c=coaches[body.tid];return c&&c.token&&c.token===body.token?c:null;};
    if(path==='/'||path===''){
      if(req.method!=='GET')return json({error:'method'},405);
      const out={id,name:meta.name,version:meta.version,meta:meta.meta,coaches:pub(),commissioner:meta.commissioner,updated:meta.updated};
      if(url.searchParams.get('deltas')==='1')out.deltas=(await this.s.get('deltas'))||{};
      if(url.searchParams.get('base')==='1')out.base=await this.getBase();
      return json(out);
    }
    if(path==='/join'){
      if(body.tid==null)return json({error:'missing tid'},400);if(coaches[body.tid])return json({error:'team taken'},409);
      if(Object.keys(coaches).length>=12)return json({error:'league full'},409);
      const token=tok();coaches[body.tid]={tid:body.tid,name:String(body.name||'Coach').slice(0,28),token,ready:false,joined:Date.now()};
      // a new coach joins at the start of a turn: everyone un-readies so the merge includes the new coach's team
      Object.values(coaches).forEach(c=>{c.ready=false;});const deltas={};
      meta.version++;meta.updated=Date.now();meta.meta=Object.assign({},meta.meta,{joined:(meta.meta.joined||[]).concat([{tid:body.tid,name:coaches[body.tid].name,v:meta.version}])});
      await this.s.put({coaches,meta,deltas});
      return json({id,token,version:meta.version,meta:meta.meta,coaches:pub(),name:meta.name});
    }
    if(path==='/ready'){
      const c=auth();if(!c)return json({error:'unauthorized'},401);
      if(body.version!==meta.version)return json({error:'stale',version:meta.version,coaches:pub()},409);
      const deltas=(await this.s.get('deltas'))||{};
      if(body.ready===false){c.ready=false;delete deltas[body.tid];}
      else{if(!body.delta)return json({error:'missing delta'},400);c.ready=true;deltas[body.tid]=body.delta;}
      c.seen=Date.now();await this.s.put({coaches,deltas});
      const allReady=Object.values(coaches).every(x=>x.ready);
      return json({ok:true,version:meta.version,allReady,coaches:pub()});
    }
    if(path==='/advance'){
      const c=auth();if(!c)return json({error:'unauthorized'},401);
      if(body.version!==meta.version)return json({error:'stale',version:meta.version},409);
      if(!body.base)return json({error:'missing base'},400);
      const allReady=Object.values(coaches).every(x=>x.ready);
      if(!allReady&&!body.force)return json({error:'not all ready',coaches:pub()},409);
      await this.putBase(body.base);Object.values(coaches).forEach(x=>{x.ready=false;});
      meta.version++;meta.updated=Date.now();meta.meta=body.meta||meta.meta;meta.lastAdvance={by:body.tid,t:Date.now()};
      await this.s.put({coaches,meta,deltas:{}});
      return json({ok:true,version:meta.version});
    }
    if(path==='/kick'){
      const c=auth();if(!c||meta.commissioner!==body.tid)return json({error:'unauthorized'},401);
      if(body.target==null||!coaches[body.target]||body.target===body.tid)return json({error:'bad target'},400);
      delete coaches[body.target];const deltas=(await this.s.get('deltas'))||{};delete deltas[body.target];
      meta.version++;meta.updated=Date.now();meta.meta=Object.assign({},meta.meta,{kicked:(meta.meta.kicked||[]).concat([{tid:body.target,v:meta.version}])});Object.values(coaches).forEach(x=>{x.ready=false;});
      await this.s.put({coaches,meta,deltas:{}});return json({ok:true,version:meta.version,coaches:pub()});
    }
    return json({error:'not found'},404);
  }
}
