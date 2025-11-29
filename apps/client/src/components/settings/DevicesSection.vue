<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Active Sessions</h3>
      <p class="text-sm text-gray-600 mb-6">Manage devices where you're logged in</p>

      <div v-if="authStore.isLoading" class="text-center py-8">
        <q-spinner color="blue" size="32px" />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="session in authStore.sessions"
          :key="session.id"
          class="p-4 border border-gray-200 rounded-lg"
        >
          <div class="flex items-start justify-between">
            <div class="flex gap-3">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                session.isCurrent ? 'bg-blue-100' : 'bg-gray-100'
              ]">
                <q-icon
                  :name="getDeviceIcon(session.deviceType)"
                  size="20px"
                  :color="session.isCurrent ? 'blue' : 'grey-6'"
                />
              </div>
              <div>
                <p class="font-medium text-gray-800">{{ session.deviceName || 'Unknown Device' }}</p>
                <p class="text-sm text-gray-500">{{ session.deviceType }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ formatTime(session.lastActivityAt) }} • {{ session.ipAddress }}
                </p>
              </div>
            </div>
            <span
              v-if="session.isCurrent"
              class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
            >
              Current
            </span>
            <Button
              v-else
              variant="outline"
              tone="danger"
              :full-width="false"
              padding="6px 10px"
              @click="handleRevokeSession(session.id)"
            >
              Terminate
            </Button>
          </div>
        </div>

        <div v-if="authStore.sessions.length === 0" class="text-center py-8 text-gray-500">
          No active sessions found
        </div>
      </div>
    </div>
    <Button
      variant="outline"
      tone="danger"
      :full-width="true"
      :disable="authStore.sessions.length <= 1"
      @click="handleLogoutAll"
    >
      Terminate All Other Sessions
    </Button>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { DateTime } from 'luxon'
import { useQuasar } from 'quasar'
import Button from '@/components/ui/CustomButton.vue'

const authStore = useAuthStore()
const $q = useQuasar()

onMounted(async () => {
  await authStore.fetchSessions()
})

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return 'smartphone'
    case 'desktop':
      return 'computer'
    default:
      return 'language'
  }
}

const formatTime = (dateString: string | null) => {
  if (!dateString) return 'Unknown'

  const date = DateTime.fromISO(dateString)
  const now = DateTime.now()
  const diff = now.diff(date, ['days', 'hours', 'minutes']).toObject()

  if (diff.days && diff.days >= 1) {
    return `${Math.floor(diff.days)} day${Math.floor(diff.days) > 1 ? 's' : ''} ago`
  } else if (diff.hours && diff.hours >= 1) {
    return `${Math.floor(diff.hours)} hour${Math.floor(diff.hours) > 1 ? 's' : ''} ago`
  } else if (diff.minutes && diff.minutes >= 1) {
    return `${Math.floor(diff.minutes)} minute${Math.floor(diff.minutes) > 1 ? 's' : ''} ago`
  } else {
    return 'Active now'
  }
}

const handleRevokeSession = (sessionId: number) => {
  $q.dialog({
    title: 'Terminate Session',
    message: 'Are you sure you want to terminate this session?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    void authStore.revokeSession(sessionId)
  })
}

const handleLogoutAll = () => {
  $q.dialog({
    title: 'Terminate All Sessions',
    message: 'Are you sure you want to log out from all other devices? This will terminate all sessions except your current one.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    void authStore.logoutAll().then(() => {
      void authStore.fetchSessions()
    })
  })
}
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-3 > * + * {
  margin-top: 0.75rem;
}
.border {
  border-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-500 {
  color: #6b7280;
}
.text-gray-400 {
  color: #9ca3af;
}
.text-red-600 {
  color: #dc2626;
}
.text-red-700 {
  color: #b91c1c;
}
.text-green-700 {
  color: #15803d;
}
.bg-blue-100 {
  background-color: #dbeafe;
}
.bg-gray-100 {
  background-color: #f3f4f6;
}
.bg-green-100 {
  background-color: #dcfce7;
}
.w-full {
  width: 100%;
}
</style>
