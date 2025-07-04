chrome.commands.onCommand.addListener(async cmd=>{
  if(cmd!=="trigger-email-verify") return;
  console.log("⌨️ Ctrl+Shift+U pressed");

  const data = await chrome.storage.local.get(["email","password"]);
  if(!data.email||!data.password){
    console.error("❌ Chưa nhập mail hoặc mật khẩu");
    return;
  }

  try {
    let res = await fetch("https://api.mail.tm/token", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({address:data.email, password:data.password})
    });
    if(!res.ok) throw new Error("Token failed " + res.status);
    const {token} = await res.json();
    console.log("✅ Mail token:",token);

    res = await fetch("https://api.mail.tm/messages", {
      headers:{Authorization:"Bearer " + token}
    });
    if(!res.ok) throw new Error("List msg failed " + res.status);
    const msgs = await res.json();
    if(!msgs["hydra:member"] || msgs["hydra:member"].length===0){
      console.error("❌ Không có email mới");
      return;
    }

    const msg = msgs["hydra:member"][0];
    console.log("📧 New email:", msg.subject, msg.id);

    res = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
      headers:{Authorization:"Bearer " + token}
    });
    if(!res.ok) throw new Error("Fetch msg failed " + res.status);
    const body = await res.json();
    const content = body.text || body.html || "";

    const match = content.match(/\b\d{6}\b/);
    if(!match){
      console.error("❌ Không tìm thấy code 6 số trong mail");
      return;
    }

    const code = match[0];
    console.log("✅ Code extracted:", code);

    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.id) throw new Error("No active tab");

    await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      func: code=>{
        const input = document.querySelector('input[name="token"]');
        if(!input){ console.error("❌ Không tìm thấy ô input (name='token')"); return; }
        input.value = code;
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
        console.log("✅ Code nhập:", code);
      },
      args:[code]
    });

  } catch(err){
    console.error("❌ Error:", err);
  }
});
