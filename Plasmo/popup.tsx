import { useState } from "react"

import "./style.css"

function IndexPopup() {
    const [data, setData] = useState("")

    const changeBackground = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type: "CHANGE_BACKGROUND",
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16)
                }
            )
        })
    }

    return (
        <div className="plasmo-popup">
            <h2>My Extension</h2>
            <input
                onChange={(e) => setData(e.target.value)}
                value={data}
                placeholder="Enter some text..."
            />
            <button onClick={changeBackground}>
                Change Page Background
            </button>
            <p>You entered: {data}</p>
        </div>
    )
}

export default IndexPopup