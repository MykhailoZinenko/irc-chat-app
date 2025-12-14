import { computed } from 'vue'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'

/**
 * Composable for accessing current channel data
 * Single source of truth from the store
 */
export const useCurrentChannel = () => {
  const channelStore = useChannelStore()
  const selectionStore = useSelectionStore()

  // Get current channel ID from route or selection
  const currentChannelId = computed(() => {
    return selectionStore.selectedChannelId || channelStore.currentChannelDetails?.id || null
  })

  // Get current channel from store
  const currentChannel = computed(() => {
    if (!currentChannelId.value) return null
    return channelStore.channels.find((c) => c.id === currentChannelId.value)
  })

  // Get current channel details (includes members)
  const currentChannelDetails = computed(() => channelStore.currentChannelDetails)

  // Get current channel members
  const currentChannelMembers = computed(() => channelStore.currentChannelMembers)

  // Get member count - always reactive
  const memberCount = computed(() => {
    return currentChannel.value?.memberCount || currentChannelDetails.value?.memberCount || 0
  })

  return {
    channelStore,
    currentChannelId,
    currentChannel,
    currentChannelDetails,
    currentChannelMembers,
    memberCount,
  }
}
