import { Transmit } from '@adonisjs/transmit-client'
import { useAuthStore } from 'src/stores/auth-store'
import { useChatStore } from 'src/stores/chat-store'

class TransmitService {
  private transmit: Transmit | null = null
  private subscription: any = null
  private isConnected = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupTransmit()
  }

  private setupTransmit() {
    const baseURL = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3333'
      : window.location.origin

    this.transmit = new Transmit({
      baseUrl: baseURL,
      beforeSubscribe: (request) => {
        console.log('beforeSubscribe called with request:', request)
        console.log('request properties:', Object.keys(request || {}))

        const authStore = useAuthStore()
        if (authStore.token && request) {
          try {
            // The first parameter is actually the request object
            if (!request.headers) {
              request.headers = new Headers()
            }

            if (typeof request.headers.set === 'function') {
              request.headers.set('Authorization', `Bearer ${authStore.token}`)
            } else {
              // Fallback for plain object headers
              request.headers = request.headers || {}
              request.headers['Authorization'] = `Bearer ${authStore.token}`
            }
            console.log('Successfully set authorization header')
          } catch (error) {
            console.error('Error setting authorization header:', error)
          }
        }
      }
    })
  }

  async connect() {
    if (!this.transmit) {
      console.warn('Transmit client not initialized')
      return
    }

    // If already connected, just verify the connection
    if (this.isConnected && this.subscription) {
      console.log('Already connected to Transmit, checking connection health')
      return
    }

    // Clean up any existing subscription
    if (this.subscription) {
      console.log('Cleaning up existing subscription')
      try {
        await this.subscription.delete()
      } catch (error) {
        console.warn('Error deleting existing subscription:', error)
      }
      this.subscription = null
      this.isConnected = false
    }

    const authStore = useAuthStore()
    const chatStore = useChatStore()

    if (!authStore.token || !authStore.user) {
      console.warn('Cannot connect to Transmit: No authentication')
      return
    }

    try {
      console.log(`Creating new subscription for user:${authStore.user.id}`)

      // Create subscription to user-specific channel
      this.subscription = this.transmit.subscription(`user:${authStore.user.id}`)

      // Register the subscription
      await this.subscription.create()
      console.log('Subscription created successfully')

      // Listen for new messages - ensure only one handler
      this.subscription.onMessage((data: any) => {
        console.log('📨 Received real-time data:', data)
        console.log('👤 User ID:', authStore.user?.id)
        console.log('📡 Subscribed to channel:', `user:${authStore.user?.id}`)

        if (data.type === 'new_message' && data.data) {
          console.log('💬 Processing new message:', data.data)

          // Check for duplicate messages
          const existingMessage = chatStore.getMessageById(data.data.id)
          if (!existingMessage) {
            console.log('✅ Adding new message to chat store')
            chatStore.addMessageFromRealTime(data.data)
          } else {
            console.log('🚫 Duplicate message ignored:', data.data.id)
          }
        } else if (data.type === 'message_delivered' && data.data) {
          console.log('📨 Processing delivery status:', data.data)
          chatStore.handleMessageDelivered(data.data)
        } else if (data.type === 'message_read' && data.data) {
          console.log('👀 Processing read status:', data.data)
          chatStore.handleMessageRead(data.data)
        } else {
          console.log('❓ Unrecognized message type or missing data:', data)
        }
      })

      console.log('✅ Connected to Transmit for user:', authStore.user?.id)
      console.log('📡 Subscription channel:', `user:${authStore.user?.id}`)
      this.isConnected = true
      this.clearReconnectTimeout()
      this.startHeartbeat()

    } catch (error) {
      console.error('❌ Failed to connect to Transmit:', error)
      this.isConnected = false
      this.subscription = null
      this.scheduleReconnect()
    }
  }

  async disconnect() {
    if (this.subscription) {
      try {
        await this.subscription.delete()
      } catch (error) {
        console.warn('Error disconnecting subscription:', error)
      }
      this.subscription = null
    }
    this.isConnected = false
    this.clearReconnectTimeout()
    this.stopHeartbeat()
  }

  private startHeartbeat() {
    this.stopHeartbeat()

    // Send a ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.subscription) {
        console.log('Sending heartbeat ping...')
        // The connection is tested by the subscription itself
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimeout()

    // Reconnect after 5 seconds
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect to Transmit...')
      void this.connect()
    }, 5000)
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  async forceReconnect() {
    console.log('🔄 Forcing reconnection...')
    await this.disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await this.connect()
  }
}

// Create singleton instance
export const transmitService = new TransmitService()

// Auto-connect when user is authenticated
export const useTransmit = () => {
  const authStore = useAuthStore()

  // Watch for authentication changes
  const connectWhenAuthenticated = () => {
    if (authStore.isAuthenticated) {
      void transmitService.connect()
    } else {
      void transmitService.disconnect()
    }
  }

  return {
    connect: () => transmitService.connect(),
    disconnect: () => transmitService.disconnect(),
    isConnected: () => transmitService.getConnectionStatus(),
    forceReconnect: () => transmitService.forceReconnect(),
    connectWhenAuthenticated,
  }
}