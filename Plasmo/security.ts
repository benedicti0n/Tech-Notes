// Security utilities and best practices for Plasmo extensions

export interface SecurityConfig {
    enableCSPValidation: boolean
    enableInputSanitization: boolean
    enableXSSProtection: boolean
    enableClickjackingProtection: boolean
    trustedDomains: string[]
    maxInputLength: number
    allowedFileTypes: string[]
}

export interface SecurityViolation {
    type: 'xss' | 'injection' | 'csp' | 'domain' | 'file' | 'input'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: number
    context?: any
}

class SecurityManager {
    private static instance: SecurityManager
    private config: SecurityConfig
    private violations: SecurityViolation[] = []
    private trustedOrigins: Set<string> = new Set()

    static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager()
        }
        return SecurityManager.instance
    }

    constructor() {
        this.config = {
            enableCSPValidation: true,
            enableInputSanitization: true,
            enableXSSProtection: true,
            enableClickjackingProtection: true,
            trustedDomains: ['https://api.example.com', 'https://cdn.example.com'],
            maxInputLength: 10000,
            allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/json']
        }

        this.initialize()
    }

    private initialize(): void {
        this.setupTrustedOrigins()
        this.setupCSPMonitoring()
        this.setupMessageValidation()
    }

    private setupTrustedOrigins(): void {
        this.config.trustedDomains.forEach(domain => {
            this.trustedOrigins.add(domain)
        })

        // Add extension origin
        this.trustedOrigins.add(`chrome-extension://${chrome.runtime.id}`)
    }

    // Input sanitization
    sanitizeInput(input: string, options: {
        allowHTML?: boolean
        maxLength?: number
        allowedTags?: string[]
    } = {}): string {
        if (!this.config.enableInputSanitization) {
            return input
        }

        const {
            allowHTML = false,
            maxLength = this.config.maxInputLength,
            allowedTags = ['b', 'i', 'em', 'strong']
        } = options

        // Trim and limit length
        let sanitized = input.trim().slice(0, maxLength)

        if (!allowHTML) {
            // Escape HTML entities
            sanitized = this.escapeHTML(sanitized)
        } else {
            // Allow only specific tags
            sanitized = this.sanitizeHTML(sanitized, allowedTags)
        }

        // Remove potentially dangerous patterns
        sanitized = this.removeDangerousPatterns(sanitized)

        return sanitized
    }

    private escapeHTML(text: string): string {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    private sanitizeHTML(html: string, allowedTags: string[]): string {
        const div = document.createElement('div')
        div.innerHTML = html

        // Remove all script tags and event handlers
        const scripts = div.querySelectorAll('script')
        scripts.forEach(script => script.remove())

        // Remove dangerous attributes
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
        const allElements = div.querySelectorAll('*')

        allElements.forEach(element => {
            // Remove dangerous attributes
            dangerousAttrs.forEach(attr => {
                element.removeAttribute(attr)
            })

            // Remove elements not in allowed tags
            if (!allowedTags.includes(element.tagName.toLowerCase())) {
                element.replaceWith(...Array.from(element.childNodes))
            }
        })

        return div.innerHTML
    }

    private removeDangerousPatterns(input: string): string {
        // Remove javascript: URLs
        input = input.replace(/javascript:/gi, '')

        // Remove data: URLs (except safe ones)
        input = input.replace(/data:(?!image\/[png|jpg|jpeg|gif|svg])/gi, '')

        // Remove vbscript: URLs
        input = input.replace(/vbscript:/gi, '')

        // Remove on* event handlers in text
        input = input.replace(/on\w+\s*=/gi, '')

        return input
    }

    // XSS Protection
    validateURL(url: string): boolean {
        try {
            const urlObj = new URL(url)

            // Check protocol
            if (!['http:', 'https:', 'chrome-extension:'].includes(urlObj.protocol)) {
                this.reportViolation({
                    type: 'xss',
                    severity: 'high',
                    message: `Blocked dangerous URL protocol: ${urlObj.protocol}`,
                    context: { url }
                })
                return false
            }

            // Check for dangerous schemes
            const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:']
            if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
                this.reportViolation({
                    type: 'xss',
                    severity: 'critical',
                    message: `Blocked dangerous URL scheme in: ${url}`,
                    context: { url }
                })
                return false
            }

            return true
        } catch (error) {
            this.reportViolation({
                type: 'xss',
                severity: 'medium',
                message: `Invalid URL format: ${url}`,
                context: { url, error: error.message }
            })
            return false
        }
    }

    // Content Security Policy validation
    private setupCSPMonitoring(): void {
        if (!this.config.enableCSPValidation) return

        // Listen for CSP violations
        document.addEventListener('securitypolicyviolation', (event) => {
            this.reportViolation({
                type: 'csp',
                severity: 'high',
                message: `CSP violation: ${event.violatedDirective}`,
                context: {
                    blockedURI: event.blockedURI,
                    documentURI: event.documentURI,
                    originalPolicy: event.originalPolicy,
                    violatedDirective: event.violatedDirective
                }
            })
        })
    }

    // Message validation for cross-context communication
    private setupMessageValidation(): void {
        const originalSendMessage = chrome.runtime.sendMessage

        chrome.runtime.sendMessage = (message: any, ...args: any[]) => {
            if (!this.validateMessage(message)) {
                throw new Error('Message failed security validation')
            }
            return originalSendMessage.call(chrome.runtime, message, ...args)
        }
    }

    validateMessage(message: any): boolean {
        if (!message || typeof message !== 'object') {
            return false
        }

        // Check for dangerous properties
        const dangerousProps = ['__proto__', 'constructor', 'prototype']
        if (this.containsDangerousProperties(message, dangerousProps)) {
            this.reportViolation({
                type: 'injection',
                severity: 'critical',
                message: 'Message contains dangerous properties',
                context: { message }
            })
            return false
        }

        // Validate string properties
        if (typeof message === 'object') {
            for (const [key, value] of Object.entries(message)) {
                if (typeof value === 'string') {
                    if (!this.validateStringContent(value)) {
                        this.reportViolation({
                            type: 'xss',
                            severity: 'high',
                            message: `Dangerous content in message property: ${key}`,
                            context: { key, value }
                        })
                        return false
                    }
                }
            }
        }

        return true
    }

    private containsDangerousProperties(obj: any, dangerousProps: string[]): boolean {
        if (typeof obj !== 'object' || obj === null) return false

        for (const prop of dangerousProps) {
            if (prop in obj) return true
        }

        for (const value of Object.values(obj)) {
            if (typeof value === 'object' && this.containsDangerousProperties(value, dangerousProps)) {
                return true
            }
        }

        return false
    }

    private validateStringContent(content: string): boolean {
        // Check for script tags
        if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
            return false
        }

        // Check for javascript: URLs
        if (/javascript:/gi.test(content)) {
            return false
        }

        // Check for on* event handlers
        if (/on\w+\s*=/gi.test(content)) {
            return false
        }

        return true
    }

    // File validation
    validateFile(file: File): boolean {
        // Check file type
        if (!this.config.allowedFileTypes.includes(file.type)) {
            this.reportViolation({
                type: 'file',
                severity: 'medium',
                message: `Blocked file with disallowed type: ${file.type}`,
                context: { fileName: file.name, fileType: file.type, fileSize: file.size }
            })
            return false
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            this.reportViolation({
                type: 'file',
                severity: 'medium',
                message: `File too large: ${file.size} bytes`,
                context: { fileName: file.name, fileSize: file.size }
            })
            return false
        }

        // Check file name for dangerous patterns
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
        const fileName = file.name.toLowerCase()

        if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
            this.reportViolation({
                type: 'file',
                severity: 'high',
                message: `Blocked file with dangerous extension: ${file.name}`,
                context: { fileName: file.name }
            })
            return false
        }

        return true
    }

    // Origin validation
    validateOrigin(origin: string): boolean {
        try {
            const url = new URL(origin)

            // Check if origin is in trusted domains
            if (this.trustedOrigins.has(origin)) {
                return true
            }

            // Check if domain is in trusted domains
            const trustedDomain = Array.from(this.trustedOrigins).find(trusted => {
                try {
                    const trustedUrl = new URL(trusted)
                    return trustedUrl.hostname === url.hostname
                } catch {
                    return false
                }
            })

            if (!trustedDomain) {
                this.reportViolation({
                    type: 'domain',
                    severity: 'medium',
                    message: `Untrusted origin: ${origin}`,
                    context: { origin }
                })
                return false
            }

            return true
        } catch (error) {
            this.reportViolation({
                type: 'domain',
                severity: 'medium',
                message: `Invalid origin format: ${origin}`,
                context: { origin, error: error.message }
            })
            return false
        }
    }

    // Secure storage operations
    async secureStorageSet(key: string, value: any): Promise<void> {
        // Validate key
        if (!this.validateStorageKey(key)) {
            throw new Error('Invalid storage key')
        }

        // Sanitize value if it's a string
        if (typeof value === 'string') {
            value = this.sanitizeInput(value)
        }

        // Validate object structure
        if (typeof value === 'object' && !this.validateMessage(value)) {
            throw new Error('Storage value failed security validation')
        }

        try {
            await chrome.storage.sync.set({ [key]: value })
        } catch (error) {
            this.reportViolation({
                type: 'input',
                severity: 'medium',
                message: `Storage operation failed: ${error.message}`,
                context: { key, error: error.message }
            })
            throw error
        }
    }

    async secureStorageGet(key: string): Promise<any> {
        if (!this.validateStorageKey(key)) {
            throw new Error('Invalid storage key')
        }

        try {
            const result = await chrome.storage.sync.get(key)
            return result[key]
        } catch (error) {
            this.reportViolation({
                type: 'input',
                severity: 'low',
                message: `Storage retrieval failed: ${error.message}`,
                context: { key, error: error.message }
            })
            throw error
        }
    }

    private validateStorageKey(key: string): boolean {
        // Check key length
        if (key.length > 100) {
            return false
        }

        // Check for dangerous characters
        const dangerousChars = /[<>'"&\x00-\x1f\x7f-\x9f]/
        if (dangerousChars.test(key)) {
            return false
        }

        return true
    }

    // Security violation reporting
    private reportViolation(violation: Omit<SecurityViolation, 'timestamp'>): void {
        const fullViolation: SecurityViolation = {
            ...violation,
            timestamp: Date.now()
        }

        this.violations.push(fullViolation)

        // Keep only last 100 violations
        if (this.violations.length > 100) {
            this.violations = this.violations.slice(-100)
        }

        // Log critical violations
        if (violation.severity === 'critical') {
            console.error('🚨 Critical security violation:', violation)
        } else if (violation.severity === 'high') {
            console.warn('⚠️ High security violation:', violation)
        }

        // Send to background script for logging
        chrome.runtime.sendMessage({
            type: 'SECURITY_VIOLATION',
            violation: fullViolation
        }).catch(() => {
            // Ignore errors if background script is not available
        })
    }

    // Get security report
    getSecurityReport(): {
        violations: SecurityViolation[]
        summary: Record<string, number>
        config: SecurityConfig
    } {
        const summary: Record<string, number> = {}

        this.violations.forEach(violation => {
            const key = `${violation.type}_${violation.severity}`
            summary[key] = (summary[key] || 0) + 1
        })

        return {
            violations: [...this.violations],
            summary,
            config: { ...this.config }
        }
    }

    // Configuration
    updateConfig(newConfig: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...newConfig }

        if (newConfig.trustedDomains) {
            this.setupTrustedOrigins()
        }
    }

    // Clear violations
    clearViolations(): void {
        this.violations = []
    }
}

