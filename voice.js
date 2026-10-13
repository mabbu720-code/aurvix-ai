const voiceBtn=document.getElementById("voiceBtn");
const messageInput=document.getElementById("messageInput");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

let recognition=null;
let listening=false;
let speakNextReply=false;
let selectedVoice=null;
let submitted=false;
let stopRequested=false;

const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};

function scoreVoice(v){
 const n=v.name+" "+v.lang;let s=0;
 if(/^en-IN/i.test(v.lang))s+=6;else if(/^en/i.test(v.lang))s+=3;else if(/^hi/i.test(v.lang))s+=2;else return -1;
 if(/natural|neural|online|wavenet|studio/i.test(n))s+=8;
 if(/google/i.test(n))s+=4;
 if(/female|zira|heera|neerja|samantha|susan|hazel|aria|jenny/i.test(n))s-=9;
 else if(/male|david|mark|guy|ryan|james|daniel|alex|prabhat|madhur|rishi|christopher|eric|brian|george|arthur/i.test(n))s+=7;
 if(v.localService===false)s+=2;
 return s;
}

function loadDeepVoice(){
 if(!("speechSynthesis" in window))return;
 const all=window.speechSynthesis.getVoices();
 const list=all.map(v=>({v,s:scoreVoice(v)})).filter(x=>x.s>=0).sort((a,b)=>b.s-a.s).map(x=>x.v);
 window.aurvixVoices=list;
 const saved=store.get("aurvixVoice");
 selectedVoice=list.find(v=>v.name===saved)||list[0]||null;
 buildVoicePanel();
}

function buildVoicePanel(){
 const list=window.aurvixVoices;
 if(document.getElementById("voiceCfg")||!list||!list.length)return;
 const host=document.querySelector(".system-panel")||document.querySelector(".chat-panel");
 if(!host)return;
 const d=document.createElement("div");d.id="voiceCfg";
 d.style.cssText="margin-top:10px;font-size:11px;color:#46dc62";
 const st="background:#020a04;color:#46dc62;border:1px solid #0a4a1c;padding:6px;";
 d.innerHTML='VOICE<select id="vSel" style="width:100%;margin:4px 0;'+st+'"></select>DEEP / HUMAN<input id="vPitch" type="range" min="0.6" max="1.1" step="0.05" style="width:100%"><button id="vTest" style="'+st+'">TEST VOICE</button>';
 host.appendChild(d);
 const sel=d.querySelector("#vSel"),pr=d.querySelector("#vPitch");
 list.forEach(v=>{const o=document.createElement("option");o.value=v.name;o.textContent=v.name+" ("+v.lang+")";sel.appendChild(o)});
 if(selectedVoice)sel.value=selectedVoice.name;
 pr.value=store.get("aurvixPitch")||"0.8";
 sel.onchange=()=>{store.set("aurvixVoice",sel.value);loadDeepVoice();window.aurvixSpeakOnCommand("AURVIX online. Voice check, sab theek hai.")};
 pr.onchange=()=>store.set("aurvixPitch",pr.value);
 d.querySelector("#vTest").onclick=()=>window.aurvixSpeakOnCommand("AURVIX online. Voice check, sab theek hai.");
}

if("speechSynthesis" in window){
 loadDeepVoice();
 window.speechSynthesis.onvoiceschanged=loadDeepVoice;
 let tries=0;const iv=setInterval(()=>{loadDeepVoice();if(document.getElementById("voiceCfg")||++tries>10)clearInterval(iv)},800);
}

function stopSpeaking(){
 speakNextReply=false;
 stopRequested=true;
 if("speechSynthesis" in window)window.speechSynthesis.cancel();
}

window.aurvixStopVoice=stopSpeaking;
window.aurvixStopSpeakingNow=stopSpeaking;

function speakReply(text){
 if(stopRequested||!speakNextReply)return;
 speakNextReply=false;
 if(!("speechSynthesis" in window))return;

 window.speechSynthesis.cancel();
 const clean=String(text).replace(/```[\s\S]*?```/g," code block. ").replace(/[*_`#>~|]/g,"").replace(/https?:\/\/\S+/g,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,"").replace(/\s+/g," ").trim();
 if(!clean)return;

 const parts=clean.match(/[^.!?\u0964\n]+[.!?\u0964]?/g)||[clean];
 const chunks=[];let cur="";
 parts.forEach(p=>{if(cur&&(cur+p).length>170){chunks.push(cur);cur=p}else cur+=p});
 if(cur)chunks.push(cur);

 const pitch=parseFloat(store.get("aurvixPitch")||"0.8");
 chunks.forEach(c=>{
  const u=new SpeechSynthesisUtterance(c.trim());
  if(selectedVoice)u.voice=selectedVoice;
  u.lang=selectedVoice?selectedVoice.lang:"en-IN";
  u.rate=0.95;
  u.pitch=pitch;
  u.volume=1;
  window.speechSynthesis.speak(u);
 });
}

window.aurvixSpeakReply=speakReply;

window.aurvixSpeakOnCommand=function(text){
 stopRequested=false;
 speakNextReply=true;
 speakReply(text);
};

function isStopCommand(text){
 return /^(stop|stop speaking|be quiet|silence|quiet|chup|bas|band karo)[.! ]*$/i.test(String(text).trim());
}

function resetMic(){
 listening=false;
 voiceBtn.textContent="MIC";
 messageInput.placeholder="Enter command here...";
}

function sendTranscript(text){
 text=String(text||"").trim();
 if(!text||submitted)return;
 submitted=true;
 resetMic();

 if(isStopCommand(text)){
  stopSpeaking();
  return;
 }

 stopRequested=false;
 speakNextReply=true;

 if(window.aurvixSendVoiceText){
  window.aurvixSendVoiceText(text);
 }else{
  speakNextReply=false;
  messageInput.value=text;
  document.getElementById("sendBtn").click();
 }
}

if(SpeechRecognition){
 recognition=new SpeechRecognition();
 recognition.lang="en-IN";
 recognition.continuous=false;
 recognition.interimResults=false;
 recognition.maxAlternatives=1;

 recognition.onstart=()=>{
  listening=true;
  submitted=false;
  voiceBtn.textContent="Listening...";
  messageInput.placeholder="Speak your complete question...";
 };

 recognition.onresult=e=>{
  if(submitted)return;
  const result=e.results[e.results.length-1];
  if(!result||!result.isFinal)return;
  const text=result[0].transcript.trim();
  sendTranscript(text);
 };

 recognition.onerror=e=>{
  resetMic();
  if(e.error!=="no-speech"&&e.error!=="aborted"){
   console.log("Voice recognition error:",e.error);
  }
 };

 recognition.onend=()=>{
  resetMic();
 };

}else{
 voiceBtn.onclick=()=>{
  alert("Voice input support nahi hai. Updated Chrome mein AURVIX kholo.");
 };
}

if(recognition){
 voiceBtn.onclick=()=>{
  if(listening){
   recognition.stop();
   return;
  }

  try{
   recognition.start();
  }catch(e){
   alert("Mic start nahi hua. Page reload karke dobara try karo.");
  }
 };
}