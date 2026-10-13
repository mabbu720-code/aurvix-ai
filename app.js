
const API="/api/chat";
const CREATOR_API="/api/creator";
const chatBox=document.getElementById("chatBox");
const input=document.getElementById("messageInput");
const send=document.getElementById("sendBtn");

let mode="General",busy=false,waitingForCode=false;

document.querySelectorAll(".mode").forEach(b=>{
 b.onclick=()=>{
  document.querySelectorAll(".mode").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  mode=b.dataset.mode;
 };
});

function addMessage(text,type="ai"){
 const m=document.createElement("div");
 m.className="message "+type;
 if(type==="ai"){
  const avatar=document.createElement("div");
  avatar.className="avatar";
  avatar.textContent="✦";
  m.appendChild(avatar);
 }
 const bubble=document.createElement("div");
 bubble.className="bubble";
 bubble.textContent=String(text);
 m.appendChild(bubble);
 chatBox.appendChild(m);
 chatBox.scrollTop=chatBox.scrollHeight;
 return m;
}

function speak(text){
 if(window.aurvixSpeakReply){
  window.aurvixSpeakReply(text);
 }
}

function handleSpeakCommand(message){
 const command=message.trim().toLowerCase();
 const commands=[
  "speak this","speak it","read aloud","read this",
  "read it aloud","read it out","say it aloud",
  "speak the answer","read your answer",
  "speak previous answer","read previous answer",
  "repeat your answer","repeat that"
 ];

 const direct=command.match(/^(?:speak|say aloud|read aloud)\s*[:,-]\s*(.+)$/i);
 const isCommand=commands.includes(command)||!!direct;

 if(!isCommand)return false;

 let text=direct?direct[1]:"";
 if(!text){
  const bubbles=chatBox.querySelectorAll(".message.ai .bubble");
  for(let i=bubbles.length-1;i>=0;i--){
   const candidate=bubbles[i].textContent.trim();
   if(candidate&&candidate!=="Processing..."){
    text=candidate;
    break;
   }
  }
 }

 if(text){
  if(window.aurvixSpeakOnCommand){
   window.aurvixSpeakOnCommand(text);
  }else{
   addMessage("Voice module is not ready. Please reload AURVIX.","ai");
  }
 }else{
  addMessage("There is no previous AI response to read aloud.","ai");
 }
 return true;
}

const hist=[];
async function sendMessage(voiceInput=false){
 const message=input.value.trim();
 if(!message||busy)return;
 if(!waitingForCode&&handleSpeakCommand(message)){input.value="";input.focus();return}
 busy=true;input.value="";send.disabled=true;
 addMessage(message,"user");
 const loading=addMessage("Processing...","ai");
 const bubble=loading.querySelector(".bubble");
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 const post=(u,o)=>fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o),signal:controller.signal});
 try{
  if(waitingForCode){
   const d=await (await post(CREATOR_API,{code:message})).json();
   loading.remove();waitingForCode=false;
   const a=d.authorized?"Creator verified: "+d.creator:"Verification failed. Access denied.";
   addMessage(a,"ai");speak(a);return;
  }
  const r=await post(API,{message,mode,history:hist});
  clearTimeout(timer);
  if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"Request failed ("+r.status+")")}
  bubble.classList.remove("thinking");bubble.textContent="";
  const rd=r.body.getReader(),dec=new TextDecoder();let answer="";
  while(true){const {done,value}=await rd.read();if(done)break;answer+=dec.decode(value,{stream:true});bubble.textContent=answer;chatBox.scrollTop=chatBox.scrollHeight}
  answer=answer.trim()||"No response generated.";bubble.textContent=answer;
  hist.push({role:"user",text:message},{role:"model",text:answer});while(hist.length>8)hist.shift();
  if(answer.includes("Creator identity is protected")){
   waitingForCode=true;const p="Enter the creator verification code to continue.";addMessage(p,"ai");speak(p);
  }else speak(answer);
 }catch(error){
  if(!bubble.textContent||bubble.classList.contains("thinking"))loading.remove();
  addMessage(error.name==="AbortError"?"Response timed out. Please try again.":"Error: "+error.message,"ai");
 }finally{clearTimeout(timer);busy=false;send.disabled=false;input.focus()}
}

send.onclick=()=>sendMessage(false);

input.onkeydown=e=>{
 if(e.key==="Enter"&&!e.shiftKey){
  e.preventDefault();
  sendMessage(false);
 }
};

window.aurvixSendVoiceText=function(text){
 if(!text||busy)return;
 input.value=String(text).trim();
 sendMessage(true);
};
