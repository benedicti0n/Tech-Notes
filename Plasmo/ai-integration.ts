// AI Integration for Plasmo Extensions - OpenAI, Claude, and Local AI Models

export interface AIProvider {
    name: string
    apiKey?: string
    endpoint: string
    model: string
    maxTokens: number
    temperature: number
}

export interface AIRequest {
    prompt: string
    context?: string
    systemMessage?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
}

export interface AIResponse {
    content: string
    usage: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    model: string
    finishReason: string
    timestamp: number
}

export interface AIAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
    keywords: string[]
    summary: string
    categories: string[]
    language: string
}

class AIManager {
    private static instance: AIManager
    private providers: Map<string, AIProvider> = new Map()
    private cache: Map<string, AIResponse> = new Map()
    private requestQueue: Array<{ request: AIRequest; resolve: Function; reject: Function }> = []
    private isProcessing = false
    private rateLimiter = new Map<string, number>()

    static getInstance(): AIManager {
        if (!AIManager.instance) {
            AIManager.instance = new AIManager()
        }
        return AIManager.instance
    }

    constructor() {
        this.initializeProviders()
        this.setupRateLimiting()
    }

    private initializeProviders(): void {
        // OpenAI GPT
        this.providers.set('openai', {
            name: 'OpenAI GPT',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
            maxTokens: 2048,
            temperature: 0.7
        })

        // Anthropic Claude
        this.providers.set('claude', {
            name: 'Anthropic Claude',
            endpoint: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-sonnet-20240229',
            maxTokens: 2048,
            temperature: 0.7
        })

        // Local Ollama
        this.providers.set('ollama', {
            name: 'Local Ollama',
            endpoint: 'http://localhost:11434/api/generate',
            model: 'llama2',
            maxTokens: 2048,
            temperature: 0.7
        })

        // Hugging Face
        this.providers.set('huggingface', {
            name: 'Hugging Face',
            endpoint: 'https://api-inference.huggingface.co/models',
            model: 'microsoft/DialoGPT-medium',
            maxTokens: 1024,
            temperature: 0.8
        })
    }

    private setupRateLimiting(): void {
        // Reset rate limits every minute
        setInterval(() => {
            this.rateLimiter.clear()
        }, 60000)
    }

    async setProviderConfig(providerId: string, config: Partial<AIProvider>): Promise<void> {
        const existing = this.providers.get(providerId)
        if (existing) {
            this.providers.set(providerId, { ...existing, ...config })

            // Save to storage
            await chrome.storage.sync.set({
                [`ai_provider_${providerId}`]: { ...existing, ...config }
            })
        }
    }

