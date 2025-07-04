const e = document.getElementById("email"), p = document.getElementById("password");
chrome.storage.local.get(["email","password"], d=>{
  if(d.email) e.value=d.email;
  if(d.password) p.value=d.password;
});
[e,p].forEach(el=>{
  el.addEventListener("input",()=>{
    chrome.storage.local.set({email:e.value, password:p.value});
  });
});
