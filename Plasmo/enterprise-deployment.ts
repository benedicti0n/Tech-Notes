// Enterprise Deployment and Management System for Plasmo Extensions

export interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production'
    version: string
    buildNumber: string
    deploymentDate: Date
    features: Record<string, boolean>
    apiEndpoints: Record<string, string>
    permissions: string[]
    updateChannel: 'stable' | 'beta' | 'alpha'
    rolloutPercentage: number
}

export interface PolicyConfig {
    allowedDomains: string[]
    blockedDomains: string[]
    dataRetentionDays: number
    enableTelemetry: boolean
    enableAutoUpdate: boolean
    maxStorageSize: number
    requiredPermissions: string[]
    optionalPermissions: string[]
    securityLevel: 'low' | 'medium' | 'high' | 'enterprise'
}

export interface TelemetryEvent {
    id: string
    type: 'usage' | 'error' | 'performance' | 'security' | 'feature'
    timestamp: number
    userId?: string
    sessionId: string
    data: Record<string, any>
    metadata: {
        version: string
        environment: string
        userAgent: string
        locale: string
    }
}

export interface UpdateInfo {
    version: string
    releaseNotes: string
    downloadUrl: string
    mandatory: boolean
    rolloutPercentage: number
    minimumVersion?: string
    deprecatedFeatures: string[]
    newFeatures: string[]
    securityFixes: string[]
}

export interface LicenseInfo {
    type: 'free' | 'pro' | 'enterprise'
    expirationDate?: Date
    maxUsers?: number
    features: string[]
    organizationId?: string
    contactEmail: string
}

class EnterpriseManager {
    private static instance: EnterpriseManager
    private config: DeploymentConfig | null = null
    private policies: PolicyConfig | null = null
    private license: LicenseInfo | null = null
    private telemetryQueue: TelemetryEvent[] = []
    private sessionId: string
    private userId?: string
    private isInitialized = false

    static getInstance(): EnterpriseManager {
        if (!EnterpriseManager.instance) {
            EnterpriseManager.instance = new EnterpriseManager()
        }
        return EnterpriseManager.instance
    }

    constructor() {
        this.sessionId = this.generateSessionId()
        this.initialize()
    }

    private async initialize(): Promise<void> {
        try {
            await this.loadConfiguration()
            await this.loadPolicies()
            await this.loadLicense()
            await this.setupTelemetry()
            await this.checkForUpdates()

            this.isInitialized = true
            console.log('🏢 Enterprise Manager initialized')
        } catch (error) {
            console.error('Failed to initialize Enterprise Manager:', error)
        }
    }

    // Configuration Management
    private async loadConfiguration(): Promise<void> {
        try {
            // Try to load from remote config service first
            const remoteConfig = await this.fetchRemoteConfig()
            if (remoteConfig) {
                this.config = remoteConfig
                await this.saveLocalConfig(remoteConfig)
                return
            }

            // Fallback to local storage
            const result = await chrome.storage.sync.get('enterpriseConfig')
            if (result.enterpriseConfig) {
                this.config = result.enterpriseConfig
            } else {
                // Default configuration
                this.config = {
                    environment: 'production',
                    version: chrome.runtime.getManifest().version,
                    buildNumber: '1',
                    deploymentDate: new Date(),
                    features: {},
                    apiEndpoints: {},
                    permissions: [],
                    updateChannel: 'stable',
                    rolloutPercentage: 100
                }
            }
        } catch (error) {
            console.error('Failed to load configuration:', error)
        }
    }

    private async fetchRemoteConfig(): Promise<DeploymentConfig | null> {
        try {
            const configUrl = this.getConfigUrl()
            if (!configUrl) return null

            const response = await fetch(configUrl, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                    'X-Extension-Version': chrome.runtime.getManifest().version,
                    'X-Organization-ID': await this.getOrganizationId()
                }
            })

