(function() {
  // 1. Prevent multiple connections on re-run
  if (window.forkingPathsInitialized) {
    console.log("[FP] Re-initializing... Closing old socket.");
    window.fpSocket.close();
  }

  const FP_URL = 'ws://127.0.0.1:3001/ws';
  const APP_NAME = "HydraVideoSynth";
  
  window.fpSocket = new WebSocket(FP_URL);
  window.forkingPathsInitialized = true;

  window.fpSocket.onopen = () => {
    console.log("%c[FP] Connected to Forking Paths", "color: #2ecc71; font-weight: bold;");

  }

  // 2. Listener for incoming messages from Forking Paths
  window.fpSocket.onmessage = (e) => { 
    try {
      const msg = JSON.parse(e.data);

      switch (msg.cmd) {

        case 'getKeyframe':
          console.log('test')
          let message = JSON.stringify({
              cmd: "keyFrame",
              appName: APP_NAME,
              data: { "hydraCode": cm.getValue() }
          })
          window.fpSocket.send(message);
          console.log("[FP] Keyframe (All) Sent\n\n:", message);

        break;

      }
      console.log("[FP] Received Message:", msg);
      // Future logic for updating the editor goes here
    } catch (err) {
      console.log("[FP] Raw Message:", e.data);
    }
  };

  const handler = (e) => {
    // We must grab the CodeMirror instance inside the handler to get the latest state
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    
    // Define these variables here so they are available for both IF blocks
    const cursor = cm.getCursor();
    const lineNo = cursor.line;
    const lineContent = cm.getLine(lineNo).trim();

    if (window.fpSocket.readyState !== WebSocket.OPEN) return;

    // CTRL + SHIFT + ENTER -> KEYFRAME (Full Snapshot)
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      window.fpSocket.send(JSON.stringify({
        cmd: "keyFrame",
        appName: APP_NAME,
        data: { "hydraCode": cm.getValue() }
      }));
      console.log("[FP] Keyframe (All) Sent");
    } 
    // CTRL + ENTER -> MICRO_CHANGE (Single Line)
    else if (e.ctrlKey && e.key === 'Enter') {
      if (lineContent.length > 0) {
        window.fpSocket.send(JSON.stringify({
          cmd: "micro_change",
          appName: APP_NAME,
          param: `line_${lineNo}`, 
          value: lineContent
        }));
        console.log(`[FP] Micro-change (Line ${lineNo}) Sent`);
      }
    }
  };

  // 3. Clean up and re-attach listener
  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
