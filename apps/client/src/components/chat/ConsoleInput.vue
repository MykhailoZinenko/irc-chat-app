<template>
  <div class="input-container">
    <!-- Input + menu wrapper -->
    <div class="input-wrapper">
      <!-- Suggestions menu above input -->
      <q-menu
        ref="menuRef"
        v-model="menuVisible"
        anchor="top middle"
        self="bottom middle"
        fit
        no-parent-event
        no-focus
        transition-show="jump-down"
        transition-hide="jump-up"
        :offset="[0, 8]"
      >
        <q-list dense style="min-width: 200px; max-height: 250px; padding: 4px;">
          <q-item
            v-for="(item, index) in suggestions"
            :key="item.type + '-' + item.value"
            clickable
            :active="index === highlightedIndex"
            :class="{ 'bg-grey-3': index === highlightedIndex }"
            @click="applySuggestion(item)"
          >
            <q-item-section>
              <div class="text-body2">
                {{ item.label }}
              </div>
              <div
                v-if="item.description"
                class="text-caption text-grey-7"
              >
                {{ item.description }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>

      <!-- Main input -->
      <q-input
        v-model="inputMessage"
        outlined
        :placeholder="props.placeholder || 'Placeholder'"
        class="flex-1 message-input"
        bg-color="white"
        borderless
        @keydown.enter.prevent="handleEnter"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.down.prevent="moveHighlight(1)"
      />
    </div>

    <!-- Emoji button (hidden in command-only mode) -->
    <q-btn
      v-if="!onlyCommandMode"
      round
      flat
      icon="sentiment_satisfied_alt"
      color="grey-6"
      class="emoji-btn"
    >
      <q-menu>
        <q-card style="width: 300px; overflow: hidden;">
          <q-card-section class="q-pa-md">
            <div class="text-subtitle2 q-mb-sm text-grey-8">Emoji</div>
            <div class="emoji-scroll-container">
              <div class="emoji-grid">
                <q-btn
                  v-for="emoji in emojiList"
                  :key="emoji"
                  flat
                  dense
                  size="md"
                  class="emoji-item"
                  @click="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-menu>
    </q-btn>

    <!-- Send button -->
    <q-btn
      round
      flat
      icon="send"
      color="primary"
      class="send-btn"
      @click="handleSend"
    />
  </div>
</template>

<script setup lang="ts">
import { type CommandType, isCommandType, type CommandItem, type MemberItem } from 'src/types/commands';
import { computed, ref, watch } from 'vue'

type Suggestion =
  | { type: 'command'; value: string; label: string; description?: string }
  | { type: 'mention'; value: string; label: string; description?: string }

const props = defineProps<{
  commands?: CommandItem[]
  members?: MemberItem[]
  placeholder?: string
  onlyCommandMode?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  command: [type: CommandType, arg: string]
}>()

const onlyCommandMode = computed(() => props.onlyCommandMode ?? false)

const inputMessage = ref('')

// --- emoji picker ---
const emojiList = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
  '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✨', '⭐', '🌟', '💫', '✅', '❌', '🔥', '💯', '🎉', '🎊'
]

const insertEmoji = (emoji: string) => {
  inputMessage.value += emoji
}

// --- suggestion state ---
const menuVisible = ref(false)
const highlightedIndex = ref(0)
const menuRef = ref<any>(null)

const currentWords = computed(() =>
  inputMessage.value.trim().split(/\s+/).filter(Boolean)
)

const lastWord = computed(() => {
  const words = currentWords.value
  return words.length ? words[words.length - 1] : ''
})

// Command mode: starts with "/" and no space yet
const isCommandMode = computed(() => {
  if (!inputMessage.value.startsWith('/')) return false
  return !inputMessage.value.includes(' ')
})

// Mention mode: last word starts with "@", and we are still typing that word (no trailing space)
const isMentionMode = computed(() => {
  if (!lastWord.value?.startsWith('@')) return false
  // If message ends with space, we're done with that word → no suggestions
  if (inputMessage.value.endsWith(' ')) return false
  return true
})

const commandQuery = computed(() =>
  isCommandMode.value ? inputMessage.value.slice(1).toLowerCase() : ''
)

const mentionQuery = computed(() =>
  isMentionMode.value ? lastWord.value?.slice(1).toLowerCase() : ''
)

