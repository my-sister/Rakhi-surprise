(()=>{
  const $=id=>document.getElementById(id),
    screens=["intro","memories","gift","amounts","success"],
    music=$("bgMusic"),stage=$("photoStage"),caption=$("memoryCaption"),skip=$("skipMemories");

  let timer=null,current=0,paymentTimer=null,normalMusicVolume=.62;
  const sessionId=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2));

  // Always keep the special Rakhi memory at the end, regardless of config order.
  const orderedPhotos=[
    ...RAKHI_CONFIG.photos.filter(p=>p.type!=="special"),
    ...RAKHI_CONFIG.photos.filter(p=>p.type==="special")
  ];

  // Original, locally bundled sounds. No external requests are made.
  const emotionalMusic=new Audio("assets/sounds/rakhi-memory.mp3");
  emotionalMusic.preload="auto";
  emotionalMusic.volume=.72;
  const sounds={
    gift:new Audio("assets/sounds/gift-open.mp3"),
    nope:new Audio("assets/sounds/nope.mp3"),
    think:new Audio("assets/sounds/think-again.mp3"),
    success:new Audio("assets/sounds/success.mp3")
  };
  Object.values(sounds).forEach(a=>{a.preload="auto";a.volume=.9});

  function show(id){
    screens.forEach(s=>{
      const e=$(s);
      e.classList.toggle("active",s===id);
      e.setAttribute("aria-hidden",s!==id)
    })
  }

  async function logEvent(event,data={}){
    const p={sessionId,event,data,at:new Date().toISOString(),screen:`${innerWidth}x${innerHeight}`};
    console.log("[राखी]",p);
    if(!RAKHI_CONFIG.apiEndpoint)return;
    try{
      await fetch(RAKHI_CONFIG.apiEndpoint,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(p),
        keepalive:true
      });
    }catch(e){console.warn("Backend logging failed",e)}
  }

  function playSound(audio){
    try{audio.currentTime=0;audio.play().catch(()=>{})}catch(_){}
  }

  function fadeAudio(audio,to,duration=900){
    if(!audio)return;
    const from=audio.volume;
    const steps=18;
    const delta=(to-from)/steps;
    let n=0;
    const id=setInterval(()=>{
      n++;
      audio.volume=Math.max(0,Math.min(1,from+delta*n));
      if(n>=steps)clearInterval(id);
    },duration/steps);
  }

  function startMusic(){
    music.volume=normalMusicVolume;
    music.play().catch(()=>{});
  }

  function enterSpecialMood(){
    document.getElementById("memories").classList.add("special-moment");
    fadeAudio(music,.07,1200);
    emotionalMusic.currentTime=0;
    emotionalMusic.play().catch(()=>{});
    logEvent("special_memory_started");
  }

  function leaveSpecialMood(){
    document.getElementById("memories").classList.remove("special-moment");
    fadeAudio(emotionalMusic,0,700);
    setTimeout(()=>{
      emotionalMusic.pause();
      emotionalMusic.currentTime=0;
    },800);
    fadeAudio(music,normalMusicVolume,900);
  }

  function startMemories(){
    show("memories");
    logEvent("memory_sequence_started");
    current=0;
    nextPhoto();
  }

  function nextPhoto(){
    clearTimeout(timer);
    stage.innerHTML="";

    const item=orderedPhotos[current];
    if(!item){finishMemories();return}

    const isSpecial=item.type==="special";
    if(isSpecial)enterSpecialMood();

    const frame=document.createElement("div");
    frame.className="memory-frame"+(isSpecial?" special-frame":"");

    const backdrop=document.createElement("div");
    backdrop.className="memory-backdrop";
    backdrop.style.backgroundImage=`url("assets/${item.file}")`;

    const img=document.createElement("img");
    img.className="memory-photo"+(isSpecial?" special":"");
    img.alt="राखी की याद";
    img.src="assets/"+item.file;

    // Give the final Rakhi memory enough time to land emotionally.
    const duration=isSpecial?Math.max(RAKHI_CONFIG.specialDurationMs||0,11500):RAKHI_CONFIG.photoDurationMs;
    frame.style.setProperty("--duration",duration+"ms");

    img.onload=()=>{
      const landscape=img.naturalWidth/img.naturalHeight>=1.2;
      frame.classList.add(landscape?"landscape":"portrait");
    };

    frame.appendChild(backdrop);
    frame.appendChild(img);
    stage.appendChild(frame);

    if(isSpecial){
      caption.innerHTML='<span class="special-kicker">पिछली राखी...</span><span class="special-main">जब तुम यहीं थी, और मेरे हाथ पर राखी बाँधी थी। ❤️</span><span class="special-last">इस बार दूरी है... उस पल की कमी भी है।</span>';
    }else{
      caption.textContent=item.caption||"";
    }
    caption.classList.toggle("special-caption",isSpecial);
    caption.style.opacity=(isSpecial||item.caption)?"1":"0";

    logEvent("photo_shown",{index:current+1,file:item.file,special:isSpecial});
    timer=setTimeout(()=>{
      if(isSpecial)leaveSpecialMood();
      current++;
      nextPhoto();
    },duration);
  }

  function finishMemories(){
    clearTimeout(timer);
    leaveSpecialMood();
    logEvent("memory_sequence_completed");
    show("gift");
  }

  $("startBtn").addEventListener("click",()=>{
    logEvent("started");
    startMusic();
    startMemories();
  });

  skip.addEventListener("click",()=>{
    logEvent("memories_skipped",{afterPhoto:current+1});
    finishMemories();
  });

  function openGift(){
    if($("giftBox").classList.contains("open"))return;
    playSound(sounds.gift);
    $("giftBox").classList.add("open");
    logEvent("gift_box_opened");
    setTimeout(()=>show("amounts"),850);
  }

  $("giftBox").addEventListener("click",openGift);
  $("giftBox").addEventListener("keydown",e=>{
    if(e.key==="Enter"||e.key===" ")openGift();
  });

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
      }catch(_){}
    },5000)
  }

  document.querySelectorAll(".amount-card").forEach(card=>card.addEventListener("click",()=>{
    const amount=Number(card.dataset.amount);

    if(amount===5001){
      playSound(sounds.nope);
      logEvent("amount_attempted",{amount});
      card.classList.remove("dodge");void card.offsetWidth;card.classList.add("dodge");
      $("amountMessage").textContent="अरे-अरे! 😳 इतनी भी जल्दी नहीं!";
      setTimeout(()=>$("amountMessage").textContent="इतना लालच भी अच्छा नहीं है। 😂",950);
      return;
    }

    if(amount===1001){
      playSound(sounds.think);
      logEvent("amount_attempted",{amount});
      $("amountMessage").textContent="अच्छा जी... इतना ही चाहिए? 😏 एक बार फिर सोच लो।";
      card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");
      setTimeout(()=>$("amountMessage").textContent="",2200);
      return;
    }

    if(amount===2001){
      playSound(sounds.success);
      logEvent("gift_unlocked",{amount:2001});
      show("success");
      startPaymentWait();
    }
  }));

  window.addEventListener("beforeunload",()=>{
    if(RAKHI_CONFIG.apiEndpoint){
      navigator.sendBeacon(RAKHI_CONFIG.apiEndpoint,JSON.stringify({sessionId,event:"page_exit",at:new Date().toISOString()}));
    }
  });

  logEvent("page_loaded",{sessionName:RAKHI_CONFIG.sessionName});
})();
