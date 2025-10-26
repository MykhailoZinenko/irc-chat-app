<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Notification Preferences</h3>
      <p class="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>
      <div class="space-y-4">
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Direct Messages</p>
            <p class="text-sm text-gray-500">Get notified for new messages</p>
          </div>
          <q-toggle
            v-model="notifications.messages"
            color="blue"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Group Messages</p>
            <p class="text-sm text-gray-500">Get notified for group activity</p>
          </div>
          <q-toggle
            v-model="notifications.groups"
            color="blue"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Channels</p>
            <p class="text-sm text-gray-500">Get notified for channel posts</p>
          </div>
          <q-toggle
            v-model="notifications.channels"
            color="blue"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Mentions</p>
            <p class="text-sm text-gray-500">When someone mentions you</p>
          </div>
          <q-toggle
            v-model="notifications.mentions"
            color="blue"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Reactions</p>
            <p class="text-sm text-gray-500">When someone reacts to your message</p>
          </div>
          <q-toggle
            v-model="notifications.reactions"
            color="blue"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const notifications = ref({
  messages: true,
  groups: true,
  channels: false,
  mentions: true,
  reactions: true,
})
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.border-b {
  border-bottom-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-500 {
  color: #6b7280;
}
</style>
