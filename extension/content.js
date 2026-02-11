function waitForElement(selector, timeout = 3000) {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(timer);
        resolve(element);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
}

async function extractAmazon() {
  // Wait until product title loads
  const titleEl = await waitForElement("#productTitle");
  if (!titleEl) return null;

  const title = titleEl.innerText.trim();

  let price = "";

  const priceEls = document.querySelectorAll(".a-price .a-offscreen");
  for (let el of priceEls) {
    if (el.innerText.trim()) {
      price = el.innerText;
      break;
    }
  }

  if (!price) {
    const whole = document.querySelector(".a-price-whole")?.innerText;
    const fraction = document.querySelector(".a-price-fraction")?.innerText;
    if (whole) price = whole + (fraction ? "." + fraction : "");
  }

  if (!price) price = "0";

  const image =
    document.querySelector("#landingImage")?.src ||
    document.querySelector("meta[property='og:image']")?.content ||
    "";

  return {
    title,
    price: price.replace(/[^\d.]/g, ""),
    image,
    url: window.location.href,
    website: "amazon"
  };
}

async function extractMyntra() {
  const titleEl = await waitForElement("h1");
  if (!titleEl) return null;

  const title = titleEl.innerText;

  const price =
    document.querySelector(".pdp-price strong")?.innerText || "0";

  const image =
    document.querySelector("meta[property='og:image']")?.content || "";

  return {
    title,
    price: price.replace(/[^\d.]/g, ""),
    image,
    url: window.location.href,
    website: "myntra"
  };
}

function extractMeesho() {
  const title =
    document.querySelector("h1")?.innerText ||
    document.querySelector("[data-testid='product-title']")?.innerText ||
    "Meesho Product";

  // Price (Meesho uses multiple structures)
  let price =
    document.querySelector("h4")?.innerText ||
    document.querySelector("[data-testid='price']")?.innerText ||
    "";

  // Clean price
  price = price.replace(/[^\d.]/g, "") || "0";

  // Image
  const image =
    document.querySelector("img[alt='product-image']")?.src ||
    document.querySelector("meta[property='og:image']")?.content ||
    "";

  return {
    title,
    price,
    image,
    url: window.location.href,
    website: "meesho"
  };
}

async function extractProductData() {
  const host = window.location.hostname;

  if (host.includes("amazon")) return await extractAmazon();
  if (host.includes("myntra")) return await extractMyntra();
  if (host.includes("meesho")) return await extractMeesho();

  return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    extractProductData().then(sendResponse);
    return true; // keep message channel open for async
  }
});
