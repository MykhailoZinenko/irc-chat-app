<template>
  <q-dialog v-model="isOpen" @hide="handleClose">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Invite to Channel</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="searchQuery"
          placeholder="Search channels..."
          outlined
          dense
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="loading" class="flex justify-center q-py-md">
          <q-spinner size="32px" color="primary" />
        </div>

        <div v-else-if="filteredChannels.length === 0" class="text-center text-grey-6 q-py-md">
          No channels found
        </div>

        <q-list v-else class="rounded-borders" style="max-height: 300px; overflow-y: auto">
          <q-item
            v-for="channel in filteredChannels"
            :key="channel.id"
            clickable
            v-ripple
            @click="toggleChannel(channel.id)"
            :disable="channelHasPendingInvitation(channel.id)"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="selectedChannels.has(channel.id)"
                @update:model-value="toggleChannel(channel.id)"
                color="primary"
                :disable="channelHasPendingInvitation(channel.id)"
              />
            </q-item-section>

            <q-item-section avatar>
              <div class="text-2xl">{{ channel.type === 'public' ? '📢' : '🔒' }}</div>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ channel.name }}</q-item-label>
              <q-item-label caption>
                <span v-if="channelHasPendingInvitation(channel.id)" class="text-orange-600">
                  Invitation pending
                </span>
                <span v-else>{{ channel.memberCount }} members</span>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey-7" v-close-popup />
        <q-btn
          unelevated
          label="Invite"
          color="primary"
          :disable="selectedChannels.size === 0 || sending"
          :loading="sending"
          @click="handleInvite"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChannelStore } from '@/stores/channel-store'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

interface Props {
  modelValue: boolean
  userId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const channelStore = useChannelStore()
const searchQuery = ref('')
const selectedChannels = ref(new Set<number>())
const loading = ref(false)
const sending = ref(false)
const pendingInvitations = ref<Array<{ id: number; channelId: number }>>([])

interface PendingInvitation {
  id: number
  channelId: number
  channelName: string
  createdAt: string
  expiresAt: string | null
}

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const filteredChannels = computed(() => {
  // Filter channels where user can invite:
  // - Private channels: only if user is admin
  // - Public channels: only if user is admin
  const invitableChannels = channelStore.channels.filter((c) => {
    if (c.type === 'private') {
      return c.role === 'admin'
    }
    if (c.type === 'public') {
      return c.role === 'admin'
    }
    return false
  })

  if (!searchQuery.value) {
    return invitableChannels
  }

  const query = searchQuery.value.toLowerCase()
  return invitableChannels.filter((c) => c.name.toLowerCase().includes(query))
})

const channelHasPendingInvitation = (channelId: number) => {
  return pendingInvitations.value.some((inv) => inv.channelId === channelId)
}

const toggleChannel = (channelId: number) => {
  if (channelHasPendingInvitation(channelId)) {
    return
  }

  if (selectedChannels.value.has(channelId)) {
    selectedChannels.value.delete(channelId)
  } else {
    selectedChannels.value.add(channelId)
  }
}

const handleInvite = async () => {
  sending.value = true

  try {
    const invitePromises = Array.from(selectedChannels.value).map((channelId) =>
      api.post(`/api/channels/${channelId}/invite`, {
        userId: props.userId,
      })
    )

    await Promise.all(invitePromises)

    Notify.create({
      type: 'positive',
      message: `Invitation${selectedChannels.value.size > 1 ? 's' : ''} sent successfully`,
    })

    handleClose()
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to send invitation',
    })
  } finally {
    sending.value = false
  }
}

const handleClose = () => {
  searchQuery.value = ''
  selectedChannels.value.clear()
  emit('update:modelValue', false)
}

watch(isOpen, async (newValue) => {
  if (newValue) {
    loading.value = true
    try {
      await Promise.all([
        channelStore.fetchChannels(),
        api.get<{ success: boolean; data: { invitations: PendingInvitation[] } }>(
          `/api/users/${props.userId}/invitations`
        ).then((response) => {
          if (response.data.success) {
            pendingInvitations.value = response.data.data.invitations
          }
        })
      ])
    } finally {
      loading.value = false
    }
  }
})
</script>
