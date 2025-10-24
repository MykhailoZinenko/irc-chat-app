<template>
  <q-page class="index-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Sidebar -->
      <ChatSidebar
        :chats="chats"
        :selected-chat-id="selectedChatId"
        :is-open="sidebarOpen"
        @select-chat="handleSelectChat"
        @close="sidebarOpen = false"
      />

      <!-- Overlay for mobile when sidebar is open -->
      <div
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
        @click="sidebarOpen = false"
      />

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <ChatHeader
          :chat="currentChat"
          @toggle-sidebar="sidebarOpen = !sidebarOpen"
          @toggle-info="infoPanelOpen = !infoPanelOpen"
        />

        <MessageList :messages="messages" />

        <MessageInput
          @send="handleSendMessage"
          @attach="handleAttach"
          @emoji="handleEmoji"
        />
      </div>

      <!-- Info Panel -->
      <!-- Overlay for mobile/tablet -->
      <div
        v-show="infoPanelOpen"
        class="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="infoPanelOpen = false"
      />

      <InfoPanel
        :chat="currentChat"
        :is-open="infoPanelOpen"
        :members="groupMembers"
        @close="infoPanelOpen = false"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ChatSidebar from 'src/components/chat/ChatSidebar.vue'
import ChatHeader from 'src/components/chat/ChatHeader.vue'
import MessageList from 'src/components/chat/MessageList.vue'
import MessageInput from 'src/components/chat/MessageInput.vue'
import InfoPanel from 'src/components/chat/InfoPanel.vue'

// Mock data - will be replaced with real data from stores later
const chats = ref([
  {
    id: 0,
    name: 'Project Team',
    type: 'group' as const,
    avatar: '👥',
    lastMessage: 'Meeting at 3 PM',
    time: '2:30 PM',
    unread: 2,
    memberCount: 15,
    description: 'Project coordination and updates'
  },
  {
    id: 1,
    name: 'Alice Johnson',
    type: '1-on-1' as const,
    avatar: '👩',
    lastMessage: 'Hey! How are you doing?',
    time: '1:45 PM',
    unread: 0,
    username: '@alice_j',
    phone: '+1 234 567 8900',
    bio: 'Product Designer | Coffee lover ☕'
  },
  {
    id: 2,
    name: 'Tech News',
    type: 'channel' as const,
    avatar: '📱',
    lastMessage: 'New update released!',
    time: '12:20 PM',
    unread: 5,
    subscriberCount: 1247,
    description: 'Latest tech news and updates from the industry'
  },
  {
    id: 3,
    name: 'Bob Smith',
    type: '1-on-1' as const,
    avatar: '👨',
    lastMessage: 'Thanks for your help',
    time: 'Yesterday',
    unread: 0,
    username: '@bobsmith',
    phone: '+1 234 567 8901',
    bio: 'Software Engineer'
  },
  {
    id: 4,
    name: 'Design Team',
    type: 'group' as const,
    avatar: '🎨',
    lastMessage: 'New mockups ready',
    time: 'Yesterday',
    unread: 1,
    memberCount: 8,
    description: 'Design team collaboration'
  }
])

const messages = ref([
  {
    id: 1,
    sender: 'Alice Johnson',
    avatar: '👩',
    text: 'Hey everyone! Have you seen the new designs?',
    time: '2:15 PM',
    own: false,
    read: true,
    reactions: [{ emoji: '👍', count: 3 }, { emoji: '🔥', count: 1 }]
  },
  {
    id: 2,
    sender: 'Alice Johnson',
    avatar: '👩',
    text: 'I think they look amazing',
    time: '2:16 PM',
    own: false,
    read: true
  },
  {
    id: 3,
    sender: 'Bob Smith',
    avatar: '👨',
    text: 'Yes! I love the color scheme',
    time: '2:20 PM',
    own: false,
    read: true,
    reactions: [{ emoji: '❤️', count: 2 }]
  },
  {
    id: 4,
    sender: 'You',
    avatar: '😊',
    text: 'Thanks! Worked hard on them',
    time: '2:25 PM',
    own: true,
    read: true,
    reactions: [{ emoji: '👏', count: 2 }, { emoji: '🎉', count: 1 }]
  },
  {
    id: 5,
    sender: 'You',
    avatar: '😊',
    text: 'The client should be happy',
    time: '2:25 PM',
    own: true,
    read: true
  },
  {
    id: 6,
    sender: 'Alice Johnson',
    avatar: '👩',
    text: "When's the presentation?",
    time: '2:35 PM',
    own: false,
    read: true
  },
  {
    id: 7,
    sender: 'You',
    avatar: '😊',
    text: 'Tomorrow at 10 AM',
    time: '2:40 PM',
    own: true,
    read: false
  }
])

const groupMembers = ref([
  { name: 'Alice Johnson', avatar: '👩', role: 'admin', status: 'online' },
  { name: 'Bob Smith', avatar: '👨', role: 'admin', status: 'online' },
  { name: 'Carol White', avatar: '👱‍♀️', role: 'member', status: 'offline' },
  { name: 'David Brown', avatar: '🧔', role: 'member', status: 'online' },
  { name: 'Emma Davis', avatar: '👧', role: 'member', status: 'offline' }
])

const selectedChatId = ref(0)
const sidebarOpen = ref(false)
const infoPanelOpen = ref(false)

const currentChat = computed(() => {
  return chats.value.find((c) => c.id === selectedChatId.value)!
})

const handleSelectChat = (chatId: number) => {
  selectedChatId.value = chatId
}

const handleSendMessage = (message: string) => {
  console.log('Send message:', message)
  // Will be implemented with real logic later
}

const handleAttach = () => {
  console.log('Attach file')
  // Will be implemented with real logic later
}

const handleEmoji = () => {
  console.log('Open emoji picker')
  // Will be implemented with real logic later
}
</script>

<style scoped>
.index-page {
  padding: 0;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-black {
  background-color: black;
}

.bg-opacity-50 {
  opacity: 0.5;
}
</style>

