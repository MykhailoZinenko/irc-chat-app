<template>
  <ChatSidebar
    :chats="formattedChats"
    :selected-chat-id="selectionStore.selectedChannelId"
    :is-open="selectionStore.sidebarOpen"
    @select-chat="handleSelectChat"
    @select-user="handleSelectUser"
    @close="selectionStore.sidebarOpen = false"
    @create-channel="handleCreateChannel"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useSearchStore } from '@/stores/search-store'

const channelStore = useChannelStore()
const selectionStore = useSelectionStore()
const searchStore = useSearchStore()

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

    return {
      id: channel.id,
      name: channel.name,
      type: channel.type === 'private' ? ('group' as const) : ('channel' as const),
      avatar,
      lastMessage: channel.description || 'No description',
      time,
      unread: 0,
      description: channel.description,
      memberCount: channel.memberCount || 0,
      subscriberCount: channel.memberCount || 0,
    }
  })
})

const handleSelectChat = (chatId: number) => {
  const userChannel = channelStore.channels.find((c) => c.id === chatId)

  if (userChannel) {
    selectionStore.selectChannel(chatId)
  } else {
    const publicChannel = searchStore.publicChannels.find((c) => c.id === chatId)

    if (publicChannel) {
      selectionStore.selectChannel(chatId, {
        id: publicChannel.id,
        name: publicChannel.name,
        type: 'public',
        description: publicChannel.description,
        memberCount: publicChannel.memberCount || 0,
      })
    } else {
      selectionStore.selectChannel(chatId)
    }
  }

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
</script>
