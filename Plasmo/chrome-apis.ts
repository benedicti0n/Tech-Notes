// Advanced Chrome APIs Integration for Plasmo Extensions

export interface TabInfo {
    id: number
    url: string
    title: string
    favIconUrl?: string
    status: string
    windowId: number
    active: boolean
    pinned: boolean
    audible: boolean
    muted: boolean
    incognito: boolean
}

export interface HistoryItem {
    id: string
    url: string
    title: string
    lastVisitTime: number
    visitCount: number
    typedCount: number
}

export interface BookmarkNode {
    id: string
    parentId?: string
    index?: number
    url?: string
    title: string
    dateAdded?: number
    dateGroupModified?: number
    children?: BookmarkNode[]
}

export interface DownloadItem {
    id: number
    url: string
    filename: string
    danger: string
    state: string
    paused: boolean
    canResume: boolean
    error?: string
    bytesReceived: number
    totalBytes: number
    fileSize: number
    exists: boolean
}

export interface CookieInfo {
    name: string
    value: string
    domain: string
    hostOnly: boolean
    path: string
    secure: boolean
    httpOnly: boolean
    sameSite: string
    session: boolean
    expirationDate?: number
    storeId: string
}

class ChromeAPIManager {
    private static instance: ChromeAPIManager
    private eventListeners: Map<string, Function[]> = new Map()

    static getInstance(): ChromeAPIManager {
        if (!ChromeAPIManager.instance) {
            ChromeAPIManager.instance = new ChromeAPIManager()
        }
        return ChromeAPIManager.instance
    }

    // Tab Management
    async getAllTabs(): Promise<TabInfo[]> {
        try {
            const tabs = await chrome.tabs.query({})
            return tabs.map(tab => ({
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                favIconUrl: tab.favIconUrl,
                status: tab.status || 'complete',
                windowId: tab.windowId,
                active: tab.active,
                pinned: tab.pinned,
                audible: tab.audible || false,
                muted: tab.mutedInfo?.muted || false,
                incognito: tab.incognito
            }))
        } catch (error) {
            console.error('Failed to get tabs:', error)
            return []
        }
    }

    async getActiveTab(): Promise<TabInfo | null> {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab) return null

