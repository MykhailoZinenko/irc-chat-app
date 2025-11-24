<template>
  <q-page class="index-page">
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Sidebar -->
      <ChatSidebar
        :chats="chats"
        :selected-chat-id="selectedChatId"
        :is-open="sidebarOpen"
        @select-chat="handleSelectChat"
        @select-user="handleUserClick"
        @close="sidebarOpen = false"
        @create-channel="handleCreateChannel"
      />

      <!-- Overlay for mobile when sidebar is open -->
      <div
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
        @click="sidebarOpen = false"
      />

      <UserProfile
        v-if="selectedUserId"
        :userId="selectedUserId"
        @back="handleCloseProfile"
      />
      <!-- Main Chat Area (hidden when profile is shown) -->
      <div v-else class="flex-1 flex flex-col min-w-0">
        <template v-if="currentChat">
          <ChatHeader
            :chat="currentChat"
            @toggle-sidebar="sidebarOpen = !sidebarOpen"
            @toggle-info="infoPanelOpen = !infoPanelOpen"
          />

          <MessageList
            ref="messageListRef"
            :messages="displayedMessages"
            @load-more="loadMoreMessages"
            @user-click="handleUserClick"
          />

          <MessageInput
            @send="handleSendMessage"
            @attach="handleAttach"
            @emoji="handleEmoji"
          />
        </template>

        <!-- Empty state when no channels -->
        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <!-- Mobile menu button for empty state -->
          <div class="lg:hidden absolute top-4 left-4">
            <q-btn
              flat
              round
              dense
              icon="menu"
              color="grey-7"
              @click="sidebarOpen = true"
            />
          </div>

          <div class="text-center">
            <q-icon name="chat" size="64px" color="grey-5" class="q-mb-md" />
            <p class="text-h6 text-grey-7 q-mb-sm">No channels yet</p>
            <p class="text-body2 text-grey-6">Create a channel to start chatting</p>
          </div>
        </div>
      </div>

      <!-- Info Panel -->
      <!-- Overlay for mobile/tablet -->
      <div
        v-show="infoPanelOpen"
        class="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="infoPanelOpen = false"
      />

      <template v-if="!selectedUserId && currentChat">
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
          @user-click="handleUserClick"
        />
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import MessageList from '@/components/chat/MessageList.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import InfoPanel from '@/components/chat/InfoPanel.vue'
import UserProfile from '@/components/profile/UserProfile.vue'
import { useChannelStore } from '@/stores/channel-store'
import { DateTime } from 'luxon'

const channelStore = useChannelStore()

// Convert channels to chat list format
const chats = computed(() => {
  return channelStore.channels.map((channel) => {
    // Get emoji based on channel type
    const avatar = channel.type === 'public' ? '📢' : '🔒'

    // Format last activity time
    let time = 'No activity'
    if (channel.lastActivityAt) {
      const lastActivity = DateTime.fromISO(channel.lastActivityAt)
      const now = DateTime.now()
      const diff = now.diff(lastActivity, ['days', 'hours', 'minutes']).toObject()

      if (diff.days && diff.days >= 1) {
        time = `${Math.floor(diff.days)} day${Math.floor(diff.days) > 1 ? 's' : ''} ago`
      } else if (diff.hours && diff.hours >= 1) {
        time = `${Math.floor(diff.hours)}h ago`
      } else if (diff.minutes && diff.minutes >= 1) {
        time = `${Math.floor(diff.minutes)}m ago`
      } else {
        time = 'Just now'
      }
    }

    return {
      id: channel.id,
      name: channel.name,
      type: channel.type === 'private' ? 'group' as const : 'channel' as const,
      avatar,
      lastMessage: channel.description || 'No description',
      time,
      unread: 0,
      description: channel.description,
      memberCount: 1, // Will be updated when we fetch channel details
      subscriberCount: 1 // Will be updated when we fetch channel details
    }
  })
})

