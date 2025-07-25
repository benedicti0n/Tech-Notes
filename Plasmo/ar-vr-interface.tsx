// Augmented Reality and Virtual Reality Interface for Plasmo Extensions
import { useEffect, useRef, useState } from "react"

import "./ar-vr-interface.css"

// AR/VR Types
export interface ARMarker {
    id: string
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    scale: { x: number; y: number; z: number }
    content: React.ReactNode | string
    type: 'text' | 'image' | 'model' | 'video' | 'interactive'
    visible: boolean
    metadata?: Record<string, any>
}

export interface VRScene {
    id: string
    name: string
    environment: 'space' | 'room' | 'outdoor' | 'custom'
    objects: VRObject[]
    lighting: {
        ambient: string
        directional: { color: string; intensity: number; position: [number, number, number] }
    }
    physics: boolean
    background: string | { type: 'skybox'; textures: string[] }
}

export interface VRObject {
    id: string
    type: 'box' | 'sphere' | 'plane' | 'model' | 'text'
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    material: {
        color?: string
        texture?: string
        metalness?: number
        roughness?: number
        opacity?: number
    }
    interactive?: boolean
    animation?: {
        type: 'rotation' | 'position' | 'scale'
        duration: number
        loop: boolean
    }
}

export interface HandTracking {
    enabled: boolean
    hands: {
        left: HandPose | null
        right: HandPose | null
    }
    gestures: GestureRecognition[]
}

export interface HandPose {
    position: [number, number, number]
    rotation: [number, number, number]
    fingers: {
        thumb: FingerPose
        index: FingerPose
        middle: FingerPose
        ring: FingerPose
        pinky: FingerPose
    }
    confidence: number
}

export interface FingerPose {
    extended: boolean
    position: [number, number, number]
    joints: [number, number, number][]
}

export interface GestureRecognition {
    name: string
    pattern: string
    confidence: number
    callback: () => void
}

export interface SpatialAudio {
    enabled: boolean
    sources: Array<{
        id: string
        position: [number, number, number]
        url: string
        volume: number
        loop: boolean
        spatial: boolean
    }>
}

class ARVRManager {
    private static instance: ARVRManager
    private arSession: any = null
    private vrSession: any = null
    private canvas: HTMLCanvasElement | null = null
    private renderer: any = null
    private scene: any = null
    private camera: any = null
    private arMarkers: Map<string, ARMarker> = new Map()
    private vrObjects: Map<string, VRObject> = new Map()
    private handTracking: HandTracking = {
        enabled: false,
        hands: { left: null, right: null },
        gestures: []
    }
    private spatialAudio: SpatialAudio = {
        enabled: false,
        sources: []
    }
    private isARSupported = false
    private isVRSupported = false
    private animationFrame: number | null = null

    static getInstance(): ARVRManager {
        if (!ARVRManager.instance) {
            ARVRManager.instance = new ARVRManager()
        }
        return ARVRManager.instance
    }

    constructor() {
        this.initialize()
    }

    private async initialize(): Promise<void> {
        try {
            await this.checkARVRSupport()
            await this.setupThreeJS()
            await this.initializeHandTracking()
            console.log('🥽 AR/VR system initialized')
        } catch (error) {
            console.error('Failed to initialize AR/VR system:', error)
        }
    }

