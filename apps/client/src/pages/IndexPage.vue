<template>
  <q-page class="index-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <ChannelSidebarContainer />

      <div
        v-if="selectionStore.sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
        @click="selectionStore.sidebarOpen = false"
      />

      <UserProfile
        v-if="selectionStore.selectedUserId"
        :userId="selectionStore.selectedUserId"
        @back="selectionStore.selectedUserId = null"
      />
      <ChatViewContainer v-else />

      <div
        v-show="selectionStore.infoPanelOpen"
        class="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="selectionStore.infoPanelOpen = false"
      />

      <InfoPanel
        v-if="currentChannel && !selectionStore.selectedUserId && currentChatData"
        :chat="currentChatData"
        :is-open="selectionStore.infoPanelOpen"
        :members="channelStore.currentChannelMembers"
        @close="selectionStore.infoPanelOpen = false"
        @user-click="handleUserClick"
        @leave="handleLeaveChannel"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelStore } from '@/stores/channel-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useAuthStore } from '@/stores/auth-store'
import { useMessageStore } from '@/stores/message-store'
import { useInvitationStore } from '@/stores/invitation-store'
import { transmitService } from '@/services/transmit'
import { Notify } from 'quasar'
import ChannelSidebarContainer from '@/containers/ChannelSidebarContainer.vue'
import ChatViewContainer from '@/containers/ChatViewContainer.vue'
import InfoPanel from '@/components/chat/InfoPanel.vue'
import UserProfile from '@/components/profile/UserProfile.vue'
import type { ChannelMember } from '@/stores/channel-store'
import type { Invitation } from '@/stores/invitation-store'

const route = useRoute()
const router = useRouter()
const channelStore = useChannelStore()
const selectionStore = useSelectionStore()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const invitationStore = useInvitationStore()

let userSubscription: { unsubscribe: () => void } | null = null

onMounted(() => {
  if (!authStore.user) return

  void invitationStore.fetchInvitations()

  userSubscription = transmitService.subscribeToUser(authStore.user.id, (message: any) => {
    const { type, data } = message

    switch (type) {
      case 'new_message':
        messageStore.addMessageFromRealTime(data)
        break
      case 'message_delivered':
        messageStore.handleMessageDelivered(data)
        break
      case 'message_read':
        messageStore.handleMessageRead(data)
        break

      case 'member_joined':
        channelStore.updateMemberCount(data.channelId, data.memberCount)
        if (channelStore.currentChannelDetails?.id === data.channelId) {
          channelStore.addMember({
            id: data.user.id,
            nickName: data.user.nickName,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.role || 'member',
            joinedAt: new Date().toISOString(),
          })
          Notify.create({
            type: 'positive',
            message: `${data.user.nickName || data.user.firstName} joined`,
            position: 'top-right',
            timeout: 2000,
          })
        }
        break

      case 'member_left':
        channelStore.updateMemberCount(data.channelId, data.memberCount)
        if (channelStore.currentChannelDetails?.id === data.channelId) {
          channelStore.removeMember(data.userId)
        }
        break

      case 'channel_deleted':
        Notify.create({
          type: 'warning',
          message: 'Channel Deleted',
          caption: data.reason === 'no_members' ? 'All members left' : 'No admins remain',
          position: 'top',
          timeout: 4000,
        })
        void channelStore.fetchChannels()
        if (selectionStore.selectedChannelId === data.channelId) {
          selectionStore.clearSelection()
          router.push('/chat')
        }
        break

      case 'user_joined_channel':
        void channelStore.fetchChannels()
        break

      case 'invitation_received':
        invitationStore.addInvitation({
          id: data.invitationId,
          channelId: data.channelId,
          channel: {
            id: data.channelId,
            name: data.channelName,
            type: data.channelType,
            description: data.channelDescription,
          },
          inviter: {
            id: data.inviterId,
            nickName: data.inviterNickName,
            firstName: data.inviterFirstName,
            lastName: data.inviterLastName,
            email: data.inviterEmail,
          },
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
        })
        Notify.create({
          type: 'info',
          message: `${data.inviterFirstName || data.inviterNickName} invited you to ${data.channelName}`,
          icon: 'mail',
          timeout: 3000,
        })
        break

      case 'invitation_accepted':
        invitationStore.removeInvitation(data.invitationId)
        Notify.create({
          type: 'positive',
          message: `${data.userFirstName || data.userNickName} accepted your invitation`,
          icon: 'check_circle',
          timeout: 2000,
        })
        break

      case 'invitation_declined':
        invitationStore.removeInvitation(data.invitationId)
        Notify.create({
          type: 'info',
          message: `${data.userFirstName || data.userNickName} declined your invitation`,
          icon: 'info',
          timeout: 2000,
        })
        break

      default:
        break
    }
  })
})