const allChatsMessages = ref([
  {
    chatId:0,
    messages: [
      { id: 1, sender: 'Alice Johnson', avatar: '👩', text: 'Good morning everyone!', time: '9:00 AM', own: false, read: true },
      { id: 2, sender: 'Bob Smith', avatar: '👨', text: 'Morning! Ready for the sprint?', time: '9:05 AM', own: false, read: true },
      { id: 3, sender: 'You', avatar: '😊', text: 'Absolutely! Let\'s do this', time: '9:10 AM', own: true, read: true },
      { id: 4, sender: 'Alice Johnson', avatar: '👩', text: 'Working on the new feature', time: '10:00 AM', own: false, read: true },
      { id: 5, sender: 'Bob Smith', avatar: '👨', text: 'Making good progress here', time: '11:30 AM', own: false, read: true },
      { id: 6, sender: 'You', avatar: '😊', text: 'Great teamwork everyone!', time: '12:00 PM', own: true, read: true },
      { id: 7, sender: 'Alice Johnson', avatar: '👩', text: 'Lunch break?', time: '1:00 PM', own: false, read: true },
      { id: 8, sender: 'Bob Smith', avatar: '👨', text: 'Good idea!', time: '1:05 PM', own: false, read: true },
      { id: 9, sender: 'Alice Johnson', avatar: '👩', text: 'Hey everyone! Have you seen the new designs?', time: '2:15 PM', own: false, read: true, reactions: [ { emoji: '👍', count: 3 }, { emoji: '🔥', count: 1 } ] },
      { id: 10, sender: 'Alice Johnson', avatar: '👩', text: 'I think they look amazing', time: '2:16 PM', own: false, read: true },
      { id: 11, sender: 'Bob Smith', avatar: '👨', text: 'Yes! I love the color scheme', time: '2:20 PM', own: false, read: true, reactions: [ { emoji: '❤️', count: 2 } ] },
      { id: 12, sender: 'You', avatar: '😊', text: 'Thanks! Worked hard on them', time: '2:25 PM', own: true, read: true, reactions: [ { emoji: '👏', count: 2 }, { emoji: '🎉', count: 1 } ] },
      { id: 13, sender: 'You', avatar: '😊', text: 'The client should be happy', time: '2:25 PM', own: true, read: true },
      { id: 14, sender: 'Alice Johnson', avatar: '👩', text: 'When\'s the presentation?', time: '2:35 PM', own: false, read: true },
      { id: 15, sender: 'You', avatar: '😊', text: 'Tomorrow at 10 AM', time: '2:40 PM', own: true, read: false },
      { id: 16, sender: 'Bob Smith', avatar: '👨', text: 'Let\'s meet early to prepare', time: '2:45 PM', own: false, read: false },
      { id: 17, sender: 'Alice Johnson', avatar: '👩', text: 'Good idea, maybe 9 AM?', time: '2:46 PM', own: false, read: false },
      { id: 18, sender: 'You', avatar: '😊', text: '9 AM works for me', time: '2:47 PM', own: true, read: false },
      { id: 19, sender: 'Bob Smith', avatar: '👨', text: 'Cool, see you both then', time: '2:48 PM', own: false, read: false },
      { id: 20, sender: 'Alice Johnson', avatar: '👩', text: 'Don’t forget to bring the slides 😅', time: '3:00 PM', own: false, read: false },
      { id: 21, sender: 'You', avatar: '😊', text: 'Already finished them!', time: '3:05 PM', own: true, read: false },
      { id: 22, sender: 'Bob Smith', avatar: '👨', text: 'Wow, that was quick 👏', time: '3:06 PM', own: false, read: false },
      { id: 23, sender: 'Alice Johnson', avatar: '👩', text: 'This is why we love working with you 😂', time: '3:07 PM', own: false, read: false },
      { id: 24, sender: 'You', avatar: '😊', text: 'Haha thanks, just doing my part', time: '3:10 PM', own: true, read: false },
      { id: 25, sender: 'Bob Smith', avatar: '👨', text: 'Anyone joining the design call later?', time: '3:30 PM', own: false, read: false },
      { id: 26, sender: 'Alice Johnson', avatar: '👩', text: 'I\'m in!', time: '3:32 PM', own: false, read: false },
      { id: 27, sender: 'You', avatar: '😊', text: 'I’ll be there too', time: '3:35 PM', own: true, read: false },
      { id: 28, sender: 'Bob Smith', avatar: '👨', text: 'Perfect. Let’s finalize everything today', time: '3:37 PM', own: false, read: false },
      { id: 29, sender: 'Alice Johnson', avatar: '👩', text: 'Can’t wait to see the feedback tomorrow 😬', time: '3:45 PM', own: false, read: false },
      { id: 30, sender: 'You', avatar: '😊', text: 'Fingers crossed 🤞', time: '3:50 PM', own: true, read: false },
      { id: 31, sender: 'Alice Johnson', avatar: '👩', text: 'Holiday coming up. 🔥', time: '3:57 PM', own: false, read: false, reactions: [ { emoji: '👍', count: 3 }, { emoji: '👍', count: 2 } ] },
      { id: 32, sender: 'Bob Smith', avatar: '👨', text: 'New task assigned.', time: '4:03 PM', own: false, read: false },
      { id: 33, sender: 'You', avatar: '😊', text: 'Don\'t forget the coffee ☕', time: '4:11 PM', own: true, read: false },
      { id: 34, sender: 'Alice Johnson', avatar: '👩', text: 'Book club suggestion.', time: '4:20 PM', own: false, read: false, reactions: [ { emoji: '❤️', count: 2 }, { emoji: '🔥', count: 2 } ] },
      { id: 35, sender: 'Bob Smith', avatar: '👨', text: 'Weekend plans? ☕', time: '4:23 PM', own: false, read: false, reactions: [ { emoji: '👏', count: 3 }, { emoji: '🔥', count: 3 } ] },
      { id: 36, sender: 'You', avatar: '😊', text: 'Weekly standup tomorrow?', time: '4:37 PM', own: true, read: false },
      { id: 37, sender: 'Alice Johnson', avatar: '👩', text: 'Weekend plans?', time: '4:42 PM', own: false, read: false, reactions: [ { emoji: '😂', count: 3 }, { emoji: '👍', count: 4 } ] },
      { id: 38, sender: 'Bob Smith', avatar: '👨', text: 'Gratitude moment.', time: '4:52 PM', own: false, read: false },
      { id: 39, sender: 'You', avatar: '😊', text: 'Movie recommendations. 😅', time: '4:57 PM', own: true, read: false, reactions: [ { emoji: '🔥', count: 4 }, { emoji: '🔥', count: 2 } ] },
      { id: 40, sender: 'Alice Johnson', avatar: '👩', text: 'End of quarter push.', time: '5:03 PM', own: false, read: false },
      { id: 41, sender: 'Bob Smith', avatar: '👨', text: 'Client feedback incoming soon.', time: '5:11 PM', own: false, read: false },
      { id: 42, sender: 'You', avatar: '😊', text: 'This team is unstoppable! 🤔', time: '5:22 PM', own: true, read: false },
      { id: 43, sender: 'Alice Johnson', avatar: '👩', text: 'Code review pending.', time: '5:29 PM', own: false, read: false },
      { id: 44, sender: 'Bob Smith', avatar: '👨', text: 'Movie recommendations.', time: '5:40 PM', own: false, read: false, reactions: [ { emoji: '🎉', count: 4 }, { emoji: '❤️', count: 2 } ] },
      { id: 45, sender: 'You', avatar: '😊', text: 'Presentation nailed it!', time: '5:45 PM', own: true, read: false, reactions: [ { emoji: '👏', count: 2 }, { emoji: '👍', count: 2 } ] },
      { id: 46, sender: 'Alice Johnson', avatar: '👩', text: 'Gratitude moment. ✨', time: '5:55 PM', own: false, read: false },
      { id: 47, sender: 'Bob Smith', avatar: '👨', text: 'Code review pending. ✨', time: '6:03 PM', own: false, read: false },
      { id: 48, sender: 'You', avatar: '😊', text: 'Catch up after lunch? 🍾', time: '6:10 PM', own: true, read: false },
      { id: 49, sender: 'Alice Johnson', avatar: '👩', text: 'Incorporated your suggestions.', time: '6:22 PM', own: false, read: false },
      { id: 50, sender: 'Bob Smith', avatar: '👨', text: 'Positive vibes only! ✨', time: '6:23 PM', own: false, read: false },
      { id: 51, sender: 'You', avatar: '😊', text: 'This team is unstoppable!', time: '6:31 PM', own: true, read: false, reactions: [ { emoji: '🎉', count: 4 } ] },
      { id: 52, sender: 'Alice Johnson', avatar: '👩', text: 'See you at 9 AM sharp. 😊', time: '6:36 PM', own: false, read: false },
      { id: 53, sender: 'Bob Smith', avatar: '👨', text: 'End of quarter push.', time: '6:45 PM', own: false, read: false },
      { id: 54, sender: 'You', avatar: '😊', text: 'Space exploration.', time: '6:50 PM', own: true, read: false },
      { id: 55, sender: 'Alice Johnson', avatar: '👩', text: 'Gratitude moment.', time: '7:04 PM', own: false, read: false, reactions: [ { emoji: '🎉', count: 1 }, { emoji: '🎉', count: 1 } ] },
      { id: 56, sender: 'Bob Smith', avatar: '👨', text: 'Catch up after lunch?', time: '7:08 PM', own: false, read: false, reactions: [ { emoji: '😂', count: 4 }, { emoji: '🎉', count: 1 } ] },
      { id: 57, sender: 'You', avatar: '😊', text: 'Client loved the designs! 🎉 🍾', time: '7:21 PM', own: true, read: false },
      { id: 58, sender: 'Alice Johnson', avatar: '👩', text: 'Catch up after lunch?', time: '7:25 PM', own: false, read: false },
      { id: 59, sender: 'Bob Smith', avatar: '👨', text: 'Code review pending.', time: '7:26 PM', own: false, read: false, reactions: [ { emoji: '❤️', count: 1 }, { emoji: '👍', count: 4 } ] },
      { id: 60, sender: 'You', avatar: '😊', text: 'Weather update.', time: '7:35 PM', own: true, read: false },
      { id: 61, sender: 'Alice Johnson', avatar: '👩', text: 'Code review pending. 🎭', time: '7:48 PM', own: false, read: false },
      { id: 62, sender: 'Bob Smith', avatar: '👨', text: 'Sports scores.', time: '8:01 PM', own: false, read: false, reactions: [ { emoji: '🎉', count: 2 }, { emoji: '❤️', count: 3 } ] },
      { id: 63, sender: 'You', avatar: '😊', text: 'User testing feedback.', time: '8:15 PM', own: true, read: false },
      { id: 64, sender: 'Alice Johnson', avatar: '👩', text: 'Travel dreams.', time: '8:29 PM', own: false, read: false, reactions: [ { emoji: '👏', count: 2 } ] },
      { id: 65, sender: 'Bob Smith', avatar: '👨', text: 'End of quarter push.', time: '8:40 PM', own: false, read: false, reactions: [ { emoji: '👏', count: 1 }, { emoji: '👍', count: 4 } ] },
      { id: 66, sender: 'You', avatar: '😊', text: 'Morning team! How\'s everyone?', time: '8:48 PM', own: true, read: false },
      { id: 67, sender: 'Alice Johnson', avatar: '👩', text: 'Coffee break chat.', time: '9:02 PM', own: false, read: false },
      { id: 68, sender: 'Bob Smith', avatar: '👨', text: 'This team is unstoppable!', time: '9:13 PM', own: false, read: false },
      { id: 69, sender: 'You', avatar: '😊', text: 'Gratitude moment.', time: '9:21 PM', own: true, read: false },
      { id: 70, sender: 'Alice Johnson', avatar: '👩', text: 'I updated the slide deck.', time: '9:27 PM', own: false, read: false, reactions: [ { emoji: '👏', count: 2 }, { emoji: '👏', count: 3 } ] },
      { id: 71, sender: 'Bob Smith', avatar: '👨', text: 'Weekly standup tomorrow?', time: '9:34 PM', own: false, read: false },
      { id: 72, sender: 'You', avatar: '😊', text: 'AI advancements. 🤔', time: '9:40 PM', own: true, read: false, reactions: [ { emoji: '😂', count: 4 } ] },
      { id: 73, sender: 'Alice Johnson', avatar: '👩', text: 'Sports scores. ✨', time: '9:51 PM', own: false, read: false },
      { id: 74, sender: 'Bob Smith', avatar: '👨', text: 'Catch up after lunch?', time: '10:01 PM', own: false, read: false, reactions: [ { emoji: '🎉', count: 4 } ] },
      { id: 75, sender: 'You', avatar: '😊', text: 'Break a leg tomorrow! 🎭', time: '10:05 PM', own: true, read: false, reactions: [ { emoji: '🎉', count: 1 }, { emoji: '🎉', count: 3 } ] },
      { id: 76, sender: 'Alice Johnson', avatar: '👩', text: 'Performance review soon.', time: '10:14 PM', own: false, read: false },
      { id: 77, sender: 'Bob Smith', avatar: '👨', text: 'Space exploration.', time: '10:20 PM', own: false, read: false, reactions: [ { emoji: '🔥', count: 4 } ] },
      { id: 78, sender: 'You', avatar: '😊', text: 'This team is unstoppable!', time: '10:24 PM', own: true, read: false },
      { id: 79, sender: 'Alice Johnson', avatar: '👩', text: 'Office party ideas.', time: '10:34 PM', own: false, read: false },
      { id: 80, sender: 'Bob Smith', avatar: '👨', text: 'This team is unstoppable! 👏', time: '10:40 PM', own: false, read: false, reactions: [ { emoji: '👍', count: 2 }, { emoji: '🎉', count: 4 } ] },
      { id: 81, sender: 'You', avatar: '😊', text: 'Slides are shared in the drive.', time: '10:52 PM', own: true, read: false },
      { id: 82, sender: 'Alice Johnson', avatar: '👩', text: 'On to the next sprint.', time: '10:54 PM', own: false, read: false },
      { id: 83, sender: 'Bob Smith', avatar: '👨', text: 'New task assigned.', time: '11:06 PM', own: false, read: false },
      { id: 84, sender: 'You', avatar: '😊', text: 'Gratitude moment.', time: '11:14 PM', own: true, read: false },
      { id: 85, sender: 'Alice Johnson', avatar: '👩', text: 'Don\'t forget the coffee ☕ 📈', time: '11:26 PM', own: false, read: false },
      { id: 86, sender: 'Bob Smith', avatar: '👨', text: 'Client feedback incoming soon.', time: '11:34 PM', own: false, read: false },
      { id: 87, sender: 'You', avatar: '😊', text: 'Sustainable practices.', time: '11:41 PM', own: true, read: false },
      { id: 88, sender: 'Alice Johnson', avatar: '👩', text: 'Time to celebrate? 🍾 👍', time: '11:43 PM', own: false, read: false },
      { id: 89, sender: 'Bob Smith', avatar: '👨', text: 'New hire starting. 😬', time: '11:54 PM', own: false, read: false, reactions: [ { emoji: '👏', count: 1 } ] },
      { id: 90, sender: 'You', avatar: '😊', text: 'Training session next week. 🍾', time: '12:00 AM', own: true, read: false, reactions: [ { emoji: '👏', count: 2 } ] },
      { id: 91, sender: 'Alice Johnson', avatar: '👩', text: 'Quick question about the charts. ☕', time: '12:05 AM', own: false, read: false, reactions: [ { emoji: '😂', count: 3 } ] },
      { id: 92, sender: 'Bob Smith', avatar: '👨', text: 'Travel dreams.', time: '12:07 AM', own: false, read: false },
      { id: 93, sender: 'You', avatar: '😊', text: 'Updated the project board.', time: '12:12 AM', own: true, read: false },
      { id: 94, sender: 'Alice Johnson', avatar: '👩', text: 'Updated the project board.', time: '12:17 AM', own: false, read: false, reactions: [ { emoji: '👍', count: 4 } ] },
      { id: 95, sender: 'Bob Smith', avatar: '👨', text: 'Code review pending.', time: '12:22 AM', own: false, read: false },
      { id: 96, sender: 'You', avatar: '😊', text: 'Sports scores.', time: '12:31 AM', own: true, read: false },
      { id: 97, sender: 'Alice Johnson', avatar: '👩', text: 'New hire starting.', time: '12:33 AM', own: false, read: false },
      { id: 98, sender: 'Bob Smith', avatar: '👨', text: 'Quick question about the charts.', time: '12:40 AM', own: false, read: false },
      { id: 99, sender: 'You', avatar: '😊', text: 'Hope the presentation goes smoothly. ✨', time: '12:54 AM', own: true, read: false },
      { id: 100, sender: 'Alice Johnson', avatar: '👩', text: 'On to the next sprint.', time: '1:02 AM', own: false, read: false },
    ]
  },
  {
    chatId: 1,
    messages: [
      { id: 1, sender: 'Alice Johnson', avatar: '👩', text: 'Hey! How are you doing?', time: '1:30 PM', own: false, read: true },
      { id: 2, sender: 'You', avatar: '😊', text: 'I\'m good! How about you?', time: '1:35 PM', own: true, read: true },
      { id: 3, sender: 'Alice Johnson', avatar: '👩', text: 'Great! Working on some designs', time: '1:40 PM', own: false, read: true },
      { id: 4, sender: 'You', avatar: '😊', text: 'Can\'t wait to see them!', time: '1:45 PM', own: true, read: true },
      { id: 5, sender: 'Alice Johnson', avatar: '👩', text: 'I\'ll share them soon 😊', time: '1:50 PM', own: false, read: true },
    ]
  },
  {
    chatId: 2,
    messages: [
      { id: 1, sender: 'Tech News', avatar: '📱', text: 'Welcome to Tech News channel!', time: '10:00 AM', own: false, read: true },
      { id: 2, sender: 'Tech News', avatar: '📱', text: 'Breaking: New AI model released', time: '11:00 AM', own: false, read: true },
      { id: 3, sender: 'Tech News', avatar: '📱', text: 'JavaScript framework updates', time: '12:00 PM', own: false, read: true },
      { id: 4, sender: 'Tech News', avatar: '📱', text: 'Cloud computing trends 2025', time: '12:20 PM', own: false, read: true },
    ]
  },
  {
    chatId: 3,
    messages: [
      { id: 1, sender: 'Bob Smith', avatar: '👨', text: 'Hi! Need help with the project?', time: 'Yesterday', own: false, read: true },
      { id: 2, sender: 'You', avatar: '😊', text: 'Yes please! Having some issues', time: 'Yesterday', own: true, read: true },
      { id: 3, sender: 'Bob Smith', avatar: '👨', text: 'Let me take a look', time: 'Yesterday', own: false, read: true },
      { id: 4, sender: 'You', avatar: '😊', text: 'Thanks for your help', time: 'Yesterday', own: true, read: true },
    ]
  },
  {
    chatId: 4,
    messages: [
      { id: 1, sender: 'Design Team', avatar: '🎨', text: 'Team meeting at 3 PM', time: 'Yesterday', own: false, read: true },
      { id: 2, sender: 'Carol White', avatar: '👱‍♀️', text: 'I\'ll be there!', time: 'Yesterday', own: false, read: true },
      { id: 3, sender: 'You', avatar: '😊', text: 'Count me in', time: 'Yesterday', own: true, read: true },
      { id: 4, sender: 'Design Team', avatar: '🎨', text: 'New mockups ready', time: 'Yesterday', own: false, read: true },
    ]
  }
]);

