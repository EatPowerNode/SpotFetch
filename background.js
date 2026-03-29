// Cross-browser API polyfill
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const storage = browserAPI.storage.local;
const contextMenus = browserAPI.contextMenus;
const scripting = browserAPI.scripting;

// CoinGecko API endpoints for PAXG (gold), KAG (silver), and GRAMP (platinum)
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,kinesis-silver,gram-platinum&vs_currencies=usd";

// Store current prices
let goldPrice = "Loading...";
let silverPrice = "Loading...";
let platinumPrice = "Loading...";

// Fetch prices every 5 minutes
function fetchSpotPrices() {
  console.log("Fetching prices at", new Date().toISOString());
  fetch(COINGECKO_API)
    .then(response => response.json())
    .then(data => {
      // Get previous prices from storage
      storage.get(["previousGoldPrice", "previousSilverPrice", "previousPlatinumPrice"], storedData => {
        const previousGoldPrice = storedData.previousGoldPrice || null;
        const previousSilverPrice = storedData.previousSilverPrice || null;
        const previousPlatinumPrice = storedData.previousPlatinumPrice || null;

        console.log("Retrieved previous prices:", { previousGoldPrice, previousSilverPrice, previousPlatinumPrice });

        // Update current prices
        goldPrice = data["pax-gold"].usd.toFixed(2);
        silverPrice = data["kinesis-silver"].usd.toFixed(2);
        platinumPrice = (data["gram-platinum"].usd * 31.10348).toFixed(2);

        // Log the prices for debugging
        console.log("Current Gold Price:", goldPrice, "Previous Gold Price:", previousGoldPrice);
        console.log("Current Silver Price:", silverPrice, "Previous Silver Price:", previousSilverPrice);
        console.log("Current Platinum Price:", platinumPrice, "Previous Platinum Price:", previousPlatinumPrice);

        // Determine price direction
        let goldDirection = "";
        if (previousGoldPrice && previousGoldPrice !== "Loading..." && previousGoldPrice !== "Error") {
          const currentGold = parseFloat(goldPrice);
          const prevGold = parseFloat(previousGoldPrice);
          if (currentGold > prevGold) {
            goldDirection = "up";
          } else if (currentGold < prevGold) {
            goldDirection = "down";
          } else {
            goldDirection = "unc";
          }
        }

        let silverDirection = "";
        if (previousSilverPrice && previousSilverPrice !== "Loading..." && previousSilverPrice !== "Error") {
          const currentSilver = parseFloat(silverPrice);
          const prevSilver = parseFloat(previousSilverPrice);
          if (currentSilver > prevSilver) {
            silverDirection = "up";
          } else if (currentSilver < prevSilver) {
            silverDirection = "down";
          } else {
            silverDirection = "unc";
          }
        }

        let platinumDirection = "";
        if (previousPlatinumPrice && previousPlatinumPrice !== "Loading..." && previousPlatinumPrice !== "Error") {
          const currentPlatinum = parseFloat(platinumPrice);
          const prevPlatinum = parseFloat(previousPlatinumPrice);
          if (currentPlatinum > prevPlatinum) {
            platinumDirection = "up";
          } else if (currentPlatinum < prevPlatinum) {
            platinumDirection = "down";
          } else {
            platinumDirection = "unc";
          }
        }

        // Log the directions for debugging
        console.log("Gold Direction:", goldDirection);
        console.log("Silver Direction:", silverDirection);
        console.log("Platinum Direction:", platinumDirection);

        // Store the current prices as previous for the next fetch
        const newData = {
          goldPrice,
          silverPrice,
          platinumPrice,
          goldDirection,
          silverDirection,
          platinumDirection,
          previousGoldPrice: goldPrice,
          previousSilverPrice: silverPrice,
          previousPlatinumPrice: platinumPrice
        };
        console.log("Storing new data:", newData);
        storage.set(newData);
      });
    })
    .catch(error => {
      console.error("Error fetching prices:", error);
      goldPrice = "Error";
      silverPrice = "Error";
      platinumPrice = "Error";
      const errorData = {
        goldPrice,
        silverPrice,
        platinumPrice,
        goldDirection: "",
        silverDirection: "",
        platinumDirection: "",
        previousGoldPrice: goldPrice,
        previousSilverPrice: silverPrice,
        previousPlatinumPrice: platinumPrice
      };
      console.log("Storing error data:", errorData);
      storage.set(errorData);
      // Retry after 30 seconds
      setTimeout(fetchSpotPrices, 30000);
    });
}

