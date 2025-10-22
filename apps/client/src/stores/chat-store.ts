import { defineStore, acceptHMRUpdate } from 'pinia';
import { api } from 'boot/axios';
import { Notify } from 'quasar';
import { useAuthStore } from './auth-store';

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  sender: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    nickName: string;
    fullName: string;
  };
  chatId: number;
  replyToMessage?: {
    id: number;
    content: string;
    sender: {
      id: number;
      fullName: string;
    };
  } | null;
  editedAt: string | null;
  createdAt: string;
  // Message status
  status?: {
    sent?: boolean;
    delivered?: boolean;
    read?: boolean;
    deliveredAt?: string;
    readAt?: string;
  };
}

export interface Chat {
  id: number;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  lastMessage: {
    id: number;
    content: string;
    senderId: number;
    senderName: string;
    createdAt: string;
  } | null;
  updatedAt: string;
}

export interface ChatDetails {
  id: number;
  type: 'direct' | 'group';
  name: string;
  participants: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    nickName: string;
    fullName: string;
    role: 'member' | 'admin' | 'owner';
  }[];
  createdAt: string;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: Record<string, string>;
}

export interface MessagesResponse {
  success: boolean;
  data: ChatMessage[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasMorePages: boolean;
  };
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [] as Chat[],
    currentChat: null as ChatDetails | null,
    currentMessages: [] as ChatMessage[],
    isLoading: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    messagesPagination: {
      currentPage: 1,
      hasMorePages: false,
      total: 0,
    },
  }),

  getters: {
    getChatById: (state) => (id: number) => {
      return state.chats.find((chat) => chat.id === id);
    },
    getMessageById: (state) => (id: number) => {
      return state.currentMessages.find((message) => message.id === id);
    },
  },

  actions: {
    async startChat(userId: number) {
      this.isLoading = true;
      try {
        const response = await api.post<ChatResponse>(`/api/chats/start/${userId}`);

        if (response.data.success && response.data.data) {
          await this.fetchChats();

          return {
            success: true,
            chatId: response.data.data.id,
          };
        } else {
          return { success: false, message: response.data.message };
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to start chat';
        Notify.create({
          type: 'negative',
          message,
        });
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchChats() {
      this.isLoading = true;
      try {
        const response = await api.get<{ success: boolean; data: Chat[] }>('/api/chats');

        console.log(response);

        if (response.data.success) {
          this.chats = response.data.data;

          console.log(this.chats);
        }
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch chats',
        });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchChatDetails(chatId: number) {
      this.isLoading = true;
      try {
        const response = await api.get<{ success: boolean; data: ChatDetails }>(
          `/api/chats/${chatId}`,
        );

        if (response.data.success) {
          this.currentChat = response.data.data;
          return true;
        }
        return false;
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch chat details',
        });
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMessages(chatId: number, page: number = 1) {
      this.isLoadingMessages = true;
      try {
        const response = await api.get<MessagesResponse>(`/api/chats/${chatId}/messages`, {
          params: { page, limit: 50 },
        });

        if (response.data.success) {
          console.log('API Response for messages:', response.data);
          console.log('response.data.data:', response.data.data);
          console.log('response.data.meta:', response.data.meta);

          const messages = response.data.data || [];
          console.log('Parsed messages array:', messages);

          if (page === 1) {
            this.currentMessages = messages;
          } else {
            this.currentMessages = [...messages, ...this.currentMessages];
          }

          this.messagesPagination = {
            currentPage: response.data.meta?.currentPage || 1,
            hasMorePages: response.data.meta?.hasMorePages || false,
            total: response.data.meta?.total || 0,
          };

          return true;
        }
        return false;
      } catch (error: any) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch messages',
        });
        return false;
      } finally {
        this.isLoadingMessages = false;
      }
    },

    async sendMessage(chatId: number, content: string) {
      this.isSendingMessage = true;
      try {
        const response = await api.post<{ success: boolean; data: ChatMessage }>(
          `/api/chats/${chatId}/messages`,
          {
            content,
          },
        );

        if (response.data.success) {
          this.currentMessages.push(response.data.data);

          console.log(this.chats);

          const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);

          console.log(chatIndex);
          if (chatIndex !== -1) {
            console.log(this.chats);
            this.chats[chatIndex].lastMessage = {
              id: response.data.data.id,
              content: response.data.data.content,
              senderId: response.data.data.senderId,
              senderName: response.data.data.sender.fullName,
              createdAt: response.data.data.createdAt,
            };
            this.chats[chatIndex].updatedAt = new Date().toISOString();

            this.chats.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
          }

          return { success: true };
        } else {
          return { success: false, message: 'Failed to send message' };
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to send message';
        Notify.create({
          type: 'negative',
          message,
        });
        return { success: false, message };
      } finally {
        this.isSendingMessage = false;
      }
    },

    async markMessageAsRead(messageId: number) {
      try {
        await api.put(`/api/chats/messages/${messageId}/read`);

        // Update the message status in the store immediately
        this.updateMessageStatus(messageId, {
          read: true,
          readAt: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Failed to mark message as read:', error);
      }
    },

    async addMessageFromRealTime(message: ChatMessage) {
      this.currentMessages.push(message);

      // If this is a message from someone else, mark it as delivered immediately
      const authStore = useAuthStore();
      if (message.senderId !== authStore.user?.id) {
        try {
          await api.put(`/api/chats/messages/${message.id}/delivered`);
        } catch (error) {
          console.error('Failed to mark message as delivered:', error);
        }
      }

      const chatIndex = this.chats.findIndex((chat) => chat.id === message.chatId);
      if (chatIndex !== -1) {
        const chat = this.chats[chatIndex];
        if (chat) {
          chat.lastMessage = {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: message.sender.fullName,
            createdAt: message.createdAt,
          };
          chat.updatedAt = new Date().toISOString();
        }

        this.chats.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      }
    },

    setCurrentChat(chat: ChatDetails | null) {
      this.currentChat = chat;
      if (!chat) {
        this.currentMessages = [];
        this.messagesPagination = {
          currentPage: 1,
          hasMorePages: false,
          total: 0,
        };
      }
    },

    clearCurrentMessages() {
      this.currentMessages = [];
      this.messagesPagination = {
        currentPage: 1,
        hasMorePages: false,
        total: 0,
      };
    },

    updateMessageStatus(messageId: number, status: Partial<NonNullable<ChatMessage['status']>>) {
      console.log(`🔄 Updating status for message ${messageId}:`, status);
      const messageIndex = this.currentMessages.findIndex((msg) => msg.id === messageId);
      if (messageIndex !== -1) {
        const currentMessage = this.currentMessages[messageIndex];
        if (currentMessage) {
          console.log(`📝 Current message status:`, currentMessage.status);

          // Create new status object
          const newStatus = {
            sent: currentMessage.status?.sent || false,
            delivered: currentMessage.status?.delivered || false,
            read: currentMessage.status?.read || false,
            ...currentMessage.status,
            ...status,
          };

          console.log(`✨ New message status:`, newStatus);

          // Use Vue 3 reactivity - directly modify the array element
          this.currentMessages[messageIndex] = {
            ...currentMessage,
            status: newStatus,
          };

          console.log(`✅ Updated message in store:`, this.currentMessages[messageIndex]);
        }
      } else {
        console.warn(`⚠️ Message ${messageId} not found in current messages`);
      }
    },

    handleMessageDelivered(data: { messageId: number; deliveredTo: number; deliveredAt: string }) {
      console.log('📨 Message delivered:', data);
      this.updateMessageStatus(data.messageId, {
        delivered: true,
        deliveredAt: data.deliveredAt,
      });
    },

    handleMessageRead(data: { messageId: number; readBy: number; readAt: string }) {
      console.log('👀 Message read:', data);
      this.updateMessageStatus(data.messageId, {
        read: true,
        readAt: data.readAt,
      });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
