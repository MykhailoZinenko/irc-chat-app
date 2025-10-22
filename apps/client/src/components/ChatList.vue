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

          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="message"
              color="primary"
              size="sm"
              @click.stop="startChat(user)"
              :loading="chatStore.isLoading"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Normal Chat List -->
    <div v-else class="chat-list">
      <div v-if="chatStore.isLoading && chatStore.chats.length === 0" class="loading-state">
        <q-spinner-dots color="primary" size="24px" />
        <span class="q-ml-sm text-grey-6">Loading chats...</span>
      </div>

      <div v-else-if="chatStore.chats.length === 0" class="empty-chat-state">
        <q-icon name="chat_bubble_outline" size="50px" color="grey-4" />
        <div class="text-grey-6 q-mt-sm">No chats yet</div>
        <div class="text-grey-5 q-mt-xs">Search for users to start chatting</div>
      </div>

      <q-list v-else class="chat-items">
        <q-item
          v-for="chat in chatStore.chats"
          :key="chat.id"
          clickable
          @click="openChat(chat)"
          class="chat-item"
        >
          <q-item-section avatar>
            <q-avatar size="48px" color="primary" text-color="white">
              {{ getChatInitials(chat) }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="chat-name">{{ chat.name }}</q-item-label>
            <q-item-label caption class="last-message" v-if="chat.lastMessage">
              <span class="sender-name">{{ chat.lastMessage.senderName }}:</span>
              {{ chat.lastMessage.content }}
            </q-item-label>
            <q-item-label caption class="no-messages" v-else>
              No messages yet
            </q-item-label>
          </q-item-section>

          <q-item-section side class="chat-meta">
            <div class="timestamp" v-if="chat.lastMessage">
              {{ formatTime(chat.lastMessage.createdAt) }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import { useChatStore, type Chat } from 'src/stores/chat-store'
import { getInitials } from 'src/utils/user'
import { useMobile } from 'src/composables/useMobile'

const router = useRouter()
const contactStore = useContactStore()
const chatStore = useChatStore()
const { searchOpen, searchQuery, closeSearch } = useMobile()

const isSearching = computed(() => searchOpen.value)

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)

const selectUser = async (user: PublicUser) => {
  await router.push(`/profile/${user.id}`)
  closeSearch()
  contactStore.clearSearchResults()
}

const startChat = async (user: PublicUser) => {
  const result = await chatStore.startChat(user.id)
  if (result.success && result.chatId) {
    await router.push(`/chat/${result.chatId}`)
    closeSearch()
    contactStore.clearSearchResults()
  }
}

const openChat = async (chat: Chat) => {
  await router.push(`/chat/${chat.id}`)
}

const getChatInitials = (chat: Chat) => {
  const name = chat.name || chat.avatar
  if (name && name.length > 0) {
    const words = name.split(' ').filter(word => word.length > 0)
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    } else if (words.length === 1) {
      return words[0][0].toUpperCase()
    }
  }
  return '??'
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

onMounted(() => {
  chatStore.fetchChats()
})
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

.search-list, .chat-items {
  border: none;
}

.search-item, .chat-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
}

.search-item:hover, .chat-item:hover {
  background-color: #f8f9fa;
}

.user-name, .chat-name {
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.user-nickname {
  color: #86868b;
  font-size: 13px;
}

.last-message {
  color: #86868b;
  font-size: 14px;
  line-height: 1.3;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sender-name {
  font-weight: 500;
  color: #666;
}

.no-messages {
  color: #b3b3b3;
  font-size: 13px;
  font-style: italic;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  padding-top: 4px;
}

.timestamp {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.chat-item {
  transition: background-color 0.2s ease;
}

.chat-item:active {
  background-color: #e3f2fd;
}
</style>