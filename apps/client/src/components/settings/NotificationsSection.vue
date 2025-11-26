<template>
  <div class="settings-container">
    <div class="settings-section">
      <h3 class="settings-section__title">Notification Preferences</h3>
      <p class="settings-section__subtitle">Manage how you receive notifications</p>
      
      <div class="settings-list">
       
        <SettingsToggle
          v-model="notifications.groups"
          title="Private Channels"
          description="Get notified for private channels activity"
        />
        
        <SettingsToggle
          v-model="notifications.channels"
          title="Private Channels"
          description="Get notified for public channels activity"
        />
        
        <SettingsToggle
          v-model="notifications.mentions"
          title="Mentions"
          description="When someone mentions you"
        />
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettingsToggle from './SettingsToggle.vue'

const notifications = ref({
  groups: true,
  channels: false,
  mentions: true,
})
</script>

<style scoped>
.settings-container {
  max-width: 48rem;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.settings-section__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.settings-list {
  background: white;
  border-radius: 0.5rem;
  padding: 0 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>