<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>IRC Chat App</q-toolbar-title>

        <div v-if="authStore.user" class="row items-center q-gutter-sm">
          <q-chip
            :label="`@${authStore.user.nickName}`"
            color="primary"
            text-color="white"
            size="sm"
          />
          <q-btn-dropdown flat round icon="account_circle">
            <q-list>
              <q-item clickable @click="$router.push('/profile')">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Profile</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable @click="$router.push('/sessions')">
                <q-item-section avatar>
                  <q-icon name="devices" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Sessions</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-negative">Logout</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Navigation</q-item-label>

        <q-item clickable @click="$router.push('/')" :active="$route.path === '/'">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Home</q-item-label>
            <q-item-label caption>Main chat area</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="$router.push('/profile')" :active="$route.path === '/profile'">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Profile</q-item-label>
            <q-item-label caption>Account settings</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="$router.push('/sessions')" :active="$route.path === '/sessions'">
          <q-item-section avatar>
            <q-icon name="devices" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Sessions</q-item-label>
            <q-item-label caption>Device management</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item-label header>Account</q-item-label>

        <q-item v-if="authStore.user">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="md">
              {{ getInitials() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ authStore.user.fullName }}</q-item-label>
            <q-item-label caption>@{{ authStore.user.nickName }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="handleLogout">
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">Logout</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

const router = useRouter();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const getInitials = () => {
  if (!authStore.user) return '??'

  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''

  if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName && firstName.length > 0) {
    return firstName[0].toUpperCase()
  } else if (authStore.user?.nickName && authStore.user.nickName.length > 0) {
    return authStore.user.nickName[0].toUpperCase()
  }

  return '??'
}

const handleLogout = async () => {
  await authStore.logout();
  await router.push('/auth/login');
}
</script>
