// Internationalization (i18n) System for Plasmo Extensions

export interface TranslationKeys {
    // Common UI elements
    "common.save": string
    "common.cancel": string
    "common.delete": string
    "common.edit": string
    "common.close": string
    "common.loading": string
    "common.error": string
    "common.success": string

    // Extension specific
    "extension.name": string
    "extension.description": string
    "popup.title": string
    "popup.analyze_page": string
    "popup.change_background": string
    "options.title": string
    "options.general_settings": string
    "options.theme": string
    "options.enable_extension": string
    "options.notifications": string

    // Messages and notifications
    "messages.page_analyzed": string
    "messages.settings_saved": string
    "messages.bookmark_added": string
    "messages.error_occurred": string

    // Time and dates
    "time.good_morning": string
    "time.good_afternoon": string
    "time.good_evening": string
    "time.today": string
    "time.yesterday": string
}

// Translation files
const translations: Record<string, Partial<TranslationKeys>> = {
    en: {
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.close": "Close",
        "common.loading": "Loading...",
        "common.error": "Error",
        "common.success": "Success",

        "extension.name": "My Plasmo Extension",
        "extension.description": "A powerful browser extension built with Plasmo",
        "popup.title": "Extension Popup",
        "popup.analyze_page": "Analyze Page",
        "popup.change_background": "Change Background",
        "options.title": "Extension Settings",
        "options.general_settings": "General Settings",
        "options.theme": "Theme",
        "options.enable_extension": "Enable Extension",
        "options.notifications": "Enable Notifications",

        "messages.page_analyzed": "Page has been analyzed successfully",
        "messages.settings_saved": "Settings have been saved",
        "messages.bookmark_added": "Bookmark added successfully",
        "messages.error_occurred": "An error occurred",

        "time.good_morning": "Good morning",
        "time.good_afternoon": "Good afternoon",
        "time.good_evening": "Good evening",
        "time.today": "Today",
        "time.yesterday": "Yesterday"
    },

    es: {
        "common.save": "Guardar",
        "common.cancel": "Cancelar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "common.close": "Cerrar",
        "common.loading": "Cargando...",
        "common.error": "Error",
        "common.success": "Éxito",

        "extension.name": "Mi Extensión Plasmo",
        "extension.description": "Una potente extensión de navegador construida con Plasmo",
        "popup.title": "Ventana Emergente",
        "popup.analyze_page": "Analizar Página",
        "popup.change_background": "Cambiar Fondo",
        "options.title": "Configuración de la Extensión",
        "options.general_settings": "Configuración General",
        "options.theme": "Tema",
        "options.enable_extension": "Habilitar Extensión",
        "options.notifications": "Habilitar Notificaciones",

        "messages.page_analyzed": "La página ha sido analizada exitosamente",
        "messages.settings_saved": "La configuración ha sido guardada",
        "messages.bookmark_added": "Marcador agregado exitosamente",
        "messages.error_occurred": "Ocurrió un error",

        "time.good_morning": "Buenos días",
        "time.good_afternoon": "Buenas tardes",
        "time.good_evening": "Buenas noches",
        "time.today": "Hoy",
        "time.yesterday": "Ayer"
    },

    fr: {
        "common.save": "Enregistrer",
        "common.cancel": "Annuler",
        "common.delete": "Supprimer",
        "common.edit": "Modifier",
        "common.close": "Fermer",
        "common.loading": "Chargement...",
        "common.error": "Erreur",
        "common.success": "Succès",

        "extension.name": "Mon Extension Plasmo",
        "extension.description": "Une extension de navigateur puissante construite avec Plasmo",
        "popup.title": "Popup d'Extension",
        "popup.analyze_page": "Analyser la Page",
        "popup.change_background": "Changer l'Arrière-plan",
        "options.title": "Paramètres de l'Extension",
        "options.general_settings": "Paramètres Généraux",
        "options.theme": "Thème",
        "options.enable_extension": "Activer l'Extension",
        "options.notifications": "Activer les Notifications",

        "messages.page_analyzed": "La page a été analysée avec succès",
        "messages.settings_saved": "Les paramètres ont été enregistrés",
        "messages.bookmark_added": "Signet ajouté avec succès",
        "messages.error_occurred": "Une erreur s'est produite",

        "time.good_morning": "Bonjour",
        "time.good_afternoon": "Bon après-midi",
        "time.good_evening": "Bonsoir",
        "time.today": "Aujourd'hui",
        "time.yesterday": "Hier"
    },

    de: {
        "common.save": "Speichern",
        "common.cancel": "Abbrechen",
        "common.delete": "Löschen",
        "common.edit": "Bearbeiten",
        "common.close": "Schließen",
        "common.loading": "Laden...",
        "common.error": "Fehler",
        "common.success": "Erfolg",

        "extension.name": "Meine Plasmo-Erweiterung",
        "extension.description": "Eine leistungsstarke Browser-Erweiterung mit Plasmo erstellt",
        "popup.title": "Erweiterungs-Popup",
        "popup.analyze_page": "Seite Analysieren",
        "popup.change_background": "Hintergrund Ändern",
        "options.title": "Erweiterungseinstellungen",
        "options.general_settings": "Allgemeine Einstellungen",
        "options.theme": "Design",
        "options.enable_extension": "Erweiterung Aktivieren",
        "options.notifications": "Benachrichtigungen Aktivieren",

        "messages.page_analyzed": "Seite wurde erfolgreich analysiert",
        "messages.settings_saved": "Einstellungen wurden gespeichert",
        "messages.bookmark_added": "Lesezeichen erfolgreich hinzugefügt",
        "messages.error_occurred": "Ein Fehler ist aufgetreten",

        "time.good_morning": "Guten Morgen",
        "time.good_afternoon": "Guten Tag",
        "time.good_evening": "Guten Abend",
        "time.today": "Heute",
        "time.yesterday": "Gestern"
    },

    ja: {
        "common.save": "保存",
        "common.cancel": "キャンセル",
        "common.delete": "削除",
        "common.edit": "編集",
        "common.close": "閉じる",
        "common.loading": "読み込み中...",
        "common.error": "エラー",
        "common.success": "成功",

        "extension.name": "私のPlasmo拡張機能",
        "extension.description": "Plasmoで構築された強力なブラウザ拡張機能",
        "popup.title": "拡張機能ポップアップ",
        "popup.analyze_page": "ページを分析",
        "popup.change_background": "背景を変更",
        "options.title": "拡張機能設定",
        "options.general_settings": "一般設定",
        "options.theme": "テーマ",
        "options.enable_extension": "拡張機能を有効にする",
        "options.notifications": "通知を有効にする",

        "messages.page_analyzed": "ページが正常に分析されました",
        "messages.settings_saved": "設定が保存されました",
        "messages.bookmark_added": "ブックマークが正常に追加されました",
        "messages.error_occurred": "エラーが発生しました",

        "time.good_morning": "おはようございます",
        "time.good_afternoon": "こんにちは",
        "time.good_evening": "こんばんは",
        "time.today": "今日",
        "time.yesterday": "昨日"
    }
}