    private async checkARVRSupport(): Promise<void> {
        // Check WebXR support
        if ('xr' in navigator) {
            try {
                this.isARSupported = await navigator.xr.isSessionSupported('immersive-ar')
                this.isVRSupported = await navigator.xr.isSessionSupported('immersive-vr')
            } catch (error) {
                console.warn('WebXR not fully supported:', error)
            }
        }

        // Fallback to WebRTC for AR (camera access)
        if (!this.isARSupported && navigator.mediaDevices) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                })
                stream.getTracks().forEach(track => track.stop())
                this.isARSupported = true
            } catch (error) {
                console.warn('Camera access not available for AR fallback')
            }
        }

        console.log(`AR supported: ${this.isARSupported}, VR supported: ${this.isVRSupported}`)
    }

    private async setupThreeJS(): Promise<void> {
        // In a real implementation, this would set up Three.js
        // For now, we'll create a mock setup
        this.scene = {
            add: (object: any) => console.log('Added object to scene:', object),
            remove: (object: any) => console.log('Removed object from scene:', object),
            children: []
        }

        this.camera = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            updateProjectionMatrix: () => { }
        }

        this.renderer = {
            setSize: (width: number, height: number) => { },
            render: (scene: any, camera: any) => { },
            setAnimationLoop: (callback: () => void) => {
                const animate = () => {
                    callback()
                    this.animationFrame = requestAnimationFrame(animate)
                }
                animate()
            }
        }
    }

    private async initializeHandTracking(): Promise<void> {
        // Initialize MediaPipe or similar hand tracking
        // For now, we'll simulate hand tracking
        this.handTracking.enabled = true

        // Simulate hand poses
        setInterval(() => {
            if (this.handTracking.enabled && (this.arSession || this.vrSession)) {
                this.updateHandPoses()
            }
        }, 16) // 60 FPS
    }

    private updateHandPoses(): void {
        // Simulate hand tracking data
        this.handTracking.hands.left = {
            position: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
            fingers: {
                thumb: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                index: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                middle: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                ring: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                pinky: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] }
            },
            confidence: Math.random()
        }

        this.handTracking.hands.right = {
            position: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
            fingers: {
                thumb: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                index: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                middle: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                ring: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] },
                pinky: { extended: Math.random() > 0.5, position: [0, 0, 0], joints: [[0, 0, 0]] }
            },
            confidence: Math.random()
        }

        // Check for gestures
        this.recognizeGestures()
    }

    private recognizeGestures(): void {
        const { left, right } = this.handTracking.hands

        // Simple gesture recognition
        if (left && right) {
            // Clap gesture
            const distance = Math.sqrt(
                Math.pow(left.position[0] - right.position[0], 2) +
                Math.pow(left.position[1] - right.position[1], 2) +
                Math.pow(left.position[2] - right.position[2], 2)
            )

            if (distance < 0.1) {
                this.triggerGesture('clap')
            }
        }

        if (left) {
            // Peace sign
            if (left.fingers.index.extended && left.fingers.middle.extended &&
                !left.fingers.ring.extended && !left.fingers.pinky.extended) {
                this.triggerGesture('peace')
            }

            // Thumbs up
            if (left.fingers.thumb.extended && !left.fingers.index.extended &&
                !left.fingers.middle.extended && !left.fingers.ring.extended && !left.fingers.pinky.extended) {
                this.triggerGesture('thumbs_up')
            }
        }
    }

    private triggerGesture(gestureName: string): void {
        const gesture = this.handTracking.gestures.find(g => g.name === gestureName)
        if (gesture) {
            gesture.callback()
        }
    }

    // AR Session Management
    async startARSession(canvas: HTMLCanvasElement): Promise<void> {
        if (!this.isARSupported) {
            throw new Error('AR not supported on this device')
        }

        this.canvas = canvas

        try {
            if (navigator.xr) {
                // WebXR AR
                this.arSession = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['local', 'hit-test'],
                    optionalFeatures: ['dom-overlay', 'light-estimation', 'hand-tracking']
                })

                this.arSession.addEventListener('end', () => {
                    this.arSession = null
                    console.log('🔚 AR session ended')
                })

                console.log('🚀 AR session started')
            } else {
                // Fallback AR using camera
                await this.startCameraAR(canvas)
            }

            this.startRenderLoop()
        } catch (error) {
            console.error('Failed to start AR session:', error)
            throw error
        }
    }

    private async startCameraAR(canvas: HTMLCanvasElement): Promise<void> {
        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: 1280, height: 720 }
        })

        video.srcObject = stream
        await video.play()

        // Draw video to canvas
        const ctx = canvas.getContext('2d')!
        const drawVideo = () => {
            if (this.arSession) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                this.renderARMarkers(ctx)
                requestAnimationFrame(drawVideo)
            }
        }
        drawVideo()

        this.arSession = { type: 'camera', video, stream }
    }

    private renderARMarkers(ctx: CanvasRenderingContext2D): void {
        this.arMarkers.forEach(marker => {
            if (!marker.visible) return

            const screenX = (marker.position.x + 1) * ctx.canvas.width / 2
            const screenY = (1 - marker.position.y) * ctx.canvas.height / 2

            ctx.save()
            ctx.translate(screenX, screenY)
            ctx.scale(marker.scale.x, marker.scale.y)
            ctx.rotate(marker.rotation.z)

            switch (marker.type) {
                case 'text':
                    ctx.fillStyle = 'white'
                    ctx.strokeStyle = 'black'
                    ctx.lineWidth = 2
                    ctx.font = '24px Arial'
                    ctx.textAlign = 'center'
                    ctx.strokeText(marker.content as string, 0, 0)
                    ctx.fillText(marker.content as string, 0, 0)
                    break

                case 'image':
                    // Would render image here
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                    ctx.fillRect(-50, -50, 100, 100)
                    break

                default:
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'
                    ctx.fillRect(-25, -25, 50, 50)
            }

            ctx.restore()
        })
    }

    async stopARSession(): Promise<void> {
        if (this.arSession) {
            if (this.arSession.end) {
                await this.arSession.end()
            } else if (this.arSession.stream) {
                this.arSession.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
            }
            this.arSession = null
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
    }

    // VR Session Management
    async startVRSession(canvas: HTMLCanvasElement): Promise<void> {
        if (!this.isVRSupported) {
            throw new Error('VR not supported on this device')
        }

        this.canvas = canvas

        try {
            this.vrSession = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local'],
                optionalFeatures: ['hand-tracking', 'eye-tracking']
            })

            this.vrSession.addEventListener('end', () => {
                this.vrSession = null
                console.log('🔚 VR session ended')
            })

            console.log('🚀 VR session started')
            this.startRenderLoop()
        } catch (error) {
            console.error('Failed to start VR session:', error)
            throw error
        }
    }

    async stopVRSession(): Promise<void> {
        if (this.vrSession) {
            await this.vrSession.end()
            this.vrSession = null
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
    }

    private startRenderLoop(): void {
        const render = () => {
            if (this.arSession || this.vrSession) {
                this.updateScene()
                this.renderer?.render(this.scene, this.camera)
                this.animationFrame = requestAnimationFrame(render)
            }
        }
        render()
    }

    private updateScene(): void {
        // Update animations and interactions
        this.vrObjects.forEach(obj => {
            if (obj.animation) {
                // Apply animations
                const time = Date.now() * 0.001
                switch (obj.animation.type) {
                    case 'rotation':
                        obj.rotation[1] = time * (2 * Math.PI / obj.animation.duration)
                        break
                    case 'position':
                        obj.position[1] = Math.sin(time * (2 * Math.PI / obj.animation.duration)) * 0.5
                        break
                }
            }
        })
    }

    // AR Marker Management
    addARMarker(marker: Omit<ARMarker, 'id'>): string {
        const id = 'marker_' + Math.random().toString(36).substr(2, 9)
        const fullMarker: ARMarker = { ...marker, id }
        this.arMarkers.set(id, fullMarker)
        return id
    }

    updateARMarker(id: string, updates: Partial<ARMarker>): void {
        const marker = this.arMarkers.get(id)
        if (marker) {
            Object.assign(marker, updates)
        }
    }

    removeARMarker(id: string): void {
        this.arMarkers.delete(id)
    }

    getARMarker(id: string): ARMarker | null {
        return this.arMarkers.get(id) || null
    }

    // VR Object Management
    addVRObject(object: Omit<VRObject, 'id'>): string {
        const id = 'object_' + Math.random().toString(36).substr(2, 9)
        const fullObject: VRObject = { ...object, id }
        this.vrObjects.set(id, fullObject)

        // Add to Three.js scene
        this.scene?.add(this.createThreeJSObject(fullObject))

        return id
    }

    updateVRObject(id: string, updates: Partial<VRObject>): void {
        const object = this.vrObjects.get(id)
        if (object) {
            Object.assign(object, updates)
            // Update Three.js object
        }
    }

    removeVRObject(id: string): void {
        const object = this.vrObjects.get(id)
        if (object) {
            // Remove from Three.js scene
            this.scene?.remove(object)
            this.vrObjects.delete(id)
        }
    }

    private createThreeJSObject(vrObject: VRObject): any {
        // In a real implementation, this would create Three.js objects
        return {
            position: { set: (x: number, y: number, z: number) => { } },
            rotation: { set: (x: number, y: number, z: number) => { } },
            scale: { set: (x: number, y: number, z: number) => { } }
        }
    }

    // Spatial Audio
    enableSpatialAudio(): void {
        this.spatialAudio.enabled = true
        console.log('🔊 Spatial audio enabled')
    }

    addAudioSource(source: {
        position: [number, number, number]
        url: string
        volume?: number
        loop?: boolean
        spatial?: boolean
    }): string {
        const id = 'audio_' + Math.random().toString(36).substr(2, 9)

        this.spatialAudio.sources.push({
            id,
            volume: 1,
            loop: false,
            spatial: true,
            ...source
        })

        // In a real implementation, this would create Web Audio API nodes
        console.log('🎵 Audio source added:', id)

        return id
    }

    removeAudioSource(id: string): void {
        const index = this.spatialAudio.sources.findIndex(source => source.id === id)
        if (index > -1) {
            this.spatialAudio.sources.splice(index, 1)
            console.log('🔇 Audio source removed:', id)
        }
    }

    // Gesture Recognition
    addGesture(gesture: GestureRecognition): void {
        this.handTracking.gestures.push(gesture)
    }

    removeGesture(name: string): void {
        const index = this.handTracking.gestures.findIndex(g => g.name === name)
        if (index > -1) {
            this.handTracking.gestures.splice(index, 1)
        }
    }

    // Hit Testing (AR)
    async performHitTest(x: number, y: number): Promise<{ position: [number, number, number]; normal: [number, number, number] } | null> {
        if (!this.arSession) return null

        // In a real implementation, this would use WebXR hit testing
        // For now, we'll simulate a hit test result
        return {
            position: [x - 0.5, 0, y - 0.5],
            normal: [0, 1, 0]
        }
    }

    // Plane Detection (AR)
    async detectPlanes(): Promise<Array<{ id: string; vertices: [number, number, number][]; normal: [number, number, number] }>> {
        if (!this.arSession) return []

        // Simulate plane detection
        return [
            {
                id: 'floor_plane',
                vertices: [
                    [-2, 0, -2],
                    [2, 0, -2],
                    [2, 0, 2],
                    [-2, 0, 2]
                ],
                normal: [0, 1, 0]
            }
        ]
    }

    // Light Estimation (AR)
    async estimateLighting(): Promise<{ intensity: number; direction: [number, number, number]; color: [number, number, number] }> {
        if (!this.arSession) {
            return { intensity: 1, direction: [0, -1, 0], color: [1, 1, 1] }
        }

        // Simulate light estimation
        return {
            intensity: 0.8 + Math.random() * 0.4,
            direction: [Math.random() - 0.5, -1, Math.random() - 0.5],
            color: [0.9 + Math.random() * 0.1, 0.9 + Math.random() * 0.1, 0.9 + Math.random() * 0.1]
        }
    }

    // Utility Methods
    isARActive(): boolean {
        return this.arSession !== null
    }

    isVRActive(): boolean {
        return this.vrSession !== null
    }

    isARSupported(): boolean {
        return this.isARSupported
    }

    isVRSupported(): boolean {
        return this.isVRSupported
    }

    getHandTracking(): HandTracking {
        return this.handTracking
    }

    // Cleanup
    async cleanup(): Promise<void> {
        await this.stopARSession()
        await this.stopVRSession()
        this.arMarkers.clear()
        this.vrObjects.clear()
        this.spatialAudio.sources = []
        this.handTracking.gestures = []
    }
}