// Get current chat's messages
const allMessages = computed(() => {
  const chatMessages = allChatsMessages.value.find(chat => chat.chatId === selectedChatId.value)
  return chatMessages?.messages || []
})

// Message pagination
const MESSAGES_PER_LOAD = 15
const loadedCount = ref(MESSAGES_PER_LOAD)

const displayedMessages = computed(() => {
  const start = Math.max(0, allMessages.value.length - loadedCount.value)
  return allMessages.value.slice(start)
})

const groupMembers = ref([
  { name: 'Alice Johnson', avatar: '👩', role: 'admin', status: 'online' },
  { name: 'Bob Smith', avatar: '👨', role: 'admin', status: 'online' },
  { name: 'Carol White', avatar: '👱‍♀️', role: 'member', status: 'offline' },
  { name: 'David Brown', avatar: '🧔', role: 'member', status: 'online' },
  { name: 'Emma Davis', avatar: '👧', role: 'member', status: 'offline' }
])

const selectedChatId = ref<number | null>(null)
const sidebarOpen = ref(false)
const infoPanelOpen = ref(false)
const messageListRef = ref<any>(null)
const selectedUserId = ref<number | null>(null)

const currentChat = computed(() => {
  if (selectedChatId.value === null) return null
  return chats.value.find((c) => c.id === selectedChatId.value)
})

