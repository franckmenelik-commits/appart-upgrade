/**
 * AppartUpgrade — Service Worker (Background).
 *
 * Gère le stockage local et les communications entre popup et content script.
 */

const DEFAULT_API_URL = "http://localhost:8000/api/v1";

// Écouter les messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BULK_CAPTURE") {
    // Notification quand des annonces sont capturées en masse
    const count = message.count || 0;
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });

    // Sauvegarder le compteur
    chrome.storage.local.get(["totalCaptured"], (result) => {
      const total = (result.totalCaptured || 0) + count;
      chrome.storage.local.set({ totalCaptured: total });
    });
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set(message.settings, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Au premier install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    apiUrl: DEFAULT_API_URL,
    userId: "",
    totalCaptured: 0,
  });
});
