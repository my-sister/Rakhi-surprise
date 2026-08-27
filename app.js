(()=>{
  const $=id=>document.getElementById(id),
    screens=["intro","memories","gift","amounts","success"],
    music=$("bgMusic"),stage=$("photoStage"),caption=$("memoryCaption"),skip=$("skipMemories");
  let timer=null,current=0,paymentTimer=null;
  const sessionId=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2));

  function show(id){screens.forEach(s=>{const e=$(s);e.classList.toggle("active",s===id);e.setAttribute("aria-hidden",s!==id)})}

  async function logEvent(event,data={}){
    const p={sessionId,event,data,at:new Date().toISOString(),screen:`${innerWidth}x${innerHeight}`};
    console.log("[राखी]",p);
    if(!RAKHI_CONFIG.apiEndpoint)return;
    try{
      await fetch(RAKHI_CONFIG.apiEndpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(p),keepalive:true});
    }catch(e){console.warn("Backend logging failed",e)}
  }

  function startMusic(){music.volume=.62;music.play().catch(()=>{})}
  function startMemories(){show("memories");logEvent("memory_sequence_started");current=0;nextPhoto()}
  function nextPhoto(){
    clearTimeout(timer);
    const old=stage.querySelector(".memory-photo");if(old)old.remove();
    const item=RAKHI_CONFIG.photos[current];if(!item){finishMemories();return}
    const img=document.createElement("img");
    img.className="memory-photo "+(item.type==="special"?"special":"");
    img.alt="राखी की याद";img.src="assets/"+item.file;
    const duration=item.type==="special"?RAKHI_CONFIG.specialDurationMs:RAKHI_CONFIG.photoDurationMs;
    img.style.setProperty("--duration",duration+"ms");
    img.onload=()=>img.classList.add(img.naturalWidth/img.naturalHeight>=1.2?"landscape":"portrait");
    stage.appendChild(img);caption.textContent=item.caption||"";caption.style.opacity=item.caption?"1":"0";
    logEvent("photo_shown",{index:current+1,file:item.file,special:item.type==="special"});
    timer=setTimeout(()=>{current++;nextPhoto()},duration)
  }
  function finishMemories(){clearTimeout(timer);logEvent("memory_sequence_completed");show("gift")}

  $("startBtn").addEventListener("click",()=>{logEvent("started");startMusic();startMemories()});
  skip.addEventListener("click",()=>{logEvent("memories_skipped",{afterPhoto:current+1});finishMemories()});

  function openGift(){if($("giftBox").classList.contains("open"))return;$("giftBox").classList.add("open");logEvent("gift_box_opened");setTimeout(()=>show("amounts"),850)}
  $("giftBox").addEventListener("click",openGift);
  $("giftBox").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")openGift()});

  function startPaymentWait(){
    if(!RAKHI_CONFIG.apiEndpoint)return;
    clearInterval(paymentTimer);
    let attempts=0;
    paymentTimer=setInterval(async()=>{
      attempts++;
      if(attempts>180){clearInterval(paymentTimer);return}
      try{
        const r=await fetch(RAKHI_CONFIG.apiEndpoint+"?action=status&sessionId="+encodeURIComponent(sessionId),{cache:"no-store"});
        const d=await r.json();
        if(d.paid===true){
          clearInterval(paymentTimer);
          logEvent("payment_confirmed",{amount:2001});
          const card=document.querySelector(".payment-card");
          if(card)card.innerHTML='<span class="payment-dot"></span><span>उपहार पहुँच गया ❤️</span>';
          const note=document.querySelector(".small-note");
          if(note)note.textContent="राखी की बहुत सारी शुभकामनाएँ, शिम्पी! ❤️";
        }
      }catch(_){ }
    },5000)
  }

  document.querySelectorAll(".amount-card").forEach(card=>card.addEventListener("click",()=>{
    const amount=Number(card.dataset.amount);
    if(amount===5001){
      logEvent("amount_attempted",{amount});card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");
      $("amountMessage").textContent="अरे-अरे! 😳 यह वाला विकल्प अभी उपलब्ध नहीं है।";
      setTimeout(()=>$("amountMessage").textContent="इतना लालच भी अच्छा नहीं है। 😂",1000);return
    }
    if(amount===1001){
      logEvent("amount_attempted",{amount});$("amountMessage").textContent="अच्छा जी... इतना ही चाहिए? 😏 एक बार फिर सोच लो।";
      card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");setTimeout(()=>$("amountMessage").textContent="",2200);return
    }
    if(amount===2001){
      logEvent("gift_unlocked",{amount:2001});show("success");startPaymentWait()
    }
  }));

  window.addEventListener("beforeunload",()=>{
    if(RAKHI_CONFIG.apiEndpoint)navigator.sendBeacon(RAKHI_CONFIG.apiEndpoint,JSON.stringify({sessionId,event:"page_exit",at:new Date().toISOString()}))
  });
  logEvent("page_loaded",{sessionName:RAKHI_CONFIG.sessionName})
})();
