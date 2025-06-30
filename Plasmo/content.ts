import type { PlasmoCSConfig } from "plasmo"

// Configure which sites this content script runs on
export const config: PlasmoCSConfig = {
    matches: ["https://*/*", "http://*/*"],
    all_frames: true
}

console.log("Content script loaded!")

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CHANGE_BACKGROUND") {
        document.body.style.backgroundColor = request.color
        sendResponse({ success: true })
    }

    if (request.type === "GET_PAGE_INFO") {
        sendResponse({
            title: document.title,
            url: window.location.href,
            textContent: document.body.innerText.slice(0, 100) + "..."
        })
    }
})

// Add a floating button to the page
const floatingButton = document.createElement("div")
floatingButton.innerHTML = "🚀"
floatingButton.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #4285f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
  font-size: 20px;
`

floatingButton.addEventListener("click", () => {
    alert("Hello from Plasmo content script!")
})

document.body.appendChild(floatingButton)