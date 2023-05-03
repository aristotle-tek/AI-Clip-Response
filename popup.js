const spinner = document.getElementById('spinner');
const checkmark = document.getElementById('checkmark');

document.addEventListener('DOMContentLoaded', () => {
  const popupPort = chrome.runtime.connect({ name: "popup" });
  const instructions = document.getElementById('instructions');
  const processTextButton = document.getElementById('processText');
  const enableDisableButton = document.getElementById('enableDisable');
  const openGHButton = document.getElementById('open-gh-button');

  // Load saved instructions from storage
  chrome.storage.sync.get('instructions', (data) => {
    if (data.instructions) {
      instructions.value = data.instructions;
    }
  });

  // Save instructions to storage when modified
  instructions.addEventListener('input', () => {
    chrome.storage.sync.set({ 'instructions': instructions.value });
  });

  // processTextButton click event listener in popup.js
  processTextButton.addEventListener("click", () => {
    // Show spinner and hide checkmark
    spinner.classList.remove("hidden");
    checkmark.classList.add("hidden");

    // Send a message to the content script to read the clipboard
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "readClipboard" });
    });
  });

  // Listen for messages from the background page
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "processingComplete") {
      console.log("Received processingComplete message");
      spinner.classList.add("hidden");
      checkmark.classList.remove("hidden");
  
      // Hide checkmark after 3 seconds
      setTimeout(() => {
        checkmark.classList.add("hidden");
      }, 3000);
    }
  });

  // Enable or disable the extension
  let isEnabled = true;
  enableDisableButton.addEventListener('click', () => {
    isEnabled = !isEnabled;
    enableDisableButton.textContent = isEnabled ? 'Disable' : 'Enable';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleExtension',
        enabled: isEnabled
      });
    });
  });
    // open github page button
  openGHButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/aristotle-tek/AI-Clip-Response' });
  });
});