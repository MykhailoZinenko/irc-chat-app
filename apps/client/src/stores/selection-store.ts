import { defineStore } from 'pinia'
import { type ChatPreview } from 'src/types/chat'
import { ref } from 'vue'

/**
 * Store for UI selection state
 * Separated from data stores
 */
export const useSelectionStore = defineStore('selection', () => {
  const selectedChannelId = ref<number | null>(null)
  const selectedUserId = ref<number | null>(null)
  const showInvitations = ref(false)
  const sidebarOpen = ref(false)
  const infoPanelOpen = ref(false)

  // Store preview channel data for public channels not yet joined
  const previewChannel = ref<ChatPreview | null>(null)

  const selectChannel = (channelId: number, preview?: ChatPreview) => {
    console.log('[SelectionStore] Selecting channel:', channelId, preview ? '(preview)' : '')
    selectedChannelId.value = channelId
    selectedUserId.value = null
    showInvitations.value = false

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
    showInvitations.value = false
  }

  const selectInvitations = () => {
    console.log('[SelectionStore] Selecting invitations view')
    selectedChannelId.value = null
    selectedUserId.value = null
    showInvitations.value = true
    previewChannel.value = null
  }

  const clearSelection = () => {
    selectedChannelId.value = null
    selectedUserId.value = null
    showInvitations.value = false
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
    showInvitations,
    sidebarOpen,
    infoPanelOpen,
    previewChannel,
    selectChannel,
    selectUser,
    selectInvitations,
    clearSelection,
    toggleSidebar,
    toggleInfoPanel,
  }
})