// React Components
interface ARViewProps {
    onMarkerClick?: (markerId: string) => void
    onPlaneDetected?: (plane: any) => void
    className?: string
}

export function ARView({ onMarkerClick, onPlaneDetected, className = '' }: ARViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isActive, setIsActive] = useState(false)
    const [markers, setMarkers] = useState<ARMarker[]>([])
    const arManager = ARVRManager.getInstance()

    useEffect(() => {
        if (canvasRef.current && isActive) {
            arManager.startARSession(canvasRef.current)
                .catch(error => {
                    console.error('Failed to start AR:', error)
                    setIsActive(false)
                })
        }

        return () => {
            if (isActive) {
                arManager.stopARSession()
            }
        }
    }, [isActive])

    const startAR = async () => {
        if (arManager.isARSupported()) {
            setIsActive(true)
        } else {
            alert('AR not supported on this device')
        }
    }

    const stopAR = () => {
        setIsActive(false)
        arManager.stopARSession()
    }

    const addMarker = () => {
        const markerId = arManager.addARMarker({
            position: { x: Math.random() - 0.5, y: Math.random() - 0.5, z: -1 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            content: 'Hello AR!',
            type: 'text',
            visible: true
        })

        setMarkers(prev => [...prev, arManager.getARMarker(markerId)!])
    }

    return (
        <div className={`ar-view ${className}`}>
            <div className="ar-controls">
                {!isActive ? (
                    <button onClick={startAR} className="ar-start-btn">
                        🥽 Start AR
                    </button>
                ) : (
                    <>
                        <button onClick={stopAR} className="ar-stop-btn">
                            ⏹️ Stop AR
                        </button>
                        <button onClick={addMarker} className="ar-add-marker-btn">
                            📍 Add Marker
                        </button>
                    </>
                )}
            </div>

            <canvas
                ref={canvasRef}
                className="ar-canvas"
                width={1280}
                height={720}
                style={{ display: isActive ? 'block' : 'none' }}
            />

            {!isActive && (
                <div className="ar-placeholder">
                    <div className="ar-placeholder-content">
                        <h3>AR Experience</h3>
                        <p>Click "Start AR" to begin the augmented reality experience</p>
                        <div className="ar-requirements">
                            <p>Requirements:</p>
                            <ul>
                                <li>Camera access</li>
                                <li>WebXR or WebRTC support</li>
                                <li>HTTPS connection</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="ar-info">
                <div>AR Supported: {arManager.isARSupported() ? '✅' : '❌'}</div>
                <div>Active: {isActive ? '✅' : '❌'}</div>
                <div>Markers: {markers.length}</div>
            </div>
        </div>
    )
}

interface VRViewProps {
    scene?: VRScene
    onObjectInteraction?: (objectId: string, interaction: string) => void
    className?: string
}

export function VRView({ scene, onObjectInteraction, className = '' }: VRViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isActive, setIsActive] = useState(false)
    const [objects, setObjects] = useState<VRObject[]>([])
    const [handTracking, setHandTracking] = useState<HandTracking | null>(null)
    const vrManager = ARVRManager.getInstance()

    useEffect(() => {
        if (canvasRef.current && isActive) {
            vrManager.startVRSession(canvasRef.current)
                .catch(error => {
                    console.error('Failed to start VR:', error)
                    setIsActive(false)
                })
        }

        return () => {
            if (isActive) {
                vrManager.stopVRSession()
            }
        }
    }, [isActive])

    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setHandTracking(vrManager.getHandTracking())
            }, 100)

            return () => clearInterval(interval)
        }
    }, [isActive])

    const startVR = async () => {
        if (vrManager.isVRSupported()) {
            setIsActive(true)
        } else {
            alert('VR not supported on this device')
        }
    }

    const stopVR = () => {
        setIsActive(false)
        vrManager.stopVRSession()
    }

    const addObject = () => {
        const objectId = vrManager.addVRObject({
            type: 'box',
            position: [Math.random() * 4 - 2, 1, Math.random() * 4 - 2],
            rotation: [0, 0, 0],
            scale: [0.5, 0.5, 0.5],
            material: {
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                metalness: 0.1,
                roughness: 0.7
            },
            interactive: true,
            animation: {
                type: 'rotation',
                duration: 3,
                loop: true
            }
        })

        setObjects(prev => [...prev, vrManager.vrObjects.get(objectId)!])
    }

    return (
        <div className={`vr-view ${className}`}>
            <div className="vr-controls">
                {!isActive ? (
                    <button onClick={startVR} className="vr-start-btn">
                        🥽 Enter VR
                    </button>
                ) : (
                    <>
                        <button onClick={stopVR} className="vr-stop-btn">
                            ⏹️ Exit VR
                        </button>
                        <button onClick={addObject} className="vr-add-object-btn">
                            📦 Add Object
                        </button>
                    </>
                )}
            </div>

            <canvas
                ref={canvasRef}
                className="vr-canvas"
                width={1920}
                height={1080}
                style={{ display: isActive ? 'block' : 'none' }}
            />

            {!isActive && (
                <div className="vr-placeholder">
                    <div className="vr-placeholder-content">
                        <h3>VR Experience</h3>
                        <p>Click "Enter VR" to start the virtual reality experience</p>
                        <div className="vr-requirements">
                            <p>Requirements:</p>
                            <ul>
                                <li>VR headset (Oculus, HTC Vive, etc.)</li>
                                <li>WebXR support</li>
                                <li>HTTPS connection</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="vr-info">
                <div>VR Supported: {vrManager.isVRSupported() ? '✅' : '❌'}</div>
                <div>Active: {isActive ? '✅' : '❌'}</div>
                <div>Objects: {objects.length}</div>
                {handTracking && (
                    <div>
                        <div>Hand Tracking: {handTracking.enabled ? '✅' : '❌'}</div>
                        <div>Left Hand: {handTracking.hands.left ? '✋' : '❌'}</div>
                        <div>Right Hand: {handTracking.hands.right ? '✋' : '❌'}</div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Hand Tracking Visualization Component
interface HandTrackingVisualizerProps {
    handTracking: HandTracking
    className?: string
}

export function HandTrackingVisualizer({ handTracking, className = '' }: HandTrackingVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')!

        const drawHand = (hand: HandPose, color: string) => {
            ctx.fillStyle = color
            ctx.strokeStyle = color
            ctx.lineWidth = 2

            // Draw palm
            const palmX = (hand.position[0] + 1) * canvas.width / 2
            const palmY = (1 - hand.position[1]) * canvas.height / 2

            ctx.beginPath()
            ctx.arc(palmX, palmY, 20, 0, Math.PI * 2)
            ctx.fill()

            // Draw fingers
            Object.entries(hand.fingers).forEach(([fingerName, finger], index) => {
                const angle = (index - 2) * 0.3 + hand.rotation[2]
                const fingerX = palmX + Math.cos(angle) * (finger.extended ? 40 : 20)
                const fingerY = palmY + Math.sin(angle) * (finger.extended ? 40 : 20)

                ctx.beginPath()
                ctx.moveTo(palmX, palmY)
                ctx.lineTo(fingerX, fingerY)
                ctx.stroke()

                ctx.beginPath()
                ctx.arc(fingerX, fingerY, finger.extended ? 8 : 5, 0, Math.PI * 2)
                ctx.fill()
            })
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (handTracking.hands.left) {
                drawHand(handTracking.hands.left, '#ff6b6b')
            }

            if (handTracking.hands.right) {
                drawHand(handTracking.hands.right, '#4ecdc4')
            }

            requestAnimationFrame(animate)
        }

        animate()
    }, [handTracking])

    return (
        <div className={`hand-tracking-visualizer ${className}`}>
            <h3>Hand Tracking</h3>
            <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="hand-tracking-canvas"
            />
            <div className="hand-info">
                <div>Left Hand: {handTracking.hands.left ? `${(handTracking.hands.left.confidence * 100).toFixed(0)}%` : 'Not detected'}</div>
                <div>Right Hand: {handTracking.hands.right ? `${(handTracking.hands.right.confidence * 100).toFixed(0)}%` : 'Not detected'}</div>
                <div>Gestures: {handTracking.gestures.length}</div>
            </div>
        </div>
    )
}

// React hook for AR/VR
export function useARVR() {
    const [isARSupported, setIsARSupported] = useState(false)
    const [isVRSupported, setIsVRSupported] = useState(false)
    const [isARActive, setIsARActive] = useState(false)
    const [isVRActive, setIsVRActive] = useState(false)
    const [handTracking, setHandTracking] = useState<HandTracking | null>(null)
    const arvrManager = ARVRManager.getInstance()

    useEffect(() => {
        setIsARSupported(arvrManager.isARSupported())
        setIsVRSupported(arvrManager.isVRSupported())

        const checkStatus = () => {
            setIsARActive(arvrManager.isARActive())
            setIsVRActive(arvrManager.isVRActive())
            setHandTracking(arvrManager.getHandTracking())
        }

        const interval = setInterval(checkStatus, 1000)
        return () => clearInterval(interval)
    }, [arvrManager])

    return {
        isARSupported,
        isVRSupported,
        isARActive,
        isVRActive,
        handTracking,
        addARMarker: arvrManager.addARMarker.bind(arvrManager),
        removeARMarker: arvrManager.removeARMarker.bind(arvrManager),
        addVRObject: arvrManager.addVRObject.bind(arvrManager),
        removeVRObject: arvrManager.removeVRObject.bind(arvrManager),
        addGesture: arvrManager.addGesture.bind(arvrManager),
        enableSpatialAudio: arvrManager.enableSpatialAudio.bind(arvrManager),
        addAudioSource: arvrManager.addAudioSource.bind(arvrManager),
        performHitTest: arvrManager.performHitTest.bind(arvrManager),
        detectPlanes: arvrManager.detectPlanes.bind(arvrManager),
        estimateLighting: arvrManager.estimateLighting.bind(arvrManager)
    }
}

// Export singleton instance
export const arvrManager = ARVRManager.getInstance()

// Example usage:
/*
import { ARView, VRView, useARVR } from "~ar-vr-interface"

function ARVRComponent() {
  const {
    isARSupported,
    isVRSupported,
    handTracking,
    addARMarker,
    addVRObject,
    addGesture
  } = useARVR()
  
  useEffect(() => {
    // Add gesture recognition
    addGesture({
      name: 'wave',
      pattern: 'wave_pattern',
      confidence: 0.8,
      callback: () => console.log('User waved!')
    })
  }, [])
  
  return (
    <div>
      <h2>AR/VR Interface</h2>
      
      {isARSupported && (
        <ARView
          onMarkerClick={(markerId) => console.log('Marker clicked:', markerId)}
          onPlaneDetected={(plane) => console.log('Plane detected:', plane)}
        />
      )}
      
      {isVRSupported && (
        <VRView
          onObjectInteraction={(objectId, interaction) => 
            console.log('Object interaction:', objectId, interaction)
          }
        />
      )}
      
      {handTracking && (
        <HandTrackingVisualizer handTracking={handTracking} />
      )}
    </div>
  )
}
*/