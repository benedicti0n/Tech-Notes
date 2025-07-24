// Advanced Data Visualization Components for Plasmo Extensions
import { useEffect, useRef, useState } from "react"

import "./data-visualization.css"

// Data Types
export interface ChartDataPoint {
    x: number | string | Date
    y: number
    label?: string
    color?: string
    metadata?: Record<string, any>
}

export interface ChartSeries {
    name: string
    data: ChartDataPoint[]
    color?: string
    type?: 'line' | 'bar' | 'area' | 'scatter'
    visible?: boolean
}

export interface ChartConfig {
    width: number
    height: number
    margin: { top: number; right: number; bottom: number; left: number }
    showGrid: boolean
    showLegend: boolean
    showTooltip: boolean
    animate: boolean
    theme: 'light' | 'dark'
}

// Chart Base Class
abstract class BaseChart {
    protected canvas: HTMLCanvasElement
    protected ctx: CanvasRenderingContext2D
    protected config: ChartConfig
    protected data: ChartSeries[]
    protected hoveredPoint: { seriesIndex: number; pointIndex: number } | null = null

    constructor(canvas: HTMLCanvasElement, config: Partial<ChartConfig> = {}) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.config = {
            width: 400,
            height: 300,
            margin: { top: 20, right: 20, bottom: 40, left: 60 },
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            animate: true,
            theme: 'light',
            ...config
        }
        this.data = []

        this.setupCanvas()
        this.setupEventListeners()
    }

    private setupCanvas(): void {
        const dpr = window.devicePixelRatio || 1
        this.canvas.width = this.config.width * dpr
        this.canvas.height = this.config.height * dpr
        this.canvas.style.width = `${this.config.width}px`
        this.canvas.style.height = `${this.config.height}px`
        this.ctx.scale(dpr, dpr)
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
        this.canvas.addEventListener('click', this.handleClick.bind(this))
    }

    protected abstract handleMouseMove(event: MouseEvent): void
    protected abstract handleMouseLeave(event: MouseEvent): void
    protected abstract handleClick(event: MouseEvent): void

    setData(data: ChartSeries[]): void {
        this.data = data
        this.render()
    }

    updateConfig(config: Partial<ChartConfig>): void {
        this.config = { ...this.config, ...config }
        this.setupCanvas()
        this.render()
    }

    protected getChartArea(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.config.margin.left,
            y: this.config.margin.top,
            width: this.config.width - this.config.margin.left - this.config.margin.right,
            height: this.config.height - this.config.margin.top - this.config.margin.bottom
        }
    }

    protected drawGrid(): void {
        if (!this.config.showGrid) return

        const area = this.getChartArea()
        const { ctx } = this

        ctx.strokeStyle = this.config.theme === 'dark' ? '#333' : '#e0e0e0'
        ctx.lineWidth = 1

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = area.x + (area.width / 10) * i
            ctx.beginPath()
            ctx.moveTo(x, area.y)
            ctx.lineTo(x, area.y + area.height)
            ctx.stroke()
        }

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = area.y + (area.height / 10) * i
            ctx.beginPath()
            ctx.moveTo(area.x, y)
            ctx.lineTo(area.x + area.width, y)
            ctx.stroke()
        }
    }

    protected drawLegend(): void {
        if (!this.config.showLegend || this.data.length === 0) return

        const { ctx } = this
        const legendY = this.config.height - 20
        let legendX = this.config.margin.left

        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        this.data.forEach((series, index) => {
            if (!series.visible) return

            // Legend color box
            ctx.fillStyle = series.color || this.getDefaultColor(index)
            ctx.fillRect(legendX, legendY - 6, 12, 12)

            // Legend text
            ctx.fillStyle = this.config.theme === 'dark' ? '#fff' : '#000'
            ctx.fillText(series.name, legendX + 18, legendY)

            legendX += ctx.measureText(series.name).width + 40
        })
    }

    protected getDefaultColor(index: number): string {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
        ]
        return colors[index % colors.length]
    }

    abstract render(): void
}

// Line Chart Implementation
class LineChart extends BaseChart {
    private animationProgress = 0

    render(): void {
        const { ctx } = this

        // Clear canvas
        ctx.clearRect(0, 0, this.config.width, this.config.height)

        // Set background
        ctx.fillStyle = this.config.theme === 'dark' ? '#1a1a1a' : '#ffffff'
        ctx.fillRect(0, 0, this.config.width, this.config.height)

        this.drawGrid()
        this.drawAxes()
        this.drawData()
        this.drawLegend()

        if (this.config.animate && this.animationProgress < 1) {
            this.animationProgress += 0.05
            requestAnimationFrame(() => this.render())
        }
    }

