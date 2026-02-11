const emailInput = document.getElementById("email");
const statusDiv = document.getElementById("status");

// Load saved email
chrome.storage.local.get(["user_email"], (result) => {
  if (result.user_email) {
    emailInput.value = result.user_email;
  }
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    statusDiv.style.display = "block";
    statusDiv.style.color = "red";
    statusDiv.innerText = "Enter email first";
    return;
  }

  chrome.storage.local.set({ user_email: email });

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  // 🔴 Ensure content script exists
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  // Now send message
  chrome.tabs.sendMessage(
    tab.id,
    { action: "extract" },
    function (productData) {

      if (chrome.runtime.lastError || !productData) {
        statusDiv.style.display = "block";
        statusDiv.style.color = "red";
        statusDiv.innerText = "Not a supported product page";
        setTimeout(() => window.close(), 1500);
        return;
      }

      productData.user_email = email;

      const emailInput = document.getElementById("email");
const statusDiv = document.getElementById("status");

// Load saved email
chrome.storage.local.get(["user_email"], (result) => {
  if (result.user_email) {
    emailInput.value = result.user_email;
  }
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    statusDiv.style.display = "block";
    statusDiv.style.color = "red";
    statusDiv.innerText = "Enter email first";
    return;
  }

  chrome.storage.local.set({ user_email: email });

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  // 🔴 Ensure content script exists
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  // Now send message
  chrome.tabs.sendMessage(
    tab.id,
    { action: "extract" },
    function (productData) {

      if (chrome.runtime.lastError || !productData) {
        statusDiv.style.display = "block";
        statusDiv.style.color = "red";
        statusDiv.innerText = "Not a supported product page";
        setTimeout(() => window.close(), 1500);
        return;
      }

      productData.user_email = email;

      fetch("http://127.0.0.1:8000/save-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      })
        .then(() => {
          statusDiv.style.display = "block";
          statusDiv.style.color = "green";
          statusDiv.innerText = "Saved ✓";
          setTimeout(() => window.close(), 2000);
        })
        .catch(() => {
          statusDiv.style.display = "block";
          statusDiv.style.color = "red";
          statusDiv.innerText = "Backend error";
        });
    }
  );
});

    }
  );
});
