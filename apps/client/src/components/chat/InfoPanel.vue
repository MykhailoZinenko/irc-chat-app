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
            <span class="text-sm text-blue-500 flex-1 truncate">{{ channelLink }}</span>
            <q-btn flat dense size="sm" label="Copy" color="blue-5" @click="handleCopyLink" />
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
          <MemberListItem
            v-for="admin in limitedAdminMembers"
            :key="admin.id"
            :member="admin"
            clickable
            @select="$emit('userClick', $event)"
          />
        </div>
      </div>

      <!-- Members Section -->
      <div v-if="chat.type === 'group' || chat.type === 'channel'" class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-800">
            Members
          </p>
          <span class="text-sm text-gray-500">{{ totalMembers }}</span>
        </div>
        <div class="space-y-1">
          <MemberListItem
            v-for="member in limitedRegularMembers"
            :key="member.id"
            :member="member"
            clickable
            @select="$emit('userClick', $event)"
          />
          </div>
          <div v-if="showMoreMembers" class="pt-3">
            <q-btn
              flat
              dense
              class="w-full"
              color="primary"
              label="Show all members"
              icon="groups"
              @click="$emit('showMembers')"
            />
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
import { Notify, copyToClipboard } from 'quasar'
import MemberListItem from '@/components/ui/MemberListItem.vue'
import { type ChannelMember } from '@/types/chat'

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
  members?: ChannelMember[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  userClick: [userId: number]
  leave: []
  showMembers: []
}>()

const handleClose = () => {
  emit('close')
}

const adminMembers = computed(() => {
  if (!props.members) return []
  return props.members.filter((m) => m.role === 'admin')
})

const regularMembers = computed(() => {
  if (!props.members) return []
  return props.members.filter((m) => m.role === 'member')
})

const MAX_VISIBLE = 4
const totalMembers = computed(() => (props.members ? props.members.length : 0))
const limitedAdminMembers = computed(() => adminMembers.value.slice(0, Math.min(MAX_VISIBLE, adminMembers.value.length)))
const remainingSlots = computed(() => Math.max(0, MAX_VISIBLE - limitedAdminMembers.value.length))
const limitedRegularMembers = computed(() => regularMembers.value.slice(0, remainingSlots.value))
const showMoreMembers = computed(
  () => totalMembers.value > limitedAdminMembers.value.length + limitedRegularMembers.value.length
)

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

const channelLink = computed(() => {
  const baseUrl = window.location.origin
  const channelName = props.chat.name.toLowerCase().replace(/\s+/g, '-')
  return `${baseUrl}/c/${channelName}`
})

const handleCopyLink = async () => {
  try {
    await copyToClipboard(channelLink.value)
    Notify.create({
      type: 'positive',
      message: 'Channel link copied to clipboard',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to copy link',
      position: 'top',
      timeout: 2000,
    })
  }
}

</script>

<style scoped>
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

</style>
