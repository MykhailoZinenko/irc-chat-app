import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';
import { transmitService } from '@/services/transmit';

export interface MessageStatus {
  sent?: boolean;
  delivered?: boolean;
  read?: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export interface ChannelMessage {
  id: number;
  content: string;
  senderId: number;
  sender: {
    id: number;
    fullName: string | null;
    nickName: string | null;
  };
  channelId: number;
  createdAt: string;
  status?: MessageStatus;
}

interface MessagesByChannel {
  [channelId: number]: ChannelMessage[];
}

export const useMessageStore = defineStore('message', () => {
  const messagesByChannel = ref<MessagesByChannel>({});
  const currentChannelId = ref<number | null>(null);
  const loading = ref(false);
  const sending = ref(false);
  const messagesVersion = ref(0); // Increment this whenever messages change

  const currentMessages = computed(() => {
    if (!currentChannelId.value) return [];
    return messagesByChannel.value[currentChannelId.value] || [];
  });

  const setCurrentChannel = (channelId: number | null) => {
    currentChannelId.value = channelId;
  };

  const fetchMessages = async (channelId: number, page: number = 1, limit: number = 50) => {
    loading.value = true;
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          messages: ChannelMessage[];
          meta: {
            total: number;
            perPage: number;
            currentPage: number;
            lastPage: number;
          };
        };
      }>(`/api/channels/${channelId}/messages`, {
        params: { page, limit },
      });

      if (response.data.success) {
        // Messages come in DESC order (newest first), reverse for chronological display
        const messages = response.data.data.messages.reverse();

        if (page === 1) {
          // First page: replace all messages
          messagesByChannel.value[channelId] = messages;
        } else {
          const existing = messagesByChannel.value[channelId] || [];
          messagesByChannel.value[channelId] = [...messages, ...existing];
        }
        messagesVersion.value++;

        return {
          success: true,
          hasMore: response.data.data.meta.currentPage < response.data.data.meta.lastPage,
        };
      }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to fetch messages',
      });
      return { success: false, hasMore: false };
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (channelId: number, content: string) => {
    sending.value = true;
    try {
      const message = await transmitService.emit<ChannelMessage>('message:send', { channelId, content });
      addMessageFromRealTime(message);
      return { success: true, message };
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error?.message || error.response?.data?.message || 'Failed to send message',
      });
      return { success: false };
    } finally {
      sending.value = false;
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await transmitService.emit('message:markRead', { messageId });
    } catch (error: any) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const markMessageAsDelivered = async (messageId: number) => {
    try {
      await transmitService.emit('message:markDelivered', { messageId });
    } catch (error: any) {
      console.error('Failed to mark message as delivered:', error);
    }
  };

  // Add message from real-time WebSocket event
  const addMessageFromRealTime = (message: ChannelMessage) => {
    const channelMessages = messagesByChannel.value[message.channelId] || [];

    // Check if message already exists
    const exists = channelMessages.some((m) => m.id === message.id);
    if (exists) {
      // Update existing message
      const index = channelMessages.findIndex((m) => m.id === message.id);
      channelMessages[index] = message;
      messagesByChannel.value[message.channelId] = [...channelMessages];
    } else {
      // Add new message to the end
      messagesByChannel.value[message.channelId] = [...channelMessages, message];
    }
    messagesVersion.value++;
  };

  // Update message status (for read/delivered updates)
  const updateMessageStatus = (
    channelId: number,
    messageId: number,
    status: Partial<MessageStatus>,
  ) => {
    const channelMessages = messagesByChannel.value[channelId];
    if (!channelMessages) return;

    const message = channelMessages.find((m) => m.id === messageId);
    if (message) {
      message.status = { ...message.status, ...status };
      // Force reactivity update
      messagesByChannel.value[channelId] = [...channelMessages];
    }
  };

  // Handle message_delivered WebSocket event
  const handleMessageDelivered = (data: {
    messageId: number;
    deliveredTo: number;
    deliveredAt: string;
  }) => {
    // Find which channel this message belongs to
    for (const channelId in messagesByChannel.value) {
      const messages = messagesByChannel.value[channelId]!;
      const message = messages.find((m) => m.id === data.messageId);
      if (message) {
        updateMessageStatus(Number(channelId), data.messageId, {
          delivered: true,
          deliveredAt: data.deliveredAt,
        });
        break;
      }
    }
  };

  // Handle message_read WebSocket event
  const handleMessageRead = (data: { messageId: number; readBy: number; readAt: string }) => {
    // Find which channel this message belongs to
    for (const channelId in messagesByChannel.value) {
      const messages = messagesByChannel.value[channelId]!;
      const message = messages.find((m) => m.id === data.messageId);
      if (message) {
        updateMessageStatus(Number(channelId), data.messageId, {
          read: true,
          readAt: data.readAt,
        });
        break;
      }
    }
  };

  // Get unread count for a channel
  const getUnreadCount = (channelId: number, currentUserId: number): number => {
    const messages = messagesByChannel.value[channelId];
    if (!messages || messages.length === 0) return 0;

    let count = 0;
    // Count unread messages from the latest backwards until we hit a read message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (!message) continue;

      // Skip own messages
      if (message.senderId === currentUserId) continue;

      // If message is read, stop counting
      if (message.status?.read) break;

      // Count this unread message
      count++;
    }

    return count;
  };

  // Clear messages for a channel (useful when leaving)
  const clearChannelMessages = (channelId: number) => {
    delete messagesByChannel.value[channelId];
  };

  return {
    messagesByChannel,
    currentChannelId,
    currentMessages,
    loading,
    sending,
    messagesVersion,
    setCurrentChannel,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    markMessageAsDelivered,
    addMessageFromRealTime,
    updateMessageStatus,
    handleMessageDelivered,
    handleMessageRead,
    getUnreadCount,
    clearChannelMessages,
  };
});
