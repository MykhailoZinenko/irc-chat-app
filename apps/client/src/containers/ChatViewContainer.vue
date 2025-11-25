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

      <!-- Messages for members -->
      <MessageList
        v-if="selectionStore.selectedChannelId && !showJoinButton"
        ref="messageListRef"
        :messages="displayedMessages"
        @load-more="loadMoreMessages"
        @user-click="handleUserClick"
      />

      <!-- Preview overlay for non-members -->
      <div v-else-if="showJoinButton" class="flex-1 relative flex items-center justify-center bg-gray-50">
        <div class="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
        <div class="relative z-10 text-center">
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

      <!-- Empty state -->
      <div v-else class="flex-1 flex flex-col items-center justify-center">
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
          <p class="text-body2 text-grey-6">Create a channel to start chatting</p>
        </div>
      </div>
    </template>

    <!-- Floating Message Input (persistent across all views) -->
    <div v-if="selectionStore.selectedChannelId && !showJoinButton" class="floating-input-container">
      <MessageInput
        @send="handleSendMessage"
        @attach="handleAttach"
        @emoji="handleEmoji"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MessageList from '@/components/chat/MessageList.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import ChannelHeaderContainer from './ChannelHeaderContainer.vue'
import InvitationsView from '@/components/invitations/InvitationsView.vue'
import { useSelectionStore } from '@/stores/selection-store'
import { useChannelStore } from '@/stores/channel-store'
import { useMessageStore } from '@/stores/message-store'

const selectionStore = useSelectionStore()
const channelStore = useChannelStore()
const messageStore = useMessageStore()

const messageListRef = ref<any>(null)

const displayedMessages = computed(() => {
  return messageStore.currentMessages
})

const showJoinButton = computed(() => {
  if (!channelStore.currentChannelDetails) return false
  return channelStore.currentChannelDetails.userRole === null
})

watch(
  () => selectionStore.selectedChannelId,
  async (newChannelId) => {
    if (newChannelId) {
      const isMember = channelStore.channels.some((c) => c.id === newChannelId)

      if (isMember) {
        messageStore.setCurrentChannel(newChannelId)
        await channelStore.fetchChannelDetails(newChannelId)
        await messageStore.fetchMessages(newChannelId, 1)

        setTimeout(() => {
          messageListRef.value?.scrollToBottom()
        }, 300)
      } else {
        messageStore.setCurrentChannel(null)
        await channelStore.fetchChannelDetails(newChannelId)
      }
    } else {
      messageStore.setCurrentChannel(null)
    }
  }
)

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

const handleSendMessage = async (message: string) => {
  if (!selectionStore.selectedChannelId) return
  await messageStore.sendMessage(selectionStore.selectedChannelId, message)
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

const handleAttach = () => {
}

const handleEmoji = () => {
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

<style scoped>
.floating-input-container {
  position: sticky;
  bottom: 0;
  z-index: 50;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}
</style>
