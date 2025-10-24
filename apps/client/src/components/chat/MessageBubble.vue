<template>
  <div
    :class="['flex gap-2', message.own ? 'justify-end' : 'justify-start', isFirstInGroup ? 'mt-4' : 'mt-1', hasReactions ? 'mb-2' : '']"
  >
    <!-- Avatar for other users -->
    <div v-if="!message.own" class="w-8 h-8 flex-shrink-0">
      <div v-if="showAvatar" class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg">
        {{ message.avatar }}
      </div>
      <div v-else class="w-8 h-8" />
    </div>

    <div :class="['max-w-[85%] sm:max-w-md flex flex-col', message.own ? 'items-end' : 'items-start']">
      <p v-if="!message.own && isFirstInGroup" class="text-xs font-semibold text-gray-700 mb-1 ml-3">
        {{ message.sender }}
      </p>

      <div class="relative">
        <div
          :class="[
            'rounded-2xl px-3 py-2 sm:px-4 sm:py-2',
            message.own
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
          ]"
        >
          <p class="text-sm sm:text-base">{{ message.text }}</p>
          <div class="flex items-center gap-1 justify-end mt-1">
            <p :class="['text-xs', message.own ? 'text-blue-100' : 'text-gray-500']">
              {{ message.time }}
            </p>
            <div v-if="message.own" class="flex items-center">
              <q-icon
                :name="message.read ? 'done_all' : 'done'"
                size="16px"
                :class="message.own ? 'text-blue-200' : ''"
              />
            </div>
          </div>
        </div>

        <!-- Reactions -->
        <div v-if="message.reactions && message.reactions.length > 0" class="absolute -bottom-2.5 left-2 flex gap-1">
          <div
            v-for="(reaction, idx) in message.reactions"
            :key="idx"
            class="bg-white border border-gray-200 hover:border-gray-300 rounded-full px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <span class="text-sm">{{ reaction.emoji }}</span>
            <span class="text-xs font-semibold text-gray-700">{{ reaction.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  message: Message
  previousMessage?: Message | null | undefined
}

const props = defineProps<Props>()

const isFirstInGroup = computed(() => {
  if (!props.previousMessage) return true
  return props.previousMessage.sender !== props.message.sender
})

const showAvatar = computed(() => {
  if (!props.previousMessage) return true
  if (props.previousMessage.sender !== props.message.sender) return true

  // Show avatar if more than 10 minutes between messages
  const currentMinutes = parseInt(props.message.time.split(':')[1] || '0')
  const prevMinutes = parseInt(props.previousMessage.time.split(':')[1] || '0')

  return Math.abs(currentMinutes - prevMinutes) > 10
})

const hasReactions = computed(() => {
  return props.message.reactions && props.message.reactions.length > 0
})
</script>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
}
</style>
