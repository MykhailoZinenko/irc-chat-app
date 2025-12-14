<template>
  <q-item
    class="member-list-item rounded-lg"
    :clickable="clickable"
    dense
    @click="handleClick"
  >
    <q-item-section avatar>
      <div class="avatar-circle">
        {{ initials }}
      </div>
    </q-item-section>
    <q-item-section>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-800">{{ displayName }}</span>
        <q-badge v-if="member.role === 'admin'" color="yellow-7" text-color="black" label="Admin" />
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span class="status-dot" :class="member.status"></span>
        <span>{{ statusLabel }}</span>
      </div>
      <div v-if="member.email" class="text-xs text-gray-500">{{ member.email }}</div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type ChannelMember } from '@/types/chat'

const props = defineProps<{
  member: ChannelMember
  clickable?: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const displayName = computed(
  () => props.member.nickName || props.member.firstName || props.member.lastName || 'User'
)

const statusLabel = computed(() => {
  if (props.member.status === 'online') return 'Online'
  if (props.member.status === 'dnd') return 'Do Not Disturb'
  return 'Offline'
})

const initials = computed(() => {
  const name = props.member.nickName || props.member.firstName || props.member.email || ''
  if (!name) return '?'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const handleClick = () => {
  if (props.clickable) {
    emit('select', props.member.id)
  }
}
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--app-gradient-start), var(--app-gradient-end));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-surface);
}

.member-list-item {
  padding: 6px 8px;
  background: var(--app-surface-muted);
  transition: background 0.15s ease;
}

.member-list-item:hover {
  background: var(--app-surface-muted-strong);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: var(--app-status-online);
}

.status-dot.dnd {
  background: var(--app-status-dnd);
}

.status-dot.offline {
  background: var(--app-status-offline);
}
</style>
