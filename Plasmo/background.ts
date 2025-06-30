// Background script (Service Worker in Manifest V3)

console.log("Background script loaded!")

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed:", details.reason)

    if (details.reason === "install") {
        // Set default settings
        chrome.storage.sync.set({
            enabled: true,
            theme: "light"
        })
    }
})

// Handle browser action (extension icon) clicks
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked on tab:", tab.url)

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
        type: "ICON_CLICKED",
        tabInfo: tab
    })
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in background:", request)

    if (request.type === "GET_STORAGE") {
        chrome.storage.sync.get(null, (data) => {
            sendResponse(data)
        })
        return true // Keep message channel open for async response
    }

    if (request.type === "SET_STORAGE") {
        chrome.storage.sync.set(request.data, () => {
            sendResponse({ success: true })
        })
        return true
    }
})

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("Tab updated:", tab.url)

        // You can perform actions when pages load
        // For example, inject content scripts or update badge
        chrome.action.setBadgeText({
            tabId: tabId,
            text: "✓"
        })
    }
})

// Set up context menus
chrome.contextMenus.create({
    id: "plasmo-menu",
    title: "My Plasmo Extension",
    contexts: ["selection", "page"]
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "plasmo-menu") {
        console.log("Context menu clicked:", info.selectionText)

        // Send selected text to content script
        chrome.tabs.sendMessage(tab.id, {
            type: "CONTEXT_MENU_CLICKED",
            selectedText: info.selectionText
        })
    }
})