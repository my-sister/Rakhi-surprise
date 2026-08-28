(()=>{
  const $=id=>document.getElementById(id),
    screens=["intro","memories","gift","amounts","success"],
    music=$("bgMusic"),stage=$("photoStage"),caption=$("memoryCaption"),skip=$("skipMemories");

  let timer=null,current=0,paymentTimer=null,targetRevealed=false,interactionCount=0,finalSequenceRunning=false;
  const revealAt=Math.random()<.5?4:5;
  const FINAL_GIFT_AMOUNT=2501;
  const sessionId=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2));

  const orderedPhotos=[
    ...RAKHI_CONFIG.photos.filter(p=>p.type!=="special"),
    ...RAKHI_CONFIG.photos.filter(p=>p.type==="special")
  ];

  const emotionalMusic=new Audio("assets/sounds/rakhi-memory.mp3");
  emotionalMusic.preload="auto";
  emotionalMusic.volume=.78;

  const sounds={
    gift:new Audio("assets/sounds/gift-open.mp3"),
    nope:new Audio("assets/sounds/nope.mp3"),
    think:new Audio("assets/sounds/think-again.mp3"),
    success:new Audio("assets/sounds/success.mp3")
  };
  Object.values(sounds).forEach(a=>{a.preload="auto";a.volume=1});

  let audioCtx=null;
  function tone(freq=620,duration=.11,volume=.19,type="sine"){
    try{
      audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==="suspended")audioCtx.resume();
      const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
      osc.type=type;osc.frequency.value=freq;
      gain.gain.setValueAtTime(volume,audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration);
    }catch(_){ }
  }
  function risingTick(step){tone(560+step*90,.13,.23,"triangle")}
  function comicBlip(){tone(280,.12,.24,"square");setTimeout(()=>tone(210,.12,.18,"square"),90)}

  function show(id){
    screens.forEach(s=>{const e=$(s);e.classList.toggle("active",s===id);e.setAttribute("aria-hidden",s!==id)})
  }

  async function logEvent(event,data={}){
    const p={sessionId,event,data,at:new Date().toISOString(),screen:`${innerWidth}x${innerHeight}`};
    console.log("[राखी]",p);
    if(!RAKHI_CONFIG.apiEndpoint)return;
    try{await fetch(RAKHI_CONFIG.apiEndpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(p),keepalive:true})}catch(e){}
  }

  function playSound(audio,volume=1){
    try{audio.pause();audio.currentTime=0;audio.volume=volume;audio.play().catch(()=>{})}catch(_){}
  }

  function fadeAudio(audio,to,duration=700,onDone){
    if(!audio)return;
    const from=audio.volume,steps=20,delta=(to-from)/steps;let n=0;
    const id=setInterval(()=>{
      n++;audio.volume=Math.max(0,Math.min(1,from+delta*n));
      if(n>=steps){clearInterval(id);if(onDone)onDone()}
    },duration/steps)
  }

  function startMusic(){
    music.loop=false;
    music.volume=.72;
    music.currentTime=0;
    music.play().catch(()=>{});
  }

  function enterSpecialMood(){
    $("memories").classList.add("special-moment");
    // Keep the main song present underneath the emotional cue instead of muting it.
    if(!music.paused)fadeAudio(music,.22,850);
    emotionalMusic.pause();emotionalMusic.currentTime=0;emotionalMusic.volume=0;
    emotionalMusic.play().catch(()=>{});
    fadeAudio(emotionalMusic,.82,700);
    logEvent("special_memory_started");
  }

  function leaveSpecialMood(){
    $("memories").classList.remove("special-moment");
    fadeAudio(emotionalMusic,0,650,()=>{emotionalMusic.pause();emotionalMusic.currentTime=0});
    // Main music stays low until the gift screen, where it fades away completely.
  }

  function fadeForGift(){
    fadeAudio(music,0,1000,()=>{music.pause();music.currentTime=0});
    fadeAudio(emotionalMusic,0,500,()=>{emotionalMusic.pause();emotionalMusic.currentTime=0});
  }

  function startMemories(){show("memories");logEvent("memory_sequence_started");current=0;nextPhoto()}

  function nextPhoto(){
    clearTimeout(timer);stage.innerHTML="";
    const item=orderedPhotos[current];
    if(!item){finishMemories();return}
    const isSpecial=item.type==="special";
    if(isSpecial)enterSpecialMood();

    const frame=document.createElement("div");frame.className="memory-frame"+(isSpecial?" special-frame":"");
    const backdrop=document.createElement("div");backdrop.className="memory-backdrop";backdrop.style.backgroundImage=`url("assets/${item.file}")`;
    const img=document.createElement("img");img.className="memory-photo"+(isSpecial?" special":"");img.alt="राखी की याद";img.src="assets/"+item.file;
    const duration=isSpecial?Math.max(RAKHI_CONFIG.specialDurationMs||0,11500):RAKHI_CONFIG.photoDurationMs;
    frame.style.setProperty("--duration",duration+"ms");
    img.onload=()=>{frame.classList.add(img.naturalWidth/img.naturalHeight>=1.2?"landscape":"portrait")};
    frame.append(backdrop,img);stage.appendChild(frame);

    if(isSpecial){
      caption.innerHTML='<span class="special-kicker">पिछली राखी...</span><span class="special-main">जब तुम यहीं थी, और मेरे हाथ पर राखी बाँधी थी। ❤️</span><span class="special-last">इस बार दूरी है... उस पल की कमी भी है।</span>';
    }else caption.textContent=item.caption||"";
    caption.classList.toggle("special-caption",isSpecial);
    caption.style.opacity=(isSpecial||item.caption)?"1":"0";
    logEvent("photo_shown",{index:current+1,file:item.file,special:isSpecial});
    timer=setTimeout(()=>{if(isSpecial)leaveSpecialMood();current++;nextPhoto()},duration);
  }

  function finishMemories(){
    clearTimeout(timer);leaveSpecialMood();fadeForGift();
    logEvent("memory_sequence_completed");
    setTimeout(()=>show("gift"),450);
  }

  $("startBtn").addEventListener("click",()=>{logEvent("started");startMusic();startMemories()});
  skip.addEventListener("click",()=>{logEvent("memories_skipped",{afterPhoto:current+1});finishMemories()});

  function openGift(){
    if($("giftBox").classList.contains("open"))return;
    fadeForGift();
    playSound(sounds.gift,1);
    $("giftBox").classList.add("open");
    logEvent("gift_box_opened");
    setTimeout(()=>show("amounts"),850);
  }
  $("giftBox").addEventListener("click",openGift);
  $("giftBox").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")openGift()});

  function revealTargetAmount(){
    if(targetRevealed)return;
    targetRevealed=true;
    const middle=$("middleAmount");if(!middle)return;
    setTimeout(()=>{
      middle.classList.add("revealing");
      playSound(sounds.think,.9);
      setTimeout(()=>{
        middle.dataset.amount="2001";
        middle.querySelector(".amount").textContent="₹2,001";
        middle.querySelector(".amount-note").textContent="अरे... ये विकल्प पहले था क्या? 😏";
      },330);
      setTimeout(()=>{
        middle.classList.remove("revealing");middle.classList.add("revealed");
        $("amountMessage").textContent="कुछ तो गड़बड़ है... 😂";
        logEvent("target_amount_revealed",{amount:2001,interaction:interactionCount,revealAt});
      },760);
    },260);
  }

  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  function setFinalAmount(amount){
    const el=$("finalAmount");
    el.classList.remove("amount-pop");void el.offsetWidth;
    el.textContent="₹"+amount.toLocaleString("en-IN");el.classList.add("amount-pop");
  }

  async function runFinalIncreaseSequence(){
    if(finalSequenceRunning)return;
    finalSequenceRunning=true;
    show("success");playSound(sounds.success,1);
    $("successEyebrow").textContent="सही विकल्प चुना! 🎉";
    $("successCopy").textContent="कम है क्या? 🤔";
    $("increaseText").textContent="चलो... इसको थोड़ा बढ़ाते हैं। 😏";
    $("paymentCard").innerHTML='<span class="payment-dot"></span><span>एक छोटा सा हिसाब चल रहा है... 😌</span>';
    $("smallNote").textContent="देखते जाओ... 😂";
    setFinalAmount(2001);
    await wait(3000);

    const steps=[
      {amount:2101,text:"₹100 और... चाय-नाश्ता मेरी तरफ़ से। ☕😂"},
      {amount:2201,text:"एक और ₹100... अब थोड़ा ठीक लग रहा है। 😌"},
      {amount:2301,text:"₹2,301! इतना काफ़ी रहेगा... है ना? 😏"},
    ];
    for(let i=0;i<steps.length;i++){
      risingTick(i+1);setFinalAmount(steps[i].amount);$("increaseText").textContent=steps[i].text;
      logEvent("gift_amount_increased",{amount:steps[i].amount});
      await wait(i===2?3200:2200);
    }

    comicBlip();
    $("successCopy").textContent="नहीं... थोड़ा और बढ़ाते हैं। 😂";
    $("increaseText").textContent="भाई की इज़्ज़त का सवाल है अब। 😎";
    await wait(3000);

    risingTick(4);setFinalAmount(2401);$("increaseText").textContent="₹2,401... बस एक आख़िरी ₹100 और? 😜";
    logEvent("gift_amount_increased",{amount:2401});
    await wait(3000);

    risingTick(5);setFinalAmount(2501);playSound(sounds.success,1);
    $("successCopy").textContent="₹2,501 ❤️";
    $("increaseText").textContent="अब बजट के बाहर जा रहा है... ये परफ़ेक्ट है! 😄";
    $("paymentCard").innerHTML='<span class="payment-dot"></span><span>पैसे भेजे जा रहे हैं... 💸</span>';
    $("smallNote").textContent="अब अपने फ़ोन पर ध्यान देना। 😌";
    logEvent("gift_unlocked",{selectedAmount:2001,amount:FINAL_GIFT_AMOUNT});
    startPaymentWait();
  }

  function startPaymentWait(){
    if(!RAKHI_CONFIG.apiEndpoint)return;
    clearInterval(paymentTimer);let attempts=0;
    paymentTimer=setInterval(async()=>{
      attempts++;if(attempts>180){clearInterval(paymentTimer);return}
      try{
        const r=await fetch(RAKHI_CONFIG.apiEndpoint+"?action=status&sessionId="+encodeURIComponent(sessionId),{cache:"no-store"});
        const d=await r.json();
        if(d.paid===true){
          clearInterval(paymentTimer);logEvent("payment_confirmed",{amount:FINAL_GIFT_AMOUNT});
          const card=$("paymentCard");if(card)card.innerHTML='<span class="payment-dot"></span><span>उपहार पहुँच गया ❤️</span>';
          const note=$("smallNote");if(note)note.textContent="राखी की बहुत सारी शुभकामनाएँ, दीदी! ❤️";
        }
      }catch(_){}
    },5000)
  }

  document.querySelectorAll(".amount-card").forEach(card=>card.addEventListener("click",()=>{
    if(finalSequenceRunning)return;
    interactionCount++;
    let amount=Number(card.dataset.amount);

    if(!targetRevealed && interactionCount>=revealAt)revealTargetAmount();

    if(amount===5001){
      playSound(sounds.nope,1);logEvent("amount_attempted",{amount,interaction:interactionCount});
      card.classList.remove("dodge");void card.offsetWidth;card.classList.add("dodge");
      $("amountMessage").textContent=interactionCount<revealAt?"इतनी जल्दी ₹5,001? 😳 पहले थोड़ा और सोचो!":"अरे-अरे! 😳 इतनी भी जल्दी नहीं!";
      setTimeout(()=>$("amountMessage").textContent="इतना लालच भी अच्छा नहीं है। 😂",950);return;
    }

    if(amount===3001){
      playSound(sounds.think,1);logEvent("amount_attempted",{amount,interaction:interactionCount});
      $("amountMessage").textContent=interactionCount<revealAt?"₹3,001? सोच लो... कहानी अभी बाकी है। 😏":"₹3,001? भाई का बजट इतना भी मजबूत नहीं है। 😂";
      card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");return;
    }

    if(amount===1001){
      playSound(sounds.think,1);logEvent("amount_attempted",{amount,interaction:interactionCount});
      $("amountMessage").textContent=interactionCount<revealAt?"₹1,001? अच्छा जी, इतना ही चाहिए। 😌":"इतना कम? थोड़ी और उम्मीद रखो। 😏";
      card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");return;
    }

    if(amount===2001){
      logEvent("amount_attempted",{amount,interaction:interactionCount});
      runFinalIncreaseSequence();
    }
  }));

  window.addEventListener("beforeunload",()=>{
    if(RAKHI_CONFIG.apiEndpoint)navigator.sendBeacon(RAKHI_CONFIG.apiEndpoint,JSON.stringify({sessionId,event:"page_exit",at:new Date().toISOString()}));
  });
  logEvent("page_loaded",{sessionName:RAKHI_CONFIG.sessionName,targetRevealInteraction:revealAt});
})();
