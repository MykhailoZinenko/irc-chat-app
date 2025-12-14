<template>
  <q-page class="settings-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Sidebar -->
      <div
        :class="[
          'fixed lg:relative z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 h-full',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
      >
        <!-- Sidebar Header -->
        <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
          <h1 class="text-xl font-semibold text-gray-800">Settings</h1>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            class="close-btn-responsive"
            @click="sidebarOpen = false"
          />
        </div>

        <!-- Menu Items -->
        <q-scroll-area class="flex-1">
          <div class="p-3">
            <button
              v-for="item in menuItems"
              :key="item.id"
              :class="[
                'w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors',
                selectedSection === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              ]"
              @click="handleSelectSection(item.id)"
            >
              <q-icon
                :name="item.icon"
                size="20px"
                :color="selectedSection === item.id ? 'blue-6' : 'grey-6'"
              />
              <div class="flex-1 text-left">
                <p class="font-medium">{{ item.label }}</p>
                <p :class="['text-xs', selectedSection === item.id ? 'text-blue-500' : 'text-gray-500']">
                  {{ item.description }}
                </p>
              </div>
            </button>
          </div>
        </q-scroll-area>

        <!-- Logout Button -->
        <div class="p-3 border-t border-gray-200">
          <q-btn
            flat
            no-caps
            class="w-full logout-btn"
            padding="12px"
            @click="handleLogout"
          >
            <q-icon name="logout" size="20px" class="q-mr-sm" />
            <span class="font-medium">Logout</span>
          </q-btn>
        </div>
      </div>

      <!-- Overlay for mobile -->
      <div
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="sidebarOpen = false"
      />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <q-btn
              flat
              round
              dense
              icon="menu"
              color="grey-7"
              class="burger-btn-responsive"
              @click="sidebarOpen = !sidebarOpen"
            />
            <q-btn
              flat
              round
              dense
              icon="arrow_back"
              color="grey-7"
              @click="$router.push('/chat')"
            />
            <div>
              <h2 class="font-semibold text-gray-800 text-base leading-5">
                {{ currentSection?.label }}
              </h2>
              <p class="text-sm text-gray-500 leading-tight">
                {{ currentSection?.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <q-scroll-area class="flex-1">
          <div class="max-w-2xl mx-auto p-6">
            <component :is="renderSection" />
          </div>
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import ProfileSection from '@/components/settings/ProfileSection.vue'
import AccountSection from '@/components/settings/AccountSection.vue'
import NotificationsSection from '@/components/settings/NotificationsSection.vue'
import AppearanceSection from '@/components/settings/AppearanceSection.vue'
import DevicesSection from '@/components/settings/DevicesSection.vue'

const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(false)
const selectedSection = ref('profile')

const menuItems = [
  { id: 'profile', icon: 'person', label: 'Profile', description: 'Manage your personal information' },
  { id: 'account', icon: 'lock', label: 'Account', description: 'Security and account settings' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications', description: 'Manage notifications' },
  { id: 'appearance', icon: 'palette', label: 'Appearance', description: 'Customize your experience' },
  { id: 'devices', icon: 'smartphone', label: 'Devices', description: 'Manage active sessions' },
]

const currentSection = computed(() => {
  return menuItems.find(item => item.id === selectedSection.value)
})

const renderSection = computed(() => {
  const sections: Record<string, any> = {
    profile: ProfileSection,
    account: AccountSection,
    notifications: NotificationsSection,
    appearance: AppearanceSection,
    devices: DevicesSection,
  }
  return sections[selectedSection.value] || ProfileSection
})

const handleSelectSection = (id: string) => {
  selectedSection.value = id
  sidebarOpen.value = false
}

const handleLogout = async () => {
  await authStore.logout()
  void router.push('/login')
}
</script>

<style scoped>
.settings-page {
  padding: 0;
}

@media (min-width: 1024px) {
  .close-btn-responsive {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .burger-btn-responsive {
    display: none !important;
  }
}

.logout-btn {
  color: var(--app-danger) !important;
  justify-content: flex-start;
}

.logout-btn:hover {
  background-color: var(--app-danger-soft) !important;
}
</style>