    private drawAxes(): void {
        const area = this.getChartArea()
        const { ctx } = this

        ctx.strokeStyle = this.config.theme === 'dark' ? '#666' : '#333'
        ctx.lineWidth = 2

        // X-axis
        ctx.beginPath()
        ctx.moveTo(area.x, area.y + area.height)
        ctx.lineTo(area.x + area.width, area.y + area.height)
        ctx.stroke()

        // Y-axis
        ctx.beginPath()
        ctx.moveTo(area.x, area.y)
        ctx.lineTo(area.x, area.y + area.height)
        ctx.stroke()

        this.drawAxisLabels()
    }

    private drawAxisLabels(): void {
        const area = this.getChartArea()
        const { ctx } = this

        if (this.data.length === 0) return

        const allData = this.data.flatMap(series => series.data)
        const xValues = allData.map(d => typeof d.x === 'number' ? d.x : 0)
        const yValues = allData.map(d => d.y)

        const xMin = Math.min(...xValues)
        const xMax = Math.max(...xValues)
        const yMin = Math.min(...yValues)
        const yMax = Math.max(...yValues)

        ctx.font = '10px Arial'
        ctx.fillStyle = this.config.theme === 'dark' ? '#ccc' : '#666'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // X-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = xMin + ((xMax - xMin) / 5) * i
            const x = area.x + (area.width / 5) * i
            ctx.fillText(value.toFixed(1), x, area.y + area.height + 5)
        }

        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = yMax - ((yMax - yMin) / 5) * i
            const y = area.y + (area.height / 5) * i
            ctx.fillText(value.toFixed(1), area.x - 5, y)
        }
    }

    private drawData(): void {
        const area = this.getChartArea()
        const { ctx } = this

        if (this.data.length === 0) return

        const allData = this.data.flatMap(series => series.data)
        const xValues = allData.map(d => typeof d.x === 'number' ? d.x : 0)
        const yValues = allData.map(d => d.y)

        const xMin = Math.min(...xValues)
        const xMax = Math.max(...xValues)
        const yMin = Math.min(...yValues)
        const yMax = Math.max(...yValues)

        this.data.forEach((series, seriesIndex) => {
            if (!series.visible) return

            ctx.strokeStyle = series.color || this.getDefaultColor(seriesIndex)
            ctx.lineWidth = 2
            ctx.beginPath()

            let isFirstPoint = true

            series.data.forEach((point, pointIndex) => {
                const x = area.x + ((typeof point.x === 'number' ? point.x : 0) - xMin) / (xMax - xMin) * area.width
                const y = area.y + area.height - ((point.y - yMin) / (yMax - yMin) * area.height)

                if (this.config.animate) {
                    const progress = Math.min(1, this.animationProgress * series.data.length - pointIndex)
                    if (progress <= 0) return
                }

                if (isFirstPoint) {
                    ctx.moveTo(x, y)
                    isFirstPoint = false
                } else {
                    ctx.lineTo(x, y)
                }

                // Draw point
                ctx.save()
                ctx.fillStyle = series.color || this.getDefaultColor(seriesIndex)
                ctx.beginPath()
                ctx.arc(x, y, 3, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            })

            ctx.stroke()
        })
    }

    protected handleMouseMove(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Find closest point
        let closestPoint: { seriesIndex: number; pointIndex: number; distance: number } | null = null

        this.data.forEach((series, seriesIndex) => {
            if (!series.visible) return

            series.data.forEach((point, pointIndex) => {
                const area = this.getChartArea()
                const allData = this.data.flatMap(s => s.data)
                const xValues = allData.map(d => typeof d.x === 'number' ? d.x : 0)
                const yValues = allData.map(d => d.y)
                const xMin = Math.min(...xValues)
                const xMax = Math.max(...xValues)
                const yMin = Math.min(...yValues)
                const yMax = Math.max(...yValues)

                const pointX = area.x + ((typeof point.x === 'number' ? point.x : 0) - xMin) / (xMax - xMin) * area.width
                const pointY = area.y + area.height - ((point.y - yMin) / (yMax - yMin) * area.height)

                const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2))

                if (distance < 10 && (!closestPoint || distance < closestPoint.distance)) {
                    closestPoint = { seriesIndex, pointIndex, distance }
                }
            })
        })

        if (closestPoint) {
            this.hoveredPoint = { seriesIndex: closestPoint.seriesIndex, pointIndex: closestPoint.pointIndex }
            this.showTooltip(x, y, closestPoint.seriesIndex, closestPoint.pointIndex)
        } else {
            this.hoveredPoint = null
            this.hideTooltip()
        }
    }

    protected handleMouseLeave(event: MouseEvent): void {
        this.hoveredPoint = null
        this.hideTooltip()
    }

    protected handleClick(event: MouseEvent): void {
        if (this.hoveredPoint) {
            const series = this.data[this.hoveredPoint.seriesIndex]
            const point = series.data[this.hoveredPoint.pointIndex]
            console.log('Clicked point:', { series: series.name, point })
        }
    }

    private showTooltip(x: number, y: number, seriesIndex: number, pointIndex: number): void {
        if (!this.config.showTooltip) return

        const series = this.data[seriesIndex]
        const point = series.data[pointIndex]

        // Create or update tooltip element
        let tooltip = document.getElementById('chart-tooltip')
        if (!tooltip) {
            tooltip = document.createElement('div')
            tooltip.id = 'chart-tooltip'
            tooltip.className = 'chart-tooltip'
            document.body.appendChild(tooltip)
        }

        tooltip.innerHTML = `
      <div><strong>${series.name}</strong></div>
      <div>X: ${point.x}</div>
      <div>Y: ${point.y}</div>
      ${point.label ? `<div>${point.label}</div>` : ''}
    `

        const rect = this.canvas.getBoundingClientRect()
        tooltip.style.left = `${rect.left + x + 10}px`
        tooltip.style.top = `${rect.top + y - 10}px`
        tooltip.style.display = 'block'
    }

    private hideTooltip(): void {
        const tooltip = document.getElementById('chart-tooltip')
        if (tooltip) {
            tooltip.style.display = 'none'
        }
    }
}