// Function to get the timezone abbreviation
function getTimezoneAbbreviation() {
  // Get the full timezone name (e.g., "America/Chicago")
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Determine if DST is in effect
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const isDST = now.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

  // Map common timezone names to their abbreviations
  const timezoneMap = {
    "America/Chicago": isDST ? "CDT" : "CST", // Central Time
    "America/New_York": isDST ? "EDT" : "EST", // Eastern Time
    "America/Los_Angeles": isDST ? "PDT" : "PST", // Pacific Time
    "America/Denver": isDST ? "MDT" : "MST", // Mountain Time
    "America/Anchorage": isDST ? "AKDT" : "AKST", // Alaska Time
    "Pacific/Honolulu": "HST", // Hawaii Standard Time (no DST)
    "America/Phoenix": "MST", // Arizona (no DST)
    "America/Toronto": isDST ? "EDT" : "EST", // Eastern Time (Canada)
    "Europe/London": isDST ? "BST" : "GMT", // British Time
    "Europe/Paris": isDST ? "CEST" : "CET", // Central European Time
    "Asia/Tokyo": "JST", // Japan Standard Time (no DST)
    "Australia/Sydney": isDST ? "AEDT" : "AEST", // Australian Eastern Time
    "Pacific/Auckland": isDST ? "NZDT" : "NZST", // New Zealand Time
    "Asia/Kolkata": "IST", // India Standard Time (no DST)
    "Asia/Dubai": "GST", // Gulf Standard Time (no DST)
    "UTC": "UTC" // Coordinated Universal Time
  };

  // Return the mapped abbreviation or default to "UTC" if not found
  return timezoneMap[timezoneName] || "UTC";
}

// Function to create context menu items
function createContextMenus() {
  // Remove all existing context menu items to avoid duplicates
  contextMenus.removeAll(() => {
    // Create new context menu items
    contextMenus.create({
      id: "insert-gold",
      title: "Insert Gold Spot Price (PAXG)",
      contexts: ["editable"]
    });

    contextMenus.create({
      id: "insert-silver",
      title: "Insert Silver Spot Price (KAG)",
      contexts: ["editable"]
    });

    contextMenus.create({
      id: "insert-platinum",
      title: "Insert Platinum Spot Price (GRAMP)",
      contexts: ["editable"]
    });
  });
}

// Create context menus and initial fetch on installation
browserAPI.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, creating context menus and fetching prices...");
  createContextMenus();
  fetchSpotPrices();
});

// Fetch on browser startup (for non-persistent backgrounds in Firefox)
browserAPI.runtime.onStartup.addListener(() => {
  console.log("Extension started, fetching prices...");
  fetchSpotPrices();
});

// Periodic update every 5 minutes
setInterval(fetchSpotPrices, 5 * 60 * 1000);

