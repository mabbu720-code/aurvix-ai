
const themes={
default:{bg:"#020503",accent:"#00ff41"}
};

function setTheme(name){
 const t=themes.default;
 document.documentElement.style.setProperty("--bg",t.bg);
 document.documentElement.style.setProperty("--accent",t.accent);
 document.documentElement.style.setProperty("--green",t.accent);
 localStorage.setItem("aurvixTheme","default");
}

setTheme("default");