class I18nManager {
    private static instance: I18nManager
    private currentLanguage: string = "en"
    private fallbackLanguage: string = "en"

    static getInstance(): I18nManager {
        if (!I18nManager.instance) {
            I18nManager.instance = new I18nManager()
        }
        return I18nManager.instance
    }

    async initialize(): Promise<void> {
        // Try to get language from storage first
        try {
            const result = await chrome.storage.sync.get("language")
            if (result.language) {
                this.currentLanguage = result.language
                return
            }
        } catch (error) {
            console.warn("Failed to load language from storage:", error)
        }

        // Detect browser language
        const browserLanguage = this.detectBrowserLanguage()
        this.currentLanguage = browserLanguage

        // Save detected language
        try {
            await chrome.storage.sync.set({ language: browserLanguage })
        } catch (error) {
            console.warn("Failed to save language to storage:", error)
        }
    }

    private detectBrowserLanguage(): string {
        // Get browser language
        const browserLang = navigator.language || navigator.languages?.[0] || "en"
        const langCode = browserLang.split("-")[0].toLowerCase()

        // Check if we have translations for this language
        if (translations[langCode]) {
            return langCode
        }

        return this.fallbackLanguage
    }

    async setLanguage(language: string): Promise<void> {
        if (!translations[language]) {
            throw new Error(`Language '${language}' is not supported`)
        }

        this.currentLanguage = language

        try {
            await chrome.storage.sync.set({ language })

            // Notify other parts of the extension about language change
            chrome.runtime.sendMessage({
                type: "LANGUAGE_CHANGED",
                language
            })
        } catch (error) {
            console.error("Failed to save language:", error)
        }
    }

