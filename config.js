/* फोटो बदलने के लिए केवल यह फ़ाइल संपादित करें।
   assets/ में जितनी फोटो चाहें रखें और नीचे सूची में जोड़ें/हटाएँ।
   विशेष राखी वाली फोटो का type "special" रखें। */
const RAKHI_CONFIG={
 photos:[
  {file:"photo-01.jpg",type:"auto",caption:"कुछ रिश्ते... समय के साथ और भी खूबसूरत हो जाते हैं।"},
  {file:"photo-02.jpg",type:"auto",caption:""},
  {file:"photo-03.jpg",type:"auto",caption:"बचपन की शरारतें शायद कभी पुरानी नहीं होतीं।"},
  {file:"photo-04.jpg",type:"auto",caption:""},
//   {file:"photo-05.jpg",type:"auto",caption:"कुछ यादें बस मुस्कुराने के लिए होती हैं।"},
  {file:"rakhi-special.jpg",type:"special",caption:"पिछली राखी... जब तुमने मेरे हाथ पर राखी बाँधी थी। ❤️"},
//   {file:"photo-07.jpg",type:"auto",caption:"इस बार दूर हैं... लेकिन रिश्ता कहाँ दूर होता है। ❤️"}
 ],
 photoDurationMs:4800,
 specialDurationMs:6800,
 apiEndpoint:"https://rakhi-surprise.sangamvaishkiyar.workers.dev",
 sessionName:"rakhi-2026-shimpi"
};
