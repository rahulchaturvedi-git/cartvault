const saveBtn = document.getElementById("saveBtn");
const statusDiv = document.getElementById("status");
const emailInput = document.getElementById("email");

// Load saved email
chrome.storage.local.get(["user_email"], (result) => {
  if (result.user_email) {
    emailInput.value = result.user_email;
  }
});

saveBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    statusDiv.style.display = "block";
    statusDiv.style.color = "red";
    statusDiv.innerText = "Enter email first";
    return;
  }

  chrome.storage.local.set({ user_email: email });

  // Get active tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  try {
    // Force inject content script (Fix for Flipkart SPA)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    console.log("Script already injected");
  }

  // Ask for product data
  chrome.tabs.sendMessage(tab.id, { action: "extract" }, async (productData) => {

    console.log("Product data received:", productData);

    if (chrome.runtime.lastError || !productData) {
      console.error("Error:", chrome.runtime.lastError);
      statusDiv.style.display = "block";
      statusDiv.style.color = "red";
      statusDiv.innerText = "Not a product page";
      setTimeout(() => window.close(), 1500);
      return;
    }

    // Validate that we have essential data
    if (!productData.title || productData.title === "Flipkart Product" && productData.price === "0") {
      statusDiv.style.display = "block";
      statusDiv.style.color = "red";
      statusDiv.innerText = "Could not extract product data";
      console.error("Invalid product data:", productData);
      setTimeout(() => window.close(), 2000);
      return;
    }

    productData.user_email = email;

    try {
      const response = await fetch("http://127.0.0.1:8000/save-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Server error");
      }

      statusDiv.style.display = "block";
      statusDiv.style.color = "green";
      statusDiv.innerText = "Saved ✓";

      setTimeout(() => window.close(), 1500);

    } catch (err) {
      console.error("Error saving:", err);
      statusDiv.style.display = "block";
      statusDiv.style.color = "red";
      statusDiv.innerText = "Error: " + err.message;
    }
  });
});
