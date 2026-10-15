(()=>{
const $=s=>document.querySelector(s);
document.body.classList.add("gated");document.body.style.overflow="hidden";
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let talking=false,scene=null,done=false,recog=null,sr=null;

// relabel UI (no terminal look)
document.querySelectorAll(".panel-heading span:first-child").forEach((e,i)=>e.textContent=i?"ASK AURVIX":"VOICE");
const mt=$(".mode-title");if(mt)mt.firstChild.textContent="CHOOSE MODE ";
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

// 3D scene
const cv=document.createElement("canvas");cv.id="scene3d";document.body.prepend(cv);
function init(){
 const T=window.THREE;
 const R=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));
 const S=new T.Scene();S.fog=new T.FogExp2(0x03040c,.04);
 const C=new T.PerspectiveCamera(48,1,.1,100);
 const fit=()=>{R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()};fit();addEventListener("resize",fit);
 S.add(new T.AmbientLight(0x30345a,.9));
 const kL=new T.PointLight(0x6a4cff,2.4,30);kL.position.set(-4,5,4);S.add(kL);
 const rL=new T.PointLight(0x2f8bff,2.6,30);rL.position.set(4,3,-3);S.add(rL);
 const dark=new T.MeshStandardMaterial({color:0x0b0c1c,roughness:.5,metalness:.4,side:T.DoubleSide});
 const H=new T.Group();H.visible=false;
 H.add(new T.Mesh(new T.LatheGeometry([[0,0],[1.15,0],[1,1],[.62,2.3],[.42,3],[0,3.2]].map(p=>new T.Vector2(p[0],p[1])),40),dark));
 const sh=new T.Mesh(new T.SphereGeometry(.62,24,16),dark);sh.scale.set(1.5,.55,.8);sh.position.y=2.7;H.add(sh);
 const hd=new T.Mesh(new T.SphereGeometry(.34,24,24),new T.MeshStandardMaterial({color:0x05050c,roughness:.9}));hd.position.y=3.38;H.add(hd);
 const hood=new T.Mesh(new T.ConeGeometry(.5,.9,32,1,true),dark);hood.position.y=3.55;hood.rotation.x=-.12;H.add(hood);
 const eyeM=new T.MeshBasicMaterial({color:0xb7a4ff});
 [-.12,.12].forEach(x=>{const e=new T.Mesh(new T.SphereGeometry(.045,12,12),eyeM);e.position.set(x,3.4,.28);e.scale.set(1.6,.7,1);H.add(e)});
 S.add(H);
 const rings=[1.8,2.4,3.1].map((r,i)=>{const m=new T.Mesh(new T.TorusGeometry(r,.03,8,96),new T.MeshBasicMaterial({color:i%2?0x2f8bff:0x7a5cff,transparent:true,opacity:.85}));m.rotation.x=Math.PI/2;m.position.y=.02;S.add(m);return m});
 const N=700,pos=new Float32Array(N*3),sp=[];
 for(let i=0;i<N;i++){const a=Math.random()*6.28,r=.8+Math.random()*1.7;pos.set([Math.cos(a)*r,Math.random()*5,Math.sin(a)*r],i*3);sp.push(.01+Math.random()*.03)}
 const pg=new T.BufferGeometry();pg.setAttribute("position",new T.BufferAttribute(pos,3));
 const pts=new T.Points(pg,new T.PointsMaterial({color:0x8b6bff,size:.07,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));S.add(pts);
 let rise=0,on=false,boost=0,px=0,py=0;
 addEventListener("pointermove",e=>{px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5});
 const t0=performance.now();
 (function loop(){
  const t=(performance.now()-t0)/1000;
  if(on)rise=Math.min(1,rise+.006);
  const e=1-Math.pow(1-rise,3);
  H.position.y=-4.4+4.4*e;H.rotation.y=Math.sin(t*.4)*.25+px*.5;
  rings.forEach((m,i)=>{m.rotation.z=t*(i%2?-.6:.8);m.scale.setScalar(1+Math.sin(t*2+i)*.02+boost*.25)});
  const p=pg.attributes.position;
  for(let i=0;i<N;i++){let y=p.getY(i)+sp[i]*(1+boost*6+(on?1:0));if(y>5.5)y=0;p.setY(i,y)}
  p.needsUpdate=true;pts.rotation.y=t*.15;
  eyeM.color.setHex(talking?0xffffff:0xb7a4ff);
  kL.intensity=2.4+Math.sin(t*3)*.4+boost*6;
  C.position.set(px*1.4,2.6-py*.8,9.5-e*1.2);C.lookAt(0,.7,0);
  boost*=.97;R.render(S,C);requestAnimationFrame(loop);
 })();
 scene={rise:()=>{H.visible=true;on=true;boost=1}};
}
const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";s.onload=()=>{try{init()}catch(e){}};document.head.appendChild(s);

// ARISE gate
const g=document.createElement("div");g.id="gate";
g.innerHTML='<div class="sysbox"><div class="sys-tag">SHADOW PROTOCOL</div><div class="sys-title">AWAKEN AURVIX</div><div class="sys-sub">Speak the word to begin.</div><div class="say">ARISE</div><button id="ariseMic" type="button">TAP &amp; SPEAK</button><input id="ariseIn" placeholder="or type: arise" autocomplete="off"><div id="ariseMsg"></div></div>';
document.body.appendChild(g);
const OK=/\b(a\s?rise|arise|arize|areas|aries)\b/i;
const mic=$("#ariseMic"),ai=$("#ariseIn"),msg=$("#ariseMsg");

// Jarvis HUD
const jv=document.createElement("div");jv.id="jarvis";jv.innerHTML='<div id="wave">'+"<i></i>".repeat(18)+'</div><div id="jtxt"></div>';document.body.appendChild(jv);
const sbtn=document.createElement("button");sbtn.id="stopBtn";sbtn.textContent="■ STOP";sbtn.onclick=()=>window.aurvixStopVoice();document.body.appendChild(sbtn);

function unlock(){
 if(done)return;done=true;
 try{recog&&recog.abort()}catch(e){}
 g.classList.add("go");scene&&scene.rise();
 if(navigator.vibrate)navigator.vibrate([80,40,200]);
 const h=new Date().getHours(),w=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 const line=w+", sir. Shadow protocol is online. All systems are operational, and I am ready for your command.";
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
 recog.onend=()=>{mic.classList.remove("on");mic.textContent="TAP & SPEAK";if(!done&&!msg.textContent)msg.textContent="Sirf 'ARISE' bolo"};
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