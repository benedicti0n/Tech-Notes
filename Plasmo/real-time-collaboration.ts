// Real-time Collaboration System for Plasmo Extensions

export interface CollaborationUser {
    id: string
    name: string
    email: string
    avatar?: string
    color: string
    cursor?: { x: number; y: number }
    selection?: { start: number; end: number }
    lastSeen: number
    status: 'online' | 'away' | 'offline'
}

export interface CollaborationRoom {
    id: string
    name: string
    description?: string
    users: CollaborationUser[]
    createdAt: number
    updatedAt: number
    permissions: {
        canEdit: string[]
        canView: string[]
        isPublic: boolean
    }
}

export interface CollaborationMessage {
    id: string
    type: 'text' | 'cursor' | 'selection' | 'edit' | 'system' | 'reaction'
    userId: string
    roomId: string
    content: any
    timestamp: number
    metadata?: Record<string, any>
}

export interface CollaborationEdit {
    id: string
    type: 'insert' | 'delete' | 'replace'
    position: number
    content: string
    length?: number
    userId: string
    timestamp: number
}

export interface WebRTCConnection {
    peerId: string
    connection: RTCPeerConnection
    dataChannel: RTCDataChannel
    status: 'connecting' | 'connected' | 'disconnected' | 'failed'
}

class CollaborationManager {
    private static instance: CollaborationManager
    private websocket: WebSocket | null = null
    private currentUser: CollaborationUser | null = null
    private currentRoom: CollaborationRoom | null = null
    private users: Map<string, CollaborationUser> = new Map()
    private messages: CollaborationMessage[] = []
    private edits: CollaborationEdit[] = []
    private webrtcConnections: Map<string, WebRTCConnection> = new Map()
    private eventListeners: Map<string, Function[]> = new Map()
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private heartbeatInterval: NodeJS.Timeout | null = null

    static getInstance(): CollaborationManager {
        if (!CollaborationManager.instance) {
            CollaborationManager.instance = new CollaborationManager()
        }
        return CollaborationManager.instance
    }

