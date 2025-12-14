<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" position="bottom">
    <q-card style="width: 100%; max-width: 600px; max-height: 70vh;" class="typing-preview-card">
      <q-card-section class="header">
        <div class="text-h6">Who's typing</div>
        <q-btn flat round dense icon="close" @click="onDialogCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll-section">
        <div
          v-for="user in typingUsers"
          :key="user.id"
          class="typing-user-row"
        >
          <div class="user-header">
            <div class="avatar-circle">
              {{ user.nickName?.charAt(0).toUpperCase() || user.firstName?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="user-info">
              <div class="user-name">
                {{ displayName(user) }}
              </div>
              <div class="typing-label">is typing...</div>
            </div>
          </div>

          <div class="preview-content">
            <div v-if="user.content" class="preview-text">
              {{ user.content }}
              <span class="cursor-blink">|</span>
            </div>
            <div v-else class="preview-empty">
              <div class="typing-dots-large">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { type TypingUser, useTypingStore } from '@/stores/typing-store'

const props = defineProps<{
  channelId: number
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const typingStore = useTypingStore()

const typingUsers = computed(() => {
  return typingStore.getTypingUsers(props.channelId)
})

const displayName = (user: TypingUser) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return fullName || user.nickName || 'Unknown'
}
</script>

<style scoped>
.typing-preview-card {
  border-radius: 16px 16px 0 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.scroll-section {
  padding: 0;
  max-height: calc(70vh - 80px);
  overflow-y: auto;
}

.typing-user-row {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.typing-user-row:last-child {
  border-bottom: none;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
}

.typing-label {
  font-size: 13px;
  color: #6b7280;
}

.preview-content {
  margin-left: 52px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 12px;
  min-height: 48px;
}

.preview-text {
  font-size: 14px;
  color: #374151;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.cursor-blink {
  animation: blink 1s infinite;
  color: #3b82f6;
  font-weight: bold;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.typing-dots-large {
  display: flex;
  gap: 4px;
}

.typing-dots-large span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dots-large span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots-large span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots-large span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}
</style>
