import { defineStore } from 'pinia'
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

  const selectChannel = (channelId: number) => {
    selectedChannelId.value = channelId
    selectedUserId.value = null
    showInvitations.value = false
  }

  const selectUser = (userId: number) => {
    selectedUserId.value = userId
    showInvitations.value = false
  }

  const selectInvitations = () => {
    selectedChannelId.value = null
    selectedUserId.value = null
    showInvitations.value = true
  }

  const clearSelection = () => {
    selectedChannelId.value = null
    selectedUserId.value = null
    showInvitations.value = false
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
    selectChannel,
    selectUser,
    selectInvitations,
    clearSelection,
    toggleSidebar,
    toggleInfoPanel,
  }
})
