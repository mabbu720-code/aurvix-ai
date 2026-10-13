
import {initializeApp,getApps,getApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,updateProfile,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const config={
 apiKey:"AIzaSyBMReJc8ykqvqax35rNBCJkbc_qpPaCQuI",
 authDomain:"aurvix-ai.firebaseapp.com",
 projectId:"aurvix-ai",
 storageBucket:"aurvix-ai.firebasestorage.app",
 messagingSenderId:"1065834323996",
 appId:"1:1065834323996:web:7751c8c41e15021667ffd9"
};

const app=getApps().length?getApp():initializeApp(config);
const auth=getAuth(app);
const $=id=>document.getElementById(id);
const screen=$("authScreen"),terminal=$("app"),message=$("authMessage");
let busy=false;

function say(text,error=false){
 message.textContent=text;
 message.style.color=error?"#ff8d8d":"#9affaa";
}
function setBusy(value){
 busy=value;
 document.querySelectorAll("#authScreen button").forEach(b=>b.disabled=value);
}
function showForm(which){
 const signup=which==="signup";
 $("loginForm").hidden=signup;
 $("signupForm").hidden=!signup;
 $("loginTab").classList.toggle("active",!signup);
 $("signupTab").classList.toggle("active",signup);
 say("");
}
$("loginTab").onclick=()=>showForm("login");
$("signupTab").onclick=()=>showForm("signup");

$("showLoginPassword").onchange=e=>{
 $("loginPassword").type=e.target.checked?"text":"password";
};
$("showSignupPassword").onchange=e=>{
 const type=e.target.checked?"text":"password";
 $("signupPassword").type=type;
 $("confirmPassword").type=type;
};

$("signupForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(busy)return;
 const name=$("signupName").value.trim();
 const email=$("signupEmail").value.trim();
 const password=$("signupPassword").value;
 const confirm=$("confirmPassword").value;
 if(name.length<2){say("Please enter your full name.",true);return}
 if(password.length<6){say("Password must be at least 6 characters.",true);return}
 if(password!==confirm){say("Passwords do not match.",true);return}
 setBusy(true);say("Creating your account...");
 try{
  const result=await createUserWithEmailAndPassword(auth,email,password);
  await updateProfile(result.user,{displayName:name});
  say("Account created. Opening terminal...");
 }catch(err){
  const errors={
   "auth/email-already-in-use":"This email already has an account. Please log in.",
   "auth/invalid-email":"Please enter a valid email address.",
   "auth/weak-password":"Choose a stronger password.",
   "auth/operation-not-allowed":"Email/password login is not enabled in Firebase."
  };
  say(errors[err.code]||"Signup failed: "+err.message,true);
 }finally{setBusy(false)}
});

$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(busy)return;
 const email=$("loginEmail").value.trim();
 const password=$("loginPassword").value;
 setBusy(true);say("Verifying identity...");
 try{
  await signInWithEmailAndPassword(auth,email,password);
  say("Login successful. Opening terminal...");
 }catch(err){
  const errors={
   "auth/invalid-credential":"Email or password is incorrect.",
   "auth/invalid-email":"Please enter a valid email address.",
   "auth/user-disabled":"This account has been disabled.",
   "auth/too-many-requests":"Too many attempts. Try again later."
  };
  say(errors[err.code]||"Login failed: "+err.message,true);
 }finally{setBusy(false)}
});

$("forgotPassword").onclick=async()=>{
 const email=$("loginEmail").value.trim();
 if(!email){say("Enter your email above first.",true);$("loginEmail").focus();return}
 setBusy(true);say("Sending password reset email...");
 try{
  await sendPasswordResetEmail(auth,email);
  say("If an account exists for this email, a reset email has been sent.");
 }catch(err){
  say(err.code==="auth/invalid-email"?"Enter a valid email address.":"Could not send reset email. Check the email and Firebase settings.",true);
 }finally{setBusy(false)}
};

$("logoutBtn").onclick=async()=>{
 if(!confirm("Log out of AURVIX AI?"))return;
 try{await signOut(auth)}catch(e){say("Logout failed. Please try again.",true)}
};

onAuthStateChanged(auth,user=>{
 if(user){
  screen.style.display="none";
  terminal.style.display="block";
  $("accountLabel").textContent="IDENTITY: "+(user.displayName||user.email||"AUTHENTICATED");
 }else{
  terminal.style.display="none";
  screen.style.display="flex";
  showForm("login");
 }
});

window.aurvixAuth={auth};
