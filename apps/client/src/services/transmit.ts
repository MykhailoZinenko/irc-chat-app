import { io } from 'socket.io-client';

type MessageHandler = (message: any) => void;

class SocketService {
  // Use loose typing to avoid bundler type resolution issues in tooling
  private socket: any = null;
  private connectionMode: 'online' | 'offline' = 'online';
  private channelHandlers: Map<number, MessageHandler[]> = new Map();
  private userHandlers: Map<number, MessageHandler[]> = new Map();
  private pendingChannelSubs: Set<number> = new Set();
  private authToken: string | null = null;
  private pendingConnectPromise: Promise<void> | null = null;

  private ensureConnected() {
    if (this.connectionMode === 'offline') {
      return;
    }

    if (this.socket && this.socket.connected) {
      return;
    }

    const token = this.authToken || localStorage.getItem('auth_token') || undefined;
    if (!token) {
      return;
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

    const authOptions = token ? { auth: { token: `Bearer ${token}` } } : {};

    this.socket = io(baseURL, {
      autoConnect: true,
      transports: ['websocket'],
      ...authOptions,
    });

    this.socket.on('connect', () => {
      this.resubscribe();
    });

    this.socket.on('event', (payload: any) => {
      this.dispatch(payload);
    });
  }

  setConnectionMode(mode: 'online' | 'offline') {
    this.connectionMode = mode;

    if (mode === 'offline') {
      this.pendingConnectPromise = null;
      if (this.socket) {
        this.socket.off('connect');
        this.socket.off('connect_error');
        this.socket.disconnect();
      }
      return;
    }

    this.ensureConnected();
  }

  private waitForConnection(timeoutMs = 5000) {
    if (this.connectionMode === 'offline') {
      return Promise.reject(new Error('You are offline. Switch status to go online.'));
    }

    if (this.socket?.connected) return Promise.resolve();

    if (this.pendingConnectPromise) return this.pendingConnectPromise;

    this.pendingConnectPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingConnectPromise = null;
        reject(new Error('Socket connection timeout'));
      }, timeoutMs);

      this.socket?.once('connect', () => {
        clearTimeout(timer);
        this.pendingConnectPromise = null;
        resolve();
      });

      this.socket?.once('connect_error', (err: any) => {
        clearTimeout(timer);
        this.pendingConnectPromise = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });

    return this.pendingConnectPromise;
  }

  async emit<T = any>(
    event: string,
    payload?: any,
    options: { timeoutMs?: number } = {},
  ): Promise<T> {
    if (this.connectionMode === 'offline') {
      return Promise.reject(new Error('You are offline. Switch status to online or DND to reconnect.'));
    }

    this.ensureConnected();
    await this.waitForConnection();

    const timeoutMs = options.timeoutMs ?? 8000;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeoutMs);

      this.socket.emit(event, payload, (response: any) => {
        clearTimeout(timer);
        if (response && response.ok === false) {
          return reject(new Error(response.message || 'Request failed'));
        }
        if (response && response.ok === true) {
          return resolve(response.data as T);
        }
        // Fallback for handlers that might return raw data
        resolve(response as T);
      });
    });
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (this.socket) {
      if (token) {
        this.socket.auth = { token: `Bearer ${token}` };
      } else {
        delete this.socket.auth;
      }
      this.socket.disconnect();
      if (this.connectionMode === 'online') {
        this.socket.connect();
      }
    } else if (token && this.connectionMode === 'online') {
      this.ensureConnected();
    }
  }

  subscribeToChannel(channelId: number, handler: MessageHandler) {
    this.ensureConnected();
    const existing = this.channelHandlers.get(channelId) || [];
    this.channelHandlers.set(channelId, [...existing, handler]);
    this.joinChannels([channelId]);
    return { unsubscribe: () => this.unsubscribeFromChannel(channelId, handler) };
  }

  unsubscribeFromChannel(channelId: number, handler?: MessageHandler) {
    const handlers = this.channelHandlers.get(channelId) || [];
    if (handler) {
      const filtered = handlers.filter((h) => h !== handler);
      if (filtered.length === 0) {
        this.channelHandlers.delete(channelId);
        this.leaveChannels([channelId]);
      } else {
        this.channelHandlers.set(channelId, filtered);
      }
    } else {
      this.channelHandlers.delete(channelId);
      this.leaveChannels([channelId]);
    }
  }

  subscribeToUser(userId: number, handler: MessageHandler) {
    this.ensureConnected();
    const existing = this.userHandlers.get(userId) || [];
    this.userHandlers.set(userId, [...existing, handler]);
    // Personal rooms are joined server-side on connect; just keep handler list
    return { unsubscribe: () => this.unsubscribeFromUser(userId, handler) };
  }

  unsubscribeFromUser(userId: number, handler?: MessageHandler) {
    const handlers = this.userHandlers.get(userId) || [];
    if (handler) {
      const filtered = handlers.filter((h) => h !== handler);
      if (filtered.length === 0) {
        this.userHandlers.delete(userId);
      } else {
        this.userHandlers.set(userId, filtered);
      }
    } else {
      this.userHandlers.delete(userId);
    }
  }

  unsubscribeAll() {
    this.channelHandlers.clear();
    this.userHandlers.clear();
    this.pendingChannelSubs.clear();
    this.pendingConnectPromise = null;
    if (this.socket) {
      this.socket.off('event');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private joinChannels(channelIds: number[]) {
    if (!this.socket || !this.socket.connected) {
      channelIds.forEach((id) => this.pendingChannelSubs.add(id));
      return;
    }
    this.socket.emit('subscribe:channels', channelIds);
  }

  private leaveChannels(channelIds: number[]) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('unsubscribe:channels', channelIds);
  }

  private resubscribe() {
    const channelIds = Array.from(this.channelHandlers.keys());
    if (channelIds.length && this.socket) {
      this.socket.emit('subscribe:channels', channelIds);
    }
    if (this.pendingChannelSubs.size && this.socket) {
      this.socket.emit('subscribe:channels', Array.from(this.pendingChannelSubs));
      this.pendingChannelSubs.clear();
    }
  }

  private dispatch(payload: any) {
    const channelId = payload?.data?.channelId ?? payload?.channelId;
    if (channelId !== undefined) {
      const handlers = this.channelHandlers.get(Number(channelId)) || [];
      handlers.forEach((h) => h(payload));
    }

    this.userHandlers.forEach((handlers) => {
      handlers.forEach((h) => h(payload));
    });
  }
}

export const transmitService = new SocketService();
