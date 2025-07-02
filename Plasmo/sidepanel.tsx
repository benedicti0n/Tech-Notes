// Side Panel - Chrome's new side panel API (Chrome 114+)
import { useEffect, useState } from "react"
import { storageManager } from "~storage-manager"

import "./sidepanel.css"

interface PageAnalysis {
    wordCount: number
    linkCount: number
    imageCount: number
    headingCount: number
    paragraphCount: number
}

interface TabInfo {
    url: string
    title: string
    id: number
}

function SidePanel() {
    const [currentTab, setCurrentTab] = useState<TabInfo | null>(null)
    const [analysis, setAnalysis] = useState<PageAnalysis | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [notes, setNotes] = useState("")
    const [savedNotes, setSavedNotes] = useState<Record<string, string>>({})

    useEffect(() => {
        loadCurrentTab()
        loadSavedNotes()
    }, [])

    useEffect(() => {
        if (currentTab) {
            const savedNote = savedNotes[currentTab.url] || ""
            setNotes(savedNote)
        }
    }, [currentTab, savedNotes])

    const loadCurrentTab = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tab) {
                setCurrentTab({
                    url: tab.url || "",
                    title: tab.title || "",
                    id: tab.id || 0
                })
            }
        } catch (error) {
            console.error("Failed to get current tab:", error)
        }
    }

    const loadSavedNotes = async () => {
        try {
            const userData = await storageManager.getUserData()
            setSavedNotes(userData.preferences.notes || {})
        } catch (error) {
            console.error("Failed to load notes:", error)
        }
    }

    const analyzePage = async () => {
        if (!currentTab) return

        setIsAnalyzing(true)
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => {
                    return {
                        wordCount: document.body.innerText.split(/\s+/).filter(word => word.length > 0).length,
                        linkCount: document.querySelectorAll("a[href]").length,
                        imageCount: document.querySelectorAll("img").length,
                        headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
                        paragraphCount: document.querySelectorAll("p").length
                    }
                }
            })

            setAnalysis(results[0].result)
            await storageManager.incrementPagesAnalyzed()
        } catch (error) {
            console.error("Failed to analyze page:", error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const saveNotes = async () => {
        if (!currentTab) return

        const updatedNotes = { ...savedNotes, [currentTab.url]: notes }
        setSavedNotes(updatedNotes)

        try {
            const userData = await storageManager.getUserData()
            await storageManager.updateUserData({
                preferences: {
                    ...userData.preferences,
                    notes: updatedNotes
                }
            })
        } catch (error) {
            console.error("Failed to save notes:", error)
        }
    }

    const bookmarkPage = async () => {
        if (!currentTab) return

        try {
            await storageManager.addBookmark(currentTab.url, currentTab.title)
            // Show success feedback
            const button = document.querySelector('.bookmark-btn') as HTMLElement
            if (button) {
                const originalText = button.textContent
                button.textContent = "✅ Bookmarked!"
                setTimeout(() => {
                    button.textContent = originalText
                }, 2000)
            }
        } catch (error) {
            console.error("Failed to bookmark page:", error)
        }
    }

    const highlightText = async () => {
        if (!currentTab) return

        try {
            await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => {
                    // Remove existing highlights
                    document.querySelectorAll('.plasmo-highlight').forEach(el => {
                        const parent = el.parentNode
                        if (parent) {
                            parent.replaceChild(document.createTextNode(el.textContent || ''), el)
                            parent.normalize()
                        }
                    })

                    // Add new highlights to all paragraphs
                    document.querySelectorAll('p').forEach((p, index) => {
                        if (index % 2 === 0) { // Highlight every other paragraph
                            const span = document.createElement('span')
                            span.className = 'plasmo-highlight'
                            span.style.backgroundColor = '#ffeb3b'
                            span.style.padding = '2px 4px'
                            span.style.borderRadius = '2px'
                            span.textContent = p.textContent || ''
                            p.innerHTML = ''
                            p.appendChild(span)
                        }
                    })
                }
            })
        } catch (error) {
            console.error("Failed to highlight text:", error)
        }
    }

    return (
        <div className="sidepanel-container">
            <header className="sidepanel-header">
                <h1>🚀 Page Assistant</h1>
                <p>Analyze and interact with the current page</p>
            </header>

            <main className="sidepanel-main">
                {currentTab && (
                    <section className="current-page">
                        <h2>Current Page</h2>
                        <div className="page-info">
                            <div className="page-title">{currentTab.title}</div>
                            <div className="page-url">{currentTab.url}</div>
                        </div>

                        <div className="page-actions">
                            <button onClick={analyzePage} disabled={isAnalyzing} className="analyze-btn">
                                {isAnalyzing ? "🔄 Analyzing..." : "📊 Analyze Page"}
                            </button>
                            <button onClick={bookmarkPage} className="bookmark-btn">
                                🔖 Bookmark
                            </button>
                            <button onClick={highlightText} className="highlight-btn">
                                ✨ Highlight Text
                            </button>
                        </div>
                    </section>
                )}

                {analysis && (
                    <section className="analysis-results">
                        <h2>Page Analysis</h2>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{analysis.wordCount.toLocaleString()}</span>
                                <span className="stat-label">Words</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{analysis.linkCount}</span>
                                <span className="stat-label">Links</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{analysis.imageCount}</span>
                                <span className="stat-label">Images</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{analysis.headingCount}</span>
                                <span className="stat-label">Headings</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{analysis.paragraphCount}</span>
                                <span className="stat-label">Paragraphs</span>
                            </div>
                        </div>
                    </section>
                )}

                <section className="notes-section">
                    <h2>Page Notes</h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes about this page..."
                        className="notes-textarea"
                        rows={6}
                    />
                    <button onClick={saveNotes} className="save-notes-btn">
                        💾 Save Notes
                    </button>
                </section>

                <section className="quick-tools">
                    <h2>Quick Tools</h2>
                    <div className="tools-grid">
                        <button
                            onClick={() => chrome.runtime.openOptionsPage()}
                            className="tool-btn"
                        >
                            ⚙️ Settings
                        </button>
                        <button
                            onClick={() => window.open("chrome://extensions/", "_blank")}
                            className="tool-btn"
                        >
                            🧩 Extensions
                        </button>
                        <button
                            onClick={() => chrome.tabs.create({ url: "chrome://history/" })}
                            className="tool-btn"
                        >
                            📚 History
                        </button>
                        <button
                            onClick={() => chrome.tabs.create({ url: "chrome://bookmarks/" })}
                            className="tool-btn"
                        >
                            🔖 Bookmarks
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default SidePanel