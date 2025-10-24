<template>
  <q-scroll-area class="flex-1 bg-gray-50">
    <div class="p-3 sm:p-4 md:p-6 flex flex-col gap-1">
      <MessageBubble
        v-for="(message, index) in messages"
        :key="message.id"
        :message="message"
        :previous-message="index > 0 ? messages[index - 1] : undefined"
      />
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import MessageBubble from './MessageBubble.vue'

interface Reaction {
  emoji: string
  count: number
}

interface Message {
  id: number
  sender: string
  avatar: string
  text: string
  time: string
  own: boolean
  read: boolean
  reactions?: Reaction[]
}

interface Props {
  messages: Message[]
}

defineProps<Props>()
</script>

<style scoped>
.bg-gray-50 {
  background-color: #f9fafb;
}
</style>
