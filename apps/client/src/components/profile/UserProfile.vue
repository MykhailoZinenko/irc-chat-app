<template>
  <div class="flex-1 flex flex-col bg-white h-full">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <q-spinner size="48px" color="primary" />
    </div>

    <template v-else-if="userProfile">
      <!-- Header -->
      <ProfileHeader
        :title="displayName"
        subtitle="Profile"
        @back="$emit('back')"
        @more="handleMore"
      />

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Profile Header -->
        <div class="flex flex-col items-center py-8 px-4 app-gradient-surface">
          <div class="w-32 h-32 rounded-full app-gradient flex items-center justify-center text-6xl mb-4 shadow-lg">
            👤
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-1">{{ displayName }}</h2>
          <p class="text-blue-500 text-sm mb-1">@{{ userProfile.nickName }}</p>
          <p class="text-sm text-gray-500">Member since {{ joinDate }}</p>
        </div>

        <!-- Action Buttons -->
        <ProfileSection>
          <div class="grid grid-cols-2 gap-3">
            <ProfileActionButton
              icon="chat"
              label="Message"
              bg-color="bg-blue-500"
              icon-color="text-white"
              @click="handleMessage"
            />

            <ProfileActionButton
              icon="person_add"
              label="Add"
              bg-color="bg-blue-100"
              icon-color="text-blue-600"
              @click="showInviteDialog = true"
            />
          </div>
        </ProfileSection>

        <!-- Info Section -->
        <ProfileSection title="Info">
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <q-icon name="alternate_email" size="18px" class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-800">{{ userProfile.email }}</p>
                <p class="text-xs text-gray-500">Email</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <q-icon name="chat" size="18px" class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-800">@{{ userProfile.nickName }}</p>
                <p class="text-xs text-gray-500">Username</p>
              </div>
            </div>
          </div>
        </ProfileSection>

        <!-- Settings Section -->
        <ProfileSection title="Settings">
          <div class="space-y-1">
            <button
              @click="isMuted = !isMuted"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <q-icon
                :name="isMuted ? 'notifications_off' : 'notifications'"
                size="20px"
                class="text-gray-600"
              />
              <span class="text-gray-800">{{ isMuted ? 'Unmute' : 'Mute' }} Notifications</span>
            </button>
          </div>
        </ProfileSection>

        <!-- Common Channels -->
        <ProfileSection v-if="commonChannels.length > 0" title="Common Channels" :count="commonChannels.length" :title-bold="true">
          <div class="space-y-2">
            <button
              v-for="channel in commonChannels"
              :key="channel.id"
              @click="handleChannelClick(channel)"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div class="w-12 h-12 rounded-full app-gradient flex items-center justify-center text-2xl flex-shrink-0">
                {{ channel.type === 'public' ? '📢' : '🔒' }}
              </div>
              <div class="flex-1 text-left min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ channel.name }}</p>
                <p class="text-xs text-gray-500">{{ channel.type }} channel</p>
              </div>
            </button>
          </div>
        </ProfileSection>

        <!-- Danger Zone -->
        <div class="px-4 py-4">
          <div class="space-y-2">
            <button
              @click="handleBlock"
              class="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <q-icon name="block" size="20px" />
              <span class="font-medium">Block User</span>
            </button>
            <button
              @click="handleReport"
              class="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <q-icon name="flag" size="20px" />
              <span class="font-medium">Report User</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <InviteUserDialog v-model="showInviteDialog" :user-id="props.userId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileActionButton from '@/components/profile/ProfileActionButton.vue'
import ProfileSection from '@/components/profile/ProfileSection.vue'
import InviteUserDialog from '@/components/dialogs/InviteUserDialog.vue'
import { api } from 'src/boot/axios'
import { DateTime } from 'luxon'
import { useChannelStore } from '@/stores/channel-store'

interface UserProfile {
  id: number
  firstName: string | null
  lastName: string | null
  nickName: string
  email: string
  createdAt: string
}

interface Props {
  userId: number
}

const props = defineProps<Props>()

defineEmits<{
  back: []
}>()

const channelStore = useChannelStore()
const userProfile = ref<UserProfile | null>(null)
const loading = ref(false)
const isMuted = ref(false)
const showInviteDialog = ref(false)
const commonChannels = ref<any[]>([])

const displayName = computed(() => {
  if (!userProfile.value) return ''
  const parts = [userProfile.value.firstName, userProfile.value.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : userProfile.value.nickName
})

const joinDate = computed(() => {
  if (!userProfile.value) return ''
  return DateTime.fromISO(userProfile.value.createdAt).toFormat('MMMM yyyy')
})

const fetchUserProfile = async () => {
  loading.value = true
  try {
    const [profileResponse, channelsResponse] = await Promise.all([
      api.get<{
        success: boolean
        data: UserProfile
      }>(`/api/users/${props.userId}/profile`),
      api.get<{
        success: boolean
        data: { channels: any[] }
      }>(`/api/users/${props.userId}/common-channels`)
    ])

    if (profileResponse.data.success) {
      userProfile.value = profileResponse.data.data
    }

    if (channelsResponse.data.success) {
      commonChannels.value = channelsResponse.data.data.channels
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
  } finally {
    loading.value = false
  }
}

const fetchCommonChannels = async () => {
  try {
    const response = await api.get<{
      success: boolean
      data: { channels: any[] }
    }>(`/api/users/${props.userId}/common-channels`)

    if (response.data.success) {
      commonChannels.value = response.data.data.channels
    }
  } catch (error) {
    console.error('Failed to fetch common channels:', error)
  }
}

onMounted(() => {
  void fetchUserProfile()
})

watch(() => props.userId, () => {
  void fetchUserProfile()
})

watch(() => channelStore.channels, () => {
  void fetchCommonChannels()
}, { deep: true })

const handleMore = () => {
}

const handleMessage = () => {
}

const handleChannelClick = (channel: any) => {
  console.log('Channel clicked:', channel);
}

const handleBlock = () => {
}

const handleReport = () => {
}
</script>

