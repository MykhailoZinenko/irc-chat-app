<template>
  <div
    v-if="isOpen"
    :class="[
      'fixed right-0 top-0 z-50 border-l border-gray-200 h-full transition-transform duration-300 w-80 sm:w-96',
      'xl:relative xl:z-0 xl:w-80 xl:transition-[width] xl:overflow-hidden',
      'translate-x-0'
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
          @click="handleClose"
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

        <!-- Admins Section -->
        <div v-if="chat.type === 'group' || chat.type === 'channel'" class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-gray-800">
              Administrators
            </p>
          </div>
          <div class="space-y-1">
            <div
              v-for="admin in adminMembers"
              :key="admin.id"
              @click="$emit('userClick', admin.id)"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-semibold text-white">
                {{ getInitials(admin.nickName || admin.firstName || admin.email) }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-800">{{ admin.nickName || admin.firstName || 'User' }}</span>
                  <q-icon
                    name="shield"
                    size="14px"
                    color="yellow-8"
                  />
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span class="status-dot" :class="admin.status"></span>
                  <span>{{ statusLabel(admin.status) }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ admin.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Members Section -->
        <div v-if="chat.type === 'group' || chat.type === 'channel'" class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-gray-800">
              Members
            </p>
            <span class="text-sm text-gray-500">{{ regularMembers.length }}</span>
          </div>
          <div class="space-y-1">
            <div
              v-for="member in regularMembers"
              :key="member.id"
              @click="$emit('userClick', member.id)"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
                {{ getInitials(member.nickName || member.firstName || member.email) }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-800">{{ member.nickName || member.firstName || 'User' }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span class="status-dot" :class="member.status"></span>
                  <span>{{ statusLabel(member.status) }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ member.email }}</span>
              </div>
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
            @click="$emit('leave')"
          />
        </div>
      </q-scroll-area>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Member {
  id: number
  nickName: string
  firstName: string | null
  lastName: string | null
  email: string
  status: 'online' | 'dnd' | 'offline'
  role: 'member' | 'admin'
  joinedAt: string
}

interface Chat {
  id: number
  name: string
  type: '1-on-1' | 'group' | 'channel'
  avatar: string
  username?: string
  phone?: string
  bio?: string
  description?: string | null
  memberCount?: number
  subscriberCount?: number
}

interface Props {
  chat: Chat
  isOpen: boolean
  members?: Member[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  userClick: [userId: number]
  leave: []
}>()

const handleClose = () => {
  emit('close')
}

const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const adminMembers = computed(() => {
  if (!props.members) return []
  return props.members.filter((m) => m.role === 'admin')
})

const regularMembers = computed(() => {
  if (!props.members) return []
  return props.members.filter((m) => m.role === 'member')
})

const panelTitle = computed(() => {
  if (props.chat.type === '1-on-1') return 'Contact Info'
  if (props.chat.type === 'group') return 'Group Info'
  if (props.chat.type === 'channel') return 'Channel Info'
  return 'Info'
})

const statusText = computed(() => {
  if (props.chat.type === '1-on-1') return 'Online'
  if (props.chat.type === 'group') return `${props.chat.memberCount || 0} members`
  if (props.chat.type === 'channel') return `${props.chat.memberCount || 0} members`
  return ''
})

const statusLabel = (status: Member['status']) => {
  if (status === 'online') return 'Online'
  if (status === 'dnd') return 'Do Not Disturb'
  return 'Offline'
}
</script>

<style scoped>
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: #10b981;
}

.status-dot.dnd {
  background: #f59e0b;
}

.status-dot.offline {
  background: #9ca3af;
}
</style>
