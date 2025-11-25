<template>
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Invitations View -->
    <InvitationsView
      v-if="selectionStore.showInvitations"
      @back="selectionStore.clearSelection()"
    />

    <!-- Chat View -->
    <template v-else>
      <!-- Header -->
      <ChannelHeaderContainer />

      <!-- Main content: messages OR empty state -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Messages -->
        <MessageList
          v-if="selectionStore.selectedChannelId"
          ref="messageListRef"
          :messages="displayedMessages"
          @load-more="loadMoreMessages"
          @user-click="handleUserClick"
        />

        <!-- Empty state -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center relative"
        >
          <div class="lg:hidden absolute top-4 left-4">
            <q-btn
              flat
              round
              dense
              icon="menu"
              color="grey-7"
              @click="selectionStore.toggleSidebar()"
            />
          </div>

          <div class="text-center">
            <q-icon name="chat" size="64px" color="grey-5" class="q-mb-md" />
            <p class="text-h6 text-grey-7 q-mb-sm">No channels yet</p>
            <p class="text-body2 text-grey-6">
              Create a channel to start chatting
            </p>
          </div>
        </div>
      </div>

      <!-- Join button for non-member public channels -->
      <div v-if="showJoinButton" class="border-t border-gray-200 p-4">
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          size="lg"
          label="Join Channel"
          @click="handleJoinChannel"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import MessageList from '@/components/chat/MessageList.vue'
import ChannelHeaderContainer from './ChannelHeaderContainer.vue'
import InvitationsView from '@/components/invitations/InvitationsView.vue'
import { useSelectionStore } from '@/stores/selection-store'
import { useChannelStore } from '@/stores/channel-store'
import { useChannelEvents } from '@/composables/useChannelEvents'

const selectionStore = useSelectionStore()
const channelStore = useChannelStore()
const channelEvents = useChannelEvents()

const messageListRef = ref<any>(null)

// Mock messages data
const MESSAGES_PER_LOAD = 15
const loadedCount = ref(MESSAGES_PER_LOAD)
const allMessages = ref<any[]>([])

const displayedMessages = computed(() => {
  const start = Math.max(0, allMessages.value.length - loadedCount.value)
  return allMessages.value.slice(start)
})

const currentChannel = computed(() => {
  if (!selectionStore.selectedChannelId) return undefined
  return channelStore.channels.find((c) => c.id === selectionStore.selectedChannelId)
})

const showJoinButton = computed(() => {
  const isMember = currentChannel;
  if (isMember.value) return false

  return (
    selectionStore.previewChannel && selectionStore.previewChannel.type === 'public'
  )
})

// Subscribe to channel events when selection changes
watch(
  () => selectionStore.selectedChannelId,
  async (newChannelId, oldChannelId) => {
    if (oldChannelId) {
      channelEvents.unsubscribeFromChannel(oldChannelId)
    }

    if (newChannelId) {
      const isMember = channelStore.channels.some((c) => c.id === newChannelId)

      if (isMember) {
        await channelStore.fetchChannelDetails(newChannelId)

        channelEvents.subscribeToChannel(newChannelId, {
          onChannelDeleted: async (data) => {
            if (selectionStore.selectedChannelId === data.channelId) {
              selectionStore.clearSelection()
              await channelStore.fetchChannels()
            }
          },
        })
      }

      loadedCount.value = MESSAGES_PER_LOAD
      messageListRef.value?.newChat()
    } else {
      // When no channel is selected, close info panel
      selectionStore.infoPanelOpen = false
    }
  },
  { immediate: true }
)

// Close info panel when switching to invitations view
watch(
  () => selectionStore.showInvitations,
  (showInvitations) => {
    if (showInvitations) {
      selectionStore.infoPanelOpen = false
    }
  }
)

// Close info panel when component is unmounted (e.g., navigating to settings)
onUnmounted(() => {
  selectionStore.infoPanelOpen = false
})

const loadMoreMessages = (done: (stop?: boolean) => void) => {
  setTimeout(() => {
    loadedCount.value += MESSAGES_PER_LOAD
    if (loadedCount.value >= allMessages.value.length) {
      done(true)
    } else {
      done()
    }
  }, 400)
}

const handleUserClick = (userNameOrId: string | number) => {
  // TODO: When messages include userId, use that instead of userName
  // For now, we need to look up the user by name from members
  if (typeof userNameOrId === 'number') {
    selectionStore.selectUser(userNameOrId)
  } else {
    // Find user by name in current channel members
    const member = channelStore.currentChannelMembers.find(
      (m) => m.nickName === userNameOrId || `${m.firstName} ${m.lastName}` === userNameOrId
    )
    if (member) {
      selectionStore.selectUser(member.id)
    }
  }
}

const handleJoinChannel = async () => {
  if (!selectionStore.selectedChannelId) return

  const channelId = selectionStore.selectedChannelId
  const result = await channelStore.joinChannel(channelId)
  if (result.success) {
    await channelStore.fetchChannels()
    await channelStore.fetchChannelDetails(channelId)

    channelEvents.subscribeToChannel(channelId, {
      onChannelDeleted: async (data) => {
        if (selectionStore.selectedChannelId === data.channelId) {
          selectionStore.clearSelection()
          await channelStore.fetchChannels()
        }
      },
    })
  }
}
</script>