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
// auto replies stay silent; speech only when asked
window.aurvixSpeakReply=()=>{};
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
// ARISE gate
const g=document.createElement("div");g.id="gate";
g.innerHTML='<div class="g-tag">AURVIX</div><div class="say">Say &ldquo;Arise&rdquo;</div><div class="g-hint">to wake your assistant</div><button id="ariseMic" class="cap" type="button"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12z"/></svg><span class="bars"><i></i><i></i><i></i><i></i><i></i></span><b>Tap to speak</b></button><input id="ariseIn" placeholder="or type arise" autocomplete="off"><div id="ariseMsg"></div>';
const edge=document.createElement("div");edge.id="edge";edge.className="show";document.body.appendChild(edge);
document.body.appendChild(g);
const OK=/\b(a\s?rise|arise|arize|areas|aries)\b/i;
const mic=$("#ariseMic"),mt2=mic.querySelector("b"),ai=$("#ariseIn"),msg=$("#ariseMsg");

const jv=document.createElement("div");jv.id="jarvis";jv.innerHTML='<div id="wave">'+"<i></i>".repeat(18)+'</div><div id="jtxt"></div>';document.body.appendChild(jv);
const sbtn=document.createElement("button");sbtn.id="stopBtn";sbtn.textContent="■ Stop";sbtn.onclick=()=>window.aurvixStopVoice();document.body.appendChild(sbtn);

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

// listen for "stop" while AI is speaking
function listenStop(on){
 if(!SR)return;
 if(!on){try{sr&&sr.abort()}catch(e){}sr=null;return}
 try{sr=new SR();sr.lang="en-IN";sr.continuous=true;sr.interimResults=true;
  sr.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(/\b(stop|ruko|ruk|chup|bas|band)\b/i.test(e.results[i][0].transcript)){window.aurvixStopVoice();return}};
  sr.onend=()=>{if(talking)try{sr.start()}catch(e){}};sr.start()}catch(e){}
}
setInterval(()=>{
  const t=playing||!!(window.speechSynthesis&&speechSynthesis.speaking);
 if(t!==talking){talking=t;document.body.classList.toggle("talking",t);if(done)edge.className=t?"hot":"";listenStop(t);if(!t)setTimeout(()=>{if(!talking)jv.classList.remove("show")},1800)}
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

// ===== PAGES: Chat / Modes / Account with glass tab bar =====
;(()=>{
const $=s=>document.querySelector(s);


const app=$("#app"),main=$("main"),hero=$(".hero"),sys=$(".system-panel"),chat=$(".chat-panel"),top=$(".topbar"),foot=$("footer"),lo=$("#logoutBtn"),al=$("#accountLabel"),inp=$("#messageInput");
if(!app||!main||!chat)return;
const pg=id=>{const d=document.createElement("section");d.id=id;d.className="pg";return d};
const pC=pg("pgChat"),pM=pg("pgModes"),pA=pg("pgAccount");

// chat page
const pill=document.createElement("button");pill.id="modePill";pill.type="button";pill.innerHTML='<span>General</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
pC.append(top,pill,chat);

// modes page
pM.innerHTML='<h2 class="lt">Modes</h2><p class="ls">Choose how AURVIX thinks</p><div class="grid"></div>';
const grid=pM.querySelector(".grid");
const MD={General:["💬","Everyday questions"],Study:["📚","Simple explanations"],Code:["💻","Write and explain code"],Writer:["✍️","Polished writing"],Translator:["🌐","Any language"],"Math Solver":["➗","Step-by-step solutions"],Research:["🔎","Structured overviews"],Summarizer:["📝","Short, clear summaries"],Debugger:["🐞","Find and fix bugs"],Creative:["🎨","Imaginative ideas"],"Quiz Master":["🎯","Test your knowledge"],"Deep Think":["🧠","Careful reasoning"]};
chat.querySelectorAll(".mode").forEach((b,k)=>{
 const n=b.dataset.mode,d=MD[n]||["✨",""],c=document.createElement("button");
 c.type="button";c.className="mc"+(b.classList.contains("active")?" on":"");c.style.setProperty("--k",k);
 c.innerHTML='<span class="ic">'+d[0]+'</span><b>'+n+'</b><small>'+d[1]+'</small>';
 c.onclick=()=>{b.click();grid.querySelectorAll(".mc").forEach(x=>x.classList.remove("on"));c.classList.add("on");pill.querySelector("span").textContent=n;setTimeout(()=>go("chat"),240)};
 grid.appendChild(c);
});

// account page
const prof=document.createElement("div");prof.className="prof";prof.innerHTML='<div class="pav" id="pav">A</div><div><div class="pn" id="pn">Account</div><div class="ps">Signed in</div></div>';
pA.innerHTML='<h2 class="lt">Account</h2><p class="ls">Profile, voice and sign out</p>';
pA.append(prof);if(sys)pA.append(sys);if(lo)pA.append(lo);if(hero)pA.append(hero);if(foot)pA.append(foot);
const pn=prof.querySelector("#pn"),pv=prof.querySelector("#pav");
const upd=()=>{if(!al)return;const n=al.textContent.replace(/^IDENTITY:\s*/i,"").trim()||"Account";pn.textContent=n;pv.textContent=(n[0]||"A").toUpperCase()};
if(al){new MutationObserver(upd).observe(al,{childList:true,characterData:true,subtree:true});upd()}
if(lo)lo.addEventListener("click",()=>setTimeout(()=>go("chat"),300));

main.append(pC,pM,pA);

// glass tab bar
const IC={chat:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12z"/>',modes:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',account:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'};
const tb=document.createElement("nav");tb.id="tabbar";
tb.innerHTML='<i class="ti"></i>'+["chat","modes","account"].map(p=>'<button type="button" data-p="'+p+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[p]+'</svg><span>'+p[0].toUpperCase()+p.slice(1)+'</span></button>').join("");
app.appendChild(tb);

const order=["chat","modes","account"],pages=[pC,pM,pA];let cur=0;
function go(p){
 const i=order.indexOf(p);if(i<0)return;
 pages.forEach((e,k)=>{e.dataset.d=i>=cur?"r":"l";e.classList.toggle("on",k===i)});
 tb.style.setProperty("--i",i);
 tb.querySelectorAll("button").forEach((b,k)=>b.classList.toggle("on",k===i));
 cur=i;window.scrollTo({top:0,behavior:"smooth"});
}
tb.addEventListener("click",e=>{const b=e.target.closest("button");if(b)go(b.dataset.p)});
pill.onclick=()=>go("modes");
go("chat");

// keep the Apple-style placeholder
if(inp)new MutationObserver(()=>{if(inp.placeholder==="Enter command here...")inp.placeholder="Message AURVIX"}).observe(inp,{attributes:true,attributeFilter:["placeholder"]});
})();