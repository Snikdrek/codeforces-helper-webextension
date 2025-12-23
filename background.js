// Listen for when the browser/service worker starts
chrome.runtime.onStartup.addListener(() => {
  openCodeforces();
});

// Also open Codeforces when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  openCodeforces();
});

// Function to open Codeforces in a new tab
function openCodeforces() {
  chrome.tabs.create({
    url: 'https://codeforces.com'
  });
}
