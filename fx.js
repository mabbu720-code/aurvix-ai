(()=>{
const $=s=>document.querySelector(s);
document.body.classList.add("gated");document.body.style.overflow="hidden";
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let talking=false,done=false,recog=null,sr=null;

document.querySelectorAll(".panel-heading span:first-child").forEach((e,i)=>e.textContent=i?"AURVIX":"Voice");
const mt=$(".mode-title");if(mt)mt.firstChild.textContent="Choose mode ";
const inp=$("#messageInput");if(inp)inp.placeholder="Message AURVIX";
const T=(q,t)=>{const e=$(q);if(e)e.textContent=t};
T(".auth-subtitle","Sign in to continue");T("#loginTab","Sign in");T("#signupTab","Create account");
document.querySelectorAll(".auth-submit").forEach((b,i)=>b.textContent=i?"Create account":"Sign in");
T("#logoutBtn","Log out");T(".brand small","Artificial Intelligence");T(".status span:last-child","Online");T(".tagline","Your intelligent assistant");T("footer","AURVIX · Created for the future");
const hero=$(".hero");if(hero){const o=document.createElement("div");o.className="orb";o.innerHTML="<i></i>";hero.prepend(o)}

// performance: stop hidden matrix canvas, load font without blocking, protect forms until login code is ready
const mx=document.getElementById("matrixCanvas");if(mx){const c=mx.getContext("2d");c.fillRect=c.fillText=()=>{};mx.remove()}
const fl=document.createElement("link");fl.rel="stylesheet";fl.href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap";document.head.appendChild(fl);
const am=$("#authMessage");
["#loginForm","#signupForm"].forEach(q=>{const f=$(q);if(!f)return;f.addEventListener("submit",e=>{e.preventDefault();if(am)am.textContent="";setTimeout(()=>{if(am&&!am.textContent)am.textContent="Connecting to secure servers... slow network, wait a few seconds and tap again."},80)},true)});

// tabs and password toggles work instantly (they must not wait for the login code to download)
const lt=$("#loginTab"),st=$("#signupTab"),lf=$("#loginForm"),sf=$("#signupForm");
const showF=x=>{lf.hidden=x;sf.hidden=!x;lt.classList.toggle("active",!x);st.classList.toggle("active",x)};
if(lt&&st&&lf&&sf){lt.addEventListener("click",()=>showF(false));st.addEventListener("click",()=>showF(true))}
const pwt=(c,ids)=>{const e=$(c);if(e)e.addEventListener("change",()=>ids.forEach(i=>{const f=$(i);if(f)f.type=e.checked?"text":"password"}))};
pwt("#showLoginPassword",["#loginPassword"]);pwt("#showSignupPassword",["#signupPassword","#confirmPassword"]);
// auto replies stay silent unless a voice conversation is running
let convo=false,lang=localStorage.getItem("aurvixLang")||"hi-IN",heard="",lrec=null,idle=0,thinkT=null;
window.aurvixSpeakReply=t=>{if(convo){clearTimeout(thinkT);setState("speaking",t);window.aurvixSpeakOnCommand(t)}};
const _f=window.fetch.bind(window);
window.fetch=(u,o)=>{try{if(convo&&typeof u==="string"&&u.endsWith("/api/chat")&&o&&o.body){const b=JSON.parse(o.body);b.voice=true;b.lang=lang;o=Object.assign({},o,{body:JSON.stringify(b)})}}catch(e){}return _f(u,o)};
const toStop=t=>/^\s*(ruko|ruk jao|chup|chup ho jao|bas|band karo|stop)\W*$/i.test(t);
const toSpeak=t=>/^\s*(bolo|bol do|bol|sunao|padho|bolke batao)\W*$/i.test(t);
const fix=()=>{if(!inp)return;const v=inp.value;if(toStop(v)){window.aurvixStopVoice();inp.value=""}else if(toSpeak(v))inp.value="speak this"};
const sb=$("#sendBtn");if(sb)sb.addEventListener("click",fix,true);
if(inp)inp.addEventListener("keydown",e=>{if(e.key==="Enter")fix()},true);
const ov=window.aurvixSendVoiceText;
if(ov)window.aurvixSendVoiceText=t=>{if(toStop(t)){window.aurvixStopVoice();return}ov(toSpeak(t)?"speak this":t)};

// ElevenLabs voice (falls back to the browser voice if it fails)
const origSpeak=window.aurvixSpeakOnCommand,origStop=window.aurvixStopVoice;
let au=null,ctl=null,playing=false;const vcache=new Map();
function stopAll(){try{ctl&&ctl.abort()}catch(e){}ctl=null;if(au){au.onpause=au.onended=null;au.pause();au=null}playing=false}
window.aurvixStopVoice=()=>{stopAll();if(origStop)origStop()};
window.aurvixSpeakOnCommand=async text=>{
 stopAll();if(window.speechSynthesis)speechSynthesis.cancel();
 const clean=String(text).replace(/```[\s\S]*?```/g," code block. ").replace(/[*_`#>~|]/g,"").replace(/https?:\/\/\S+/g,"").replace(/\s+/g," ").trim().slice(0,480);
 if(!clean)return;
 ctl=new AbortController();const c=ctl;
 try{
  let url=vcache.get(clean);
  if(!url){const r=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:clean}),signal:c.signal});if(!r.ok)throw new Error("tts");url=URL.createObjectURL(await r.blob());vcache.set(clean,url)}
  if(c.signal.aborted)return;
  au=new Audio(url);au.onplaying=()=>{playing=true};au.onended=au.onpause=()=>{playing=false};
  await au.play();
 }catch(e){if(c.signal.aborted)return;if(origSpeak)origSpeak(text)}
};

// ===== Voice conversation (hands-free, Hindi / English) =====
function setState(st,txt){
 const M={idle:"Tap to start a voice conversation",listening:"Listening... speak now",thinking:"Thinking...",speaking:"Speaking..."};
 document.body.className=document.body.className.replace(/\bcv-\w+/g,"").trim();if(st!=="idle")document.body.classList.add("cv-"+st);
 const hs=$("#hmState");if(hs)hs.textContent=M[st];
 const tk=$("#hmTalk b");if(tk)tk.textContent=convo?"End conversation":"Talk to AURVIX";
 if(convo){$("#jtxt").textContent=st==="listening"?(txt||"Listening..."):st==="thinking"?(txt?"\u201c"+txt+"\u201d":"..."):(txt||"").slice(0,170);jv.classList.add("show");edge.className=(st==="listening"||st==="speaking")?"hot":"show"}
}
function startListen(){
 if(!convo||!SR)return;
 try{lrec&&lrec.abort()}catch(e){}
 const r=lrec=new SR();r.lang=lang;r.interimResults=true;r.maxAlternatives=1;heard="";
 r.onstart=()=>setState("listening");
 r.onresult=e=>{let t="",fin=false;for(let i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}if(t)setState("listening",t);if(fin)heard=t.trim()};
 r.onerror=e=>{if(e.error==="not-allowed"||e.error==="service-not-allowed")endConvo()};
 r.onend=()=>{
  if(!convo||lrec!==r)return;
  if(heard){const x=heard;heard="";idle=0;
   if(/^\s*(stop|bye|goodbye|exit|thank you|thanks|bas|bas karo|band karo|ruko|alvida|\u092c\u0938|\u092c\u0938 \u0915\u0930\u094b|\u0930\u0941\u0915\u094b|\u092c\u0902\u0926 \u0915\u0930\u094b|\u0927\u0928\u094d\u092f\u0935\u093e\u0926|\u0905\u0932\u0935\u093f\u0926\u093e)\W*$/i.test(x)){endConvo();return}
   setState("thinking",x);clearTimeout(thinkT);thinkT=setTimeout(()=>{if(convo&&!talking)startListen()},45000);
   if(window.aurvixSendVoiceText)window.aurvixSendVoiceText(x);
  }else if(++idle>=3)endConvo();else setTimeout(startListen,300)
 };
 try{r.start()}catch(e){if(++idle>=3)endConvo();else setTimeout(startListen,500)}
}
function startConvo(){if(!SR){const hs=$("#hmState");if(hs)hs.textContent="Voice input is not supported in this browser";return}convo=true;idle=0;setState("listening");startListen()}
function endConvo(){convo=false;clearTimeout(thinkT);try{lrec&&lrec.abort()}catch(e){}lrec=null;idle=0;window.aurvixStopVoice();setState("idle");jv.classList.remove("show");edge.className=""}
document.addEventListener("click",e=>{
 if(e.target.closest("#hmTalk")){convo?endConvo():startConvo();return}
 const l=e.target.closest("#hmLang");
 if(l){lang=lang==="hi-IN"?"en-IN":"hi-IN";localStorage.setItem("aurvixLang",lang);l.textContent=lang==="hi-IN"?"\u0939\u093f\u0928\u094d\u0926\u0940":"English";if(convo)startListen()}
});

// ARISE gate
const g=document.createElement("div");g.id="gate";
g.innerHTML='<div class="g-tag">AURVIX</div><div class="say">Say &ldquo;Arise&rdquo;</div><div class="g-hint">to wake your assistant</div><button id="ariseMic" class="cap" type="button"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12z"/></svg><span class="bars"><i></i><i></i><i></i><i></i><i></i></span><b>Tap to speak</b></button><input id="ariseIn" placeholder="or type arise" autocomplete="off"><div id="ariseMsg"></div>';
const edge=document.createElement("div");edge.id="edge";edge.className="show";document.body.appendChild(edge);
document.body.appendChild(g);
const OK=/\b(a\s?rise|arise|arize|areas|aries)\b/i;
const mic=$("#ariseMic"),mt2=mic.querySelector("b"),ai=$("#ariseIn"),msg=$("#ariseMsg");

const jv=document.createElement("div");jv.id="jarvis";jv.innerHTML='<div id="wave">'+"<i></i>".repeat(18)+'</div><div id="jtxt"></div>';document.body.appendChild(jv);
const sbtn=document.createElement("button");sbtn.id="stopBtn";sbtn.textContent="■ Stop";sbtn.onclick=()=>{if(convo)endConvo();else window.aurvixStopVoice()};document.body.appendChild(sbtn);

function unlock(){
 if(done)return;done=true;
 try{recog&&recog.abort()}catch(e){}
 mic.classList.remove("on");mic.classList.add("ok");mt2.textContent="Welcome";edge.className="";
 const h=new Date().getHours(),w=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 const line=w+", sir. All systems are online. I am ready for your command.";
 setTimeout(()=>{g.classList.add("out");document.body.classList.remove("gated");document.body.style.overflow="";setTimeout(()=>g.remove(),1000)},900);
 setTimeout(()=>{$("#jtxt").textContent=line;jv.classList.add("show");try{window.aurvixSpeakOnCommand(line)}catch(e){}},1500);
}
mic.onclick=()=>{
 if(!SR){msg.textContent="Voice support nahi hai, neeche type karo: arise";return}
 try{recog&&recog.abort()}catch(e){}
 recog=new SR();recog.lang="en-IN";recog.interimResults=true;recog.maxAlternatives=3;
 recog.onstart=()=>{mic.classList.add("on");edge.className="hot";mt2.textContent="Listening...";msg.textContent=""};
 recog.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)for(let j=0;j<e.results[i].length;j++)if(OK.test(e.results[i][j].transcript)){unlock();return}};
 recog.onerror=e=>{msg.textContent=e.error==="not-allowed"?"Mic permission allow karo":"Awaaz saaf nahi aayi, dobara bolo"};
 recog.onend=()=>{mic.classList.remove("on");if(!done){mt2.textContent="Tap to speak";edge.className="show"}if(!done&&!msg.textContent)msg.textContent="Sirf 'Arise' bolo"};
 try{recog.start()}catch(e){msg.textContent="Dobara tap karo"}
};
ai.onkeydown=e=>{if(e.key==="Enter"){OK.test(ai.value)?unlock():msg.textContent="Galat shabd. Bolo: Arise"}};

// listen for "stop" while AI is speaking (disabled: the mic made the audio choppy on phones)
function listenStop(on){
 return;
 if(!on){try{sr&&sr.abort()}catch(e){}sr=null;return}
 try{sr=new SR();sr.lang="en-IN";sr.continuous=true;sr.interimResults=true;
  sr.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(/\b(stop|ruko|ruk|chup|bas|band)\b/i.test(e.results[i][0].transcript)){window.aurvixStopVoice();return}};
  sr.onend=()=>{if(talking)try{sr.start()}catch(e){}};sr.start()}catch(e){}
}
setInterval(()=>{
 const t=playing||!!(window.speechSynthesis&&speechSynthesis.speaking);
 if(t!==talking){talking=t;document.body.classList.toggle("talking",t);if(done)edge.className=t?"hot":"";listenStop(t);if(!t){if(convo)setTimeout(()=>{if(convo&&!talking)startListen()},500);else setTimeout(()=>{if(!talking)jv.classList.remove("show")},1800)}}
},200);

// chat: typing effect, thinking dots, SPEAK button per answer
const box=$("#chatBox");
function typeInto(b,t){let i=0;b.textContent="";b.classList.add("typing");const st=Math.max(1,Math.ceil(t.length/220));
 (function k(){i+=st;b.textContent=t.slice(0,i);box.scrollTop=box.scrollHeight;if(i<t.length)setTimeout(k,16);else{b.textContent=t;b.classList.remove("typing")}})()}
function addSpeak(n,b){const x=document.createElement("button");x.className="spk";x.textContent="🔊 Speak";x.onclick=()=>window.aurvixSpeakOnCommand(b.textContent);n.after(x)}
if(box)new MutationObserver(l=>l.forEach(m=>m.addedNodes.forEach(n=>{
 if(!n.classList||!n.classList.contains("ai")||!n.classList.contains("message"))return;
 const b=n.querySelector(".bubble");if(!b||b.querySelector("b"))return;
 const t=b.textContent;
 if(t==="Processing..."){b.textContent="Processing";b.classList.add("thinking")}
 else{typeInto(b,t);addSpeak(n,b)}
}))).observe(box,{childList:true});
})();

// ===== PAGES: Home / Chat / Modes / Account with glass tab bar =====
;(()=>{
const $=s=>document.querySelector(s);
const css=`
#tabbar{width:min(92vw,400px)}
#tabbar .ti{width:calc((100% - 10px)/4)}
#pgHome{padding-top:4px}
.hm-top{display:flex;justify-content:space-between;align-items:center;margin:4px 6px 12px}
.hm-time{font:500 13px Inter,sans-serif;opacity:.7}
.hm-pill{font:600 12px Inter,sans-serif;padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.25);color:#7dffa6}
.hm-hello{margin:0 6px;font:200 38px/1.08 Inter,sans-serif;letter-spacing:-1.5px!important}
.hm-name{font-weight:600;background:linear-gradient(90deg,#fff,#a9b8ff,#ff9fd0);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none!important}
.hm-orbwrap{position:relative;height:230px;display:grid;place-items:center;margin:2px 0}
.hm-orbwrap .orb{width:150px;height:150px;margin:0;animation:breathe 3.2s ease-in-out infinite alternate}
.hm-orbwrap:before,.hm-orbwrap:after{content:"";position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);animation:hmr 3.6s ease-out infinite}
.hm-orbwrap:after{animation-delay:1.8s}
@keyframes hmr{from{transform:scale(1);opacity:.6}to{transform:scale(2.1);opacity:0}}
.hm-orbwrap .bl{position:absolute;width:170px;height:170px;border-radius:50%;filter:blur(18px);opacity:.55;animation:hmf 9s ease-in-out infinite alternate}
.hm-orbwrap .b1{left:6%;top:10%;background:radial-gradient(circle,#0a84ff,transparent 65%)}
.hm-orbwrap .b2{right:4%;bottom:6%;background:radial-gradient(circle,#ff375f,transparent 65%);animation-delay:-4s}
@keyframes hmf{from{transform:translate3d(-14px,8px,0)}to{transform:translate3d(16px,-10px,0)}}
.hm-ask,.hm-chip,.hm-tile,.hm-row{position:relative;background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.24);box-shadow:0 6px 22px rgba(0,0,0,.16),inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(255,255,255,.08);backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);color:#fff;font-family:Inter,sans-serif}
.hm-ask{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 20px;border-radius:999px;margin:4px 2px 12px;animation:pop .6s cubic-bezier(.2,1.2,.3,1) both}
.hm-ask input{flex:1;min-width:0;background:transparent!important;border:0!important;outline:0;font-size:16px;color:#fff;padding:10px 0}
.hm-ask button{width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(135deg,#0a84ff,#7a6bff);color:#fff;font-size:18px;box-shadow:0 6px 18px rgba(10,132,255,.5)}
.hm-chips{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}
.hm-chips::-webkit-scrollbar{display:none}
.hm-chip{flex:0 0 auto;padding:11px 18px;border-radius:999px;font:600 14px Inter,sans-serif;animation:pop .5s cubic-bezier(.2,1.2,.3,1) both;animation-delay:calc(var(--k)*55ms);transition:transform .3s cubic-bezier(.2,1.7,.4,1)}
.hm-chip:active,.hm-row:active,.hm-ask button:active{transform:scale(.93)}
.hm-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 2px 6px}
.hm-tile{padding:14px 12px;border-radius:22px;animation:pop .6s cubic-bezier(.2,1.2,.3,1) both;animation-delay:calc(var(--k)*70ms + .2s)}
.hm-tile small{display:block;opacity:.65;font-size:11px;margin-bottom:4px}
.hm-tile b{font:600 14px Inter,sans-serif}
.hm-talk{display:flex;gap:10px;justify-content:center;margin:2px 0 6px}
#hmTalk{display:flex;align-items:center;gap:10px;padding:14px 26px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:linear-gradient(135deg,rgba(10,132,255,.55),rgba(191,90,242,.35));color:#fff;font:600 16px Inter,sans-serif;box-shadow:0 10px 30px rgba(10,132,255,.45),inset 0 1.5px 0 rgba(255,255,255,.7);transition:transform .3s cubic-bezier(.2,1.7,.4,1)}
#hmTalk:active{transform:scale(.94)}
#hmLang{padding:14px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font:600 14px Inter,sans-serif}
.hm-state{text-align:center;font:500 13px Inter,sans-serif;opacity:.75;margin:0 0 12px;min-height:18px}
body.cv-listening .hm-orbwrap .orb,body.cv-speaking .hm-orbwrap .orb{animation:breathe .6s ease-in-out infinite alternate}
body.cv-listening #hmTalk{animation:mp 1.2s infinite}
body.cv-thinking .hm-orbwrap .orb i{animation-duration:1.4s}
.hm-h{margin:14px 6px 8px;font:600 15px Inter,sans-serif;opacity:.8}
.hm-row{display:block;width:100%;text-align:left;padding:15px 18px;border-radius:20px;margin:0 0 9px;font:500 14px/1.35 Inter,sans-serif;animation:pop .5s cubic-bezier(.2,1.2,.3,1) both;animation-delay:calc(var(--k)*70ms + .4s);transition:transform .3s cubic-bezier(.2,1.7,.4,1)}
`;
document.head.appendChild(Object.assign(document.createElement("style"),{textContent:css}));

const app=$("#app"),main=$("main"),hero=$(".hero"),sys=$(".system-panel"),chat=$(".chat-panel"),top=$(".topbar"),foot=$("footer"),lo=$("#logoutBtn"),al=$("#accountLabel"),inp=$("#messageInput"),sendB=$("#sendBtn");
if(!app||!main||!chat)return;
const pg=id=>{const d=document.createElement("section");d.id=id;d.className="pg";return d};
const pH=pg("pgHome"),pC=pg("pgChat"),pM=pg("pgModes"),pA=pg("pgAccount");

// home page
pH.innerHTML='<div class="hm-top"><span class="hm-time"></span><span class="hm-pill">● Online</span></div><div class="hm-hello"><div class="hi">Hello,</div><div class="hm-name">there</div></div><div class="hm-orbwrap"><span class="bl b1"></span><span class="bl b2"></span><div class="orb"><i></i></div></div><div class="hm-talk"><button id="hmTalk" type="button"><span>\ud83c\udf99</span><b>Talk to AURVIX</b></button><button id="hmLang" type="button">'+(localStorage.getItem("aurvixLang")==="en-IN"?"English":"\u0939\u093f\u0928\u094d\u0926\u0940")+'</button></div><div class="hm-state" id="hmState">Tap to start a voice conversation</div><div class="hm-ask"><input id="hmIn" placeholder="Ask AURVIX anything..." autocomplete="off"><button id="hmGo" type="button" aria-label="Send">&#10148;</button></div><div class="hm-chips"></div><div class="hm-tiles"><div class="hm-tile" style="--k:0"><small>Mode</small><b class="hmm">General</b></div><div class="hm-tile" style="--k:1"><small>Voice</small><b>ElevenLabs</b></div><div class="hm-tile" style="--k:2"><small>Status</small><b>Ready</b></div></div><h3 class="hm-h">Try asking</h3><div class="hm-sug"></div>';
const hmTime=pH.querySelector(".hm-time"),hmHi=pH.querySelector(".hi"),hmName=pH.querySelector(".hm-name"),hmMode=pH.querySelector(".hmm"),hmIn=pH.querySelector("#hmIn");
const tick=()=>{const d=new Date(),h=d.getHours();hmHi.textContent=h<12?"Good morning,":h<17?"Good afternoon,":"Good evening,";hmTime.textContent=d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"})+" \u00b7 "+d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};tick();setInterval(tick,30000);

// chat page
const pill=document.createElement("button");pill.id="modePill";pill.type="button";pill.innerHTML='<span>General</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
pC.append(top,pill,chat);

// modes page
pM.innerHTML='<h2 class="lt">Modes</h2><p class="ls">Choose how AURVIX thinks</p><div class="grid"></div>';
const grid=pM.querySelector(".grid");
const MD={General:["💬","Everyday questions"],Study:["📚","Simple explanations"],Code:["💻","Write and explain code"],Writer:["✍️","Polished writing"],Translator:["🌐","Any language"],"Math S