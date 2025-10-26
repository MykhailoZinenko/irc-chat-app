<template>
  <q-scroll-area ref="scrollAreaRef" class="flex-1 bg-gray-50">
    <q-infinite-scroll 
      reverse 
      :offset="500" 
      @load="onLoad"
      :scroll-target="scrollTarget"
      >
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
        
        <div class="messages-wrapper">
          <!-- End of messages indicator -->
          <div v-if="noMoreMessages && messages.length > 0" class="text-center py-2 text-gray-500 text-sm">
            Beginning of conversation
          </div>

          <MessageBubble
            v-for="(message, index) in messages"
            :key="message.id"
            :message="message"
            :previous-message="index > 0 ? messages[index - 1] : undefined"
          />
        </div>

    </q-infinite-scroll>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { type IMessage } from 'src/types/messages';
import MessageBubble from './MessageBubble.vue'
import { onMounted, ref } from 'vue';

interface Props {
  messages: IMessage[]
}
defineProps<Props>()


const emit = defineEmits<{
  loadMore: [done: (stop?: boolean) => void]
}>()

const scrollToBottom = () => {
  setTimeout(() => {
    scrollAreaRef.value?.setScrollPosition('vertical', 999999, 300)
  }, 100)
}

defineExpose({
  scrollToBottom
})

const noMoreMessages = ref(false)
const scrollAreaRef = ref<any>(null)
const scrollTarget = ref<HTMLElement | undefined>(undefined)

const onLoad = (index: number, done: (stop?: boolean) => void) => {
  console.log("OnLoad:"+index);
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
  }
})
</script>

<style scoped>
.bg-gray-50 {
  background-color: #f9fafb;
}
</style>
