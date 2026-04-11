/**
 * Popup AppartUpgrade — UI de l'extension.
 */

const $ = (id) => document.getElementById(id);

async function init() {
  // Charger les settings
  const storage = await chrome.storage.local.get([
    "userId",
    "apiUrl",
    "totalCaptured",
  ]);
  $("userId").value = storage.userId || "";
  $("apiUrl").value = storage.apiUrl || "http://localhost:8000/api/v1";
  $("totalCount").textContent = storage.totalCaptured || 0;

  // Vérifier si on est sur Marketplace
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url?.includes("facebook.com/marketplace")) {
    // Demander le status au content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_STATUS",
      });
      $("statusDot").classList.add("active");
      $("statusText").textContent = `Actif — ${response.detected} annonces détectées`;
      $("detectedCount").textContent = response.detected;
    } catch {
      $("statusDot").classList.remove("active");
      $("statusText").textContent = "Recharge la page Marketplace";
      $("detectedCount").textContent = "0";
    }
  } else {
    $("statusText").textContent = "Ouvre Facebook Marketplace d'abord";
    $("captureBtn").disabled = true;
    $("captureBtn").style.opacity = "0.5";
  }
}

// Capturer toutes les annonces visibles
$("captureBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("captureBtn").textContent = "Capture en cours...";
  $("captureBtn").disabled = true;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "CAPTURE_ALL",
    });
    $("captureBtn").textContent = `${response.count} annonces capturées`;
    setTimeout(() => {
      $("captureBtn").textContent = "Capturer toutes les annonces visibles";
      $("captureBtn").disabled = false;
    }, 2000);
  } catch {
    $("captureBtn").textContent = "Erreur — recharge la page";
  }
});

// Sauvegarder les paramètres
$("saveBtn").addEventListener("click", async () => {
  const settings = {
    userId: $("userId").value.trim(),
    apiUrl: $("apiUrl").value.trim(),
  };
  await chrome.storage.local.set(settings);
  $("saveBtn").textContent = "Sauvegardé !";
  setTimeout(() => {
    $("saveBtn").textContent = "Sauvegarder les paramètres";
  }, 1500);
});

init();
