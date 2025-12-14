import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { transmitService } from '@/services/transmit'
import { api } from 'src/boot/axios'
import { useAuthStore } from './auth-store'
import { useChannelStore } from './channel-store'

export type PresenceStatus = 'online' | 'dnd' | 'offline'

const STORAGE_KEY = 'presence-status'
const STORAGE_PREF_KEY = 'presence-preferred'

const readInitialStatus = (): PresenceStatus => {
  if (typeof localStorage === 'undefined') return 'online'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dnd' || stored === 'offline') return stored
  return 'online'
}

export const usePresenceStore = defineStore('presence', () => {
  const status = ref<PresenceStatus>(readInitialStatus())
  const preferredStatus = ref<PresenceStatus>((() => {
    if (typeof localStorage === 'undefined') return status.value
    const stored = localStorage.getItem(STORAGE_PREF_KEY)
    if (stored === 'online' || stored === 'dnd' || stored === 'offline') return stored
    return status.value
  })())
  const authStore = useAuthStore()
  const channelStore = useChannelStore()

  const isOnline = computed(() => status.value === 'online')
  const isDnd = computed(() => status.value === 'dnd')
  const isOffline = computed(() => status.value === 'offline')

  const persistStatus = (value: PresenceStatus) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, value)
  }

  const persistPreferredStatus = (value: PresenceStatus) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_PREF_KEY, value)
  }

  const applyConnection = (value: PresenceStatus) => {
    transmitService.setConnectionMode(value === 'offline' ? 'offline' : 'online')
  }

  const applyLocalStatus = (
    value: PresenceStatus,
    options?: { updatePreferred?: boolean; skipPersist?: boolean }
  ) => {
    const updatePreferred = options?.updatePreferred ?? false
    const skipPersist = options?.skipPersist ?? false

    status.value = value
    if (authStore.user) {
      authStore.user.status = value
    }
    if (authStore.user?.id) {
      channelStore.updateMemberStatus(authStore.user.id, value)
    }

    if (updatePreferred) {
      preferredStatus.value = value
    }

    if (!skipPersist) {
      persistStatus(value)
      if (updatePreferred) {
        persistPreferredStatus(value)
      }
    }
  }

  const hydrateStatus = (value: PresenceStatus, options?: { updatePreferred?: boolean; skipPersist?: boolean }) => {
    applyLocalStatus(value, options)
  }

  const setStatus = async (
    value: PresenceStatus,
    options?: { force?: boolean; skipRemote?: boolean; skipPersist?: boolean; updatePreferred?: boolean }
  ) => {
    const force = options?.force === true
    const skipRemote = options?.skipRemote === true
    const skipPersist = options?.skipPersist === true
    const updatePreferred = options?.updatePreferred ?? true
    if (!force && status.value === value) {
      if (updatePreferred && preferredStatus.value !== value) {
        applyLocalStatus(value, { updatePreferred, skipPersist })
      }
      return
    }

    try {
      if (!skipRemote && localStorage.getItem('auth_token')) {
        await api.put('/api/users/status', { status: value })
      }
      applyLocalStatus(value, { updatePreferred, skipPersist })
    } catch (error: any) {
      if (value === 'offline') {
        applyLocalStatus(value, { updatePreferred, skipPersist: true })
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
      applyConnection(value)
    },
    { immediate: true }
  )

  return {
    status,
    preferredStatus,
    isOnline,
    isDnd,
    isOffline,
    setStatus,
    hydrateStatus,
    async syncWithServer(serverStatus: PresenceStatus) {
      const desiredStatus =
        serverStatus === 'offline' && preferredStatus.value !== 'offline'
          ? preferredStatus.value
          : serverStatus

      if (desiredStatus === preferredStatus.value && desiredStatus !== serverStatus) {
        await setStatus(desiredStatus, { force: true })
      } else {
        await setStatus(desiredStatus, { force: true, skipRemote: true, updatePreferred: true })
      }
    },
  }
})