const suggestions = computed<Suggestion[]>(() => {
  const list: Suggestion[] = []

  // /command suggestions
  if (isCommandMode.value && props.commands?.length) {
    const q = commandQuery.value
    for (const cmd of props.commands) {
      if (!q || cmd.name.toLowerCase().includes(q)) {
        list.push({
          type: 'command',
          value: cmd.name,
          label: `/${cmd.name}`,
          description: cmd.description
        } as Suggestion)
      }
    }
  }
  // @mention suggestions
  else if (isMentionMode.value && props.members?.length) {
    const q = mentionQuery.value
    for (const m of props.members) {
      const handle = m.username || m.name || ''
      if (!handle) continue
      if (!q || handle.toLowerCase().includes(q)) {
        list.push({
          type: 'mention',
          value: handle,
          label: `@${handle}`,
          description:
            m.name && m.username && m.name !== m.username ? m.name : undefined
        } as Suggestion)
      }
    }
  }

  return list
})

// open/close menu and reset highlight
watch(
  () => [inputMessage.value, suggestions.value.length],
  () => {
    if (suggestions.value.length > 0) {
      menuVisible.value = true
      highlightedIndex.value = 0
      // Force menu to update position on next tick
      if (menuRef.value) {
        setTimeout(() => {
          menuRef.value?.updatePosition?.()
        }, 0)
      }
    } else {
      menuVisible.value = false
    }
  }
)

const moveHighlight = (delta: number) => {
  if (!menuVisible.value || suggestions.value.length === 0) return
  const len = suggestions.value.length
  highlightedIndex.value = (highlightedIndex.value + delta + len) % len
}

const applySuggestion = (item: Suggestion) => {
  if (item.type === 'command') {
    // Replace entire message with command + space
    inputMessage.value = `/${item.value} `
  } else if (item.type === 'mention') {
    // Replace last @word with selected mention + space at the end
    const words = inputMessage.value.split(/\s+/)
    if (words.length === 0) {
      inputMessage.value = `@${item.value} `
    } else {
      words[words.length - 1] = `@${item.value}`
      inputMessage.value = words.join(' ') + ' '
    }
  }
  menuVisible.value = false
}

const handleEnter = () => {
  if (menuVisible.value && suggestions.value.length > 0) {
    const item = suggestions.value[highlightedIndex.value]
    if (item) {
      applySuggestion(item)
      return
    }
  }
  handleSend();
}

const handleSend = () => {
  const text = inputMessage.value.trim()
  if (!text) return

  if (text.startsWith('/')) {
    const withoutSlash = text.slice(1)
    const [commandRaw, ...rest] = withoutSlash.split(' ')
    const command = commandRaw?.toLowerCase() ?? '';

    if (isCommandType(command)) {
      const args = rest.join(' ').trim()
      emit('command',command, args)
    } else {
      emit('send', text)
    }
  } else {
    emit('send', text)
  }

  inputMessage.value = ''
  menuVisible.value = false
}
</script>

<style scoped>
.input-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

@media (min-width: 640px) {
  .input-container {
    padding: 10px 16px;
  }
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
}

.attach-btn,
.emoji-btn,
.send-btn {
  flex-shrink: 0;
}

.attach-btn :deep(.q-icon),
.emoji-btn :deep(.q-icon) {
  font-size: 22px !important;
}

.attach-btn,
.emoji-btn {
  opacity: 0.6;
}

.attach-btn:hover,
.emoji-btn:hover {
  opacity: 1;
}

.send-btn {
  color: #3b82f6 !important;
  background: transparent !important;
}

.send-btn :deep(.q-icon) {
  font-size: 22px !important;
}

.message-input {
  flex: 1;
}

.message-input :deep(.q-field__control) {
  min-height: 40px;
  height: 40px;
  padding: 0 16px;
  background: #f3f4f6;
  border: none !important;
  box-shadow: none !important;
  border-radius: 20px;
}

.message-input :deep(.q-field__control):before,
.message-input :deep(.q-field__control):after {
  display: none !important;
  border: none !important;
}

.message-input :deep(.q-field__native) {
  padding: 0;
  font-size: 15px;
  color: #1f2937;
}

.message-input :deep(.q-field__native)::placeholder {
  color: #9ca3af;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0;
}

.emoji-scroll-container {
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  margin-right: -8px;
}

.emoji-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.emoji-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.emoji-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.emoji-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.emoji-item {
  font-size: 20px;
  width: 100%;
  height: 36px;
  padding: 0;
  margin: 0;
}

.emoji-item :deep(.q-btn__content) {
  padding: 0;
  margin: 0;
}

.emoji-item:hover {
  background: #f3f4f6;
}
</style>