// Auto-select first channel when channels are loaded
watch(() => chats.value, (newChats) => {
  if (newChats.length > 0 && selectedChatId.value === null) {
    selectedChatId.value = newChats[0].id
  }
}, { immediate: true })

const loadMoreMessages = (done: (stop?: boolean) => void) => {
  // Simulate API delay
  setTimeout(() => {
    loadedCount.value += MESSAGES_PER_LOAD
    if (loadedCount.value >= allMessages.value.length) {
      done(true)
    } else {
      done()
    }
  }, 400)
}

const handleSelectChat = (chatId: number) => {
  if (chatId == selectedChatId.value) return;
  selectedChatId.value = chatId
  loadedCount.value = MESSAGES_PER_LOAD
  messageListRef.value?.newChat()
}

const handleSendMessage = (message: string) => {
  console.log('Send message:', message)
  // todo: Will be implemented with real logic later
  const chatMessagesIndex = allChatsMessages.value.findIndex(chat => chat.chatId === selectedChatId.value)
  if(chatMessagesIndex == -1) return;
  allChatsMessages.value[chatMessagesIndex]!.messages.push({ id: (allMessages.value.at(-1)?.id ?? 0) + 1, sender: 'You', avatar: '😊', text: message, time: '3:55 PM', own: true, read: false })
  messageListRef.value?.scrollToBottom();
  loadedCount.value++
  messageListRef.value?.scrollToBottom()
}

const handleUserClick = (userId: number) => {
  selectedUserId.value = userId
  // Close panels
  infoPanelOpen.value = false
  sidebarOpen.value = false
}

const handleCloseProfile = () => {
  selectedUserId.value = null
}

const handleAttach = () => {
  console.log('Attach file')
  // Will be implemented with real logic later
}

const handleEmoji = () => {
  console.log('Open emoji picker')
  // Will be implemented with real logic later
}

const handleCreateChannel = async (data: { type: 'private' | 'public'; name: string; description: string }) => {
  const result = await channelStore.createChannel(data)
  if (result.success && result.channel) {
    // Select the newly created channel
    selectedChatId.value = result.channel.id
  }
}

onMounted(() => {
  void channelStore.fetchChannels()
})
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

