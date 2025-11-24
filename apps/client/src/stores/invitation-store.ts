import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'

export interface Invitation {
  id: number
  channelId: number
  channel: {
    id: number
    name: string
    type: 'public' | 'private'
    description: string | null
  }
  inviter: {
    id: number
    nickName: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  createdAt: string
  expiresAt: string | null
}

export const useInvitationStore = defineStore('invitation', () => {
  const invitations = ref<Invitation[]>([])

  const fetchInvitations = async () => {
    try {
      const response = await api.get<{
        success: boolean
        data: { invitations: Invitation[] }
      }>('/api/users/invitations')

      if (response.data.success) {
        invitations.value = response.data.data.invitations
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    }
  }

  const addInvitation = (invitation: Invitation) => {
    // Check if invitation already exists
    const exists = invitations.value.some((inv) => inv.id === invitation.id)
    if (!exists) {
      invitations.value.unshift(invitation)
    }
  }

  const removeInvitation = (invitationId: number) => {
    invitations.value = invitations.value.filter((inv) => inv.id !== invitationId)
  }

  return {
    invitations,
    fetchInvitations,
    addInvitation,
    removeInvitation,
  }
})
