document.addEventListener('DOMContentLoaded', () => {
  const openaiApiKey = document.getElementById('openai_api_key');
  const saveButton = document.getElementById('save');

  // Load saved API key from storage
  chrome.storage.sync.get('openai_api_key', (data) => {
    if (data.openai_api_key) {
      openaiApiKey.value = data.openai_api_key;
    }
  });

  // Save API key to storage when the button is clicked
  saveButton.addEventListener('click', () => {
    chrome.storage.sync.set({ 'openai_api_key': openaiApiKey.value }, () => {
      alert('API key saved.');
    });
  });
});
