<template>
  <div class="settings-container">
    <div class="settings-section">
      <h3 class="settings-section__title">Notification Preferences</h3>
      <p class="settings-section__subtitle">Manage how you receive notifications</p>
      
      <div class="settings-list">
        <SettingsToggle
          v-model="privateChannels"
          title="Private Channels"
          description="Get notified for private channel activity"
        />
        
        <SettingsToggle
          v-model="publicChannels"
          title="Public Channels"
          description="Get notified for public channel activity"
        />
        
        <SettingsToggle
          v-model="mentions"
          title="Mentions"
          description="Notify me when someone mentions me"
        />

        <SettingsToggle
          v-model="invites"
          title="Invitations"
          description="Notifications for invitations you receive"
        />

        <SettingsToggle
          v-model="inviteResponses"
          title="Invitation Responses"
          description="When someone accepts or declines your invitation"
        />

        <SettingsToggle
          v-model="channelEvents"
          title="Channel Events"
          description="Channel deleted / removed from channel notifications"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SettingsToggle from '../ui/SettingsToggle.vue'
import { useNotificationStore } from '@/stores/notification-store'

const notificationStore = useNotificationStore()

const privateChannels = computed({
  get: () => notificationStore.preferences.privateChannels,
  set: (val: boolean) => notificationStore.setPreference('privateChannels', val),
})

const publicChannels = computed({
  get: () => notificationStore.preferences.publicChannels,
  set: (val: boolean) => notificationStore.setPreference('publicChannels', val),
})

const mentions = computed({
  get: () => notificationStore.preferences.mentions,
  set: (val: boolean) => notificationStore.setPreference('mentions', val),
})

const invites = computed({
  get: () => notificationStore.preferences.invites,
  set: (val: boolean) => notificationStore.setPreference('invites', val),
})

const inviteResponses = computed({
  get: () => notificationStore.preferences.inviteResponses,
  set: (val: boolean) => notificationStore.setPreference('inviteResponses', val),
})

const channelEvents = computed({
  get: () => notificationStore.preferences.channelEvents,
  set: (val: boolean) => notificationStore.setPreference('channelEvents', val),
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
