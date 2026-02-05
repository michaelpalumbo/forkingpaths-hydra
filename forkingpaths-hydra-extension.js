/**
 * Forking Paths x Hydra Extension
 * Connects to: ws://127.0.0.1:3001/ws
 */

(async () => {
  const FP_URL = 'ws://127.0.0.1:3001/ws';
  const APP_NAME = "HydraVideoSynth";
  let socket;

  // 1. Connection logic with auto-reconnect
  const connect = () => {
    socket = new WebSocket(FP_URL);
    socket.onopen = () => console.log("%c[FP] Connected to Forking Paths", "color: #2ecc71; font-weight: bold;");
    socket.onclose = () => setTimeout(connect, 3000); 
    
    // Listen for recalled states from FP
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.cmd === "recallState" && msg.data.hydraCode) {
        // Inject code back into editor if you move through history in FP
        const cm = document.querySelector('.CodeMirror').CodeMirror;
        cm.setValue(msg.data.hydraCode);
        // Optional: Automatically run the code upon recall
        // eval(msg.data.hydraCode);
      }
    };
  };

  connect();

  // 2. The Capture Mechanism
  const sendKeyframe = () => {
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    const currentCode = cm.getValue();

    if (socket.readyState === WebSocket.OPEN) {
      const payload = {
        cmd: "keyFrame",
        appName: APP_NAME,
        data: {
          "hydraCode": currentCode,
          // You could also parse out specific variables here if needed
        }
      };
      socket.send(JSON.stringify(payload));
      console.log("%c[FP] Keyframe Sent", "color: #3498db;");
    }
  };

  // 3. Hooking into Hydra's execution
  window.addEventListener('keydown', (e) => {
    // Detect Ctrl+Enter (Run Line) or Ctrl+Shift+Enter (Run All)
    if (e.ctrlKey && e.key === 'Enter') {
      // Use a tiny timeout to ensure we capture the editor state 
      // at the moment of execution
      setTimeout(sendKeyframe, 50);
    }
  }, true);

  // 4. Expose to Hydra global for manual use
  window.fp = {
    sync: () => sendKeyframe(),
    next: () => socket.send(JSON.stringify({cmd: "seek", appName: APP_NAME, data: "next"})),
    prev: () => socket.send(JSON.stringify({cmd: "seek", appName: APP_NAME, data: "prev"}))
  };
})();
