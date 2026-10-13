
const voiceBtn=document.getElementById("voiceBtn");
const messageInput=document.getElementById("messageInput");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

let recognition=null;
let listening=false;
let speakNextReply=false;
let selectedVoice=null;
let submitted=false;
let stopRequested=false;

function loadDeepVoice(){
 if(!("speechSynthesis" in window))return;
 const voices=window.speechSynthesis.getVoices();
 const english=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));
 selectedVoice=
  english.find(v=>/male|david|mark|daniel|guy|james|alex/i.test(v.name))||
  english.find(v=>/en-IN/i.test(v.lang))||
  english.find(v=>/en-US/i.test(v.lang))||
  english[0]||null;
}

if("speechSynthesis" in window){
 loadDeepVoice();
 window.speechSynthesis.onvoiceschanged=loadDeepVoice;
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
 const clean=String(text).replace(/[*_`#]/g,"").replace(/https?:\/\/\S+/g,"").trim();
 if(!clean)return;

 const speech=new SpeechSynthesisUtterance(clean);
 if(selectedVoice)speech.voice=selectedVoice;
 speech.lang=selectedVoice?.lang||"en-IN";
 speech.rate=0.88;
 speech.pitch=0.55;
 speech.volume=1;
 window.speechSynthesis.speak(speech);
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

  // Take one final result only; never append repeated updates.
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