            return {
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                favIconUrl: tab.favIconUrl,
                status: tab.status || 'complete',
                windowId: tab.windowId,
                active: tab.active,
                pinned: tab.pinned,
                audible: tab.audible || false,
                muted: tab.mutedInfo?.muted || false,
                incognito: tab.incognito
            }
        } catch (error) {
            console.error('Failed to get active tab:', error)
            return null
        }
    }

    async createTab(url: string, options: {
        active?: boolean
        pinned?: boolean
        windowId?: number
        index?: number
    } = {}): Promise<TabInfo | null> {
        try {
            const tab = await chrome.tabs.create({
                url,
                active: options.active ?? true,
                pinned: options.pinned ?? false,
                windowId: options.windowId,
                index: options.index
            })

            return {
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                favIconUrl: tab.favIconUrl,
                status: tab.status || 'loading',
                windowId: tab.windowId,
                active: tab.active,
                pinned: tab.pinned,
                audible: tab.audible || false,
                muted: tab.mutedInfo?.muted || false,
                incognito: tab.incognito
            }
        } catch (error) {
            console.error('Failed to create tab:', error)
            return null
        }
    }

    async closeTab(tabId: number): Promise<boolean> {
        try {
            await chrome.tabs.remove(tabId)
            return true
        } catch (error) {
            console.error('Failed to close tab:', error)
            return false
        }
    }

    async duplicateTab(tabId: number): Promise<TabInfo | null> {
        try {
            const tab = await chrome.tabs.duplicate(tabId)
            return {
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                favIconUrl: tab.favIconUrl,
                status: tab.status || 'loading',
                windowId: tab.windowId,
                active: tab.active,
                pinned: tab.pinned,
                audible: tab.audible || false,
                muted: tab.mutedInfo?.muted || false,
                incognito: tab.incognito
            }
        } catch (error) {
            console.error('Failed to duplicate tab:', error)
            return null
        }
    }

    async muteTab(tabId: number, muted: boolean): Promise<boolean> {
        try {
            await chrome.tabs.update(tabId, { muted })
            return true
        } catch (error) {
            console.error('Failed to mute/unmute tab:', error)
            return false
        }
    }

    async pinTab(tabId: number, pinned: boolean): Promise<boolean> {
        try {
            await chrome.tabs.update(tabId, { pinned })
            return true
        } catch (error) {
            console.error('Failed to pin/unpin tab:', error)
            return false
        }
    }

    async groupTabs(tabIds: number[], groupId?: number): Promise<number | null> {
        try {
            const result = await chrome.tabs.group({ tabIds, groupId })
            return result
        } catch (error) {
            console.error('Failed to group tabs:', error)
            return null
        }
    }

    // Window Management
    async getAllWindows(): Promise<chrome.windows.Window[]> {
        try {
            return await chrome.windows.getAll({ populate: true })
        } catch (error) {
            console.error('Failed to get windows:', error)
            return []
        }
    }

    async createWindow(options: {
        url?: string | string[]
        incognito?: boolean
        type?: 'normal' | 'popup' | 'panel'
        width?: number
        height?: number
        left?: number
        top?: number
    } = {}): Promise<chrome.windows.Window | null> {
        try {
            return await chrome.windows.create(options)
        } catch (error) {
            console.error('Failed to create window:', error)
            return null
        }
    }

    // History Management
    async searchHistory(query: string, maxResults: number = 100): Promise<HistoryItem[]> {
        try {
            const items = await chrome.history.search({
                text: query,
                maxResults,
                startTime: 0
            })

            return items.map(item => ({
                id: item.id,
                url: item.url,
                title: item.title || '',
                lastVisitTime: item.lastVisitTime || 0,
                visitCount: item.visitCount || 0,
                typedCount: item.typedCount || 0
            }))
        } catch (error) {
            console.error('Failed to search history:', error)
            return []
        }
    }

    async getVisits(url: string): Promise<chrome.history.VisitItem[]> {
        try {
            return await chrome.history.getVisits({ url })
        } catch (error) {
            console.error('Failed to get visits:', error)
            return []
        }
    }

    async deleteHistoryUrl(url: string): Promise<boolean> {
        try {
            await chrome.history.deleteUrl({ url })
            return true
        } catch (error) {
            console.error('Failed to delete history URL:', error)
            return false
        }
    }

    async deleteHistoryRange(startTime: number, endTime: number): Promise<boolean> {
        try {
            await chrome.history.deleteRange({ startTime, endTime })
            return true
        } catch (error) {
            console.error('Failed to delete history range:', error)
            return false
        }
    }

    // Bookmark Management
    async getBookmarks(): Promise<BookmarkNode[]> {
        try {
            const tree = await chrome.bookmarks.getTree()
            return tree
        } catch (error) {
            console.error('Failed to get bookmarks:', error)
            return []
        }
    }

    async searchBookmarks(query: string): Promise<BookmarkNode[]> {
        try {
            return await chrome.bookmarks.search(query)
        } catch (error) {
            console.error('Failed to search bookmarks:', error)
            return []
        }
    }

    async createBookmark(title: string, url: string, parentId?: string): Promise<BookmarkNode | null> {
        try {
            return await chrome.bookmarks.create({
                title,
                url,
                parentId
            })
        } catch (error) {
            console.error('Failed to create bookmark:', error)
            return null
        }
    }

    async removeBookmark(id: string): Promise<boolean> {
        try {
            await chrome.bookmarks.remove(id)
            return true
        } catch (error) {
            console.error('Failed to remove bookmark:', error)
            return false
        }
    }

    // Download Management
    async downloadFile(url: string, options: {
        filename?: string
        saveAs?: boolean
        conflictAction?: 'uniquify' | 'overwrite' | 'prompt'
    } = {}): Promise<number | null> {
        try {
            return await chrome.downloads.download({
                url,
                filename: options.filename,
                saveAs: options.saveAs,
                conflictAction: options.conflictAction
            })
        } catch (error) {
            console.error('Failed to download file:', error)
            return null
        }
    }

    async getDownloads(query: {
        query?: string[]
        startedBefore?: string
        startedAfter?: string
        endedBefore?: string
        endedAfter?: string
        totalBytesGreater?: number
        totalBytesLess?: number
        filenameRegex?: string
        urlRegex?: string
        limit?: number
        orderBy?: string[]
    } = {}): Promise<DownloadItem[]> {
        try {
            const downloads = await chrome.downloads.search(query)
            return downloads.map(download => ({
                id: download.id,
                url: download.url,
                filename: download.filename,
                danger: download.danger,
                state: download.state,
                paused: download.paused,
                canResume: download.canResume,
                error: download.error,
                bytesReceived: download.bytesReceived,
                totalBytes: download.totalBytes,
                fileSize: download.fileSize,
                exists: download.exists
            }))
        } catch (error) {
            console.error('Failed to get downloads:', error)
            return []
        }
    }

    async pauseDownload(downloadId: number): Promise<boolean> {
        try {
            await chrome.downloads.pause(downloadId)
            return true
        } catch (error) {
            console.error('Failed to pause download:', error)
            return false
        }
    }

    async resumeDownload(downloadId: number): Promise<boolean> {
        try {
            await chrome.downloads.resume(downloadId)
            return true
        } catch (error) {
            console.error('Failed to resume download:', error)
            return false
        }
    }

    async cancelDownload(downloadId: number): Promise<boolean> {
        try {
            await chrome.downloads.cancel(downloadId)
            return true
        } catch (error) {
            console.error('Failed to cancel download:', error)
            return false
        }
    }

    // Cookie Management
    async getCookies(url: string, name?: string): Promise<CookieInfo[]> {
        try {
            const cookies = await chrome.cookies.getAll({ url, name })
            return cookies.map(cookie => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                hostOnly: cookie.hostOnly,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                session: cookie.session,
                expirationDate: cookie.expirationDate,
                storeId: cookie.storeId
            }))
        } catch (error) {
            console.error('Failed to get cookies:', error)
            return []
        }
    }

    async setCookie(url: string, cookie: {
        name: string
        value: string
        domain?: string
        path?: string
        secure?: boolean
        httpOnly?: boolean
        expirationDate?: number
    }): Promise<boolean> {
        try {
            await chrome.cookies.set({ url, ...cookie })
            return true
        } catch (error) {
            console.error('Failed to set cookie:', error)
            return false
        }
    }

    async removeCookie(url: string, name: string): Promise<boolean> {
        try {
            await chrome.cookies.remove({ url, name })
            return true
        } catch (error) {
            console.error('Failed to remove cookie:', error)
            return false
        }
    }

    // Notification Management
    async createNotification(options: {
        type: 'basic' | 'image' | 'list' | 'progress'
        iconUrl: string
        title: string
        message: string
        contextMessage?: string
        priority?: number
        eventTime?: number
        buttons?: Array<{ title: string; iconUrl?: string }>
        imageUrl?: string
        items?: Array<{ title: string; message: string }>
        progress?: number
        isClickable?: boolean
        requireInteraction?: boolean
        silent?: boolean
    }): Promise<string | null> {
        try {
            return await chrome.notifications.create(options)
        } catch (error) {
            console.error('Failed to create notification:', error)
            return null
        }
    }

    async clearNotification(notificationId: string): Promise<boolean> {
        try {
            return await chrome.notifications.clear(notificationId)
        } catch (error) {
            console.error('Failed to clear notification:', error)
            return false
        }
    }

    // Context Menu Management
    createContextMenu(options: {
        id: string
        title: string
        contexts: chrome.contextMenus.ContextType[]
        onclick?: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void
        parentId?: string
        documentUrlPatterns?: string[]
        targetUrlPatterns?: string[]
        enabled?: boolean
        visible?: boolean
    }): void {
        try {
            chrome.contextMenus.create({
                id: options.id,
                title: options.title,
                contexts: options.contexts,
                parentId: options.parentId,
                documentUrlPatterns: options.documentUrlPatterns,
                targetUrlPatterns: options.targetUrlPatterns,
                enabled: options.enabled,
                visible: options.visible
            })

            if (options.onclick) {
                chrome.contextMenus.onClicked.addListener((info, tab) => {
                    if (info.menuItemId === options.id) {
                        options.onclick!(info, tab)
                    }
                })
            }
        } catch (error) {
            console.error('Failed to create context menu:', error)
        }
    }

    removeContextMenu(menuItemId: string): void {
        try {
            chrome.contextMenus.remove(menuItemId)
        } catch (error) {
            console.error('Failed to remove context menu:', error)
        }
    }

    // Event Listeners
    addEventListener(eventName: string, callback: Function): void {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, [])
        }
        this.eventListeners.get(eventName)!.push(callback)

        // Set up Chrome API listeners
        switch (eventName) {
            case 'tabCreated':
                chrome.tabs.onCreated.addListener(callback as any)
                break
            case 'tabUpdated':
                chrome.tabs.onUpdated.addListener(callback as any)
                break
            case 'tabRemoved':
                chrome.tabs.onRemoved.addListener(callback as any)
                break
            case 'windowCreated':
                chrome.windows.onCreated.addListener(callback as any)
                break
            case 'windowRemoved':
                chrome.windows.onRemoved.addListener(callback as any)
                break
            case 'downloadChanged':
                chrome.downloads.onChanged.addListener(callback as any)
                break
            case 'bookmarkCreated':
                chrome.bookmarks.onCreated.addListener(callback as any)
                break
            case 'bookmarkRemoved':
                chrome.bookmarks.onRemoved.addListener(callback as any)
                break
        }
    }

    removeEventListener(eventName: string, callback: Function): void {
        const listeners = this.eventListeners.get(eventName)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }

        // Remove Chrome API listeners
        switch (eventName) {
            case 'tabCreated':
                chrome.tabs.onCreated.removeListener(callback as any)
                break
            case 'tabUpdated':
                chrome.tabs.onUpdated.removeListener(callback as any)
                break
            case 'tabRemoved':
                chrome.tabs.onRemoved.removeListener(callback as any)
                break
            case 'windowCreated':
                chrome.windows.onCreated.removeListener(callback as any)
                break
            case 'windowRemoved':
                chrome.windows.onRemoved.removeListener(callback as any)
                break
            case 'downloadChanged':
                chrome.downloads.onChanged.removeListener(callback as any)
                break
            case 'bookmarkCreated':
                chrome.bookmarks.onCreated.removeListener(callback as any)
                break
            case 'bookmarkRemoved':
                chrome.bookmarks.onRemoved.removeListener(callback as any)
                break
        }
    }

    // Utility methods
    async captureVisibleTab(windowId?: number, options?: chrome.tabs.CaptureVisibleTabOptions): Promise<string | null> {
        try {
            return await chrome.tabs.captureVisibleTab(windowId, options)
        } catch (error) {
            console.error('Failed to capture visible tab:', error)
            return null
        }
    }

    async executeScript(tabId: number, details: chrome.scripting.ScriptInjection): Promise<any[]> {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                ...details
            })
            return results.map(result => result.result)
        } catch (error) {
            console.error('Failed to execute script:', error)
            return []
        }
    }

    async insertCSS(tabId: number, details: chrome.scripting.CSSInjection): Promise<boolean> {
        try {
            await chrome.scripting.insertCSS({
                target: { tabId },
                ...details
            })
            return true
        } catch (error) {
            console.error('Failed to insert CSS:', error)
            return false
        }
    }

    async removeCSS(tabId: number, details: chrome.scripting.CSSInjection): Promise<boolean> {
        try {
            await chrome.scripting.removeCSS({
                target: { tabId },
                ...details
            })
            return true
        } catch (error) {
            console.error('Failed to remove CSS:', error)
            return false
        }
    }
}

