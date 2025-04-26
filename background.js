// CoinGecko API endpoints for PAXG (gold) and KAG (silver)
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,kinesis-silver&vs_currencies=usd";

// Store current prices
let goldPrice = "Loading...";
let silverPrice = "Loading...";

// Fetch prices every 5 minutes
function fetchSpotPrices() {
  console.log("Fetching prices at", new Date().toISOString());
  fetch(COINGECKO_API)
    .then(response => response.json())
    .then(data => {
      // Get previous prices from storage
      chrome.storage.local.get(["previousGoldPrice", "previousSilverPrice"], storedData => {
        const previousGoldPrice = storedData.previousGoldPrice || null;
        const previousSilverPrice = storedData.previousSilverPrice || null;

        console.log("Retrieved previous prices:", { previousGoldPrice, previousSilverPrice });

        // Update current prices
        goldPrice = data["pax-gold"].usd.toFixed(2);
        silverPrice = data["kinesis-silver"].usd.toFixed(2);

        // Log the prices for debugging
        console.log("Current Gold Price:", goldPrice, "Previous Gold Price:", previousGoldPrice);
        console.log("Current Silver Price:", silverPrice, "Previous Silver Price:", previousSilverPrice);

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

        // Log the directions for debugging
        console.log("Gold Direction:", goldDirection);
        console.log("Silver Direction:", silverDirection);

        // Store the current prices as previous for the next fetch
        const newData = {
          goldPrice,
          silverPrice,
          goldDirection,
          silverDirection,
          previousGoldPrice: goldPrice,
          previousSilverPrice: silverPrice
        };
        console.log("Storing new data:", newData);
        chrome.storage.local.set(newData);
      });
    })
    .catch(error => {
      console.error("Error fetching prices:", error);
      goldPrice = "Error";
      silverPrice = "Error";
      const errorData = {
        goldPrice,
        silverPrice,
        goldDirection: "",
        silverDirection: "",
        previousGoldPrice: goldPrice,
        previousSilverPrice: silverPrice
      };
      console.log("Storing error data:", errorData);
      chrome.storage.local.set(errorData);
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
  chrome.contextMenus.removeAll(() => {
    // Create new context menu items
    chrome.contextMenus.create({
      id: "insert-gold",
      title: "Insert Gold Spot Price (PAXG)",
      contexts: ["editable"]
    });

    chrome.contextMenus.create({
      id: "insert-silver",
      title: "Insert Silver Spot Price (KAG)",
      contexts: ["editable"]
    });
  });
}

// Create context menus on startup or installation
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started, creating context menus and fetching prices...");
  createContextMenus();
  fetchSpotPrices();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, creating context menus and fetching prices...");
  createContextMenus();
  fetchSpotPrices();
});

// Periodic update every 5 minutes
setInterval(fetchSpotPrices, 5 * 60 * 1000);

// Handle menu item clicks with a debounce mechanism
let isInserting = false;
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (isInserting) {
    console.log("Insert operation already in progress, skipping...");
    return;
  }

  isInserting = true;
  chrome.storage.local.get(["goldPrice", "silverPrice", "goldDirection", "silverDirection"], data => {
    console.log("Stored Data on Click:", data); // Log stored data for debugging
    const isGold = info.menuItemId === "insert-gold";
    const price = isGold ? data.goldPrice : data.silverPrice;
    const direction = isGold ? data.goldDirection : data.silverDirection;
    const label = isGold ? "Gold" : "Silver";

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
    const formattedText = `[${label}: $${price} ${direction} - ${dateTime}]`.trim();

    console.log("Inserting text:", formattedText);
    chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] }, // Only run in the main frame
      func: insertPrice,
      args: [formattedText]
    }, () => {
      isInserting = false; // Reset the flag after the operation completes
    });
  });
});

// Function to inject price into the active text field
function insertPrice(formattedText) {
  // Log the active element for debugging
  console.log("Active element:", document.activeElement);

  // Get the active element
  let targetElement = document.activeElement;

  // If the active element is not editable, try to find a contenteditable parent
  if (!targetElement.isContentEditable && targetElement.tagName !== "INPUT" && targetElement.tagName !== "TEXTAREA") {
    let parent = targetElement;
    while (parent && parent !== document.body) {
      if (parent.isContentEditable) {
        targetElement = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }

  console.log("Target element after adjustment:", targetElement);

  // Check if the editor is a Draft.js editor
  const isDraftJsEditor = targetElement.closest('.DraftEditor-root') !== null;
  console.log("Is Draft.js editor:", isDraftJsEditor);

  // Handle different types of editable elements
  if (targetElement.tagName === "INPUT" || targetElement.tagName === "TEXTAREA") {
    // For standard input or textarea elements
    const currentValue = targetElement.value || "";
    targetElement.value = currentValue + formattedText;

    // Dispatch an input event to notify the framework
    const inputEvent = new Event("input", { bubbles: true });
    targetElement.dispatchEvent(inputEvent);

    // Dispatch a change event for good measure
    const changeEvent = new Event("change", { bubbles: true });
    targetElement.dispatchEvent(changeEvent);
    console.log("Text inserted successfully into input/textarea.");
  } else if (targetElement.isContentEditable) {
    try {
      if (isDraftJsEditor) {
        // For Draft.js editors (like Gab), simulate a paste event
        const clipboardData = new DataTransfer();
        clipboardData.setData("text/plain", formattedText);
        const pasteEvent = new ClipboardEvent("paste", {
          clipboardData: clipboardData,
          bubbles: true,
          cancelable: true
        });
        targetElement.dispatchEvent(pasteEvent);
        console.log("Text inserted successfully into Draft.js editor using paste event.");
      } else {
        // For other contenteditable elements (like X)
        const beforeInputEvent = new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: formattedText,
          inputType: "insertText"
        });

        // Dispatch the beforeinput event
        const notPrevented = targetElement.dispatchEvent(beforeInputEvent);
        if (notPrevented) {
          // If the event wasn't prevented, the framework should handle the insertion
          const inputEvent = new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: formattedText
          });
          targetElement.dispatchEvent(inputEvent);
          console.log("Text inserted successfully using beforeinput event.");
        } else {
          // If the beforeinput event was prevented, fall back to Selection API
          console.log("beforeinput event was prevented, falling back to Selection API.");
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Remove any selected text
            const textNode = document.createTextNode(formattedText);
            range.insertNode(textNode);

            // Move the cursor after the inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // If no selection, append to the end of the contenteditable element
            const textNode = document.createTextNode(formattedText);
            targetElement.appendChild(textNode);

            // Move the cursor after the inserted text
            const range = document.createRange();
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // Dispatch an input event to notify the framework
          const inputEvent = new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: formattedText
          });
          targetElement.dispatchEvent(inputEvent);
          console.log("Text inserted successfully using Selection API.");
        }
      }
    } catch (error) {
      console.error("Text insertion failed:", error);
      console.error("Failed to insert text into contenteditable element.");
    }
  } else {
    console.error("No editable element found to insert text into.");
  }
}