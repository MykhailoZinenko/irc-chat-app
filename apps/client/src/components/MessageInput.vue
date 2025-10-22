<template>
  <div class="message-input-container">
    <div class="input-wrapper">
      <q-input
        ref="messageInput"
        v-model="messageText"
        placeholder="Type a message..."
        outlined
        dense
        autogrow
        :max-height="120"
        class="message-input"
        @keydown.enter.exact.prevent="handleEnter"
        @keydown.enter.shift.exact="handleShiftEnter"
        :loading="loading"
        :disable="loading"
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="send"
            color="primary"
            size="sm"
            :disable="!canSend"
            :loading="loading"
            @click="sendMessage"
            class="send-button"
          />
        </template>
      </q-input>
    </div>

    <!-- Optional: Attachment and emoji buttons -->
    <div class="input-actions" v-if="false">
      <q-btn
        flat
        round
        dense
        icon="attach_file"
        color="grey-6"
        size="sm"
        class="action-button"
      />
      <q-btn
        flat
        round
        dense
        icon="emoji_emotions"
        color="grey-6"
        size="sm"
        class="action-button"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { QInput } from 'quasar'

interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  send: [content: string]
}>()

const messageInput = ref<QInput>()
const messageText = ref('')

const canSend = computed(() => {
  return messageText.value.trim().length > 0 && !props.loading
})

const sendMessage = async () => {
  if (!canSend.value) return

  const content = messageText.value.trim()
  messageText.value = ''

  emit('send', content)

  // Focus back to input after sending
  await nextTick()
  messageInput.value?.focus()
}

const handleEnter = () => {
  sendMessage()
}

const handleShiftEnter = () => {
  // Allow shift+enter for new lines
  messageText.value += '\n'
}

// Auto-focus on mount
const focusInput = async () => {
  await nextTick()
  messageInput.value?.focus()
}

// Expose focus method for parent components
defineExpose({
  focus: focusInput,
})
</script>

<style scoped>
.message-input-container {
  display: flex;
  align-items: flex-end;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e1e3e6;
  gap: 8px;
}

.input-wrapper {
  flex: 1;
}

.message-input {
  border-radius: 24px;
}

.message-input :deep(.q-field__control) {
  border-radius: 24px;
  background: #f5f5f5;
  border: 1px solid #e1e3e6;
  transition: all 0.2s ease;
}

.message-input :deep(.q-field__control):hover {
  border-color: #2481cc;
}

.message-input :deep(.q-field--focused .q-field__control) {
  border-color: #2481cc;
  box-shadow: 0 0 0 2px rgba(36, 129, 204, 0.2);
}

.message-input :deep(.q-field__native) {
  padding: 10px 16px;
  font-size: 15px;
  line-height: 1.4;
  min-height: 20px;
}

.message-input :deep(.q-field__append) {
  padding-right: 4px;
}

.send-button {
  transition: all 0.2s ease;
}

.send-button:not(.disabled) {
  color: #2481cc;
}

.send-button:not(.disabled):hover {
  background: rgba(36, 129, 204, 0.1);
}

.input-actions {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.action-button {
  transition: all 0.2s ease;
}

.action-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .message-input-container {
    padding: 8px 12px;
  }

  .message-input :deep(.q-field__native) {
    padding: 8px 14px;
    font-size: 14px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .message-input-container {
    background: #1a1a1a;
    border-top-color: #3a3a3a;
  }

  .message-input :deep(.q-field__control) {
    background: #2a2a2a;
    border-color: #3a3a3a;
    color: #e1e3e6;
  }

  .message-input :deep(.q-field__control):hover {
    border-color: #2481cc;
  }

  .message-input :deep(.q-field__native) {
    color: #e1e3e6;
  }

  .message-input :deep(.q-field__native::placeholder) {
    color: #999;
  }
}
</style>