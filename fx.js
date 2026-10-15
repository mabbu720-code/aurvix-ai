(()=>{
const $=s=>document.querySelector(s);
document.body.classList.add("gated");document.body.style.overflow="hidden";
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let talking=false,scene=null,done=false,recog=null,sr=null;

document.querySelectorAll(".panel-heading span:first-child").forEach((e,i)=>e.textContent=i?"AURVIX // INTERFACE":"SYSTEM // VOICE");
const mt=$(".mode-title");if(mt)mt.firstChild.textContent="SELECT PROTOCOL ";
const inp=$("#messageInput");if(inp)inp.placeholder="Ask AURVIX anything...";

// auto replies stay silent; speech only when asked
window.aurvixSpeakReply=()=>{};
const toStop=t=>/^\s*(ruko|ruk jao|chup|chup ho jao|bas|band karo|stop)\W*$/i.test(t);
const toSpeak=t=>/^\s*(bolo|bol do|bol|sunao|padho|bolke batao)\W*$/i.test(t);
const fix=()=>{if(!inp)return;const v=inp.value;if(toStop(v)){window.aurvixStopVoice();inp.value=""}else if(toSpeak(v))inp.value="speak this"};
const sb=$("#sendBtn");if(sb)sb.addEventListener("click",fix,true);
if(inp)inp.addEventListener("keydown",e=>{if(e.key==="Enter")fix()},true);
const ov=window.aurvixSendVoiceText;
if(ov)window.aurvixSendVoiceText=t=>{if(toStop(t)){window.aurvixStopVoice();return}ov(toSpeak(t)?"speak this":t)};

// JARVIS-style HUD background (2D canvas, no external library)
const cv=document.createElement("canvas");cv.id="scene3d";document.body.prepend(cv);
const cx=cv.getContext("2d");let W,H,X,Y,R,boost=0,ph=0,last=performance.now(),hex=[];
const fit=()=>{const d=Math.min(devicePixelRatio,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)};fit();addEventListener("resize",fit);
const dots=Array.from({length:30},()=>({r:.3+Math.random()*.7,a:Math.random()*6.28,v:(Math.random()-.5)*.6}));
const mkHex=()=>{hex=Array.from({length:9},()=>"0x"+Math.floor(Math.random()*65535).toString(16).toUpperCase().padStart(4,"0")+" "+Math.floor(Math.random()*99))};mkHex();setInterval(mkHex,600);
const col=a=>"rgba(0,212,255,"+a+")";
const arc=(r,a0,a1,w,al)=>{cx.beginPath();cx.arc(X,Y,r,a0,a1);cx.lineWidth=w;cx.strokeStyle=col(al);cx.stroke()};
const ticks=(r,n,rot,len,al)=>{cx.beginPath();for(let i=0;i<n;i++){const a=i*6.2832/n+rot,l=i%5?len:len*2;cx.moveTo(X+Math.cos(a)*r,Y+Math.sin(a)*r);cx.lineTo(X+Math.cos(a)*(r+l),Y+Math.sin(a)*(r+l))}cx.lineWidth=1.2;cx.strokeStyle=col(al);cx.stroke()};
(function loop(){
 const now=performance.now(),dt=(now-last)/1000;last=now;
 ph+=dt*(talking?1.9:1);
 X=W/2;Y=H*.34;R=Math.min(W*.46,H*.3)*(1+boost*.22);
 const al=.55+boost*.4+(talking?.2:0);
 cx.clearRect(0,0,W,H);cx.globalCompositeOperation="lighter";
 ticks(R,120,ph*.1,6,al*.8);
 for(let i=0;i<4;i++)arc(R*.88,-ph*.2+i*1.5708,-ph*.2+i*1.5708+1.1,5,al);
 arc(R*.8,0,6.3,1,.25);
 for(let i=0;i<8;i++){const a=ph*.3+i*.785;cx.beginPath();cx.arc(X+Math.cos(a)*R*.8,Y+Math.sin(a)*R*.8,3,0,6.3);cx.fillStyle=col(al);cx.fill()}
 for(let i=0;i<3;i++)arc(R*.68,ph*.45+i*2.09,ph*.45+i*2.09+1.5,3,al);
 ticks(R*.58,60,-ph*.25,4,al*.7);
 const g=R*.4;
 for(let i=0;i<8;i++){cx.beginPath();cx.ellipse(X,Y,Math.abs(Math.cos(ph*.5+i*.3927))*g,g,0,0,6.3);cx.lineWidth=1;cx.strokeStyle=col(.35*al);cx.stroke()}
 for(let i=-2;i<=2;i++){const sy=Math.sin(i*.5)*g,rx=Math.cos(i*.5)*g;cx.beginPath();cx.ellipse(X,Y+sy,rx,rx*.25,0,0,6.3);cx.lineWidth=1;cx.strokeStyle=col(.35*al);cx.stroke()}
 if(cx.createConicGradient){const c=cx.createConicGradient(ph*.8,X,Y);c.addColorStop(0,col(.35));c.addColorStop(.12,col(0));c.addColorStop(1,col(0));cx.fillStyle=c;cx.beginPath();cx.arc(X,Y,R*.78,0,6.3);cx.fill()}
 const cr=R*(.14+Math.sin(ph*4)*.012+(talking?.04:0)+boost*.08),gr=cx.createRadialGradient(X,Y,0,X,Y,cr*2.4);
 gr.addColorStop(0,"rgba(220,252,255,.95)");gr.addColorStop(.35,col(.6));gr.addColorStop(1,col(0));cx.fillStyle=gr;cx.beginPath();cx.arc(X,Y,cr*2.4,0,6.3);cx.fill();
 dots.forEach(d=>{d.a+=d.v*dt*(talking?1.9:1);cx.beginPath();cx.arc(X+Math.cos(d.a)*R*d.r,Y+Math.sin(d.a)*R*d.r,1.8,0,6.3);cx.fillStyle=col(.7);cx.fill()});
 cx.globalCompositeOperation="source-over";cx.font="10px monospace";cx.fillStyle=col(.5);
 hex.forEach((h,i)=>{cx.fillText(h,10,Y-R*.6+i*14);cx.fillText(h,W-60,Y-R*.6+i*14)});
 boost*=.97;requestAnimationFrame(loop);
})();
scene={rise:()=>{boost=1}};

// voice authorization gate
const g=document.createElement("div");g.id="gate";
g.innerHTML='<div class="hud"><small>VOICE AUTHORIZATION</small><h2>INITIALIZE AURVIX</h2><div class="reactor"><i></i><i></i><i></i><button id="ariseMic" type="button">TAP &amp; SAY</button></div><div class="say">ARISE</div><input id="ariseIn" placeholder="or type: arise" autocomplete="off"><div id="ariseMsg"></div></div>';
document.body.appendChild(g);
const OK=/\b(a\s?rise|arise|arize|areas|aries)\b/i;
const mic=$("#ariseMic"),ai=$("#ariseIn"),msg=$("#ariseMsg");

const jv=document.createElement("div");jv.id="jarvis";jv.innerHTML='<div id="wave">'+"<i></i>".repeat(18)+'</div><div id="jtxt"></div>';document.body.appendChild(jv);
const sbtn=document.createElement("button");sbtn.id="stopBtn";sbtn.textContent="■ STOP";sbtn.onclick=()=>window.aurvixStopVoice();document.body.appendChild(sbtn);

function unlock(){
 if(done)return;done=true;
 try{recog&&recog.abort()}catch(e){}
 g.classList.add("go");scene&&scene.rise();
 if(navigator.vibrate)navigator.vibrate([80,40,200]);
 const h=new Date().getHours(),w=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 const line=w+", sir. All systems are online. I am ready for your command.";
 setTimeout(()=>{$("#jtxt").textContent=line;jv.classList.add("show");try{window.aurvixSpeakOnCommand(line)}catch(e){}},1500);
 setTimeout(()=>{g.classList.add("out");document.body.classList.remove("gated");document.body.style.overflow="";setTimeout(()=>g.remove(),1200)},2800);
}
mic.onclick=()=>{
 if(!SR){msg.textContent="Voice support nahi hai, neeche type karo: arise";return}
 try{recog&&recog.abort()}catch(e){}
 recog=new SR();recog.lang="en-IN";recog.interimResults=true;recog.maxAlternatives=3;
 recog.onstart=()=>{mic.classList.add("on");mic.textContent="LISTENING";msg.textContent=""};
 recog.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)for(let j=0;j<e.results[i].length;j++)if(OK.test(e.results[i][j].transcript)){unlock();return}};
 recog.onerror=e=>{msg.textContent=e.error==="not-allowed"?"Mic permission allow karo":"Awaaz saaf nahi aayi, dobara bolo"};
 recog.onend=()=>{mic.classList.remove("on");mic.textContent="TAP & SAY";if(!done&&!msg.textContent)msg.textContent="Sirf 'ARISE' bolo"};
 try{recog.start()}catch(e){msg.textContent="Dobara tap karo"}
};
ai.onkeydown=e=>{if(e.key==="Enter"){OK.test(ai.value)?unlock():msg.textContent="Galat shabd. Bolo: ARISE"}};

