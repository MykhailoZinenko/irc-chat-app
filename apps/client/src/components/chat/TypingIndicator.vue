<template>
  <div v-if="typingUsers.length > 0" class="typing-indicator" @click="emit('openPreview')">
    <div class="typing-avatars">
      <div
        v-for="user in displayedUsers"
        :key="user.id"
        class="typing-avatar"
        :title="displayName(user)"
      >
        <div class="avatar-circle">
          {{ user.nickName?.charAt(0).toUpperCase() || user.firstName?.charAt(0).toUpperCase() || '?' }}
        </div>
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div v-if="extraCount > 0" class="extra-count">
        +{{ extraCount }}
      </div>
    </div>
    <div class="typing-text">
      {{ typingText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type TypingUser } from '@/stores/typing-store'

const props = defineProps<{
  typingUsers: TypingUser[]
}>()

const emit = defineEmits<{
  openPreview: []
}>()

const displayName = (user: TypingUser) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return fullName || user.nickName || 'Unknown'
}

const displayedUsers = computed(() => props.typingUsers.slice(0, 3))
const extraCount = computed(() => Math.max(0, props.typingUsers.length - 3))

const typingText = computed(() => {
  const count = props.typingUsers.length
  if (count === 0) return ''
  if (count === 1) {
    return `${displayName(props.typingUsers[0]!)} is typing...`
  }
  if (count === 2) {
    return `${displayName(props.typingUsers[0]!)} and ${displayName(props.typingUsers[1]!)} are typing...`
  }
  return `${displayName(props.typingUsers[0]!)} and ${count - 1} others are typing...`
})
</script>

<style scoped>
.typing-indicator {
  position: absolute;
  bottom: 80px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.typing-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.typing-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-avatar {
  position: relative;
  margin-right: -8px;
}

.typing-avatar:last-child {
  margin-right: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.typing-dots {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 10px;
  padding: 2px 4px;
  display: flex;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typing-dots span {
  width: 4px;
  height: 4px;
  background: #3b82f6;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.extra-count {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 4px;
}

.typing-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}
</style>
