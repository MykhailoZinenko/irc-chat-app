import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store for UI selection state
 * Separated from data stores
 */
export const useSelectionStore = defineStore('selection', () => {
  const selectedChannelId = ref<number | null>(null)
  const selectedUserId = ref<number | null>(null)
  const sidebarOpen = ref(false)
  const infoPanelOpen = ref(false)

  // Store preview channel data for public channels not yet joined
  const previewChannel = ref<any>(null)

  const selectChannel = (channelId: number, preview?: any) => {
    console.log('[SelectionStore] Selecting channel:', channelId, preview ? '(preview)' : '')
    selectedChannelId.value = channelId
    selectedUserId.value = null

    // Store preview data if provided
    if (preview) {
      previewChannel.value = { ...preview, id: channelId }
    } else {
      previewChannel.value = null
    }
  }

  const selectUser = (userId: number) => {
    console.log('[SelectionStore] Selecting user:', userId)
    selectedUserId.value = userId
  }

  const clearSelection = () => {
    selectedChannelId.value = null
    selectedUserId.value = null
    previewChannel.value = null
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const toggleInfoPanel = () => {
    infoPanelOpen.value = !infoPanelOpen.value
  }

  return {
    selectedChannelId,
    selectedUserId,
    sidebarOpen,
    infoPanelOpen,
    previewChannel,
    selectChannel,
    selectUser,
    clearSelection,
    toggleSidebar,
    toggleInfoPanel,
  }
})
