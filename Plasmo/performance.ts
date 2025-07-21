// Performance optimization utilities for Plasmo extensions

export interface PerformanceMetrics {
    extensionStartTime: number
    popupOpenTime: number
    contentScriptLoadTime: number
    backgroundScriptLoadTime: number
    memoryUsage: number
    storageOperations: number
    messageLatency: number[]
}

export interface PerformanceConfig {
    enableMetrics: boolean
    enableProfiling: boolean
    maxMessageLatencyHistory: number
    memoryThreshold: number // MB
    storageThreshold: number // operations per minute
}

class PerformanceManager {
    private static instance: PerformanceManager
    private metrics: PerformanceMetrics
    private config: PerformanceConfig
    private observers: PerformanceObserver[] = []
    private timers: Map<string, number> = new Map()

    static getInstance(): PerformanceManager {
        if (!PerformanceManager.instance) {
            PerformanceManager.instance = new PerformanceManager()
        }
        return PerformanceManager.instance
    }

    constructor() {
        this.metrics = {
            extensionStartTime: performance.now(),
            popupOpenTime: 0,
            contentScriptLoadTime: 0,
            backgroundScriptLoadTime: 0,
            memoryUsage: 0,
            storageOperations: 0,
            messageLatency: []
        }

        this.config = {
            enableMetrics: true,
            enableProfiling: false,
            maxMessageLatencyHistory: 100,
            memoryThreshold: 50, // 50MB
            storageThreshold: 100 // 100 operations per minute
        }

        this.initialize()
    }

    private initialize(): void {
        if (this.config.enableMetrics) {
            this.setupPerformanceObservers()
            this.startMemoryMonitoring()
            this.setupStorageMonitoring()
        }
    }

    // Performance timing utilities
    startTimer(name: string): void {
        this.timers.set(name, performance.now())
    }

    endTimer(name: string): number {
        const startTime = this.timers.get(name)
        if (!startTime) {
            console.warn(`Timer '${name}' was not started`)
            return 0
        }

        const duration = performance.now() - startTime
        this.timers.delete(name)

        if (this.config.enableProfiling) {
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
        }

        return duration
    }

    // Measure function execution time
    measureFunction<T extends (...args: any[]) => any>(
        fn: T,
        name?: string
    ): T {
        const functionName = name || fn.name || 'anonymous'

        return ((...args: Parameters<T>) => {
            this.startTimer(functionName)
            const result = fn(...args)

            if (result instanceof Promise) {
                return result.finally(() => {
                    this.endTimer(functionName)
                })
            } else {
                this.endTimer(functionName)
                return result
            }
        }) as T
    }

    // Debounce utility for performance
    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout

        return (...args: Parameters<T>) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }

    // Throttle utility for performance
    throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean

        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }

    // Lazy loading utility
    lazy<T>(factory: () => Promise<T>): () => Promise<T> {
        let cached: Promise<T> | null = null

        return () => {
            if (!cached) {
                cached = factory()
            }
            return cached
        }
    }

    // Memory management
    private startMemoryMonitoring(): void {
        if (!('memory' in performance)) return

        const checkMemory = () => {
            const memory = (performance as any).memory
            if (memory) {
                this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB

                if (this.metrics.memoryUsage > this.config.memoryThreshold) {
                    console.warn(`⚠️ High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`)
                    this.triggerGarbageCollection()
                }
            }
        }

        setInterval(checkMemory, 30000) // Check every 30 seconds
    }

    private triggerGarbageCollection(): void {
        // Force garbage collection if available (Chrome DevTools)
        if ('gc' in window) {
            (window as any).gc()
        }

        // Clear caches and unused references
        this.clearCaches()
    }

    private clearCaches(): void {
        // Clear performance observer entries
        this.observers.forEach(observer => {
            try {
                observer.disconnect()
            } catch (error) {
                console.warn('Failed to disconnect performance observer:', error)
            }
        })

        // Clear old message latency data
        if (this.metrics.messageLatency.length > this.config.maxMessageLatencyHistory) {
            this.metrics.messageLatency = this.metrics.messageLatency.slice(-50)
        }
    }

    // Storage operation monitoring
    private setupStorageMonitoring(): void {
        const originalSet = chrome.storage.sync.set
        const originalGet = chrome.storage.sync.get
        const originalRemove = chrome.storage.sync.remove

        chrome.storage.sync.set = (...args) => {
            this.metrics.storageOperations++
            return originalSet.apply(chrome.storage.sync, args)
        }

        chrome.storage.sync.get = (...args) => {
            this.metrics.storageOperations++
            return originalGet.apply(chrome.storage.sync, args)
        }

        chrome.storage.sync.remove = (...args) => {
            this.metrics.storageOperations++
            return originalRemove.apply(chrome.storage.sync, args)
        }
    }

    // Performance observers
    private setupPerformanceObservers(): void {
        try {
            // Measure navigation timing
            const navigationObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        console.log('📊 Navigation timing:', entry)
                    }
                })
            })
            navigationObserver.observe({ entryTypes: ['navigation'] })
            this.observers.push(navigationObserver)

            // Measure resource loading
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.duration > 100) { // Log slow resources
                        console.log(`🐌 Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`)
                    }
                })
            })
            resourceObserver.observe({ entryTypes: ['resource'] })
            this.observers.push(resourceObserver)

            // Measure long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`)
                })
            })
            longTaskObserver.observe({ entryTypes: ['longtask'] })
            this.observers.push(longTaskObserver)

        } catch (error) {
            console.warn('Performance observers not supported:', error)
        }
    }

    // Message performance tracking
    trackMessageLatency(startTime: number): void {
        const latency = performance.now() - startTime
        this.metrics.messageLatency.push(latency)

        if (this.metrics.messageLatency.length > this.config.maxMessageLatencyHistory) {
            this.metrics.messageLatency.shift()
        }
    }

    // Bundle size analysis
    analyzeBundleSize(): void {
        if ('getEntriesByType' in performance) {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
            const extensionResources = resources.filter(resource =>
                resource.name.includes('chrome-extension://')
            )

            let totalSize = 0
            extensionResources.forEach(resource => {
                if (resource.transferSize) {
                    totalSize += resource.transferSize
                }
            })

            console.log(`📦 Extension bundle size: ${(totalSize / 1024).toFixed(2)}KB`)

            // Log largest resources
            const sortedResources = extensionResources
                .filter(r => r.transferSize > 0)
                .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
                .slice(0, 5)

            console.log('📊 Largest resources:')
            sortedResources.forEach(resource => {
                console.log(`  ${resource.name}: ${((resource.transferSize || 0) / 1024).toFixed(2)}KB`)
            })
        }
    }

    // Performance report
    generateReport(): PerformanceMetrics & {
        averageMessageLatency: number
        maxMessageLatency: number
        minMessageLatency: number
    } {
        const latencies = this.metrics.messageLatency
        const averageLatency = latencies.length > 0
            ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
            : 0

        return {
            ...this.metrics,
            averageMessageLatency: averageLatency,
            maxMessageLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
            minMessageLatency: latencies.length > 0 ? Math.min(...latencies) : 0
        }
    }

    // Configuration
    updateConfig(newConfig: Partial<PerformanceConfig>): void {
        this.config = { ...this.config, ...newConfig }
    }

    getConfig(): PerformanceConfig {
        return { ...this.config }
    }

    // Export metrics for analysis
    exportMetrics(): string {
        const report = this.generateReport()
        return JSON.stringify({
            ...report,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            extensionVersion: chrome.runtime.getManifest().version
        }, null, 2)
    }
}

