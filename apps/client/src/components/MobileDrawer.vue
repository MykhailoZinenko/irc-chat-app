<template>
  <q-drawer
    v-model="drawerOpen"
    overlay
    behavior="mobile"
    :width="$q.screen.width * 0.8"
    class="mobile-menu-drawer"
  >
    <div class="mobile-menu-content">
      <div class="mobile-menu-header">
        <q-avatar size="60px" color="primary" text-color="white">
          {{ getUserInitials() }}
        </q-avatar>
        <div class="mobile-menu-user-info">
          <div class="mobile-menu-name">{{ authStore.user?.fullName || authStore.user?.nickName }}</div>
          <div class="mobile-menu-nickname">@{{ authStore.user?.nickName }}</div>
        </div>
      </div>

      <q-list class="mobile-menu-list">
        <q-item clickable @click="navigateToProfile" class="mobile-menu-item">
          <q-item-section avatar>
            <q-icon name="account_circle" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>My Profile</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="navigateToContacts" class="mobile-menu-item">
          <q-item-section avatar>
            <q-icon name="contacts" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Contacts</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="navigateToSessions" class="mobile-menu-item">
          <q-item-section avatar>
            <q-icon name="devices" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Sessions</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="navigateToSettings" class="mobile-menu-item">
          <q-item-section avatar>
            <q-icon name="settings" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Settings</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="mobile-menu-separator" />

        <q-item clickable @click="handleLogout" class="mobile-menu-item logout-item">
          <q-item-section avatar>
            <q-icon name="logout" size="24px" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">Logout</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { getInitials } from 'src/utils/user'
import { useMobile } from 'src/composables/useMobile'

const router = useRouter()
const authStore = useAuthStore()
const { drawerOpen, closeDrawer } = useMobile()

const getUserInitials = () => {
  if (authStore.user) {
    return getInitials({
      id: authStore.user.id,
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName,
      nickName: authStore.user.nickName,
      fullName: authStore.user.fullName,
      createdAt: authStore.user.createdAt
    })
  }
  return '??'
}

const navigateToProfile = async () => {
  closeDrawer()
  await router.push('/profile/me')
}

const navigateToContacts = async () => {
  closeDrawer()
  await router.push('/contacts')
}

const navigateToSessions = async () => {
  closeDrawer()
  await router.push('/sessions')
}

const navigateToSettings = async () => {
  closeDrawer()
  await router.push('/profile/me')
}

const handleLogout = async () => {
  closeDrawer()
  await authStore.logout()
  await router.push('/auth/login')
}
</script>

<style scoped>
.mobile-menu-drawer {
  background: white;
}

.mobile-menu-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-menu-header {
  padding: 32px 20px 24px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-menu-user-info {
  flex: 1;
}

.mobile-menu-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.mobile-menu-nickname {
  font-size: 14px;
  color: #86868b;
}

.mobile-menu-list {
  flex: 1;
  padding: 0;
}

.mobile-menu-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f4;
}

.mobile-menu-item:last-child {
  border-bottom: none;
}

.mobile-menu-separator {
  margin: 12px 0;
  background-color: #e9ecef;
}

.logout-item {
  margin-top: auto;
}
</style>