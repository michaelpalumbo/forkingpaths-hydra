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

  // use this to ignore the import line for the fp extension
  const cleanCode = (rawCode) => {
    return rawCode
      .split('\n')
      .filter(line => !line.includes('@fp-ignore')) // Removes any line with this tag
      .join('\n')
      .trim();
  };

  // 2. Listener for incoming messages from Forking Paths
  window.fpSocket.onmessage = (e) => { 
    try {
      const msg = JSON.parse(e.data);

      const sanitizedAll = cleanCode(cm.getValue());

      
      switch (msg.cmd) {

        case 'getKeyframe':
          console.log('test 2 boo 3')
          let message = JSON.stringify({
              cmd: "keyFrame",
              appName: APP_NAME,
              data: { "hydraCode": sanitizedAll }
          })
          window.fpSocket.send(message);
          console.log("[FP] Keyframe (All) Sent\n\n:", message);

        break;

        case 'recallState':
          // Loop through the data keys (e.g., "line_10")
           // Loop through the data keys (e.g., "line_10")
          // 1. Update the editor text for all incoming changes
          Object.keys(msg.data).forEach(key => {
            if (key.startsWith("line_")) {
              const lineIndex = parseInt(key.split("_")[1]);
              const newCode = msg.data[key];
              cm.replaceRange(
                newCode, 
                { line: lineIndex, ch: 0 }, 
                { line: lineIndex, ch: cm.getLine(lineIndex).length }
              );
            }
          });
    
          // 2. Execute the WHOLE sanitized script
          // This solves the ".modulate" SyntaxError because the dot is now attached to the osc() again
          try {
            const fullSanitizedCode = cm.getValue()
              .split('\n')
              .filter(line => !line.includes('@fp-ignore'))
              .join('\n');
              
            window.eval(fullSanitizedCode);
            console.log("[FP] State Recalled and Pipeline Re-compiled");
          } catch (evalErr) {
            console.error("[FP] Execution error after recall:", evalErr);
          
          };
        break

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

    // CTRL + SHIFT + ENTER -> KEYFRAME
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
      const sanitizedAll = cleanCode(cm.getValue());
      if (sanitizedAll.length > 0) {
        window.fpSocket.send(JSON.stringify(
          {
            "cmd": "keyFrame",
            "appName": "hydra",
            "data": {
              "full_code": sanitizedAll
            },
          
          }
        ));
        console.log("[FP] Sanitized Keyframe Sent");
      }
    } 


    // CTRL + ENTER -> MICRO_CHANGE
    else if (e.ctrlKey && e.key === 'Enter') {
      // If the current line is the FP extension, ignore it!
      if (lineContent.includes('@fp-ignore')) {
        console.log("[FP] Ignored line due to @fp-ignore tag.");
        return; 
      }

      if (lineContent.length > 0) {
        window.fpSocket.send(JSON.stringify({
          "cmd": "micro_change",
          "appName": "hydra",
          "param": `line_${lineNo}`,
          "value": lineContent
        }));
        console.log(`[FP] Sent Micro-change for line ${lineNo}`);
      }
    }
  };


  // 3. Clean up and re-attach listener
  window.removeEventListener('keydown', window._fpHandler, true);
  window._fpHandler = handler;
  window.addEventListener('keydown', window._fpHandler, true);
})();
