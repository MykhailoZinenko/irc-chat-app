<template>
  <ChatHeader
    v-if="currentChannel"
    :chat="chatData"
    @toggle-sidebar="selectionStore.toggleSidebar()"
    @toggle-info="selectionStore.toggleInfoPanel()"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'

const channelStore = useChannelStore()
const selectionStore = useSelectionStore()

const currentChannel = computed(() => {
  if (!selectionStore.selectedChannelId) return null

  // Try to find in user's channels first
  const memberChannel = channelStore.channels.find(
    (c) => c.id === selectionStore.selectedChannelId
  )
  if (memberChannel) return memberChannel

  // Fall back to preview channel
  if (
    selectionStore.previewChannel &&
    selectionStore.previewChannel.id === selectionStore.selectedChannelId
  ) {
    return selectionStore.previewChannel
  }

  return null
})

const chatData = computed(() => {
  if (!currentChannel.value) return null

  const channel = currentChannel.value
  const avatar = channel.type === 'public' ? '📢' : '🔒'

  return {
    id: channel.id,
    name: channel.name,
    type: channel.type === 'private' ? ('group' as const) : ('channel' as const),
    avatar,
    memberCount: channel.memberCount || 0,
    subscriberCount: channel.memberCount || 0,
  }
})
</script>
