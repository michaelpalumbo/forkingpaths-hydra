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

  window.fpSocket.onmessage = (e) => { 
    console.log(e.data)
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
    
    // CTRL + SHIFT + ENTER -> KEYFRAME
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      socket.send(JSON.stringify({
        cmd: "keyFrame",
        appName: APP_NAME,
        data: { "hydraCode": cm.getValue() }
      }));
    } 
    // CTRL + ENTER -> MICRO_CHANGE
    else if (e.ctrlKey && e.key === 'Enter') {
      if (lineContent.length > 0) {
        socket.send(JSON.stringify({
          cmd: "micro_change",
          appName: APP_NAME,
          // We use the line number as the parameter ID
          param: `line_${lineNo}`, 
          value: lineContent
        }));
      }
    }
  };

  // Clean up old listeners before adding new one
  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