// Bar Chart Implementation
class BarChart extends BaseChart {
    render(): void {
        const { ctx } = this

        ctx.clearRect(0, 0, this.config.width, this.config.height)
        ctx.fillStyle = this.config.theme === 'dark' ? '#1a1a1a' : '#ffffff'
        ctx.fillRect(0, 0, this.config.width, this.config.height)

        this.drawGrid()
        this.drawAxes()
        this.drawBars()
        this.drawLegend()
    }

    private drawAxes(): void {
        const area = this.getChartArea()
        const { ctx } = this

        ctx.strokeStyle = this.config.theme === 'dark' ? '#666' : '#333'
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.moveTo(area.x, area.y + area.height)
        ctx.lineTo(area.x + area.width, area.y + area.height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(area.x, area.y)
        ctx.lineTo(area.x, area.y + area.height)
        ctx.stroke()
    }

    private drawBars(): void {
        const area = this.getChartArea()
        const { ctx } = this

        if (this.data.length === 0) return

        const allData = this.data.flatMap(series => series.data)
        const yValues = allData.map(d => d.y)
        const yMax = Math.max(...yValues, 0)

        const barWidth = area.width / (this.data[0]?.data.length || 1) / this.data.length * 0.8
        const groupWidth = area.width / (this.data[0]?.data.length || 1)

        this.data.forEach((series, seriesIndex) => {
            if (!series.visible) return

            ctx.fillStyle = series.color || this.getDefaultColor(seriesIndex)

            series.data.forEach((point, pointIndex) => {
                const x = area.x + pointIndex * groupWidth + seriesIndex * barWidth + (groupWidth - barWidth * this.data.length) / 2
                const barHeight = (point.y / yMax) * area.height
                const y = area.y + area.height - barHeight

                ctx.fillRect(x, y, barWidth, barHeight)
            })
        })
    }

    protected handleMouseMove(event: MouseEvent): void {
        // Implementation for bar chart hover
    }

    protected handleMouseLeave(event: MouseEvent): void {
        // Implementation for bar chart mouse leave
    }

    protected handleClick(event: MouseEvent): void {
        // Implementation for bar chart click
    }
}

// React Components
interface ChartProps {
    data: ChartSeries[]
    config?: Partial<ChartConfig>
    type: 'line' | 'bar'
    onPointClick?: (seriesIndex: number, pointIndex: number, point: ChartDataPoint) => void
}

export function Chart({ data, config = {}, type, onPointClick }: ChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<BaseChart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        // Create chart instance
        if (type === 'line') {
            chartRef.current = new LineChart(canvasRef.current, config)
        } else if (type === 'bar') {
            chartRef.current = new BarChart(canvasRef.current, config)
        }

        return () => {
            chartRef.current = null
        }
    }, [type])

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.setData(data)
        }
    }, [data])

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.updateConfig(config)
        }
    }, [config])

    return <canvas ref={canvasRef} className="data-chart" />
}

// Specialized Chart Components
interface MetricsChartProps {
    metrics: Array<{
        name: string
        value: number
        timestamp: Date
        color?: string
    }>
    timeRange?: 'hour' | 'day' | 'week' | 'month'
}

