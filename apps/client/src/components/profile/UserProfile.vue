<template>
  <div class="flex-1 flex flex-col bg-white h-full">
    <!-- Header -->
    <ProfileHeader 
      title="Alice Johnson"
      subtitle="Profile"
      @back="$emit('back')"
      @more="handleMore"
    />

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Profile Header -->
      <div class="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl mb-4 shadow-lg">
          👩
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-1">Alice Johnson</h2>
        <p class="text-blue-500 text-sm mb-1">@alice_j</p>
        <p class="text-sm text-gray-500">last seen recently</p>
      </div>

      <!-- Action Buttons -->
      <ProfileSection>
        <div class="grid grid-cols-4 gap-3">
          <ProfileActionButton
            icon="chat"
            label="Message"
            bg-color="bg-blue-500"
            icon-color="text-white"
            @click="handleMessage"
          />
          
          <ProfileActionButton
            icon="phone"
            label="Call"
            bg-color="bg-green-500"
            icon-color="text-white"
            @click="handleCall"
          />
          
          <ProfileActionButton
            icon="videocam"
            label="Video"
            bg-color="bg-purple-500"
            icon-color="text-white"
            @click="handleVideo"
          />
          
          <ProfileActionButton
            :icon="isContact ? 'person' : 'person_add'"
            :label="isContact ? 'Contact' : 'Add'"
            :bg-color="isContact ? 'bg-gray-300' : 'bg-blue-100'"
            :icon-color="isContact ? 'text-gray-600' : 'text-blue-600'"
            @click="isContact = !isContact"
          />
        </div>
      </ProfileSection>

      <!-- Bio Section -->
      <ProfileSection title="Bio">
        <p class="text-gray-800">Product Designer | Coffee lover ☕</p>
      </ProfileSection>

      <!-- Info Section -->
      <ProfileSection title="Info">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <q-icon name="phone" size="18px" class="text-gray-400" />
            <div>
              <p class="text-sm text-gray-800">+1 234 567 8900</p>
              <p class="text-xs text-gray-500">Mobile</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <q-icon name="chat" size="18px" class="text-gray-400" />
            <div>
              <p class="text-sm text-gray-800">@alice_j</p>
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

      <!-- Shared Media -->
      <ProfileSection title="Shared Media" :count="47" :title-bold="true">
        <div class="grid grid-cols-3 gap-2">
          <MediaGridItem 
            v-for="i in 6" 
            :key="i"
            @click="handleMediaClick(i)"
          />
        </div>
        <button class="w-full mt-3 text-center text-sm text-blue-500 hover:text-blue-600 font-medium">
          View All Media
        </button>
      </ProfileSection>

      <!-- Shared Files -->
      <ProfileSection title="Shared Files" :count="12" :title-bold="true">
        <div class="space-y-2">
          <FileListItem
            v-for="(file, idx) in files"
            :key="idx"
            icon="description"
            :title="file.name"
            :subtitle="`${file.size} • ${file.date}`"
            icon-bg="bg-blue-100"
            icon-color="text-blue-500"
            @click="handleFileClick(file)"
          />
        </div>
        <button class="w-full mt-3 text-center text-sm text-blue-500 hover:text-blue-600 font-medium">
          View All Files
        </button>
      </ProfileSection>

      <!-- Shared Links -->
      <ProfileSection title="Shared Links" :count="8" :title-bold="true">
        <div class="space-y-2">
          <FileListItem
            v-for="(link, idx) in links"
            :key="idx"
            icon="link"
            :title="link.title"
            :subtitle="link.url"
            icon-bg="bg-purple-100"
            icon-color="text-purple-500"
            @click="handleLinkClick(link)"
          />
        </div>
        <button class="w-full mt-3 text-center text-sm text-blue-500 hover:text-blue-600 font-medium">
          View All Links
        </button>
      </ProfileSection>

      <!-- Groups in Common -->
      <ProfileSection title="Groups in Common" :count="sharedGroups.length" :title-bold="true">
        <div class="space-y-2">
          <button 
            v-for="group in sharedGroups"
            :key="group.id"
            @click="handleGroupClick(group)"
            class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
              {{ group.avatar }}
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ group.name }}</p>
              <p class="text-xs text-gray-500">{{ group.members }} members</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import ProfileActionButton from '@/components/profile/ProfileActionButton.vue';
import ProfileSection from '@/components/profile/ProfileSection.vue';
import MediaGridItem from '@/components/profile/MediaGridItem.vue';
import FileListItem from '@/components/profile/FileListItem.vue';


defineEmits<{
  back: []
}>()

const isMuted = ref(false);
const isContact = ref(false);

const files = [
  { name: 'Design_specs.pdf', size: '2.4 MB', date: 'Yesterday' },
  { name: 'Meeting_notes.docx', size: '156 KB', date: '2 days ago' },
  { name: 'Budget_Q4.xlsx', size: '892 KB', date: 'Last week' },
];

const links = [
  { title: 'Design inspiration board', url: 'figma.com/file/abc123' },
  { title: 'Project documentation', url: 'notion.so/project-docs' },
];

const sharedGroups = [
  { id: 1, name: 'Project Team', avatar: '👥', members: 15 },
  { id: 2, name: 'Design Team', avatar: '🎨', members: 8 },
  { id: 3, name: 'Tech News', avatar: '📱', members: 1247 },
];

const handleMore = () => {
  console.log('More options clicked');
};

const handleMessage = () => {
  console.log('Message clicked');
};

const handleCall = () => {
  console.log('Call clicked');
};

const handleVideo = () => {
  console.log('Video clicked');
};

const handleMediaClick = (index: number) => {
  console.log('Media clicked:', index);
};

const handleFileClick = (file: typeof files[0]) => {
  console.log('File clicked:', file);
};

const handleLinkClick = (link: typeof links[0]) => {
  console.log('Link clicked:', link);
};

const handleGroupClick = (group: typeof sharedGroups[0]) => {
  console.log('Group clicked:', group);
};

const handleBlock = () => {
  console.log('Block user');
};

const handleReport = () => {
  console.log('Report user');
};
</script>

<style scoped>
.bg-gradient-to-b {
  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));
}

.from-gray-50 {
  --tw-gradient-from: #f9fafb;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0));
}

.to-white {
  --tw-gradient-to: #ffffff;
}

.from-blue-400 {
  --tw-gradient-from: #60a5fa;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(96, 165, 250, 0));
}

.to-purple-500 {
  --tw-gradient-to: #a855f7;
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
</style>