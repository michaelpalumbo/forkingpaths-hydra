(function() {
  if (window.forkingPathsInitialized) {
    console.log("[FP] Already initialized. Closing old socket...");
    window.fpSocket.close();
  }

  const FP_URL = 'ws://127.0.0.1:3001/ws';
  const APP_NAME = "HydraVideoSynth";
  
  window.fpSocket = new WebSocket(FP_URL);
  window.forkingPathsInitialized = true;

  window.fpSocket.onopen = () => console.log("%c[FP] Connected to Forking Paths", "color: #2ecc71; font-weight: bold;");

  // 1. IMPROVED: Logs the parsed data so you can see cmd, param, etc.
  window.fpSocket.onmessage = (e) => { 
    try {
      const msg = JSON.parse(e.data);
      console.log("[FP] Received:", msg);
    } catch (err) {
      console.log("[FP] Raw Message:", e.data);
    }
  }

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
    const cursor = cm.getCursor();
    const lineNo = cursor.line;
    const lineContent = cm.getLine(lineNo).trim();
    
    // 2. FIXED: Use window.fpSocket instead of 'socket'
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      sendToFP("keyFrame", { data: { "hydraCode": cm.getValue() } });
      console.log("[FP] Sent Keyframe");
    } 
    else if (e.ctrlKey && e.key === 'Enter') {
      if (lineContent.length > 0) {
        sendToFP("micro_change", { 
          param: `line_${lineNo}`, 
          value: lineContent 
        });
        console.log(`[FP] Sent Micro-change for line ${lineNo}`);
      }
    }
  };

  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