export function MetricsChart({ metrics, timeRange = 'hour' }: MetricsChartProps) {
    const [chartData, setChartData] = useState<ChartSeries[]>([])

    useEffect(() => {
        // Group metrics by name
        const groupedMetrics = metrics.reduce((acc, metric) => {
            if (!acc[metric.name]) {
                acc[metric.name] = []
            }
            acc[metric.name].push({
                x: metric.timestamp.getTime(),
                y: metric.value,
                label: `${metric.name}: ${metric.value}`
            })
            return acc
        }, {} as Record<string, ChartDataPoint[]>)

        // Convert to chart series
        const series: ChartSeries[] = Object.entries(groupedMetrics).map(([name, data], index) => ({
            name,
            data: data.sort((a, b) => (a.x as number) - (b.x as number)),
            color: metrics.find(m => m.name === name)?.color,
            visible: true
        }))

        setChartData(series)
    }, [metrics])

    return (
        <div className="metrics-chart">
            <h3>Performance Metrics</h3>
            <Chart
                data={chartData}
                type="line"
                config={{
                    width: 600,
                    height: 300,
                    showGrid: true,
                    showLegend: true,
                    animate: true
                }}
            />
        </div>
    )
}

interface UsageAnalyticsProps {
    data: Array<{
        feature: string
        usage: number
        category: string
    }>
}

export function UsageAnalytics({ data }: UsageAnalyticsProps) {
    const chartData: ChartSeries[] = [
        {
            name: 'Feature Usage',
            data: data.map((item, index) => ({
                x: item.feature,
                y: item.usage,
                label: `${item.feature}: ${item.usage} uses`,
                color: `hsl(${(index * 360) / data.length}, 70%, 50%)`
            })),
            visible: true
        }
    ]

    return (
        <div className="usage-analytics">
            <h3>Feature Usage Analytics</h3>
            <Chart
                data={chartData}
                type="bar"
                config={{
                    width: 500,
                    height: 250,
                    showGrid: true,
                    showLegend: false
                }}
            />
        </div>
    )
}

// Real-time Chart Component
interface RealTimeChartProps {
    dataSource: () => Promise<ChartDataPoint[]>
    updateInterval?: number
    maxDataPoints?: number
}

export function RealTimeChart({
    dataSource,
    updateInterval = 1000,
    maxDataPoints = 50
}: RealTimeChartProps) {
    const [data, setData] = useState<ChartSeries[]>([])

    useEffect(() => {
        const updateData = async () => {
            try {
                const newData = await dataSource()

                setData(prevData => {
                    const series = prevData[0] || { name: 'Real-time Data', data: [], visible: true }
                    const updatedData = [...series.data, ...newData]

                    // Keep only the latest data points
                    if (updatedData.length > maxDataPoints) {
                        updatedData.splice(0, updatedData.length - maxDataPoints)
                    }

                    return [{ ...series, data: updatedData }]
                })
            } catch (error) {
                console.error('Failed to update real-time data:', error)
            }
        }

        const interval = setInterval(updateData, updateInterval)
        updateData() // Initial load

        return () => clearInterval(interval)
    }, [dataSource, updateInterval, maxDataPoints])

    return (
        <div className="real-time-chart">
            <h3>Real-time Data</h3>
            <Chart
                data={data}
                type="line"
                config={{
                    width: 600,
                    height: 200,
                    animate: false, // Disable animation for real-time updates
                    showGrid: true
                }}
            />
        </div>
    )
}

// Export utility functions
export const chartUtils = {
    generateSampleData: (points: number = 10): ChartDataPoint[] => {
        return Array.from({ length: points }, (_, i) => ({
            x: i,
            y: Math.random() * 100,
            label: `Point ${i + 1}`
        }))
    },

    exportChartAsImage: (canvas: HTMLCanvasElement): string => {
        return canvas.toDataURL('image/png')
    },

    calculateTrendline: (data: ChartDataPoint[]): ChartDataPoint[] => {
        if (data.length < 2) return []

        const n = data.length
        const sumX = data.reduce((sum, point) => sum + (typeof point.x === 'number' ? point.x : 0), 0)
        const sumY = data.reduce((sum, point) => sum + point.y, 0)
        const sumXY = data.reduce((sum, point) => sum + (typeof point.x === 'number' ? point.x : 0) * point.y, 0)
        const sumXX = data.reduce((sum, point) => sum + Math.pow(typeof point.x === 'number' ? point.x : 0, 2), 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        return data.map(point => ({
            x: point.x,
            y: slope * (typeof point.x === 'number' ? point.x : 0) + intercept,
            label: 'Trendline'
        }))
    }
}