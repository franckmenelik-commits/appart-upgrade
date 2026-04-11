/**
 * AppartUpgrade — Content Script pour Facebook Marketplace.
 *
 * Stratégie : On observe les mutations du DOM pour détecter les nouvelles
 * cartes d'annonces au fur et à mesure que l'utilisateur scroll.
 * On injecte un bouton "Score it" sur chaque carte détectée.
 */

const API_URL = "http://localhost:8000/api/v1";
const PROCESSED_ATTR = "data-appart-upgrade";

// Sélecteurs Facebook Marketplace (peuvent changer — on utilise des heuristiques)
// Facebook utilise des classes CSS obfusquées, donc on cible la structure
const SELECTORS = {
  // Cartes de listing dans la grille Marketplace
  listingCard: 'a[href*="/marketplace/item/"]',
  // Conteneur de la grille
  gridContainer: '[role="main"]',
};

/**
 * Extrait les données d'une carte d'annonce Facebook Marketplace.
 */
function extractListingFromCard(cardElement) {
  try {
    // URL et ID
    const href = cardElement.getAttribute("href") || "";
    const idMatch = href.match(/\/marketplace\/item\/(\d+)/);
    if (!idMatch) return null;

    const sourceId = idMatch[1];
    const sourceUrl = `https://www.facebook.com${href.split("?")[0]}`;

    // Facebook structure les cartes avec des spans imbriqués
    const spans = cardElement.querySelectorAll("span");
    const texts = Array.from(spans)
      .map((s) => s.textContent?.trim())
      .filter(Boolean);

    // Heuristique : le prix est généralement le premier texte avec $ ou /mois
    let priceText = null;
    let title = null;
    let location = null;

    for (const text of texts) {
      if (!priceText && (text.includes("$") || text.includes("/mo"))) {
        priceText = text;
      } else if (!title && text.length > 5 && !text.includes("$")) {
        title = text;
      } else if (
        !location &&
        text.length > 2 &&
        !text.includes("$") &&
        text !== title
      ) {
        location = text;
      }
    }

    // Image
    const img = cardElement.querySelector("img");
    const imageUrl = img?.src || img?.dataset?.src || null;

    if (!title && !priceText) return null;

    return {
      source: "marketplace",
      source_id: sourceId,
      source_url: sourceUrl,
      title: title || "Annonce Marketplace",
      price_text: priceText,
      address: location,
      image_urls: imageUrl ? [imageUrl] : [],
    };
  } catch (e) {
    console.error("[AppartUpgrade] Erreur extraction:", e);
    return null;
  }
}

/**
 * Parse le prix depuis un texte Facebook (ex: "$1,200/month", "1 400 $/mois").
 */
function parsePrice(priceText) {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9.,]/g, "").replace(",", "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Injecte le bouton "Score it" sur une carte.
 */
function injectScoreButton(cardElement, listingData) {
  if (cardElement.querySelector(".appart-upgrade-btn")) return;

  const btn = document.createElement("button");
  btn.className = "appart-upgrade-btn";
  btn.textContent = "Score it";
  btn.title = "Analyser avec AppartUpgrade";

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.textContent = "...";
    btn.disabled = true;

    try {
      // Envoyer au backend
      const result = await sendToBackend(listingData);

      if (result?.score !== undefined) {
        btn.textContent = `${result.score}/100`;
        btn.classList.add(
          result.score >= 70
            ? "score-high"
            : result.score >= 40
              ? "score-mid"
              : "score-low"
        );
      } else {
        btn.textContent = "Sauvé";
        btn.classList.add("score-saved");
      }
    } catch (err) {
      btn.textContent = "Erreur";
      btn.classList.add("score-error");
      console.error("[AppartUpgrade]", err);
    }
  });

  // Positionner le bouton
  cardElement.style.position = "relative";
  cardElement.appendChild(btn);
}

/**
 * Envoie une annonce au backend AppartUpgrade.
 */
async function sendToBackend(listingData) {
  // Récupérer le userId depuis le storage de l'extension
  const storage = await chrome.storage.local.get(["userId", "apiUrl"]);
  const apiUrl = storage.apiUrl || API_URL;
  const userId = storage.userId;

  const payload = {
    source: "marketplace",
    source_id: listingData.source_id,
    source_url: listingData.source_url,
    title: listingData.title,
    description_raw: [listingData.title, listingData.price_text, listingData.address]
      .filter(Boolean)
      .join(" — "),
    address: listingData.address,
    rent_monthly: parsePrice(listingData.price_text),
    image_urls: listingData.image_urls,
  };

  // 1. Créer l'annonce
  const listingResp = await fetch(`${apiUrl}/listings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!listingResp.ok) {
    throw new Error(`API error: ${listingResp.status}`);
  }

  const listing = await listingResp.json();

  // 2. Si on a un userId, scorer immédiatement
  if (userId) {
    const scoreResp = await fetch(`${apiUrl}/scores/${userId}/${listing.id}`, {
      method: "POST",
    });
    if (scoreResp.ok) {
      const score = await scoreResp.json();
      return { score: score.total_score, listing };
    }
  }

  return { listing };
}

/**
 * Scanne la page pour trouver les nouvelles cartes d'annonces.
 */
function scanForListings() {
  const cards = document.querySelectorAll(SELECTORS.listingCard);

  for (const card of cards) {
    if (card.hasAttribute(PROCESSED_ATTR)) continue;
    card.setAttribute(PROCESSED_ATTR, "true");

    const data = extractListingFromCard(card);
    if (data) {
      injectScoreButton(card, data);
    }
  }
}

/**
 * Capture en masse toutes les annonces visibles.
 */
async function captureAllVisible() {
  const cards = document.querySelectorAll(SELECTORS.listingCard);
  const listings = [];

  for (const card of cards) {
    const data = extractListingFromCard(card);
    if (data) listings.push(data);
  }

  if (listings.length > 0) {
    chrome.runtime.sendMessage({
      type: "BULK_CAPTURE",
      listings,
      count: listings.length,
    });
  }

  return listings.length;
}

// --- Initialisation ---

// Observer les mutations du DOM (scroll infini de Facebook)
const observer = new MutationObserver(() => {
  scanForListings();
});

// Attendre que le contenu principal soit chargé
function init() {
  const main = document.querySelector(SELECTORS.gridContainer) || document.body;
  observer.observe(main, { childList: true, subtree: true });

  // Scan initial
  scanForListings();

  console.log("[AppartUpgrade] Extension active sur Marketplace");
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CAPTURE_ALL") {
    captureAllVisible().then((count) => {
      sendResponse({ count });
    });
    return true; // async response
  }
  if (message.type === "GET_STATUS") {
    const count = document.querySelectorAll(`[${PROCESSED_ATTR}]`).length;
    sendResponse({ active: true, detected: count });
    return true;
  }
});

// Lancer
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