// React hook for performance monitoring
import { useEffect, useState } from "react"

export function usePerformanceMonitoring() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
    const performanceManager = PerformanceManager.getInstance()

    useEffect(() => {
        const updateMetrics = () => {
            setMetrics(performanceManager.generateReport())
        }

        updateMetrics()
        const interval = setInterval(updateMetrics, 5000) // Update every 5 seconds

        return () => clearInterval(interval)
    }, [performanceManager])

    return {
        metrics,
        startTimer: performanceManager.startTimer.bind(performanceManager),
        endTimer: performanceManager.endTimer.bind(performanceManager),
        measureFunction: performanceManager.measureFunction.bind(performanceManager),
        debounce: performanceManager.debounce.bind(performanceManager),
        throttle: performanceManager.throttle.bind(performanceManager),
        exportMetrics: performanceManager.exportMetrics.bind(performanceManager)
    }
}

// Utility functions for common performance patterns
export const performanceUtils = {
    // Efficient DOM queries with caching
    createCachedSelector: (selector: string) => {
        let cached: Element | null = null
        return () => {
            if (!cached || !document.contains(cached)) {
                cached = document.querySelector(selector)
            }
            return cached
        }
    },

    // Batch DOM operations
    batchDOMOperations: (operations: (() => void)[]) => {
        requestAnimationFrame(() => {
            operations.forEach(op => op())
        })
    },

    // Efficient event listener management
    createEventManager: () => {
        const listeners = new Map<string, Set<EventListener>>()

        return {
            add: (element: Element, event: string, listener: EventListener) => {
                const key = `${element.tagName}-${event}`
                if (!listeners.has(key)) {
                    listeners.set(key, new Set())
                    element.addEventListener(event, listener)
                }
                listeners.get(key)!.add(listener)
            },

            remove: (element: Element, event: string, listener: EventListener) => {
                const key = `${element.tagName}-${event}`
                const eventListeners = listeners.get(key)
                if (eventListeners) {
                    eventListeners.delete(listener)
                    if (eventListeners.size === 0) {
                        element.removeEventListener(event, listener)
                        listeners.delete(key)
                    }
                }
            },

            clear: () => {
                listeners.clear()
            }
        }
    }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance()

// Example usage:
/*
import { usePerformanceMonitoring, performanceManager } from "~performance"

function MyComponent() {
  const { metrics, startTimer, endTimer, measureFunction } = usePerformanceMonitoring()
  
  const expensiveOperation = measureFunction(() => {
    // Some expensive operation
    for (let i = 0; i < 1000000; i++) {
      // Do something
    }
  }, 'expensiveOperation')
  
  const handleClick = () => {
    startTimer('user-action')
    expensiveOperation()
    endTimer('user-action')
  }
  
  return (
    <div>
      <button onClick={handleClick}>Perform Operation</button>
      {metrics && (
        <div>
          <p>Memory Usage: {metrics.memoryUsage.toFixed(2)}MB</p>
          <p>Storage Operations: {metrics.storageOperations}</p>
          <p>Average Message Latency: {metrics.averageMessageLatency.toFixed(2)}ms</p>
        </div>
      )}
    </div>
  )
}
*/