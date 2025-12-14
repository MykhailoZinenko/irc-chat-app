<template>
  <div class="flex-1 flex flex-col bg-white h-full">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <q-spinner size="48px" color="primary" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <q-btn
            icon="arrow_back"
            flat
            round
            dense
            @click="$emit('back')"
          />
          <div>
            <h2 class="text-xl font-bold text-gray-800">Invitations</h2>
            <p class="text-sm text-gray-500">{{ invitations.length }} pending</p>
          </div>
        </div>
      </div>

      <!-- Invitations List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="invitations.length === 0" class="flex flex-col items-center justify-center h-full p-8">
          <div class="text-6xl mb-4">📬</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No pending invitations</h3>
          <p class="text-gray-500 text-center">When someone invites you to a channel, you'll see it here</p>
        </div>

        <div v-else class="p-4 space-y-3">
          <div
            v-for="invitation in invitations"
            :key="invitation.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <!-- Channel Info -->
            <div class="flex items-start gap-3 mb-3">
              <div class="w-12 h-12 rounded-full app-gradient flex items-center justify-center text-2xl flex-shrink-0">
                {{ invitation.channel.type === 'public' ? '📢' : '🔒' }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-800 truncate">
                  {{ invitation.channel.name }}
                </h3>
                <p v-if="invitation.channel.description" class="text-sm text-gray-600 line-clamp-2">
                  {{ invitation.channel.description }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ invitation.channel.type === 'public' ? 'Public' : 'Private' }} channel
                </p>
              </div>
            </div>

            <!-- Inviter Info -->
            <div class="flex items-center gap-2 mb-4 pl-15">
              <q-icon name="person" size="16px" class="text-gray-400" />
              <span class="text-sm text-gray-600">
                Invited by <span class="font-medium text-gray-800">{{ getInviterName(invitation) }}</span>
              </span>
              <span class="text-xs text-gray-400">• {{ formatDate(invitation.createdAt) }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <q-btn
                unelevated
                color="primary"
                label="Accept"
                class="flex-1"
                :loading="processingInvitation === invitation.id"
                :disable="processingInvitation !== null"
                @click="handleAccept(invitation.id)"
              />
              <q-btn
                outline
                color="grey-7"
                label="Decline"
                class="flex-1"
                :loading="processingInvitation === invitation.id"
                :disable="processingInvitation !== null"
                @click="handleDecline(invitation.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import { DateTime } from 'luxon'
import { useChannelStore } from '@/stores/channel-store'
import { useInvitationStore } from '@/stores/invitation-store'
import { useSelectionStore } from '@/stores/selection-store'
import { transmitService } from '@/services/transmit'

const channelStore = useChannelStore()
const invitationStore = useInvitationStore()
const selectionStore = useSelectionStore()

const emit = defineEmits<{
  back: []
}>()

const loading = ref(false)
const processingInvitation = ref<number | null>(null)

// Use invitations from store
const invitations = computed(() => invitationStore.invitations)


const handleAccept = async (invitationId: number) => {
  processingInvitation.value = invitationId

  // Get the invitation to know which channel we're joining
  const invitation = invitations.value.find((inv) => inv.id === invitationId)

  try {
    await transmitService.emit('channel:acceptInvitation', { invitationId })

    Notify.create({
      type: 'positive',
      message: 'Invitation accepted! You joined the channel.',
    })

    // Remove from store
    invitationStore.removeInvitation(invitationId)

    // Refresh channels list to include new channel
    await channelStore.fetchChannels()

    // Select the new channel and go back to chat view
    if (invitation) {
      selectionStore.selectChannel(invitation.channelId)
      emit('back')
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to accept invitation',
    })
  } finally {
    processingInvitation.value = null
  }
}

const handleDecline = async (invitationId: number) => {
  processingInvitation.value = invitationId
  try {
    await transmitService.emit('channel:declineInvitation', { invitationId })

    Notify.create({
      type: 'info',
      message: 'Invitation declined',
    })

    // Remove from store
    invitationStore.removeInvitation(invitationId)
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to decline invitation',
    })
  } finally {
    processingInvitation.value = null
  }
}

const getInviterName = (invitation: typeof invitations.value[0]) => {
  const parts = [invitation.inviter.firstName, invitation.inviter.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : invitation.inviter.nickName
}

const formatDate = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  const now = DateTime.now()
  const diff = now.diff(date, ['days', 'hours', 'minutes'])

  if (diff.days >= 1) {
    return date.toFormat('MMM d')
  } else if (diff.hours >= 1) {
    return `${Math.floor(diff.hours)}h ago`
  } else {
    return `${Math.floor(diff.minutes)}m ago`
  }
}

</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
