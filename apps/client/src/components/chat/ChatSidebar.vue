<template>
  <div
    :class="[
      'fixed lg:relative z-30 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 h-full',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Sidebar Header -->
    <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
      <h1 class="text-xl font-semibold text-gray-800">Messages</h1>
      <div class="flex items-center gap-2">
        <q-btn flat round dense icon="settings" color="grey-7" @click="$router.push('/settings')" />
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          class="close-btn-responsive"
          @click="$emit('close')"
        />
      </div>
    </div>

    <!-- Search Bar -->
    <div class="p-3 sm:p-4 border-b border-gray-200">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search conversations..."
        bg-color="grey-1"
        class="search-input"
      >
        <template #prepend>
          <q-icon name="search" size="18px" color="grey-6" />
        </template>
      </q-input>
    </div>

    <!-- Chat List -->
    <q-scroll-area class="flex-1">
      <div
        v-for="chat in chats"
        :key="chat.id"
        :class="[
          'flex items-center gap-3 p-3 sm:p-4 cursor-pointer transition-colors',
          selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
        ]"
        @click="handleChatClick(chat.id)"
      >
        <div class="relative">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl">
            {{ chat.avatar }}
          </div>
          <q-icon
            v-if="chat.type === 'group'"
            name="group"
            size="14px"
            class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-gray-600"
          />
          <q-icon
            v-else-if="chat.type === 'channel'"
            name="tag"
            size="14px"
            class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-gray-600"
          />
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-800 truncate mb-1 text-base leading-6">{{ chat.name }}</h3>
          <p class="text-sm text-gray-600 truncate leading-tight">{{ chat.lastMessage }}</p>
        </div>

        <div class="flex flex-col items-end gap-2 self-start pt-1">
          <span class="text-xs text-gray-500">{{ chat.time }}</span>
          <div
            v-if="chat.unread > 0"
            class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
          >
            <span class="text-xs text-white font-semibold">{{ chat.unread }}</span>
          </div>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Chat {
  id: number
  name: string
  type: '1-on-1' | 'group' | 'channel'
  avatar: string
  lastMessage: string
  time: string
  unread: number
}

interface Props {
  chats: Chat[]
  selectedChatId: number
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'select-chat': [chatId: number]
  close: []
}>()

const searchQuery = ref('')

const handleChatClick = (chatId: number) => {
  emit('select-chat', chatId)
  emit('close')
}
</script>

<style scoped>
.bg-white {
  background-color: white;
}

.border-r,
.border-b {
  border-color: #e5e7eb;
}

.border-r {
  border-right-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.border-blue-500 {
  border-color: #3b82f6;
}

.bg-blue-500 {
  background-color: #3b82f6;
}

.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
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

.search-input :deep(.q-field__control) {
  border-radius: 0.5rem;
}

.search-input :deep(.q-field__control):before {
  border-color: #e5e7eb;
}

.search-input :deep(.q-field__control):hover:before {
  border-color: #3b82f6;
}

.search-input :deep(.q-field__control):after {
  border-color: #3b82f6;
}

@media (min-width: 1024px) {
  .close-btn-responsive {
    display: none !important;
  }
}
</style>
