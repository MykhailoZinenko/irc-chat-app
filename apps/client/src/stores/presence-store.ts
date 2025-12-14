import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { transmitService } from '@/services/transmit'
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth-store'
import { useChannelStore } from './channel-store'

export type PresenceStatus = 'online' | 'dnd' | 'offline'

const STORAGE_KEY = 'presence-status'

const readInitialStatus = (): PresenceStatus => {
  if (typeof localStorage === 'undefined') return 'online'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dnd' || stored === 'offline') return stored
  return 'online'
}

export const usePresenceStore = defineStore('presence', () => {
  const status = ref<PresenceStatus>(readInitialStatus())
  const authStore = useAuthStore()
  const channelStore = useChannelStore()

  const isOnline = computed(() => status.value === 'online')
  const isDnd = computed(() => status.value === 'dnd')
  const isOffline = computed(() => status.value === 'offline')

  const persistStatus = (value: PresenceStatus) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, value)
  }

  const applyConnection = (value: PresenceStatus) => {
    transmitService.setConnectionMode(value === 'offline' ? 'offline' : 'online')
  }

  const hydrateStatus = (value: PresenceStatus) => {
    status.value = value
    if (authStore.user) {
      authStore.user.status = value
    }
    if (authStore.user?.id) {
      channelStore.updateMemberStatus(authStore.user.id, value)
    }
  }

  const setStatus = async (value: PresenceStatus, options?: { force?: boolean }) => {
    const force = options?.force === true
    if (!force && status.value === value) return

    try {
      if (localStorage.getItem('auth_token')) {
        await api.put('/api/users/status', { status: value })
      }
      status.value = value
      if (authStore.user) {
        authStore.user.status = value
      }
      if (authStore.user?.id) {
        channelStore.updateMemberStatus(authStore.user.id, value)
      }
    } catch (error: any) {
      if (value === 'offline') {
        status.value = value
      }
      Notify.create({
        type: 'negative',
        message: error?.response?.data?.message || 'Failed to update status',
      })
    }
  }

  watch(
    status,
    (value) => {
      persistStatus(value)
      applyConnection(value)
    },
    { immediate: true }
  )

  return {
    status,
    isOnline,
    isDnd,
    isOffline,
    setStatus,
    hydrateStatus,
    async syncWithServer(serverStatus: PresenceStatus) {
      if (status.value !== serverStatus) {
        await setStatus(status.value, { force: true })
      } else {
        hydrateStatus(serverStatus)
      }
    },
  }
})
