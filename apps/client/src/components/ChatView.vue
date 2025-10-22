<template>
  <div class="chat-view">
    <!-- Chat Header -->
    <div class="chat-header">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        size="md"
        @click="$emit('back')"
        class="q-mr-sm"
      />

      <q-avatar size="40px" color="primary" text-color="white">
        {{ getChatInitials(chatStore.currentChat?.name || '') }}
      </q-avatar>

      <div class="chat-info">
        <div class="chat-name">{{ chatStore.currentChat?.name || 'Chat' }}</div>
        <div class="participant-count" v-if="chatStore.currentChat?.participants">
          {{ chatStore.currentChat.participants.length }} participants
        </div>
      </div>

      <q-space />

      <q-btn
        flat
        round
        dense
        icon="more_vert"
        color="grey-7"
        size="md"
      >
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup>
              <q-item-section>Chat Info</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>Mute</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- Messages Area -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="chatStore.isLoadingMessages && chatStore.currentMessages.length === 0" class="loading-state">
        <q-spinner-dots color="primary" size="24px" />
        <span class="q-ml-sm text-grey-6">Loading messages...</span>
      </div>

      <div v-else-if="chatStore.currentMessages.length === 0" class="empty-messages">
        <q-icon name="chat_bubble_outline" size="50px" color="grey-4" />
        <div class="text-grey-6 q-mt-sm">No messages yet</div>
        <div class="text-grey-5 q-mt-xs">Start the conversation!</div>
      </div>

      <div v-else class="messages-list">
        <!-- Load More Button -->
        <div v-if="chatStore.messagesPagination.hasMorePages" class="load-more-container">
          <q-btn
            flat
            color="primary"
            :loading="chatStore.isLoadingMessages"
            @click="loadMoreMessages"
          >
            Load more messages
          </q-btn>
        </div>

        <!-- Messages -->
        <MessageBubble
          v-for="message in chatStore.currentMessages"
          :key="message.id"
          :message="message"
          :is-own-message="isOwnMessage(message)"
          :data-message-id="message.id"
          class="message-item"
        />
      </div>
    </div>

    <!-- Scroll to Bottom Button -->
    <div
      v-if="showScrollToBottom"
      class="scroll-to-bottom-container"
    >
      <q-btn
        fab
        icon="keyboard_arrow_down"
        color="primary"
        size="sm"
        class="scroll-to-bottom-btn"
        @click="scrollToBottomWithAnimation"
      >
        <q-badge
          v-if="unreadCount > 0"
          color="negative"
          :label="unreadCount > 99 ? '99+' : unreadCount"
          class="unread-badge"
        />
      </q-btn>
    </div>

    <!-- Message Input -->
    <MessageInput
      @send="sendMessage"
      :loading="chatStore.isSendingMessage"
      class="message-input"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from 'src/stores/chat-store'
import { useAuthStore } from 'src/stores/auth-store'
import { useTransmit } from 'src/services/transmit'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'

defineEmits(['back'])

const route = useRoute()
const chatStore = useChatStore()
const authStore = useAuthStore()
const { isConnected, forceReconnect } = useTransmit()

const messagesContainer = ref<HTMLElement>()
const chatId = computed(() => parseInt(route.params.id as string))
const intersectionObserver = ref<IntersectionObserver | null>(null)
const visibleMessages = ref<Set<number>>(new Set())
const showScrollToBottom = ref(false)
const unreadCount = ref(0)
const scrollHandler = ref<(() => void) | null>(null)
const lastScrollTop = ref(0)
const isScrollingDown = ref(false)
const hasScrolledAway = ref(false)
const scrollDownDistance = ref(0)

const isOwnMessage = (message: any) => {
  return message.senderId === authStore.user?.id
}

const getChatInitials = (name: string) => {
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

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const scrollToBottomWithAnimation = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const checkScrollPosition = () => {
  if (!messagesContainer.value) return

  const container = messagesContainer.value
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight

  // Calculate distance from bottom
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  // Track scroll direction and distance
  const currentIsScrollingDown = scrollTop > lastScrollTop.value
  const scrollDelta = scrollTop - lastScrollTop.value

  if (currentIsScrollingDown && isScrollingDown.value) {
    // Continue scrolling down - accumulate distance
    scrollDownDistance.value += scrollDelta
  } else if (currentIsScrollingDown && !isScrollingDown.value) {
    // Just started scrolling down - reset distance
    scrollDownDistance.value = scrollDelta
  } else {
    // Scrolling up or stopped - reset distance
    scrollDownDistance.value = 0
  }

  isScrollingDown.value = currentIsScrollingDown
  lastScrollTop.value = scrollTop

  // Mark as scrolled away if more than 100px from bottom
  if (distanceFromBottom > 100) {
    hasScrolledAway.value = true
  }

  // Reset when at bottom
  if (distanceFromBottom <= 10) {
    hasScrolledAway.value = false
    showScrollToBottom.value = false
    scrollDownDistance.value = 0
    return
  }

  // Show button logic:
  // 1. Always show if there are unread messages
  // 2. Only show when scrolling down after having scrolled away AND scrolled down at least 50px
  showScrollToBottom.value = unreadCount.value > 0 ||
    (hasScrolledAway.value && isScrollingDown.value && scrollDownDistance.value >= 50 && distanceFromBottom > 100)
}

const isNearBottom = () => {
  if (!messagesContainer.value) return false

  const container = messagesContainer.value
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight

  // Consider "near bottom" if within one message height (approximately 80px)
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  return distanceFromBottom <= 80
}

const updateUnreadCount = () => {
  let count = 0
  const messages = chatStore.currentMessages

  // Count unread messages from the latest backwards until we hit a read message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]

    if (!message) continue

    // Skip own messages
    if (message.senderId === authStore.user?.id) {
      continue
    }

    // If message is read, stop counting
    if (message.status?.read) {
      break
    }

    // Count this unread message
    count++
  }

  unreadCount.value = count
}

