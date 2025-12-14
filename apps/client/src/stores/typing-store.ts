import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface TypingUser {
  id: number;
  nickName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  content: string; // Current typing content
}

interface TypingByChannel {
  [channelId: number]: Map<number, TypingUser>;
}

export const useTypingStore = defineStore('typing', () => {
  const typingByChannel = ref<TypingByChannel>({});

  const getTypingUsers = (channelId: number): TypingUser[] => {
    const channelTyping = typingByChannel.value[channelId];
    if (!channelTyping) return [];
    return Array.from(channelTyping.values());
  };

  const addTypingUser = (channelId: number, user: TypingUser) => {
    if (!typingByChannel.value[channelId]) {
      typingByChannel.value[channelId] = new Map();
    }
    typingByChannel.value[channelId].set(user.id, user);
    // Trigger reactivity - Vue doesn't track Map mutations
    typingByChannel.value = { ...typingByChannel.value };
  };

  const removeTypingUser = (channelId: number, userId: number) => {
    const channelTyping = typingByChannel.value[channelId];
    if (channelTyping) {
      channelTyping.delete(userId);
      if (channelTyping.size === 0) {
        delete typingByChannel.value[channelId];
      }
      // Trigger reactivity
      typingByChannel.value = { ...typingByChannel.value };
    }
  };

  const updateTypingContent = (channelId: number, userId: number, content: string) => {
    const channelTyping = typingByChannel.value[channelId];
    const user = channelTyping?.get(userId);
    if (user && channelTyping) {
      user.content = content;
      channelTyping.set(userId, { ...user });
      // Trigger reactivity
      typingByChannel.value = { ...typingByChannel.value };
    }
  };

  const clearChannel = (channelId: number) => {
    delete typingByChannel.value[channelId];
  };

  return {
    typingByChannel,
    getTypingUsers,
    addTypingUser,
    removeTypingUser,
    updateTypingContent,
    clearChannel,
  };
});
