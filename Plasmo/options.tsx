import { useEffect, useState } from "react"

import "./options.css"

function OptionsPage() {
    const [enabled, setEnabled] = useState(true)
    const [theme, setTheme] = useState("light")
    const [apiKey, setApiKey] = useState("")
    const [saved, setSaved] = useState(false)

    // Load settings on component mount
    useEffect(() => {
        chrome.storage.sync.get(["enabled", "theme", "apiKey"], (result) => {
            setEnabled(result.enabled ?? true)
            setTheme(result.theme ?? "light")
            setApiKey(result.apiKey ?? "")
        })
    }, [])

    const saveSettings = () => {
        chrome.storage.sync.set(
            {
                enabled,
                theme,
                apiKey
            },
            () => {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        )
    }

    const resetSettings = () => {
        setEnabled(true)
        setTheme("light")
        setApiKey("")

        chrome.storage.sync.clear(() => {
            console.log("Settings reset")
        })
    }

    return (
        <div className={`options-container ${theme}`}>
            <header>
                <h1>Extension Options</h1>
                <p>Configure your extension settings</p>
            </header>

            <main>
                <section className="setting-group">
                    <h2>General Settings</h2>

                    <div className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            Enable Extension
                        </label>
                    </div>

                    <div className="setting-item">
                        <label>Theme:</label>
                        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                </section>

                <section className="setting-group">
                    <h2>API Configuration</h2>

                    <div className="setting-item">
                        <label>API Key:</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key..."
                        />
                    </div>
                </section>

                <section className="actions">
                    <button onClick={saveSettings} className="save-btn">
                        {saved ? "Saved!" : "Save Settings"}
                    </button>
                    <button onClick={resetSettings} className="reset-btn">
                        Reset to Defaults
                    </button>
                </section>
            </main>
        </div>
    )
}

export default OptionsPage