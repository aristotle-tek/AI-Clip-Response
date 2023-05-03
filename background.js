console.log("background.js loaded");
let popupPort;
// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.tabs.create({ url: "options.html" });
  }
});

//tab query to get the active tab
async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

async function processText(request) {
  console.log("processText called");
  const data = await new Promise((resolve) =>
    chrome.storage.sync.get("openai_api_key", resolve)
  );
  if (data.openai_api_key) {
    const apiKey = data.openai_api_key;
    const instructions = request.instructions;
    const clipboardText = request.clipboardText;
    const systemMessage = `You are an AI clipboard assistant, please follow these instructions: ${instructions}.`;
    console.log("processText action received");

    // Call processClipboardText directly with the required arguments
    processClipboardText(apiKey, systemMessage, clipboardText);
  } else {
    console.error("API key not set. Please set the API key in the options page.");
    return null;
  }
}

async function processClipboardText(apiKey, systemMessage, clipboardText) {
  console.log("Received clipboard text:", clipboardText);

  const userMessage = `Now here is the text to consider: ${clipboardText}. Please return only what is indicated by the instructions.`;

  // Make a request to the OpenAI API using the Fetch API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.0,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();
    // Write the response to the clipboard
    console.log("Text successfully processed, sending writeToClipboard action");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length || !tabs[0].id) {
        console.error("No active tab found");
        return;
      }
      const activeTab = tabs[0];
      console.log("Active tab found");
      console.log("Sending message to active tab");
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "writeToClipboard", responseText: responseText },
        (writeResponse) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log("Text successfully written to clipboard");
          }
          chrome.runtime.sendMessage({ action: "processingComplete" });
        }
      );
    });
  } else {
    console.error("Error fetching data from the OpenAI API:", response.status, response.statusText);
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "processText") {
    console.log("Received processText message in background.js");
    await processText(request);
  }
});


chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;
  }
});
