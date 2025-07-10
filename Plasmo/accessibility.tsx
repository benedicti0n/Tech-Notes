// Web Accessibility (a11y) utilities and components for Plasmo extensions
import { useEffect, useRef, useState } from "react"

import "./accessibility.css"

// Accessibility utilities
export class AccessibilityManager {
    private static instance: AccessibilityManager
    private announcements: HTMLElement | null = null

    static getInstance(): AccessibilityManager {
        if (!AccessibilityManager.instance) {
            AccessibilityManager.instance = new AccessibilityManager()
        }
        return AccessibilityManager.instance
    }

    // Initialize screen reader announcements
    initializeAnnouncements(): void {
        if (this.announcements) return

        this.announcements = document.createElement("div")
        this.announcements.setAttribute("aria-live", "polite")
        this.announcements.setAttribute("aria-atomic", "true")
        this.announcements.className = "sr-only"
        this.announcements.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
        document.body.appendChild(this.announcements)
    }

    // Announce message to screen readers
    announce(message: string, priority: "polite" | "assertive" = "polite"): void {
        if (!this.announcements) {
            this.initializeAnnouncements()
        }

        if (this.announcements) {
            this.announcements.setAttribute("aria-live", priority)
            this.announcements.textContent = message

            // Clear after announcement
            setTimeout(() => {
                if (this.announcements) {
                    this.announcements.textContent = ""
                }
            }, 1000)
        }
    }

    // Check if user prefers reduced motion
    prefersReducedMotion(): boolean {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }

    // Check if user prefers high contrast
    prefersHighContrast(): boolean {
        return window.matchMedia("(prefers-contrast: high)").matches
    }

    // Focus management
    trapFocus(container: HTMLElement): () => void {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus()
                    e.preventDefault()
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus()
                    e.preventDefault()
                }
            }
        }

        container.addEventListener("keydown", handleTabKey)
        firstElement?.focus()

        return () => {
            container.removeEventListener("keydown", handleTabKey)
        }
    }

    // Keyboard navigation helper
    handleArrowNavigation(
        e: KeyboardEvent,
        items: HTMLElement[],
        currentIndex: number,
        onIndexChange: (index: number) => void
    ): void {
        let newIndex = currentIndex

        switch (e.key) {
            case "ArrowDown":
            case "ArrowRight":
                newIndex = (currentIndex + 1) % items.length
                e.preventDefault()
                break
            case "ArrowUp":
            case "ArrowLeft":
                newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
                e.preventDefault()
                break
            case "Home":
                newIndex = 0
                e.preventDefault()
                break
            case "End":
                newIndex = items.length - 1
                e.preventDefault()
                break
        }

        if (newIndex !== currentIndex) {
            onIndexChange(newIndex)
            items[newIndex]?.focus()
        }
    }
}

// Accessible Button Component
interface AccessibleButtonProps {
    children: React.ReactNode
    onClick: () => void
    variant?: "primary" | "secondary" | "danger"
    size?: "small" | "medium" | "large"
    disabled?: boolean
    loading?: boolean
    ariaLabel?: string
    ariaDescribedBy?: string
    className?: string
}

export function AccessibleButton({
    children,
    onClick,
    variant = "primary",
    size = "medium",
    disabled = false,
    loading = false,
    ariaLabel,
    ariaDescribedBy,
    className = ""
}: AccessibleButtonProps) {
    const a11y = AccessibilityManager.getInstance()

    const handleClick = () => {
        if (!disabled && !loading) {
            onClick()
            a11y.announce("Button activated")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
        }
    }

    return (
        <button
            className={`accessible-button ${variant} ${size} ${className}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-busy={loading}
            type="button"
        >
            {loading && (
                <span className="loading-spinner" aria-hidden="true">
                    ⟳
                </span>
            )}
            <span className={loading ? "loading-text" : ""}>{children}</span>
        </button>
    )
}

// Accessible Modal Component
interface AccessibleModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    className?: string
}

export function AccessibleModal({
    isOpen,
    onClose,
    title,
    children,
    className = ""
}: AccessibleModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const a11y = AccessibilityManager.getInstance()

    useEffect(() => {
        if (isOpen) {
            a11y.announce(`Modal opened: ${title}`)

            const cleanup = modalRef.current ? a11y.trapFocus(modalRef.current) : () => { }

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    onClose()
                }
            }

            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"

            return () => {
                cleanup()
                document.removeEventListener("keydown", handleEscape)
                document.body.style.overflow = ""
                a11y.announce("Modal closed")
            }
        }
    }, [isOpen, title, onClose, a11y])

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={modalRef}
                className={`accessible-modal ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <header className="modal-header">
                    <h2 id="modal-title">{title}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </header>
                <div className="modal-content">{children}</div>
            </div>
        </div>
    )
}

// Accessible Form Input Component
interface AccessibleInputProps {
    label: string
    type?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    error?: string
    helpText?: string
    disabled?: boolean
    className?: string
}

export function AccessibleInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    error,
    helpText,
    disabled = false,
    className = ""
}: AccessibleInputProps) {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helpId = helpText ? `${inputId}-help` : undefined

    return (
        <div className={`accessible-input-group ${className}`}>
            <label htmlFor={inputId} className="input-label">
                {label}
                {required && <span className="required-indicator" aria-label="required">*</span>}
            </label>

            <input
                id={inputId}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`accessible-input ${error ? "error" : ""}`}
                aria-describedby={[errorId, helpId].filter(Boolean).join(" ") || undefined}
                aria-invalid={error ? "true" : "false"}
            />

            {helpText && (
                <div id={helpId} className="input-help">
                    {helpText}
                </div>
            )}

            {error && (
                <div id={errorId} className="input-error" role="alert">
                    {error}
                </div>
            )}
        </div>
    )
}

