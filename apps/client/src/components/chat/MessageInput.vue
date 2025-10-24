<template>
  <div class="input-container">
    <q-btn
      round
      flat
      icon="attach_file"
      color="grey-6"
      class="attach-btn"
      @click="$emit('attach')"
    />

    <q-input
      v-model="inputMessage"
      outlined
      placeholder="Type a message..."
      class="flex-1 message-input"
      bg-color="white"
      borderless
      @keyup.enter="handleSend"
    />

    <q-btn
      round
      flat
      icon="sentiment_satisfied_alt"
      color="grey-6"
      class="emoji-btn"
      @click="$emit('emoji')"
    />

    <q-btn
      round
      flat
      icon="send"
      color="primary"
      class="send-btn"
      @click="handleSend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  send: [message: string]
  attach: []
  emoji: []
}>()

const inputMessage = ref('')

const handleSend = () => {
  if (inputMessage.value.trim()) {
    emit('send', inputMessage.value)
    inputMessage.value = ''
  }
}
</script>

<style scoped>
.input-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

@media (min-width: 640px) {
  .input-container {
    padding: 10px 16px;
  }
}

.attach-btn,
.emoji-btn,
.send-btn {
  flex-shrink: 0;
}

.attach-btn :deep(.q-icon),
.emoji-btn :deep(.q-icon) {
  font-size: 22px !important;
}

.attach-btn,
.emoji-btn {
  opacity: 0.6;
}

.attach-btn:hover,
.emoji-btn:hover {
  opacity: 1;
}

.send-btn {
  color: #3b82f6 !important;
  background: transparent !important;
}

.send-btn :deep(.q-icon) {
  font-size: 22px !important;
}

.message-input {
  flex: 1;
}

.message-input :deep(.q-field__control) {
  min-height: 40px;
  height: 40px;
  padding: 0 16px;
  background: #f3f4f6;
  border: none !important;
  box-shadow: none !important;
  border-radius: 20px;
}

.message-input :deep(.q-field__control):before,
.message-input :deep(.q-field__control):after {
  display: none !important;
  border: none !important;
}

.message-input :deep(.q-field__native) {
  padding: 0;
  font-size: 15px;
  color: #1f2937;
}

.message-input :deep(.q-field__native)::placeholder {
  color: #9ca3af;
}
</style>