// React hook for Chrome APIs
import { useEffect, useState } from "react"

export function useChromeAPI() {
    const [tabs, setTabs] = useState<TabInfo[]>([])
    const [activeTab, setActiveTab] = useState<TabInfo | null>(null)
    const [downloads, setDownloads] = useState<DownloadItem[]>([])
    const chromeAPI = ChromeAPIManager.getInstance()

    useEffect(() => {
        // Load initial data
        chromeAPI.getAllTabs().then(setTabs)
        chromeAPI.getActiveTab().then(setActiveTab)
        chromeAPI.getDownloads().then(setDownloads)

        // Set up event listeners
        const handleTabCreated = (tab: chrome.tabs.Tab) => {
            chromeAPI.getAllTabs().then(setTabs)
        }

        const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            chromeAPI.getAllTabs().then(setTabs)
            if (tab.active) {
                chromeAPI.getActiveTab().then(setActiveTab)
            }
        }

        const handleTabRemoved = (tabId: number) => {
            chromeAPI.getAllTabs().then(setTabs)
        }

        chromeAPI.addEventListener('tabCreated', handleTabCreated)
        chromeAPI.addEventListener('tabUpdated', handleTabUpdated)
        chromeAPI.addEventListener('tabRemoved', handleTabRemoved)

        return () => {
            chromeAPI.removeEventListener('tabCreated', handleTabCreated)
            chromeAPI.removeEventListener('tabUpdated', handleTabUpdated)
            chromeAPI.removeEventListener('tabRemoved', handleTabRemoved)
        }
    }, [chromeAPI])

    return {
        tabs,
        activeTab,
        downloads,
        createTab: chromeAPI.createTab.bind(chromeAPI),
        closeTab: chromeAPI.closeTab.bind(chromeAPI),
        duplicateTab: chromeAPI.duplicateTab.bind(chromeAPI),
        muteTab: chromeAPI.muteTab.bind(chromeAPI),
        pinTab: chromeAPI.pinTab.bind(chromeAPI),
        groupTabs: chromeAPI.groupTabs.bind(chromeAPI),
        searchHistory: chromeAPI.searchHistory.bind(chromeAPI),
        getBookmarks: chromeAPI.getBookmarks.bind(chromeAPI),
        createBookmark: chromeAPI.createBookmark.bind(chromeAPI),
        downloadFile: chromeAPI.downloadFile.bind(chromeAPI),
        createNotification: chromeAPI.createNotification.bind(chromeAPI),
        captureVisibleTab: chromeAPI.captureVisibleTab.bind(chromeAPI),
        executeScript: chromeAPI.executeScript.bind(chromeAPI),
        insertCSS: chromeAPI.insertCSS.bind(chromeAPI)
    }
}

// Export singleton instance
export const chromeAPI = ChromeAPIManager.getInstance()

// Example usage:
/*
import { useChromeAPI } from "~chrome-apis"

function TabManagerComponent() {
  const { tabs, activeTab, createTab, closeTab, muteTab } = useChromeAPI()
  
  return (
    <div>
      <h2>Active Tab: {activeTab?.title}</h2>
      <button onClick={() => createTab('https://example.com')}>
        Create New Tab
      </button>
      
      <div>
        {tabs.map(tab => (
          <div key={tab.id}>
            <span>{tab.title}</span>
            <button onClick={() => muteTab(tab.id, !tab.muted)}>
              {tab.muted ? 'Unmute' : 'Mute'}
            </button>
            <button onClick={() => closeTab(tab.id)}>Close</button>
          </div>
        ))}
      </div>
    </div>
  )
}
*/