<template>
  <q-layout view="lHh Lpr lFf" class="telegram-layout">
    <!-- Mobile Components -->
    <template v-if="$q.screen.lt.md">
      <MobileHeader v-if="!isProfilePage" />
      <MobileDrawer />
    </template>

    <!-- Desktop Sidebar -->
    <AppSidebar v-if="$q.screen.gt.sm" />

    <!-- Main Content Area -->
    <q-page-container class="main-content">
      <!-- Mobile Chat List -->
      <ChatList v-if="$q.screen.lt.md && !isProfilePage && !isChatPage" />

      <!-- Router View for Desktop and Profile Pages -->
      <router-view v-else />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from 'src/components/AppSidebar.vue'
import MobileHeader from 'src/components/MobileHeader.vue'
import MobileDrawer from 'src/components/MobileDrawer.vue'
import ChatList from 'src/components/ChatList.vue'

const route = useRoute()

const isProfilePage = computed(() => route.path.startsWith('/profile'))
const isChatPage = computed(() => route.path.startsWith('/chat/'))
</script>

<style scoped>
.telegram-layout {
  background: #f1f3f4;
}

.main-content {
  background: white;
}

@media (max-width: 767px) {
  .main-content {
    padding-top: 64px;
  }
}
</style>