// React hook for security monitoring
import { useEffect, useState } from "react"

export function useSecurityMonitoring() {
    const [violations, setViolations] = useState<SecurityViolation[]>([])
    const securityManager = SecurityManager.getInstance()

    useEffect(() => {
        const updateViolations = () => {
            const report = securityManager.getSecurityReport()
            setViolations(report.violations)
        }

        updateViolations()

        // Listen for new violations
        const handleMessage = (message: any) => {
            if (message.type === 'SECURITY_VIOLATION') {
                updateViolations()
            }
        }

        chrome.runtime.onMessage.addListener(handleMessage)

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage)
        }
    }, [securityManager])

    return {
        violations,
        sanitizeInput: securityManager.sanitizeInput.bind(securityManager),
        validateURL: securityManager.validateURL.bind(securityManager),
        validateFile: securityManager.validateFile.bind(securityManager),
        validateOrigin: securityManager.validateOrigin.bind(securityManager),
        secureStorageSet: securityManager.secureStorageSet.bind(securityManager),
        secureStorageGet: securityManager.secureStorageGet.bind(securityManager),
        getSecurityReport: securityManager.getSecurityReport.bind(securityManager),
        clearViolations: securityManager.clearViolations.bind(securityManager)
    }
}

// Utility functions
export const securityUtils = {
    // Generate secure random strings
    generateSecureToken: (length: number = 32): string => {
        const array = new Uint8Array(length)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    },

    // Hash sensitive data
    hashData: async (data: string): Promise<string> => {
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(data)
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    },

    // Constant-time string comparison
    constantTimeCompare: (a: string, b: string): boolean => {
        if (a.length !== b.length) return false

        let result = 0
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i)
        }

        return result === 0
    }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance()

// Example usage:
/*
import { useSecurityMonitoring, securityUtils } from "~security"

function MyComponent() {
  const { sanitizeInput, validateURL, violations } = useSecurityMonitoring()
  const [userInput, setUserInput] = useState("")
  
  const handleSubmit = async () => {
    // Sanitize user input
    const cleanInput = sanitizeInput(userInput, { maxLength: 1000 })
    
    // Generate secure token
    const token = securityUtils.generateSecureToken()
    
    // Hash sensitive data
    const hashedData = await securityUtils.hashData(cleanInput)
    
    console.log("Processed securely:", { cleanInput, token, hashedData })
  }
  
  return (
    <div>
      <input 
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter text..."
      />
      <button onClick={handleSubmit}>Submit Securely</button>
      
      {violations.length > 0 && (
        <div>
          <h3>Security Violations: {violations.length}</h3>
          {violations.slice(-5).map((violation, index) => (
            <div key={index} className={`violation ${violation.severity}`}>
              {violation.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
*/