<template>
  <div
    :class="[
      'flex w-full',
      displayMessage.own ? 'justify-end gap-0' : 'justify-start gap-2',
      isFirstInGroup ? 'mt-4' : 'mt-1',
      hasReactions ? 'mb-4' : ''
    ]"
  >
    <!-- Avatar for other users -->
    <div v-if="!displayMessage.own" class="w-8 h-8 flex-shrink-0">
      <div
        v-if="showAvatar"
        @click="emit('userClick', displayMessage.sender)"
        class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg cursor-pointer hover:opacity-80 transition-opacity"
      >
        {{ displayMessage.avatar }}
      </div>
      <div v-else class="w-8 h-8" />
    </div>

    <div
      :class="[
        'flex flex-col',
        displayMessage.own ? 'items-end max-w-full w-full pr-0' : 'items-start max-w-full'
      ]"
    >
    <p
      v-if="!displayMessage.own && isFirstInGroup"
      @click="emit('userClick', displayMessage.sender)"
      class="text-xs font-semibold text-gray-700 mb-1 ml-3 cursor-pointer hover:text-blue-600 transition-colors"
    >
      {{ displayMessage.sender }}
    </p>

      <div class="relative">
        <div :class="['rounded-2xl px-3 py-2 sm:px-4 sm:py-2', bubbleClasses]">
          <p class="text-sm sm:text-base">
            <span v-for="(segment, idx) in highlightedText" :key="idx" :class="segment.class">
              {{ segment.text }}
            </span>
          </p>
          <div class="flex items-center gap-1 justify-end mt-1">
            <p :class="['text-xs', displayMessage.own ? 'text-blue-1' : 'text-gray-500']">
              {{ displayMessage.time }}
            </p>
            <div v-if="displayMessage.own" class="flex items-center">
              <q-icon
                :name="displayMessage.read ? 'done_all' : 'done'"
                size="16px"
                :class="displayMessage.own ? 'text-blue-3' : ''"
              />
            </div>
          </div>
        </div>

        <!-- Reactions -->
        <div v-if="displayMessage.reactions && displayMessage.reactions.length > 0" class="absolute -bottom-2.5 left-2 flex gap-1">
          <div
            v-for="(reaction, idx) in displayMessage.reactions"
            :key="idx"
            class="bg-white border border-gray-200 hover:border-gray-300 rounded-full px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <span class="text-sm">{{ reaction.emoji }}</span>
            <span class="text-xs font-semibold text-gray-700">{{ reaction.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ChannelMessage } from '@/stores/message-store'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { useChannelStore } from '@/stores/channel-store'
import { DateTime } from 'luxon'

interface Props {
  message: ChannelMessage
  previousMessage?: ChannelMessage | null | undefined
}
const props = defineProps<Props>()

const emit = defineEmits<{
  userClick: [userName: string]
}>()

const authStore = useAuthStore()
const channelStore = useChannelStore()

interface DisplayMessage {
  sender: string
  avatar: string
  text: string
  time: string
  own: boolean
  read: boolean
  reactions: Array<{ emoji: string; count: number }>
}

// Transform ChannelMessage to display format
const displayMessage = computed<DisplayMessage>(() => {
  const senderName = props.message.sender.nickName || props.message.sender.fullName || 'Unknown'
  const isOwn = props.message.senderId === authStore.user?.id
  const createdAt = DateTime.fromISO(props.message.createdAt)
  const timeStr = createdAt.toLocaleString(DateTime.TIME_SIMPLE)

  return {
    sender: senderName,
    avatar: senderName.charAt(0).toUpperCase(),
    text: props.message.content,
    time: timeStr,
    own: isOwn,
    read: props.message.status?.read || false,
    reactions: [],
  }
})

const isFirstInGroup = computed(() => {
  if (!props.previousMessage) return true
  const prevSenderName = props.previousMessage.sender.nickName || props.previousMessage.sender.fullName || 'Unknown'
  const currentSenderName = props.message.sender.nickName || props.message.sender.fullName || 'Unknown'
  return prevSenderName !== currentSenderName
})

const showAvatar = computed(() => {
  if (!props.previousMessage) return true
  const prevSenderName = props.previousMessage.sender.nickName || props.previousMessage.sender.fullName || 'Unknown'
  const currentSenderName = props.message.sender.nickName || props.message.sender.fullName || 'Unknown'
  if (prevSenderName !== currentSenderName) return true

  // Show avatar if more than 10 minutes between messages
  const currentTime = DateTime.fromISO(props.message.createdAt)
  const prevTime = DateTime.fromISO(props.previousMessage.createdAt)
  const diffMinutes = currentTime.diff(prevTime, 'minutes').minutes

  return Math.abs(diffMinutes) > 10
})

const hasReactions = computed(() => {
  return false // No reactions for now
})

const bubbleClasses = computed(() => {
  const base = displayMessage.value.own
    ? 'bubble bubble--own rounded-br-md'
    : 'bubble bubble--other rounded-bl-md'

  const content = props.message.content || ''
  const ownNick = authStore.user?.nickName?.toLowerCase()
  const mentionsMe =
    !!ownNick &&
    new RegExp(`(^|\\s|[^\\w])@${ownNick}\\b`, 'i').test(content)

  if (mentionsMe && !displayMessage.value.own) {
    return `${base} bubble--highlight`
  }

  return base
})

type TextSegment = { text: string; class?: string }

const highlightedText = computed<TextSegment[]>(() => {
  const content = props.message.content || ''
  if (!content) return []

  const segments: TextSegment[] = []
  const ownNick = authStore.user?.nickName?.toLowerCase()

  // Build a set of usernames in the channel for quick matching
  const memberNames = new Set<string>(
    (channelStore.currentChannelMembers || [])
      .map((m) => m.nickName?.toLowerCase())
      .filter((name): name is string => Boolean(name))
  )

  const parts = content.split(/(\s+)/) // keep spaces
  const isOwnMessage = displayMessage.value.own

  for (const part of parts) {
    if (!part.startsWith('@') || part.trim().length <= 1) {
      segments.push({ text: part })
      continue
    }

    const handle = part.slice(1)
    const lowerHandle = handle.toLowerCase()
    const isKnown = memberNames.has(lowerHandle)
    const isOwn = ownNick && lowerHandle === ownNick

    const className = isOwn
      ? isOwnMessage
        ? 'mention-own-self'
        : 'mention-self'
      : isKnown
        ? isOwnMessage
          ? 'mention-own'
          : 'mention'
        : isOwnMessage
          ? 'mention-own-unknown'
          : 'mention-unknown'

    segments.push({ text: part, class: className })
  }

  return segments
})
</script>

<style scoped>
.bubble {
  border-radius: 1rem;
  transition: box-shadow 0.2s ease;
}

.bubble--own {
  background: linear-gradient(to bottom right, var(--app-gradient-start), var(--app-gradient-end));
  color: var(--app-surface);
}

.bubble--other {
  background: var(--app-surface);
  color: var(--app-text-strong);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
}

.bubble--highlight {
  box-shadow: 0 0 0 2px var(--q-warning);
}

.mention {
  color: var(--app-mention);
  font-weight: 600;
}

.mention-own {
  color: var(--app-mention-own);
  font-weight: 600;
}

.mention-self {
  color: var(--app-mention-self);
  font-weight: 700;
}

.mention-own-self {
  color: var(--app-mention-own-self);
  font-weight: 700;
}

.mention-unknown {
  color: var(--app-mention-unknown);
  font-weight: 600;
}

.mention-own-unknown {
  color: var(--app-mention-own-unknown);
  font-weight: 600;
}
</style>
