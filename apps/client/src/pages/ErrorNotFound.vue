<template>
  <div class="fullscreen flex flex-center bg-gray-50">
    <div class="text-center">
      <q-icon name="error_outline" size="80px" color="grey-5" class="q-mb-lg" />
      <h1 class="text-h3 text-grey-8 q-mb-sm font-weight-medium">404 - Not Found</h1>
      <p class="text-body1 text-grey-6 q-mb-lg">
        The page you are looking for does not exist or you do not have access to it.
      </p>
      <q-btn
        unelevated
        color="primary"
        size="lg"
        label="Back to Chats"
        padding="12px 48px"
        @click="handleBackToChats"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'

const router = useRouter()
const channelStore = useChannelStore()
const selectionStore = useSelectionStore()

const handleBackToChats = async () => {
  // Clear any current selection
  selectionStore.clearSelection()

  // Fetch channels to ensure we have the latest list
  await channelStore.fetchChannels()

  // Navigate to first channel if available
  if (channelStore.channels.length > 0) {
    const firstChannel = channelStore.channels[0]
    if (firstChannel) {
      void router.push(`/chat/${firstChannel.id}`)
    }
  } else {
    // No channels available, go to /chat
    void router.push('/chat')
  }
}
</script>