// Accessible Dropdown/Select Component
interface AccessibleSelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    required?: boolean
    error?: string
    disabled?: boolean
    className?: string
}

export function AccessibleSelect({
    label,
    value,
    onChange,
    options,
    required = false,
    error,
    disabled = false,
    className = ""
}: AccessibleSelectProps) {
    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${selectId}-error` : undefined

    return (
        <div className={`accessible-select-group ${className}`}>
            <label htmlFor={selectId} className="select-label">
                {label}
                {required && <span className="required-indicator" aria-label="required">*</span>}
            </label>

            <select
                id={selectId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled}
                className={`accessible-select ${error ? "error" : ""}`}
                aria-describedby={errorId}
                aria-invalid={error ? "true" : "false"}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <div id={errorId} className="select-error" role="alert">
                    {error}
                </div>
            )}
        </div>
    )
}

// Accessible Tab Component
interface Tab {
    id: string
    label: string
    content: React.ReactNode
}

interface AccessibleTabsProps {
    tabs: Tab[]
    activeTab: string
    onTabChange: (tabId: string) => void
    className?: string
}

export function AccessibleTabs({
    tabs,
    activeTab,
    onTabChange,
    className = ""
}: AccessibleTabsProps) {
    const [focusedTab, setFocusedTab] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const a11y = AccessibilityManager.getInstance()

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        const tabElements = tabRefs.current.filter(Boolean) as HTMLButtonElement[]

        a11y.handleArrowNavigation(e.nativeEvent, tabElements, index, (newIndex) => {
            setFocusedTab(newIndex)
            onTabChange(tabs[newIndex].id)
        })
    }

    return (
        <div className={`accessible-tabs ${className}`}>
            <div className="tab-list" role="tablist">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        ref={(el) => (tabRefs.current[index] = el)}
                        className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`tab-panel ${activeTab === tab.id ? "active" : ""}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${tab.id}`}
                    id={`panel-${tab.id}`}
                    hidden={activeTab !== tab.id}
                >
                    {tab.content}
                </div>
            ))}
        </div>
    )
}

// Hook for managing focus
export function useFocusManagement() {
    const previousFocus = useRef<HTMLElement | null>(null)

    const saveFocus = () => {
        previousFocus.current = document.activeElement as HTMLElement
    }

    const restoreFocus = () => {
        if (previousFocus.current) {
            previousFocus.current.focus()
        }
    }

    const focusElement = (selector: string) => {
        const element = document.querySelector(selector) as HTMLElement
        if (element) {
            element.focus()
        }
    }

    return { saveFocus, restoreFocus, focusElement }
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = [
                e.ctrlKey && "ctrl",
                e.altKey && "alt",
                e.shiftKey && "shift",
                e.metaKey && "meta",
                e.key.toLowerCase()
            ].filter(Boolean).join("+")

            if (shortcuts[key]) {
                e.preventDefault()
                shortcuts[key]()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [shortcuts])
}

// Example usage component
export function AccessibilityDemo() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [selectValue, setSelectValue] = useState("option1")
    const [activeTab, setActiveTab] = useState("tab1")
    const a11y = AccessibilityManager.getInstance()

    useKeyboardShortcuts({
        "ctrl+m": () => setIsModalOpen(true),
        "escape": () => setIsModalOpen(false)
    })

    const tabs = [
        { id: "tab1", label: "General", content: <div>General settings content</div> },
        { id: "tab2", label: "Advanced", content: <div>Advanced settings content</div> },
        { id: "tab3", label: "About", content: <div>About information</div> }
    ]

    return (
        <div className="accessibility-demo">
            <h1>Accessibility Demo</h1>

            <AccessibleButton
                onClick={() => a11y.announce("Hello from accessible button!")}
                ariaLabel="Announce greeting message"
            >
                Announce Message
            </AccessibleButton>

            <AccessibleButton
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
            >
                Open Modal (Ctrl+M)
            </AccessibleButton>

            <AccessibleInput
                label="Your Name"
                value={inputValue}
                onChange={setInputValue}
                placeholder="Enter your name"
                helpText="This will be used for personalization"
                required
            />

            <AccessibleSelect
                label="Choose Option"
                value={selectValue}
                onChange={setSelectValue}
                options={[
                    { value: "option1", label: "Option 1" },
                    { value: "option2", label: "Option 2" },
                    { value: "option3", label: "Option 3" }
                ]}
            />

            <AccessibleTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <AccessibleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Accessible Modal Example"
            >
                <p>This is an accessible modal with proper focus management and keyboard navigation.</p>
                <AccessibleButton onClick={() => setIsModalOpen(false)}>
                    Close Modal
                </AccessibleButton>
            </AccessibleModal>
        </div>
    )
}