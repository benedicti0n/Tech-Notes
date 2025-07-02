// Advanced Storage Management for Plasmo Extensions

export interface UserSettings {
    theme: "light" | "dark" | "auto"
    enabled: boolean
    notifications: boolean
    autoSave: boolean
    language: string
    customRules: string[]
}

export interface UserData {
    visitedSites: string[]
    bookmarks: Array<{ url: string; title: string; timestamp: number }>
    preferences: Record<string, any>
    statistics: {
        extensionUsage: number
        pagesAnalyzed: number
        lastActive: number
    }
}

class StorageManager {
    private static instance: StorageManager
    private cache: Map<string, any> = new Map()

    static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager()
        }
        return StorageManager.instance
    }

    // Settings management
    async getSettings(): Promise<UserSettings> {
        const cached = this.cache.get("settings")
        if (cached) return cached

        const result = await chrome.storage.sync.get("settings")
        const settings: UserSettings = {
            theme: "light",
            enabled: true,
            notifications: true,
            autoSave: false,
            language: "en",
            customRules: [],
            ...result.settings
        }

        this.cache.set("settings", settings)
        return settings
    }

    async updateSettings(updates: Partial<UserSettings>): Promise<void> {
        const currentSettings = await this.getSettings()
        const newSettings = { ...currentSettings, ...updates }

        await chrome.storage.sync.set({ settings: newSettings })
        this.cache.set("settings", newSettings)

        // Notify other parts of extension about settings change
        chrome.runtime.sendMessage({
            type: "SETTINGS_UPDATED",
            settings: newSettings
        })
    }

    // User data management
    async getUserData(): Promise<UserData> {
        const cached = this.cache.get("userData")
        if (cached) return cached

        const result = await chrome.storage.local.get("userData")
        const userData: UserData = {
            visitedSites: [],
            bookmarks: [],
            preferences: {},
            statistics: {
                extensionUsage: 0,
                pagesAnalyzed: 0,
                lastActive: Date.now()
            },
            ...result.userData
        }

        this.cache.set("userData", userData)
        return userData
    }

    async updateUserData(updates: Partial<UserData>): Promise<void> {
        const currentData = await this.getUserData()
        const newData = { ...currentData, ...updates }

        await chrome.storage.local.set({ userData: newData })
        this.cache.set("userData", newData)
    }

    // Specific helper methods
    async addVisitedSite(url: string): Promise<void> {
        const userData = await this.getUserData()
        const visitedSites = [...new Set([...userData.visitedSites, url])]

        // Keep only last 100 sites
        if (visitedSites.length > 100) {
            visitedSites.splice(0, visitedSites.length - 100)
        }

        await this.updateUserData({ visitedSites })
    }

    async addBookmark(url: string, title: string): Promise<void> {
        const userData = await this.getUserData()
        const bookmark = { url, title, timestamp: Date.now() }
        const bookmarks = [bookmark, ...userData.bookmarks]

        // Keep only last 50 bookmarks
        if (bookmarks.length > 50) {
            bookmarks.splice(50)
        }

        await this.updateUserData({ bookmarks })
    }

    async incrementUsage(): Promise<void> {
        const userData = await this.getUserData()
        await this.updateUserData({
            statistics: {
                ...userData.statistics,
                extensionUsage: userData.statistics.extensionUsage + 1,
                lastActive: Date.now()
            }
        })
    }

    async incrementPagesAnalyzed(): Promise<void> {
        const userData = await this.getUserData()
        await this.updateUserData({
            statistics: {
                ...userData.statistics,
                pagesAnalyzed: userData.statistics.pagesAnalyzed + 1
            }
        })
    }

    // Storage quota management
    async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
        const usage = await chrome.storage.local.getBytesInUse()
        const quota = chrome.storage.local.QUOTA_BYTES

        return {
            used: usage,
            quota: quota,
            percentage: (usage / quota) * 100
        }
    }

    async clearCache(): void {
        this.cache.clear()
    }

    async exportData(): Promise<string> {
        const settings = await this.getSettings()
        const userData = await this.getUserData()

        return JSON.stringify({
            settings,
            userData,
            exportDate: new Date().toISOString()
        }, null, 2)
    }

    async importData(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData)

            if (data.settings) {
                await chrome.storage.sync.set({ settings: data.settings })
            }

            if (data.userData) {
                await chrome.storage.local.set({ userData: data.userData })
            }

            this.clearCache()
        } catch (error) {
            throw new Error("Invalid import data format")
        }
    }

    // Listen for storage changes
    setupStorageListener(): void {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            // Clear cache for changed items
            Object.keys(changes).forEach(key => {
                this.cache.delete(key)
            })

            // Notify about changes
            chrome.runtime.sendMessage({
                type: "STORAGE_CHANGED",
                changes,
                areaName
            })
        })
    }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance()

// Initialize storage listener when module loads
storageManager.setupStorageListener()

// Example usage:
/*
import { storageManager } from "~storage-manager"

// In your components or background script
const settings = await storageManager.getSettings()
await storageManager.updateSettings({ theme: "dark" })
await storageManager.addVisitedSite(window.location.href)
*/