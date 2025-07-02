import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useState } from "react"

// Content Script UI - Injects React components directly into web pages
export const config: PlasmoCSConfig = {
    matches: ["https://*/*"]
}

// Define where to inject the UI on the page
export const getInlineAnchor: PlasmoGetInlineAnchor = () => {
    return document.querySelector("body")
}

// Styling for the injected component
export const getShadowHostId = () => "plasmo-inline-example"

const ContentUI = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [pageData, setPageData] = useState({
        title: "",
        links: 0,
        images: 0
    })

    const analyyzePage = () => {
        const links = document.querySelectorAll("a").length
        const images = document.querySelectorAll("img").length

        setPageData({
            title: document.title,
            links,
            images
        })
        setIsVisible(true)
    }

    const highlightLinks = () => {
        document.querySelectorAll("a").forEach((link, index) => {
            link.style.border = "2px solid #ff6b6b"
            link.style.borderRadius = "3px"
            link.title = `Link #${index + 1}`
        })
    }

    if (!isVisible) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    zIndex: 10000,
                    background: "#4285f4",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "12px"
                }}
                onClick={analyyzePage}>
                📊 Analyze Page
            </div>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                zIndex: 10000,
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                minWidth: "200px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px"
            }}>
            <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                Page Analysis
            </div>
            <div>Title: {pageData.title.slice(0, 30)}...</div>
            <div>Links: {pageData.links}</div>
            <div>Images: {pageData.images}</div>

            <div style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
                <button
                    onClick={highlightLinks}
                    style={{
                        padding: "5px 10px",
                        background: "#ff6b6b",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "10px"
                    }}>
                    Highlight Links
                </button>
                <button
                    onClick={() => setIsVisible(false)}
                    style={{
                        padding: "5px 10px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "10px"
                    }}>
                    Close
                </button>
            </div>
        </div>
    )
}

export default ContentUI