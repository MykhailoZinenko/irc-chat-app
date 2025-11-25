<template>
  <q-page class="index-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <ChannelSidebarContainer />
      <div
        v-if="selectionStore.sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
        @click="selectionStore.sidebarOpen = false"
      />
      <div class="flex flex-col flex-1 min-w-0 relative">
        <div class="flex-1 min-h-0 flex flex-col">
          <UserProfile
            v-if="selectionStore.selectedUserId"
            :userId="selectionStore.selectedUserId"
            class="flex-1"
            @back="selectionStore.selectedUserId = null"
          />
          <ChatViewContainer v-else />
        </div>
      </div>
      <!-- Info Panel Overlay - only on mobile/tablet (xl breakpoint) -->
      <div
        v-if="selectionStore.infoPanelOpen"
        class="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="handleCloseInfoPanel"
      />
      <!-- Info Panel -->
      <InfoPanel
        v-if="currentChannel && !selectionStore.selectedUserId && currentChatData"
        :chat="currentChatData"
        :is-open="selectionStore.infoPanelOpen"
        :members="channelStore.currentChannelMembers"
        @close="handleCloseInfoPanel"
        @user-click="handleUserClick"
        @leave="handleLeaveChannel"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useAuthStore } from '@/stores/auth-store'
import { useChannelEvents } from '@/composables/useChannelEvents'
import { useUserEvents } from '@/composables/useUserEvents'
import ChannelSidebarContainer from '@/containers/ChannelSidebarContainer.vue'
import ChatViewContainer from '@/containers/ChatViewContainer.vue'
import InfoPanel from '@/components/chat/InfoPanel.vue'
import UserProfile from '@/components/profile/UserProfile.vue'

const channelStore = useChannelStore()
const selectionStore = useSelectionStore()
const authStore = useAuthStore()
const channelEvents = useChannelEvents()

// Subscribe to user events for real-time invitation updates
if (authStore.user) {
  useUserEvents(authStore.user.id)
}

const currentChannel = computed(() => {
  if (!selectionStore.selectedChannelId) return null
  return channelStore.channels.find((c) => c.id === selectionStore.selectedChannelId)
})

const currentChatData = computed(() => {
  if (!currentChannel.value) return null
  const channel = currentChannel.value
  const avatar = channel.type === 'public' ? '📢' : '🔒'
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type === 'private' ? ('group' as const) : ('channel' as const),
    avatar,
    description: channel.description,
    memberCount: channel.memberCount || 0,
    subscriberCount: channel.memberCount || 0,
  }
})

const handleCloseInfoPanel = () => {
  selectionStore.infoPanelOpen = false
}

const handleUserClick = (userId: number) => {
  selectionStore.selectUser(userId)
  selectionStore.infoPanelOpen = false
}

const handleLeaveChannel = async () => {
  if (!selectionStore.selectedChannelId) return
  const leavingChannelId = selectionStore.selectedChannelId
  const result = await channelStore.leaveChannel(leavingChannelId)
  if (result.success) {
    selectionStore.infoPanelOpen = false
    channelEvents.unsubscribeFromChannel(leavingChannelId)
    selectionStore.clearSelection()
    await channelStore.fetchChannels()
    if (channelStore.channels.length > 0) {
      const firstChannel = channelStore.channels[0]
      if (firstChannel) {
        selectionStore.selectChannel(firstChannel.id)
      }
    }
  }
}

onMounted(async () => {
  await channelStore.fetchChannels()
  if (channelStore.channels.length > 0 && !selectionStore.selectedChannelId) {
    const firstChannel = channelStore.channels[0]
    if (firstChannel) {
      selectionStore.selectChannel(firstChannel.id)
    }
  }
})
</script>

<style scoped>
.index-page {
  padding: 0;
}
.bg-gray-50 {
  background-color: #f9fafb;
}
.bg-black {
  background-color: black;
}
.bg-opacity-50 {
  opacity: 0.5;
}
</style>