const loadMoreMessages = async () => {
  if (chatStore.messagesPagination.hasMorePages) {
    const nextPage = chatStore.messagesPagination.currentPage + 1
    await chatStore.fetchMessages(chatId.value, nextPage)
  }
}

const sendMessage = async (content: string) => {
  const result = await chatStore.sendMessage(chatId.value, content)
  if (result.success) {
    await scrollToBottom()
  }
}

const loadChat = async () => {
  await chatStore.fetchChatDetails(chatId.value)
  await chatStore.fetchMessages(chatId.value)
  await scrollToBottom()
}

const setupIntersectionObserver = () => {
  if (!messagesContainer.value) return

  intersectionObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const messageElement = entry.target as HTMLElement
        const messageId = parseInt(messageElement.dataset.messageId || '0')

        if (entry.isIntersecting) {
          visibleMessages.value.add(messageId)

          // Mark unread messages as read when they become visible
          const message = chatStore.currentMessages.find(m => m.id === messageId)
          if (message &&
              message.senderId !== authStore.user?.id &&
              !message.status?.read) {

            console.log(`👀 Message ${messageId} is visible, marking as read`)
            void chatStore.markMessageAsRead(messageId)
          }
        } else {
          visibleMessages.value.delete(messageId)
        }
      })
    },
    {
      root: messagesContainer.value,
      threshold: 0.5, // 50% of message must be visible
      rootMargin: '0px'
    }
  )

  // Observe all existing message elements
  const messageElements = messagesContainer.value.querySelectorAll('[data-message-id]')
  messageElements.forEach(el => {
    if (intersectionObserver.value) {
      intersectionObserver.value.observe(el)
    }
  })
}

const cleanupIntersectionObserver = () => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect()
    intersectionObserver.value = null
  }
  visibleMessages.value.clear()
}


const ensureConnection = async () => {
  console.log('🔍 Checking Transmit connection in ChatView...')
  if (!isConnected()) {
    console.log('🔌 Connection lost, forcing reconnection...')
    await forceReconnect()
  } else {
    console.log('✅ Transmit connection is healthy')
  }
}

// Watch for message status changes to update unread count
watch(() => chatStore.currentMessages.map(m => m.status?.read), () => {
  updateUnreadCount()
  checkScrollPosition()
}, { deep: true })

// Watch for new messages
watch(() => chatStore.currentMessages.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    const lastMessage = chatStore.currentMessages[chatStore.currentMessages.length - 1]

    if (lastMessage && lastMessage.senderId === authStore.user?.id) {
      // Always auto-scroll for own messages
      void scrollToBottom()
    } else if (lastMessage && isNearBottom()) {
      // For received messages, only auto-scroll if near bottom
      void scrollToBottom()
    }

    // Update unread count and scroll position indicators
    void nextTick(() => {
      updateUnreadCount()
      checkScrollPosition()
    })

    // Re-setup intersection observer for new messages
    void nextTick(() => {
      if (intersectionObserver.value && messagesContainer.value) {
        const newMessageElements = messagesContainer.value.querySelectorAll('[data-message-id]:not([data-observed])')
        newMessageElements.forEach(el => {
          if (intersectionObserver.value) {
            intersectionObserver.value.observe(el)
            el.setAttribute('data-observed', 'true')
          }
        })
      }
    })
  }
})

onMounted(async () => {
  await ensureConnection()
  await loadChat()

  // Setup intersection observer after messages are loaded
  void nextTick(() => {
    setupIntersectionObserver()

    // Add scroll event listener
    if (messagesContainer.value) {
      scrollHandler.value = () => {
        checkScrollPosition()
        updateUnreadCount()
      }
      messagesContainer.value.addEventListener('scroll', scrollHandler.value)
    }
  })
})

onUnmounted(() => {
  cleanupIntersectionObserver()

  // Remove scroll event listener
  if (messagesContainer.value && scrollHandler.value) {
    messagesContainer.value.removeEventListener('scroll', scrollHandler.value)
  }

  chatStore.setCurrentChat(null)
})
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e1e3e6;
  min-height: 64px;
}

.chat-info {
  margin-left: 12px;
  flex: 1;
}

.chat-name {
  font-weight: 600;
  font-size: 16px;
  color: #1d1d1f;
  line-height: 1.2;
}

.participant-count {
  font-size: 13px;
  color: #86868b;
  margin-top: 2px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  height: 100%;
}

.messages-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.message-item {
  animation: messageSlideIn 0.3s ease-out;
}

.message-input {
  background: white;
  border-top: 1px solid #e1e3e6;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-to-bottom-container {
  position: absolute;
  bottom: 120px;
  right: 20px;
  z-index: 10;
}

.scroll-to-bottom-btn {
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-height: 0px !important;
  min-width: 0px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .chat-header {
    padding: 8px 12px;
    min-height: 56px;
  }

  .messages-list {
    padding: 12px;
    gap: 8px;
  }
}
</style>