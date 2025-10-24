<template>
  <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
    <div class="flex items-center gap-3 min-w-0">
      <q-btn
        flat
        round
        dense
        icon="menu"
        color="grey-7"
        class="burger-btn-responsive"
        @click="$emit('toggle-sidebar')"
      />

      <div
        class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors min-w-0"
        @click="$emit('toggle-info')"
      >
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl flex-shrink-0">
          {{ chat.avatar }}
        </div>
        <div class="min-w-0">
          <h2 class="font-semibold text-gray-800 truncate text-base leading-6">{{ chat.name }}</h2>
          <p class="text-sm text-gray-500 truncate leading-tight">{{ chatStatus }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1 flex-shrink-0">
      <q-btn flat round dense icon="search" class="hidden sm:flex" color="grey-7" />
      <q-btn flat round dense icon="notifications" class="hidden sm:flex" color="grey-7" />
      <q-btn flat round dense icon="more_vert" color="grey-7">
        <q-menu>
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup>
              <q-item-section avatar>
                <q-icon name="search" />
              </q-item-section>
              <q-item-section>Search</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section avatar>
                <q-icon name="notifications_off" />
              </q-item-section>
              <q-item-section>Mute</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup class="text-red-600">
              <q-item-section avatar>
                <q-icon name="block" color="red" />
              </q-item-section>
              <q-item-section>Block</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Chat {
  id: number
  name: string
  type: '1-on-1' | 'group' | 'channel'
  avatar: string
  memberCount?: number
  subscriberCount?: number
}

interface Props {
  chat: Chat
}

const props = defineProps<Props>()

defineEmits<{
  'toggle-sidebar': []
  'toggle-info': []
}>()

const chatStatus = computed(() => {
  if (props.chat.type === '1-on-1') return 'Online'
  if (props.chat.type === 'group') return `${props.chat.memberCount} members`
  if (props.chat.type === 'channel') return `${props.chat.subscriberCount} subscribers`
  return ''
})
</script>

<style scoped>
.bg-white {
  background-color: white;
}

.border-b {
  border-bottom-width: 1px;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
}

.text-gray-800 {
  color: #1f2937;
}

.text-gray-500 {
  color: #6b7280;
}

@media (min-width: 1024px) {
  .burger-btn-responsive {
    display: none !important;
  }
}
</style>
