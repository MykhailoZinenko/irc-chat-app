<template>
  <div v-if="isValidMessage" class="message-bubble" :class="messageClasses">
    <div class="message-content-wrapper">
      <!-- Avatar for other users -->
      <q-avatar
        v-if="!isOwnMessage && message.sender"
        size="32px"
        color="primary"
        text-color="white"
        class="message-avatar"
      >
        {{ getInitials(message.sender) }}
      </q-avatar>

      <div class="message-content">
        <!-- Username for other users -->
        <div v-if="!isOwnMessage && message.sender" class="sender-name">
          {{ message.sender.fullName || message.sender.nickName }}
        </div>

        <!-- Reply context if this is a reply -->
        <div v-if="message.replyToMessage" class="reply-context">
          <div class="reply-bar"></div>
          <div class="reply-content">
            <div class="reply-sender">{{ message.replyToMessage.sender.fullName }}</div>
            <div class="reply-text">{{ message.replyToMessage.content }}</div>
          </div>
        </div>

        <!-- Message bubble -->
        <div class="message-bubble-content" :class="bubbleClasses">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-meta">
            <span v-if="message.editedAt" class="edited-indicator">edited</span>
            <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            <q-icon
              v-if="isOwnMessage"
              :name="getStatusIcon()"
              size="16px"
              class="read-status"
              :class="readStatusClass"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from 'src/stores/chat-store'

interface Props {
  message: ChatMessage
  isOwnMessage: boolean
}

const props = defineProps<Props>()

const isValidMessage = computed(() => {
  return props.message &&
         typeof props.message.id !== 'undefined' &&
         typeof props.message.content === 'string' &&
         typeof props.message.senderId !== 'undefined' &&
         typeof props.message.createdAt === 'string'
})

const messageClasses = computed(() => ({
  'message-own': props.isOwnMessage,
  'message-other': !props.isOwnMessage,
}))

const bubbleClasses = computed(() => ({
  'bubble-own': props.isOwnMessage,
  'bubble-other': !props.isOwnMessage,
}))

const readStatusClass = computed(() => {
  const status = props.message.status

  if (!status) {
    // Default state for old messages without status info - assume delivered
    return {
      'status-sent': true,
      'status-delivered': true,
      'status-read': false,
    }
  }

  return {
    'status-sent': status.sent === true,
    'status-delivered': status.delivered === true,
    'status-read': status.read === true,
  }
})

const getInitials = (sender: any) => {
  if (!sender) return '??'

  const firstName = sender.firstName || ''
  const lastName = sender.lastName || ''

  if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName && firstName.length > 0) {
    return firstName[0].toUpperCase()
  } else if (sender.nickName && sender.nickName.length > 0) {
    return sender.nickName[0].toUpperCase()
  }

  return '??'
}

const getStatusIcon = () => {
  const status = props.message.status

  if (!status) {
    return 'done' // Default to sent for old messages without status
  }

  if (status.read) {
    return 'done_all' // Double check for read
  } else if (status.delivered) {
    return 'done_all' // Double check for delivered
  } else if (status.sent) {
    return 'done' // Single check for sent
  } else {
    return 'schedule' // Clock icon for pending
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  })
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  margin-bottom: 8px;
}

.message-own {
  justify-content: flex-end;
}

.message-other {
  justify-content: flex-start;
}

.message-content-wrapper {
  display: flex;
  align-items: flex-end;
  max-width: 75%;
  gap: 8px;
}

.message-own .message-content-wrapper {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-bottom: 4px;
}

.message-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sender-name {
  font-size: 13px;
  font-weight: 500;
  color: #2481cc;
  margin-bottom: 2px;
  margin-left: 12px;
}

.reply-context {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  margin-left: 12px;
  margin-right: 12px;
}

.reply-bar {
  width: 3px;
  background: #2481cc;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
  align-self: stretch;
}

.reply-content {
  min-width: 0;
  flex: 1;
}

.reply-sender {
  font-size: 12px;
  font-weight: 500;
  color: #2481cc;
  margin-bottom: 1px;
}

.reply-text {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-bubble-content {
  border-radius: 18px;
  padding: 8px 12px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.bubble-own {
  background: #2481cc;
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: white;
  color: #1d1d1f;
  border-bottom-left-radius: 4px;
  border: 1px solid #e1e3e6;
}

.message-text {
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.8;
}

.bubble-own .message-meta {
  color: rgba(255, 255, 255, 0.8);
}

.bubble-other .message-meta {
  color: #86868b;
}

.edited-indicator {
  font-style: italic;
}

.message-time {
  white-space: nowrap;
}

.read-status {
  margin-left: 2px;
}

/* Message status indicators */
.status-sent {
  color: rgba(255, 255, 255, 0.4);
}

.status-delivered {
  color: rgba(255, 255, 255, 0.6);
}

.status-read {
  color: #4fc3f7;
}

/* Animation for new messages */
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-bubble {
  animation: messageAppear 0.2s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .message-content-wrapper {
    max-width: 85%;
  }

  .message-bubble-content {
    padding: 7px 10px;
    border-radius: 16px;
  }

  .bubble-own {
    border-bottom-right-radius: 3px;
  }

  .bubble-other {
    border-bottom-left-radius: 3px;
  }

  .message-text {
    font-size: 14px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bubble-other {
    background: #2a2a2a;
    color: #e1e3e6;
    border-color: #3a3a3a;
  }

  .bubble-other .message-meta {
    color: #999;
  }
}
</style>