// listen for "stop" while AI is speaking
function listenStop(on){
 if(!SR)return;
 if(!on){try{sr&&sr.abort()}catch(e){}sr=null;return}
 try{sr=new SR();sr.lang="en-IN";sr.continuous=true;sr.interimResults=true;
  sr.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(/\b(stop|ruko|ruk|chup|bas|band)\b/i.test(e.results[i][0].transcript)){window.aurvixStopVoice();return}};
  sr.onend=()=>{if(talking)try{sr.start()}catch(e){}};sr.start()}catch(e){}
}
setInterval(()=>{
 const t=!!(window.speechSynthesis&&speechSynthesis.speaking);
 if(t!==talking){talking=t;document.body.classList.toggle("talking",t);listenStop(t);if(!t)setTimeout(()=>{if(!talking)jv.classList.remove("show")},1800)}
},200);

// chat: typing effect, thinking dots, SPEAK button per answer
const box=$("#chatBox");
function typeInto(b,t){let i=0;b.textContent="";b.classList.add("typing");const st=Math.max(1,Math.ceil(t.length/220));
 (function k(){i+=st;b.textContent=t.slice(0,i);box.scrollTop=box.scrollHeight;if(i<t.length)setTimeout(k,16);else{b.textContent=t;b.classList.remove("typing")}})()}
function addSpeak(n,b){const x=document.createElement("button");x.className="spk";x.textContent="🔊 SPEAK";x.onclick=()=>window.aurvixSpeakOnCommand(b.textContent);n.after(x)}
if(box)new MutationObserver(l=>l.forEach(m=>m.addedNodes.forEach(n=>{
 if(!n.classList||!n.classList.contains("ai")||!n.classList.contains("message"))return;
 const b=n.querySelector(".bubble");if(!b||b.querySelector("b"))return;
 const t=b.textContent;
 if(t==="Processing..."){b.textContent="Processing";b.classList.add("thinking")}
 else{typeInto(b,t);addSpeak(n,b)}
}))).observe(box,{childList:true});

// 3D panel tilt
addEventListener("pointermove",e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
 document.querySelectorAll(".system-panel,.chat-panel").forEach(p=>p.style.transform="perspective(1100px) rotateX("+(-y*3)+"deg) rotateY("+(x*4)+"deg)")});
})();