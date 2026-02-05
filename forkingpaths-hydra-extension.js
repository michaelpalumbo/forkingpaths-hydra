(function() {
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
  };

  const cleanCode = (rawCode) => {
    return rawCode
      .split('\n')
      .filter(line => line.trim().length > 0) // Remove empty lines
      .filter(line => !line.includes('@fp-ignore')) // Remove ignore tags
      .join('\n')
      .trim();
  };

  window.fpSocket.onmessage = (e) => { 
    try {
      const msg = JSON.parse(e.data);
      const cm = document.querySelector('.CodeMirror').CodeMirror;

      console.log("[FP] Received Message:", msg);

      switch (msg.cmd) {
        case 'getKeyframe':
          const currentCode = cleanCode(cm.getValue());
          window.fpSocket.send(JSON.stringify({
              cmd: "keyFrame",
              appName: APP_NAME,
              data: currentCode 
          }));
          break;

        case 'recallState':
          if (msg.data) {
            Object.keys(msg.data).forEach(key => {
              if (key.startsWith("line_")) {
                const lineIndex = parseInt(key.split("_")[1]);
                const newCode = msg.data[key];
                // Only replace if the line exists to avoid errors
                if (cm.lineCount() > lineIndex) {
                  cm.replaceRange(
                    newCode, 
                    { line: lineIndex, ch: 0 }, 
                    { line: lineIndex, ch: cm.getLine(lineIndex).length }
                  );
                }
              }
            });

            try {
              const codeToRun = cleanCode(cm.getValue());
              if (codeToRun) {
                window.eval(codeToRun);
                console.log("[FP] State Recalled and Pipeline Re-compiled");
              }
            } catch (evalErr) {
              console.error("[FP] Execution error after recall:", evalErr);
            }
          }
          break;
      } // End Switch
    } catch (err) {
      console.log("[FP] Message Handling Error:", err);
    }
  };

  const handler = (e) => {
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    const cursor = cm.getCursor();
    const lineNo = cursor.line;
    const lineContent = cm.getLine(lineNo).trim();

    if (window.fpSocket.readyState !== WebSocket.OPEN) return;

    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      const sanitizedAll = cleanCode(cm.getValue());
      if (sanitizedAll.length > 0) {
        window.fpSocket.send(JSON.stringify({
          cmd: "keyFrame",
          appName: APP_NAME,
          data: sanitizedAll
        }));
        console.log("[FP] Sanitized Keyframe Sent");
      }
    } 
    else if (e.ctrlKey && e.key === 'Enter') {
      if (lineContent.includes('@fp-ignore')) return;
      if (lineContent.length > 0) {
        window.fpSocket.send(JSON.stringify({
          cmd: "micro_change",
          appName: APP_NAME,
          param: `line_${lineNo}`,
          value: lineContent
        }));
        console.log(`[FP] Sent Micro-change for line ${lineNo}`);
      }
    }
  };

  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
