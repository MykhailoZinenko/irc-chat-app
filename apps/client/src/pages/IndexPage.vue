<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section class="text-center bg-primary text-white">
            <div class="text-h4 q-mb-sm">Welcome to IRC Chat!</div>
            <div class="text-subtitle1" v-if="authStore.user">
              Hello, {{ authStore.user.fullName || authStore.user.nickName }}! 👋
            </div>
          </q-card-section>

          <q-card-section v-if="authStore.user">
            <div class="text-h6 q-mb-md">Your Account Summary</div>

            <div class="row q-gutter-lg">
              <div class="col-12 col-sm-6">
                <q-card flat bordered class="q-pa-md">
                  <div class="row items-center q-gutter-sm">
                    <q-avatar color="primary" text-color="white" size="lg">
                      {{ getInitials() }}
                    </q-avatar>
                    <div>
                      <div class="text-h6">{{ authStore.user.fullName }}</div>
                      <div class="text-subtitle2 text-grey-7">@{{ authStore.user.nickName }}</div>
                      <div class="text-caption text-grey-6">{{ authStore.user.email }}</div>
                    </div>
                  </div>
                </q-card>
              </div>

              <div class="col-12 col-sm-5">
                <q-card flat bordered class="q-pa-md">
                  <div class="text-subtitle1 q-mb-sm">Quick Actions</div>
                  <div class="q-gutter-sm">
                    <q-btn
                      label="View Profile"
                      color="primary"
                      outline
                      icon="person"
                      @click="$router.push('/profile')"
                      class="full-width"
                    />
                    <q-btn
                      label="Manage Sessions"
                      color="secondary"
                      outline
                      icon="devices"
                      @click="$router.push('/sessions')"
                      class="full-width"
                    />
                  </div>
                </q-card>
              </div>
            </div>

            <q-separator class="q-my-lg" />

            <!-- Backend Connection Test -->
            <div class="text-h6 q-mb-md">Backend Connection Test</div>

            <div v-if="loading" class="text-center q-py-lg">
              <q-spinner color="primary" size="3em" />
              <div class="q-mt-sm">Testing backend connection...</div>
            </div>

            <div v-else-if="backendData" class="q-mb-md">
              <q-card flat bordered class="q-pa-md">
                <div class="text-positive q-mb-sm">
                  <q-icon name="check_circle" class="q-mr-sm" />
                  Backend Connected Successfully!
                </div>

                <div class="text-body2 q-mb-md">{{ backendData.message }}</div>
                <div class="text-caption text-grey-6">{{ backendData.timestamp }}</div>

                <div class="q-mt-md">
                  <div class="text-subtitle2 q-mb-sm">Available Channels:</div>
                  <div class="row q-gutter-sm">
                    <q-chip
                      v-for="channel in backendData.channels"
                      :key="channel.id"
                      :label="`#${channel.name} (${channel.memberCount})`"
                      color="primary"
                      outline
                    />
                  </div>
                </div>
              </q-card>

              <q-btn
                label="Refresh Connection"
                color="primary"
                outline
                icon="refresh"
                @click="testConnection"
                :loading="loading"
                class="q-mt-sm"
              />
            </div>

            <div v-else-if="connectionError" class="text-center q-py-lg">
              <q-icon name="error" color="negative" size="3em" />
              <div class="text-h6 text-negative q-mt-sm">Connection Failed</div>
              <div class="text-body2 q-mb-md">{{ connectionError }}</div>
              <q-btn
                label="Retry Connection"
                color="negative"
                outline
                @click="testConnection"
              />
            </div>

            <q-btn
              v-if="!backendData && !connectionError && !loading"
              label="Test Backend Connection"
              color="primary"
              @click="testConnection"
              class="full-width"
            />
          </q-card-section>
        </q-card>

        <!-- Authentication Features Demo -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Multi-Device Authentication Features</div>
            <div class="text-body2 q-mb-md">
              This IRC chat app now includes comprehensive multi-device authentication with the following features:
            </div>

            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="security" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Secure Authentication</q-item-label>
                  <q-item-label caption>JWT tokens with device tracking</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="devices" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Multi-Device Support</q-item-label>
                  <q-item-label caption>Login from multiple devices simultaneously</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="manage_accounts" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Session Management</q-item-label>
                  <q-item-label caption>View and revoke active sessions</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="person" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>User Profiles</q-item-label>
                  <q-item-label caption>Manage personal information and settings</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { api } from 'boot/axios'

const authStore = useAuthStore()

const loading = ref(false)
const backendData = ref<any>(null)
const connectionError = ref('')

const getInitials = () => {
  if (!authStore.user) return '??'

  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName) {
    return firstName[0].toUpperCase()
  } else if (authStore.user?.nickName) {
    return authStore.user.nickName[0].toUpperCase()
  }

  return '??'
}

const testConnection = async () => {
  loading.value = true
  connectionError.value = ''
  backendData.value = null

  try {
    const response = await api.get('/api/test')
    backendData.value = response.data
  } catch (error: any) {
    connectionError.value = error.response?.data?.message || error.message || 'Failed to connect to backend'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  testConnection()
})
</script>
