<template>
  <q-page class="index-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <ChannelSidebarContainer />
      <div
        v-if="selectionStore.sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="selectionStore.sidebarOpen = false"
      />
      <div class="flex flex-col flex-1 min-w-0 relative">
        <div class="flex-1 min-h-0 flex flex-col">
          <UserProfile
            v-if="selectionStore.selectedUserId"
            :userId="selectionStore.selectedUserId"
            class="flex-1"
            @back="selectionStore.selectedUserId = null"
          />
          <ChatViewContainer v-else />
        </div>
      </div>
      <!-- Info Panel Overlay - only on mobile/tablet (xl breakpoint) -->
      <div
        v-if="selectionStore.infoPanelOpen"
        class="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="handleCloseInfoPanel"
      />
      <!-- Info Panel -->
      <InfoPanel
        v-if="currentChannel && !selectionStore.selectedUserId && currentChatData"
        :chat="currentChatData"
        :is-open="selectionStore.infoPanelOpen"
        :members="channelStore.currentChannelMembers"
        @close="handleCloseInfoPanel"
        @user-click="handleUserClick"
        @leave="handleLeaveChannel"
        @show-members="openMembersModal"
      />

      <q-dialog v-model="selectionStore.showMembersModal" :key="`members-${selectionStore.selectedChannelId || 'none'}`">
        <q-card style="width: 520px; max-width: 90vw;">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-base font-semibold text-gray-800">Members ({{ modalMembers.length }})</div>
              <div class="text-sm text-gray-500" v-if="currentChatData">{{ currentChatData.name }}</div>
            </div>
            <q-btn flat round dense icon="close" color="grey-7" @click="selectionStore.showMembersModal = false" />
          </q-card-section>

          <q-separator />

          <q-card-section style="max-height: 60vh; min-height: 160px;" class="scroll">
            <q-list>
              <template v-if="modalMembers.length">
                <MemberListItem
                  v-for="member in modalMembers"
                  :key="member.id"
                  :member="member"
                  clickable
                  @select="handleUserClick"
                />
              </template>
              <q-item v-else dense>
                <q-item-section class="text-grey-6">
                  {{ channelStore.loading ? 'Loading members...' : 'No members found for this channel.' }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="primary" label="Close" @click="selectionStore.showMembersModal = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
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
import { useNotificationStore } from '@/stores/notification-store'
import { useTypingStore } from '@/stores/typing-store'
import { usePresenceStore } from '@/stores/presence-store'
import { transmitService } from '@/services/transmit'
import { Notify } from 'quasar'
import ChannelSidebarContainer from '@/containers/ChannelSidebarContainer.vue'
import ChatViewContainer from '@/containers/ChatViewContainer.vue'
import InfoPanel from '@/components/chat/InfoPanel.vue'
import UserProfile from '@/components/profile/UserProfile.vue'
import MemberListItem from '@/components/ui/MemberListItem.vue'

const route = useRoute()
const router = useRouter()
const channelStore = useChannelStore()
const selectionStore = useSelectionStore()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const invitationStore = useInvitationStore()
const notificationStore = useNotificationStore()
const typingStore = useTypingStore()
const presenceStore = usePresenceStore()

let userSubscription: { unsubscribe: () => void } | null = null

onMounted(async () => {
  // Fetch channels first
  await channelStore.fetchChannels()

  // Handle initial route after channels are loaded
  if (route.path.startsWith('/chat/')) {
    const channelId = parseInt(route.params.id as string)
    if (!isNaN(channelId)) {
      selectionStore.selectChannel(channelId)
    }
  } else if (route.path.startsWith('/profile/')) {
    const userId = parseInt(route.params.id as string)
    if (!isNaN(userId)) {
      selectionStore.selectUser(userId)
    }
  } else if (route.path === '/invitations') {
    selectionStore.selectInvitations()
  } else if (route.path === '/chat') {
    selectionStore.clearSelection()
  }

  if (!authStore.user) return

  if (!presenceStore.isOffline) {
    void invitationStore.fetchInvitations()
  }

  userSubscription = transmitService.subscribeToUser(authStore.user.id, (message: any) => {
    const { type, data } = message

    switch (type) {
      case 'new_message':
        messageStore.addMessageFromRealTime(data)
        {
          const channel = channelStore.channels.find((c) => c.id === data.channelId)
          void notificationStore.maybeNotifyMessage({
            message: data,
            channelType: channel?.type || 'public',
            activeChannelId: selectionStore.selectedChannelId,
            currentUserId: authStore.user?.id,
            currentUserNick: authStore.user?.nickName,
          })
        }
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
            status: data.user.status || 'online',
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
          typingStore.removeTypingUser(data.channelId, data.userId)
        }
        if (data.userId === authStore.user?.id && data.channelName && notificationStore.preferences.channelEvents) {
          void notificationStore.maybeNotifyGeneric({
            title: 'Removed from channel',
            body: `You left ${data.channelName}`,
            tag: `channel-left-${data.channelId}`,
          })
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
        if (notificationStore.preferences.channelEvents) {
          void notificationStore.maybeNotifyGeneric({
            title: 'Channel deleted',
            body: data.reason === 'no_members' ? 'All members left' : 'No admins remain',
            tag: `channel-deleted-${data.channelId}`,
          })
        }
        void channelStore.fetchChannels()
        if (selectionStore.selectedChannelId === data.channelId) {
          selectionStore.clearSelection()
          void router.push('/chat')
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
        if (notificationStore.preferences.invites) {
          void notificationStore.maybeNotifyGeneric({
            title: 'Invitation received',
            body: `${data.inviterFirstName || data.inviterNickName} invited you to ${data.channelName}`,
            tag: `invitation-${data.invitationId}`,
          })
        }
        break

      case 'invitation_accepted':
        invitationStore.removeInvitation(data.invitationId)
        Notify.create({
          type: 'positive',
          message: `${data.userFirstName || data.userNickName} accepted your invitation`,
          icon: 'check_circle',
          timeout: 2000,
        })
        if (notificationStore.preferences.inviteResponses) {
          void notificationStore.maybeNotifyGeneric({
            title: 'Invitation accepted',
            body: `${data.userFirstName || data.userNickName} accepted your invitation to ${data.channelName || ''}`.trim(),
            tag: `invitation-accepted-${data.invitationId}`,
          })
        }
        break

      case 'invitation_declined':
        invitationStore.removeInvitation(data.invitationId)
        Notify.create({
          type: 'info',
          message: `${data.userFirstName || data.userNickName} declined your invitation`,
          icon: 'info',
          timeout: 2000,
        })
        if (notificationStore.preferences.inviteResponses) {
          void notificationStore.maybeNotifyGeneric({
            title: 'Invitation declined',
            body: `${data.userFirstName || data.userNickName} declined your invitation to ${data.channelName || ''}`.trim(),
            tag: `invitation-declined-${data.invitationId}`,
          })
        }
        break

      case 'user_typing_start':
        typingStore.addTypingUser(data.channelId, {
          id: data.user.id,
          nickName: data.user.nickName,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          content: '',
        })
        break

      case 'user_typing_stop':
        typingStore.removeTypingUser(data.channelId, data.userId)
        break

      case 'user_typing_update':
        typingStore.updateTypingContent(data.channelId, data.userId, data.content)
        break
        
      case 'user_status_changed':
        if (channelStore.currentChannelDetails) {
          channelStore.updateMemberStatus(data.userId, data.status)
        }
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
  () => route.path,
  (path) => {
    // Don't handle 404 or settings routes
    if (path === '/404' || path === '/settings') {
      return
    }

    if (path.startsWith('/chat/')) {
      const channelId = parseInt(route.params.id as string)
      if (!isNaN(channelId) && selectionStore.selectedChannelId !== channelId) {
        selectionStore.selectChannel(channelId)
      }
    } else if (path.startsWith('/profile/')) {
      const userId = parseInt(route.params.id as string)
      if (!isNaN(userId) && selectionStore.selectedUserId !== userId) {
        selectionStore.selectUser(userId)
      }
    } else if (path === '/invitations') {
      if (!selectionStore.showInvitations) {
        selectionStore.selectInvitations()
      }
    } else if (path === '/chat') {
      selectionStore.clearSelection()
    }
  }
)

// Watch selection store and update route
watch(
  () => selectionStore.selectedChannelId,
  (channelId) => {
    if (channelId && route.path !== `/chat/${channelId}`) {
      void router.push(`/chat/${channelId}`)
    }
  }
)

watch(
  () => selectionStore.selectedUserId,
  (userId) => {
    if (userId && route.path !== `/profile/${userId}`) {
      void router.push(`/profile/${userId}`)
    } else if (!userId && route.path.startsWith('/profile/')) {
      // User closed profile, go back to chat
      if (selectionStore.selectedChannelId) {
        void router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        void router.push('/chat')
      }
    }
  }
)

watch(
  () => selectionStore.showInvitations,
  (show) => {
    if (show && route.path !== '/invitations') {
      void router.push('/invitations')
    } else if (!show && route.path === '/invitations') {
      // User closed invitations, go back to chat
      if (selectionStore.selectedChannelId) {
        void router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        void router.push('/chat')
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

const modalMembers = computed(() => {
  if (!channelStore.currentChannelMembers?.length) return []
  // Sort members: admins first, then by nickname
  return [...channelStore.currentChannelMembers].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    return (a.nickName || '').localeCompare(b.nickName || '')
  })
})

const handleCloseInfoPanel = () => {
  selectionStore.infoPanelOpen = false
}

const handleUserClick = (userId: number) => {
  if (authStore.user?.id === userId) {
    Notify.create({ type: 'info', message: 'This is you' })
    return
  }
  selectionStore.selectUser(userId)
  selectionStore.infoPanelOpen = false
}

const handleLeaveChannel = async () => {
  if (!selectionStore.selectedChannelId) return
  const leavingChannelId = selectionStore.selectedChannelId

  // Close info panel and clear selection to prevent watches from firing
  selectionStore.infoPanelOpen = false
  selectionStore.clearSelection()

  // Leave the channel
  const result = await channelStore.leaveChannel(leavingChannelId)
  if (result.success) {
    // Fetch updated channel list
    await channelStore.fetchChannels()

    // Navigate to next channel
    await router.push('/chat')
  }
}

const openMembersModal = async () => {
  if (!selectionStore.selectedChannelId) return
  if (presenceStore.isOffline) {
    Notify.create({ type: 'negative', message: 'You are offline. Go online to view members.' })
    return
  }

  const result = await channelStore.ensureChannelMembers(selectionStore.selectedChannelId)

  if (!result?.success) {
    Notify.create({ type: 'negative', message: 'Unable to load members for this channel.' })
    return
  }

  if (!result.members?.length) {
    Notify.create({ type: 'info', message: 'No members found for this channel yet.' })
  }

  selectionStore.showMembersModal = true
}

const anyNotificationPrefEnabled = computed(() => {
  const prefs = notificationStore.preferences
  return (
    prefs.privateChannels ||
    prefs.publicChannels ||
    prefs.mentions ||
    prefs.invites ||
    prefs.inviteResponses ||
    prefs.channelEvents
  )
})

const refreshActiveChannelMessages = async () => {
  const channelId = selectionStore.selectedChannelId
  if (!channelId) return
  const isMember = channelStore.channels.some((c) => c.id === channelId)
  if (!isMember) return
  await channelStore.fetchChannelDetails(channelId)
  await messageStore.fetchMessages(channelId, 1)
}

const refreshAllOnOnline = async () => {
  await channelStore.fetchChannels()
  await refreshActiveChannelMessages()
}

watch(
  () => presenceStore.status,
  async (newStatus, oldStatus) => {
    if (newStatus === 'online') {
      if (anyNotificationPrefEnabled.value) {
        void notificationStore.ensurePermission()
      }
      // Only refresh if we were actually offline before (not on initial load)
      if (oldStatus === 'offline' || oldStatus === 'dnd') {
        await refreshAllOnOnline()
      }
    }
  }
)

// Watch route params and update selection store
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/chat/')) {
      const channelId = parseInt(route.params.id as string)
      if (!isNaN(channelId) && selectionStore.selectedChannelId !== channelId) {
        selectionStore.selectChannel(channelId)
      }
    } else if (path.startsWith('/profile/')) {
      const userId = parseInt(route.params.id as string)
      if (!isNaN(userId) && selectionStore.selectedUserId !== userId) {
        selectionStore.selectUser(userId)
      }
    } else if (path === '/invitations') {
      if (!selectionStore.showInvitations) {
        selectionStore.selectInvitations()
      }
    } else if (path === '/chat') {
      selectionStore.clearSelection()
    }
  }
)

// Watch selection store and update route
watch(
  () => selectionStore.selectedChannelId,
  (channelId) => {
    if (channelId && route.path !== `/chat/${channelId}`) {
      void router.push(`/chat/${channelId}`)
    }
  }
)

watch(
  () => selectionStore.selectedUserId,
  (userId) => {
    if (userId && route.path !== `/profile/${userId}`) {
      void router.push(`/profile/${userId}`)
    } else if (!userId && route.path.startsWith('/profile/')) {
      // User closed profile, go back to chat
      if (selectionStore.selectedChannelId) {
        void router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        void router.push('/chat')
      }
    }
  }
)

watch(
  () => selectionStore.showInvitations,
  (show) => {
    if (show && route.path !== '/invitations') {
      void router.push('/invitations')
    } else if (!show && route.path === '/invitations') {
      // User closed invitations, go back to chat
      if (selectionStore.selectedChannelId) {
        void router.push(`/chat/${selectionStore.selectedChannelId}`)
      } else {
        void router.push('/chat')
      }
    }
  }
)

watch(
  () => selectionStore.selectedChannelId,
  (val) => {
    if (!val) {
      selectionStore.showMembersModal = false
    }
  }
)
</script>

<style scoped>
.index-page {
  padding: 0;
}
</style>
