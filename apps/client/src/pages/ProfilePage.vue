<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h5 q-mb-md">Profile</div>
            <div class="text-subtitle2 text-grey-7 q-mb-lg">
              Your account information and settings
            </div>
          </q-card-section>

          <q-card-section v-if="authStore.user">
            <div class="row q-gutter-lg">
              <!-- Profile Avatar -->
              <div class="col-12 col-md-3 text-center">
                <q-avatar size="120px" color="primary" text-color="white" class="q-mb-md">
                  <span class="text-h4">{{ getInitials() }}</span>
                </q-avatar>
                <div class="text-h6">{{ authStore.user.fullName }}</div>
                <div class="text-caption text-grey-7">@{{ authStore.user.nickName }}</div>
              </div>

              <!-- Profile Information -->
              <div class="col-12 col-md-8">
                <div class="q-gutter-md">
                  <q-input
                    v-model="authStore.user.firstName"
                    label="First Name"
                    outlined
                    readonly
                  >
                    <template v-slot:prepend>
                      <q-icon name="person" />
                    </template>
                  </q-input>

                  <q-input
                    v-model="authStore.user.lastName"
                    label="Last Name"
                    outlined
                    readonly
                  >
                    <template v-slot:prepend>
                      <q-icon name="person_outline" />
                    </template>
                  </q-input>

                  <q-input
                    v-model="authStore.user.nickName"
                    label="Nickname"
                    outlined
                    readonly
                  >
                    <template v-slot:prepend>
                      <q-icon name="alternate_email" />
                    </template>
                  </q-input>

                  <q-input
                    v-model="authStore.user.email"
                    label="Email"
                    outlined
                    readonly
                  >
                    <template v-slot:prepend>
                      <q-icon name="mail" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="authStore.user.emailVerifiedAt ? 'verified' : 'warning'"
                        :color="authStore.user.emailVerifiedAt ? 'positive' : 'warning'"
                      >
                        <q-tooltip>
                          {{ authStore.user.emailVerifiedAt ? 'Email verified' : 'Email not verified' }}
                        </q-tooltip>
                      </q-icon>
                    </template>
                  </q-input>

                  <q-input
                    :model-value="authStore.user.sessionTimeoutDays.toString()"
                    label="Session Timeout (days)"
                    outlined
                    readonly
                  >
                    <template v-slot:prepend>
                      <q-icon name="schedule" />
                    </template>
                  </q-input>

                  <div class="row q-gutter-sm">
                    <q-input
                      :model-value="formatDate(authStore.user.createdAt)"
                      label="Member Since"
                      outlined
                      readonly
                      class="col"
                    >
                      <template v-slot:prepend>
                        <q-icon name="date_range" />
                      </template>
                    </q-input>

                    <q-input
                      v-if="authStore.user.updatedAt"
                      :model-value="formatDate(authStore.user.updatedAt)"
                      label="Last Updated"
                      outlined
                      readonly
                      class="col"
                    >
                      <template v-slot:prepend>
                        <q-icon name="update" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-h6 q-mb-md">Account Actions</div>
            <div class="q-gutter-sm">
              <q-btn
                label="Manage Sessions"
                color="primary"
                outline
                icon="devices"
                @click="$router.push('/sessions')"
              />

              <q-btn
                label="Logout"
                color="negative"
                outline
                icon="logout"
                @click="confirmLogout = true"
                :loading="authStore.isLoading"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Account Statistics -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Account Statistics</div>
            <div class="row q-gutter-lg">
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-md">
                  <q-card-section>
                    <q-icon name="devices" size="32px" color="primary" class="q-mb-sm" />
                    <div class="text-h6">{{ authStore.sessions.length }}</div>
                    <div class="text-caption text-grey-7">Active Sessions</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-md">
                  <q-card-section>
                    <q-icon name="schedule" size="32px" color="info" class="q-mb-sm" />
                    <div class="text-h6">{{ authStore.user?.sessionTimeoutDays }}d</div>
                    <div class="text-caption text-grey-7">Session Timeout</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-md">
                  <q-card-section>
                    <q-icon
                      :name="authStore.user?.emailVerifiedAt ? 'verified' : 'warning'"
                      size="32px"
                      :color="authStore.user?.emailVerifiedAt ? 'positive' : 'warning'"
                      class="q-mb-sm"
                    />
                    <div class="text-h6">{{ authStore.user?.emailVerifiedAt ? 'Yes' : 'No' }}</div>
                    <div class="text-caption text-grey-7">Email Verified</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="text-center q-pa-md">
                  <q-card-section>
                    <q-icon name="calendar_today" size="32px" color="secondary" class="q-mb-sm" />
                    <div class="text-h6">{{ getDaysActive() }}</div>
                    <div class="text-caption text-grey-7">Days Active</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Logout Confirmation Dialog -->
    <q-dialog v-model="confirmLogout" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Logout Confirmation</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2">
            Are you sure you want to logout? This will end your current session.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="confirmLogout = false" />
          <q-btn
            flat
            label="Logout"
            color="negative"
            @click="handleLogout"
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
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const confirmLogout = ref(false)

const getInitials = () => {
  if (!authStore.user) return '??'

  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName) {
    return firstName[0].toUpperCase()
  } else if (authStore.user.nickName) {
    return authStore.user.nickName[0].toUpperCase()
  }

  return '??'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getDaysActive = () => {
  if (!authStore.user) return 0

  const createdDate = new Date(authStore.user.createdAt)
  const now = new Date()
  const diffInMs = now.getTime() - createdDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  return Math.max(1, diffInDays)
}

const handleLogout = async () => {
  await authStore.logout()
  confirmLogout.value = false
  router.push('/auth/login')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/auth/login')
    return
  }

  // Fetch sessions for stats
  await authStore.fetchSessions()
})
</script>