    getCurrentLanguage(): string {
        return this.currentLanguage
    }

    getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
        return [
            { code: "en", name: "English", nativeName: "English" },
            { code: "es", name: "Spanish", nativeName: "Español" },
            { code: "fr", name: "French", nativeName: "Français" },
            { code: "de", name: "German", nativeName: "Deutsch" },
            { code: "ja", name: "Japanese", nativeName: "日本語" }
        ]
    }

    t(key: keyof TranslationKeys, params?: Record<string, string | number>): string {
        const currentTranslations = translations[this.currentLanguage] || {}
        const fallbackTranslations = translations[this.fallbackLanguage] || {}

        let translation = currentTranslations[key] || fallbackTranslations[key] || key

        // Replace parameters in translation
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                translation = translation.replace(
                    new RegExp(`{{${paramKey}}}`, "g"),
                    String(paramValue)
                )
            })
        }

        return translation
    }

    // Pluralization helper
    plural(
        key: keyof TranslationKeys,
        count: number,
        params?: Record<string, string | number>
    ): string {
        const pluralKey = count === 1 ? key : `${key}_plural` as keyof TranslationKeys
        return this.t(pluralKey, { ...params, count })
    }

    // Date formatting with localization
    formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
        return new Intl.DateTimeFormat(this.currentLanguage, options).format(date)
    }

    // Number formatting with localization
    formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
        return new Intl.NumberFormat(this.currentLanguage, options).format(number)
    }

    // Currency formatting
    formatCurrency(amount: number, currency: string = "USD"): string {
        return new Intl.NumberFormat(this.currentLanguage, {
            style: "currency",
            currency
        }).format(amount)
    }

    // Relative time formatting
    formatRelativeTime(date: Date): string {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: "auto" })

        if (diffInSeconds < 60) {
            return rtf.format(-diffInSeconds, "second")
        } else if (diffInSeconds < 3600) {
            return rtf.format(-Math.floor(diffInSeconds / 60), "minute")
        } else if (diffInSeconds < 86400) {
            return rtf.format(-Math.floor(diffInSeconds / 3600), "hour")
        } else {
            return rtf.format(-Math.floor(diffInSeconds / 86400), "day")
        }
    }
}

// Export singleton instance
export const i18n = I18nManager.getInstance()

// React hook for using i18n in components
import { useEffect, useState } from "react"

export function useI18n() {
    const [language, setLanguage] = useState(i18n.getCurrentLanguage())

    useEffect(() => {
        const handleLanguageChange = (message: any) => {
            if (message.type === "LANGUAGE_CHANGED") {
                setLanguage(message.language)
            }
        }

        chrome.runtime.onMessage.addListener(handleLanguageChange)
        return () => chrome.runtime.onMessage.removeListener(handleLanguageChange)
    }, [])

    return {
        t: i18n.t.bind(i18n),
        language,
        setLanguage: i18n.setLanguage.bind(i18n),
        supportedLanguages: i18n.getSupportedLanguages(),
        formatDate: i18n.formatDate.bind(i18n),
        formatNumber: i18n.formatNumber.bind(i18n),
        formatCurrency: i18n.formatCurrency.bind(i18n),
        formatRelativeTime: i18n.formatRelativeTime.bind(i18n)
    }
}

// Initialize i18n when module loads
i18n.initialize()

// Example usage:
/*
import { useI18n } from "~i18n"

function MyComponent() {
  const { t, language, setLanguage, supportedLanguages } = useI18n()
  
  return (
    <div>
      <h1>{t("popup.title")}</h1>
      <button onClick={() => setLanguage("es")}>
        {t("common.save")}
      </button>
      <select onChange={(e) => setLanguage(e.target.value)} value={language}>
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  )
}
*/