// Handle menu item clicks with a debounce mechanism
let isInserting = false;
contextMenus.onClicked.addListener((info, tab) => {
  if (isInserting) {
    console.log("Insert operation already in progress, skipping...");
    return;
  }

  isInserting = true;
  storage.get(["goldPrice", "silverPrice", "platinumPrice", "goldDirection", "silverDirection", "platinumDirection"], data => {
    console.log("Stored Data on Click:", data); // Log stored data for debugging
    const isGold = info.menuItemId === "insert-gold";
    const isSilver = info.menuItemId === "insert-silver";
    const isPlatinum = info.menuItemId === "insert-platinum";
    const price = isGold ? data.goldPrice : isPlatinum ? data.platinumPrice : data.silverPrice;
    const direction = isGold ? data.goldDirection : isPlatinum ? data.platinumDirection : data.silverDirection;
    const label = isGold ? "Gold" : isPlatinum ? "Platinum" : "Silver";

    // Get the current local date and time
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2); // Last two digits of the year
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timezone = getTimezoneAbbreviation();
    const dateTime = `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${timezone}`;

    // Format the output with date, time, and timezone
    const formattedText = `[${label}: $${price}/ozt ${direction} - ${dateTime}]`.trim();

    console.log("Inserting text:", formattedText);
    scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] }, // Only run in the main frame
      func: insertPrice,
      args: [formattedText]
    }, (results) => {
      if (browserAPI.runtime.lastError) {
        console.error("Execute script error:", browserAPI.runtime.lastError.message);
      } else {
        console.log("Execute script succeeded:", results);
      }
      isInserting = false; // Reset the flag after the operation completes
    });
  });
});

// Function to inject price into the active text field
function insertPrice(formattedText) {
  console.log("=== Inserting price ===", formattedText);
  console.log("Active element:", document.activeElement);

  let targetElement = document.activeElement;

  // Walk up to find contenteditable if needed
  if (!targetElement.isContentEditable && 
      targetElement.tagName !== "INPUT" && 
      targetElement.tagName !== "TEXTAREA") {
    let parent = targetElement;
    while (parent && parent !== document.body) {
      if (parent.isContentEditable) {
        targetElement = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }

  console.log("Final target element:", targetElement);

  // Standard input/textarea
  if (targetElement.tagName === "INPUT" || targetElement.tagName === "TEXTAREA") {
    const currentValue = targetElement.value || "";
    targetElement.value = currentValue + formattedText;

    targetElement.dispatchEvent(new Event("input", { bubbles: true }));
    targetElement.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("Inserted into INPUT/TEXTAREA");
    return;
  }

  if (!targetElement.isContentEditable) {
    console.error("No editable element found");
    return;
  }

  targetElement.focus();

  const isDraftJsEditor = targetElement.closest('.DraftEditor-root, .public-DraftEditor-content') !== null;
  console.log("Is Draft.js editor:", isDraftJsEditor);

  // === DRAFT.JS / GAB PATH (this is the one that was duplicating) ===
  if (isDraftJsEditor) {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", formattedText);

    const pasteEvent = new ClipboardEvent("paste", {
      clipboardData: clipboardData,
      bubbles: true,
      cancelable: true
    });

    targetElement.dispatchEvent(pasteEvent);
    console.log("Inserted via Clipboard paste event (Draft.js)");
    return;   // ← STOP HERE so nothing else runs
  }

  // === Regular contenteditable (non-Gab) ===
  // (we can keep this for other sites, but it won't run on Gab)
  const beforeInputEvent = new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    data: formattedText,
    inputType: "insertText"
  });

  const notPrevented = targetElement.dispatchEvent(beforeInputEvent);
  if (notPrevented) {
    const inputEvent = new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: formattedText
    });
    targetElement.dispatchEvent(inputEvent);
    console.log("Inserted via beforeinput + input events");
  } else {
    // Fallback for stubborn editors
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(formattedText);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      targetElement.appendChild(document.createTextNode(formattedText));
    }
    console.log("Inserted via Selection API fallback");
  }
}

/**
 * SpotFetch Extension - Version 1.4
 * 
 * Features:
 *   - Gold (PAXG), Silver (KAG), and Platinum (GRAMP) spot prices
 *   - All prices shown in troy ounces (/ozt)
 *   - Reliable insertion on Gab (Draft.js) and other rich text editors
 *   - Cross-browser support (Chromium + Firefox)
 * 
 * Last updated: March 2026
 */