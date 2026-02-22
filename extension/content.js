// ================= Wait Helper =================
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
}

/* ================= AMAZON ================= */
async function extractAmazon() {
  const titleEl = await waitForElement("#productTitle");

  const price =
    document.querySelector(".a-price .a-offscreen")?.innerText ||
    document.querySelector("#priceblock_dealprice")?.innerText ||
    document.querySelector("#priceblock_ourprice")?.innerText ||
    document.querySelector("#price_inside_buybox")?.innerText ||
    document.querySelector(".a-price-whole")?.innerText ||
    "0";

  const image =
    document.querySelector("#landingImage")?.src ||
    document.querySelector("meta[property='og:image']")?.content ||
    "";

  return {
    title: titleEl?.innerText.trim() || "Amazon Product",
    price: price.replace(/[^\d.]/g, ""),
    image,
    url: window.location.href,
    website: "amazon"
  };
}

/* ================= MYNTRA ================= */
async function extractMyntra() {
  const titleEl = await waitForElement("h1.pdp-title");

  const priceEl =
    document.querySelector(".pdp-price strong") ||
    document.querySelector(".pdp-discount-container strong");

  const image =
    document.querySelector("meta[property='og:image']")?.content || "";

  return {
    title: titleEl?.innerText.trim() || "Myntra Product",
    price: priceEl?.innerText.replace(/[^\d.]/g, "") || "0",
    image,
    url: window.location.href,
    website: "myntra"
  };
}

/* ================= MEESHO ================= */
async function extractMeesho() {
  const titleEl = await waitForElement("h1");

  const priceEl =
    document.querySelector("h4") ||
    document.querySelector("span");

  const image =
    document.querySelector("meta[property='og:image']")?.content || "";

  return {
    title: titleEl?.innerText.trim() || "Meesho Product",
    price: priceEl?.innerText.replace(/[^\d.]/g, "") || "0",
    image,
    url: window.location.href,
    website: "meesho"
  };
}

/* ================= ROUTER ================= */
async function extractProductData() {
  const host = window.location.hostname;
  console.log("Current host:", host);

  let result = null;

  if (host.includes("amazon")) {
    result = await extractAmazon();
  } else if (host.includes("myntra")) {
    result = await extractMyntra();
  } else if (host.includes("meesho")) {
    result = await extractMeesho();
  }

  console.log("Extracted data:", result);
  return result;
}

/* ================= MESSAGE LISTENER ================= */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    extractProductData()
      .then((data) => sendResponse(data))
      .catch((error) => {
        console.error("Error in extraction:", error);
        sendResponse(null);
      });

    return true;
  }
});