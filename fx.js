(()=>{
const $=s=>document.querySelector(s),rnd=(a,b)=>Math.random()*(b-a)+a;
document.body.style.overflow="hidden";
const aura=document.createElement("div");aura.id="aura";document.body.appendChild(aura);

// rising blue / violet sparks
const cv=document.createElement("canvas");cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none";document.body.prepend(cv);
const cx=cv.getContext("2d");let W,H;const P=[];
const fit=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight};fit();addEventListener("resize",fit);
for(let i=0;i<70;i++)P.push({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2.6),v:rnd(.2,.8),d:rnd(0,6),c:Math.random()<.65?"90,160,255":"150,100,255"});
(function loop(){cx.clearRect(0,0,W,H);P.forEach(p=>{p.y-=p.v;p.d+=.02;p.x+=Math.sin(p.d)*.4;if(p.y<-10){p.y=H+10;p.x=rnd(0,W)}
 cx.beginPath();cx.fillStyle="rgba("+p.c+","+(.3+.5*Math.abs(Math.sin(p.d)))+")";cx.shadowBlur=12;cx.shadowColor="rgb("+p.c+")";cx.arc(p.x,p.y,p.r,0,6.3);cx.fill()});requestAnimationFrame(loop)})();

// system toast
const tt=document.createElement("div");tt.id="sysToast";document.body.appendChild(tt);let tm;
window.sysToast=(t,h)=>{tt.innerHTML="<b>[ "+(h||"SYSTEM")+" ]</b>"+t;tt.classList.add("show");clearTimeout(tm);tm=setTimeout(()=>tt.classList.remove("show"),2600)};

// ARISE gate
const g=document.createElement("div");g.id="gate";
g.innerHTML='<div class="smoke"></div><div class="smoke b"></div><div class="sysbox"><span class="sys-tag">SYSTEM</span><div class="sys-title">PLAYER DETECTED</div><div class="sys-sub">A shadow waits for your command.<br>Speak the word to awaken it.</div><div class="say">ARISE</div><button id="ariseMic" type="button">TAP &amp; SPEAK</button><input id="ariseIn" placeholder="or type: arise" autocomplete="off"><div id="ariseMsg"></div></div><div class="blast"><span>ARISE</span><i></i><i></i></div>';
document.body.appendChild(g);
const OK=/\b(a\s?rise|arise|arize|areas|aries)\b/i;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let recog=null,done=false;
const mic=$("#ariseMic"),inp=$("#ariseIn"),msg=$("#ariseMsg");
function unlock(){
 if(done)return;done=true;
 try{recog&&recog.abort()}catch(e){}
 g.classList.add("blast","flash");document.body.classList.add("quake");
 if(navigator.vibrate)navigator.vibrate([80,40,160]);
 setTimeout(()=>document.body.classList.remove("quake"),520);
 try{window.aurvixSpeakOnCommand&&window.aurvixSpeakOnCommand("Awakened. AURVIX is online. Give me your command.")}catch(e){}
 setTimeout(()=>{g.classList.add("out");document.body.style.overflow="";setTimeout(()=>{g.remove();window.sysToast("Shadow awakened. AURVIX is online.")},900)},2300);
}
mic.onclick=()=>{
 if(!SR){msg.textContent="Voice support nahi hai, neeche type karo: arise";return}
 try{recog&&recog.abort()}catch(e){}
 recog=new SR();recog.lang="en-IN";recog.interimResults=true;recog.maxAlternatives=3;
 recog.onstart=()=>{mic.classList.add("on");mic.textContent="LISTENING";msg.textContent=""};
 recog.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)for(let j=0;j<e.results[i].length;j++)if(OK.test(e.results[i][j].transcript)){unlock();return}};
 recog.onerror=e=>{msg.textContent=e.error==="not-allowed"?"Mic permission allow karo":"Awaaz saaf nahi aayi, dobara bolo"};
 recog.onend=()=>{mic.classList.remove("on");mic.textContent="TAP & SPEAK";if(!done&&!msg.textContent)msg.textContent="Sirf 'ARISE' bolo"};
 try{recog.start()}catch(e){msg.textContent="Dobara tap karo"}
};
inp.onkeydown=e=>{if(e.key==="Enter"){OK.test(inp.value)?unlock():msg.textContent="Galat shabd. Bolo: ARISE"}};

// tap ripple
addEventListener("pointerdown",e=>{const r=document.createElement("span");r.className="ripple";r.style.left=e.clientX+"px";r.style.top=e.clientY+"px";document.body.appendChild(r);setTimeout(()=>r.remove(),700)});

// module toasts
document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>{if(!$("#gate"))window.sysToast("Module activated: "+b.textContent.trim())}));

// chat: typing effect, thinking dots, error alert
const box=$("#chatBox");
function typeInto(b,t){let i=0;b.textContent="";b.classList.add("typing");const s=Math.max(1,Math.ceil(t.length/220));
 (function k(){i+=s;b.textContent=t.slice(0,i);box.scrollTop=box.scrollHeight;if(i<t.length)setTimeout(k,16);else{b.textContent=t;b.classList.remove("typing")}})()}
if(box)new MutationObserver(l=>l.forEach(m=>m.addedNodes.forEach(n=>{
 if(!n.classList||!n.classList.contains("ai")||!n.classList.contains("message"))return;
 const b=n.querySelector(".bubble");if(!b||b.querySelector("b"))return;
 const t=b.textContent;
 if(t==="Processing..."){b.textContent="Processing";b.classList.add("thinking")}
 else{if(/^Error:/.test(t))window.sysToast(t.slice(0,90),"ALERT");typeInto(b,t)}
}))).observe(box,{childList:true});

const mc=$("#voiceBtn");
if(mc)new MutationObserver(()=>mc.classList.toggle("listening",/Listening/.test(mc.textContent))).observe(mc,{childList:true,characterData:true,subtree:true});
})();