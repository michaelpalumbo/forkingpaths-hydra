
/**
 * Forking Paths x Hydra Extension
 * Connects to: ws://127.0.0.1:3001/ws
 * (for dev/testing): Can place directly within hydra code, then update hydra code below it. Once it's working great, could 
 */

(async () => {
  const FP_URL = 'ws://127.0.0.1:3001/ws';
  const APP_NAME = "HydraVideoSynth";
  let socket;

  const connect = () => {
    socket = new WebSocket(FP_URL);
    socket.onopen = () => console.log("%c[FP] Connected", "color: #2ecc71; font-weight: bold;");
    socket.onclose = () => setTimeout(connect, 3000);
  };
  connect();

  const getEditorData = () => {
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    return {
      allCode: cm.getValue(),
      currentLine: cm.getLine(cm.getCursor().line).trim()
    };
  };

  window.addEventListener('keydown', (e) => {
    if (socket.readyState !== WebSocket.OPEN) return;

    // CTRL + SHIFT + ENTER -> KEYFRAME (Full Snapshot)
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      const data = getEditorData();
      socket.send(JSON.stringify({
        cmd: "keyFrame",
        appName: APP_NAME,
        data: { "hydraCode": data.allCode }
      }));
      console.log("%c[FP] Keyframe (All) Sent", "color: #3498db;");
    } 
    
    // CTRL + ENTER -> MICRO_CHANGE (Single Line)
    else if (e.ctrlKey && e.key === 'Enter') {
      const data = getEditorData();
      if (data.currentLine.length > 0) {
        socket.send(JSON.stringify({
          cmd: "micro_change",
          appName: APP_NAME,
          param: "line_exec",
          value: data.currentLine
        }));
        console.log("%c[FP] Micro-change (Line) Sent", "color: #f1c40f;");
      }
    }
  }, true);
})();
