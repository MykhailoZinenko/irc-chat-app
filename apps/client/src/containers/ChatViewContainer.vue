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
        <!-- Messages (when member) -->
        <MessageList
          v-if="selectionStore.selectedChannelId && !showJoinButton"
          ref="messageListRef"
          :messages="displayedMessages"
          @load-more="loadMoreMessages"
          @user-click="handleUserClick"
        />

        <!-- Preview state (when not a member but viewing channel) -->
        <div
          v-else-if="showJoinButton"
          class="flex-1 flex flex-col items-center justify-center relative bg-gray-50"
        >
          <div class="text-center">
            <q-icon name="lock_open" size="64px" color="grey-5" class="q-mb-md" />
            <p class="text-h6 text-grey-7 q-mb-sm">Public Channel Preview</p>
            <p class="text-body2 text-grey-6 q-mb-lg">
              Join this channel to participate
            </p>
            <q-btn
              unelevated
              color="primary"
              size="lg"
              label="Join Channel"
              padding="12px 48px"
              @click="handleJoinChannel"
            />
          </div>
        </div>

        <!-- Empty state (no channel selected) -->
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
            <p class="text-h6 text-grey-7 q-mb-sm">
              {{ hasChannels ? 'Select a chat' : 'No channels yet' }}
            </p>
            <p class="text-body2 text-grey-6">
              {{ hasChannels ? 'Choose a channel to start chatting' : 'Create a channel to start chatting' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MessageList from '@/components/chat/MessageList.vue'
import ChannelHeaderContainer from './ChannelHeaderContainer.vue'
import InvitationsView from '@/components/invitations/InvitationsView.vue'
import { useSelectionStore } from '@/stores/selection-store'
import { useChannelStore } from '@/stores/channel-store'
import { useMessageStore } from '@/stores/message-store'
import { usePresenceStore } from '@/stores/presence-store'
import { Notify } from 'quasar'

const router = useRouter()
const selectionStore = useSelectionStore()
const channelStore = useChannelStore()
const messageStore = useMessageStore()
const presenceStore = usePresenceStore()

const messageListRef = ref<any>(null)

const displayedMessages = computed(() => {
  return messageStore.currentMessages
})

const showJoinButton = computed(() => {
  if (!channelStore.currentChannelDetails) return false
  return channelStore.currentChannelDetails.userRole === null
})

const hasChannels = computed(() => channelStore.channels.length > 0)

watch(
  () => selectionStore.selectedChannelId,
  async (newChannelId) => {
    if (newChannelId) {
      if (presenceStore.isOffline) {
        Notify.create({ type: 'negative', message: 'You are offline. Go online to sync this chat.' })
        return
      }
      const isMember = channelStore.channels.some((c) => c.id === newChannelId)

      if (isMember) {
        // User is a member - fetch full details and messages
        messageStore.setCurrentChannel(newChannelId)
        const result = await channelStore.fetchChannelDetails(newChannelId)

        // Check if channel not found or forbidden
        if (result && (result.notFound || result.forbidden)) {
          selectionStore.clearSelection()
          void router.push('/404')
          return
        }

        await messageStore.fetchMessages(newChannelId, 1)

        setTimeout(() => {
          messageListRef.value?.scrollToBottom()
        }, 300)
      } else {
        // Not a member - could be preview mode for public channel
        messageStore.setCurrentChannel(null)
        // Fetch channel details for preview (will show join button if public)
        const result = await channelStore.fetchChannelDetails(newChannelId)

        // Check if channel not found or forbidden
        if (result && (result.notFound || result.forbidden)) {
          selectionStore.clearSelection()
          void router.push('/404')
          return
        }
      }

      setTimeout(() => {
        messageListRef.value?.newChat()
      }, 300)
    } else {
      messageStore.setCurrentChannel(null)
      selectionStore.infoPanelOpen = false
    }
  }
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

const loadMoreMessages = async (done: (stop?: boolean) => void) => {
  if (!selectionStore.selectedChannelId) {
    done(true)
    return
  }

  const isMember = channelStore.channels.some((c) => c.id === selectionStore.selectedChannelId)
  if (!isMember) {
    done(true)
    return
  }

  const currentMessages = messageStore.currentMessages

  if (currentMessages.length > 0 && currentMessages.length % 50 !== 0) {
    done(true)
    return
  }

  const nextPage = Math.floor(currentMessages.length / 50) + 1
  const result = await messageStore.fetchMessages(selectionStore.selectedChannelId, nextPage)

  done(!(result && result.hasMore))
}

const handleUserClick = (userNameOrId: string | number) => {
  if (typeof userNameOrId === 'number') {
    selectionStore.selectUser(userNameOrId)
  } else {
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

    messageStore.setCurrentChannel(channelId)
    await messageStore.fetchMessages(channelId, 1)

    setTimeout(() => {
      messageListRef.value?.scrollToBottom()
    }, 300)
  }
}
</script>