    // Connection Management
    async connect(serverUrl: string, authToken: string): Promise<boolean> {
        try {
            this.websocket = new WebSocket(`${serverUrl}?token=${authToken}`)

            this.websocket.onopen = () => {
                console.log('🔗 Connected to collaboration server')
                this.reconnectAttempts = 0
                this.startHeartbeat()
                this.emit('connected')
            }

            this.websocket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data))
            }

            this.websocket.onclose = (event) => {
                console.log('🔌 Disconnected from collaboration server')
                this.stopHeartbeat()
                this.emit('disconnected', event)

                if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnect(serverUrl, authToken)
                }
            }

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error)
                this.emit('error', error)
            }

            return true
        } catch (error) {
            console.error('Failed to connect:', error)
            return false
        }
    }

    private async reconnect(serverUrl: string, authToken: string): Promise<void> {
        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

        setTimeout(() => {
            this.connect(serverUrl, authToken)
        }, delay)
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping', timestamp: Date.now() })
            }
        }, 30000) // 30 seconds
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }
    }

    disconnect(): void {
        if (this.websocket) {
            this.websocket.close(1000, 'User disconnected')
            this.websocket = null
        }
        this.stopHeartbeat()
        this.webrtcConnections.clear()
    }

    // User Management
    async setCurrentUser(user: Omit<CollaborationUser, 'lastSeen' | 'status'>): Promise<void> {
        this.currentUser = {
            ...user,
            lastSeen: Date.now(),
            status: 'online'
        }

        this.send({
            type: 'user_update',
            user: this.currentUser
        })
    }

    getCurrentUser(): CollaborationUser | null {
        return this.currentUser
    }

    getUsers(): CollaborationUser[] {
        return Array.from(this.users.values())
    }

    updateUserCursor(x: number, y: number): void {
        if (!this.currentUser) return

        this.currentUser.cursor = { x, y }
        this.send({
            type: 'cursor_update',
            userId: this.currentUser.id,
            cursor: { x, y }
        })
    }

    updateUserSelection(start: number, end: number): void {
        if (!this.currentUser) return

        this.currentUser.selection = { start, end }
        this.send({
            type: 'selection_update',
            userId: this.currentUser.id,
            selection: { start, end }
        })
    }

    // Room Management
    async createRoom(name: string, description?: string): Promise<CollaborationRoom | null> {
        if (!this.currentUser) return null

        const room: CollaborationRoom = {
            id: this.generateId(),
            name,
            description,
            users: [this.currentUser],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            permissions: {
                canEdit: [this.currentUser.id],
                canView: [this.currentUser.id],
                isPublic: false
            }
        }

        this.send({
            type: 'room_create',
            room
        })

        return room
    }

    async joinRoom(roomId: string): Promise<boolean> {
        if (!this.currentUser) return false

        this.send({
            type: 'room_join',
            roomId,
            userId: this.currentUser.id
        })

        return true
    }

    async leaveRoom(): Promise<void> {
        if (!this.currentRoom || !this.currentUser) return

        this.send({
            type: 'room_leave',
            roomId: this.currentRoom.id,
            userId: this.currentUser.id
        })

        this.currentRoom = null
        this.users.clear()
    }

    getCurrentRoom(): CollaborationRoom | null {
        return this.currentRoom
    }

    // Messaging
    sendMessage(content: string, type: 'text' | 'system' = 'text'): void {
        if (!this.currentUser || !this.currentRoom) return

        const message: CollaborationMessage = {
            id: this.generateId(),
            type,
            userId: this.currentUser.id,
            roomId: this.currentRoom.id,
            content,
            timestamp: Date.now()
        }

        this.messages.push(message)
        this.send({
            type: 'message',
            message
        })

        this.emit('message', message)
    }

    sendReaction(messageId: string, emoji: string): void {
        if (!this.currentUser || !this.currentRoom) return

        const reaction: CollaborationMessage = {
            id: this.generateId(),
            type: 'reaction',
            userId: this.currentUser.id,
            roomId: this.currentRoom.id,
            content: { messageId, emoji },
            timestamp: Date.now()
        }

        this.send({
            type: 'reaction',
            reaction
        })
    }

    getMessages(): CollaborationMessage[] {
        return [...this.messages]
    }

    // Collaborative Editing
    sendEdit(edit: Omit<CollaborationEdit, 'id' | 'userId' | 'timestamp'>): void {
        if (!this.currentUser || !this.currentRoom) return

        const fullEdit: CollaborationEdit = {
            ...edit,
            id: this.generateId(),
            userId: this.currentUser.id,
            timestamp: Date.now()
        }

        this.edits.push(fullEdit)
        this.send({
            type: 'edit',
            edit: fullEdit
        })

        this.emit('edit', fullEdit)
    }

    getEdits(): CollaborationEdit[] {
        return [...this.edits]
    }

    // Operational Transform for conflict resolution
    transformEdit(edit: CollaborationEdit, againstEdit: CollaborationEdit): CollaborationEdit {
        if (edit.timestamp <= againstEdit.timestamp) {
            return edit // Edit happened first, no transformation needed
        }

        const transformed = { ...edit }

        switch (againstEdit.type) {
            case 'insert':
                if (edit.position >= againstEdit.position) {
                    transformed.position += againstEdit.content.length
                }
                break

            case 'delete':
                if (edit.position > againstEdit.position) {
                    transformed.position -= againstEdit.length || 0
                }
                break

            case 'replace':
                if (edit.position > againstEdit.position) {
                    const oldLength = againstEdit.length || 0
                    const newLength = againstEdit.content.length
                    transformed.position += newLength - oldLength
                }
                break
        }

        return transformed
    }

    // WebRTC for direct peer-to-peer communication
    async initializeWebRTC(peerId: string): Promise<boolean> {
        try {
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            })

            const dataChannel = peerConnection.createDataChannel('collaboration', {
                ordered: true
            })

            dataChannel.onopen = () => {
                console.log(`📡 WebRTC data channel opened with ${peerId}`)
                this.emit('webrtc_connected', peerId)
            }

            dataChannel.onmessage = (event) => {
                const data = JSON.parse(event.data)
                this.handleWebRTCMessage(peerId, data)
            }

            dataChannel.onclose = () => {
                console.log(`📡 WebRTC data channel closed with ${peerId}`)
                this.webrtcConnections.delete(peerId)
                this.emit('webrtc_disconnected', peerId)
            }

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.send({
                        type: 'webrtc_ice_candidate',
                        peerId,
                        candidate: event.candidate
                    })
                }
            }

            peerConnection.ondatachannel = (event) => {
                const channel = event.channel
                channel.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    this.handleWebRTCMessage(peerId, data)
                }
            }

            this.webrtcConnections.set(peerId, {
                peerId,
                connection: peerConnection,
                dataChannel,
                status: 'connecting'
            })

            // Create offer
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            this.send({
                type: 'webrtc_offer',
                peerId,
                offer
            })

            return true
        } catch (error) {
            console.error('Failed to initialize WebRTC:', error)
            return false
        }
    }

    private async handleWebRTCOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
        try {
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            })

            await peerConnection.setRemoteDescription(offer)

            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            this.send({
                type: 'webrtc_answer',
                peerId,
                answer
            })

            peerConnection.ondatachannel = (event) => {
                const dataChannel = event.channel

                this.webrtcConnections.set(peerId, {
                    peerId,
                    connection: peerConnection,
                    dataChannel,
                    status: 'connected'
                })

                dataChannel.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    this.handleWebRTCMessage(peerId, data)
                }
            }
        } catch (error) {
            console.error('Failed to handle WebRTC offer:', error)
        }
    }

    private async handleWebRTCAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        try {
            const connection = this.webrtcConnections.get(peerId)
            if (connection) {
                await connection.connection.setRemoteDescription(answer)
                connection.status = 'connected'
            }
        } catch (error) {
            console.error('Failed to handle WebRTC answer:', error)
        }
    }

    private async handleWebRTCIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
        try {
            const connection = this.webrtcConnections.get(peerId)
            if (connection) {
                await connection.connection.addIceCandidate(candidate)
            }
        } catch (error) {
            console.error('Failed to handle WebRTC ICE candidate:', error)
        }
    }

    private handleWebRTCMessage(peerId: string, data: any): void {
        console.log(`📡 WebRTC message from ${peerId}:`, data)
        this.emit('webrtc_message', { peerId, data })
    }

    sendWebRTCMessage(peerId: string, data: any): void {
        const connection = this.webrtcConnections.get(peerId)
        if (connection && connection.dataChannel.readyState === 'open') {
            connection.dataChannel.send(JSON.stringify(data))
        }
    }

    // Message Handling
    private handleMessage(data: any): void {
        switch (data.type) {
            case 'pong':
                // Heartbeat response
                break

            case 'user_joined':
                this.users.set(data.user.id, data.user)
                this.emit('user_joined', data.user)
                break

            case 'user_left':
                this.users.delete(data.userId)
                this.emit('user_left', data.userId)
                break

            case 'user_updated':
                this.users.set(data.user.id, data.user)
                this.emit('user_updated', data.user)
                break

            case 'room_joined':
                this.currentRoom = data.room
                data.room.users.forEach((user: CollaborationUser) => {
                    this.users.set(user.id, user)
                })
                this.emit('room_joined', data.room)
                break

            case 'message':
                this.messages.push(data.message)
                this.emit('message', data.message)
                break

            case 'edit':
                // Apply operational transform
                const transformedEdit = this.edits.reduce(
                    (edit, existingEdit) => this.transformEdit(edit, existingEdit),
                    data.edit
                )

                this.edits.push(transformedEdit)
                this.emit('edit', transformedEdit)
                break

            case 'cursor_update':
                const user = this.users.get(data.userId)
                if (user) {
                    user.cursor = data.cursor
                    this.emit('cursor_update', { userId: data.userId, cursor: data.cursor })
                }
                break

            case 'selection_update':
                const selectionUser = this.users.get(data.userId)
                if (selectionUser) {
                    selectionUser.selection = data.selection
                    this.emit('selection_update', { userId: data.userId, selection: data.selection })
                }
                break

            case 'webrtc_offer':
                this.handleWebRTCOffer(data.peerId, data.offer)
                break

            case 'webrtc_answer':
                this.handleWebRTCAnswer(data.peerId, data.answer)
                break

            case 'webrtc_ice_candidate':
                this.handleWebRTCIceCandidate(data.peerId, data.candidate)
                break

            default:
                console.log('Unknown message type:', data.type)
        }
    }

    private send(data: any): void {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(data))
        }
    }

    // Event System
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    private emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
            listeners.forEach(callback => callback(data))
        }
    }

    // Utility
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    }

    // Cleanup
    destroy(): void {
        this.disconnect()
        this.eventListeners.clear()
        this.users.clear()
        this.messages = []
        this.edits = []
    }
}

