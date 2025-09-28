<template>
  <div class="chat-list-container">
    <!-- Search Results -->
    <div v-if="isSearching" class="search-results">
      <div v-if="contactStore.isSearching" class="loading-state">
        <q-spinner-dots color="primary" size="24px" />
        <span class="q-ml-sm text-grey-6">Searching...</span>
      </div>

      <div v-else-if="contactStore.searchResults.length === 0 && hasSearchQuery" class="empty-state">
        <q-icon name="search_off" size="40px" color="grey-4" />
        <div class="text-grey-6 q-mt-sm">No users found</div>
      </div>

      <q-list v-else-if="contactStore.searchResults.length > 0" class="search-list">
        <q-item
          v-for="user in contactStore.searchResults"
          :key="user.id"
          clickable
          @click="selectUser(user)"
          class="search-item"
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
        </q-item>
      </q-list>
    </div>

    <!-- Normal Chat List -->
    <div v-else class="chat-list">
      <div class="empty-chat-state">
        <q-icon name="chat_bubble_outline" size="50px" color="grey-4" />
        <div class="text-grey-6 q-mt-sm">No chats yet</div>
        <div class="text-grey-5 q-mt-xs">Search for users to start chatting</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import { getInitials } from 'src/utils/user'
import { useMobile } from 'src/composables/useMobile'

const router = useRouter()
const contactStore = useContactStore()
const { searchOpen, searchQuery, closeSearch } = useMobile()

const isSearching = computed(() => searchOpen.value)

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)

const selectUser = async (user: PublicUser) => {
  await router.push(`/profile/${user.id}`)
  closeSearch()
  contactStore.clearSearchResults()
}
</script>

<style scoped>
.chat-list-container {
  height: calc(100vh - 64px);
  background: white;
  overflow-y: auto;
}

.search-results, .chat-list {
  height: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-state, .empty-chat-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.search-list {
  border: none;
}

.search-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
}

.search-item:hover {
  background-color: #f8f9fa;
}

.user-name {
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.user-nickname {
  color: #86868b;
  font-size: 13px;
}
</style>