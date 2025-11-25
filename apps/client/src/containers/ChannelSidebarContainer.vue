<template>
  <ChatSidebar
    :chats="formattedChats"
    :selected-chat-id="selectionStore.selectedChannelId"
    :is-open="selectionStore.sidebarOpen"
    @select-chat="handleSelectChat"
    @select-user="handleSelectUser"
    @close="selectionStore.sidebarOpen = false"
    @create-channel="handleCreateChannel"
  >
    <template #invitations-button>
      <InvitationsButton
        :invitations="invitationStore.invitations"
        @click="handleInvitationsClick"
      />
    </template>
  </ChatSidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import InvitationsButton from '@/components/invitations/InvitationsButton.vue'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useInvitationStore } from '@/stores/invitation-store'
import { useMessageStore } from '@/stores/message-store'
import { useAuthStore } from '@/stores/auth-store'

const channelStore = useChannelStore()
const selectionStore = useSelectionStore()
const invitationStore = useInvitationStore()
const messageStore = useMessageStore()
const authStore = useAuthStore()

const formattedChats = computed(() => {
  return channelStore.channels.map((channel) => {
    const avatar = channel.type === 'public' ? '📢' : '🔒'

    let time = 'No activity'
    if (channel.lastActivityAt) {
      const lastActivity = DateTime.fromISO(channel.lastActivityAt)
      const now = DateTime.now()
      const diff = now.diff(lastActivity, ['days', 'hours', 'minutes']).toObject()

      if (diff.days && diff.days >= 1) {
        time = `${Math.floor(diff.days)} day${Math.floor(diff.days) > 1 ? 's' : ''} ago`
      } else if (diff.hours && diff.hours >= 1) {
        time = `${Math.floor(diff.hours)}h ago`
      } else if (diff.minutes && diff.minutes >= 1) {
        time = `${Math.floor(diff.minutes)}m ago`
      } else {
        time = 'Just now'
      }
    }

    // Get unread count for this channel
    const unreadCount = authStore.user
      ? messageStore.getUnreadCount(channel.id, authStore.user.id)
      : 0

    return {
      id: channel.id,
      name: channel.name,
      type: channel.type === 'private' ? ('group' as const) : ('channel' as const),
      avatar,
      lastMessage: channel.description || 'No description',
      time,
      unread: unreadCount,
      description: channel.description,
      memberCount: channel.memberCount || 0,
      subscriberCount: channel.memberCount || 0,
    }
  })
})

const handleSelectChat = (chatId: number) => {
  selectionStore.selectChannel(chatId)
  selectionStore.sidebarOpen = false
}

const handleSelectUser = (userId: number) => {
  selectionStore.selectUser(userId)
  selectionStore.sidebarOpen = false
}

const handleCreateChannel = async (data: { type: 'private' | 'public'; name: string; description: string }) => {
  const result = await channelStore.createChannel(data)
  if (result.success && result.channel) {
    selectionStore.selectChannel(result.channel.id)
  }
}

const handleInvitationsClick = () => {
  selectionStore.selectInvitations()
  selectionStore.sidebarOpen = false
}
</script>
