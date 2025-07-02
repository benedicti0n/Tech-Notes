// Advanced Messaging Patterns in Plasmo
import type { PlasmoMessaging } from "@plasmohq/messaging"

// Type-safe message definitions
export interface MessageRequest {
    name: string
    body?: any
}

export interface MessageResponse {
    success: boolean
    data?: any
    error?: string
}

// Background message handler
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { name, body } = req

    switch (name) {
        case "get-tab-info":
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
                res.send({
                    success: true,
                    data: {
                        url: tabs[0]?.url,
                        title: tabs[0]?.title,
                        id: tabs[0]?.id
                    }
                })
            } catch (error) {
                res.send({
                    success: false,
                    error: error.message
                })
            }
            break

        case "save-user-data":
            try {
                await chrome.storage.sync.set({ userData: body })
                res.send({ success: true })
            } catch (error) {
                res.send({
                    success: false,
                    error: "Failed to save data"
                })
            }
            break

        case "get-user-data":
            try {
                const result = await chrome.storage.sync.get("userData")
                res.send({
                    success: true,
                    data: result.userData || {}
                })
            } catch (error) {
                res.send({
                    success: false,
                    error: "Failed to retrieve data"
                })
            }
            break

        case "analyze-page":
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

                // Inject script to analyze page
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        return {
                            wordCount: document.body.innerText.split(/\s+/).length,
                            linkCount: document.querySelectorAll("a").length,
                            imageCount: document.querySelectorAll("img").length,
                            headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
                            paragraphCount: document.querySelectorAll("p").length
                        }
                    }
                })

                res.send({
                    success: true,
                    data: results[0].result
                })
            } catch (error) {
                res.send({
                    success: false,
                    error: "Failed to analyze page"
                })
            }
            break

        default:
            res.send({
                success: false,
                error: `Unknown message type: ${name}`
            })
    }
}

// Utility functions for sending messages from content scripts or popup
export const sendMessage = async (name: string, body?: any): Promise<MessageResponse> => {
    try {
        const response = await chrome.runtime.sendMessage({ name, body })
        return response
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

// Example usage in components:
/*
import { sendMessage } from "~messaging"

// In a React component
const handleAnalyze = async () => {
  const response = await sendMessage("analyze-page")
  if (response.success) {
    console.log("Page analysis:", response.data)
  } else {
    console.error("Error:", response.error)
  }
}
*/