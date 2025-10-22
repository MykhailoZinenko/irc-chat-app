<template>
  <div class="chat-page">
    <ChatView @back="goBack" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ChatView from 'src/components/ChatView.vue'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>