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
          :members="
            selectionStore.selectedChannelId
              ? [{ name: 'Lena Golovach', username: 'golovach_lena', id: 1234 }]
              : []
          "
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
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { getChatCommands, getMenuCommands, type CommandType } from '@/types/commands'
import ConsoleInput from '@/components/chat/ConsoleInput.vue'

const channelStore = useChannelStore()
const selectionStore = useSelectionStore()

const currentChannel = computed(() => {
  if (!selectionStore.selectedChannelId) return null
  return channelStore.channels.find((c) => c.id === selectionStore.selectedChannelId) || null
})

const availableCommands = computed(() => {
  const channel = currentChannel.value
  if (!channel) return getMenuCommands()
  return getChatCommands(channel.type, channel.role === 'admin')
})

// Check if sidebar exists and is visible
const hasSidebar = computed(() => {
  // On mobile, sidebar might be hidden
  // On desktop (1024px+), sidebar is always visible if channels exist
  return channelStore.channels.length > 0
})

// Check if info panel exists and is open
const hasInfoPanel = computed(() => {
  return selectionStore.infoPanelOpen && !!currentChannel.value
})

const handleMessage = (msg: string) => {
  console.log('Sending message:', msg);
}

const handleCommand = (cmd: CommandType, arg: string) => {
  console.log('Sending command:', cmd, 'with args:', arg);
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
  margin: 12px;
  max-width: 900px;
}

/* Mobile - full width with margin */
@media (max-width: 1023px) {
  .console-input-bar {
    left: 0;
    right: 0;
  }
  
  /* When empty and centered, center the input */
  .console-input-bar.is-empty {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: calc(100% - 24px);
  }
  
  .console-input-bar.is-empty .console-wrapper {
    max-width: 600px;
  }
}

/* Desktop base - no panels */
@media (min-width: 1024px) {
  .console-input-bar {
    left: 0;
    right: 0;
  }
  
  /* When empty (no channel selected), center it */
  .console-input-bar.is-empty {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: auto;
  }
  
  .console-input-bar.is-empty .console-wrapper {
    max-width: 600px;
    margin-left: 12px;
    margin-right: 12px;
  }
}

/* Desktop with sidebar - normal state */
@media (min-width: 1024px) {
  .console-input-bar.has-sidebar:not(.is-empty) {
    left: 320px;
  }
  
  /* Empty state with sidebar - shift center to the right */
  .console-input-bar.is-empty.has-sidebar {
    left: calc(320px + 50%);
    transform: translateX(-50%);
  }
}

/* Desktop with info panel - normal state */
@media (min-width: 1280px) {
  .console-input-bar.has-info-panel:not(.is-empty) {
    right: 332px; /* 320px panel + 12px margin */
  }
  
  /* Empty state with info panel (no sidebar) */
  .console-input-bar.is-empty.has-info-panel:not(.has-sidebar) {
    left: 50%;
    right: auto;
    transform: translateX(calc(-50% - 160px));
  }
  
  /* Empty state with both sidebar AND info panel */
  .console-input-bar.is-empty.has-sidebar.has-info-panel {
    /* Center between 320px (left) and calc(100% - 320px) (right) */
    left: 320px;
    right: auto;
    width: calc(100vw - 640px);
    transform: none;
  }
  
  .console-input-bar.is-empty.has-sidebar.has-info-panel .console-wrapper {
    margin-left: auto;
    margin-right: auto;
    max-width: 600px;
  }
}

/* Normal state with both panels - center the wrapper when maxed out */
@media (min-width: 1024px) {
  .console-input-bar.has-sidebar:not(.is-empty):not(.has-info-panel) .console-wrapper {
    /* When right edge is free, center wrapper when it hits max-width */
    margin-left: auto;
    margin-right: auto;
  }
}

@media (min-width: 1280px) {
  .console-input-bar.has-sidebar.has-info-panel:not(.is-empty) .console-wrapper {
    /* With both panels, center wrapper when it hits max-width */
    margin-left: auto;
    margin-right: auto;
  }
}

/* Ensure console wrapper never exceeds max width */
.console-wrapper {
  width: 100%;
  box-sizing: border-box;
}
</style>