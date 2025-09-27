<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h5 q-mb-md">Active Sessions</div>
            <div class="text-subtitle2 text-grey-7 q-mb-lg">
              Manage your active login sessions across different devices
            </div>

            <div class="q-mb-lg">
              <q-btn
                label="Logout from All Devices"
                color="negative"
                outline
                icon="logout"
                @click="confirmLogoutAll = true"
                :loading="authStore.isLoading"
              />
            </div>

            <q-separator />
          </q-card-section>

          <q-card-section v-if="authStore.isLoading && !authStore.sessions.length">
            <div class="row justify-center q-py-lg">
              <q-spinner size="50px" color="primary" />
            </div>
          </q-card-section>

          <q-card-section v-else-if="!authStore.sessions.length">
            <div class="text-center text-grey-6 q-py-lg">
              <q-icon name="devices" size="64px" class="q-mb-md" />
              <div class="text-h6">No active sessions</div>
              <div class="text-body2">You don't have any active sessions</div>
            </div>
          </q-card-section>

          <q-list v-else>
            <q-item
              v-for="session in authStore.sessions"
              :key="session.id"
              class="q-pa-md"
            >
              <q-item-section avatar>
                <q-avatar :color="session.isCurrent ? 'primary' : 'grey-5'" text-color="white" size="md">
                  <q-icon :name="getDeviceIcon(session.deviceType)" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-subtitle1">
                  {{ session.deviceName || 'Unknown Device' }}
                  <q-chip
                    v-if="session.isCurrent"
                    label="Current"
                    color="primary"
                    text-color="white"
                    size="sm"
                    class="q-ml-sm"
                  />
                </q-item-label>
                <q-item-label caption class="text-grey-7">
                  <div>{{ formatDeviceType(session.deviceType) }}</div>
                  <div v-if="session.ipAddress">IP: {{ session.ipAddress }}</div>
                  <div v-if="session.lastActivityAt">
                    Last active: {{ formatDate(session.lastActivityAt) }}
                  </div>
                  <div>Created: {{ formatDate(session.createdAt) }}</div>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  v-if="session.isCurrent"
                  flat
                  round
                  color="warning"
                  icon="logout"
                  @click="revokeSession(session)"
                  :disable="authStore.isLoading"
                >
                  <q-tooltip>Logout from this device</q-tooltip>
                </q-btn>
                <q-btn
                  v-else
                  flat
                  round
                  color="negative"
                  icon="logout"
                  @click="revokeSession(session)"
                  :disable="authStore.isLoading"
                >
                  <q-tooltip>Revoke this session</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- Logout All Confirmation Dialog -->
    <q-dialog v-model="confirmLogoutAll" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Logout from All Devices?</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2">
            This will log you out from all devices including this one. You'll need to login again.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="confirmLogoutAll = false" />
          <q-btn
            flat
            label="Logout All"
            color="negative"
            @click="handleLogoutAll"
            :loading="authStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Revoke Session Confirmation Dialog -->
    <q-dialog v-model="confirmRevoke" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Revoke Session?</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2">
            <span v-if="sessionToRevoke?.isCurrent">
              This will log out your current session and redirect you to login.
            </span>
            <span v-else>
              This will immediately log out the session "{{ sessionToRevoke?.deviceName || 'Unknown Device' }}" on that device.
            </span>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="confirmRevoke = false" />
          <q-btn
            flat
            label="Revoke"
            color="negative"
            @click="handleRevokeSession"
            :loading="authStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type Session } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const confirmLogoutAll = ref(false)
const confirmRevoke = ref(false)
const sessionToRevoke = ref<Session | null>(null)

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return 'smartphone'
    case 'desktop':
      return 'desktop_windows'
    case 'web':
    default:
      return 'web'
  }
}

const formatDeviceType = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return 'Mobile Device'
    case 'desktop':
      return 'Desktop Application'
    case 'web':
    default:
      return 'Web Browser'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minute(s) ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour(s) ago`
  } else {
    return date.toLocaleDateString()
  }
}

const revokeSession = (session: Session) => {
  sessionToRevoke.value = session
  confirmRevoke.value = true
}

const handleRevokeSession = async () => {
  if (sessionToRevoke.value) {
    const isCurrentSession = sessionToRevoke.value.isCurrent

    await authStore.revokeSession(sessionToRevoke.value.id)
    confirmRevoke.value = false
    sessionToRevoke.value = null

    // If we just revoked our current session, logout and redirect
    if (isCurrentSession) {
      authStore.clearAuthData()
      await router.push('/auth/login')
    }
  }
}

const handleLogoutAll = async () => {
  await authStore.logoutAll()
  confirmLogoutAll.value = false
  await router.push('/auth/login')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }

  await authStore.fetchSessions()
})
</script>