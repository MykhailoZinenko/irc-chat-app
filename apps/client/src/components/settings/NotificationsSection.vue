<template>
  <div class="settings-container">
    <div class="settings-section">
      <h3 class="settings-section__title">Availability</h3>
      <p class="settings-section__subtitle">Choose how you want to be reached</p>

      <div class="status-grid">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="status-card"
          :class="{ 'status-card--active': presenceStore.status === option.value }"
          @click="presenceStore.setStatus(option.value)"
        >
          <div class="status-card__icon" :data-tone="option.value">
            <q-icon :name="option.icon" size="20px" />
          </div>
          <div class="status-card__body">
            <div class="status-card__title">
              {{ option.label }}
              <span v-if="presenceStore.status === option.value" class="status-chip">Active</span>
            </div>
            <p class="status-card__description">{{ option.description }}</p>
          </div>
        </button>
      </div>

      <div
        v-if="presenceStore.isDnd || presenceStore.isOffline"
        class="status-hint"
        :class="presenceStore.isOffline ? 'status-hint--offline' : 'status-hint--muted'"
      >
        <q-icon :name="presenceStore.isOffline ? 'cloud_off' : 'do_not_disturb_on'" size="18px" />
        <span>
          {{ presenceStore.isOffline
            ? 'Offline mode disconnects realtime updates until you come back.'
            : 'Do Not Disturb mutes all notifications while keeping you connected.' }}
        </span>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="settings-section__title">Notification Preferences</h3>
      <p class="settings-section__subtitle">Manage how you receive notifications</p>
      <p v-if="notificationsLocked" class="muted-note">
        Notification options are disabled while Do Not Disturb is on.
      </p>
      
      <div
        class="settings-list"
        :class="{ 'is-disabled': notificationsLocked }"
      >
        <SettingsToggle
          v-model="privateChannels"
          title="Private Channels"
          description="Get notified for private channel activity"
          :disable="notificationsLocked"
        />
        
        <SettingsToggle
          v-model="publicChannels"
          title="Public Channels"
          description="Get notified for public channel activity"
          :disable="notificationsLocked"
        />
        
        <SettingsToggle
          v-model="mentions"
          title="Mentions"
          description="Notify me when someone mentions me"
          :disable="notificationsLocked"
        />

        <SettingsToggle
          v-model="invites"
          title="Invitations"
          description="Notifications for invitations you receive"
          :disable="notificationsLocked"
        />

        <SettingsToggle
          v-model="inviteResponses"
          title="Invitation Responses"
          description="When someone accepts or declines your invitation"
          :disable="notificationsLocked"
        />

        <SettingsToggle
          v-model="channelEvents"
          title="Channel Events"
          description="Channel deleted / removed from channel notifications"
          :disable="notificationsLocked"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SettingsToggle from '../ui/SettingsToggle.vue'
import { useNotificationStore } from '@/stores/notification-store'
import { usePresenceStore, type PresenceStatus } from '@/stores/presence-store'

const notificationStore = useNotificationStore()
const presenceStore = usePresenceStore()

const statusOptions: Array<{
  value: PresenceStatus
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'online',
    label: 'Online',
    description: 'Normal mode with notifications based on your preferences.',
    icon: 'task_alt',
  },
  {
    value: 'dnd',
    label: 'Do Not Disturb',
    description: 'Stay connected but silence all notifications.',
    icon: 'do_not_disturb_on',
  },
  {
    value: 'offline',
    label: 'Offline',
    description: 'Disconnect sockets and pause realtime updates until you return.',
    icon: 'cloud_off',
  },
]

const notificationsLocked = computed(() => presenceStore.isDnd)

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
  color: var(--app-text-strong);
  margin: 0 0 0.25rem 0;
}

.settings-section__subtitle {
  font-size: 0.875rem;
  color: var(--app-text-muted);
  margin: 0 0 1.5rem 0;
}

.settings-list {
  background: var(--app-surface);
  border-radius: 0.5rem;
  padding: 0 1rem;
  box-shadow: var(--app-shadow-soft);
}

.settings-list.is-disabled {
  opacity: 0.55;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0 0.5rem;
}

.status-card {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  border-radius: 0.75rem;
  padding: 0.85rem 0.9rem;
  display: flex;
  gap: 0.75rem;
  text-align: left;
  transition: all 0.18s ease;
}

.status-card:hover {
  border-color: var(--app-primary);
  box-shadow: var(--app-shadow-soft);
}

.status-card--active {
  border-color: var(--app-primary);
  box-shadow: 0 10px 30px rgba(25, 118, 210, 0.08);
}

.status-card__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: var(--app-neutral-weak);
  color: var(--app-text-strong);
}

.status-card__icon[data-tone='online'] {
  background: #e6f4ff;
  color: #0b72e7;
}

.status-card__icon[data-tone='dnd'] {
  background: #fff2e7;
  color: #d86b05;
}

.status-card__icon[data-tone='offline'] {
  background: #f1f5f9;
  color: #6b7280;
}

.status-card__body {
  flex: 1;
}

.status-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--app-text-strong);
  margin-bottom: 0.15rem;
}

.status-card__description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
  line-height: 1.3;
}

.status-chip {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: #e6f4ff;
  color: #0b72e7;
}

.status-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background: #fff8e6;
  color: #8a5a00;
  font-size: 0.9rem;
}

.status-hint--offline {
  background: #f1f5f9;
  color: #111827;
}

.muted-note {
  margin: 0.25rem 0 0.75rem;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}
</style>