onUnmounted(() => {
  userSubscription?.unsubscribe()
})

// Watch route params and update selection store
watch(
  () => route.params,
  (params) => {
    if (route.path.startsWith('/chat/') && params.id) {
      const channelId = parseInt(params.id as string)
      if (!isNaN(channelId)) {
        selectionStore.selectChannel(channelId)
      }
    } else if (route.path.startsWith('/profile/') && params.id) {
      const userId = parseInt(params.id as string)
      if (!isNaN(userId)) {
        selectionStore.selectUser(userId)
      }
    } else if (route.path === '/invitations') {
      selectionStore.selectInvitations()
    } else if (route.path === '/chat') {
      // On /chat without ID, select first channel if available
      if (channelStore.channels.length > 0 && !selectionStore.selectedChannelId) {
        const firstChannel = channelStore.channels[0]
        if (firstChannel) {
          router.push(`/chat/${firstChannel.id}`)
        }
      }
    }
  }
)

// Watch selection store and update route
watch(
  () => selectionStore.selectedChannelId,
  (channelId) => {
    if (channelId && route.path !== `/chat/${channelId}`) {
      router.push(`/chat/${channelId}`)
    }
  }
)

watch(
  () => selectionStore.selectedUserId,
  (userId) => {
    if (userId && route.path !== `/profile/${userId}`) {
      router.push(`/profile/${userId}`)
    } else if (!userId && route.path.startsWith('/profile/')) {
      // User closed profile, go back to chat
      if (selectionStore.selectedChannelId) {
        router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        router.push('/chat')
      }
    }
  }
)

watch(
  () => selectionStore.showInvitations,
  (show) => {
    if (show && route.path !== '/invitations') {
      router.push('/invitations')
    } else if (!show && route.path === '/invitations') {
      // User closed invitations, go back to chat
      if (selectionStore.selectedChannelId) {
        router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        router.push('/chat')
      }
    }
  }
)

const currentChannel = computed(() => {
  if (!selectionStore.selectedChannelId) return null
  return channelStore.channels.find((c) => c.id === selectionStore.selectedChannelId)
})

const currentChatData = computed(() => {
  if (!currentChannel.value) return null

  const channel = currentChannel.value
  const avatar = channel.type === 'public' ? '📢' : '🔒'

  return {
    id: channel.id,
    name: channel.name,
    type: channel.type === 'private' ? ('group' as const) : ('channel' as const),
    avatar,
    description: channel.description,
    memberCount: channel.memberCount || 0,
    subscriberCount: channel.memberCount || 0,
  }
})

const handleUserClick = (userId: number) => {
  selectionStore.selectUser(userId)
  selectionStore.infoPanelOpen = false
}

const handleLeaveChannel = async () => {
  if (!selectionStore.selectedChannelId) return

  const leavingChannelId = selectionStore.selectedChannelId
  const result = await channelStore.leaveChannel(leavingChannelId)

  if (result.success) {
    selectionStore.infoPanelOpen = false
    selectionStore.clearSelection()

    await channelStore.fetchChannels()

    if (channelStore.channels.length > 0) {
      const firstChannel = channelStore.channels[0]
      if (firstChannel) {
        router.push(`/chat/${firstChannel.id}`)
      }
    } else {
      router.push('/chat')
    }
  }
}

onMounted(async () => {
  await channelStore.fetchChannels()

  // Handle initial route after channels are loaded
  if (route.path.startsWith('/chat/') && route.params.id) {
    // If we have a channel ID in the route, select it
    const channelId = parseInt(route.params.id as string)
    if (!isNaN(channelId)) {
      selectionStore.selectChannel(channelId)
    }
  } else if (route.path === '/chat') {
    // If we're on /chat without an ID, redirect to first channel
    if (channelStore.channels.length > 0) {
      const firstChannel = channelStore.channels[0]
      if (firstChannel) {
        router.push(`/chat/${firstChannel.id}`)
      }
    }
  } else if (route.path.startsWith('/profile/') && route.params.id) {
    const userId = parseInt(route.params.id as string)
    if (!isNaN(userId)) {
      selectionStore.selectUser(userId)
    }
  } else if (route.path === '/invitations') {
    selectionStore.selectInvitations()
  }
})
</script>

<style scoped>
.index-page {
  padding: 0;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-black {
  background-color: black;
}

.bg-opacity-50 {
  opacity: 0.5;
}
</style>
