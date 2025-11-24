import { onMounted, onUnmounted } from 'vue'
import { transmitService } from '@/services/transmit'
import { useInvitationStore } from '@/stores/invitation-store'
import { useChannelStore } from '@/stores/channel-store'
import { Notify } from 'quasar'
import type { Invitation } from '@/stores/invitation-store'

interface InvitationReceivedData {
  invitationId: number
  channelId: number
  channelName: string
  channelType: 'public' | 'private'
  channelDescription: string | null
  inviterId: number
  inviterNickName: string
  inviterFirstName: string | null
  inviterLastName: string | null
  inviterEmail: string
  createdAt: string
  expiresAt: string | null
}

interface InvitationAcceptedData {
  invitationId: number
  channelId: number
  channelName: string
  userId: number
  userNickName: string
  userFirstName: string | null
  userLastName: string | null
}

interface InvitationDeclinedData {
  invitationId: number
  channelId: number
  channelName: string
  userId: number
  userNickName: string
  userFirstName: string | null
  userLastName: string | null
}

interface UserChannelChangeData {
  userId: number
  channelId: number
  channelName: string
}

interface UserEventsCallbacks {
  onUserJoinedChannel?: (data: UserChannelChangeData) => void
  onUserLeftChannel?: (data: UserChannelChangeData) => void
}

export function useUserEvents(userId?: number, callbacks?: UserEventsCallbacks) {
  const invitationStore = useInvitationStore()
  const channelStore = useChannelStore()

  let unsubscribeFn: (() => void) | null = null

  const handleInvitationReceived = (data: InvitationReceivedData) => {
    console.log('[UserEvents] invitation_received:', data)

    // Add to invitations store
    const invitation: Invitation = {
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
    }

    invitationStore.addInvitation(invitation)

    // Show notification
    const inviterName = data.inviterFirstName || data.inviterNickName
    Notify.create({
      type: 'info',
      message: `${inviterName} invited you to ${data.channelName}`,
      icon: 'mail',
      actions: [{ label: 'View', color: 'white' }],
    })
  }

  const handleInvitationAccepted = (data: InvitationAcceptedData) => {
    console.log('[UserEvents] invitation_accepted:', data)

    // Remove from pending invitations list (if in invite dialog)
    invitationStore.removeInvitation(data.invitationId)

    // Show notification
    const userName = data.userFirstName || data.userNickName
    Notify.create({
      type: 'positive',
      message: `${userName} accepted your invitation to ${data.channelName}`,
      icon: 'check_circle',
    })
  }

  const handleInvitationDeclined = (data: InvitationDeclinedData) => {
    console.log('[UserEvents] invitation_declined:', data)

    // Remove from pending invitations list
    invitationStore.removeInvitation(data.invitationId)

    // Show notification
    const userName = data.userFirstName || data.userNickName
    Notify.create({
      type: 'info',
      message: `${userName} declined your invitation to ${data.channelName}`,
      icon: 'info',
    })
  }

  const subscribeToUserEvents = (targetUserId: number) => {
    console.log('[UserEvents] Subscribing to user events:', targetUserId)

    const messageHandler = (message: any) => {
      console.log('[UserEvents] Received message:', message)

      switch (message.type) {
        case 'invitation_received':
          handleInvitationReceived(message.data)
          break
        case 'invitation_accepted':
          handleInvitationAccepted(message.data)
          break
        case 'invitation_declined':
          handleInvitationDeclined(message.data)
          break
        case 'user_joined_channel':
          callbacks?.onUserJoinedChannel?.(message.data)
          break
        case 'user_left_channel':
          callbacks?.onUserLeftChannel?.(message.data)
          break
        default:
          console.log('[UserEvents] Unknown message type:', message.type)
      }
    }

    const { unsubscribe } = transmitService.subscribeToUser(targetUserId, messageHandler)
    unsubscribeFn = unsubscribe
  }

  const unsubscribeFromUserEvents = () => {
    if (unsubscribeFn) {
      console.log('[UserEvents] Unsubscribing from user events')
      unsubscribeFn()
      unsubscribeFn = null
    }
  }

  onMounted(() => {
    if (userId) {
      subscribeToUserEvents(userId)
    }
  })

  onUnmounted(() => {
    unsubscribeFromUserEvents()
  })

  return {
    subscribeToUserEvents,
    unsubscribeFromUserEvents,
  }
}