// React hook for collaboration
import { useEffect, useState } from "react"

export function useCollaboration() {
    const [isConnected, setIsConnected] = useState(false)
    const [currentRoom, setCurrentRoom] = useState<CollaborationRoom | null>(null)
    const [users, setUsers] = useState<CollaborationUser[]>([])
    const [messages, setMessages] = useState<CollaborationMessage[]>([])
    const collaboration = CollaborationManager.getInstance()

    useEffect(() => {
        const handleConnected = () => setIsConnected(true)
        const handleDisconnected = () => setIsConnected(false)
        const handleRoomJoined = (room: CollaborationRoom) => setCurrentRoom(room)
        const handleUserJoined = () => setUsers(collaboration.getUsers())
        const handleUserLeft = () => setUsers(collaboration.getUsers())
        const handleMessage = () => setMessages(collaboration.getMessages())

        collaboration.on('connected', handleConnected)
        collaboration.on('disconnected', handleDisconnected)
        collaboration.on('room_joined', handleRoomJoined)
        collaboration.on('user_joined', handleUserJoined)
        collaboration.on('user_left', handleUserLeft)
        collaboration.on('message', handleMessage)

        return () => {
            collaboration.off('connected', handleConnected)
            collaboration.off('disconnected', handleDisconnected)
            collaboration.off('room_joined', handleRoomJoined)
            collaboration.off('user_joined', handleUserJoined)
            collaboration.off('user_left', handleUserLeft)
            collaboration.off('message', handleMessage)
        }
    }, [collaboration])

    return {
        isConnected,
        currentRoom,
        users,
        messages,
        connect: collaboration.connect.bind(collaboration),
        disconnect: collaboration.disconnect.bind(collaboration),
        setCurrentUser: collaboration.setCurrentUser.bind(collaboration),
        createRoom: collaboration.createRoom.bind(collaboration),
        joinRoom: collaboration.joinRoom.bind(collaboration),
        leaveRoom: collaboration.leaveRoom.bind(collaboration),
        sendMessage: collaboration.sendMessage.bind(collaboration),
        sendEdit: collaboration.sendEdit.bind(collaboration),
        updateUserCursor: collaboration.updateUserCursor.bind(collaboration),
        updateUserSelection: collaboration.updateUserSelection.bind(collaboration)
    }
}

// Export singleton instance
export const collaborationManager = CollaborationManager.getInstance()

// Example usage:
/*
import { useCollaboration } from "~real-time-collaboration"

function CollaborationComponent() {
  const {
    isConnected,
    currentRoom,
    users,
    messages,
    connect,
    joinRoom,
    sendMessage
  } = useCollaboration()
  
  const [messageInput, setMessageInput] = useState("")
  
  useEffect(() => {
    connect('wss://collaboration-server.com', 'auth-token')
  }, [])
  
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput)
      setMessageInput("")
    }
  }
  
  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Room: {currentRoom?.name || 'None'}</div>
      <div>Users: {users.length}</div>
      
      <div>
        {messages.map(message => (
          <div key={message.id}>
            <strong>{users.find(u => u.id === message.userId)?.name}:</strong>
            {message.content}
          </div>
        ))}
      </div>
      
      <input
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  )
}
*/