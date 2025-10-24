<template>
  <div
    :class="[
      'fixed right-0 top-0 z-50 border-l border-gray-200 h-full transition-transform duration-300 w-80 sm:w-96',
      'xl:relative xl:z-0 xl:w-80 xl:transition-[width,transform] xl:translate-x-0 xl:overflow-hidden',
      isOpen ? 'translate-x-0 xl:w-80' : 'translate-x-full xl:w-0 xl:border-l-0'
    ]"
  >
    <div class="flex flex-col h-full bg-white">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
        <h3 class="font-semibold text-gray-800">
          {{ panelTitle }}
        </h3>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          @click="$emit('close')"
        />
      </div>

      <!-- Scrollable Content -->
      <q-scroll-area class="flex-1">
        <!-- Profile Section -->
        <div class="flex flex-col items-center py-6 px-4 border-b border-gray-200">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl sm:text-5xl mb-4">
            {{ chat.avatar }}
          </div>
          <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-1">{{ chat.name }}</h2>
          <p v-if="chat.type === '1-on-1'" class="text-sm text-blue-500 mb-1">{{ chat.username }}</p>
          <p class="text-sm text-gray-500">{{ statusText }}</p>
        </div>

        <!-- Bio / Description -->
        <div v-if="chat.bio || chat.description" class="p-4 border-b border-gray-200">
          <p class="text-sm text-gray-600 mb-1">{{ chat.type === '1-on-1' ? 'Bio' : chat.type === 'channel' ? 'About' : 'Description' }}</p>
          <p class="text-gray-800">{{ chat.bio || chat.description }}</p>
        </div>

        <!-- Contact Details (1-on-1 only) -->
        <div v-if="chat.type === '1-on-1' && chat.phone" class="p-4 border-b border-gray-200">
          <p class="text-sm text-gray-600 mb-3">Phone</p>
          <div class="flex items-center gap-3">
            <q-icon name="phone" size="20px" color="grey-5" />
            <span class="text-gray-800">{{ chat.phone }}</span>
          </div>
        </div>

        <!-- Channel Link (channel only) -->
        <div v-if="chat.type === 'channel'" class="p-4 border-b border-gray-200">
          <p class="text-sm text-gray-600 mb-2">Channel Link</p>
          <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <q-icon name="link" size="16px" color="grey-5" />
            <span class="text-sm text-blue-500 flex-1">t.me/{{ chat.name.toLowerCase().replace(/\s+/g, '') }}</span>
            <q-btn flat dense size="sm" label="Copy" color="blue-5" />
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-b border-gray-200">
          <q-btn
            flat
            dense
            class="w-full justify-start min-h-[44px]"
            icon="notifications"
            :label="chat.type === 'channel' ? 'Mute Channel' : chat.type === 'group' ? 'Mute Notifications' : 'Notifications'"
          />
          <q-btn
            flat
            dense
            class="w-full justify-start min-h-[44px]"
            icon="search"
            :label="`Search in ${chat.type === '1-on-1' ? 'Conversation' : chat.type === 'group' ? 'Group' : 'Channel'}`"
          />
        </div>

        <!-- Members (group only) / Admins (channel only) -->
        <div v-if="chat.type === 'group' || chat.type === 'channel'" class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-gray-800">
              {{ chat.type === 'group' ? 'Members' : 'Administrators' }}
            </p>
            <q-btn
              v-if="chat.type === 'group'"
              flat
              round
              dense
              icon="person_add"
              color="blue-5"
            />
          </div>
          <div class="space-y-1">
            <div
              v-for="(member, idx) in displayMembers"
              :key="idx"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl">
                {{ member.avatar }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-800">{{ member.name }}</span>
                  <q-icon
                    v-if="member.role === 'admin' && chat.type === 'group'"
                    name="workspace_premium"
                    size="14px"
                    color="yellow-8"
                  />
                  <q-icon
                    v-if="chat.type === 'channel'"
                    name="shield"
                    size="14px"
                    color="blue-5"
                  />
                </div>
                <span class="text-xs text-gray-500">{{ member.status || 'Admin' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Shared Media -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-gray-800">
              {{ chat.type === 'channel' ? 'Recent Posts' : 'Shared Media' }}
            </p>
            <span class="text-sm text-gray-500">{{ mediaCount }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="i in 6"
              :key="i"
              class="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <q-icon
                :name="chat.type === 'channel' ? 'description' : 'image'"
                size="20px"
                color="grey-5"
              />
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="p-4">
          <q-btn
            flat
            dense
            class="w-full justify-start min-h-[44px] text-red-600"
            :icon="chat.type === '1-on-1' ? 'block' : 'logout'"
            :label="chat.type === '1-on-1' ? 'Block User' : chat.type === 'group' ? 'Leave Group' : 'Leave Channel'"
            text-color="red"
          />
        </div>
      </q-scroll-area>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Member {
  name: string
  avatar: string
  role: string
  status: string
}

interface Chat {
  id: number
  name: string
  type: '1-on-1' | 'group' | 'channel'
  avatar: string
  username?: string
  phone?: string
  bio?: string
  description?: string
  memberCount?: number
  subscriberCount?: number
}

interface Props {
  chat: Chat
  isOpen: boolean
  members?: Member[]
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const panelTitle = computed(() => {
  if (props.chat.type === '1-on-1') return 'Contact Info'
  if (props.chat.type === 'group') return 'Group Info'
  if (props.chat.type === 'channel') return 'Channel Info'
  return 'Info'
})

const statusText = computed(() => {
  if (props.chat.type === '1-on-1') return 'Online'
  if (props.chat.type === 'group') return `${props.chat.memberCount} members`
  if (props.chat.type === 'channel') return `${props.chat.subscriberCount} subscribers`
  return ''
})

const displayMembers = computed(() => {
  if (!props.members) return []
  if (props.chat.type === 'channel') return props.members.slice(0, 2)
  return props.members
})

const mediaCount = computed(() => {
  if (props.chat.type === '1-on-1') return '124'
  if (props.chat.type === 'group') return '342'
  if (props.chat.type === 'channel') return '89'
  return '0'
})
</script>

<style scoped>
.bg-white {
  background-color: white;
}

.border-l,
.border-b {
  border-color: #e5e7eb;
}

.border-l {
  border-left-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-gray-200 {
  background-color: #e5e7eb;
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

.text-blue-500 {
  color: #3b82f6;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.border-gray-200 {
  border-color: #e5e7eb;
}
</style>
