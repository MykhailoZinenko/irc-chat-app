<template>
  <div
    v-if="invitations.length > 0"
    class="mx-4 my-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-all"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-3">
      <!-- Stacked Avatars -->
      <div class="flex -space-x-2">
        <div
          v-for="(inviter, index) in displayedInviters"
          :key="inviter.id"
          class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm"
          :style="{ zIndex: displayedInviters.length - index }"
        >
          {{ getInitials(inviter) }}
        </div>
        <div
          v-if="invitations.length > 3"
          class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs border-2 border-white shadow-sm"
          style="z-index: 0"
        >
          +{{ invitations.length - 3 }}
        </div>
      </div>

      <!-- Text -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800">
          {{ invitations.length }} {{ invitations.length === 1 ? 'Invitation' : 'Invitations' }}
        </p>
        <p class="text-xs text-gray-600 truncate">
          {{ getInvitationText() }}
        </p>
      </div>

      <!-- Arrow Icon -->
      <q-icon name="chevron_right" size="20px" class="text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Inviter {
  id: number
  nickName: string
  firstName: string | null
  lastName: string | null
}

interface Invitation {
  id: number
  channel: {
    name: string
  }
  inviter: Inviter
}

interface Props {
  invitations: Invitation[]
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const displayedInviters = computed(() => {
  // Get unique inviters (up to 3)
  const uniqueInviters = new Map<number, Inviter>()

  for (const invitation of props.invitations) {
    if (uniqueInviters.size >= 3) break
    if (!uniqueInviters.has(invitation.inviter.id)) {
      uniqueInviters.set(invitation.inviter.id, invitation.inviter)
    }
  }

  return Array.from(uniqueInviters.values())
})

const getInitials = (inviter: Inviter) => {
  if (inviter.firstName && inviter.lastName) {
    return `${inviter.firstName[0]}${inviter.lastName[0]}`.toUpperCase()
  }
  if (inviter.firstName) {
    return inviter.firstName.substring(0, 2).toUpperCase()
  }
  return inviter.nickName.substring(0, 2).toUpperCase()
}

const getInvitationText = () => {
  if (props.invitations.length === 1) {
    const inv = props.invitations[0]
    if (!inv) return 'New invitation'
    const name = inv.inviter.firstName || inv.inviter.nickName
    return `${name} invited you to ${inv.channel.name}`
  }

  const uniqueChannels = new Set(props.invitations.map(inv => inv.channel.name))
  if (uniqueChannels.size === 1) {
    return `to ${Array.from(uniqueChannels)[0]}`
  }

  return `to ${uniqueChannels.size} channels`
}
</script>

<style scoped>
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-50 {
  --tw-gradient-from: #eff6ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0));
}

.to-purple-50 {
  --tw-gradient-to: #faf5ff;
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-400 {
  --tw-gradient-from: #60a5fa;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(96, 165, 250, 0));
}

.to-purple-500 {
  --tw-gradient-to: #a855f7;
}

.-space-x-2 > * + * {
  margin-left: -0.5rem;
}
</style>
