<template>
  <div class="message-list-container">
    <q-scroll-area ref="scrollAreaRef" class="flex-1 bg-gray-50">
      <div ref="messagesContainerRef" class="messages-wrapper p-3 sm:p-4 md:p-6">
        <q-infinite-scroll
          ref="infiniteScrollRef"
          reverse
          :offset="500"
          @load="onLoad"
          :scroll-target="scrollTarget"
          >
            <!-- End of messages indicator -->
            <div v-if="noMoreMessages && messages.length > 0" class="text-center py-2 text-gray-500 text-sm">
              Beginning of conversation
            </div>

            <MessageBubble
              v-for="(message, index) in messages"
              :key="message.id"
              :message="message"
              :previous-message="index > 0 ? messages[index - 1] : undefined"
              :data-message-id="message.id"
              @user-click="(name) => emit('userClick', name)"
            />

            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
              </div>
            </template>
        </q-infinite-scroll>
      </div>
    </q-scroll-area>

    <!-- Typing Indicator -->
    <TypingIndicator
      :typing-users="typingUsers"
      @open-preview="openTypingPreview"
    />

    <!-- Scroll to bottom button -->
    <div v-if="showScrollToBottom" class="scroll-to-bottom-container">
      <q-btn
        round
        unelevated
        size="md"
        color="grey-1"
        text-color="grey-7"
        class="scroll-btn"
        icon="keyboard_arrow_down"
        @click="scrollToBottomWithAnimation"
      >
        <q-badge
          v-if="unreadCount > 0"
          color="red"
          :label="unreadCount > 99 ? '99+' : unreadCount"
          class="scroll-btn__badge"
        />
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ChannelMessage } from '@/stores/message-store'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import TypingPreviewDialog from './TypingPreviewDialog.vue'
import { onMounted, onUnmounted, ref, watch, nextTick, computed } from 'vue'
import { useMessageStore } from '@/stores/message-store'
import { useAuthStore } from '@/stores/auth-store'
import { useTypingStore } from '@/stores/typing-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useQuasar } from 'quasar'

interface Props {
  messages: ChannelMessage[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  loadMore: [done: (stop?: boolean) => void]
  userClick: [userName: string]
}>()

const messageStore = useMessageStore()
const authStore = useAuthStore()
const typingStore = useTypingStore()
const selectionStore = useSelectionStore()
const $q = useQuasar()

const typingUsers = computed(() => {
  console.log('typingUsers', typingStore.typingByChannel)
  if (!selectionStore.selectedChannelId) return []

  console.log('getTypingUsers', typingStore.getTypingUsers(selectionStore.selectedChannelId))
  return typingStore.getTypingUsers(selectionStore.selectedChannelId)
})

const openTypingPreview = () => {
  if (!selectionStore.selectedChannelId) return
  $q.dialog({
    component: TypingPreviewDialog,
    componentProps: {
      channelId: selectionStore.selectedChannelId,
    },
  })
}

const noMoreMessages = ref(false)
const scrollAreaRef = ref<any>(null)
const infiniteScrollRef = ref<any>(null)
const scrollTarget = ref<HTMLElement | undefined>(undefined)
const messagesContainerRef = ref<HTMLElement | null>(null)

// Intersection Observer for read tracking
const intersectionObserver = ref<IntersectionObserver | null>(null)
const visibleMessages = ref<Set<number>>(new Set())

// Scroll tracking
const showScrollToBottom = ref(false)
const hasScrolledAway = ref(false)
const lastScrollTop = ref(0)
const unreadCount = ref(0)

const onLoad = (_index: number, done: (stop?: boolean) => void) => {
  emit('loadMore', (stop?: boolean) => {
    if (stop) {
      noMoreMessages.value = true
      done(true)
    } else {
      done()
    }
  })
}

onMounted(() => {
  const scrollArea = scrollAreaRef.value
  if (scrollArea) {
    scrollTarget.value = scrollArea.getScrollTarget()
    scrollTarget.value?.addEventListener('scroll', checkScrollPosition)
  }
})

onUnmounted(() => {
  scrollTarget.value?.removeEventListener('scroll', checkScrollPosition)
  cleanupIntersectionObserver()
})

const setupIntersectionObserver = () => {
  cleanupIntersectionObserver()

  if (!messagesContainerRef.value || !scrollTarget.value) return

  intersectionObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const messageElement = entry.target as HTMLElement
        const messageId = parseInt(messageElement.dataset.messageId || '0')

        if (entry.isIntersecting) {
          visibleMessages.value.add(messageId)

          const message = props.messages.find((m) => m.id === messageId)
          if (message && message.senderId !== authStore.user?.id && !message.status?.read) {
            void messageStore.markMessageAsRead(messageId)
          }
        } else {
          visibleMessages.value.delete(messageId)
        }
      })
    },
    {
      root: scrollTarget.value,
      threshold: 0.5,
      rootMargin: '0px',
    }
  )

  const messageElements = messagesContainerRef.value.querySelectorAll('[data-message-id]')
  messageElements.forEach((el) => {
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

const updateUnreadCount = () => {
  let count = 0
  const messages = props.messages

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message) continue

    if (message.senderId === authStore.user?.id) {
      continue
    }

    if (message.status?.read) {
      break
    }

    count++
  }

  unreadCount.value = count
}

const checkScrollPosition = () => {
  if (!scrollTarget.value) return

  const container = scrollTarget.value
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight

  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  if (distanceFromBottom > 100) {
    hasScrolledAway.value = true
  }

  if (distanceFromBottom <= 10) {
    hasScrolledAway.value = false
    showScrollToBottom.value = false
    return
  }

  showScrollToBottom.value = unreadCount.value > 0 || hasScrolledAway.value

  lastScrollTop.value = scrollTop
}

watch(
  () => props.messages.length,
  async (newLength, oldLength) => {
    if (oldLength !== undefined && oldLength > 0 && newLength === 0) {
      noMoreMessages.value = false
    }

    await nextTick()
    setupIntersectionObserver()
    updateUnreadCount()
  },
  { immediate: true }
)

watch(
  () => props.messages.map((m) => m.status?.read).join(','),
  () => {
    updateUnreadCount()
  }
)

const newChat = () => {
  noMoreMessages.value = false
  hasScrolledAway.value = false
  showScrollToBottom.value = false
  unreadCount.value = 0
  scrollToBottom()
}

const scrollToBottom = () => {
  scrollAreaRef.value?.setScrollPosition('vertical', 999999, 300)
}

const scrollToBottomWithAnimation = () => {
  scrollAreaRef.value?.setScrollPosition('vertical', 999999, 300)
  hasScrolledAway.value = false
  showScrollToBottom.value = false
}

defineExpose({
  scrollToBottom,
  newChat,
})
</script>

<style scoped>
.message-list-container {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 90px; /* Console input height + extra space */
}

.scroll-to-bottom-container {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 100;
}

.scroll-btn {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
  transition: all 0.2s;
  position: relative;
}

.scroll-btn:hover {
  box-shadow: var(--app-shadow-strong);
}

.scroll-btn__badge {
  position: absolute;
  top: -6px;
  right: -6px;
}
</style>
