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
      .filter(line => line.trim().length > 0)
      .filter(line => !line.includes('@fp-ignore'))
      .join('\n')
      .trim();
  };

  window.fpSocket.onmessage = (e) => { 
    try {
      const msg = JSON.parse(e.data);
      const cm = document.querySelector('.CodeMirror').CodeMirror;
      switch (msg.cmd) {
        case 'getKeyframe':
          window.fpSocket.send(JSON.stringify({
              cmd: "keyFrame",
              appName: APP_NAME,
              data: cleanCode(cm.getValue()) 
          }));
          break;
        case 'recallState':
          if (msg.data) {
            Object.keys(msg.data).forEach(key => {
              if (key.startsWith("line_")) {
                const lineIndex = parseInt(key.split("_")[1]);
                if (cm.lineCount() > lineIndex) {
                  cm.replaceRange(msg.data[key], { line: lineIndex, ch: 0 }, { line: lineIndex, ch: cm.getLine(lineIndex).length });
                }
              }
            });
            try {
              const codeToRun = cleanCode(cm.getValue());
              if (codeToRun) window.eval(codeToRun);
            } catch (evalErr) {
              console.error("[FP] Execution error:", evalErr);
            }
          }
          break;
      }
    } catch (err) { console.log("[FP] Msg Error:", err); }
  };

  const handler = (e) => {
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    const cursor = cm.getCursor();
    const lineNo = cursor.line;
    const lineContent = cm.getLine(lineNo).trim();

    if (window.fpSocket.readyState !== WebSocket.OPEN) return;

    // Full Script: Ctrl + Shift + Enter
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      const sanitizedAll = cleanCode(cm.getValue());
      if (sanitizedAll.length > 0) {
        window.fpSocket.send(JSON.stringify({ cmd: "keyFrame", appName: APP_NAME, data: sanitizedAll }));
      }
    } 
    // Single Line: Ctrl + Enter
    else if (e.ctrlKey && e.key === 'Enter') {
      if (!lineContent.includes('@fp-ignore') && lineContent.length > 0) {
        window.fpSocket.send(JSON.stringify({
          cmd: "micro_change",
          appName: APP_NAME,
          param: `line_${lineNo}`,
          value: lineContent
        }));
      }
    }
    // Block Execution: Alt + Enter
    else if (e.altKey && e.key === 'Enter') {
      let startLine = cursor.line;
      let endLine = cursor.line;

      // Scan UP to find the start of the block
      while (startLine > 0 && cm.getLine(startLine - 1).trim() !== "") {
        startLine--;
      }

      // Scan DOWN to find the end of the block
      while (endLine < cm.lineCount() - 1 && cm.getLine(endLine + 1).trim() !== "") {
        endLine++;
      }

      const blockContent = cm.getRange(
        { line: startLine, ch: 0 },
        { line: endLine, ch: cm.getLine(endLine).length }
      );

      if (blockContent.trim().length > 0) {
        window.fpSocket.send(JSON.stringify({
          cmd: "macro_change",
          appName: APP_NAME,
          param: `block_${startLine}-${endLine}`,
          value: blockContent
        }));
        console.log(`[FP] Sent Macro-change: Lines ${startLine} to ${endLine}`);
      }
    }
  };

  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
  console.log("[FP] Keydown listener active.");
})();