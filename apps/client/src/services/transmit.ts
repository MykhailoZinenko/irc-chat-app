import { Transmit } from '@adonisjs/transmit-client'

type MessageHandler = (message: any) => void
type Subscription = ReturnType<ReturnType<typeof Transmit>['subscription']>

class TransmitService {
  private client: ReturnType<typeof Transmit> | null = null
  private subscriptions: Map<string, Subscription> = new Map()
  private handlers: Map<string, MessageHandler[]> = new Map()

  initialize() {
    if (!this.client) {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'
      this.client = new Transmit({ baseUrl: baseURL })
    }
    return this.client
  }

  /**
   * Subscribe to a channel's updates
   */
  subscribeToChannel(channelId: number, handler: MessageHandler) {
    const channelName = `channels/${channelId}`
    const client = this.initialize()

    let subscription = this.subscriptions.get(channelName)

    if (!subscription) {
      subscription = client.subscription(channelName)
      this.subscriptions.set(channelName, subscription)

      subscription.create()

      subscription.onMessage((message) => {
        const handlers = this.handlers.get(channelName) || []
        handlers.forEach((h) => h(message))
      })
    }

    const handlers = this.handlers.get(channelName) || []
    handlers.push(handler)
    this.handlers.set(channelName, handlers)

    return {
      unsubscribe: () => this.unsubscribeFromChannel(channelId, handler),
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribeFromChannel(channelId: number, handler?: MessageHandler) {
    const channelName = `channels/${channelId}`

    if (handler) {
      const handlers = this.handlers.get(channelName) || []
      const filtered = handlers.filter((h) => h !== handler)

      if (filtered.length > 0) {
        this.handlers.set(channelName, filtered)
        return
      } else {
        this.handlers.delete(channelName)
      }
    } else {
      this.handlers.delete(channelName)
    }

    const subscription = this.subscriptions.get(channelName)
    if (subscription) {
      subscription.delete()
      this.subscriptions.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.delete()
    })
    this.subscriptions.clear()
    this.handlers.clear()
  }

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys())
  }
}

// Export singleton instance
export const transmitService = new TransmitService()
