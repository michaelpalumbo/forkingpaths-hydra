(function() {
  // Prevent duplicate initialization
  if (window.forkingPathsInitialized) {
    console.log("[FP] Already initialized. Closing old socket...");
    window.fpSocket.close();
  }

  const FP_URL = 'ws://127.0.0.1:3001/ws';
  const APP_NAME = "HydraVideoSynth";
  
  window.fpSocket = new WebSocket(FP_URL);
  window.forkingPathsInitialized = true;

  window.fpSocket.onopen = () => console.log("%c[FP] Connected to Forking Paths", "color: #2ecc71; font-weight: bold;");

  const sendToFP = (cmd, data) => {
    if (window.fpSocket.readyState === WebSocket.OPEN) {
      window.fpSocket.send(JSON.stringify({
        cmd: cmd,
        appName: APP_NAME,
        ...data
      }));
    }
  };

  const handler = (e) => {
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    
    // Ctrl + Shift + Enter (Keyframe)
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
       sendToFP("keyFrame", { data: { "hydraCode": cm.getValue() } });
       console.log("[FP] Keyframe sent");
    } 
    // Ctrl + Enter (Micro Change)
    else if (e.ctrlKey && e.key === 'Enter') {
       const line = cm.getLine(cm.getCursor().line).trim();
       sendToFP("micro_change", { param: "line_exec", value: line });
       console.log("[FP] Micro-change sent");
    }
  };

  // Clean up old listeners before adding new one
  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
