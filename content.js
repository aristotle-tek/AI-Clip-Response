console.log("content.js loaded");

function sendProcessingComplete() {
  chrome.runtime.sendMessage({ action: 'processingComplete' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("request received", request);

  if (request.action === "readClipboard") {
      console.log("readClipboard action received");
  
      const onPaste = async (event) => {
        console.log("onPaste called");
        const clipboardText = event.clipboardData.getData("text");
        console.log("clipboard text received", clipboardText);
        document.removeEventListener("paste", onPaste);
  
        const instructions = await new Promise((resolve) => {
          chrome.storage.sync.get("instructions", (data) => {
            if (data.instructions) {
              resolve(data.instructions);
            } else {
              resolve("");
            }
          });
        });
  
        chrome.runtime.sendMessage({
          action: "processText",
          instructions: instructions,
          clipboardText: clipboardText,
        });
      };
  
      document.addEventListener("paste", onPaste);
      document.execCommand("paste");
  
      return true; 
  } else if (request.action === "writeToClipboard") {
    console.log("writeToClipboard action received");
    const textArea = document.createElement("textarea");
    textArea.value = request.responseText;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      console.log("Text successfully written to clipboard");
      sendProcessingComplete();
      sendResponse({ success: true }); // Add this line to send a response back
    } catch (err) {
      console.error("Error writing text to clipboard", err);
      sendResponse({ success: false, error: err.message }); // Add this line to send a response back with an error
    }
    document.body.removeChild(textArea);
  }
});
