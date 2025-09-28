<template>
  <q-drawer
    v-model="leftDrawerOpen"
    show-if-above
    :width="350"
    :breakpoint="768"
    side="left"
    class="app-sidebar"
    v-show="$q.screen.gt.sm"
  >
    <!-- Sidebar Header with Menu and Search -->
    <div class="sidebar-header">
      <q-btn
        flat
        round
        dense
        icon="menu"
        color="grey-8"
        size="sm"
        class="menu-btn"
      >
        <q-menu>
          <q-list dense class="menu-list">
            <q-item clickable @click="openMyProfile">
              <q-item-section avatar>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>My Profile</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="navigateToContacts">
              <q-item-section avatar>
                <q-icon name="contacts" />
              </q-item-section>
              <q-item-section>Contacts</q-item-section>
            </q-item>
            <q-item clickable @click="navigateToSettings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>Settings</q-item-section>
            </q-item>
            <q-item clickable @click="navigateToSessions">
              <q-item-section avatar>
                <q-icon name="devices" />
              </q-item-section>
              <q-item-section>Sessions</q-item-section>
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
        </q-menu>
      </q-btn>

      <q-input
        v-model="searchQuery"
        placeholder="Search"
        dense
        borderless
        class="search-input"
        @update:model-value="onSearchQueryChange"
        @clear="clearSearch"
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-6" size="sm" />
        </template>
        <template v-slot:append v-if="searchQuery">
          <q-btn
            flat
            round
            dense
            icon="clear"
            color="grey-6"
            size="xs"
            @click="clearSearch"
          />
        </template>
      </q-input>
    </div>

    <!-- Chat List / Search Results -->
    <div class="chat-list">
      <!-- Search Results -->
      <div v-if="searchQuery.trim()">
        <div v-if="contactStore.isSearching" class="loading-state">
          <q-spinner-dots color="primary" size="24px" />
          <span class="q-ml-sm text-grey-6">Searching...</span>
        </div>

        <div v-else-if="contactStore.searchResults.length === 0" class="empty-state">
          <q-icon name="search_off" size="40px" color="grey-4" />
          <div class="text-grey-6 q-mt-sm">No users found</div>
        </div>

        <q-list v-else class="search-results">
          <q-item
            v-for="user in contactStore.searchResults"
            :key="user.id"
            clickable
            @click="selectUser(user)"
            class="chat-item"
          >
            <q-item-section avatar>
              <q-avatar size="40px" color="primary" text-color="white">
                {{ getInitials(user) }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="user-name">{{ user.fullName || user.nickName }}</q-item-label>
              <q-item-label caption class="user-nickname">@{{ user.nickName }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                v-if="!contactStore.isUserInContacts(user.id)"
                flat
                round
                dense
                icon="person_add"
                color="positive"
                size="sm"
                @click.stop="handleAddContact(user)"
                :loading="loadingStates[user.id]?.adding"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Chats (when not searching) -->
      <div v-else>
        <div class="empty-state">
          <q-icon name="chat_bubble_outline" size="50px" color="grey-4" />
          <div class="text-grey-6 q-mt-sm">No chats yet</div>
          <div class="text-grey-5 q-mt-xs">Search for users to start chatting</div>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import { getInitials } from 'src/utils/user'

const router = useRouter()
const authStore = useAuthStore()
const contactStore = useContactStore()

const leftDrawerOpen = ref(true)
const searchQuery = ref('')
const loadingStates = ref<Record<number, { adding?: boolean; removing?: boolean }>>({})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const onSearchQueryChange = (value: string | number | null) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    void contactStore.searchUsers(String(value || ''))
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  contactStore.clearSearchResults()
}

const selectUser = async (user: PublicUser) => {
  await router.push(`/profile/${user.id}`)
}

const openMyProfile = async () => {
  if (authStore.user) {
    await router.push(`/profile/me`)
  }
}

const navigateToContacts = async () => {
  await router.push('/contacts')
}

const navigateToSettings = async () => {
  await router.push('/profile/me')
}

const navigateToSessions = async () => {
  await router.push('/sessions')
}


const handleAddContact = async (user: PublicUser) => {
  if (!loadingStates.value[user.id]) {
    loadingStates.value[user.id] = { adding: false, removing: false }
  }
  loadingStates.value[user.id]!.adding = true

  try {
    await contactStore.addContact(user.id)
  } finally {
    if (loadingStates.value[user.id]) {
      loadingStates.value[user.id]!.adding = false
    }
  }
}

const handleLogout = async () => {
  await authStore.logout()
  await router.push('/auth/login')
}

onMounted(async () => {
  await contactStore.fetchContacts()
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  contactStore.clearSearchResults()
})

defineExpose({
  leftDrawerOpen
})
</script>

<style scoped>
.app-sidebar {
  background: white;
  border-right: 1px solid #e4e6ea;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e6ea;
  gap: 12px;
  height: 64px;
  min-height: 64px;
}

.menu-btn {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: #f1f3f4;
  border-radius: 20px;
}

.search-input :deep(.q-field__control) {
  padding: 0 16px;
  height: 36px;
}

.search-input :deep(.q-field__native) {
  padding: 0;
}

.menu-list {
  min-width: 200px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 64px);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-state {
  flex-direction: row;
  justify-content: center;
  padding: 20px;
}

.search-results {
  border: none;
}

.chat-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
}

.chat-item:hover {
  background-color: #f8f9fa;
}

.chat-item.selected {
  background-color: #e3f2fd;
}

.user-name {
  font-weight: 500;
  color: #2c2c2c;
  margin-bottom: 4px;
}

.user-nickname, .last-message {
  color: #8e8e93;
  font-size: 13px;
}

.last-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Custom scrollbar */
.chat-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c9d2 transparent;
}

.chat-list::-webkit-scrollbar {
  width: 6px;
}

.chat-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list::-webkit-scrollbar-thumb {
  background-color: #c1c9d2;
  border-radius: 3px;
}

.chat-list::-webkit-scrollbar-thumb:hover {
  background-color: #a8b3bf;
}
</style>