<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
    <div
      class="console-input-bar"
      :class="{
        'is-empty': !selectionStore.selectedChannelId,
        'has-sidebar': hasSidebar,
        'has-info-panel': hasInfoPanel
      }"
    >
      <div class="console-wrapper">
        <ConsoleInput
          :onlyCommandMode="!selectionStore.selectedChannelId"
          :placeholder="selectionStore.selectedChannelId ? 'Message' : 'Command'"
          :members="availableMembers"
          :commands="availableCommands"
          @command="handleCommand"
          @send="handleMessage"
        />
      </div>
    </div>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type ChannelMember } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useMessageStore } from '@/stores/message-store'
import { getChatCommands, getMenuCommands, type CommandType } from '@/types/commands'
import ConsoleInput from '@/components/chat/ConsoleInput.vue'
import { useCurrentChannel } from 'src/composables/useCurrentChannel'
import { useAuthStore } from 'src/stores/auth-store'
import { memberToSuggestion } from 'src/types/chat'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

const authStore = useAuthStore()
const selectionStore = useSelectionStore()
const messageStore = useMessageStore()
const currentChannel = useCurrentChannel()

const availableCommands = computed(() => {
  const channel = currentChannel.currentChannel.value;
  if (!channel) return getMenuCommands()
  return getChatCommands(channel.type, channel.role === 'admin')
})
const availableMembers = computed(()=>{
  const usr = authStore.user;
  if(!usr || !currentChannel.currentChannelMembers.value) return []
  return (currentChannel.currentChannelMembers.value.filter((m: ChannelMember)=> m.id !== usr.id)).map(memberToSuggestion)
})

const hasSidebar = computed(() => {
  // Sidebar is always visible on desktop, even with 0 channels (shows empty state)
  // If you have logic to hide sidebar on mobile, add that check here
  return true
})

const hasInfoPanel = computed(() => {
  return selectionStore.infoPanelOpen && !!currentChannel.currentChannelId.value
})

const handleMessage = async (msg: string) => {
  if (!selectionStore.selectedChannelId) return
  await messageStore.sendMessage(selectionStore.selectedChannelId, msg)
}

const handleCommand = (cmd: CommandType, arg: string) => {
  console.log('Sending command:', cmd, 'with args:', arg);
  switch(cmd){
    case 'quit':
    case 'cancel':
      void handleCancel();
      break;
    case 'join':
      void handleJoin(arg);
      break;
    case 'invite':
      void handleInvite(arg);
      break;
    case 'revoke':
      void handleRevoke(arg);
      break;
    case 'kick':
      void handleKick(arg);
      break;
  }
}
const handleJoin = async (name: string) => {
  await currentChannel.channelStore.joinByName(name);
}
const handleCancel = async () => {
  if (!selectionStore.selectedChannelId) return
  await currentChannel.channelStore.leaveChannel(selectionStore.selectedChannelId)
}
const handleInvite = async (name: string) => {
  const username = name.startsWith('@') ? name.slice(1) : name;
  try {
    if (!username || !username.trim()) throw new Error("Username is required");

    const response = await api.put<{ success: boolean; message: string }>(
      `/api/channels/${selectionStore.selectedChannelId}/invite-by-name`, {
      username: username.trim(),
    });
    
    if(response.data.success){
      Notify.create({
        type: 'positive',
        message: `Invitation sent successfully`,
      })
    }
    else{
      Notify.create({
        type: 'negative',
        message: response.data.message || 'Failed to send invitation',
      })
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message  || 'Failed to send invitation',
    })
  }
}

const parseUserAndReason = (arg: string) => {
  const parts = arg.trim().split(/\s+/).filter(Boolean)
  const userPart = parts.shift() || ''
  const reason = parts.join(' ').trim()
  const username = userPart.startsWith('@') ? userPart.slice(1) : userPart
  return { username, reason }
}

const findMemberId = (username: string) => {
  if (!username) return null
  const members = currentChannel.currentChannelMembers.value || []
  const match = members.find(
    (m) => m.nickName?.toLowerCase() === username.toLowerCase()
  )
  return match?.id ?? null
}

const handleRevoke = async (arg: string) => {
  if (!selectionStore.selectedChannelId) {
    Notify.create({ type: 'negative', message: 'No channel selected' })
    return
  }

  const { username } = parseUserAndReason(arg)
  const memberId = findMemberId(username)
  if (!memberId) {
    Notify.create({ type: 'negative', message: 'User not found in this channel' })
    return
  }

  await currentChannel.channelStore.revokeUser(selectionStore.selectedChannelId, memberId)
}

const handleKick = async (arg: string) => {
  if (!selectionStore.selectedChannelId) {
    Notify.create({ type: 'negative', message: 'No channel selected' })
    return
  }

  const { username, reason } = parseUserAndReason(arg)
  const memberId = findMemberId(username)
  if (!memberId) {
    Notify.create({ type: 'negative', message: 'User not found in this channel' })
    return
  }

  await currentChannel.channelStore.kickUser(selectionStore.selectedChannelId, memberId, reason || undefined)
}
</script>

<style scoped>
.page-container {
  height: 100%;
}

.console-input-bar {
  position: fixed;
  bottom: 0;
  z-index: 30;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.console-wrapper {
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin: 12px auto;
  max-width: 900px;
  width: 100%;
  box-sizing: border-box;
}

/* Mobile - full width with margin */
@media (max-width: 1023px) {
  .console-input-bar {
    left: 0;
    right: 0;
  }
  
  /* When empty and centered, keep same constraints */
  .console-input-bar.is-empty {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: calc(100% - 24px);
  }
  
  .console-input-bar.is-empty .console-wrapper {
    margin: 12px 0;
    max-width: 900px;
  }
}

/* Desktop base - no panels */
@media (min-width: 1024px) {
  .console-input-bar {
    left: 0;
    right: 0;
  }
  
  /* When empty, keep same max-width as normal state */
  .console-input-bar.is-empty .console-wrapper {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* Desktop with sidebar - normal state */
@media (min-width: 1024px) {
  .console-input-bar.has-sidebar:not(.is-empty) {
    left: 320px;
  }
  
  /* Empty state with sidebar - bar still spans full space, wrapper shrinks */
  .console-input-bar.is-empty.has-sidebar {
    left: 320px;
  }
}

/* Desktop with info panel - normal state */
@media (min-width: 1280px) {
  .console-input-bar.has-info-panel:not(.is-empty) {
    right: 332px; /* 320px panel + 12px margin */
  }
  
  /* Info panel applies to empty state too */
  .console-input-bar.is-empty.has-info-panel {
    right: 332px;
  }
}

/* Normal state - center the wrapper when it hits max-width */
@media (min-width: 1024px) {
  .console-input-bar:not(.is-empty) .console-wrapper {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
