// New Tab Page - Custom browser new tab replacement
import { useEffect, useState } from "react"
import { storageManager } from "~storage-manager"

import "./newtab.css"

interface Bookmark {
    url: string
    title: string
    timestamp: number
}

interface QuickLink {
    name: string
    url: string
    icon: string
}

function NewTabPage() {
    const [greeting, setGreeting] = useState("")
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([
        { name: "GitHub", url: "https://github.com", icon: "🐙" },
        { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "📚" },
        { name: "MDN", url: "https://developer.mozilla.org", icon: "🌐" },
        { name: "Plasmo Docs", url: "https://docs.plasmo.com", icon: "🚀" }
    ])
    const [searchQuery, setSearchQuery] = useState("")
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        // Set greeting based on time
        const hour = new Date().getHours()
        if (hour < 12) setGreeting("Good morning")
        else if (hour < 18) setGreeting("Good afternoon")
        else setGreeting("Good evening")

        // Load bookmarks
        loadBookmarks()

        // Update time every second
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const loadBookmarks = async () => {
        const userData = await storageManager.getUserData()
        setBookmarks(userData.bookmarks.slice(0, 6)) // Show only first 6
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
            window.location.href = searchUrl
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="newtab-container">
            <header className="newtab-header">
                <div className="time-display">
                    <div className="current-time">{formatTime(currentTime)}</div>
                    <div className="current-date">{formatDate(currentTime)}</div>
                </div>
                <div className="greeting">{greeting}! 👋</div>
            </header>

            <main className="newtab-main">
                <div className="search-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search the web..."
                            className="search-input"
                            autoFocus
                        />
                        <button type="submit" className="search-button">
                            🔍
                        </button>
                    </form>
                </div>

                <div className="content-grid">
                    <section className="quick-links">
                        <h2>Quick Links</h2>
                        <div className="links-grid">
                            {quickLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    className="quick-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="link-icon">{link.icon}</span>
                                    <span className="link-name">{link.name}</span>
                                </a>
                            ))}
                        </div>
                    </section>

                    <section className="recent-bookmarks">
                        <h2>Recent Bookmarks</h2>
                        {bookmarks.length > 0 ? (
                            <div className="bookmarks-list">
                                {bookmarks.map((bookmark, index) => (
                                    <a
                                        key={index}
                                        href={bookmark.url}
                                        className="bookmark-item"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="bookmark-title">{bookmark.title}</div>
                                        <div className="bookmark-url">{bookmark.url}</div>
                                        <div className="bookmark-date">
                                            {new Date(bookmark.timestamp).toLocaleDateString()}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No bookmarks yet</p>
                                <p>Start browsing to see your recent bookmarks here</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <footer className="newtab-footer">
                <div className="extension-info">
                    <span>Powered by My Plasmo Extension</span>
                    <button
                        onClick={() => chrome.runtime.openOptionsPage()}
                        className="settings-link"
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </footer>
        </div>
    )
}

export default NewTabPage