    async loadProviderConfigs(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get(null)

            Object.entries(result).forEach(([key, value]) => {
                if (key.startsWith('ai_provider_')) {
                    const providerId = key.replace('ai_provider_', '')
                    this.providers.set(providerId, value as AIProvider)
                }
            })
        } catch (error) {
            console.warn('Failed to load AI provider configs:', error)
        }
    }

    private checkRateLimit(providerId: string): boolean {
        const now = Date.now()
        const lastRequest = this.rateLimiter.get(providerId) || 0
        const minInterval = 1000 // 1 second between requests

        if (now - lastRequest < minInterval) {
            return false
        }

        this.rateLimiter.set(providerId, now)
        return true
    }

    private getCacheKey(providerId: string, request: AIRequest): string {
        return `${providerId}:${JSON.stringify(request)}`
    }

    async generateText(
        providerId: string,
        request: AIRequest,
        useCache: boolean = true
    ): Promise<AIResponse> {
        const provider = this.providers.get(providerId)
        if (!provider) {
            throw new Error(`AI provider '${providerId}' not found`)
        }

        // Check cache
        if (useCache) {
            const cacheKey = this.getCacheKey(providerId, request)
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return cached
            }
        }

        // Check rate limit
        if (!this.checkRateLimit(providerId)) {
            throw new Error('Rate limit exceeded. Please wait before making another request.')
        }

        // Queue request
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request: { ...request, providerId } as any, resolve, reject })
            this.processQueue()
        })
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return
        }

        this.isProcessing = true

        while (this.requestQueue.length > 0) {
            const { request, resolve, reject } = this.requestQueue.shift()!

            try {
                const response = await this.makeAIRequest(request.providerId, request)

                // Cache response
                const cacheKey = this.getCacheKey(request.providerId, request)
                this.cache.set(cacheKey, response)

                // Limit cache size
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value
                    this.cache.delete(firstKey)
                }

                resolve(response)
            } catch (error) {
                reject(error)
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        this.isProcessing = false
    }

    private async makeAIRequest(providerId: string, request: AIRequest): Promise<AIResponse> {
        const provider = this.providers.get(providerId)!

        switch (providerId) {
            case 'openai':
                return this.callOpenAI(provider, request)
            case 'claude':
                return this.callClaude(provider, request)
            case 'ollama':
                return this.callOllama(provider, request)
            case 'huggingface':
                return this.callHuggingFace(provider, request)
            default:
                throw new Error(`Unsupported AI provider: ${providerId}`)
        }
    }

    private async callOpenAI(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    ...(request.systemMessage ? [{ role: 'system', content: request.systemMessage }] : []),
                    ...(request.context ? [{ role: 'user', content: request.context }] : []),
                    { role: 'user', content: request.prompt }
                ],
                max_tokens: request.maxTokens || provider.maxTokens,
                temperature: request.temperature || provider.temperature,
                stream: request.stream || false
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            },
            model: data.model,
            finishReason: data.choices[0].finish_reason,
            timestamp: Date.now()
        }
    }

    private async callClaude(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': provider.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: request.maxTokens || provider.maxTokens,
                temperature: request.temperature || provider.temperature,
                system: request.systemMessage,
                messages: [
                    ...(request.context ? [{ role: 'user', content: request.context }] : []),
                    { role: 'user', content: request.prompt }
                ]
            })
        })

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        return {
            content: data.content[0].text,
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens
            },
            model: data.model,
            finishReason: data.stop_reason,
            timestamp: Date.now()
        }
    }

    private async callOllama(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
        const fullPrompt = [
            request.systemMessage,
            request.context,
            request.prompt
        ].filter(Boolean).join('\n\n')

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: provider.model,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: request.temperature || provider.temperature,
                    num_predict: request.maxTokens || provider.maxTokens
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        return {
            content: data.response,
            usage: {
                promptTokens: 0, // Ollama doesn't provide token counts
                completionTokens: 0,
                totalTokens: 0
            },
            model: data.model,
            finishReason: data.done ? 'stop' : 'length',
            timestamp: Date.now()
        }
    }

    private async callHuggingFace(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
        const response = await fetch(`${provider.endpoint}/${provider.model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                inputs: request.prompt,
                parameters: {
                    max_length: request.maxTokens || provider.maxTokens,
                    temperature: request.temperature || provider.temperature,
                    return_full_text: false
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const content = Array.isArray(data) ? data[0].generated_text : data.generated_text

        return {
            content,
            usage: {
                promptTokens: 0, // HF doesn't provide detailed token counts
                completionTokens: 0,
                totalTokens: 0
            },
            model: provider.model,
            finishReason: 'stop',
            timestamp: Date.now()
        }
    }

    // Advanced AI features
    async analyzeText(text: string, providerId: string = 'openai'): Promise<AIAnalysis> {
        const request: AIRequest = {
            prompt: `Analyze the following text and provide a JSON response with sentiment (positive/negative/neutral), confidence (0-1), keywords (array), summary (string), categories (array), and language:

Text: "${text}"

Respond only with valid JSON.`,
            systemMessage: 'You are a text analysis expert. Always respond with valid JSON only.',
            temperature: 0.3
        }

        const response = await this.generateText(providerId, request)

        try {
            const analysis = JSON.parse(response.content)
            return {
                sentiment: analysis.sentiment || 'neutral',
                confidence: analysis.confidence || 0.5,
                keywords: analysis.keywords || [],
                summary: analysis.summary || text.slice(0, 100) + '...',
                categories: analysis.categories || [],
                language: analysis.language || 'unknown'
            }
        } catch (error) {
            // Fallback analysis
            return {
                sentiment: 'neutral',
                confidence: 0.5,
                keywords: text.split(' ').slice(0, 5),
                summary: text.slice(0, 100) + '...',
                categories: ['general'],
                language: 'unknown'
            }
        }
    }

    async summarizeContent(content: string, maxLength: number = 200, providerId: string = 'openai'): Promise<string> {
        const request: AIRequest = {
            prompt: `Summarize the following content in ${maxLength} characters or less:

${content}`,
            systemMessage: 'You are a professional content summarizer. Provide concise, accurate summaries.',
            temperature: 0.3,
            maxTokens: Math.ceil(maxLength / 3) // Rough token estimation
        }

        const response = await this.generateText(providerId, request)
        return response.content.trim()
    }

    async translateText(text: string, targetLanguage: string, providerId: string = 'openai'): Promise<string> {
        const request: AIRequest = {
            prompt: `Translate the following text to ${targetLanguage}:

${text}`,
            systemMessage: `You are a professional translator. Translate accurately to ${targetLanguage}.`,
            temperature: 0.2
        }

        const response = await this.generateText(providerId, request)
        return response.content.trim()
    }

    async generateCode(description: string, language: string = 'javascript', providerId: string = 'openai'): Promise<string> {
        const request: AIRequest = {
            prompt: `Generate ${language} code for the following requirement:

${description}

Provide only the code without explanations.`,
            systemMessage: `You are an expert ${language} developer. Write clean, efficient, well-commented code.`,
            temperature: 0.1
        }

        const response = await this.generateText(providerId, request)
        return response.content.trim()
    }

    async improveText(text: string, style: string = 'professional', providerId: string = 'openai'): Promise<string> {
        const request: AIRequest = {
            prompt: `Improve the following text to be more ${style}:

${text}`,
            systemMessage: `You are a professional editor. Improve text clarity, grammar, and ${style} tone.`,
            temperature: 0.4
        }

        const response = await this.generateText(providerId, request)
        return response.content.trim()
    }

    // Batch processing
    async processBatch(requests: Array<{ id: string; request: AIRequest }>, providerId: string): Promise<Array<{ id: string; response: AIResponse; error?: string }>> {
        const results: Array<{ id: string; response: AIResponse; error?: string }> = []

        for (const { id, request } of requests) {
            try {
                const response = await this.generateText(providerId, request)
                results.push({ id, response })
            } catch (error) {
                results.push({ id, response: null as any, error: error.message })
            }
        }

        return results
    }

    // Usage statistics
    getUsageStats(): {
        totalRequests: number
        totalTokens: number
        providerUsage: Record<string, number>
        cacheHitRate: number
    } {
        const stats = {
            totalRequests: 0,
            totalTokens: 0,
            providerUsage: {} as Record<string, number>,
            cacheHitRate: 0
        }

        // Calculate from cache and stored metrics
        this.cache.forEach((response) => {
            stats.totalRequests++
            stats.totalTokens += response.usage.totalTokens
            stats.providerUsage[response.model] = (stats.providerUsage[response.model] || 0) + 1
        })

        stats.cacheHitRate = this.cache.size > 0 ? (this.cache.size / stats.totalRequests) * 100 : 0

        return stats
    }

    clearCache(): void {
        this.cache.clear()
    }
}

// React hook for AI integration
import { useEffect, useState } from "react"

export function useAI() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const aiManager = AIManager.getInstance()

    useEffect(() => {
        aiManager.loadProviderConfigs()
    }, [])

    const generateText = async (providerId: string, request: AIRequest): Promise<AIResponse | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await aiManager.generateText(providerId, request)
            return response
        } catch (err) {
            setError(err.message)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const analyzeText = async (text: string, providerId?: string): Promise<AIAnalysis | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const analysis = await aiManager.analyzeText(text, providerId)
            return analysis
        } catch (err) {
            setError(err.message)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return {
        generateText,
        analyzeText,
        summarizeContent: aiManager.summarizeContent.bind(aiManager),
        translateText: aiManager.translateText.bind(aiManager),
        generateCode: aiManager.generateCode.bind(aiManager),
        improveText: aiManager.improveText.bind(aiManager),
        isLoading,
        error,
        clearError: () => setError(null),
        getUsageStats: aiManager.getUsageStats.bind(aiManager),
        setProviderConfig: aiManager.setProviderConfig.bind(aiManager)
    }
}

// Export singleton instance
export const aiManager = AIManager.getInstance()

// Example usage:
/*
import { useAI } from "~ai-integration"

function AIAssistantComponent() {
  const { generateText, analyzeText, isLoading, error } = useAI()
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  
  const handleGenerate = async () => {
    const response = await generateText('openai', {
      prompt: input,
      systemMessage: 'You are a helpful assistant.',
      temperature: 0.7
    })
    
    if (response) {
      setResult(response.content)
    }
  }
  
  const handleAnalyze = async () => {
    const analysis = await analyzeText(input)
    if (analysis) {
      setResult(JSON.stringify(analysis, null, 2))
    }
  }
  
  return (
    <div>
      <textarea 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text..."
      />
      <button onClick={handleGenerate} disabled={isLoading}>
        Generate Response
      </button>
      <button onClick={handleAnalyze} disabled={isLoading}>
        Analyze Text
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="result">{result}</div>}
    </div>
  )
}
*/