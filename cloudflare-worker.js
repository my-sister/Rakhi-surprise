const SHEET_WEBHOOK_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json; charset=utf-8"}})}
function esc(s=""){return String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c]))}

async function sheetLog(payload){
  if(SHEET_WEBHOOK_URL.startsWith("PASTE_"))return;
  await fetch(SHEET_WEBHOOK_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
}

function adminHtml(latest,secret,message=""){
  const has=!!latest?.sessionId;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rakhi Admin</title>
  <style>body{font-family:system-ui;background:#120b18;color:#fff;margin:0;padding:28px}main{max-width:520px;margin:auto}.card{background:#211626;padding:22px;border-radius:18px;margin-top:24px}.muted{color:#c9baca}.amt{font-size:48px;font-weight:800;margin:8px 0;color:#ffd58a}.btn{display:block;text-align:center;text-decoration:none;background:#ff8db7;color:#25101a;padding:15px;border-radius:999px;font-weight:800;margin-top:20px}.ok{color:#8ff0aa}</style></head><body><main><h1>Rakhi Admin</h1><p class="muted">Private control page for Shimpi's surprise.</p>${message?`<p class="ok">${esc(message)}</p>`:""}<div class="card">${has?`<div class="muted">Latest session</div><div>${esc(latest.sessionId)}</div><div class="amt">₹2,001</div><div>Status: ${latest.paid?"Payment marked sent":"Waiting for payment"}</div>${latest.paid?"":`<a class="btn" href="/admin/pay?secret=${encodeURIComponent(secret)}&sessionId=${encodeURIComponent(latest.sessionId)}">Payment sent</a>`}`:`<p>No gift has been unlocked yet.</p>`}</div></main></body></html>`
}

export default {
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response("",{headers:CORS});
    const url=new URL(request.url);

    if(request.method==="GET" && url.searchParams.get("action")==="status"){
      const id=url.searchParams.get("sessionId");
      if(!id||!env.RAKHI_KV)return json({paid:false});
      const state=await env.RAKHI_KV.get("session:"+id,"json");
      return json({paid:state?.paid===true});
    }

    if(request.method==="GET" && url.pathname==="/admin"){
      const secret=url.searchParams.get("secret")||"";
      if(!env.ADMIN_SECRET||secret!==env.ADMIN_SECRET)return new Response("Unauthorized",{status:401});
      const latest=env.RAKHI_KV?await env.RAKHI_KV.get("latest","json"):null;
      return new Response(adminHtml(latest,secret),{headers:{"Content-Type":"text/html; charset=utf-8"}});
    }

    if(request.method==="GET" && url.pathname==="/admin/pay"){
      const secret=url.searchParams.get("secret")||"";
      const id=url.searchParams.get("sessionId")||"";
      if(!env.ADMIN_SECRET||secret!==env.ADMIN_SECRET)return new Response("Unauthorized",{status:401});
      if(!id)return new Response("Missing sessionId",{status:400});
      const state={sessionId:id,paid:true,amount:2001,paidAt:new Date().toISOString()};
      if(env.RAKHI_KV){
        await env.RAKHI_KV.put("session:"+id,JSON.stringify(state),{expirationTtl:86400});
        await env.RAKHI_KV.put("latest",JSON.stringify(state),{expirationTtl:86400});
      }
      await sheetLog({event:"payment_confirmed_by_brother",sessionId:id,data:{amount:2001},at:new Date().toISOString()});
      return new Response(adminHtml(state,secret,"Payment marked as sent."),{headers:{"Content-Type":"text/html; charset=utf-8"}});
    }

    if(request.method!=="POST")return json({ok:true});

    try{
      const body=JSON.parse(await request.text());
      if(body.event==="gift_unlocked"){
        body.data={...(body.data||{}),amount:2001};
        const state={sessionId:body.sessionId,paid:false,unlocked:true,amount:2001,unlockedAt:new Date().toISOString()};
        if(env.RAKHI_KV&&body.sessionId){
          await env.RAKHI_KV.put("session:"+body.sessionId,JSON.stringify(state),{expirationTtl:86400});
          await env.RAKHI_KV.put("latest",JSON.stringify(state),{expirationTtl:86400});
        }
      }
      await sheetLog(body);
      return json({ok:true});
    }catch(_){return json({ok:false,error:"Invalid request"},400)}
  }
};
