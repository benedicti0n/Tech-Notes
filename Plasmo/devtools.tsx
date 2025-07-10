// DevTools Panel - Custom developer tools integration
import { useEffect, useState } from "react"

import "./devtools.css"

interface NetworkRequest {
    url: string
    method: string
    status: number
    timestamp: number
    responseTime: number
}

interface ConsoleMessage {
    level: "log" | "warn" | "error" | "info"
    message: string
    timestamp: number
    source: string
}

interface PerformanceMetric {
    name: string
    value: number
    unit: string
}

function DevToolsPanel() {
    const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])
    const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
    const [activeTab, setActiveTab] = useState<"network" | "console" | "performance">("network")
    const [isRecording, setIsRecording] = useState(false)

    useEffect(() => {
        // Initialize DevTools API listeners
        if (chrome.devtools) {
            setupNetworkListener()
            setupConsoleListener()
            setupPerformanceListener()
        }
    }, [])

    const setupNetworkListener = () => {
        chrome.devtools.network.onRequestFinished.addListener((request) => {
            const networkRequest: NetworkRequest = {
                url: request.request.url,
                method: request.request.method,
                status: request.response.status,
                timestamp: Date.now(),
                responseTime: request.time
            }

            setNetworkRequests(prev => [networkRequest, ...prev.slice(0, 99)]) // Keep last 100
        })
    }

    const setupConsoleListener = () => {
        chrome.devtools.inspectedWindow.eval(
            `
      (function() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;
        
        const sendToExtension = (level, args) => {
          chrome.runtime.sendMessage({
            type: 'CONSOLE_MESSAGE',
            level: level,
            message: Array.from(args).join(' '),
            timestamp: Date.now(),
            source: window.location.href
          });
        };
        
        console.log = function(...args) {
          sendToExtension('log', args);
          originalLog.apply(console, args);
        };
        
        console.warn = function(...args) {
          sendToExtension('warn', args);
          originalWarn.apply(console, args);
        };
        
        console.error = function(...args) {
          sendToExtension('error', args);
          originalError.apply(console, args);
        };
        
        console.info = function(...args) {
          sendToExtension('info', args);
          originalInfo.apply(console, args);
        };
      })();
      `,
            (result, isException) => {
                if (isException) {
                    console.error("Failed to inject console listener:", isException)
                }
            }
        )

        // Listen for console messages
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'CONSOLE_MESSAGE') {
                const consoleMessage: ConsoleMessage = {
                    level: message.level,
                    message: message.message,
                    timestamp: message.timestamp,
                    source: message.source
                }
                setConsoleMessages(prev => [consoleMessage, ...prev.slice(0, 99)])
            }
        })
    }

    const setupPerformanceListener = () => {
        const updatePerformanceMetrics = () => {
            chrome.devtools.inspectedWindow.eval(
                `
        (function() {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          return {
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            memoryUsed: performance.memory ? performance.memory.usedJSHeapSize : 0,
            memoryTotal: performance.memory ? performance.memory.totalJSHeapSize : 0
          };
        })();
        `,
                (result, isException) => {
                    if (!isException && result) {
                        const metrics: PerformanceMetric[] = [
                            { name: "DOM Content Loaded", value: Math.round(result.domContentLoaded), unit: "ms" },
                            { name: "Load Complete", value: Math.round(result.loadComplete), unit: "ms" },
                            { name: "First Paint", value: Math.round(result.firstPaint), unit: "ms" },
                            { name: "First Contentful Paint", value: Math.round(result.firstContentfulPaint), unit: "ms" },
                            { name: "Memory Used", value: Math.round(result.memoryUsed / 1024 / 1024), unit: "MB" },
                            { name: "Memory Total", value: Math.round(result.memoryTotal / 1024 / 1024), unit: "MB" }
                        ]
                        setPerformanceMetrics(metrics)
                    }
                }
            )
        }

        updatePerformanceMetrics()
        const interval = setInterval(updatePerformanceMetrics, 5000)
        return () => clearInterval(interval)
    }

    const clearNetworkRequests = () => setNetworkRequests([])
    const clearConsoleMessages = () => setConsoleMessages([])

    const exportData = () => {
        const data = {
            networkRequests,
            consoleMessages,
            performanceMetrics,
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devtools-data-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const injectScript = () => {
        const script = `
      console.log("🚀 Plasmo DevTools Script Injected!");
      
      // Add global debugging helpers
      window.plasmoDebug = {
        logElementInfo: (selector) => {
          const el = document.querySelector(selector);
          if (el) {
            console.log("Element Info:", {
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              textContent: el.textContent?.slice(0, 100),
              attributes: Array.from(el.attributes).map(attr => ({name: attr.name, value: attr.value}))
            });
          } else {
            console.warn("Element not found:", selector);
          }
        },
        
        highlightElement: (selector) => {
          const el = document.querySelector(selector);
          if (el) {
            el.style.outline = "3px solid #ff0000";
            el.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            setTimeout(() => {
              el.style.outline = "";
              el.style.backgroundColor = "";
            }, 3000);
          }
        },
        
        getPageStats: () => {
          return {
            elements: document.querySelectorAll("*").length,
            scripts: document.querySelectorAll("script").length,
            stylesheets: document.querySelectorAll("link[rel='stylesheet']").length,
            images: document.querySelectorAll("img").length,
            forms: document.querySelectorAll("form").length
          };
        }
      };
      
      console.log("Available debug methods:", Object.keys(window.plasmoDebug));
    `

        chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
            if (isException) {
                console.error("Failed to inject debug script:", isException)
            } else {
                console.log("Debug script injected successfully")
            }
        })
    }

    return (
        <div className="devtools-container">
            <header className="devtools-header">
                <h1>🛠️ Plasmo DevTools</h1>
                <div className="header-actions">
                    <button onClick={exportData} className="export-btn">
                        📥 Export Data
                    </button>
                    <button onClick={injectScript} className="inject-btn">
                        💉 Inject Debug Script
                    </button>
                </div>
            </header>

            <nav className="devtools-nav">
                <button
                    className={`nav-btn ${activeTab === "network" ? "active" : ""}`}
                    onClick={() => setActiveTab("network")}
                >
                    🌐 Network ({networkRequests.length})
                </button>
                <button
                    className={`nav-btn ${activeTab === "console" ? "active" : ""}`}
                    onClick={() => setActiveTab("console")}
                >
                    📝 Console ({consoleMessages.length})
                </button>
                <button
                    className={`nav-btn ${activeTab === "performance" ? "active" : ""}`}
                    onClick={() => setActiveTab("performance")}
                >
                    ⚡ Performance
                </button>
            </nav>

            <main className="devtools-main">
                {activeTab === "network" && (
                    <div className="network-panel">
                        <div className="panel-header">
                            <h2>Network Requests</h2>
                            <button onClick={clearNetworkRequests} className="clear-btn">
                                🗑️ Clear
                            </button>
                        </div>
                        <div className="network-list">
                            {networkRequests.map((request, index) => (
                                <div key={index} className={`network-item status-${Math.floor(request.status / 100)}`}>
                                    <div className="request-method">{request.method}</div>
                                    <div className="request-url">{request.url}</div>
                                    <div className="request-status">{request.status}</div>
                                    <div className="request-time">{request.responseTime.toFixed(0)}ms</div>
                                </div>
                            ))}
                            {networkRequests.length === 0 && (
                                <div className="empty-state">No network requests captured yet</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "console" && (
                    <div className="console-panel">
                        <div className="panel-header">
                            <h2>Console Messages</h2>
                            <button onClick={clearConsoleMessages} className="clear-btn">
                                🗑️ Clear
                            </button>
                        </div>
                        <div className="console-list">
                            {consoleMessages.map((message, index) => (
                                <div key={index} className={`console-item level-${message.level}`}>
                                    <div className="message-level">{message.level.toUpperCase()}</div>
                                    <div className="message-content">{message.message}</div>
                                    <div className="message-time">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                            {consoleMessages.length === 0 && (
                                <div className="empty-state">No console messages captured yet</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "performance" && (
                    <div className="performance-panel">
                        <div className="panel-header">
                            <h2>Performance Metrics</h2>
                        </div>
                        <div className="metrics-grid">
                            {performanceMetrics.map((metric, index) => (
                                <div key={index} className="metric-item">
                                    <div className="metric-name">{metric.name}</div>
                                    <div className="metric-value">
                                        {metric.value} <span className="metric-unit">{metric.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default DevToolsPanel