            if (!response.ok) {
                throw new Error(`Config fetch failed: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.warn('Failed to fetch remote config:', error)
            return null
        }
    }

    private async saveLocalConfig(config: DeploymentConfig): Promise<void> {
        try {
            await chrome.storage.sync.set({ enterpriseConfig: config })
        } catch (error) {
            console.error('Failed to save local config:', error)
        }
    }

    // Policy Management
    private async loadPolicies(): Promise<void> {
        try {
            // Check for managed policies (enterprise deployment)
            if (chrome.storage.managed) {
                const managedPolicies = await chrome.storage.managed.get(null)
                if (Object.keys(managedPolicies).length > 0) {
                    this.policies = this.parseManagedPolicies(managedPolicies)
                    console.log('📋 Loaded managed policies')
                    return
                }
            }

            // Fallback to default policies
            this.policies = {
                allowedDomains: ['*'],
                blockedDomains: [],
                dataRetentionDays: 30,
                enableTelemetry: true,
                enableAutoUpdate: true,
                maxStorageSize: 10 * 1024 * 1024, // 10MB
                requiredPermissions: ['storage'],
                optionalPermissions: ['tabs', 'activeTab'],
                securityLevel: 'medium'
            }
        } catch (error) {
            console.error('Failed to load policies:', error)
        }
    }

    private parseManagedPolicies(managedPolicies: any): PolicyConfig {
        return {
            allowedDomains: managedPolicies.allowedDomains || ['*'],
            blockedDomains: managedPolicies.blockedDomains || [],
            dataRetentionDays: managedPolicies.dataRetentionDays || 30,
            enableTelemetry: managedPolicies.enableTelemetry !== false,
            enableAutoUpdate: managedPolicies.enableAutoUpdate !== false,
            maxStorageSize: managedPolicies.maxStorageSize || 10 * 1024 * 1024,
            requiredPermissions: managedPolicies.requiredPermissions || ['storage'],
            optionalPermissions: managedPolicies.optionalPermissions || [],
            securityLevel: managedPolicies.securityLevel || 'medium'
        }
    }

    // License Management
    private async loadLicense(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get('licenseInfo')
            if (result.licenseInfo) {
                this.license = result.licenseInfo

                // Validate license
                if (this.license.expirationDate && new Date() > new Date(this.license.expirationDate)) {
                    console.warn('⚠️ License has expired')
                    this.handleExpiredLicense()
                }
            } else {
                // Default free license
                this.license = {
                    type: 'free',
                    features: ['basic'],
                    contactEmail: 'support@example.com'
                }
            }
        } catch (error) {
            console.error('Failed to load license:', error)
        }
    }

    private handleExpiredLicense(): void {
        // Disable premium features
        if (this.config) {
            this.config.features = Object.fromEntries(
                Object.entries(this.config.features).map(([key, value]) => [
                    key,
                    key.startsWith('premium_') ? false : value
                ])
            )
        }

        // Show expiration notice
        this.showLicenseExpirationNotice()
    }

    private showLicenseExpirationNotice(): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon48.png',
            title: 'License Expired',
            message: 'Your license has expired. Some features may be disabled.',
            buttons: [
                { title: 'Renew License' },
                { title: 'Contact Support' }
            ]
        })
    }

    // Telemetry System
    private async setupTelemetry(): Promise<void> {
        if (!this.policies?.enableTelemetry) {
            console.log('📊 Telemetry disabled by policy')
            return
        }

        // Set up periodic telemetry sending
        setInterval(() => {
            this.sendTelemetryBatch()
        }, 60000) // Send every minute

        // Set up beforeunload handler
        window.addEventListener('beforeunload', () => {
            this.sendTelemetryBatch()
        })

        console.log('📊 Telemetry system initialized')
    }

    trackEvent(
        type: TelemetryEvent['type'],
        data: Record<string, any>,
        userId?: string
    ): void {
        if (!this.policies?.enableTelemetry) return

        const event: TelemetryEvent = {
            id: this.generateEventId(),
            type,
            timestamp: Date.now(),
            userId: userId || this.userId,
            sessionId: this.sessionId,
            data,
            metadata: {
                version: this.config?.version || '0.0.0',
                environment: this.config?.environment || 'unknown',
                userAgent: navigator.userAgent,
                locale: navigator.language
            }
        }

        this.telemetryQueue.push(event)

        // Send immediately for critical events
        if (type === 'error' || type === 'security') {
            this.sendTelemetryBatch()
        }
    }

    private async sendTelemetryBatch(): Promise<void> {
        if (this.telemetryQueue.length === 0) return

        try {
            const telemetryUrl = this.getTelemetryUrl()
            if (!telemetryUrl) return

            const batch = [...this.telemetryQueue]
            this.telemetryQueue = []

            const response = await fetch(telemetryUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                    'X-Organization-ID': await this.getOrganizationId()
                },
                body: JSON.stringify({ events: batch })
            })

            if (!response.ok) {
                // Re-queue events on failure
                this.telemetryQueue.unshift(...batch)
                throw new Error(`Telemetry send failed: ${response.status}`)
            }

            console.log(`📊 Sent ${batch.length} telemetry events`)
        } catch (error) {
            console.error('Failed to send telemetry:', error)
        }
    }

    // Update Management
    private async checkForUpdates(): Promise<void> {
        if (!this.policies?.enableAutoUpdate) {
            console.log('🔄 Auto-update disabled by policy')
            return
        }

        try {
            const updateInfo = await this.fetchUpdateInfo()
            if (updateInfo && this.shouldUpdate(updateInfo)) {
                await this.handleUpdate(updateInfo)
            }
        } catch (error) {
            console.error('Failed to check for updates:', error)
        }
    }

    private async fetchUpdateInfo(): Promise<UpdateInfo | null> {
        try {
            const updateUrl = this.getUpdateUrl()
            if (!updateUrl) return null

            const response = await fetch(updateUrl, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                    'X-Current-Version': chrome.runtime.getManifest().version,
                    'X-Update-Channel': this.config?.updateChannel || 'stable'
                }
            })

            if (!response.ok) return null

            return await response.json()
        } catch (error) {
            console.warn('Failed to fetch update info:', error)
            return null
        }
    }

    private shouldUpdate(updateInfo: UpdateInfo): boolean {
        const currentVersion = chrome.runtime.getManifest().version

        // Check if version is newer
        if (!this.isNewerVersion(updateInfo.version, currentVersion)) {
            return false
        }

        // Check rollout percentage
        const rolloutHash = this.hashString(this.sessionId + updateInfo.version)
        const rolloutValue = rolloutHash % 100

        return rolloutValue < updateInfo.rolloutPercentage
    }

    private async handleUpdate(updateInfo: UpdateInfo): Promise<void> {
        if (updateInfo.mandatory) {
            // Force update
            this.showMandatoryUpdateNotice(updateInfo)
        } else {
            // Optional update
            this.showOptionalUpdateNotice(updateInfo)
        }
    }

    private showMandatoryUpdateNotice(updateInfo: UpdateInfo): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon48.png',
            title: 'Mandatory Update Available',
            message: `Version ${updateInfo.version} is required. The extension will update automatically.`,
            requireInteraction: true
        })

        // Trigger update process
        this.triggerUpdate(updateInfo)
    }

    private showOptionalUpdateNotice(updateInfo: UpdateInfo): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon48.png',
            title: 'Update Available',
            message: `Version ${updateInfo.version} is available with new features and improvements.`,
            buttons: [
                { title: 'Update Now' },
                { title: 'Later' }
            ]
        })
    }

    private async triggerUpdate(updateInfo: UpdateInfo): Promise<void> {
        try {
            // In a real implementation, this would trigger the browser's
            // extension update mechanism or download the new version
            console.log('🔄 Triggering update to version:', updateInfo.version)

            // Track update event
            this.trackEvent('usage', {
                action: 'update_triggered',
                fromVersion: chrome.runtime.getManifest().version,
                toVersion: updateInfo.version,
                mandatory: updateInfo.mandatory
            })
        } catch (error) {
            console.error('Failed to trigger update:', error)
        }
    }

    // Feature Flag Management
    isFeatureEnabled(featureName: string): boolean {
        if (!this.config) return false

        // Check license restrictions
        if (this.license && !this.license.features.includes(featureName)) {
            return false
        }

        return this.config.features[featureName] === true
    }

    getApiEndpoint(name: string): string | null {
        return this.config?.apiEndpoints[name] || null
    }

    // Compliance and Audit
    async generateComplianceReport(): Promise<{
        policies: PolicyConfig
        license: LicenseInfo
        permissions: string[]
        dataRetention: {
            currentSize: number
            maxSize: number
            retentionDays: number
        }
        security: {
            level: string
            violations: number
            lastAudit: Date
        }
    }> {
        const storageUsage = await chrome.storage.local.getBytesInUse()

        return {
            policies: this.policies!,
            license: this.license!,
            permissions: chrome.runtime.getManifest().permissions || [],
            dataRetention: {
                currentSize: storageUsage,
                maxSize: this.policies?.maxStorageSize || 0,
                retentionDays: this.policies?.dataRetentionDays || 0
            },
            security: {
                level: this.policies?.securityLevel || 'unknown',
                violations: 0, // Would be tracked in real implementation
                lastAudit: new Date()
            }
        }
    }

    // Utility Methods
    private generateSessionId(): string {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    }

    private generateEventId(): string {
        return 'event_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    }

    private hashString(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
    }

    private isNewerVersion(newVersion: string, currentVersion: string): boolean {
        const newParts = newVersion.split('.').map(Number)
        const currentParts = currentVersion.split('.').map(Number)

        for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
            const newPart = newParts[i] || 0
            const currentPart = currentParts[i] || 0

            if (newPart > currentPart) return true
            if (newPart < currentPart) return false
        }

        return false
    }

    private getConfigUrl(): string | null {
        return process.env.PLASMO_PUBLIC_CONFIG_URL || null
    }

    private getTelemetryUrl(): string | null {
        return process.env.PLASMO_PUBLIC_TELEMETRY_URL || null
    }

    private getUpdateUrl(): string | null {
        return process.env.PLASMO_PUBLIC_UPDATE_URL || null
    }

    private async getAuthToken(): Promise<string> {
        const result = await chrome.storage.sync.get('authToken')
        return result.authToken || ''
    }

    private async getOrganizationId(): Promise<string> {
        return this.license?.organizationId || ''
    }

    // Public API
    getConfig(): DeploymentConfig | null {
        return this.config
    }

    getPolicies(): PolicyConfig | null {
        return this.policies
    }

    getLicense(): LicenseInfo | null {
        return this.license
    }

    isInitialized(): boolean {
        return this.isInitialized
    }

    setUserId(userId: string): void {
        this.userId = userId
    }
}

// React hook for enterprise features
import { useEffect, useState } from "react"

export function useEnterprise() {
    const [isInitialized, setIsInitialized] = useState(false)
    const [config, setConfig] = useState<DeploymentConfig | null>(null)
    const [policies, setPolicies] = useState<PolicyConfig | null>(null)
    const [license, setLicense] = useState<LicenseInfo | null>(null)
    const enterprise = EnterpriseManager.getInstance()

    useEffect(() => {
        const checkInitialization = () => {
            if (enterprise.isInitialized()) {
                setIsInitialized(true)
                setConfig(enterprise.getConfig())
                setPolicies(enterprise.getPolicies())
                setLicense(enterprise.getLicense())
            } else {
                setTimeout(checkInitialization, 100)
            }
        }

        checkInitialization()
    }, [enterprise])

    return {
        isInitialized,
        config,
        policies,
        license,
        isFeatureEnabled: enterprise.isFeatureEnabled.bind(enterprise),
        getApiEndpoint: enterprise.getApiEndpoint.bind(enterprise),
        trackEvent: enterprise.trackEvent.bind(enterprise),
        generateComplianceReport: enterprise.generateComplianceReport.bind(enterprise),
        setUserId: enterprise.setUserId.bind(enterprise)
    }
}

// Export singleton instance
export const enterpriseManager = EnterpriseManager.getInstance()

// Example usage:
/*
import { useEnterprise } from "~enterprise-deployment"

function EnterpriseComponent() {
  const {
    isInitialized,
    config,
    policies,
    license,
    isFeatureEnabled,
    trackEvent
  } = useEnterprise()
  
  useEffect(() => {
    if (isInitialized) {
      trackEvent('usage', { action: 'component_loaded' })
    }
  }, [isInitialized])
  
  if (!isInitialized) {
    return <div>Loading enterprise configuration...</div>
  }
  
  return (
    <div>
      <h2>Enterprise Dashboard</h2>
      <div>Environment: {config?.environment}</div>
      <div>Version: {config?.version}</div>
      <div>License: {license?.type}</div>
      <div>Security Level: {policies?.securityLevel}</div>
      
      {isFeatureEnabled('premium_analytics') && (
        <div>Premium Analytics Available</div>
      )}
    </div>
  )
}
*/