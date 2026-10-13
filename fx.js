// AURVIX FX v3: hacker theme
(()=>{
const $=s=>document.querySelector(s),rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
document.querySelectorAll(".hero h1,.auth-card h1").forEach(h=>h.setAttribute("data-text",h.textContent));

// background layers
["gridFloor","vignette","alertFlash","hexStream"].forEach(id=>{const d=document.createElement("div");d.id=id;document.body.appendChild(d)});
let hx="";for(let i=0;i<60;i++)hx+=Array.from({length:4},()=>rnd(0,65535).toString(16).padStart(4,"0").toUpperCase()).join(" ")+"\n";
$("#hexStream").innerHTML="<pre>"+hx+hx+"</pre>";

// boot sequence (once per session)
if(!sessionStorage.getItem("aurvixBooted")){
 const o=document.createElement("div");o.id="bootOverlay";
 const L=["BIOS v9.4 ... OK","> loading kernel modules","> mounting /dev/neural0 ......... OK","> bypassing idle limits ........... OK","> spawning matrix renderer ........ OK","> establishing secure channel ..... OK","> decrypting identity layer ....... OK"];
 let h="";L.forEach((x,i)=>h+='<div class="bl" style="animation-delay:'+(i*.32)+'s">'+x+' <span class="hexb">0x'+rnd(4096,65535).toString(16).toUpperCase()+'</span></div>');
 h+='<div id="bootBar"><i></i></div><div id="granted">ACCESS GRANTED</div>';
 o.innerHTML=h;document.body.appendChild(o);
 setTimeout(()=>o.classList.add("done"),3500);setTimeout(()=>o.remove(),4300);
 sessionStorage.setItem("aurvixBooted","1");
}

// random glitch bursts
(function burst(){setTimeout(()=>{document.body.classList.add("glitch");setTimeout(()=>document.body.classList.remove("glitch"),340);burst()},rnd(5000,11000))})();

// click/touch ripple
addEventListener("pointerdown",e=>{const r=document.createElement("span");r.className="ripple";r.style.left=e.clientX+"px";r.style.top=e.clientY+"px";document.body.appendChild(r);setTimeout(()=>r.remove(),700)});

// 3D tilt on hero
const sc=$(".hacker-scene");
addEventListener("pointermove",e=>{if(sc)sc.style.transform="perspective(600px) rotateX("+((e.clientY/innerHeight-.5)*-16)+"deg) rotateY("+((e.clientX/innerWidth-.5)*16)+"deg)"});

// decorative live monitor (visual effect, not real stats)
const sp=$(".system-panel");
if(sp){
 const d=document.createElement("div");d.className="live";
 d.innerHTML=["CPU","MEM","NET"].map(n=>'<div><small>'+n+' <b id="lv'+n+'">0%</b></small><span><i id="lb'+n+'"></i></span></div>').join("")+'<div class="logtick" id="logTick"></div>';
 sp.appendChild(d);
 const logs=["[SCAN] port 443 ........ SECURE","[AUTH] session token verified","[AI] model warm, latency optimal","[NET] encrypted tunnel active","[SYS] heartbeat OK","[FW] 0 threats detected","[CORE] cache synced"];
 setInterval(()=>["CPU","MEM","NET"].forEach(n=>{const v=n==="MEM"?rnd(35,62):rnd(12,88);$("#lv"+n).textContent=v+"%";$("#lb"+n).style.width=v+"%"}),900);
 let li=0;setInterval(()=>{$("#logTick").textContent=logs[li++%logs.length]},1400);
}
const mi=$("#messageInput");if(mi)mi.placeholder="root@aurvix:~$ type command...";

// chat: typing effect, thinking dots, red alert on errors
const box=$("#chatBox");
function alertFx(){document.body.classList.add("alert","shake");setTimeout(()=>document.body.classList.remove("alert","shake"),700)}
function typeInto(b,text){
 let i=0;b.textContent="";b.classList.add("typing");
 const step=Math.max(1,Math.ceil(text.length/220));
 (function tick(){i+=step;b.textContent=text.slice(0,i);box.scrollTop=box.scrollHeight;
  if(i<text.length)setTimeout(tick,16);else{b.textContent=text;b.classList.remove("typing")}})();
}
if(box)new MutationObserver(list=>list.forEach(m=>m.addedNodes.forEach(n=>{
 if(!n.classList||!n.classList.contains("ai")||!n.classList.contains("message"))return;
 const b=n.querySelector(".bubble");if(!b||b.querySelector("b"))return;
 const t=b.textContent;
 if(t==="Processing..."){b.textContent="Processing";b.classList.add("thinking")}
 else{if(/^Error:/.test(t))alertFx();typeInto(b,t)}
}))).observe(box,{childList:true});

// mic pulse
const mic=$("#voiceBtn");
if(mic)new MutationObserver(()=>mic.classList.toggle("listening",/Listening/.test(mic.textContent))).observe(mic,{childList:true,characterData:true,subtree:true});
})();
